"""
Crop Prediction CLI Script
============================
Called by Node.js backend via child_process.spawn
Usage: python predict.py <N> <P> <K> <temperature> <humidity> <ph> <rainfall>
Returns: JSON to stdout with predicted crop, confidence, season, and care tips
"""

import os
import sys
import json
import numpy as np
import joblib

# ─── Paths ───────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'best_model.pkl')
SCALER_PATH = os.path.join(BASE_DIR, 'scalers', 'scaler.pkl')
ENCODER_PATH = os.path.join(BASE_DIR, 'scalers', 'label_encoder.pkl')

# ─── Crop Season Mapping ────────────────────────────────────────────────────
CROP_SEASONS = {
    "rice": "Kharif (June–October)",
    "maize": "Kharif (June–October)",
    "chickpea": "Rabi (October–March)",
    "kidneybeans": "Rabi (October–March)",
    "pigeonpeas": "Kharif (June–October)",
    "mothbeans": "Kharif (June–October)",
    "mungbean": "Kharif (June–October)",
    "blackgram": "Kharif (June–October)",
    "lentil": "Rabi (October–March)",
    "pomegranate": "Year-round (perennial)",
    "banana": "Year-round (perennial)",
    "mango": "Summer (March–June)",
    "grapes": "Winter (November–February)",
    "watermelon": "Summer (March–June)",
    "muskmelon": "Summer (March–June)",
    "apple": "Year-round (perennial, harvest Aug–Oct)",
    "orange": "Winter (November–March)",
    "papaya": "Year-round (perennial)",
    "coconut": "Year-round (perennial)",
    "cotton": "Kharif (June–October)",
    "jute": "Kharif (April–August)",
    "coffee": "Year-round (perennial, harvest Nov–Feb)",
}

# ─── Crop Care Tips ──────────────────────────────────────────────────────────
CROP_TIPS = {
    "rice": [
        "Maintain 2-5 cm standing water during vegetative growth phase.",
        "Apply nitrogen fertilizer in 3 splits: basal, tillering, and panicle initiation.",
        "Monitor for blast disease and brown plant hopper regularly.",
        "Harvest when 80% of grains turn golden yellow."
    ],
    "maize": [
        "Ensure proper spacing of 60×25 cm for optimal growth.",
        "Apply zinc sulphate at 25 kg/ha to prevent zinc deficiency.",
        "Irrigate at critical stages: knee-high, tasseling, and grain filling.",
        "Watch for fall armyworm and stem borer infestations."
    ],
    "chickpea": [
        "Avoid excessive watering as chickpea is drought-tolerant.",
        "Seed treatment with Rhizobium culture improves nitrogen fixation.",
        "Wilt disease is common — use resistant varieties like JG 11.",
        "Harvest when leaves turn reddish-brown and pods are dry."
    ],
    "kidneybeans": [
        "Prefers well-drained loamy soil with pH 5.5-7.0.",
        "Avoid waterlogging as it leads to root rot.",
        "Apply phosphorus at sowing for better root development.",
        "Harvest when pods turn yellow and start drying."
    ],
    "pigeonpeas": [
        "Intercrop with short-duration crops like groundnut for better land use.",
        "Deep plowing before sowing improves root penetration.",
        "Spray neem-based pesticide for pod borer management.",
        "Takes 5-9 months to mature depending on variety."
    ],
    "mothbeans": [
        "Highly drought-resistant — ideal for arid regions.",
        "Sow after first monsoon rain for optimal germination.",
        "Minimal fertilizer requirement — 20 kg N + 40 kg P per hectare.",
        "Harvest when pods turn brown and seeds rattle inside."
    ],
    "mungbean": [
        "Short duration crop (60-75 days) — excellent for crop rotation.",
        "Seed treatment with Carbendazim prevents seedling diseases.",
        "Avoid sowing in waterlogged areas.",
        "Harvest in morning to prevent pod shattering."
    ],
    "blackgram": [
        "Prefers well-drained soil and warm, humid climate.",
        "Apply seed inoculant with Rhizobium for nitrogen fixation.",
        "Yellow mosaic virus is a major threat — use resistant varieties.",
        "Pods mature at different times — multiple pickings may be needed."
    ],
    "lentil": [
        "Requires cool temperatures during vegetative growth.",
        "Avoid heavy clay soils — prefers sandy loam.",
        "Pre-sowing irrigation ensures good germination.",
        "Harvest when lower pods turn brown to avoid shattering."
    ],
    "pomegranate": [
        "Prune annually to maintain open canopy for air circulation.",
        "Apply potassium fertilizer for better fruit color and sweetness.",
        "Bag fruits to protect from fruit borers and sun scald.",
        "Harvest when skin develops a metallic sound on tapping."
    ],
    "banana": [
        "Provide windbreaks to protect from strong winds.",
        "Apply potassium-rich fertilizer at monthly intervals.",
        "Remove dry leaves and suckers regularly for better growth.",
        "Harvest when fingers are plump and ridges become rounded."
    ],
    "mango": [
        "Prune after harvest to encourage new growth for next season.",
        "Spray fungicide during flowering to prevent anthracnose.",
        "Irrigate during fruit development stage for larger fruits.",
        "Avoid excessive nitrogen as it promotes vegetative growth over fruiting."
    ],
    "grapes": [
        "Train vines on a trellis system (Y-shape or overhead pergola).",
        "Apply gibberellic acid for seedless berry development.",
        "Maintain canopy management for proper air circulation.",
        "Monitor for powdery and downy mildew during humid weather."
    ],
    "watermelon": [
        "Requires full sunlight and warm temperatures (25-30°C).",
        "Mulching helps retain soil moisture and suppress weeds.",
        "Pollination by bees is essential — avoid insecticides during flowering.",
        "Tap the fruit — a hollow sound indicates ripeness."
    ],
    "muskmelon": [
        "Requires well-drained sandy loam soil with good organic matter.",
        "Train vines vertically in net houses for premium quality.",
        "Reduce irrigation 1 week before harvest for sweeter fruits.",
        "Harvest when the fruit slips easily from the stem."
    ],
    "apple": [
        "Requires 1000-1500 chilling hours below 7°C for proper fruiting.",
        "Apply calcium sprays to prevent bitter pit disorder.",
        "Thin fruits to 1-2 per cluster for larger size.",
        "Harvest when background color changes from green to yellowish."
    ],
    "orange": [
        "Apply micronutrients (Zn, Fe, Mn) through foliar sprays.",
        "Maintain basin irrigation — avoid water touching the trunk.",
        "Citrus canker management requires copper-based sprays.",
        "Harvest when TSS:acid ratio reaches 10-12:1."
    ],
    "papaya": [
        "Plant in raised beds in areas with heavy rainfall.",
        "Apply balanced NPK fertilizer at monthly intervals.",
        "Remove male plants leaving only 10% for pollination.",
        "Harvest when green color starts turning yellow at the tip."
    ],
    "coconut": [
        "Apply 50 kg organic manure per tree annually.",
        "Maintain basin around tree for efficient irrigation.",
        "Intercrop with shade-tolerant crops like cocoa or pepper.",
        "Harvest every 45 days for tender coconut or 12 months for copra."
    ],
    "cotton": [
        "Use Bt cotton varieties for bollworm resistance.",
        "Maintain proper plant spacing (90×60 cm) for mechanical picking.",
        "Apply potassium during boll development for fiber quality.",
        "Pick cotton in morning when moisture content is optimal."
    ],
    "jute": [
        "Requires standing water for retting after harvest.",
        "Sow seeds broadcast or in lines at 25 cm spacing.",
        "Harvest at small pod stage (120-150 days) for best fiber quality.",
        "Ribbon retting produces better quality fiber than whole-plant retting."
    ],
    "coffee": [
        "Provide 40-50% shade using silver oak or other shade trees.",
        "Apply organic mulch around plants to conserve moisture.",
        "Prune to maintain 6-8 primary branches per plant.",
        "Hand-pick only red ripe cherries for premium quality beans."
    ],
}


