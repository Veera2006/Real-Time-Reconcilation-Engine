import json
import time
import random
from confluent_kafka import Producer

# Kafka Configuration
conf = {'bootstrap.servers': "localhost:9094"}
producer = Producer(conf)

def delivery_report(err, msg):
    if err is not None:
        print(f"❌ PG Delivery failed: {err}")
    else:
        print(f"✅ PG Event: {msg.key().decode('utf-8')} sent to {msg.topic()}")

def generate_pg_event():
    txn_id = f"TXN_{random.randint(10000, 99999)}"
    # Intentionally vary amounts slightly to test your engine later
    amount = random.choice([499.00, 1200.50, 2500.00, 89.99])
    return {
        "transaction_id": txn_id,
        "gateway": "Razorpay",
        "amount": amount,
        "currency": "INR",
        "status": "CAPTURED",
        "timestamp": time.time()
    }

print("🚀 Starting Payment Gateway Producer...")
try:
    while True:
        event = generate_pg_event()
        # Using txn_id as the key ensures all logs for one txn stay in order
        producer.produce('pg_data', key=event['transaction_id'], 
                         value=json.dumps(event), callback=delivery_report)
        producer.poll(0) # Serve delivery callbacks
        time.sleep(1)    # 1 transaction per second
except KeyboardInterrupt:
    producer.flush()