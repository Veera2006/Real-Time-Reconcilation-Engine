---
description: How to start the backend services for the FinMatch Hub
---

# Backend Startup Guide

Follow these steps to start the complete backend system for testing.

## 1. Start Kafka Infrastructure
Ensure you are in the `backend/` directory.

```bash
cd backend
docker-compose up -d
```
*Wait about 30 seconds for Kafka to fully initialize.*

## 2. Start the Matching Engine
Open a new terminal tab.
Activate your python environment (if using conda):
```bash
conda activate engine
```
Start the FastAPI server:
```bash
cd backend
uvicorn matching_engine:app --reload
```
*The server will start on `http://localhost:8000`.*

## 3. Start the Producers
Open two separate terminal tabs for the producers.

**Terminal A (PG Producer):**
```bash
cd backend
python pg_producer.py
```

**Terminal B (OMS Producer):**
```bash
cd backend
python oms_producer.py
```

## 4. Verification
- Check the Matching Engine terminal. You should see `🔍 Reconciled: TXN_...` logs appearing.
- Check the Producer terminals. They should be printing delivered messages.
- If you have the frontend running (`npm run dev`), the dashboard should now be receiving live events via WebSocket.
