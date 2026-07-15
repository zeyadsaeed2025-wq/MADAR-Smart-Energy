# Deployment Guide - MADAR Smart Energy Platform

This guide covers deploying the MADAR platform to production environments.

---

## Overview

The platform has three deployable components:

| Component | Port | Type |
|-----------|------|------|
| React Frontend | 5173 | Static SPA (Vite build) |
| Express Backend | 3001 | Node.js server |
| Python Flask | 5000 | Python WSGI server |

---

## Option 1: Vercel (Frontend Only)

Vercel is recommended for the React frontend. The Express backend runs on your local machine or a VPS since it communicates with Arduino hardware via serial.

### Deploy Frontend to Vercel

1. Push your repo to GitHub

2. Go to https://vercel.com and import the repository

3. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `repo/`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Add environment variables:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_EXPRESS_URL=http://your-server-ip:3001
   ```

5. Deploy

6. Update CORS in `server.js` to allow your Vercel domain:
   ```javascript
   const allowedOrigins = [
     'http://localhost:5173',
     'https://your-project.vercel.app'
   ];
   ```

7. Re-deploy the backend with updated CORS

### Vercel Configuration

Create `repo/vercel.json` if needed:

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "http://your-server-ip:3001/api/$1"
    }
  ]
}
```

> **Note**: Vercel rewrites act as a proxy to your Express backend. The backend must be accessible via public IP or domain.

---

## Option 2: Manual Deployment (Full Stack on VPS)

Deploy all services on a single Linux/Windows server.

### Server Requirements

- OS: Ubuntu 22.04 / Windows Server 2022
- RAM: 2GB minimum
- Ports: 5173, 3001, 5000 open
- Node.js 18+, Python 3.12+
- USB passthrough for Arduino (physical server or USB-to-IP)

### Step 1: Clone and Install

```bash
git clone https://github.com/zeyad-saeed/MADAR.git
cd MADAR/repo
npm install
cd ../Python_Control_Service
pip install -r requirements.txt
```

### Step 2: Build Frontend

```bash
cd ../repo
npm run build
```

This produces a `dist/` folder with optimized static files.

### Step 3: Serve Static Files via Express

Update `server.js` to serve the built frontend:

```javascript
const path = require('path');
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});
```

Now Express serves everything on port 3001.

### Step 4: Set Up Process Manager (PM2)

```bash
npm install -g pm2

# Start Express backend
cd ../repo
pm2 start server.js --name "madar-api"

# Start Python Flask
cd ../Python_Control_Service
pm2 start app.py --name "madar-control" --interpreter python

# Save and auto-start
pm2 save
pm2 startup
```

### Step 5: Set Up Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/hardware/ {
        proxy_pass http://localhost:5000;
    }
}
```

### Step 6: SSL with Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Option 3: Docker Deployment

### Dockerfile for Express Backend

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY repo/package*.json ./repo/
RUN cd repo && npm ci --production
COPY repo/ ./repo/
EXPOSE 3001
CMD ["node", "repo/server.js"]
```

### Dockerfile for Python Service

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY Python_Control_Service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY Python_Control_Service/ .
EXPOSE 5000
CMD ["python", "app.py"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3001:3001"
    env_file: .env
    devices:
      - "/dev/ttyUSB0:/dev/ttyUSB0"

  control:
    build:
      context: .
      dockerfile: Dockerfile.control
    ports:
      - "5000:5000"
    devices:
      - "/dev/ttyUSB0:/dev/ttyUSB0"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - api
```

```bash
docker-compose up -d
```

---

## Environment Variables

Ensure all production environment variables are set. See `.env.example` for reference.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase admin key (server only) |
| `SERIAL_PORT` | Yes | Arduino serial port (e.g., COM3 or /dev/ttyUSB0) |
| `BAUD_RATE` | Yes | Serial baud rate (9600) |
| `EXPRESS_PORT` | Yes | Express backend port |
| `FLASK_PORT` | Yes | Python Flask port |
| `ESP32_CAM_IP` | Yes | ESP32-CAM IP address |

---

## Updating the Platform

```bash
cd MADAR
git pull origin main

# Frontend
cd repo && npm install && npm run build

# Python service
cd ../Python_Control_Service && pip install -r requirements.txt

# Restart services
pm2 restart madar-api
pm2 restart madar-control
```

---

## Monitoring

```bash
# View logs
pm2 logs madar-api
pm2 logs madar-control

# Check status
pm2 status

# Monitor resources
pm2 monit
```
