name: DevOps CI/CD Pipeline

on:
    push:
        branches: [ Ham-fix-pipeline ]
pull_request:
    branches: [ Ham-fix-pipeline ]
workflow_dispatch:

    jobs:
        # =========================
# Backend Unit Tests
# =========================
    backend-test:
runs-on: ubuntu-latest
defaults:
    run:
        working-directory: Backend
steps:
    - uses: actions/checkout@v4

- uses: actions/setup-java@v4
with:
distribution: "temurin"
java-version: "21"
cache: "maven"

- name: Run Backend Unit Test
run: |
chmod +x mvnw || true
    ./mvnw -q -U clean test

# =========================
# Frontend Unit / Vitest
# =========================
    frontend-test:
runs-on: ubuntu-latest
defaults:
    run:
        working-directory: Frontend
env:
    CI: true
CYPRESS_INSTALL_BINARY: 0
steps:
    - uses: actions/checkout@v4

- uses: actions/setup-node@v4
with:
node-version: 20
cache: "npm"
cache-dependency-path: Frontend/package-lock.json

# 👇 แก้ permission ทั้งโฟลเดอร์ให้เป็นของ user ปัจจุบัน กัน EACCES ตอน npm ci
- name: Fix folder permissions
run: |
sudo chown -R $USER:$USER .

- name: Install & Test Frontend
run: |
npm ci
npm run test --if-present

    # =========================
# Build & Push Backend Image
# =========================
    docker-backend:
runs-on: ubuntu-latest
needs: [ backend-test ]
env:
    IMAGE_NAME: 1tsh4dowz/devops-backend
steps:
    - uses: actions/checkout@v4

- name: Docker Login
uses: docker/login-action@v3
with:
username: ${{ secrets.DOCKER_USERNAME }}
password: ${{ secrets.DOCKER_PASSWORD }}

- name: Build & Push Backend
uses: docker/build-push-action@v5
with:
context: ./Backend
push: true
tags: |
${{ env.IMAGE_NAME }}:${{ github.sha }}
${{ env.IMAGE_NAME }}:latest

# =========================
# Build & Push Frontend Image
# =========================
    docker-frontend:
runs-on: ubuntu-latest
needs: [ frontend-test ]
env:
    IMAGE_NAME: 1tsh4dowz/devops-frontend
steps:
    - uses: actions/checkout@v4

- name: Docker Login
uses: docker/login-action@v3
with:
username: ${{ secrets.DOCKER_USERNAME }}
password: ${{ secrets.DOCKER_PASSWORD }}

- name: Build & Push Frontend
uses: docker/build-push-action@v5
with:
context: ./Frontend
push: true
tags: |
${{ env.IMAGE_NAME }}:${{ github.sha }}
${{ env.IMAGE_NAME }}:latest

# =========================
# E2E via Cypress + docker compose
# =========================
    e2e:
runs-on: ubuntu-latest
needs: [ docker-backend, docker-frontend ]
env:
    BACKEND_IMAGE: 1tsh4dowz/devops-backend:latest
FRONTEND_IMAGE: 1tsh4dowz/devops-frontend:latest
# ให้ Cypress เห็นค่า BASE_URL / API_URL (เผื่อใน e2e.cy.js ใช้ Cypress.env)
CYPRESS_BASE_URL: http://localhost:5173
    CYPRESS_API_URL: http://localhost:8080

        steps:
            - uses: actions/checkout@v4

- name: Create docker-compose.override.yml
run: |
cat > docker-compose.override.yml << EOF
services:
    backend:
        image: ${BACKEND_IMAGE}
ports:
    - "8080:8080"
environment:
    - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/organicnow
    - SPRING_DATASOURCE_USERNAME=postgres
    - SPRING_DATASOURCE_PASSWORD=postgres123

frontend:
    image: ${FRONTEND_IMAGE}
ports:
    - "5173:5173"
environment:
    - VITE_API_URL=http://backend:8080

postgres:
    image: postgres:16
environment:
    - POSTGRES_DB=organicnow
    - POSTGRES_USER=postgres
    - POSTGRES_PASSWORD=postgres123
ports:
    - "5432:5432"
EOF

- name: Start services
run: docker compose up -d

- name: Wait for backend (8080)
    run: |
for i in {1..60}; do
    curl -fsS http://localhost:8080/actuator/health && exit 0
sleep 2
done
echo "Backend did not become healthy in time" >&2
docker compose logs backend || true
exit 1

- name: Wait for frontend (5173)
    run: |
for i in {1..60}; do
    curl -fsS http://localhost:5173 && exit 0
sleep 2
done
echo "Frontend did not become ready in time" >&2
docker compose logs frontend || true
exit 1

- uses: actions/setup-node@v4
with:
node-version: 20

- name: Install Cypress (with npm ci)
working-directory: Frontend
run: |
# 👇 กันปัญหา permission node_modules ตรงนี้ด้วย
sudo chown -R $USER:$USER .
    npm ci
npx cypress install

- name: Run Cypress
working-directory: Frontend
run: |
npx cypress run --headless \
            --env BASE_URL=http://localhost:5173,API_URL=http://localhost:8080

- name: Upload E2E Artifacts
if: always()
uses: actions/upload-artifact@v4
with:
name: cypress-artifacts
path: |
Frontend/cypress/videos
Frontend/cypress/screenshots

- name: Shutdown
if: always()
run: docker compose down -v
