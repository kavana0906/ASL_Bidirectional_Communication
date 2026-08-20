import os
import random
import numpy as np
import pandas as pd
import torch
import torch.nn as nn

from torch.utils.data import Dataset, DataLoader
from torch.nn.utils.rnn import (
    pad_sequence,
    pack_padded_sequence,
    pad_packed_sequence
)


# ============================================================
# REPRODUCIBILITY
# ============================================================

SEED = 42

random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = r"C:\ASL_Project\asl_training"

TRAIN_CSV = os.path.join(
    BASE_DIR,
    "train_normalized.csv"
)

VAL_CSV = os.path.join(
    BASE_DIR,
    "val_normalized.csv"
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "asl_bilstm_attention_model.pth"
)

LABEL_PATH = os.path.join(
    BASE_DIR,
    "labels_attention.txt"
)


# ============================================================
# SETTINGS
# ============================================================

BATCH_SIZE = 16

EPOCHS = 60

LEARNING_RATE = 0.001

WEIGHT_DECAY = 1e-4

INPUT_SIZE = 126

HIDDEN_SIZE = 128

NUM_LAYERS = 2

DROPOUT = 0.35

PATIENCE = 10

DEVICE = torch.device("cpu")

print("Device:", DEVICE)


# ============================================================
# DATASET
# ============================================================

class ASLDataset(Dataset):

    def __init__(
        self,
        csv_file,
        label_to_id
    ):

        self.df = pd.read_csv(
            csv_file
        )

        self.label_to_id = label_to_id


    def __len__(self):

        return len(self.df)


    def __getitem__(self, index):

        row = self.df.iloc[index]

        feature_path = row["feature"]

        label = row["label"]


        features = np.load(
            feature_path
        ).astype(np.float32)


        # Clean numerical problems
        features = np.nan_to_num(
            features,
            nan=0.0,
            posinf=0.0,
            neginf=0.0
        )


        # Safety check
        if features.ndim != 2:

            raise ValueError(
                f"Invalid feature shape: "
                f"{features.shape} "
                f"in {feature_path}"
            )


        label_id = self.label_to_id[
            label
        ]


        return (
            torch.tensor(
                features,
                dtype=torch.float32
            ),
            label_id
        )


# ============================================================
# LOAD LABELS
# ============================================================

train_df = pd.read_csv(
    TRAIN_CSV
)

val_df = pd.read_csv(
    VAL_CSV
)


labels = sorted(
    train_df["label"].unique()
)


label_to_id = {
    label: i
    for i, label in enumerate(labels)
}


id_to_label = {
    i: label
    for label, i in label_to_id.items()
}


NUM_CLASSES = len(labels)


print(
    "Number of classes:",
    NUM_CLASSES
)


print("\nClasses:")

for i, label in id_to_label.items():

    print(
        i,
        "->",
        label
    )


# ============================================================
# SAVE LABELS
# ============================================================

with open(
    LABEL_PATH,
    "w",
    encoding="utf-8"
) as f:

    for label in labels:

        f.write(
            label + "\n"
        )


# ============================================================
# DATASETS
# ============================================================

train_dataset = ASLDataset(
    TRAIN_CSV,
    label_to_id
)

val_dataset = ASLDataset(
    VAL_CSV,
    label_to_id
)


# ============================================================
# COLLATE FUNCTION
# ============================================================

def collate_fn(batch):

    sequences = [
        item[0]
        for item in batch
    ]

    labels_batch = [
        item[1]
        for item in batch
    ]


    lengths = torch.tensor(
        [
            len(seq)
            for seq in sequences
        ],
        dtype=torch.long
    )


    padded = pad_sequence(
        sequences,
        batch_first=True
    )


    labels_batch = torch.tensor(
        labels_batch,
        dtype=torch.long
    )


    return (
        padded,
        lengths,
        labels_batch
    )


# ============================================================
# DATALOADERS
# ============================================================

train_loader = DataLoader(
    train_dataset,
    batch_size=BATCH_SIZE,
    shuffle=True,
    collate_fn=collate_fn
)

