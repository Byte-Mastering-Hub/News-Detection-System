"""
SIMPLE Fake News Detection Training
Just loads CSV, does basic preprocessing, trains model
"""

import pandas as pd
import numpy as np
import re
import string
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
import os

print("="*50)
print("FAKE NEWS DETECTOR - TRAINING")
print("="*50)

# File paths
FAKE_CSV = "../data/Fake.csv"
REAL_CSV = "../data/Real.csv" 

# Check if files exist
if not os.path.exists(FAKE_CSV):
    print(f"❌ ERROR: {FAKE_CSV} not found!")
    exit(1)
if not os.path.exists(REAL_CSV):
    print(f"❌ ERROR: {REAL_CSV} not found!")
    exit(1)

print("✅ Dataset files found!")

# Step 1: Load datasets
print("\n📂 Loading datasets...")
fake_df = pd.read_csv(FAKE_CSV)
real_df = pd.read_csv(REAL_CSV)

print(f"   Fake news: {len(fake_df)} articles")
print(f"   Real news: {len(real_df)} articles")

# Step 2: Add labels
fake_df['label'] = 1  # 1 = Fake
real_df['label'] = 0  # 0 = Real

# Step 3: Combine datasets
df = pd.concat([fake_df, real_df], ignore_index=True)
print(f"   Total: {len(df)} articles")

# Step 4: Check for null values
print("\n🧹 Checking for null values...")
print(df.isnull().sum())

# Step 5: Remove null values
df = df.dropna()
print(f"   After removing nulls: {len(df)} articles")

# Step 6: Combine title and text for better analysis
df['content'] = df['title'].fillna('') + " " + df['text'].fillna('')

# Step 7: Simple preprocessing function
def simple_clean(text):
    """Basic text cleaning"""
    if not isinstance(text, str):
        text = str(text)
    # Lowercase
    text = text.lower()
    # Remove punctuation
    text = text.translate(str.maketrans('', '', string.punctuation))
    # Remove extra spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text

print("\n🧹 Cleaning text...")
df['clean_text'] = df['content'].apply(simple_clean)

# Step 8: Create TF-IDF features
print("\n🔧 Creating TF-IDF features...")
vectorizer = TfidfVectorizer(max_features=5000, stop_words='english')
X = vectorizer.fit_transform(df['clean_text'])
y = df['label']

print(f"   Feature matrix shape: {X.shape}")

# Step 9: Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"   Training set: {X_train.shape[0]} articles")
print(f"   Test set: {X_test.shape[0]} articles")

# Step 10: Train model
print("\n🤖 Training Logistic Regression model...")
model = LogisticRegression(max_iter=1000)
model.fit(X_train, y_train)

# Step 11: Evaluate
accuracy = model.score(X_test, y_test)
print(f"✅ Model accuracy: {accuracy*100:.2f}%")

# Step 12: Save models
print("\n💾 Saving models...")
os.makedirs("../model", exist_ok=True)
joblib.dump(model, "../model/model.pkl")
joblib.dump(vectorizer, "../model/vectorizer.pkl")
print(f"✅ Model saved to: ../model/model.pkl")
print(f"✅ Vectorizer saved to: ../model/vectorizer.pkl")

print("\n" + "="*50)
print("🎉 TRAINING COMPLETE!")
print("="*50)
print("\nNow run: python app.py")