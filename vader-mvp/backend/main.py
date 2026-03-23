import asyncio
import json
import logging
import time
from typing import Dict
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import redis.asyncio as redis

app = FastAPI(title="Vader Blind Relay")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

redis_client = redis.Redis(host='localhost', port=6379, db=0)

LOCKOUT_SECONDS = 3 * 60 * 60  # 3 hours


# ── Pydantic models ──────────────────────────────────────────────────────────
class AccountIDBody(BaseModel):
    vader_id: str


# ── WebSocket connection manager ─────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
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


# ── Account lockout endpoint ─────────────────────────────────────────────────
@app.post("/account/lockout")
async def lockout_account(body: AccountIDBody):
    """Record a 3-hour lockout for the given vader_id in Redis."""
    key = f"lockout:{body.vader_id}"
    locked_until = int(time.time()) + LOCKOUT_SECONDS
    await redis_client.setex(key, LOCKOUT_SECONDS, str(locked_until))
    logging.warning(f"Account locked: {body.vader_id[:8]}... until {locked_until}")
    return {"locked_until": locked_until}


# ── Account delete endpoint ──────────────────────────────────────────────────
@app.post("/account/delete")
async def delete_account(body: AccountIDBody):
    """Permanently delete all server-side data for the given vader_id."""
    vader_id = body.vader_id

    # Delete lockout key
    await redis_client.delete(f"lockout:{vader_id}")

    # Delete any stored messages addressed to this user
    pattern = f"msg:{vader_id}:*"
    cursor = 0
    deleted = 0
    while True:
        cursor, keys = await redis_client.scan(cursor, match=pattern, count=100)
        if keys:
            await redis_client.delete(*keys)
            deleted += len(keys)
        if cursor == 0:
            break

    # Disconnect active WebSocket if online
    if vader_id in manager.active_connections:
        try:
            await manager.active_connections[vader_id].close()
        except Exception:
            pass
        manager.disconnect(vader_id)

    logging.warning(f"Account deleted: {vader_id[:8]}... ({deleted} messages wiped)")
    return {"deleted": True, "messages_wiped": deleted}


# ── WebSocket relay ──────────────────────────────────────────────────────────
@app.websocket("/ws/{username_hash}")
async def websocket_endpoint(websocket: WebSocket, username_hash: str):
    await manager.connect(websocket, username_hash)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            target_hash = message_data.get("target_hash")
            payload = message_data.get("payload")  # Encrypted data
            ttl = message_data.get("ttl", 120)      # Default 2 mins

            if target_hash:
                message_id = f"msg:{target_hash}:{asyncio.get_event_loop().time()}"

                # Store ephemerally in Redis
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
