"""
Predict plant disease from an image using the trained model.

Usage:
    python predict_disease.py <image_path> [model_path]

    image_path   - Path to the plant leaf image (required).
    model_path   - Absolute path to a .h5 model file (optional).
                   If omitted, falls back to models/disease_model.h5.

Output:
    JSON with disease name, confidence, severity, and treatment recommendations.
"""

import os
import sys
import json
import numpy as np
import tensorflow as tf

from preprocessing import preprocess_image_for_prediction

# Suppress TF logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, 'models')
DEFAULT_MODEL_PATH = os.path.join(MODELS_DIR, 'disease_model.h5')
METADATA_PATH = os.path.join(MODELS_DIR, 'disease_classes.json')


def _resolve_model_path(model_path=None):
    """Phase-5 Step-4: Resolve which .h5 model file to load.

    Priority:
      1. Explicit model_path argument (if provided and file exists).
      2. Fallback to DEFAULT_MODEL_PATH (models/disease_model.h5).
    """
    if model_path and os.path.exists(model_path):
        print(f"[Prediction] Using model: {model_path}", file=sys.stderr)
        return model_path

    if model_path:
        # Path was provided but file doesn't exist — warn and fallback
        print(f"[Prediction] ⚠️ Model not found: {model_path}", file=sys.stderr)

    print(f"[Prediction] Fallback: {DEFAULT_MODEL_PATH}", file=sys.stderr)
    return DEFAULT_MODEL_PATH

# Disease knowledge base (treatment tips for common diseases)
DISEASE_DB = {
    "Healthy": {
        "severity": "None",
        "treatment": ["Continue regular watering", "Maintain current fertilizer schedule", "Regularly inspect for pests"]
    },
    "Tomato_Early_Blight": {
        "severity": "Medium",
        "treatment": ["Remove infected leaves", "Use copper-based fungicide", "Improve air circulation around plants", "Water at the base to keep leaves dry"]
    },
    "Tomato_Late_Blight": {
        "severity": "High",
        "treatment": ["Remove and destroy infected plants immediately", "Apply fungicidal sprays (mancozeb, chlorothalonil)", "Ensure good drainage"]
    },
    "Potato_Early_Blight": {
        "severity": "Medium",
        "treatment": ["Use disease-free seed tubers", "Apply appropriate fungicides", "Practice crop rotation"]
    },
    "Potato_Late_Blight": {
        "severity": "High",
        "treatment": ["Apply protective fungicides before infection", "Destroy cull piles", "Harvest during dry weather"]
    },
    "Apple_Scab": {
        "severity": "Medium",
        "treatment": ["Rake up and destroy fallen leaves", "Apply fungicides during bud break", "Prune trees to increase airflow"]
    },
    "Bacterial_Spot": {
        "severity": "Medium",
        "treatment": ["Use disease-free seeds", "Apply copper-based bactericides", "Avoid overhead irrigation", "Rotate crops"]
    },
    "Leaf_Mold": {
        "severity": "Medium",
        "treatment": ["Improve air circulation", "Reduce humidity in greenhouse", "Apply appropriate fungicides", "Remove infected leaves"]
    },
    "Septoria_Leaf_Spot": {
        "severity": "Medium",
        "treatment": ["Remove infected lower leaves", "Apply fungicide early", "Avoid overhead watering", "Mulch around plants"]
    },
    "Spider_Mites": {
        "severity": "Medium",
        "treatment": ["Spray with water to dislodge mites", "Use miticides or insecticidal soap", "Introduce predatory mites", "Keep plants well-watered"]
    },
    "Target_Spot": {
        "severity": "Medium",
        "treatment": ["Remove and destroy infected plant debris", "Apply appropriate fungicides", "Ensure proper plant spacing"]
    },
    "Yellow_Leaf_Curl_Virus": {
        "severity": "High",
        "treatment": ["Remove and destroy infected plants", "Control whitefly vectors", "Use resistant varieties", "Apply insecticides for whiteflies"]
    },
    "Mosaic_Virus": {
        "severity": "High",
        "treatment": ["Remove and destroy infected plants", "Disinfect tools between plants", "Control aphid vectors", "Use resistant varieties"]
    },
    "Unknown_Disease": {
        "severity": "Unknown",
        "treatment": ["Isolate the plant", "Consult a local agricultural extension", "Ensure optimal watering and soil conditions"]
    }
}


