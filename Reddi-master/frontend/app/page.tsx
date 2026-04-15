"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Plus, Folder, Files, CalendarDays } from "lucide-react";
import Image from "next/image";
import VariationIndicator from "@/components/activities/VariationIndicator";
import TimeIndicator from "@/components/activities/TimeIndicator";
import LessonCreateView from "@/components/lessons/LessonCreateView";
import LessonView from "@/components/lessons/LessonView";
import LessonCollectionView from "@/components/lessons/LessonCollectionViewer";
import FileCollectionViewer from "@/components/files/FileCollectionViewer";
import CalendarView from "@/components/CalendarView"
import LoadingOverlay from "@/components/LoadingOverlay";
import AddActivityModal from "@/components/AddActivityModal";
import { FileItem } from "@/components/files/FileRow";
import { Activity, Lesson, ApiActivity, ActivityMode, createActivity } from "@/types/lesson";
import {
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
} from "@dnd-kit/sortable";



// Converts an activity to backend friendly type
function activityToApi(activity: Activity) {
  return {
    id: activity.id,
    type: activity.type,
    mode: activity.mode,
    duration: activity.duration,
    position: activity.position,
    variants: activity.variants,
    selected_variant_index: activity.selected_variant_index
  };
}


export function activityFromApi(api: ApiActivity): Activity {
  const selected_variant_index = 0;

  switch (api.type) {
    case "Samtalebilde": {
      const variants = api.variants;
      const current = variants[selected_variant_index];

      return {
        id: api.id,
        type: "Samtalebilde",
        mode: api.mode,
        duration: api.duration,
        position: api.position,

        variants,
        selected_variant_index,

        image: current.image,
        questions: current.questions
      };
    };
    case "Oppgaver": { 
      const variants = api.variants;
      const current = variants[selected_variant_index];

      return {
        id: api.id,
        type: "Oppgaver",
        mode: api.mode,
        duration: api.duration,
        position: api.position,

        variants,
        selected_variant_index,

        tasks: current.tasks
      };
    };
    
    case "Forklaringsvideo": {
      const variants = api.variants;
      const current = variants[selected_variant_index];

      return {
        id: api.id,
        type: "Forklaringsvideo",
        mode: api.mode,
        duration: api.duration,
        position: api.position,

        variants,
        selected_variant_index,

        video_url: current.video_url
      };
    }
    default:
      // Exhaustiveness check (future-proof)
      const _exhaustive: never = api;
      return _exhaustive;
  }
}


function createLessonKey(payload: unknown) {
  return JSON.stringify(payload);
}


const SortableActivities = dynamic(
  () => import("@/components/SortableActivities"),
  { ssr: false }
);

export default function Page() {
  // Lesson builder state
  const [id, setID] = useState(0);
  const [title, setTitle] = useState("Introduksjon til naturlig utvalg");
  const [subject, setSubject] = useState("Naturfag");
  const [grade, setGrade] = useState(10);
  const [duration, setDuration] = useState(30);
  const [template, setTemplate] = useState("Introduksjonsøkt");
  const [description, setDescription] = useState("I denne timen er hovedfokuset på at elevene skal bli kjent med helt grunnleggende begreper.");
  const [activityCount, setActivityCount] = useState(2);

  const [activities, setActivities] = useState<Activity[]>([createActivity("Samtalebilde", 1), createActivity("Oppgaver", 2)]);

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [hasFetchedLessons, setHasFetchedLessons] = useState(false);
  const [loadedLessonId, setLoadedLessonId] = useState<number | null>(null);

  const [loadingSteps, setLoadingSteps] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Cache state
  const [cachedLessonKey, setCachedLessonKey] = useState<string | null>(null);
  const [cachedActivities, setCachedActivities] = useState<Activity[] | null>(null);

  // Documents state
  const [documents, setDocuments] = useState<FileItem[]>([]);
  //const [selectedDocument, setSelectedDocument] = useState<FileItem | null>(null);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  type View =
  | "planner"
  | "lessonCreate"
  | "lessonViewer"
  | "lessonEdit"
  | "lessonCollection"
  | "fileCollection"
  | "calendarView";

  const [view, setView] = useState<View>("planner");


async function loadLessons() {
  if (hasFetchedLessons) {
    console.log("Already cached");
    return;
  }

  console.log("Fetching lessons from API: " + `${API}/supabase/lessons`);
  const res = await fetch(`${API}/supabase/lessons`, {
    method: "GET",
    headers: {
    "Content-Type": "application/json"
  }});
  const data: Lesson[] = await res.json();

  setLessons(data);
  setHasFetchedLessons(true);
};

  

// Generate lesson
async function generateLesson() {
  setIsLoading(true);
  setLoadingSteps([]);

  const payload = {
    lesson: {
      id,
      title,
      subject,
      grade,
      duration,
      template,
      description,
      activityCount
    },
    activities: activities.map(activityToApi),
  };

  // Check if input fields have changed, else use cached activities
  const lessonKey = createLessonKey(payload.lesson);
  if (cachedLessonKey === lessonKey && cachedActivities) {
    console.log("Using cached lesson");
    setActivities(cachedActivities);
    setView("lessonCreate");
    return;
  }

  payload.lesson.id = 0; // Generate new lesson

  // #1 Start generation (POST)
  const res = await fetch(`${API}/lesson/parseActivity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const { jobId } = await res.json();
  
  // #2 Listen to progress (SSE)
  const es = new EventSource(
    `${API}/lesson/parseActivity/stream?jobId=${jobId}`
  );

  es.addEventListener("step", (e) => {
    setLoadingSteps((prev) => [...prev, e.data]);
  });

  es.addEventListener("done", async (e) => {
    const generatedActivities = JSON.parse(e.data);
    setActivities(generatedActivities);
    setLoadingSteps((prev) => [...prev, "Setter sammen leksjon"]);

    console.log(generatedActivities);

    setCachedLessonKey(lessonKey);
    setCachedActivities(generatedActivities);

    // #3 Final lesson parse
    await fetch(`${API}/lesson/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        activities: generatedActivities,
      }),
    });

    setLoadingSteps((prev) => [...prev, "Leksjon ferdig!"]);
    setIsLoading(false);
    es.close();
    setView("lessonCreate");
  });

  es.addEventListener("error", () => {
    setLoadingSteps((prev) => [...prev, "Noe gikk galt"]);
    setIsLoading(false);
    es.close();
  });
}



