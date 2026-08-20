import os
import glob
import cv2
import pickle
import numpy as np
import mediapipe as mp

# Target words for testing
TARGET_WORDS = ["HELLO", "THANK YOU", "LOVE", "CAR", "WATER"]

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(os.path.dirname(BASE_DIR), "datasets", "American-Sign-Language-Dataset")
MODEL_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODEL_DIR, exist_ok=True)

MODEL_PATH = os.path.join(MODEL_DIR, "asl_model.pkl")
HAND_LANDMARKER_PATH = os.path.join(os.path.dirname(BASE_DIR), "hand_landmarker.task")

def extract_landmarks_from_video(video_path, detector):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error opening video: {video_path}")
        return None

    video_features = []
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        # BGR -> RGB
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        
        result = detector.detect(mp_image)
        
        if result.hand_landmarks:
            frame_features = np.zeros(84) # 21 landmarks * 2 coordinates * 2 hands
            
            for hand_idx, hand_landmarks in enumerate(result.hand_landmarks):
                if hand_idx >= 2:
                    break
                
                # Wrist coordinate for normalization
                wrist = hand_landmarks[0]
                
                hand_features = []
                for lm in hand_landmarks:
                    # Normalize by subtracting wrist coordinates
                    hand_features.append(lm.x - wrist.x)
                    hand_features.append(lm.y - wrist.y)
                
                start_idx = hand_idx * 42
                frame_features[start_idx:start_idx+42] = hand_features
                
            video_features.append(frame_features)
            
    cap.release()
    
    if len(video_features) == 0:
        return None
        
    # Average the features over all frames where hands were detected
    mean_features = np.mean(video_features, axis=0)
    return mean_features

def main():
    print("Initializing MediaPipe Hand Landmarker...")
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    
    base_options = python.BaseOptions(model_asset_path=HAND_LANDMARKER_PATH)
    options = vision.HandLandmarkerOptions(
        base_options=base_options,
        num_hands=2,
        min_hand_detection_confidence=0.3,
        min_hand_presence_confidence=0.3,
    )
    detector = vision.HandLandmarker.create_from_options(options)
    
    # Locate all videos for target words
    print("Scanning dataset directory for target words...")
    video_files = []
    labels = []
    
    # We will search in all part_* directories
    search_pattern = os.path.join(DATASET_DIR, "part_*", "*.mp4")
    all_videos = glob.glob(search_pattern)
    
    for v_path in all_videos:
        filename = os.path.basename(v_path)
        # Check if the filename contains any target word preceded by a hyphen
        for word in TARGET_WORDS:
            if f"-{word}.mp4" in filename or filename.endswith(f"-{word}.mp4"):
                video_files.append(v_path)
                labels.append(word)
                break
                
    print(f"Found {len(video_files)} video files matching target words.")
    if len(video_files) == 0:
        print("No videos found. Please check paths or target words.")
        return
        
    # Extract features
    X = []
    y = []
    
    for idx, (v_path, label) in enumerate(zip(video_files, labels)):
        print(f"[{idx+1}/{len(video_files)}] Extracting features from: {os.path.basename(v_path)} ({label})")
        features = extract_landmarks_from_video(v_path, detector)
        if features is not None:
            X.append(features)
            y.append(label)
            
    detector.close()
    
    X = np.array(X)
    y = np.array(y)
    
    print(f"Successfully processed {len(X)} videos.")
    
    # Train model
    print("Training Classifier...")
    try:
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.model_selection import train_test_split
    except ImportError:
        print("sklearn not found. Please install scikit-learn inside the virtual environment.")
        return
        
    if len(X) < 5:
        print("Not enough data to train. Need at least 5 samples.")
        return
        
    # Split for simple evaluation if possible
    if len(X) >= 10:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        clf = RandomForestClassifier(n_estimators=100, random_state=42)
        clf.fit(X_train, y_train)
        train_acc = clf.score(X_train, y_train)
        test_acc = clf.score(X_test, y_test)
        print(f"Train Accuracy: {train_acc*100:.2f}%")
        print(f"Test Accuracy: {test_acc*100:.2f}%")
        
        # Re-train on all data
        clf = RandomForestClassifier(n_estimators=100, random_state=42)
        clf.fit(X, y)
    else:
        clf = RandomForestClassifier(n_estimators=100, random_state=42)
        clf.fit(X, y)
        print("Trained model on all available samples.")
        
    # Save the model
    with open(MODEL_PATH, "wb") as f:
        pickle.dump({"model": clf, "classes": clf.classes_}, f)
        
    print(f"Model successfully saved to {MODEL_PATH}")

if __name__ == "__main__":
    main()
