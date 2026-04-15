# Reddi (AI teacher assistant)

[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Open-green?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-13-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-DB-green?logo=supabase&logoColor=white)](https://supabase.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-API-red?logo=openai&logoColor=white)](https://platform.openai.com/)

An MVP web application that helps teachers generate lectures from uploaded documents using AI.  
Built as part of a Computer Engineering Bachelor project.

---

## 🚀 Features

- User authentication via Google (Better Auth + Next.js)
- Upload documents (PDF, DOCX) to Supabase Storage
- Backend AI processing using FastAPI + OpenAI
- Vector-based document search with Supabase `pgvector`
- Auto-generated lecture notes, images, and structure

---

## 🛠 Tech Stack

**Frontend**  
- Next.js (React + TypeScript)  
- Tailwind CSS  
- Better Auth for authentication  

**Backend**  
- FastAPI  
- Uvicorn  
- OpenAI API  

**Database / Storage**  
- Supabase (PostgreSQL + Storage + pgvector)  

**Development Tools**  
- VS Code  
- Git + GitHub  
- Python 3.11 virtual environment (`venv`)  
- Node.js / npm  

---

## 📦 Setup / Installation

### 1. Clone the repository

```bash
git clone https://github.com/Happyman00/Reddi.git
cd Reddi
```


### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```
Open your browser at http://localhost:3000



### 3. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```
Open http://localhost:8000/health to verify the backend is running.
Or https://localhost:8000/docs for FastAPI dashboard



### 4. Environment variables
```bash
Create a .env file in backend/:
OPENAI_API_KEY=<your-openai-api-key>
SUPABASE_URL=<your-supabase-url>
SUPABASE_KEY=<your-supabase-anon-or-service-key>
UNSPLASH_KEY=<your-unsplash-key>
```


### 5. Start environment (when packages are already installed)
```bash
Ctrl + Shift + P
"Tasks: Run Task"
"Start Full Dev Environment"
```

📁 Folder Structure
```bash
Reddi/
├── frontend/          # Next.js frontend
│   ├── app/ 
│   │   └──  page.tsx
│   ├── components/             # View forms used to render different components
│   │   ├── activities/         
│   │   ├── files/
│   │   └── lessons/
│   ├── public/ 
│   │   └── Reddi-logo.png
│   └── types/ 
│       └── lesson.ts           # Lesson and activity types for frontend
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── agents/             # Agents used to generate lessons
│   │   ├── api/                # Endpoints
│   │   ├── core/
│   │   ├── services/           # Agent builders, file parsers, etc.
│   │   └── main.py
│   ├── venv/
│   └── .env
├── docs/              # Project documentation
├── .gitignore
└── README.md
```
