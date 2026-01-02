import json
import time
import random
from confluent_kafka import Producer

conf = {'bootstrap.servers': "localhost:9094"}
producer = Producer(conf)

def delivery_report(err, msg):
    if err is not None:
        print(f"❌ OMS Delivery failed: {err}")
    else:
        print(f"📦 OMS Event: {msg.key().decode('utf-8')} sent to {msg.topic()}")

# Global counter for deterministic IDs - Start same as PG
current_id = 10000

def generate_oms_event():
    global current_id
    txn_id = f"TXN_{current_id}"
    current_id += 1
    
    # Must use same amount logic as PG primarily
    # But introduce a 10% chance of anomaly
    base_amount = random.choice([499.00, 1200.50, 2500.00, 89.99])
    
    if random.random() < 0.10: # 10% chance of mismatch
        final_amount = base_amount + 10.00 # Create discrepancy
        print(f"⚠️ Generating ANOMALY for {txn_id}: PG={base_amount}, OMS={final_amount}")
    else:
        final_amount = base_amount

    return {
        "order_id": f"ORD_{random.randint(100, 999)}",
        "transaction_id": txn_id,
        "amount": final_amount,
        "status": "ORDER_PLACED",
        "timestamp": time.time()
    }

print("📦 Starting OMS Producer (Synchronized)...")
try:
    while True:
        event = generate_oms_event()
        producer.produce('oms_data', key=event['transaction_id'], 
                         value=json.dumps(event), callback=delivery_report)
        producer.poll(0)
        time.sleep(1.2) # Slightly different speed allows "drift" but IDs will match
except KeyboardInterrupt:
    producer.flush()