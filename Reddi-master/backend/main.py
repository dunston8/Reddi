from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.supabaseAPI import router as supabase_router
from app.api.lessonAPI import router as lesson_router
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()
app.include_router(supabase_router)
app.include_router(lesson_router)

origins_regex = r"(https://.*\.vercel\.app|http://localhost:\d+)" # Allow calls from frontend, both vercel and localhost

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=origins_regex,
    allow_credentials=True,
    allow_methods=["*"],  # POST, GET, OPTIONS, etc.
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}
