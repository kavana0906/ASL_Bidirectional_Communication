import cv2
import mediapipe as mp
import numpy as np
from pathlib import Path

DATASET_DIR = Path(r"C:\ASL_Project\datasets\American-Sign-Language-Dataset")
OUTPUT_DIR = Path(r"C:\ASL_Project\asl_training\features")

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
    "I",
    "YOU",
    "WE",
    "THEY",
    "WHAT",
    "WHERE",
    "WHEN",
    "WHY",
    "HOW",
    "NAME",
    "UNDERSTAND",
    "LIKE",
    "LOVE",
]

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

BaseOptions = mp.tasks.BaseOptions
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

MODEL_PATH = Path(r"C:\ASL_Project\hand_landmarker.task")

options = HandLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=str(MODEL_PATH)),
    running_mode=VisionRunningMode.IMAGE,
    num_hands=2
)

def extract_video(video_path, output_path, landmarker):

    cap = cv2.VideoCapture(str(video_path))

    if not cap.isOpened():
        print(f"Could not open: {video_path}")
        return False

    features = []

    while True:
        ret, frame = cap.read()

        if not ret:
            break

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        mp_image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=rgb
        )

        result = landmarker.detect(mp_image)

        frame_features = np.zeros(126, dtype=np.float32)

        if result.hand_landmarks:

            for hand_index, hand in enumerate(result.hand_landmarks[:2]):

                offset = hand_index * 63

                for landmark_index, landmark in enumerate(hand):

                    frame_features[offset + landmark_index * 3] = landmark.x
                    frame_features[offset + landmark_index * 3 + 1] = landmark.y
                    frame_features[offset + landmark_index * 3 + 2] = landmark.z

        features.append(frame_features)

    cap.release()

    if len(features) == 0:
        return False

    features = np.array(features, dtype=np.float32)

    output_path.parent.mkdir(parents=True, exist_ok=True)

    np.save(output_path, features)

    return True


with HandLandmarker.create_from_options(options) as landmarker:

    total = 0
    completed = 0

    for word in WORDS:

        print(f"\n========== {word} ==========")

        output_folder = OUTPUT_DIR / word
        output_folder.mkdir(parents=True, exist_ok=True)

        videos = list(DATASET_DIR.rglob(f"*-{word}.mp4"))

        print(f"Videos found: {len(videos)}")

        for video in videos:

            output_file = output_folder / f"{video.stem}.npy"

            if output_file.exists():
                continue

            total += 1

            if extract_video(video, output_file, landmarker):
                completed += 1
                print(f"[{completed}] {video.name}")

print("\n========== DONE ==========")
print(f"Features created: {completed}")