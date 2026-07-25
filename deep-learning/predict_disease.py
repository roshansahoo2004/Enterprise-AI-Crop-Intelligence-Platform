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

# Disable GPU + suppress TensorFlow logs
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

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


def load_model_and_classes(model_path=None):
    """Load the TF/Keras model and class-label metadata.

    Args:
        model_path: Optional absolute path to a .h5 model file.
                    Falls back to DEFAULT_MODEL_PATH when omitted.

    Returns:
        Tuple of (model, labels_dict, model_name) where:
          - model:       a compiled ``tf.keras.Model`` ready for inference.
          - labels_dict: dict mapping class-index strings (``"0"``, ``"1"``, …)
                         to human-readable disease names.
          - model_name:  architecture identifier stored in the metadata
                         (e.g. ``"efficientnetb0"``), used to select the
                         correct preprocessing pipeline.
    """
    resolved_path = _resolve_model_path(model_path)

    # Load the Keras model
    model = tf.keras.models.load_model(resolved_path)
    print(f"[Prediction] Model loaded from {resolved_path}", file=sys.stderr)

    # Load class metadata
    with open(METADATA_PATH, "r") as f:
        metadata = json.load(f)

    labels_dict = metadata.get("classes", {})
    model_name = metadata.get("model_name", "unknown")

    return model, labels_dict, model_name


