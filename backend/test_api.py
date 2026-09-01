import requests
import time
import sys

API_URL = "http://127.0.0.1:8000"

print("Waiting for server to start (this may take a minute if downloading embeddings model)...")
started = False
for i in range(60):
    try:
        resp = requests.get(f"{API_URL}/docs")
        if resp.status_code == 200:
            print("FastAPI is UP and running!")
            started = True
            break
    except requests.ConnectionError:
        pass
    time.sleep(2)

if not started:
    print("Server failed to start in time.")
    sys.exit(1)

# Upload the PDF
print("\nTesting PDF Upload...")
try:
    with open("../GenAiSynopsis2.pdf", "rb") as f:
        resp = requests.post(f"{API_URL}/upload", files={"file": f})
        print("Upload Status:", resp.status_code)
        print("Upload Response:", resp.json())
except Exception as e:
    print("Upload failed:", e)

# Test query
print("\nTesting Query...")
try:
    resp = requests.post(f"{API_URL}/query", json={
        "session_id": "test_session_1",
        "question": "What is the problem statement described in the synopsis?"
    })
    print("Query Status:", resp.status_code)
    print("Query Response:", resp.json())
except Exception as e:
    print("Query failed:", e)
