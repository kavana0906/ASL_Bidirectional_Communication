import cv2
import numpy as np
import torch
import torch.nn as nn
import mediapipe as mp

from pathlib import Path


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(r"C:\ASL_Project")

MODEL_PATH = (
    BASE_DIR
    / "asl_training"
    / "asl_bilstm_attention_model.pth"
)

LABEL_PATH = (
    BASE_DIR
    / "asl_training"
    / "labels_attention.txt"
)

HAND_MODEL = (
    BASE_DIR
    / "hand_landmarker.task"
)


# ============================================================
# SETTINGS
# ============================================================

INPUT_SIZE = 126
HIDDEN_SIZE = 128
NUM_LAYERS = 2
SEQUENCE_LENGTH = 60

DEVICE = torch.device("cpu")


# ============================================================
# LOAD LABELS
# ============================================================

with open(
    LABEL_PATH,
    "r",
    encoding="utf-8"
) as f:

    labels = [
        line.strip()
        for line in f
        if line.strip()
    ]

NUM_CLASSES = len(labels)


# ============================================================
# ATTENTION
# ============================================================

class Attention(nn.Module):

    def __init__(self, hidden_size):

        super().__init__()

        self.attention = nn.Sequential(

            nn.Linear(
                hidden_size * 2,
                hidden_size
            ),

            nn.Tanh(),

            nn.Linear(
                hidden_size,
                1
            )
        )

    def forward(
        self,
        x,
        mask=None
    ):

        scores = self.attention(
            x
        ).squeeze(-1)

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

            dropout=(
                0.3
                if num_layers > 1
                else 0
            )
        )

        self.attention = Attention(
            hidden_size
        )

        self.classifier = nn.Sequential(

            nn.Linear(
                hidden_size * 2,
                128
            ),

            nn.ReLU(),

            nn.Dropout(0.3),

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

        packed = torch.nn.utils.rnn.pack_padded_sequence(

            x,

            lengths.cpu(),

            batch_first=True,

            enforce_sorted=False
        )

        packed_output, _ = self.lstm(
            packed
        )

        output, _ = torch.nn.utils.rnn.pad_packed_sequence(

            packed_output,

            batch_first=True
        )

        max_len = output.size(1)

        mask = (

            torch.arange(
                max_len,
                device=output.device
            )
            .unsqueeze(0)

            <

            lengths.to(
                output.device
            ).unsqueeze(1)
        )

        context = self.attention(
            output,
            mask
        )

        return self.classifier(
            context
        )


# ============================================================
# LOAD TRAINED MODEL
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


if "model_state_dict" in checkpoint:

    state_dict = checkpoint[
        "model_state_dict"
    ]

else:

    state_dict = checkpoint


model.load_state_dict(
    state_dict
)

model.eval()


print(
    f"ASL model loaded successfully: "
    f"{NUM_CLASSES} classes"
)


# ============================================================
# MEDIAPIPE HAND LANDMARKER
# ============================================================

base_options = mp.tasks.BaseOptions(
    model_asset_path=str(HAND_MODEL)
)

landmarker_options = (
    mp.tasks.vision.HandLandmarkerOptions(

        base_options=base_options,

        running_mode=(
            mp.tasks.vision.RunningMode.IMAGE
        ),

        num_hands=2
    )
)

landmarker = (
    mp.tasks.vision.HandLandmarker
    .create_from_options(
        landmarker_options
    )
)


# ============================================================
# NORMALIZE ONE HAND
# ============================================================

def normalize_hand(hand):

    coords = np.array(

        [
            [
                landmark.x,
                landmark.y,
                landmark.z
            ]

            for landmark in hand
        ],

        dtype=np.float32
    )

    # Wrist as origin
    wrist = coords[0].copy()

    coords = coords - wrist

    # Normalize hand size
    distances = np.linalg.norm(
        coords,
        axis=1
    )

    scale = np.max(
        distances
    )

    if scale > 1e-6:

        coords = coords / scale

    return coords.flatten()


# ============================================================
# EXTRACT 126 FEATURES FROM ONE IMAGE
# ============================================================

def extract_features(image):

    rgb = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2RGB
    )

    mp_image = mp.Image(

        image_format=mp.ImageFormat.SRGB,

        data=rgb
    )

    result = landmarker.detect(
        mp_image
    )

    features = np.zeros(
        INPUT_SIZE,
        dtype=np.float32
    )

    if not result.hand_landmarks:

        return features, False


    hands = result.hand_landmarks[:2]

    normalized_hands = []

    for hand in hands:

        normalized_hands.append(
            normalize_hand(hand)
        )


    # ========================================================
    # SAME LEFT/RIGHT ORDER USED DURING TRAINING
    # ========================================================

    if (
        hasattr(result, "handedness")
        and len(result.handedness) >= len(hands)
    ):

        left_hand = None
        right_hand = None

        for i, handedness in enumerate(
            result.handedness[:2]
        ):

            if not handedness:

                continue

            category = handedness[0]

            if (
                category.category_name
                == "Left"
            ):

                left_hand = (
                    normalized_hands[i]
                )

            elif (
                category.category_name
                == "Right"
            ):

                right_hand = (
                    normalized_hands[i]
                )


        if left_hand is not None:

            features[:63] = left_hand


        if right_hand is not None:

            features[63:126] = right_hand


    else:

        for i, hand_features in enumerate(
            normalized_hands
        ):

            features[
                i * 63:
                (i + 1) * 63
            ] = hand_features


    return features, True