val_loader = DataLoader(
    val_dataset,
    batch_size=BATCH_SIZE,
    shuffle=False,
    collate_fn=collate_fn
)


# ============================================================
# ATTENTION
# ============================================================

class Attention(nn.Module):

    def __init__(
        self,
        hidden_size
    ):

        super().__init__()


        self.attention = nn.Sequential(

            nn.Linear(
                hidden_size,
                128
            ),

            nn.Tanh(),

            nn.Linear(
                128,
                1
            )
        )


    def forward(
        self,
        outputs,
        mask
    ):

        # outputs:
        # [batch, sequence, hidden]

        scores = self.attention(
            outputs
        ).squeeze(-1)


        # Ignore padded frames
        scores = scores.masked_fill(
            ~mask,
            -1e9
        )


        weights = torch.softmax(
            scores,
            dim=1
        )


        context = torch.sum(
            outputs *
            weights.unsqueeze(-1),
            dim=1
        )


        return context


# ============================================================
# MODEL
# ============================================================

class BiLSTMAttention(nn.Module):

    def __init__(
        self,
        input_size,
        hidden_size,
        num_layers,
        num_classes,
        dropout
    ):

        super().__init__()


        self.lstm = nn.LSTM(

            input_size=input_size,

            hidden_size=hidden_size,

            num_layers=num_layers,

            batch_first=True,

            bidirectional=True,

            dropout=(
                dropout
                if num_layers > 1
                else 0
            )
        )


        # Bidirectional = hidden_size * 2
        self.output_size = (
            hidden_size * 2
        )


        self.attention = Attention(
            self.output_size
        )


        self.classifier = nn.Sequential(

            nn.Linear(
                self.output_size,
                128
            ),

            nn.ReLU(),

            nn.Dropout(
                dropout
            ),

            nn.Linear(
                128,
                num_classes
            )
        )


    def forward(
        self,
        x,
        lengths
    ):

        # ----------------------------------------------------
        # PACK SEQUENCE
        # ----------------------------------------------------

        packed = pack_padded_sequence(

            x,

            lengths.cpu(),

            batch_first=True,

            enforce_sorted=False
        )


        # ----------------------------------------------------
        # BiLSTM
        # ----------------------------------------------------

        packed_output, _ = self.lstm(
            packed
        )


        # ----------------------------------------------------
        # UNPACK
        # ----------------------------------------------------

        output, _ = pad_packed_sequence(

            packed_output,

            batch_first=True
        )


        # ----------------------------------------------------
        # CREATE MASK
        # ----------------------------------------------------

        batch_size = output.size(0)

        seq_len = output.size(1)


        device = output.device


        positions = torch.arange(
            seq_len,
            device=device
        ).unsqueeze(0)


        mask = (
            positions <
            lengths.to(device).unsqueeze(1)
        )


        # ----------------------------------------------------
        # ATTENTION
        # ----------------------------------------------------

        context = self.attention(
            output,
            mask
        )


        # ----------------------------------------------------
        # CLASSIFICATION
        # ----------------------------------------------------

        logits = self.classifier(
            context
        )


        return logits


# ============================================================
# CREATE MODEL
# ============================================================

model = BiLSTMAttention(

    INPUT_SIZE,

    HIDDEN_SIZE,

    NUM_LAYERS,

    NUM_CLASSES,

    DROPOUT

).to(DEVICE)


print(
    "\nModel created successfully."
)


# ============================================================
# LOSS
# ============================================================

criterion = nn.CrossEntropyLoss()


# ============================================================
# OPTIMIZER
# ============================================================

optimizer = torch.optim.AdamW(

    model.parameters(),

    lr=LEARNING_RATE,

    weight_decay=WEIGHT_DECAY
)


# ============================================================
# LEARNING RATE SCHEDULER
# ============================================================

scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(

    optimizer,

    mode="max",

    factor=0.5,

    patience=4
)


# ============================================================
# TRAINING VARIABLES
# ============================================================

