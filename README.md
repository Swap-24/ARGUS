<div align="center">
<pre>
```
    ░█████╗░██████╗░░██████╗░██╗░░░██╗░██████╗
    ██╔══██╗██╔══██╗██╔════╝░██║░░░██║██╔════╝
    ███████║██████╔╝██║░░██╗░██║░░░██║╚█████╗░
    ██╔══██║██╔══██╗██║░░╚██╗██║░░░██║░╚═══██╗
    ██║░░██║██║░░██║╚██████╔╝╚██████╔╝██████╔╝
    ╚═╝░░╚═╝╚═╝░░╚═╝░╚═════╝░░╚═════╝░╚═════╝
```
</pre>

**The All-Seeing Debate Arena**

*Where arguments are weighed, not won by volume.*

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![Node](https://img.shields.io/badge/Node.js-22-339933?style=flat-square&logo=node.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)
![Socket.io](https://img.shields.io/badge/Socket.io-4-black?style=flat-square&logo=socket.io)
![PyTorch](https://img.shields.io/badge/PyTorch-GPU-EE4C2C?style=flat-square&logo=pytorch)

</div>

---

## What is Argus?

Argus is a real-time AI-powered debate platform where two players go head-to-head on a topic of their choosing. Every argument is scored live by a multi-model Machine Learning pipeline — judging logic, relevance, sentiment, and rhetorical fallacies. The better you argue, the more you score. Argue well enough and you charge up your **INTERJECT** ability to cut your opponent's turn short.

No judges. No bias. Just your words against theirs.

---

## Features

- **Real-time multiplayer** — two debaters, live-synced via Socket.io with server-authoritative state
- **AI argument scoring** — every argument is scored across 4 dimensions by HuggingFace models
- **Fallacy detection** — ad hominem, straw man, false dichotomy, and more flagged in real time
- **INTERJECT system** — a chargeable ultimate ability that builds with strong arguments, lets you cut your opponent's turn
- **Custom debate timer** — room creator picks duration from 3 minutes to fully custom
- **Spectator mode** — watch any live debate without participating
- **Graceful disconnection** — 30 second reconnection window before a room is closed
- **Post-debate breakdown** — full score comparison with per-argument analytics

### Coming Soon
- **Elo rating system** — ranked debaters with persistent skill ratings
- **Random matchmaking** — get paired with opponents at your skill level
- **Debate history** — replay any past debate argument by argument
- **AI Devil's Advocate** — a third AI participant that challenges both sides

---

## Tech Stack

```
┌─────────────────────────────────────────────────┐
│              React + Vite (Frontend)             │
│     React Router · Tailwind CSS · Socket.io      │
└──────────────────┬──────────────────────────────┘
                   │ WebSocket + HTTP
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐   ┌────────▼────────┐
│  Node/Express  │   │    FastAPI       │
│  Socket.io     │──▶│  ML Inference    │
│  Game State    │   │  Engine          │
└────────────────┘   └────────┬────────┘
                              │
               ┌──────────────┼──────────────┐
               ▼              ▼              ▼
         DistilBERT         BART         Sentence
         Sentiment       Zero-shot        BERT
          Scoring        Fallacy +      Relevance
                         Strength
```

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, React Router |
| Real-time | Socket.io (server-authoritative) |
| Backend | Node.js 22, Express |
| ML Engine | FastAPI, PyTorch, HuggingFace Transformers |
| Sentiment | `distilbert-base-uncased-finetuned-sst-2-english` |
| Argument Strength + Fallacy | `facebook/bart-large-mnli` (zero-shot) |
| Relevance | `sentence-transformers/all-MiniLM-L6-v2` |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- A GPU is recommended for the ML engine (CPU works but is slow)

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/argus.git
cd argus
```

### 2. Frontend
```bash
cd client
npm install
npm run dev         # → http://localhost:5173
```

### 3. Node server
```bash
cd server
npm install
node index.js       # → http://localhost:3001
```

### 4. ML engine
```bash
cd ml_engine
python -m venv argusVenv
argusVenv\Scripts\activate      # Windows
# source argusVenv/bin/activate  # Mac/Linux

pip install -r requirements.txt
uvicorn main:app --reload --port 8000   # → http://localhost:8000
```

On first run the ML engine downloads ~1.5GB of model weights from HuggingFace automatically.

### 5. Verify all three are running
- `http://localhost:5173` → React app
- `http://localhost:3001` → `{"status": "Argus server running"}`
- `http://localhost:8000/docs` → FastAPI Swagger UI (test the `/analyze` endpoint here)

---

## How to Play

1. Go to `http://localhost:5173`
2. Enter a username
3. **Create a room** — enter a debate topic, pick a duration, generate a room code
4. Share the room code with your opponent
5. Your opponent **joins the room** using the code
6. The debate begins automatically when both players are present
7. Each player has **30 seconds per turn** to submit an argument
8. The AI scores your argument and updates the live score bar
9. Build up your **INTERJECT** meter by scoring well — when fully charged, cut your opponent's turn
10. When the timer hits zero, the player with the higher score wins

---

## ML Scoring Pipeline

Every argument runs through four models and is aggregated into a 0–100 score:

| Dimension | Model | Weight |
|---|---|---|
| Argument Strength | BART zero-shot (logical quality labels) | 40% |
| Relevance | Sentence-BERT cosine similarity vs topic | 30% |
| Sentiment | DistilBERT (confident framing) | 20% |
| Fallacy Penalty | BART zero-shot (6 fallacy patterns) | 10% |

**Detected fallacies:** Ad Hominem · Straw Man · Appeal to Authority · False Dichotomy · Slippery Slope · Hasty Generalization

---

## Project Structure

```
argus/
├── client/                    # React frontend
│   └── src/
│       ├── components/
│       │   └── Debate/        # Arena, ScoreBar, Feed, Timer, etc.
│       ├── context/           # DebateContext (global state)
│       ├── hooks/             # useSocket
│       └── pages/             # Home (lobby), Debate (arena)
│
├── server/                    # Node.js + Socket.io
│   ├── index.js
│   └── socket/
│       ├── debateHandler.js   # All game logic + room lifecycle
│       └── roomManager.js     # In-memory room store
│
└── ml_engine/                 # FastAPI ML pipeline
    ├── main.py
    ├── routers/
    │   └── analyze.py         # POST /analyze endpoint
    ├── models/
    │   ├── sentiment.py
    │   ├── relevance.py
    │   └── argument_scorer.py
    └── schemas/
        └── argument.py
```

---

## Roadmap

- [x] Real-time multiplayer via Socket.io
- [x] AI argument scoring pipeline
- [x] Fallacy detection
- [x] INTERJECT ultimate ability
- [x] Custom debate duration
- [x] Spectator mode
- [ ] Elo rating system
- [ ] Random matchmaking by Elo bracket
- [ ] Persistent debate history + replay
- [ ] AI Devil's Advocate mode
- [ ] User profiles + win/loss stats
- [ ] PostgreSQL persistence
- [ ] Deployment (Vercel + Railway + Supabase)

---

## Contributing

Pull requests welcome. For major changes please open an issue first.

---

<div align="center">
  <sub>Built with 👁 by KIIT0001</sub>
</div>