# ============================================================
# PREDICT FROM FEATURE SEQUENCE
# ============================================================

def predict_sequence(
    feature_sequence
):

    if not feature_sequence:

        return {
            "prediction": "NO_HAND",
            "confidence": 0.0
        }


    features = np.asarray(
        feature_sequence,
        dtype=np.float32
    )


    if features.ndim != 2:

        raise ValueError(
            "Expected feature sequence "
            "with shape (frames, 126)"
        )


    if features.shape[1] != INPUT_SIZE:

        raise ValueError(
            f"Expected {INPUT_SIZE} "
            f"features, got "
            f"{features.shape[1]}"
        )


    features = np.nan_to_num(
        features,
        nan=0.0,
        posinf=0.0,
        neginf=0.0
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


    index = torch.argmax(
        probabilities
    ).item()


    confidence = probabilities[
        index
    ].item()


    return {
        "prediction": labels[index],
        "confidence": confidence
    }


# ============================================================
# PREDICT FROM SINGLE IMAGE
# ============================================================

def predict_image(
    image_bytes
):

    image_array = np.frombuffer(
        image_bytes,
        dtype=np.uint8
    )

    image = cv2.imdecode(
        image_array,
        cv2.IMREAD_COLOR
    )


    if image is None:

        raise ValueError(
            "Could not decode uploaded image"
        )


    features, hand_detected = (
        extract_features(image)
    )


    if not hand_detected:

        return {
            "prediction": "NO_HAND",
            "confidence": 0.0
        }


    # Single-frame inference.
    # The endpoint will later be upgraded
    # to maintain a real temporal sequence.
    return predict_sequence(
        [features]
    )


# ============================================================
# PREDICT FROM A WEBCAM FRAME SEQUENCE
# ============================================================

def _decode_image(image_bytes):
    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("Could not decode an uploaded frame")

    return image


def predict_frame_sequence(frame_bytes_sequence):
    """Extract landmarks from a chronological webcam frame sequence.

    A missing hand resets the active sequence, exactly as in the training
    webcam loop. The client supplies frames in capture order and does not
    mirror them.
    """
    if not frame_bytes_sequence:
        return {
            "prediction": "NO_HAND",
            "confidence": 0.0,
            "frames_received": 0,
            "frames_with_hands": 0,
        }

    feature_sequence = []
    frames_with_hands = 0

    for image_bytes in frame_bytes_sequence:
        image = _decode_image(image_bytes)
        features, hand_detected = extract_features(image)

        if hand_detected:
            feature_sequence.append(features)
            frames_with_hands += 1

    if len(feature_sequence) < SEQUENCE_LENGTH:
        return {
            "prediction": "COLLECTING_FRAMES",
            "confidence": 0.0,
            "frames_received": len(frame_bytes_sequence),
            "frames_with_hands": frames_with_hands,
            "consecutive_frames": len(feature_sequence),
            "frames_required": SEQUENCE_LENGTH,
        }

    # Keep the most recent 60 valid frames, the same temporal window used by
    # webcam_bilstm_attention.py during model testing.
    result = predict_sequence(feature_sequence[-SEQUENCE_LENGTH:])
    result.update(
        {
            "frames_received": len(frame_bytes_sequence),
            "frames_with_hands": frames_with_hands,
            "frames_used": SEQUENCE_LENGTH,
        }
    )
    return result
