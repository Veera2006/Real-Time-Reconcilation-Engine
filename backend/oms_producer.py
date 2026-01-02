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

def generate_oms_event():
    # In a real test, you'd share IDs, but for now let's just create a flow
    txn_id = f"TXN_{random.randint(10000, 99999)}"
    return {
        "order_id": f"ORD_{random.randint(100, 999)}",
        "transaction_id": txn_id,
        "amount": random.choice([499.00, 1200.50, 2500.00, 89.99]),
        "status": "ORDER_PLACED",
        "timestamp": time.time()
    }

print("📦 Starting OMS Producer...")
try:
    while True:
        event = generate_oms_event()
        producer.produce('oms_data', key=event['transaction_id'], 
                         value=json.dumps(event), callback=delivery_report)
        producer.poll(0)
        time.sleep(1.2) # Slightly different speed than PG
except KeyboardInterrupt:
    producer.flush()