# Frontend/Dockerfile.dev
FROM node:20-alpine
WORKDIR /app

# ใช้ lockfile ตามที่มีจริง (ด้านล่างใช้ npm)
COPY package*.json ./
RUN npm ci --no-audit --no-fund


# เปิดพอร์ต dev server ของ Vite
EXPOSE 5173

# โค้ดจริงจะ bind-mount ผ่าน docker-compose
CMD ["npm", "run", "dev", "--", "--host"]