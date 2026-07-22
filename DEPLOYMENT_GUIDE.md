# Enterprise AI Crop Planning System — Production Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the **AI Crop Planning System** in production across **Vercel** (Frontend), **Render / Railway** (Backend), and **MongoDB Atlas** (Managed Database).

---

## 1. Prerequisites & Environment Setup

### Required Services
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) Account (Free or Shared Cluster)
- [Vercel](https://vercel.com) Account (Frontend Hosting)
- [Render](https://render.com) or [Railway](https://railway.app) Account (Node.js Express Backend)

---

## 2. Database Setup (MongoDB Atlas)

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/) and create a cluster.
2. Under **Database Access**, create a user with `Read and Write to any database` permissions.
3. Under **Network Access**, add IP address `0.0.0.0/0` (Allow access from anywhere for cloud deployment).
4. Click **Connect** → **Drivers** → Copy the Connection String:
   ```text
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/ai-crop-system?retryWrites=true&w=majority
   ```

---

## 3. Backend Deployment (Render)

1. Push your repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com/), click **New** → **Web Service**.
3. Connect your GitHub repository and select the root directory or `server/`.
4. Configure Build settings:
   - **Environment**: `Node`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Add Environment Variables under **Environment**:
   - `MONGO_URI`: *<Your MongoDB Atlas Connection String>*
   - `JWT_SECRET`: *<Your random 32-character secret key>*
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `CLIENT_URL`: `https://your-app-name.vercel.app`
6. Click **Deploy Web Service**.
7. Copy your backend URL (e.g. `https://ai-crop-backend.onrender.com`).

---

## 4. Frontend Deployment (Vercel)

1. In [Vercel Dashboard](https://vercel.com/), click **Add New Project** and select your GitHub repository.
2. Select Root Directory: `client`.
3. Framework Preset: **Vite**.
4. Configure Environment Variables:
   - `VITE_API_BASE_URL`: `https://ai-crop-backend.onrender.com/api`
5. Click **Deploy**. Vercel will automatically build Vite and deploy to CDN.

---

## 5. Verification & Health Monitoring

Once both frontend and backend are deployed:
1. Verify API Health: Navigating to `https://ai-crop-backend.onrender.com/health` should return:
   ```json
   {
     "success": true,
     "status": "UP",
     "ready": true,
     "uptimeSeconds": 120,
     "environment": "production",
     "version": "1.0.0",
     "database": {
       "status": "Connected",
       "readyState": 1
     }
   }
   ```
2. Open your Vercel URL, log in as administrator, and verify all 16 operational consoles load cleanly!

---

## 6. Production Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| `CORS Error` on API requests | `CLIENT_URL` mismatch | Ensure `CLIENT_URL` in backend matches exact Vercel deployment URL |
| `503 Service Unavailable` on `/ready` | MongoDB Atlas network restriction | Verify `0.0.0.0/0` is whitelisted in Atlas Network Access |
| `401 Unauthorized` on admin pages | Missing JWT Token or Secret mismatch | Clear browser localStorage and re-login as administrator |
| `Upload directory error` | Ephemeral disk on free Render tier | Uploaded images work per session. For permanent storage, connect AWS S3 / Cloudinary |
