# EduAI – AI-Powered Personalized Learning & Skill Development Platform

EduAI is a complete, production-ready, full-stack web application designed to deliver customized education using advanced artificial intelligence. The platform performs skill gap analysis, generates study schedules, charts career roadmaps, acts as an interactive tutor, parses uploaded documents, and presents in-depth analytics.

## Technology Stack

- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Redux Toolkit, React Router, Chart.js, Axios
- **Backend Gateway**: Node.js, Express.js, TypeScript, PostgreSQL (via Node-Postgres pg client), JWT, bcrypt
- **AI Microservice**: Python, FastAPI, Google Gemini API, LangChain, Scikit-Learn, Pandas
- **Deployment**: Docker, Docker Compose, Nginx

---

## Folder Structure

```
d:/ed/
├── backend/            # Express.js REST API server
├── ai-service/         # FastAPI AI service (Python)
├── frontend/           # React + Vite + TypeScript web client
├── docker-compose.yml  # Orchestrates database, backend, AI service & frontend
├── nginx.conf          # Nginx configurations
└── .env.example        # Environment variables configuration template
```

---

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose installed.
- OR local development runtimes:
  - [Node.js v18+](https://nodejs.org/)
  - [Python 3.10+](https://www.python.org/)
  - [PostgreSQL](https://www.postgresql.org/)

---

### Method A: Running with Docker (Recommended)

1. Clone or copy this workspace to your system.
2. Create a `.env` file in the root directory by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Set your `GEMINI_API_KEY` in the `.env` file:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key
   ```
4. Build and start all containers using Docker Compose:
   ```bash
   docker-compose up --build
   ```
5. Once running, access the services:
   - **React Web Client**: [http://localhost:3000](http://localhost:3000)
   - **Express Backend API**: [http://localhost:5000](http://localhost:5000)
   - **FastAPI AI Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Method B: Running Services Locally for Development

#### 1. PostgreSQL Database
Ensure a local PostgreSQL database is running, create a database named `eduai_db`, and configure the backend `.env` accordingly.

#### 2. AI Microservice
```bash
cd ai-service
python -m venv venv
# On Windows
.\venv\Scripts\activate
# On Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
python app/main.py
```
*Runs on [http://localhost:8000](http://localhost:8000)*

#### 3. Express Backend
```bash
cd backend
npm install
npm run migrate   # Initializes schema and database seed data
npm run dev
```
*Runs on [http://localhost:5000](http://localhost:5000)*

#### 4. Frontend Client
```bash
cd frontend
npm install
npm run dev
```
*Runs on [http://localhost:3000](http://localhost:3000)*

---

## Testing

- **Backend Gateway**: Runs unit/integration tests with Jest:
  ```bash
  cd backend && npm run test
  ```
- **AI Microservice**: Runs unit tests with pytest:
  ```bash
  cd ai-service && pytest
  ```

---

## Method C: Cloud Production Deployment (Without local Docker)

Follow these steps to host the platform on the internet fully in the cloud:

### 1. PostgreSQL Database (Neon)
1. Sign up/log in at [Neon](https://neon.tech) and create a new serverless PostgreSQL database.
2. Retrieve your connection string (e.g. `postgres://user:password@host/dbname?sslmode=require`).
3. You can run migrations directly using the backend CLI after setting the `DATABASE_URL` or configuration variables in the backend.

### 2. Unified Backend & AI Services (Koyeb)
To fit fully within Koyeb's **100% Free Tier** (which provides one active container 24/7), both the Express Backend and the Python FastAPI AI service are bundled into a single production Dockerfile ([Dockerfile.prod](file:///d:/ed/Dockerfile.prod)).

1. Sign up/log in at [Koyeb](https://koyeb.com).
2. Create a new service on Koyeb, and select your GitHub repository.
3. Configure the service definition:
   - **Dockerfile**: Set the Dockerfile path to `Dockerfile.prod` (located in the root of the project).
   - **Ports**: Expose port `5000` (which serves the Express Gateway).
   - **Environment Variables**:
     - `PORT` = `5000`
     - `NODE_ENV` = `production`
     - `JWT_SECRET` = `your_super_secret_jwt_key`
     - `GEMINI_API_KEY` = `your_gemini_api_key`
     - `DB_HOST` = `your-neon-hostname.neon.tech`
     - `DB_PORT` = `5432`
     - `DB_USER` = `your_db_user`
     - `DB_PASSWORD` = `your_db_password`
     - `DB_NAME` = `your_db_name`
4. Deploy the service. The Express backend will automatically communicate with the AI microservice locally on the container (latency = 0ms).
5. Once live, note down its public URL (e.g. `https://your-service-name.koyeb.app`).


### 3. React Frontend Client (Netlify)
1. Run a build to generate static assets:
   ```bash
   cd frontend
   npm install
   # Set environment variables for compilation:
   # On Windows (PowerShell):
   $env:VITE_API_URL="https://your-backend-service.koyeb.app/api"
   $env:VITE_AI_URL="https://your-ai-service.koyeb.app"
   npm run build
   ```
2. Deploys are handled automatically by placing [netlify.toml](file:///d:/ed/frontend/netlify.toml) in the frontend root.
3. Install Netlify CLI: `npm install -g netlify-cli`.
4. Log in and deploy:
   ```bash
   npx netlify login
   npx netlify deploy --dir=dist --prod
   ```

