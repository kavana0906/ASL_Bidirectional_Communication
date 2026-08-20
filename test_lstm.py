import os
import numpy as np
import torch
import torch.nn as nn
from torch.nn.utils.rnn import pack_padded_sequence


# ============================================================
# PATHS
# ============================================================

BASE_DIR = r"C:\ASL_Project"

MODEL_PATH = os.path.join(
    BASE_DIR,
    "asl_training",
    "asl_lstm_model.pth"
)

LABEL_PATH = os.path.join(
    BASE_DIR,
    "asl_training",
    "labels.txt"
)


# ============================================================
# DEVICE
# ============================================================

DEVICE = torch.device("cpu")

print("Device:", DEVICE)


# ============================================================
# LOAD LABELS
# ============================================================

with open(LABEL_PATH, "r", encoding="utf-8") as f:
    labels = [line.strip() for line in f if line.strip()]

print("Number of labels:", len(labels))


# ============================================================
# MODEL
# ============================================================

checkpoint = torch.load(
    MODEL_PATH,
    map_location=DEVICE
)

INPUT_SIZE = checkpoint["input_size"]
HIDDEN_SIZE = checkpoint["hidden_size"]
NUM_LAYERS = checkpoint["num_layers"]
NUM_CLASSES = checkpoint["num_classes"]


class ASLLSTM(nn.Module):

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
            dropout=0.2 if num_layers > 1 else 0
        )

        self.fc = nn.Linear(
            hidden_size,
            num_classes
        )

    def forward(self, x, lengths):

        packed = pack_padded_sequence(
            x,
            lengths.cpu(),
            batch_first=True,
            enforce_sorted=False
        )

        _, (hidden, _) = self.lstm(packed)

        last_hidden = hidden[-1]

        return self.fc(last_hidden)


model = ASLLSTM(
    INPUT_SIZE,
    HIDDEN_SIZE,
    NUM_LAYERS,
    NUM_CLASSES
)

model.load_state_dict(
    checkpoint["model_state_dict"]
)

model.to(DEVICE)
model.eval()

print("Model loaded successfully.")


# ============================================================
# SELECT FEATURE FILE
# ============================================================

feature_path = input(
    "\nEnter the path of a .npy feature file:\n> "
).strip().strip('"')


if not os.path.exists(feature_path):

    print("\nERROR: Feature file not found.")
    print("Path:", feature_path)
    exit()


# ============================================================
# LOAD FEATURES
# ============================================================

features = np.load(feature_path).astype(np.float32)

features = np.nan_to_num(features)

print("\nFeature shape:", features.shape)


# ============================================================
# CHECK INPUT SIZE
# ============================================================

if features.ndim != 2:

    print(
        "\nERROR: Expected feature shape "
        "(frames, 126)."
    )

    exit()


if features.shape[1] != INPUT_SIZE:

    print(
        f"\nERROR: Expected {INPUT_SIZE} features "
        f"per frame, but got {features.shape[1]}."
    )

    exit()


# ============================================================
# PREPARE TENSOR
# ============================================================

x = torch.tensor(
    features,
    dtype=torch.float32
).unsqueeze(0)

lengths = torch.tensor(
    [features.shape[0]],
    dtype=torch.long
)


# ============================================================
# PREDICTION
# ============================================================

with torch.no_grad():

    output = model(
        x,
        lengths
    )

    probabilities = torch.softmax(
        output,
        dim=1
    )[0]


# ============================================================
# TOP 5 PREDICTIONS
# ============================================================

top_k = min(5, len(labels))

values, indices = torch.topk(
    probabilities,
    top_k
)

print("\n========== PREDICTION ==========")

for rank, (value, index) in enumerate(
    zip(values, indices),
    start=1
):

    label = labels[index.item()]
    confidence = value.item() * 100

    print(
        f"{rank}. {label:<15} "
        f"{confidence:.2f}%"
    )


# ============================================================
# FINAL PREDICTION
# ============================================================

predicted_index = torch.argmax(
    probabilities
).item()

predicted_label = labels[predicted_index]

predicted_confidence = (
    probabilities[predicted_index].item() * 100
)

print("\n--------------------------------")
print("Predicted sign:", predicted_label)
print(
    f"Confidence: {predicted_confidence:.2f}%"
)
print("--------------------------------")