def predict_crop(features):
    """Load model and predict crop from input features."""
    # Load saved artifacts
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    label_encoder = joblib.load(ENCODER_PATH)

    # Prepare input
    input_array = np.array(features).reshape(1, -1)
    input_scaled = scaler.transform(input_array)

    # Predict
    prediction = model.predict(input_scaled)[0]
    probabilities = model.predict_proba(input_scaled)[0]

    # Decode
    crop_name = label_encoder.inverse_transform([prediction])[0]
    confidence = float(np.max(probabilities)) * 100

    # Get season and tips
    season = CROP_SEASONS.get(crop_name, "Consult local agricultural advisory")
    tips = CROP_TIPS.get(crop_name, ["No specific tips available for this crop."])

    # Get top 3 predictions (backward compatibility)
    top3_indices = np.argsort(probabilities)[-3:][::-1]
    top3 = []
    for idx in top3_indices:
        top3.append({
            "crop": label_encoder.inverse_transform([idx])[0],
            "confidence": round(float(probabilities[idx]) * 100, 2)
        })

    # Get top 5 predictions (Phase-8: prediction distribution)
    num_classes = len(probabilities)
    top_n = min(5, num_classes)
    top5_indices = np.argsort(probabilities)[-top_n:][::-1]
    top5 = []
    for idx in top5_indices:
        top5.append({
            "crop": label_encoder.inverse_transform([idx])[0],
            "confidence": round(float(probabilities[idx]) * 100, 2)
        })

    return {
        "crop": crop_name,
        "confidence": round(confidence, 2),
        "season": season,
        "tips": tips,
        "top3": top3,
        "top5": top5
    }


def main():
    if len(sys.argv) != 8:
        error = {
            "error": "Expected 7 arguments: N P K temperature humidity ph rainfall",
            "usage": "python predict.py <N> <P> <K> <temperature> <humidity> <ph> <rainfall>"
        }
        print(json.dumps(error))
        sys.exit(1)

    try:
        features = [float(arg) for arg in sys.argv[1:8]]
        result = predict_crop(features)
        print(json.dumps(result))
    except FileNotFoundError:
        print(json.dumps({"error": "Model not found. Run train_model.py first."}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == '__main__':
    main()
