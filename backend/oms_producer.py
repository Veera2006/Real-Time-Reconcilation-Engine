import json
import time
import random
import os
from confluent_kafka import Producer

conf = {'bootstrap.servers': os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9094')}
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
    
    # 1. Base Data: Deterministic (Must match PG)
    # Use same seed as PG so we pick the SAME amount by default
    rd_base = random.Random(txn_id)
    base_amount = rd_base.choice([499.00, 1200.50, 2500.00, 89.99, 150.00, 999.00])
    
    # 2. Anomaly Injection: Dynamic (Changes every run / random)
    # Use standard random.random() which is time-seeded
    final_amount = base_amount
    status = "ORDER_PLACED"
    
    if random.random() < 0.20: # 20% chance of anomaly
        anomaly_type = random.choice(['amount_mismatch', 'status_failure'])
        
        if anomaly_type == 'amount_mismatch':
            # Add random variation like +/- 1% to 10%
            variation = random.uniform(1.0, 50.0)
            if random.choice([True, False]):
                final_amount += variation
            else:
                final_amount -= variation
            final_amount = round(final_amount, 2)
            print(f"⚠️  Anomaly (Amount): {txn_id} | PG={base_amount} -> OMS={final_amount}")
            
        elif anomaly_type == 'status_failure':
            status = "PAYMENT_FAILED"
            print(f"⚠️  Anomaly (Status): {txn_id} | PG=CAPTURED -> OMS={status}")

    return {
        "order_id": f"ORD_{random.randint(100, 999)}",
        "transaction_id": txn_id,
        "amount": final_amount,
        "status": status,
        "timestamp": time.time()
    }

print("📦 Starting OMS Producer (Synchronized)...")
try:
    while True:
        event = generate_oms_event()
        producer.produce('oms_data', key=event['transaction_id'], 
                         value=json.dumps(event), callback=delivery_report)
        producer.poll(0)
        # Keep cadence aligned with PG producer so matching IDs stay within buffer TTL.
        time.sleep(1)
except KeyboardInterrupt:
    producer.flush()