def load_model_and_classes(model_path=None):
    """Loads the trained model and class label mapping.

    Args:
        model_path: Optional absolute path to a .h5 model file.
                    If None or file missing, falls back to default.
    """
    resolved_path = _resolve_model_path(model_path)

    if not os.path.exists(resolved_path):
        raise FileNotFoundError(f"Model not found at {resolved_path}. Please train the model first.")
    if not os.path.exists(METADATA_PATH):
        raise FileNotFoundError(f"Class metadata not found at {METADATA_PATH}. Please train the model first.")

    model = tf.keras.models.load_model(resolved_path)

    with open(METADATA_PATH, 'r') as f:
        meta_data = json.load(f)

    if isinstance(meta_data, dict) and "classes" in meta_data:
        labels_dict = meta_data["classes"]        # {str(int): class_name}
        model_name = meta_data.get("model_name", "efficientnetb0")
    else:
        # Legacy format: assume dict is the labels mapping directly
        labels_dict = meta_data
        model_name = "efficientnetb0"

    return model, labels_dict, model_name


def _match_disease_in_db(disease_name):
    """Finds the best matching entry in DISEASE_DB for a given disease name."""
    db_lookup = disease_name.replace(" ", "_")

    # Direct match
    for key in DISEASE_DB:
        if key.lower() == db_lookup.lower():
            return key

    # Partial match
    for key in DISEASE_DB:
        if key.lower() in db_lookup.lower() or db_lookup.lower() in key.lower():
            return key

    # Check for healthy
    if "healthy" in db_lookup.lower():
        return "Healthy"

    return "Unknown_Disease"


def predict(image_path, model_path=None):
    """Predicts disease from an image and returns structured JSON result.

    Args:
        image_path:  Path to the plant leaf image.
        model_path:  Optional absolute path to a .h5 model file.
    """
    try:
        model, labels_dict, model_name = load_model_and_classes(model_path)

        # Preprocess using the same pipeline as training
        img_array = preprocess_image_for_prediction(image_path, model_name=model_name)
        if img_array is None:
            raise ValueError(f"Failed to process image at {image_path}")

        # Predict
        predictions = model.predict(img_array, verbose=0)[0]
        predicted_class_idx = str(np.argmax(predictions))
        confidence = float(np.max(predictions)) * 100

        # Get class label from metadata
        disease_name = labels_dict.get(predicted_class_idx, "Unknown")

        # Find treatment info
        matched_disease = _match_disease_in_db(disease_name)
        disease_info = DISEASE_DB[matched_disease]

        # Prepare result
        result = {
            "disease": disease_name.replace("_", " "),  # Human-readable name
            "confidence": round(confidence, 2),
            "severity": disease_info["severity"],
            "treatment": disease_info["treatment"]
        }

        return result

    except Exception as e:
        return {"error": str(e)}


def main():
    if len(sys.argv) < 2 or len(sys.argv) > 3:
        print(json.dumps({"error": "Usage: predict_disease.py <image_path> [model_path]"}))
        sys.exit(1)

    image_path = sys.argv[1]
    # Phase-5 Step-4: Optional second argument for model path
    model_path = sys.argv[2] if len(sys.argv) == 3 else None

    if not os.path.exists(image_path):
        print(json.dumps({"error": f"Image not found at path: {image_path}"}))
        sys.exit(1)

    result = predict(image_path, model_path=model_path)
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
