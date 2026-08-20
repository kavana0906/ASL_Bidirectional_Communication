import cv2
import mediapipe as mp
import numpy as np
from pathlib import Path


# ============================================================
# PATHS
# ============================================================

DATASET_DIR = Path(
    r"C:\ASL_Project\datasets\American-Sign-Language-Dataset"
)

OUTPUT_DIR = Path(
    r"C:\ASL_Project\asl_training\features_normalized"
)

MODEL_PATH = Path(
    r"C:\ASL_Project\hand_landmarker.task"
)


# ============================================================
# ONLY CLASSES THAT ACTUALLY EXIST IN DATASET
# ============================================================

WORDS = [
    "HELLO",
    "YES",
    "NO",
    "THANK YOU",
    "PLEASE",
    "SORRY",
    "GOOD",
    "BAD",
    "HELP",
    "STOP",
    "START",
    "MORE",
    "LESS",
    "YOU",
    "WE",
    "WHERE",
    "WHEN",
    "WHY",
    "NAME",
    "UNDERSTAND",
    "LIKE",
    "LOVE",
]


# ============================================================
# CREATE OUTPUT DIRECTORY
# ============================================================

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# MEDIAPIPE
# ============================================================

BaseOptions = mp.tasks.BaseOptions
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode


options = HandLandmarkerOptions(
    base_options=BaseOptions(
        model_asset_path=str(MODEL_PATH)
    ),
    running_mode=VisionRunningMode.IMAGE,
    num_hands=2
)


# ============================================================
# NORMALIZE ONE HAND
# ============================================================

def normalize_hand(hand):

    coords = np.array(
        [[lm.x, lm.y, lm.z] for lm in hand],
        dtype=np.float32
    )

    # Wrist becomes origin
    wrist = coords[0].copy()
    coords = coords - wrist

    # Normalize hand size
    distances = np.linalg.norm(
        coords,
        axis=1
    )

    scale = np.max(distances)

    if scale > 1e-6:
        coords = coords / scale

    return coords.flatten()


# ============================================================
# EXTRACT VIDEO
# ============================================================

def extract_video(
    video_path,
    output_path,
    landmarker
):

    cap = cv2.VideoCapture(
        str(video_path)
    )

    if not cap.isOpened():

        print(
            f"Could not open: {video_path}"
        )

        return False


    features = []


    while True:

        ret, frame = cap.read()

        if not ret:
            break


        rgb = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2RGB
        )


        mp_image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=rgb
        )


        result = landmarker.detect(
            mp_image
        )


        # ----------------------------------------------------
        # 126 FEATURES
        # ----------------------------------------------------

        frame_features = np.zeros(
            126,
            dtype=np.float32
        )


        # ----------------------------------------------------
        # HAND DETECTION
        # ----------------------------------------------------

        if result.hand_landmarks:

            hands = result.hand_landmarks[:2]


            # ------------------------------------------------
            # PROCESS HANDS
            # ------------------------------------------------

            normalized_hands = []

            for hand in hands:

                normalized = normalize_hand(
                    hand
                )

                normalized_hands.append(
                    normalized
                )


            # ------------------------------------------------
            # SORT HANDS CONSISTENTLY
            #
            # Use handedness information when available.
            # Otherwise use detection order.
            # ------------------------------------------------

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


                    if category.category_name == "Left":

                        left_hand = normalized_hands[i]

                    elif category.category_name == "Right":

                        right_hand = normalized_hands[i]


                if left_hand is not None:

                    frame_features[:63] = left_hand


                if right_hand is not None:

                    frame_features[63:126] = right_hand


            else:

                for i, hand_features in enumerate(
                    normalized_hands
                ):

                    frame_features[
                        i * 63:
                        (i + 1) * 63
                    ] = hand_features


        features.append(
            frame_features
        )


    cap.release()


    if len(features) == 0:

        return False


    features = np.asarray(
        features,
        dtype=np.float32
    )


    # --------------------------------------------------------
    # CLEAN VALUES
    # --------------------------------------------------------

    features = np.nan_to_num(
        features,
        nan=0.0,
        posinf=0.0,
        neginf=0.0
    )


    # --------------------------------------------------------
    # SAVE
    # --------------------------------------------------------

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True
    )


    np.save(
        output_path,
        features
    )


    return True


# ============================================================
# MAIN
# ============================================================

with HandLandmarker.create_from_options(
    options
) as landmarker:

    total = 0
    completed = 0


    for word in WORDS:

        print(
            f"\n========== {word} =========="
        )


        output_folder = (
            OUTPUT_DIR / word
        )


        output_folder.mkdir(
            parents=True,
            exist_ok=True
        )


        videos = list(
            DATASET_DIR.rglob(
                f"*-{word}.mp4"
            )
        )


        print(
            f"Videos found: {len(videos)}"
        )


        for video in videos:

            output_file = (
                output_folder /
                f"{video.stem}.npy"
            )


            # Skip already processed
            if output_file.exists():

                continue


            total += 1


            success = extract_video(
                video,
                output_file,
                landmarker
            )


            if success:

                completed += 1

                print(
                    f"[{completed}] "
                    f"{video.name}"
                )


print(
    "\n========== DONE =========="
)

print(
    f"Features created: {completed}"
)

print(
    f"Output directory:\n{OUTPUT_DIR}"
)