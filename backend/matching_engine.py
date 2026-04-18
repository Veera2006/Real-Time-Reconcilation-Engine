import json
import asyncio
import time
import os
from fastapi import FastAPI, WebSocket
from confluent_kafka import Consumer

app = FastAPI()

# Kafka Config
conf = {
    'bootstrap.servers': os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9094'),
    'group.id': "recon-group-force-reset-v1", # Changed group to force read from start
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
    print("🏁 Matching Engine Started. Waiting for events...")
    try:
        last_cleanup = time.time()
        
        while True:
            # NON-BLOCKING POLL
            msg = consumer.poll(0.0) 
            
            if msg is None:
                await asyncio.sleep(0.01) 
                
                # Check if we need to run cleanup (every 10 seconds)
                if time.time() - last_cleanup > 10:
                    await cleanup_buffers()
                    last_cleanup = time.time()
                    print(f"💓 Heartbeat: Engine is running... (PG Buffer: {len(pg_buffer)}, OMS Buffer: {len(oms_buffer)})")
                continue
            
            if msg.error():
                print(f"❌ Consumer error: {msg.error()}")
                continue

            # Parse incoming data
            try:
                data = json.loads(msg.value().decode('utf-8'))
                txn_id = data.get('transaction_id') or data.get('txn_id')
                topic = msg.topic()
                
                current_time = time.time()
                
                # Log receipt
                print(f"📥 Received {topic}: {txn_id}")

                if topic == 'pg_data':
                    pg_buffer[txn_id] = {'data': data, 'timestamp': current_time}
                else:
                    oms_buffer[txn_id] = {'data': data, 'timestamp': current_time}

                # Check for a match
                if txn_id in pg_buffer and txn_id in oms_buffer:
                    pg_entry = pg_buffer.pop(txn_id)['data']
                    oms_entry = oms_buffer.pop(txn_id)['data']

                    # Matching Logic
                    # Matching Logic
                    status = "MATCHED"
                    
                    # 1. Check Amount
                    if pg_entry['amount'] != oms_entry['amount']:
                        status = "AMOUNT_MISMATCH"
                        
                    # 2. Check Status (Critical: PG Success vs OMS Failure)
                    # PG usually sends "CAPTURED". OMS might send "PAYMENT_FAILED"
                    elif oms_entry.get('status') == 'PAYMENT_FAILED' and pg_entry.get('status') in ['CAPTURED', 'Success']:
                        status = "STATUS_MISMATCH"
                    
                    result = {
                        "txn_id": txn_id,
                        "status": status,
                        "pg_amount": pg_entry['amount'],
                        "oms_amount": oms_entry['amount'],
                        "pg_status": pg_entry.get('status', 'Unknown'),
                        "oms_status": oms_entry.get('status', 'Unknown'),
                        "details": "Verified" if status == "MATCHED" else f"Alert: {status} detected!"
                    }
                    
                    # Send result to React Dashboard via WebSocket
                    try:
                        print(f"📤 Sending update to UI: {txn_id}")
                        await websocket.send_json(result)
                    except Exception as e:
                        print(f"⚠️ WebSocket Send Error: {e}")
                        # Don't pass, let us see it in the terminal
                        
                    # Detailed Console Output
                    icon = "✅" if status == "MATCHED" else "⚠️"
                    print(f"{icon} MATCHED: {txn_id} | PG: {pg_entry['amount']} | OMS: {oms_entry['amount']} | Status: {status}")
            except Exception as e:
                print(f"Error processing message: {e}")

    except Exception as e:
        print(f"Fatal Error in reconcile loop: {e}")

@app.websocket("/ws/recon")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    await reconcile_logic(websocket)