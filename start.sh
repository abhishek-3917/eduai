#!/bin/sh

# Start python FastAPI AI Service in background
echo "[+] Starting AI Service on 127.0.0.1:8000..."
cd /app/ai-service
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 > /var/log/ai-service.log 2>&1 &

# Wait for AI service to initialize
echo "[+] Waiting for AI service to launch..."
sleep 5

# Start backend Express server in foreground
echo "[+] Starting Express Backend Gateway on port 5000..."
cd /app/backend
export AI_SERVICE_URL=http://127.0.0.1:8000
npm start
