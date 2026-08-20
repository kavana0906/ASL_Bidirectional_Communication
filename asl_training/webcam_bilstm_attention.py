import cv2
import numpy as np
import torch
import torch.nn as nn
import mediapipe as mp

from collections import deque
from pathlib import Path
from mediapipe.tasks import python
from mediapipe.tasks.python import vision


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(r"C:\ASL_Project\asl_training")

MODEL_PATH = BASE_DIR / "asl_bilstm_attention_model.pth"
LABEL_PATH = BASE_DIR / "labels_attention.txt"

HAND_MODEL = Path(
    r"C:\ASL_Project\hand_landmarker.task"
)


# ============================================================
# SETTINGS
# ============================================================

INPUT_SIZE = 126
HIDDEN_SIZE = 128
NUM_LAYERS = 2

# Number of frames used for one prediction
SEQUENCE_LENGTH = 60

# Predict every N frames
PREDICTION_INTERVAL = 3

# Number of recent predictions used for smoothing
HISTORY_LENGTH = 5

DEVICE = torch.device("cpu")

print("Device:", DEVICE)


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

print(
    "Number of labels:",
    NUM_CLASSES
)


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
            x *
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

            nn.Dropout(
                0.3
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

        packed = torch.nn.utils.rnn.pack_padded_sequence(

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

        output, _ = torch.nn.utils.rnn.pad_packed_sequence(

            packed_output,

            batch_first=True
        )


        # ----------------------------------------------------
        # MASK
        # ----------------------------------------------------

        max_len = output.size(1)

        device = output.device

        positions = torch.arange(
            max_len,
            device=device
        ).unsqueeze(0)


        mask = (

            positions

            <

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
        # CLASSIFIER
        # ----------------------------------------------------

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
    "Model loaded successfully."
)


# ============================================================
# MEDIAPIPE HAND LANDMARKER
# ============================================================

base_options = python.BaseOptions(

    model_asset_path=str(
        HAND_MODEL
    )
)


options = vision.HandLandmarkerOptions(

    base_options=base_options,

    running_mode=vision.RunningMode.IMAGE,

    num_hands=2
)


landmarker = (
    vision.HandLandmarker
    .create_from_options(options)
)


# ============================================================
# NORMALIZE ONE HAND
#
# THIS MUST MATCH TRAINING
# ============================================================

def normalize_hand(hand):

    # --------------------------------------------------------
    # Convert landmarks to numpy
    # --------------------------------------------------------

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


    # --------------------------------------------------------
    # Wrist becomes origin
    # --------------------------------------------------------

    wrist = coords[0].copy()

    coords = coords - wrist


    # --------------------------------------------------------
    # Normalize hand size
    # --------------------------------------------------------

    distances = np.linalg.norm(

        coords,

        axis=1
    )


    scale = np.max(
        distances
    )


    if scale > 1e-6:

        coords = (
            coords /
            scale
        )


    return coords.flatten()


# ============================================================
# EXTRACT 126 FEATURES
#
# IMPORTANT:
# MediaPipe receives ORIGINAL frame.
#
# This matches the training preprocessing:
#
#   Left hand  -> features 0:63
#   Right hand -> features 63:126
#
# ============================================================

def extract_landmarks(frame):

    # --------------------------------------------------------
    # Convert BGR -> RGB
    # --------------------------------------------------------

    rgb = cv2.cvtColor(

        frame,

        cv2.COLOR_BGR2RGB
    )


    # --------------------------------------------------------
    # MediaPipe image
    # --------------------------------------------------------

    mp_image = mp.Image(

        image_format=mp.ImageFormat.SRGB,

        data=rgb
    )


    # --------------------------------------------------------
    # Detect hands
    # --------------------------------------------------------

    result = landmarker.detect(
        mp_image
    )


    # --------------------------------------------------------
    # Initialize 126 features
    # --------------------------------------------------------

    features = np.zeros(

        INPUT_SIZE,

        dtype=np.float32
    )


    # --------------------------------------------------------
    # Process detected hands
    # --------------------------------------------------------

    if result.hand_landmarks:

        hands = result.hand_landmarks[:2]


        normalized_hands = []


        for hand in hands:

            normalized = normalize_hand(
                hand
            )

            normalized_hands.append(
                normalized
            )


        # ----------------------------------------------------
        # LEFT / RIGHT HAND ORDERING
        # Same as training
        # ----------------------------------------------------

        if (

            hasattr(
                result,
                "handedness"
            )

            and

            len(
                result.handedness
            ) >= len(hands)

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


            # ------------------------------------------------
            # Left hand -> first 63
            # ------------------------------------------------

            if left_hand is not None:

                features[:63] = (
                    left_hand
                )


            # ------------------------------------------------
            # Right hand -> last 63
            # ------------------------------------------------

            if right_hand is not None:

                features[63:126] = (
                    right_hand
                )


        else:

            # ------------------------------------------------
            # Fallback
            # ------------------------------------------------

            for i, hand_features in enumerate(

                normalized_hands

            ):

                features[

                    i * 63:

                    (i + 1) * 63

                ] = hand_features


    return features, result


# ============================================================
# PREDICT SEQUENCE
# ============================================================

def predict_sequence(sequence):

    if len(sequence) < 5:

        return None, 0.0


    # --------------------------------------------------------
    # Convert sequence to numpy
    # --------------------------------------------------------

    features = np.asarray(

        sequence,

        dtype=np.float32
    )


    # --------------------------------------------------------
    # Safety checks
    # --------------------------------------------------------

    if features.ndim != 2:

        return None, 0.0


    if features.shape[1] != INPUT_SIZE:

        return None, 0.0


    # --------------------------------------------------------
    # Clean values
    # --------------------------------------------------------

    features = np.nan_to_num(

        features,

        nan=0.0,

        posinf=0.0,

        neginf=0.0
    )


    # --------------------------------------------------------
    # Tensor
    # --------------------------------------------------------

    x = torch.tensor(

        features,

        dtype=torch.float32

    ).unsqueeze(0)


    lengths = torch.tensor(

        [features.shape[0]],

        dtype=torch.long

    )


    # --------------------------------------------------------
    # Prediction
    # --------------------------------------------------------

    with torch.no_grad():

        outputs = model(

            x.to(DEVICE),

            lengths

        )


        probabilities = torch.softmax(

            outputs,

            dim=1

        )[0]


    # --------------------------------------------------------
    # Best prediction
    # --------------------------------------------------------

    index = torch.argmax(

        probabilities

    ).item()


    confidence = probabilities[

        index

    ].item()


    return labels[index], confidence


# ============================================================
# WEBCAM
# ============================================================

cap = cv2.VideoCapture(0)


if not cap.isOpened():

    print(
        "\nERROR: Could not open webcam."
    )

    landmarker.close()

    raise SystemExit


# ============================================================
# SEQUENCE STORAGE
# ============================================================

sequence = deque(

    maxlen=SEQUENCE_LENGTH
)


prediction_history = deque(

    maxlen=HISTORY_LENGTH
)


frame_count = 0


current_prediction = (
    "Waiting..."
)


current_confidence = 0.0


# ============================================================
# START
# ============================================================

print(
    "\n========== REAL-TIME TEST =========="
)

print(
    "Show an ASL sign to the camera."
)

print(
    "Hold the sign steadily."
)

print(
    "Press Q to quit."
)


# ============================================================
# MAIN LOOP
# ============================================================

while True:

    # --------------------------------------------------------
    # Read webcam
    # --------------------------------------------------------

    ret, frame = cap.read()


    if not ret:

        print(
            "Could not read webcam frame."
        )

        break


    # ========================================================
    # IMPORTANT:
    #
    # DO NOT FLIP BEFORE MEDIAPIPE
    #
    # Training videos were processed without this flip.
    # ========================================================

    landmark_features, result = (
        extract_landmarks(frame)
    )


    # ========================================================
    # MIRROR ONLY DISPLAY
    # ========================================================

    display_frame = cv2.flip(

        frame,

        1
    )


    # --------------------------------------------------------
    # Check hand detection
    # --------------------------------------------------------

    hand_detected = bool(

        result.hand_landmarks
    )


    # ========================================================
    # HAND DETECTED
    # ========================================================

    if hand_detected:

        sequence.append(

            landmark_features
        )


    # ========================================================
    # NO HAND
    # ========================================================

    else:

        sequence.clear()

        prediction_history.clear()

        current_prediction = (
            "No hand"
        )

        current_confidence = 0.0


    # ========================================================
    # PREDICTION
    # ========================================================

    if (

        hand_detected

        and

        len(sequence)
        >= SEQUENCE_LENGTH

        and

        frame_count
        % PREDICTION_INTERVAL
        == 0

    ):

        label, confidence = (
            predict_sequence(
                list(sequence)
            )
        )


        if label is not None:

            prediction_history.append(

                (
                    label,
                    confidence
                )

            )


            # =================================================
            # MAJORITY VOTE
            # =================================================

            counts = {}


            for (
                hist_label,
                hist_conf
            ) in prediction_history:

                counts[hist_label] = (

                    counts.get(
                        hist_label,
                        0
                    )

                    + 1

                )


            stable_label = max(

                counts,

                key=counts.get
            )


            # =================================================
            # AVERAGE CONFIDENCE
            # =================================================

            stable_confidences = [

                conf

                for (
                    hist_label,
                    conf
                )

                in prediction_history

                if hist_label
                == stable_label

            ]


            current_prediction = (
                stable_label
            )


            current_confidence = (

                sum(
                    stable_confidences
                )

                /

                len(
                    stable_confidences
                )

            )


    # ========================================================
    # DISPLAY PANEL
    # ========================================================

    cv2.rectangle(

        display_frame,

        (10, 10),

        (630, 135),

        (20, 20, 20),

        -1

    )


    # ========================================================
    # SIGN
    # ========================================================

    cv2.putText(

        display_frame,

        f"Sign: {current_prediction}",

        (25, 55),

        cv2.FONT_HERSHEY_SIMPLEX,

        1.0,

        (0, 255, 0),

        2

    )


    # ========================================================
    # CONFIDENCE
    # ========================================================

    cv2.putText(

        display_frame,

        (
            f"Confidence: "
            f"{current_confidence * 100:.2f}%"
        ),

        (25, 95),

        cv2.FONT_HERSHEY_SIMPLEX,

        0.8,

        (255, 255, 255),

        2

    )


    # ========================================================
    # FRAME COUNT
    # ========================================================

    cv2.putText(

        display_frame,

        (
            f"Frames: "
            f"{len(sequence)}/"
            f"{SEQUENCE_LENGTH}"
        ),

        (25, 120),

        cv2.FONT_HERSHEY_SIMPLEX,

        0.55,

        (200, 200, 200),

        1

    )


    # ========================================================
    # HAND STATUS
    # ========================================================

    status = (
        "Hand detected"
        if hand_detected
        else "No hand detected"
    )


    cv2.putText(

        display_frame,

        status,

        (430, 120),

        cv2.FONT_HERSHEY_SIMPLEX,

        0.55,

        (200, 200, 200),

        1

    )


    # ========================================================
    # SHOW
    # ========================================================

    cv2.imshow(

        "ASL Real-Time Recognition",

        display_frame

    )


    # ========================================================
    # FRAME COUNTER
    # ========================================================

    frame_count += 1


    # ========================================================
    # KEYBOARD
    # ========================================================

    key = cv2.waitKey(1) & 0xFF


    if key == ord("q"):

        break


# ============================================================
# CLEANUP
# ============================================================

cap.release()

cv2.destroyAllWindows()

landmarker.close()


print(
    "\n========== WEBCAM TEST COMPLETE =========="
)