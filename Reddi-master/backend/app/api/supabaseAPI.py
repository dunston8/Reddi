import pathlib
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from app.services.supabase_client import supabase
from app.services.fileParser import parse_book_from_supabase, Chunk
from app.agents.chunk_topics_agent import add_tags_to_chunks
from datetime import datetime, timezone


router = APIRouter(
    prefix="/supabase",
    tags=["supabase"]
)


@router.get("/chunk")
def chunk_pdf(path: str):
    id_res = supabase.table("documents").select("id").eq("filename", path).limit(1).execute()
    if not id_res.data:
        raise ValueError(f"No document found for filename={path}")
    document_id = id_res.data[0]["id"]

    clear_existing_chunks(document_id)
    chunks = parse_book_from_supabase(path, document_id)
    store_chunks(chunks)
    tag_chunks(path)

    return "ok"



BATCH_SIZE = 30

def batch(iterable, size):
    for i in range(0, len(iterable), size):
        yield iterable[i:i + size]


def tag_chunks(path: str):
    id_res = supabase.table("documents").select("id").eq("filename", path).limit(1).execute()
    if not id_res.data:
        raise ValueError(f"No document found for filename={path}")
    document_id = id_res.data[0]["id"]

    chunks_res = supabase.table("document_chunks").select("*").eq("document_id", document_id).eq("is_tagged", False).execute()
    if not chunks_res.data:
        raise ValueError(f"No chunks generated for document with id={document_id}")

    rows = chunks_res.data
    chunks = [Chunk(**row) for row in rows]
    
    for chunk_batch in batch(chunks, BATCH_SIZE):

        tagged_batch = add_tags_to_chunks(chunk_batch)
        for chunk in tagged_batch:
                supabase.table("document_chunks") \
                    .update({
                        "tags": chunk.tags,
                        "embedding": chunk.embedding,
                        "is_tagged": True
                    }) \
                    .eq("id", chunk.id) \
                    .execute()

        print("Tagging complete.")


@router.get("/")
def list_documents():
    response = (
        supabase
        .table("documents")
        .select("id, filename, last_edited, fagtype")
        .order("created_at", desc=True)
        .execute()
    )

    return response.data


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Read file contents
    contents = await file.read()
    
    # Upload to Supabase storage
    supabase.table("documents").insert({
        "filename":file.filename,
        "source":pathlib.Path(file.filename).suffix,
        "last_edited": datetime.now(timezone.utc).isoformat()
    }).execute()

    supabase.storage.from_("uploads").upload(file.filename, contents)
    return {"file_path": file.filename}


@router.delete("/remove/{fileId}/")
async def remove_file(fileId: int):
    file_data = supabase.table("documents").select("filename").eq("id", fileId).limit(1).execute()
    if file_data.data:
        filename = file_data.data[0]["filename"]

    if not filename:
        raise HTTPException(status_code=400, detail="filename is required")

    try:
        result = supabase.storage.from_("uploads").remove([filename])
        supabase.table("documents").delete().eq("id", fileId).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "status": "Success",
        "response": result
    }


@router.get("/list")
def list_files(
    path: str = Query(default="", description="Folder path inside bucket")
):
    try:
        files = supabase.storage.from_("uploads").list(path)
    except Exception as e:
        return {
            "status": "error",
            "detail": str(e)
        }

    return {
        "path": path,
        "items": files
    }


@router.get("/lessons")
def get_lessons():
    response = supabase.table("lessons").select("*").order("created_at", desc=True).execute()
    if response.data is None:
        raise HTTPException(status_code=500, detail="Could not fetch lessons")

    return response.data



def store_chunks(
    chunks: list[Chunk]
):
    rows = []

    for c in chunks:
        if(len(c.content.split())>4):  # Only add chunks that are large enough
            rows.append({
                "document_id": c.document_id,
                "type": c.type,
                "title": c.title,
                "content": c.content,
                "tags": c.tags,
                "page_start": c.page_start,
                "page_end": c.page_end,
                "token_count": len(c.content.split()),
                "is_exercise": False
            })

    supabase.table("document_chunks").insert(rows).execute()



def clear_existing_chunks(document_id: str):
    supabase.table("document_chunks") \
        .delete() \
        .eq("document_id", document_id) \
        .execute()