async function saveLesson() {
  if (!activities || activities.length === 0) {
    console.warn("No activities to save");
  }

  const payload = {
    lesson: {
      id,
      title,
      subject,
      grade,
      duration,
      template,
      description
    },
    activities: activities.map(activityToApi)
  };


  if (payload.lesson.id && payload.lesson.id > 0) {
    //UPDATE
    console.log("Updating entry");
    await fetch(`${API}/lesson/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } else {
    //INSERT
    console.log("Inserting new entry");
    await fetch(`${API}/lesson/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }
  setHasFetchedLessons(false);
  loadLessons();
  setView("lessonViewer");
}


async function deleteLesson() {
    try {
      const res = await fetch(`${API}/lesson/delete/${id}/`, {
          method: "DELETE"
      });

      if (!res.ok) {
        console.error(`Failed to remove lesson with id: ${id}: ${res.statusText}`);
      } else {
        console.log(`Lesson with id: ${id} removed successfully`);
      }
    } catch (err) {
      console.error(`Error removing ${id}:`, err);
    }
}


function onSelectVariant(id: string, index: number) {
  setActivities(prevActivities =>
    prevActivities.map(activity => {
      if (activity.id === id) {
        // Create a new activity object with the updated index
        return {
          ...activity,
          selected_variant_index: Math.max(0, Math.min(index, activity.variants.length - 1))
        };
      }
      return activity; // unchanged activities
    })
  );
}


async function saveDocuments(docs: FileList, existingFiles: FileItem[]) {
  if (!docs || docs.length === 0) return;

  for (let i = 0; i < docs.length; i++) {
    const file = docs[i];

    const uniqueName = getUniqueFilename(file.name, existingFiles.map(f => f.filename));

    const formData = new FormData();
    formData.append("file", file, uniqueName);
    try {
      const res = await fetch(`${API}/supabase/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        console.error(`Failed to upload ${file.name}: ${res.statusText}`);
      } else {
        console.log(`${file.name} uploaded successfully`);
      }
    } catch (err) {
      console.error(`Error uploading ${file.name}:`, err);
    }
  }

  // Refresh documents and lessons after upload
  await fetchDocuments();
  await loadLessons();
}


function getUniqueFilename(filename: string, existingFiles: string[]): string {
  if (!existingFiles.includes(filename)) return filename;

  const extIndex = filename.lastIndexOf(".");
  const name = extIndex >= 0 ? filename.slice(0, extIndex) : filename;
  const ext = extIndex >= 0 ? filename.slice(extIndex) : "";

  let counter = 1;
  let newFilename = `${name} (${counter})${ext}`;
  while (existingFiles.includes(newFilename)) {
    counter++;
    newFilename = `${name} (${counter})${ext}`;
  }
  return newFilename;
}


async function fetchDocuments() {
  try {
    const res = await fetch(`${API}/supabase/`);
    const data = await res.json();

    if (Array.isArray(data)) setDocuments(data);
    else if (Array.isArray(data.documents)) setDocuments(data.documents);
    else if (Array.isArray(data.data)) setDocuments(data.data);
    else setDocuments([]);
  } catch (err) {
    console.error("Failed to fetch documents:", err);
    setDocuments([]);
  }
}

async function removeDocument(id: number) {
    try {
      const res = await fetch(`${API}/supabase/remove/${id}/`, {
          method: "DELETE"
      });

      if (!res.ok) {
        console.error(`Failed to remove file with id: ${id}: ${res.statusText}`);
      } else {
        console.log(`File with id: ${id} removed successfully`);
      }
    } catch (err) {
      console.error(`Error removing ${id}:`, err);
    }
    // Refresh documents and lessons after upload
    await fetchDocuments();
    await loadLessons();
}


function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  setActivities(prev => {
    const oldIndex = prev.findIndex(a => a.id === active.id);
    const newIndex = prev.findIndex(a => a.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return prev;

    const moved = arrayMove(prev, oldIndex, newIndex);

    // rewrite positions AFTER reorder
    return moved.map((activity, index) => ({
      ...activity,
      position: index
    }));
  });
}

function removeActivity(index: number) {
  setActivities((prev) => prev.filter((_, i) => i !== index));
}

const [showAddActivityModal, setShowAddActivityModal] = useState(false);

function addActivity(type: "Oppgaver" | "Samtalebilde", mode: ActivityMode, duration: number) {
  setActivities((prev) => {
    const newActivity = { ...createActivity(type, prev.length), mode, duration, id: `${type}-${Date.now()}` };
    return [...prev, newActivity];
  });
}


const onLoadActivities = useCallback(async (lessonId: number) => {
  // If we are switching lessons, clear immediately
  if (loadedLessonId !== null && loadedLessonId !== lessonId) {
    setActivities([]);
  }

  // If already loaded, do nothing
  if (loadedLessonId === lessonId) return;

  const res = await fetch(`${API}/lesson/activities/${lessonId}/`);
  if (!res.ok) {
    console.error("Failed to load activities");
    return;
  }

  const apiActivities: ApiActivity[] = await res.json();

  const activities: Activity[] = apiActivities
    .map(activityFromApi)
    .sort((a, b) => a.position - b.position);

  setActivities(activities);
  setLoadedLessonId(lessonId);
}, [loadedLessonId, API]);



  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Left Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col gap-6">
        <div className="relative h-42 w-42">
          <Image src="/Reddi_logo.png" alt="Reddi Logo" fill className="object-contain" />
        </div>

        <button
          onClick={() => setView("planner")} 
          className="bg-emerald-600 text-white py-3 rounded-xl font-medium hover:bg-emerald-500 transition text-lg"
        >
          + Planlegg en økt
        </button>

        <button
          onClick={() => { setView("lessonCollection"); loadLessons()}} 
          className="flex items-center gap-2 text-slate-300 py-3 px-4 rounded-xl font-medium hover:bg-slate-700 hover:text-white transition text-lg"
        >
          <Folder className="w-5 h-5 stroke-2" />
          <span className="leading-none">Min samling</span>
        </button>

        <button
          onClick={() => { setView("fileCollection"); fetchDocuments()}} 
          className="flex items-center gap-2 text-slate-300 py-3 px-4 rounded-xl font-medium hover:bg-slate-700 hover:text-white transition text-lg"
        >
          <Files className="w-5 h-5 stroke-2" />
          <span className="leading-none">Mine filer</span>
        </button>
        

        <button
          onClick={() => { setView("calendarView")}} 
          className="flex items-center gap-2 text-slate-300 py-3 px-4 rounded-xl font-medium hover:bg-slate-700 hover:text-white transition text-lg"
        >
          <CalendarDays className="w-5 h-5 stroke-2" />
          <span className="leading-none">Kalender</span>
        </button>

        <div className="mt-auto flex items-center gap-3">
          <div className="h-10 w-10 rounded-full border border-slate-600 flex items-center justify-center text-slate-200 font-medium">
            MF
          </div>
          <span className="text-sm text-slate-400">Profil</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">
        
        {view === "lessonCreate" && (
          <LessonCreateView
            lesson={{ id: 0, title, subject, grade, duration, template, description, activityCount: activityCount}}
            activities={activities}
            onLoadActivities={onLoadActivities}
            onBack={() => {setLoadedLessonId(0); setView("planner")}}
            onSave={() => saveLesson()}
            onDelete={() => {setLoadedLessonId(0); setCachedLessonKey(""); setView("planner")}}
            onSelectVariant={(id, index) => onSelectVariant(id, index)}
            setActivities={(a) => setActivities(a)}
          />
        )}

        {view === "lessonEdit" && (
          <LessonCreateView
            lesson={{ id: id, title, subject, grade, duration, template, description, activityCount: activityCount}}
            activities={activities}
            onLoadActivities={onLoadActivities}
            onBack={() => {setLoadedLessonId(0); setView("lessonViewer")}}
            onSave={() => saveLesson()}
            onDelete={() => {deleteLesson(); setView("lessonCollection")}}
            onSelectVariant={(id, index) => onSelectVariant(id, index)}
            setActivities={(a) => setActivities(a)}
          />
        )}
        

        {view === "lessonCollection" && (
          <LessonCollectionView
            lessons={lessons}
            onBack={() => setView("planner")}
            onOpenLesson={(lesson) => {
              setID(lesson.id);
              setTitle(lesson.title);
              setSubject(lesson.subject);
              setGrade(lesson.grade);
              setDuration(lesson.duration);
              setTemplate(lesson.template);
              setDescription(lesson.description);
              setActivityCount(lesson.activityCount);
              setView("lessonViewer");
            }}
          />
        )}

        {view === "lessonViewer" && (
          <LessonView
            lesson={{ id: id, title, subject, grade, duration, template, description, activityCount: activityCount}}
            activities={activities}
            onLoadActivities={onLoadActivities}
            onBack={() => setView("lessonCollection")}
            onEdit={() => setView("lessonEdit")}
            onExport={() => console.log("Export lesson")}
          />
        )}

        {view === "fileCollection" && (
          <FileCollectionViewer
            files={documents}
            onBack={() => setView("planner")}
            onUpload={(newFiles: FileList) => saveDocuments(newFiles, documents)}
            onOpenFile={() => null}
            onDeleteFile={(id: number) => removeDocument(id)}
          />
        )}


        {view === "calendarView" && (
          <CalendarView
            lessons={lessons}
            onBack={() => setView("planner")}
            onOpenLesson={(lesson) => {
              setID(lesson.id);
              setTitle(lesson.title);
              setSubject(lesson.subject);
              setGrade(lesson.grade);
              setDuration(lesson.duration);
              setTemplate(lesson.template);
              setDescription(lesson.description);
              setActivityCount(lesson.activityCount);
              setView("lessonViewer");
            }}
          />
        )}


        {view === "planner" && (
          <div className="grid grid-cols-12 gap-8">
            {/* Form */}
            <section className="col-span-7 bg-white rounded-2xl shadow p-8 space-y-6 border-t-4 border-emerald-500">
              <h1 className="text-3xl font-bold text-emerald-700">Planlegg en økt</h1>

              <div>
                <label className="text-sm font-semibold text-slate-700">Navn på økta</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full border rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <select
                  className="border rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  <option value="Naturfag">Naturfag</option>
                  <option value="Matte">Matte</option>
                </select>


                <select
                  className="border rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={grade}
                  onChange={(e) => setGrade(parseInt(e.target.value, 10))}
                >
                  {[...Array(10)].map((_, i) => {
                    const val = 1 + i;
                    return (
                      <option key={i} value={val}>
                        {val}. trinn
                      </option>
                    );
                  })}
                </select>


                <select
                  className="border rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                >
                  <option value={30}>30 min</option>
                  <option value={60}>60 min</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Økt-mal</label>
                <select className="mt-1 w-full border rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                >
                  <option>Introduksjonsøkt</option>
                  <option>Tema-dag</option>
                  <option>Oppsummering</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Beskrivelse av økta</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full border rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <button
                onClick={generateLesson}
                className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition text-lg"
              >
                Lag et undervisningsopplegg
              </button>

              
              {/* Loading overlay when generating  */}
              {isLoading && (
                <LoadingOverlay
                  steps={loadingSteps}
                  totalSteps = {activities.length}
                />
              )}
            </section>

            {/* Activity builder */}
            <div className="col-span-5 flex flex-col gap-4">
              <section className="bg-slate-50 rounded-2xl shadow p-6 space-y-4 border border-slate-200">
                <h2 className="font-bold text-lg mb-4 text-slate-900">Øktbygger</h2>

                <SortableActivities
                  activities={activities}
                  onDragEnd={handleDragEnd}
                  onRemove={removeActivity}
                />

                <button
                  onClick={() => setShowAddActivityModal(true)}
                  className="mt-4 w-full border-2 border-dashed rounded-lg py-2 flex items-center justify-center gap-2 text-emerald-700 text-lg hover:bg-emerald-50 transition"
                >
                  <Plus className="h-4 w-4" />
                  Legg til aktivitet
                </button>
              </section>

              {/* Indicators */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <VariationIndicator activities={activities} />
                </div>
                <div className="flex-1">
                  <TimeIndicator activities={activities} sessionDuration={duration} />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {showAddActivityModal && (
        <AddActivityModal
          onAdd={addActivity}
          onClose={() => setShowAddActivityModal(false)}
        />
      )}
    </div>
  );
}
