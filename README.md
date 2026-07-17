# AI-Based Seasonal Crop Planning System

An advanced full-stack application that leverages Machine Learning (Random Forest & XGBoost) to recommend optimal crops based on soil nutrients and environmental conditions.

## Features

- **Machine Learning**: Random Forest + XGBoost ensemble model trained on 2200 samples of 22 different crops.
- **Frontend**: React + Vite + Tailwind CSS with a beautiful dark glassmorphism UI.
- **Backend**: Node.js + Express + MongoDB for robust API handling.
- **Authentication**: JWT-based secure authentication.
- **IoT Simulation**: Live real-time dashboard showing simulated soil/weather sensors.
- **Weather Integration**: OpenWeather API auto-fills environmental data.
- **Analytics**: Recharts visualizations of historical prediction trends.

## Prerequisites

- Node.js v16+
- Python 3.9+
- MongoDB instance (local or Atlas)

## Running the Application Locally

### 1. Start the MongoDB database
Make sure your MongoDB server is running locally on port `27017` (or update the URI in `server/.env`).

### 2. Train the Machine Learning Model
Generate the dataset and train the Python ML models:
```bash
cd ml
pip install -r requirements.txt
python ../dataset/generate_dataset.py
python train_model.py
```
This will save `best_model.pkl`, `scaler.pkl`, and `label_encoder.pkl` in `ml/models` and `ml/scalers`.

### 3. Run the Backend Server
```bash
cd server
npm install
# Copy .env.example to .env and configure it
cp .env.example .env
npm run dev
```
The backend will run on `http://localhost:5000`.

### 4. Run the React Frontend
Open a new terminal window:
```bash
cd client
npm install
npm run dev
```
The frontend will run on `http://localhost:5173`.

## Folder Structure

- `/client` - React frontend (Vite, Tailwind, Recharts)
- `/server` - Node.js backend (Express, Mongoose, JWT)
- `/ml` - Python scripts for training and prediction
- `/dataset` - Script to generate synthetic agricultural data
