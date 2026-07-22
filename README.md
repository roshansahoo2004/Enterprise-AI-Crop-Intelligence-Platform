# 🌾 Enterprise AI Crop Intelligence Platform

> **Release Candidate v1.0** — Production-Grade AI Decision-Support System for Precision Agriculture, Crop Yield Optimization, Disease Diagnostics, and MLOps Lifecycle Governance.

---

## 📋 Overview

The **Enterprise AI Crop Intelligence Platform** is a full-stack, AI-powered agricultural planning and decision-support ecosystem. Built using Node.js, Express, React (Vite/TailwindCSS), MongoDB, and Groq LLM architecture, the platform enables farmers and agricultural administrators to run precision crop recommendation models, ResNet50/EfficientNet leaf pathology diagnostics, ML-driven yield and revenue estimation, national disease outbreak heatmaps, and context-aware conversational AI assistance.

---

## 🏗️ Platform Architecture

```mermaid
graph TD
  subgraph Client Console (React + Vite + TailwindCSS)
    UI["Dashboard & User Consoles"]
    AI["Groq AI Copilot (/assistant)"]
    Admin["MLOps Operations & Observability"]
  end

  subgraph Express API Layer
    Auth["JWT Auth & Rate Limiter"]
    PredictCtrl["Crop Prediction Engine"]
    DiseaseCtrl["ResNet50 Pathology Engine"]
    YieldCtrl["ML Yield Estimator"]
    GroqSvc["Groq LLM Service (llama-3.3-70b)"]
    ObsSvc["Centralized Observability Layer"]
  end

  subgraph Persistence & External Integrations
    Mongo[("MongoDB Database")]
    Weather["Open-Meteo & OpenWeather APIs"]
    Models["Active Model Serving Layer (v1.1)"]
  end

  UI --> Auth
  Auth --> PredictCtrl
  Auth --> DiseaseCtrl
  Auth --> YieldCtrl
  AI --> GroqSvc
  Admin --> ObsSvc
  PredictCtrl --> Models
  DiseaseCtrl --> Models
  PredictCtrl --> Mongo
  YieldCtrl --> Mongo
  ObsSvc --> Mongo
  GroqSvc --> Weather
```

---

## ⭐ Key Features

1. **Precision Crop Recommendation Engine**:
   - Random Forest model evaluating soil Nitrogen, Phosphorus, Potassium, pH, rainfall, temperature, and humidity telemetry to recommend optimal crops with confidence scores.

2. **ResNet50 / EfficientNet Leaf Disease Pathology Diagnostics**:
   - Deep learning computer vision image diagnostic pipeline predicting disease pathology, severity levels, treatment protocols, and isolation steps.

3. **AI Yield & Revenue Estimator**:
   - Tonnage estimation (tons/ha), gross revenue ($), and net profit margin projections based on soil telemetry and field dimensions.

4. **Groq Llama-3.3 Conversational AI Copilot**:
   - Context-aware agronomist copilot integrating live weather, soil health index, disease history, yield estimates, and persistent session memory. Includes 1-click **Generate AI Farm Report (PDF)** export.

5. **Disease Intelligence Outbreak Heatmap**:
   - Interactive regional epidemic surveillance mapping active outbreaks, risk levels (`Critical`, `High`, `Medium`, `Low`), and 4-week surge trends across major agricultural zones.

6. **Smart Crop Lifecycle Calendar**:
   - Automated 6-stage crop growth timeline with weather-aware irrigation alerts and N-P-K fertilizer top-dressing directives.

7. **Enterprise MLOps & System Observability Center**:
   - Datadog/Grafana-style observability console tracking API latency timeseries, memory heap usage, database document counts, model drift (Data, Feature, Confidence), automated retraining pipelines, and governance compliance.

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend UI** | React 19, Vite, TailwindCSS, Recharts, Framer Motion, React Router 7 |
| **Backend Server** | Node.js, Express.js, JWT Authentication, Security Sanitizer, Rate Limiter |
| **Database** | MongoDB (Mongoose ODM) |
| **AI / ML Models** | Random Forest (Crop Rec), ResNet50 / EfficientNet (Disease Detection), Groq LLM (llama-3.3-70b) |
| **Telemetry APIs** | Open-Meteo Weather API, OSM Nominatim Reverse Geocoding |

---

## 📁 Project Structure

```
AI-Crop-System/
├── client/                      # React Frontend Console
│   ├── src/
│   │   ├── components/          # Reusable UI Primitives & Response Cards
│   │   ├── context/             # Auth Context Provider
│   │   ├── hooks/               # Custom Hooks (useWeather, useIoT)
│   │   ├── pages/               # Application Pages (Dashboard, Predict, Assistant, MLOps)
│   │   ├── services/            # Axios API Client Wrappers
│   │   ├── utils/               # PDF Generator, Toast Notifications
│   │   └── App.jsx              # Lazy Route Definitions & Fallbacks
├── server/                      # Express Backend Server
│   ├── config/                  # DB Connection & Env Validation
│   ├── controllers/             # Core & Admin API Controllers
│   ├── middleware/              # Auth, Error Handler, Security Sanitizer
│   ├── models/                  # Mongoose Schema Definitions
│   ├── routes/                  # Express Endpoint Definitions
│   ├── services/                # Model Serving, Groq Service, Weather Caching
│   └── server.js                # Server Entrypoint & Shutdown Handlers
```

---

## 🚀 Installation & Setup Instructions

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally or a MongoDB Atlas URI

### 1. Backend Environment Configuration
Create a `.env` file inside the `server/` directory:
```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb://localhost:27017/crop-planning
JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:5173
GROQ_API_KEY=your_groq_api_key_here
OPENWEATHER_API_KEY=your_openweather_key_optional
```

### 2. Install & Start Server
```bash
cd server
npm install
npm start
```

### 3. Install & Build Client
```bash
cd client
npm install
npm run build
```

---

## 📖 API Documentation Summary

| Route Path | Method | Auth | Description |
|------------|--------|------|-------------|
| `/api/auth/register` | POST | Public | User registration with hashed password |
| `/api/auth/login` | POST | Public | User login returning JWT token |
| `/api/predict/recommend` | POST | User | Run ML crop recommendation inference |
| `/api/disease/detect` | POST | User | Run leaf pathology diagnostic image scan |
| `/api/yield/predict` | POST | User | Estimate harvest tonnage & revenue |
| `/api/assistant/chat` | POST | User | Send query to Groq AI Copilot with context |
| `/api/assistant/farm-report` | GET | User | Fetch consolidated telemetry for PDF report |
| `/api/disease-heatmap/regions` | GET | User | Regional disease risk metrics |
| `/api/crop-calendar/schedule` | GET | User | 6-stage crop lifecycle timeline |
| `/api/admin/observability/metrics` | GET | Admin | System health score, memory, & model metrics |

---

## 🛡️ Security & Performance Verification

- [x] **Rate Limiting**: 50 max authentication attempts per 15-minute window.
- [x] **Input Sanitization**: Express middleware strips `$`, HTML, and `<script>` injections from input parameters.
- [x] **Weather Caching**: 12-minute in-memory caching in `weatherService.js` prevents duplicate external requests.
- [x] **Global Error Handling**: Top-level `<ErrorBoundary>` catches component crashes gracefully.
- [x] **Zero React Warnings/Errors**: production bundle built cleanly (`npm run build`).

---

## 📝 License & Release Status

- **Status**: Release Candidate v1.0 (Production Ready)
- **License**: MIT Enterprise Agriculture License