# ---------------------------------------------------------------------------
# Disease knowledge base — one entry per class in disease_classes.json
# Keys are **normalized** (lowercase, single underscores, no triple-underscores).
# ---------------------------------------------------------------------------
DISEASE_DB = {
    # ── Apple ───────────────────────────────────────────────────────────────
    "apple_apple_scab": {
        "severity": "Medium",
        "treatment": [
            "Rake up and destroy fallen leaves in autumn",
            "Apply fungicides (captan, myclobutanil) during bud break",
            "Prune trees to increase airflow",
            "Plant scab-resistant apple varieties",
        ],
    },
    "apple_black_rot": {
        "severity": "High",
        "treatment": [
            "Remove mummified fruits and cankered limbs",
            "Apply fungicide sprays during early season",
            "Maintain good tree hygiene by pruning dead wood",
            "Ensure proper sanitation of fallen debris",
        ],
    },
    "apple_cedar_apple_rust": {
        "severity": "Medium",
        "treatment": [
            "Remove nearby cedar/juniper trees if possible",
            "Apply fungicides (myclobutanil, mancozeb) at pink bud stage",
            "Plant rust-resistant apple varieties",
            "Prune galls from cedar trees in winter",
        ],
    },
    "apple_healthy": {
        "severity": "None",
        "treatment": [
            "Continue regular watering and fertilization",
            "Maintain pruning schedule for airflow",
            "Monitor for early signs of disease or pests",
        ],
    },
    # ── Blueberry ───────────────────────────────────────────────────────────
    "blueberry_healthy": {
        "severity": "None",
        "treatment": [
            "Maintain acidic soil pH (4.5-5.5)",
            "Continue regular watering and mulching",
            "Inspect regularly for pest activity",
        ],
    },
    # ── Cherry ──────────────────────────────────────────────────────────────
    "cherry_(including_sour)_powdery_mildew": {
        "severity": "Medium",
        "treatment": [
            "Apply sulfur-based or potassium bicarbonate fungicides",
            "Improve air circulation through pruning",
            "Remove and destroy infected leaves",
            "Avoid overhead watering",
        ],
    },
    "cherry_(including_sour)_healthy": {
        "severity": "None",
        "treatment": [
            "Continue proper irrigation and fertilization",
            "Prune for adequate sunlight and air circulation",
            "Monitor for common cherry pests",
        ],
    },
    # ── Corn (Maize) ────────────────────────────────────────────────────────
    "corn_(maize)_cercospora_leaf_spot_gray_leaf_spot": {
        "severity": "Medium",
        "treatment": [
            "Rotate crops away from corn for 1-2 years",
            "Use resistant corn hybrids",
            "Apply foliar fungicides (strobilurins, triazoles) if severe",
            "Till under crop residue to reduce inoculum",
        ],
    },
    "corn_(maize)_common_rust": {
        "severity": "Medium",
        "treatment": [
            "Plant resistant hybrids",
            "Apply fungicides if infection is detected early",
            "Scout fields regularly during warm, humid weather",
            "Remove volunteer corn plants",
        ],
    },
    "corn_(maize)_northern_leaf_blight": {
        "severity": "High",
        "treatment": [
            "Use resistant corn hybrids",
            "Apply foliar fungicides at early tassel stage",
            "Practice crop rotation with non-host crops",
            "Manage crop residue through tillage",
        ],
    },
    "corn_(maize)_healthy": {
        "severity": "None",
        "treatment": [
            "Continue balanced fertilization",
            "Ensure adequate water during tasseling",
            "Scout for pests regularly",
        ],
    },
    # ── Grape ───────────────────────────────────────────────────────────────
    "grape_black_rot": {
        "severity": "High",
        "treatment": [
            "Remove mummified berries and infected canes",
            "Apply fungicides (myclobutanil, mancozeb) before bloom",
            "Prune vines for good air circulation",
            "Practice canopy management to reduce humidity",
        ],
    },
    "grape_esca_(black_measles)": {
        "severity": "High",
        "treatment": [
            "Remove and destroy severely infected vines",
            "Protect pruning wounds with fungicidal paste",
            "Avoid large pruning wounds; prune during dry weather",
            "Use trunk injection treatments where available",
        ],
    },
    "grape_leaf_blight_(isariopsis_leaf_spot)": {
        "severity": "Medium",
        "treatment": [
            "Apply fungicides (mancozeb, copper-based) at first sign",
            "Remove infected leaves and debris",
            "Improve canopy airflow through pruning",
            "Avoid overhead irrigation",
        ],
    },
    "grape_healthy": {
        "severity": "None",
        "treatment": [
            "Maintain proper training and trellising",
            "Continue balanced nutrition and irrigation",
            "Monitor for early signs of fungal diseases",
        ],
    },
    # ── Orange ──────────────────────────────────────────────────────────────
    "orange_haunglongbing_(citrus_greening)": {
        "severity": "High",
        "treatment": [
            "Remove and destroy infected trees to prevent spread",
            "Control Asian citrus psyllid vectors with insecticides",
            "Plant disease-free nursery stock",
            "Apply nutritional sprays to extend tree productivity",
        ],
    },
    # ── Peach ───────────────────────────────────────────────────────────────
    "peach_bacterial_spot": {
        "severity": "Medium",
        "treatment": [
            "Apply copper-based bactericides during dormant season",
            "Use resistant peach cultivars",
            "Avoid overhead irrigation",
            "Prune to improve air circulation",
        ],
    },
    "peach_healthy": {
        "severity": "None",
        "treatment": [
            "Continue regular pruning and thinning",
            "Maintain balanced fertilization",
            "Monitor for borers and other common pests",
        ],
    },
    # ── Pepper (Bell) ───────────────────────────────────────────────────────
    "pepper,_bell_bacterial_spot": {
        "severity": "Medium",
        "treatment": [
            "Use disease-free seeds and transplants",
            "Apply copper-based bactericides",
            "Rotate crops for 2-3 years",
            "Avoid overhead irrigation and working with wet plants",
        ],
    },
    "pepper,_bell_healthy": {
        "severity": "None",
        "treatment": [
            "Continue regular watering and fertilization",
            "Maintain proper plant spacing",
            "Inspect for aphids, mites, and other pests",
        ],
    },
    # ── Potato ──────────────────────────────────────────────────────────────
    "potato_early_blight": {
        "severity": "Medium",
        "treatment": [
            "Use disease-free seed tubers",
            "Apply fungicides (chlorothalonil, mancozeb) preventatively",
            "Practice crop rotation with non-solanaceous crops",
            "Remove and destroy infected plant debris",
        ],
    },
    "potato_late_blight": {
        "severity": "High",
        "treatment": [
            "Apply protective fungicides before infection appears",
            "Destroy cull piles and volunteer plants",
            "Harvest during dry weather",
            "Use certified disease-free seed potatoes",
        ],
    },
    "potato_healthy": {
        "severity": "None",
        "treatment": [
            "Continue hilling and proper irrigation",
            "Monitor for Colorado potato beetle and aphids",
            "Maintain balanced fertilization",
        ],
    },
    # ── Raspberry ───────────────────────────────────────────────────────────
    "raspberry_healthy": {
        "severity": "None",
        "treatment": [
            "Continue proper pruning of spent canes",
            "Maintain good air circulation between rows",
            "Monitor for common pests like spider mites",
        ],
    },
    # ── Soybean ─────────────────────────────────────────────────────────────
    "soybean_healthy": {
        "severity": "None",
        "treatment": [
            "Continue balanced fertilization",
            "Scout regularly for soybean cyst nematode",
            "Maintain proper row spacing and plant population",
        ],
    },
    # ── Squash ──────────────────────────────────────────────────────────────
    "squash_powdery_mildew": {
        "severity": "Medium",
        "treatment": [
            "Apply fungicides (sulfur, potassium bicarbonate, neem oil)",
            "Improve air circulation around plants",
            "Water at the base; avoid wetting foliage",
            "Plant resistant squash varieties",
        ],
    },
    # ── Strawberry ──────────────────────────────────────────────────────────
    "strawberry_leaf_scorch": {
        "severity": "Medium",
        "treatment": [
            "Remove and destroy infected leaves",
            "Apply fungicides during renovation",
            "Improve air circulation through proper spacing",
            "Use drip irrigation instead of overhead watering",
        ],
    },
    "strawberry_healthy": {
        "severity": "None",
        "treatment": [
            "Continue proper watering and mulching",
            "Remove runners to maintain plant vigor",
            "Monitor for slugs, mites, and fungal diseases",
        ],
    },
    # ── Tomato ──────────────────────────────────────────────────────────────
    "tomato_bacterial_spot": {
        "severity": "Medium",
        "treatment": [
            "Use disease-free seeds and transplants",
            "Apply copper-based bactericides early",
            "Avoid overhead irrigation",
            "Rotate crops for at least 2 years",
        ],
    },
    "tomato_early_blight": {
        "severity": "Medium",
        "treatment": [
            "Remove infected lower leaves promptly",
            "Apply copper-based fungicide or chlorothalonil",
            "Improve air circulation around plants",
            "Water at the base to keep foliage dry",
        ],
    },
    "tomato_late_blight": {
        "severity": "High",
        "treatment": [
            "Remove and destroy infected plants immediately",
            "Apply fungicidal sprays (mancozeb, chlorothalonil)",
            "Ensure good drainage and air circulation",
            "Avoid planting near potatoes",
        ],
    },
    "tomato_leaf_mold": {
        "severity": "Medium",
        "treatment": [
            "Improve air circulation in greenhouse or field",
            "Reduce humidity by proper ventilation",
            "Apply appropriate fungicides",
            "Remove infected leaves promptly",
        ],
    },
    "tomato_septoria_leaf_spot": {
        "severity": "Medium",
        "treatment": [
            "Remove infected lower leaves immediately",
            "Apply fungicide early in the season",
            "Avoid overhead watering",
            "Mulch around plants to reduce soil splash",
        ],
    },
    "tomato_spider_mites_two-spotted_spider_mite": {
        "severity": "Medium",
        "treatment": [
            "Spray plants with strong water jet to dislodge mites",
            "Apply miticides or insecticidal soap",
            "Introduce predatory mites for biological control",
            "Keep plants well-watered to reduce stress",
        ],
    },
    "tomato_target_spot": {
        "severity": "Medium",
        "treatment": [
            "Remove and destroy infected plant debris",
            "Apply appropriate fungicides (chlorothalonil, mancozeb)",
            "Ensure proper plant spacing for airflow",
            "Rotate with non-solanaceous crops",
        ],
    },
    "tomato_tomato_yellow_leaf_curl_virus": {
        "severity": "High",
        "treatment": [
            "Remove and destroy infected plants immediately",
            "Control whitefly vectors with insecticides or traps",
            "Use resistant tomato varieties",
            "Apply reflective mulch to repel whiteflies",
        ],
    },
    "tomato_tomato_mosaic_virus": {
        "severity": "High",
        "treatment": [
            "Remove and destroy infected plants",
            "Disinfect all tools and hands between plants",
            "Control aphid vectors with insecticides",
            "Use resistant tomato varieties",
        ],
    },
    "tomato_healthy": {
        "severity": "None",
        "treatment": [
            "Continue regular watering and balanced fertilization",
            "Maintain staking/caging for support",
            "Monitor for pests and early disease symptoms",
        ],
    },
    # ── Fallback ────────────────────────────────────────────────────────────
    "unknown_disease": {
        "severity": "Unknown",
        "treatment": [
            "Isolate the plant from healthy specimens",
            "Consult a local agricultural extension office",
            "Ensure optimal watering, soil nutrition, and drainage",
            "Take clear photos and seek expert diagnosis",
        ],
    },
}


