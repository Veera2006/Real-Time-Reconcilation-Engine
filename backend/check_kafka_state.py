from confluent_kafka.admin import AdminClient

conf = {'bootstrap.servers': "localhost:9094"}
admin_client = AdminClient(conf)

print("🔍 Checking Kafka Cluster State...")

try:
    md = admin_client.list_topics(timeout=10)
    print(f"✅ Connected to Broker: {md.orig_broker_id} - {md.orig_broker_name}")
    
    print("\n📜 Topics Found:")
    for t in iter(md.topics.values()):
        print(f" - {t.topic} (Partitions: {len(t.partitions)})")
        if t.error:
            print(f"   ⚠️ Error: {t.error}")

    if 'oms_data' not in md.topics:
        print("\n❌ CRITICAL: 'oms_data' topic does NOT exist.")
    else:
        print("\n✅ 'oms_data' exists.")

except Exception as e:
    print(f"💀 Fatal Error: {e}")
