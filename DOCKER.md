# 🐳 Talent Align - Docker Containerization Guide

This guide explains how to build, run, and manage the **Talent Align** application using Docker and Docker Compose.

---

## 🏗️ Architecture Overview

The containerized stack consists of 4 orchestrated services:

```
                          ┌───────────────────────────┐
                          │   Client Browser (:3000)  │
                          └─────────────┬─────────────┘
                                        │
                         HTTP / Static  │  /api/ (Reverse Proxy)
                                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Frontend Container (Nginx Alpine :3000)                               │
│  - Serves compiled React 19 SPA build                                 │
│  - Handles SPA client-side routing                                     │
│  - Proxies /api/ requests internally to backend:8000                   │
└───────────────────────────────────────┬────────────────────────────────┘
                                        │ internal network
                                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Backend Container (Django / Gunicorn :8000)                           │
│  - REST API Endpoints                                                  │
│  - Talent Matching Engine & Stream Normalization                       │
│  - Excel 2-Sheet Executive Report Generator                            │
└───────────────────┬─────────────────────────────────┬──────────────────┘
                    │                                 │
                    ▼                                 ▼
┌──────────────────────────────────┐  ┌──────────────────────────────────┐
│  Database (PostgreSQL 16 :5432)  │  │  AI Engine (Ollama :11434)       │
│  - Persistent Volume             │  │  - Llama 3 LLM Model             │
│  - Health-checked                │  │  - JD Parsing & Insights         │
└──────────────────────────────────┘  └──────────────────────────────────┘
```

---

## 🚀 Quick Start (Running with Docker Compose)

### 1. Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### 2. Configure Environment (Optional)
Copy the sample environment file:
```bash
cp .env.example .env
```

### 3. Build and Start All Containers
Run the following command from the project root:
```bash
docker compose up --build -d
```

### 4. Access the Application
- **Frontend UI**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000/api/](http://localhost:8000/api/)
- **Django Admin**: [http://localhost:8000/admin/](http://localhost:8000/admin/)
- **PostgreSQL**: `localhost:5432` (`user: postgres`, `password: root`, `db: tharunsalign`)

---

## 🛠️ Common Operations

### View Service Logs
```bash
# View all logs in real-time
docker compose logs -f

# View backend logs only
docker compose logs -f backend

# View frontend logs only
docker compose logs -f frontend
```

### Create a Superuser (Django Admin)
```bash
docker compose exec backend python manage.py createsuperuser
```

### Run Migrations Inside Container
Migrations run automatically on container startup via `docker-entrypoint.sh`. To manually trigger migrations:
```bash
docker compose exec backend python manage.py migrate
```

### Pull LLM Model for Ollama (Optional for Local AI)
```bash
docker compose exec ollama ollama pull llama3
```

### Stop Containers
```bash
# Stop containers (preserves database data)
docker compose down

# Stop containers and remove volumes (resets database)
docker compose down -v
```

---

## 🧪 Running Tests Inside Container
```bash
docker compose exec backend python manage.py test apis.tests
```

---

## 💻 Local Development (Without Docker)
The configuration is 100% backward compatible with your existing local setup:
- **Backend**: `python manage.py runserver` (in `backend/talentalignbackend/`)
- **Frontend**: `npm start` (in `frontend/frontend/`)