def _normalize_disease_name(name):
    """Normalize a disease name for consistent DISEASE_DB lookup.

    Transformations applied:
      1. Replace triple-underscore separators (``___``) with a single underscore.
      2. Replace remaining spaces with underscores.
      3. Collapse multiple consecutive underscores into one.
      4. Strip leading/trailing underscores.
      5. Convert to lowercase.
    """
    normalized = name.replace("___", "_")   # e.g. Apple___Apple_scab  -> Apple_Apple_scab
    normalized = normalized.replace(" ", "_")  # spaces -> underscores
    # Collapse runs of underscores
    while "__" in normalized:
        normalized = normalized.replace("__", "_")
    normalized = normalized.strip("_")
    return normalized.lower()


def _match_disease_in_db(disease_name):
    """Find the best-matching DISEASE_DB entry for *disease_name*.

    Match strategy (in priority order):
      1. **Exact match** after normalization.
      2. **Substring / partial match** — the query is contained in a key or
         vice-versa.
      3. **Token-overlap fuzzy match** — pick the key that shares the most
         unique word tokens with the query (minimum 2 shared tokens required).
      4. **"healthy" keyword fallback** — any name containing "healthy" maps
         to the plant-specific healthy entry if one exists, otherwise to a
         generic healthy response.
      5. **Unknown_Disease** as the final fallback.
    """
    query = _normalize_disease_name(disease_name)

    # 1. Exact match (keys are already lowercase)
    if query in DISEASE_DB:
        return query

    # 2. Substring / partial match
    for key in DISEASE_DB:
        if key in query or query in key:
            return key

    # 3. Token-overlap fuzzy match
    query_tokens = set(query.replace("_", " ").split())
    best_key = None
    best_overlap = 0
    for key in DISEASE_DB:
        if key == "unknown_disease":
            continue
        key_tokens = set(key.replace("_", " ").split())
        overlap = len(query_tokens & key_tokens)
        if overlap > best_overlap:
            best_overlap = overlap
            best_key = key
    if best_key and best_overlap >= 2:
        return best_key

    # 4. "healthy" keyword fallback
    if "healthy" in query:
        # Try to find a plant-specific healthy entry
        plant_word = query.split("_")[0] if "_" in query else ""
        for key in DISEASE_DB:
            if "healthy" in key and plant_word and key.startswith(plant_word):
                return key
        # Generic healthy
        for key in DISEASE_DB:
            if key.endswith("_healthy") or key == "healthy":
                return key

    return "unknown_disease"



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

        # Prepare human-readable disease name (clean up separators)
        display_name = disease_name.replace("___", " ").replace("_", " ")
        # Collapse any duplicate spaces
        while "  " in display_name:
            display_name = display_name.replace("  ", " ")
        display_name = display_name.strip()

        # Prepare result
        result = {
            "disease": display_name,
            "confidence": round(confidence, 2),
            "severity": disease_info["severity"],
            "treatment": disease_info["treatment"]
        }
        return result

    except Exception as e:
        print(f"[Prediction Error] {e}", file=sys.stderr)
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
