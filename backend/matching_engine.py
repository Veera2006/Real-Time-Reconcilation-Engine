import json
import asyncio
import time
from fastapi import FastAPI, WebSocket
from confluent_kafka import Consumer

app = FastAPI()

# Kafka Config
conf = {
    'bootstrap.servers': "localhost:9094",
    'group.id': "recon-group",
    'auto.offset.reset': 'earliest'
}
consumer = Consumer(conf)
consumer.subscribe(['pg_data', 'oms_data'])

# In-memory storage for matching (acting like a cache)
# Structure: {txn_id: {'data': event_data, 'timestamp': receive_time}}
pg_buffer = {}
oms_buffer = {}

BUFFER_TTL = 60  # seconds

async def cleanup_buffers():
    """Remove orphan transactions older than BUFFER_TTL."""
    current_time = time.time()
    
    # Cleanup PG buffer
    expired_pg = [k for k, v in pg_buffer.items() if current_time - v['timestamp'] > BUFFER_TTL]
    for k in expired_pg:
        del pg_buffer[k]
        print(f"🧹 Cleanup: Dropped orphan PG transaction {k}")

    # Cleanup OMS buffer
    expired_oms = [k for k, v in oms_buffer.items() if current_time - v['timestamp'] > BUFFER_TTL]
    for k in expired_oms:
        del oms_buffer[k]
        print(f"🧹 Cleanup: Dropped orphan OMS transaction {k}")

async def reconcile_logic(websocket: WebSocket):
    try:
        last_cleanup = time.time()
        
        while True:
            # NON-BLOCKING POLL
            # poll(0) returns immediately if no message, preventing event loop block
            msg = consumer.poll(0.0) 
            
            if msg is None:
                # Yield control to the event loop to allow WebSocket pings and other tasks
                await asyncio.sleep(0.01) 
                
                # Check if we need to run cleanup (every 10 seconds)
                if time.time() - last_cleanup > 10:
                    await cleanup_buffers()
                    last_cleanup = time.time()
                continue
            
            if msg.error():
                print(f"Consumer error: {msg.error()}")
                continue

            # Parse incoming data
            try:
                data = json.loads(msg.value().decode('utf-8'))
                txn_id = data.get('transaction_id') or data.get('txn_id')
                topic = msg.topic()
                
                current_time = time.time()

                if topic == 'pg_data':
                    pg_buffer[txn_id] = {'data': data, 'timestamp': current_time}
                else:
                    oms_buffer[txn_id] = {'data': data, 'timestamp': current_time}

                # Check for a match
                if txn_id in pg_buffer and txn_id in oms_buffer:
                    pg_entry = pg_buffer.pop(txn_id)['data']
                    oms_entry = oms_buffer.pop(txn_id)['data']

                    # Matching Logic
                    status = "MATCHED"
                    if pg_entry['amount'] != oms_entry['amount']:
                        status = "AMOUNT_MISMATCH"
                    
                    result = {
                        "txn_id": txn_id,
                        "status": status,
                        "pg_amount": pg_entry['amount'],
                        "oms_amount": oms_entry['amount'],
                        "details": "Verified" if status == "MATCHED" else "Alert: Difference detected!"
                    }
                    
                    # Send result to React Dashboard via WebSocket
                    await websocket.send_json(result)
                    print(f"🔍 Reconciled: {txn_id} -> {status}")
            except Exception as e:
                print(f"Error processing message: {e}")

    except Exception as e:
        print(f"Fatal Error in reconcile loop: {e}")

@app.websocket("/ws/recon")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    await reconcile_logic(websocket)