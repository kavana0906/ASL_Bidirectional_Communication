import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

VIDEO_PATH = r"C:\ASL_Project\datasets\American-Sign-Language-Dataset\part_1\0022932153577568393-HELLO.mp4"
MODEL_PATH = r"C:\ASL_Project\hand_landmarker.task"

# Create hand landmarker
base_options = python.BaseOptions(model_asset_path=MODEL_PATH)

options = vision.HandLandmarkerOptions(
    base_options=base_options,
    num_hands=2,
    min_hand_detection_confidence=0.3,
    min_hand_presence_confidence=0.3,
    min_tracking_confidence=0.3
)

detector = vision.HandLandmarker.create_from_options(options)

cap = cv2.VideoCapture(VIDEO_PATH)

total_frames = 0
frames_with_hands = 0

while True:
    ret, frame = cap.read()

    if not ret:
        break

    total_frames += 1

    # OpenCV BGR -> RGB
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    mp_image = mp.Image(
        image_format=mp.ImageFormat.SRGB,
        data=rgb
    )

    result = detector.detect(mp_image)

    if result.hand_landmarks:
        frames_with_hands += 1

cap.release()
detector.close()

print("\n========== RESULT ==========")
print("Total frames:", total_frames)
print("Frames with hands:", frames_with_hands)

if total_frames > 0:
    print(
        "Hand detection:",
        round(frames_with_hands / total_frames * 100, 2),
        "%"
    )