# VADER MVP - Zero-Trust E2EE Chat

Vader is an ephemerality-first, metadata-resistant Web3 chat application. It places an extreme priority on anonymity, metadata minimization, and physical device security.

## Folder Structure

```text
vader-mvp/
  ├── backend/
  │   ├── main.py             # FastAPI Relay Server (WebSockets + Redis TTL)
  │   ├── requirements.txt    # Python dependencies
  │   └── tor_service.py      # Stem controller for Tor Ephemeral Hidden Service
  ├── contracts/
  │   └── VaderPKI.sol        # Smart Contract for dPKI (Polygon)
  ├── frontend/
  │   ├── src/
  │   │   ├── App.jsx         # React Main Entry (Boss Key logic)
  │   │   ├── components/
  │   │   │   └── ChatUI.jsx  # Chat Interface with Pin/Wipe & encryption loopback logic
  │   │   └── utils/
  │   │       └── CryptoUtils.js # Web Crypto API wrappers for RSA-OAEP
  └── README.md
```

## Getting Started

### 1. Redis Setup (Alternative to Docker)

The Python Relay uses Redis to store messages ephemerally. If you prefer not to use Docker, here are the easiest ways to run Redis (especially on Windows):

**Option A: WSL (Windows Subsystem for Linux) - Recommended**
1. Open your Ubuntu WSL terminal.
2. Install and start Redis:
   ```bash
   sudo apt update
   sudo apt install redis-server
   sudo service redis-server start
   ```

**Option B: Memurai (Native Windows)**
Download and install [Memurai](https://www.memurai.com/) (Developer Edition). It is a native Windows port of Redis and will automatically run on port `6379`.

**Option C: Cloud Redis (e.g., Upstash)**
Create a free managed Redis instance on Upstash or Redis Cloud. Update `backend/main.py` to use your connection URL instead of localhost.

### 2. Backend (Python Relay & Tor)

Prerequisites: Python 3.10+.
For the Tor Hidden Service:
- **Windows (Recommended):** Download and install the Tor Browser to its default location (e.g., your Desktop). The script will automatically find `tor.exe`. Alternatively, you can download the Tor Expert Bundle and add it to your system PATH.
- **Linux/Mac:** `sudo apt install tor` or `brew install tor`

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
python -m pip install -r requirements.txt
```

Start the FastAPI Relay:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

Start the Tor Ephemeral Service (in another terminal):
```bash
cd backend
# Ensure env is activated
python tor_service.py
```
It will map Port 80 on the Tor network to your local Port 8000. Keep note of the printed `.onion` address. To connect over TOR, point your frontend connection logic to the onion address instead of localhost.

### 3. Frontend (React)

Assuming an existing Vite setup or Create React App environment. If starting fresh, initialize a barebone react app, replace `App.jsx`, configure Tailwind CSS, and then install dependencies.

```bash
cd frontend
npm install
npm run dev
```

### Features Included (Phases 1-3)

- **Phase 1: Python Relay & Camouflage UI**: Blind relay routing websocket connections by SHA256 hashed identity IDs without revealing IPs. Added "Boss Key" (Alt + Shift + S) to instantaneously toggle a decoy UI.
- **Phase 2: dPKI & Device-Local Wipe**: React Frontend creates an RSA-OAEP keystore in the browser. Employs a strict 5-attempt PIN loop to access the GUI, terminating via complete storage wipe if triggered. Provided `VaderPKI.sol` template mapping user hashes to generated Public Keys on-chain.
- **Phase 3: Ephemerality & Tor**: All relay messages undergo Redis SETEX constraint with default 2min TTL logic before being purged. Python `stem` process initiates a disposable Tor `.onion`.
