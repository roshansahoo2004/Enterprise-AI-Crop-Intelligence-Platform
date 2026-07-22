# 📡 API Documentation & REST Registry

## Overview

The backend service exposes RESTful JSON endpoints protected by JWT authentication (`Bearer <token>`) and role-based access control (`adminOnly`).

All API responses follow a unified response schema:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

---

## 1. Health & Infrastructure Probes

### GET `/health`
Returns system operational status, process uptime, and database connection state.

- **Authentication**: Public
- **Response Example**:
  ```json
  {
    "success": true,
    "status": "UP",
    "ready": true,
    "uptimeSeconds": 4820,
    "environment": "production",
    "version": "1.0.0",
    "database": {
      "status": "Connected",
      "readyState": 1
    }
  }
  ```

### GET `/ready`
Readiness probe for load balancers. Returns HTTP 200 when ready, HTTP 503 when degraded.

---

## 2. Authentication Gateway (`/api/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new agricultural user account | Public |
| POST | `/api/auth/login` | Authenticate user and receive JWT token | Public |
| GET | `/api/auth/me` | Fetch active authenticated user profile | Bearer JWT |

---

## 3. Crop Prediction & Disease Core (`/api/predict`, `/api/disease`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/predict` | Run soil N-P-K & weather crop recommendation inference | Bearer JWT |
| POST | `/api/disease/detect` | Run deep learning leaf image pathology diagnosis | Bearer JWT |
| GET | `/api/history` | Fetch historical crop prediction records | Bearer JWT |

---

## 4. MLOps Command & Deployment Center (`/api/admin`)

### GET `/api/admin/operations/summary`
Executes MongoDB aggregation pipeline summarizing platform health, model deployments, pipeline status, and drift alerts.

- **Authentication**: Bearer JWT (Admin Only)

### GET `/api/admin/deployments`
Lists active model deployments, status (`Active`, `Rolled Back`, `Failed`), and deployment history.

### POST `/api/admin/deployments/deploy`
- **Request Body**:
  ```json
  {
    "modelId": "MOD-CROP-v2.1",
    "targetEnvironment": "Production",
    "trafficPercentage": 100,
    "notes": "Automated deployment following pipeline verification"
  }
  ```

### POST `/api/admin/deployments/rollback/:id`
Triggers instant rollback to previous stable model version.

---

## 5. ML Pipeline Orchestrator (`/api/admin/pipeline`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/pipeline/summary` | Pipeline metrics (Active, Completed, Failed, Avg Duration) | Admin |
| GET | `/api/admin/pipeline/workflows` | List of pipeline workflow executions | Admin |
| POST | `/api/admin/pipeline/trigger` | Trigger manual pipeline execution workflow | Admin |

---

## 6. AI Governance & Compliance (`/api/admin/governance`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/governance/summary` | Compliance score, active policy count, and pending approvals | Admin |
| GET | `/api/admin/governance/audit` | Query governance audit log events | Admin |
| POST | `/api/admin/governance/policy` | Create or update AI compliance policy | Admin |
| POST | `/api/admin/governance/approve/:id` | Human-in-the-loop approval decision | Admin |
| POST | `/api/admin/governance/reject/:id` | Reject deployment or pipeline request | Admin |

---

## 7. Error Status Codes

| Code | Status | Meaning |
|------|--------|---------|
| `200` | OK | Request succeeded |
| `201` | Created | Resource successfully created |
| `400` | Bad Request | Validation failure or missing parameters |
| `401` | Unauthorized | Missing or expired JWT token |
| `403` | Forbidden | Insufficient permissions (Admin role required) |
| `404` | Not Found | Requested endpoint or resource ID does not exist |
| `500` | Internal Error | Server error (Handled by `errorHandler.js`) |
