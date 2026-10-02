# Deployment & Production Architecture

## Production Configuration

### 1. Environment Secrets (.env)
In production, ensure:
```env
DJANGO_SECRET_KEY=production-crypto-random-key-64-chars
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,api.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

### 2. Frontend Production Bundle
```bash
cd frontend
npm run build
```
Outputs static bundle in `frontend/dist/`. Serve using Nginx, Caddy, or Cloudflare Pages.

### 3. Backend WSGI / ASGI Server
Deploy Django using Gunicorn with Uvicorn workers:
```bash
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4 --timeout 120
```

---

## 4. Docker Architecture
A complete `docker-compose.yml` is provided at root to orchestrate frontend static serving and backend REST API containers.
