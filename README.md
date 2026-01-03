# 🚀 ReconFlow

**ReconFlow** is a high-performance, real-time financial reconciliation dashboard designed to detect anomalies between Payment Gateway (PG) logs and Order Management System (OMS) records instantly.

Built with a **React** frontend and a **Python/Kafka** backend, it simulates a live fintech environment processing thousands of transactions, flagging mismatches in milliseconds.

---

## 🌟 Key Features

*   **⚡ Real-Time Reconciliation**: Processes transactions live via WebSockets without page reloads.
*   **🔍 Anomaly Detection**:
    *   **Amount Mismatches**: Flags discrepancies (e.g., PG: ₹100 vs OMS: ₹99).
    *   **Status Inconsistencies**: Detects critical failures (e.g., PG: Success vs OMS: Failed).
*   **📊 Live Visualization**:
    *   Dynamic "Active Issues" counters.
    *   Rolling transaction buffer (5,000+ records).
    *   Interactive Mismatch Severity Charts.
*   **🕵️‍♂️ Advanced Filtering**:
    *   Drill down into **Reconciled** data by **Date Range**, **Time Range**, and **Amount**.
*   **🛠️ Simulation Engine**: Built-in Python producers that generate realistic traffic and inject controlled random anomalies for testing.

---

## 🛠️ Tech Stack

### Frontend
*   **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
*   **Language**: TypeScript
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components**: [Shadcn UI](https://ui.shadcn.com/) + Lucide Icons
*   **State Management**: React Hooks (Optimized for high-frequency updates)

### Backend
*   **Engine**: Python 3.13 + [FastAPI](https://fastapi.tiangolo.com/)
*   **Messaging**: [Apache Kafka](https://kafka.apache.org/) (Dockerized)
*   **Protocol**: WebSockets (Native API)

---

## 🏗️ Architecture

1.  **Ingestion**:
    *   `pg_producer.py`: Simulates Payment Gateway events, generating "valid" payment logs.
    *   `oms_producer.py`: Simulates Order Management System events (with randomly injected anomalies).
    *   Both producers push JSON messages to **Kafka** topics (`pg_data`, `oms_data`).
2.  **Processing**:
    *   `matching_engine.py`: A high-throughput consumer that polls both topics.
    *   It buffers events, matches them by `transaction_id`, and runs logic to determine status: `MATCHED`, `AMOUNT_MISMATCH`, or `STATUS_MISMATCH`.
3.  **Delivery**:
    *   The engine pushes the processed result to the **Frontend** via a low-latency **WebSocket** connection.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+) & npm
*   Python 3.13+
*   Docker & Docker Compose

### 1. Start Infrastructure (Kafka)
```bash
cd backend
docker-compose up -d
```

### 2. Start the Backend Engine
Open a terminal in the `backend` directory:
```bash
pip install -r requirements.txt
uvicorn matching_engine:app --reload
```

### 3. Start Data Producers
Open two separate terminals to simulate traffic:
```bash
# Terminal A (Payment Gateway)
cd backend
python pg_producer.py

# Terminal B (Order Management System)
cd backend
python oms_producer.py
```

### 4. Start the Frontend
Open a terminal in the project root:
```bash
npm install
npm run dev
```
Visit `http://localhost:8080` to see the dashboard live!

---

## 📄 License
This project is licensed under the MIT License.
