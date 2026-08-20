import os
import numpy as np
import torch
import torch.nn as nn
from torch.nn.utils.rnn import pack_padded_sequence

# ============================================================
# PATHS
# ============================================================

BASE_DIR = r"C:\ASL_Project\asl_training"

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

INPUT_SIZE = 126
HIDDEN_SIZE = 128
NUM_LAYERS = 2

DEVICE = torch.device("cpu")

print("Device:", DEVICE)


# ============================================================
# LOAD LABELS
# ============================================================

with open(LABEL_PATH, "r", encoding="utf-8") as f:
    labels = [line.strip() for line in f if line.strip()]

NUM_CLASSES = len(labels)

print("Number of labels:", NUM_CLASSES)


# ============================================================
# ATTENTION
# ============================================================

class Attention(nn.Module):

    def __init__(self, hidden_size):

        super().__init__()

        self.attention = nn.Sequential(
            nn.Linear(hidden_size * 2, hidden_size),
            nn.Tanh(),
            nn.Linear(hidden_size, 1)
        )

    def forward(self, x, mask=None):

        scores = self.attention(x).squeeze(-1)

        if mask is not None:
            scores = scores.masked_fill(
                ~mask,
                -1e9
            )

        weights = torch.softmax(
            scores,
            dim=1
        )

        context = torch.sum(
            x * weights.unsqueeze(-1),
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
        num_classes
    ):

        super().__init__()

        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=True,
            dropout=0.3 if num_layers > 1 else 0
        )

        self.attention = Attention(
            hidden_size
        )

        self.classifier = nn.Sequential(
            nn.Linear(hidden_size * 2, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, num_classes)
        )

    def forward(self, x, lengths):

        packed = pack_padded_sequence(
            x,
            lengths.cpu(),
            batch_first=True,
            enforce_sorted=False
        )

        packed_output, _ = self.lstm(packed)

        output, _ = torch.nn.utils.rnn.pad_packed_sequence(
            packed_output,
            batch_first=True
        )

        max_len = output.size(1)

        mask = (
            torch.arange(max_len)
            .unsqueeze(0)
            < lengths.unsqueeze(1)
        )

        context = self.attention(
            output,
            mask
        )

        logits = self.classifier(
            context
        )

        return logits


# ============================================================
# LOAD MODEL
# ============================================================

model = BiLSTMAttention(
    INPUT_SIZE,
    HIDDEN_SIZE,
    NUM_LAYERS,
    NUM_CLASSES
).to(DEVICE)

checkpoint = torch.load(
    MODEL_PATH,
    map_location=DEVICE
)

# Support both checkpoint formats
if "model_state_dict" in checkpoint:
    state_dict = checkpoint["model_state_dict"]
else:
    state_dict = checkpoint

model.load_state_dict(state_dict)

model.eval()

print("Model loaded successfully.")


# ============================================================
# PREDICTION FUNCTION
# ============================================================

def predict(feature_path):

    features = np.load(
        feature_path
    ).astype(np.float32)

    features = np.nan_to_num(
        features
    )

    print("\nFeature shape:", features.shape)

    if features.ndim != 2:
        raise ValueError(
            "Feature must have shape (frames, 126)"
        )

    if features.shape[1] != INPUT_SIZE:
        raise ValueError(
            f"Expected 126 features, "
            f"got {features.shape[1]}"
        )

    x = torch.tensor(
        features,
        dtype=torch.float32
    ).unsqueeze(0)

    lengths = torch.tensor(
        [features.shape[0]],
        dtype=torch.long
    )

    with torch.no_grad():

        outputs = model(
            x.to(DEVICE),
            lengths
        )

        probabilities = torch.softmax(
            outputs,
            dim=1
        )[0]

    top_k = min(5, NUM_CLASSES)

    values, indices = torch.topk(
        probabilities,
        top_k
    )

    print("\n========== PREDICTION ==========")

    for rank, (value, index) in enumerate(
        zip(values, indices),
        start=1
    ):

        print(
            f"{rank}. "
            f"{labels[index.item()]:15} "
            f"{value.item() * 100:.2f}%"
        )

    predicted_index = torch.argmax(
        probabilities
    ).item()

    predicted_label = labels[
        predicted_index
    ]

    confidence = probabilities[
        predicted_index
    ].item() * 100

    print("\n--------------------------------")
    print(
        f"Predicted sign: {predicted_label}"
    )
    print(
        f"Confidence: {confidence:.2f}%"
    )
    print("--------------------------------")


# ============================================================
# MAIN
# ============================================================

feature_path = input(
    "\nEnter the path of a .npy feature file:\n> "
).strip()

if not os.path.exists(feature_path):

    print("\nERROR: Feature file not found.")

else:

    predict(feature_path)