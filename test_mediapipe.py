import cv2
import mediapipe as mp

VIDEO_PATH = r"C:\ASL_Project\datasets\American-Sign-Language-Dataset\part_1\000017451997373907346-LIBRARY.mp4"

# MediaPipe Tasks API
BaseOptions = mp.tasks.BaseOptions
VisionRunningMode = mp.tasks.vision.RunningMode

options = mp.tasks.vision.HandLandmarkerOptions(
    base_options=BaseOptions(
        model_asset_path="hand_landmarker.task"
    ),
    running_mode=VisionRunningMode.IMAGE,
    num_hands=2,
)

detector = mp.tasks.vision.HandLandmarker.create_from_options(options)

cap = cv2.VideoCapture(VIDEO_PATH)

if not cap.isOpened():
    print("ERROR: Could not open video.")
    exit()

print("Video opened successfully!")

frame_count = 0
frames_with_hands = 0

while True:
    ret, frame = cap.read()

    if not ret:
        break

    frame_count += 1

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    mp_image = mp.Image(
        image_format=mp.ImageFormat.SRGB,
        data=rgb
    )

    result = detector.detect(mp_image)

    if result.hand_landmarks:
        frames_with_hands += 1

        # Draw detected hand landmarks
        for hand in result.hand_landmarks:
            for landmark in hand:
                x = int(landmark.x * frame.shape[1])
                y = int(landmark.y * frame.shape[0])

                cv2.circle(
                    frame,
                    (x, y),
                    4,
                    (0, 255, 0),
                    -1
                )

    cv2.imshow("MediaPipe ASL Test", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
detector.close()
cv2.destroyAllWindows()

print()
print("========== RESULT ==========")
print("Total frames:", frame_count)
print("Frames with hands:", frames_with_hands)

if frame_count > 0:
    percentage = (frames_with_hands / frame_count) * 100
    print(f"Hand detection: {percentage:.2f}%")

print("============================")