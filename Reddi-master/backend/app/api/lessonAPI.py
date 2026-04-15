import json
import time
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.api.supabaseAPI import supabase
from app.core.lesson_parser import LessonRequest
from app.agents.registry import ACTIVITY_GENERATORS
from uuid import uuid4



jobs = {}  # job_id -> { steps: [], done: bool, result: [] }

router = APIRouter(
    prefix="/lesson",
    tags=["lesson"]
)

@router.post("/save")
def save_lesson(payload: LessonRequest):    
    lesson = payload.lesson
    activities = payload.activities

    #1. Insert lesson
    lesson_data = {
        "title": lesson.title,
        "original_title": lesson.title,
        "subject": lesson.subject,
        "grade": lesson.grade,
        "duration": lesson.duration,
        "template": lesson.template,
        "description": lesson.description,
        "activity_count": len(activities)
    }
    response = supabase.table("lessons").insert(lesson_data).execute()
    
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create lesson")

    lesson_id = response.data[0]["id"]

     # 2. Prepare activities for bulk insert
    activity_rows = []

    for idx, activity in enumerate(activities):
        data = activity.model_dump()

        activity_rows.append({
            "lesson_id": lesson_id,
            "type": data["type"],
            "mode": data["mode"],
            "duration": data["duration"],
            "position": idx,
            "variants": data["variants"],
            "selected_variant_index": data["selected_variant_index"],
        })

    # 3. Insert all activities at once
    if activity_rows:
        supabase.table("activities").insert(activity_rows).execute()

    return {
        "lesson_id": lesson_id,
        "activity_count": len(activity_rows)
    }


@router.delete("/delete/{lessonId}/")
def delete_lesson(lessonId: int):
    res = supabase.table("lessons").delete().eq("id", lessonId).execute()
    if not res.data:
        raise ValueError(lessonId + " is an invalid lesson ID")

    return res.data


@router.put("/update")
def update_lesson(payload: LessonRequest):
    lesson = payload.lesson
    activities = payload.activities

    lesson_data = {
        "title": lesson.title,
        "subject": lesson.subject,
        "grade": lesson.grade,
        "duration": lesson.duration,
        "template": lesson.template,
        "description": lesson.description
    }

    # 1. Update lesson
    supabase.table("lessons").update(lesson_data).eq("id", lesson.id).execute()

     # 2. Remove existing activities
    supabase.table("activities").delete().eq("lesson_id", lesson.id).execute()

    # 3. Insert updated activities with correct ordering
    activity_rows = []

    for idx, activity in enumerate(activities):
        data = activity.model_dump()

        activity_rows.append({
            "lesson_id": lesson.id,
            "type": data["type"],
            "mode": data["mode"],
            "duration": data["duration"],
            "position": idx,
            "variants": data["variants"],
            "selected_variant_index": data["selected_variant_index"],
        })

    if activity_rows:
        supabase.table("activities").insert(activity_rows).execute()

    return {
        "lesson_id": lesson.id,
        "activity_count": len(activity_rows)
    }


@router.get("/activities/{lessonId}/")
def get_lesson_activities(lessonId: int):
    res = (
        supabase
        .table("activities")
        .select("*")
        .eq("lesson_id", lessonId)
        .order("position")
        .execute()
    )

    if not res.data:
        return []

    return res.data


@router.post("/parse")
def parse_lesson(payload: LessonRequest):    
    total_time = sum(o.duration for o in payload.activities)
    return {
        "status": "ok",
        "total_objective_time": total_time,
        "lesson": payload.lesson,
        "activities": payload.activities
    }


@router.post("/parseActivities")
def parse_activities(payload: LessonRequest):
    lesson = payload.lesson
    generated_activities = []

    for activity in payload.activities:
        generator = ACTIVITY_GENERATORS.get(activity.type)
        if not generator:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported activity type: {activity.type}"
            )

        generated = generator(
            topic=lesson.title,
            subject=lesson.subject,
            grade=lesson.grade,
            id=activity.id,
            mode=getattr(activity, "mode", "Helklasse"),
            duration=activity.duration,
            position=activity.position
        )

        generated_activities.append(generated)

    return {
        "activities": generated_activities
    }





@router.post("/parseActivity")
def parse_activity(payload: LessonRequest):
    job_id = str(uuid4())

    jobs[job_id] = {
        "steps": ["Starter generering"],
        "done": False,
        "result": None,
    }

    def run_job():
        lesson = payload.lesson
        generated = []

        for activity in payload.activities:
            jobs[job_id]["steps"].append(
                f"Genererer {activity.type}"
            )

            generator = ACTIVITY_GENERATORS[activity.type]
            generated.append(
                generator(
                    topic=lesson.title,
                    subject=lesson.subject,
                    grade=lesson.grade,
                    id=activity.id,
                    mode=activity.mode,
                    duration=activity.duration,
                    position=activity.position,
                )
            )

        jobs[job_id]["result"] = generated
        jobs[job_id]["done"] = True

    import threading
    threading.Thread(target=run_job).start()

    return {"jobId": job_id}


@router.get("/parseActivity/stream")
def parse_activity_stream(jobId: str):
    def event_stream():
        last_idx = 0

        while True:
            job = jobs.get(jobId)
            if not job:
                yield "event: error\ndata: Job not found\n\n"
                return

            steps = job["steps"]
            for step in steps[last_idx:]:
                yield f"event: step\ndata: {step}\n\n"
            last_idx = len(steps)

            if job["done"]:
                yield f"event: done\ndata: {json.dumps(job['result'])}\n\n"
                return

            time.sleep(0.3)

    return StreamingResponse(event_stream(), media_type="text/event-stream")



def sse(event: str, data):
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"