best_val_accuracy = 0.0

epochs_without_improvement = 0


print(
    "\n========== TRAINING STARTED =========="
)


# ============================================================
# TRAINING LOOP
# ============================================================

for epoch in range(EPOCHS):


    # ========================================================
    # TRAIN
    # ========================================================

    model.train()


    train_correct = 0

    train_total = 0

    train_loss_total = 0.0


    for features, lengths, targets in train_loader:


        features = features.to(
            DEVICE
        )

        targets = targets.to(
            DEVICE
        )


        optimizer.zero_grad()


        outputs = model(

            features,

            lengths

        )


        loss = criterion(

            outputs,

            targets

        )


        loss.backward()


        # Prevent exploding gradients
        torch.nn.utils.clip_grad_norm_(

            model.parameters(),

            max_norm=1.0

        )


        optimizer.step()


        train_loss_total += (
            loss.item()
        )


        predictions = torch.argmax(

            outputs,

            dim=1

        )


        train_correct += (

            predictions == targets

        ).sum().item()


        train_total += (
            targets.size(0)
        )


    train_accuracy = (

        train_correct /

        train_total

    ) * 100


    train_loss = (

        train_loss_total /

        len(train_loader)

    )


    # ========================================================
    # VALIDATION
    # ========================================================

    model.eval()


    val_correct = 0

    val_total = 0

    val_loss_total = 0.0


    with torch.no_grad():


        for features, lengths, targets in val_loader:


            features = features.to(
                DEVICE
            )

            targets = targets.to(
                DEVICE
            )


            outputs = model(

                features,

                lengths

            )


            loss = criterion(

                outputs,

                targets

            )


            val_loss_total += (
                loss.item()
            )


            predictions = torch.argmax(

                outputs,

                dim=1

            )


            val_correct += (

                predictions == targets

            ).sum().item()


            val_total += (
                targets.size(0)
            )


    val_accuracy = (

        val_correct /

        val_total

    ) * 100


    val_loss = (

        val_loss_total /

        len(val_loader)

    )


    # ========================================================
    # SCHEDULER
    # ========================================================

    scheduler.step(
        val_accuracy
    )


    current_lr = optimizer.param_groups[0]["lr"]


    # ========================================================
    # PRINT
    # ========================================================

    print(

        f"Epoch [{epoch + 1:02d}/{EPOCHS}] "

        f"Train Loss: {train_loss:.4f} "

        f"Train Acc: {train_accuracy:.2f}% "

        f"Val Loss: {val_loss:.4f} "

        f"Val Acc: {val_accuracy:.2f}% "

        f"LR: {current_lr:.6f}"

    )


    # ========================================================
    # SAVE BEST MODEL
    # ========================================================

    if val_accuracy > best_val_accuracy:

        best_val_accuracy = val_accuracy

        epochs_without_improvement = 0


        torch.save(

            {

                "model_state_dict":
                    model.state_dict(),

                "input_size":
                    INPUT_SIZE,

                "hidden_size":
                    HIDDEN_SIZE,

                "num_layers":
                    NUM_LAYERS,

                "num_classes":
                    NUM_CLASSES,

                "dropout":
                    DROPOUT,

                "labels":
                    labels

            },

            MODEL_PATH

        )


        print(

            f"  ✓ Best model saved "

            f"(Val Acc: "
            f"{val_accuracy:.2f}%)"

        )


    else:

        epochs_without_improvement += 1


    # ========================================================
    # EARLY STOPPING
    # ========================================================

    if (
        epochs_without_improvement
        >= PATIENCE
    ):

        print(
            "\nEarly stopping triggered."
        )

        break


# ============================================================
# COMPLETE
# ============================================================

print(
    "\n========== TRAINING COMPLETE =========="
)


print(

    f"Best validation accuracy: "

    f"{best_val_accuracy:.2f}%"

)


print(
    "\nModel saved to:"
)

print(
    MODEL_PATH
)


print(
    "\nLabels saved to:"
)

print(
    LABEL_PATH
)