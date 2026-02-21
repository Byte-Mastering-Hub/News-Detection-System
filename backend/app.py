"""
SIMPLE Flask API for Fake News Detection
Connects directly to your frontend
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import re
import string
import os
from pathlib import Path

app = Flask(__name__)
CORS(app)  # Allow frontend to connect

# Model paths
MODEL_PATH = "../model/model.pkl"
VECTORIZER_PATH = "../model/vectorizer.pkl"

# Load model and vectorizer
print("📂 Loading model...")
if os.path.exists(MODEL_PATH) and os.path.exists(VECTORIZER_PATH):
    model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)
    print("✅ Model loaded successfully!")
else:
    print("❌ Model files not found!")
    print("   Please run train_simple.py first")
    model = None
    vectorizer = None

def clean_text(text):
    """Simple text cleaning (same as training)"""
    if not isinstance(text, str):
        text = str(text)
    text = text.lower()
    text = text.translate(str.maketrans('', '', string.punctuation))
    text = re.sub(r'\s+', ' ', text).strip()
    return text

@app.route('/api/health', methods=['GET'])
def health():
    """Check if API is running"""
    return jsonify({
        'status': 'ok',
        'model_loaded': model is not None
    })

@app.route('/api/analyze', methods=['POST'])
def analyze():
    """Main prediction endpoint"""
    try:
        # Check if model is loaded
        if model is None:
            return jsonify({
                'error': 'Model not loaded',
                'message': 'Please train the model first'
            }), 503

        # Get text from request
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400

        text = data['text'].strip()
        
        # Check length
        if len(text) < 20:
            return jsonify({
                'error': 'Text too short',
                'message': 'Please enter at least 20 characters'
            }), 400

        # Clean and vectorize text
        cleaned = clean_text(text)
        vectorized = vectorizer.transform([cleaned])
        
        # Make prediction
        prediction = model.predict(vectorized)[0]
        probabilities = model.predict_proba(vectorized)[0]
        
        # Calculate confidence
        confidence = probabilities[prediction] * 100
        
        # Prepare response for frontend
        result = {
            'prediction': 'FAKE' if prediction == 1 else 'REAL',
            'confidence': round(confidence, 2),
            'is_fake': bool(prediction == 1),
            'is_real': bool(prediction == 0),
            'probabilities': {
                'real': round(probabilities[0] * 100, 2),
                'fake': round(probabilities[1] * 100, 2)
            }
        }
        
        print(f"📊 Prediction: {result['prediction']} ({result['confidence']}%)")
        return jsonify(result)

    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'name': 'Fake News Detector API',
        'endpoints': {
            '/api/health': 'GET - Check API status',
            '/api/analyze': 'POST - Analyze text'
        }
    })

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🚀 Starting Fake News Detector API")
    print("="*50)
    print("📍 URL: http://localhost:5000")
    print("📝 Test: curl http://localhost:5000/api/health")
    print("="*50 + "\n")
    app.run(host='0.0.0.0', port=5000, debug=True)