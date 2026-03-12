import asyncio
import json
import logging
from typing import Dict
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import redis.asyncio as redis

app = FastAPI(title="Vader Blind Relay")
redis_client = redis.Redis(host='localhost', port=6379, db=0)

class ConnectionManager:
    def __init__(self):
        # username_hash -> WebSocket
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, username_hash: str):
        await websocket.accept()
        self.active_connections[username_hash] = websocket
        logging.info(f"Connected: {username_hash[:8]}...")

    def disconnect(self, username_hash: str):
        if username_hash in self.active_connections:
            del self.active_connections[username_hash]
            logging.info(f"Disconnected: {username_hash[:8]}...")

    async def send_personal_message(self, message: str, username_hash: str):
        if username_hash in self.active_connections:
            await self.active_connections[username_hash].send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/{username_hash}")
async def websocket_endpoint(websocket: WebSocket, username_hash: str):
    await manager.connect(websocket, username_hash)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            target_hash = message_data.get("target_hash")
            payload = message_data.get("payload") # Encrypted data
            ttl = message_data.get("ttl", 120) # Default 2 mins

            if target_hash:
                message_id = f"msg:{target_hash}:{asyncio.get_event_loop().time()}"
                
                # Store ephemerally in Redis (TTL enforce)
                await redis_client.setex(message_id, ttl, payload)
                
                # Blind relay to target if online
                await manager.send_personal_message(json.dumps({
                    "from": username_hash, 
                    "payload": payload
                }), target_hash)

    except WebSocketDisconnect:
        manager.disconnect(username_hash)
    except Exception as e:
        logging.error(f"Error: {e}")
        manager.disconnect(username_hash)
