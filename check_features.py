import numpy as np
import pandas as pd

BASE = r"C:\ASL_Project\asl_training"

train = pd.read_csv(BASE + r"\train.csv")

print("========== FEATURE CHECK ==========")
print("Total training samples:", len(train))
print("Number of classes:", train["label"].nunique())

# Check first 10 feature files
for i, row in train.head(10).iterrows():
    feature_file = row["feature"]
    label = row["label"]

    x = np.load(feature_file)

    print(
        f"{i+1}. {label:15s} "
        f"Shape={x.shape} "
        f"Mean={x.mean():.4f} "
        f"Std={x.std():.4f} "
        f"Min={x.min():.4f} "
        f"Max={x.max():.4f}"
    )

print("\n========== CLASS DISTRIBUTION ==========")
print(train["label"].value_counts().sort_index())

print("\n========== CHECK COMPLETE ==========")