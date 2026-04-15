"use client";

import { FC } from "react";
import { GripVertical, X, MessageCircle, PenLine, Play, User, Users, ClipboardList } from "lucide-react";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { ActivityRenderer } from "@/components/activities/ActivityRenderer";
import { Activity, ActivityType, ActivityMode, Lesson } from "@/types/lesson";
import { useEffect, useRef, useState } from "react";
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverlay } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const typeConfig: Record<ActivityType, {
  icon: typeof MessageCircle;
  label: string;
  bg: string;
  border: string;
  accent: string;
  barColor: string;
}> = {
  Samtalebilde: {
    icon: MessageCircle,
    label: "Samtalebilde",
    bg: "/backgrounds/samtalebilde.svg",
    border: "border-l-emerald-500",
    accent: "text-emerald-700",
    barColor: "bg-emerald-400",
  },
  Oppgaver: {
    icon: PenLine,
    label: "Oppgaver",
    bg: "/backgrounds/oppgaver.svg",
    border: "border-l-blue-500",
    accent: "text-blue-700",
    barColor: "bg-blue-400",
  },
  Forklaringsvideo: {
    icon: Play,
    label: "Forklaringsvideo",
    bg: "/backgrounds/forklaringsvideo.svg",
    border: "border-l-amber-500",
    accent: "text-amber-700",
    barColor: "bg-amber-400",
  },
};

const modeConfig: Record<ActivityMode, {
  icon: typeof User;
  label: string;
  overlay: string;
}> = {
  Helklasse: {
    icon: ClipboardList,
    label: "Helklasse",
    overlay: "bg-blue-50/40",
  },
  Grupper: {
    icon: Users,
    label: "Grupper",
    overlay: "bg-purple-50/40",
  },
  Individuelt: {
    icon: User,
    label: "Individuelt",
    overlay: "bg-amber-50/40",
  },
};


// Compact info bar used both in-list (collapsed) and as the DragOverlay
function ActivityInfoBar({
  activity,
  index,
  dragHandle,
}: {
  activity: Activity;
  index: number;
  dragHandle?: React.ReactNode;
}) {
  const type = typeConfig[activity.type];
  const mode = modeConfig[activity.mode];
  const TypeIcon = type.icon;
  const ModeIcon = mode.icon;

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl border-l-4 ${type.border}
        bg-white shadow-sm
      `}
    >
      <div
        className="absolute inset-0 bg-right bg-no-repeat bg-contain opacity-90 pointer-events-none"
        style={{ backgroundImage: `url(${type.bg})` }}
      />
      <div className={`absolute inset-0 ${mode.overlay} pointer-events-none`} />

      <div className="relative px-4 py-2 flex items-center gap-3">
        {dragHandle}

        <div className={`flex items-center gap-1.5 font-semibold ${type.accent}`}>
          <TypeIcon className="h-4 w-4" />
          <span>Del {index + 1}: {type.label}</span>
        </div>

        <div className="flex items-center gap-1 text-sm text-slate-500">
          <ModeIcon className="h-3.5 w-3.5" />
          <span>{mode.label}</span>
        </div>

        <span className="px-2 py-0.5 rounded-full bg-white/70 text-xs font-medium text-slate-600">
          {activity.duration} min
        </span>
      </div>
    </div>
  );
}

// Sortable activity item
function SortableActivityItem({
  activity,
  index,
  collapsed,
  onRemove,
  onSelectVariant,
  onRegenerate
}: {
  activity: Activity;
  index: number;
  collapsed: boolean;
  onRemove: () => void;
  onSelectVariant: (id: string, index: number) => void;
  onRegenerate: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const type = typeConfig[activity.type];
  const mode = modeConfig[activity.mode];
  const TypeIcon = type.icon;
  const ModeIcon = mode.icon;

  const isAtStart = activity.selected_variant_index === 0;
  const isAtEnd = activity.selected_variant_index === activity.variants.length - 1;

  const handlePrev = () => {
    if (isAtStart) return;
    onSelectVariant(activity.id, activity.selected_variant_index - 1);
  };

  const handleNext = () => {
    if (isAtEnd) return;
    onSelectVariant(activity.id, activity.selected_variant_index + 1);
  };

  const handleRegenerate = () => {
    onRegenerate(activity.id);
  };

  // When collapsed: render compact info bar (placeholder if this is the dragged item)
  if (collapsed) {
    return (
      <li
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={isDragging ? "opacity-40" : ""}
      >
        <ActivityInfoBar
          activity={activity}
          index={index}
          dragHandle={
            <button
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-200/60 transition-colors"
            >
              <GripVertical className="h-5 w-5 text-slate-400" />
            </button>
          }
        />
      </li>
    );
  }

  // Expanded (not dragging)
  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`
        relative overflow-hidden rounded-xl border-l-4 ${type.border}
        bg-white shadow-sm hover:shadow-md transition-shadow duration-200
      `}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 bg-right bg-no-repeat bg-contain opacity-90 pointer-events-none"
        style={{ backgroundImage: `url(${type.bg})` }}
      />
      {/* Mode color overlay */}
      <div className={`absolute inset-0 ${mode.overlay} pointer-events-none`} />

      {/* Content */}
      <div className="relative px-4 py-4 space-y-3">
        {/* Activity header */}
        <div className="flex items-center gap-3">
          {/* Drag handle */}
          <button
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-200/60 transition-colors"
          >
            <GripVertical className="h-5 w-5 text-slate-400" />
          </button>

          {/* Type icon + label */}
          <div className={`flex items-center gap-1.5 font-semibold ${type.accent}`}>
            <TypeIcon className="h-4 w-4" />
            <span>Del {index + 1}: {type.label}</span>
          </div>

          {/* Mode badge */}
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <ModeIcon className="h-3.5 w-3.5" />
            <span>{mode.label}</span>
          </div>

          {/* Duration badge */}
          <span className="px-2 py-0.5 rounded-full bg-white/70 text-xs font-medium text-slate-600">
            {activity.duration} min
          </span>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Variant navigation */}
          <div className="flex items-center gap-1">
            <ChevronLeft
              className={`h-4 w-4 transition
                ${isAtStart
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-700 cursor-pointer hover:text-slate-900"
                }`}
              onClick={handlePrev}
            />
            <span className="text-xs text-slate-500 tabular-nums">
              {activity.selected_variant_index + 1} / {activity.variants.length}
            </span>
            <ChevronRight
              className={`h-4 w-4 transition
                ${isAtEnd
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-700 cursor-pointer hover:text-slate-900"
                }`}
              onClick={handleNext}
            />
            <RotateCcw
              className="h-4 w-4 text-slate-700 cursor-pointer hover:text-slate-900"
              onClick={handleRegenerate}
            />
          </div>

          {/* Delete button */}
          <button
            onClick={onRemove}
            className="p-1 rounded hover:bg-red-100 transition-colors group"
          >
            <X className="h-4 w-4 text-slate-400 group-hover:text-red-500 transition-colors" />
          </button>
        </div>

        {/* Activity content */}
        <ActivityRenderer activity={activity} />
      </div>
    </li>
  );
}


interface LessonViewProps {
  lesson: Lesson;
  activities: Activity[];
  onLoadActivities: (lessonId: number) => void;
  onBack: () => void;
  onSave: () => void;
  onDelete: () => void;
  onSelectVariant: (id: string, index: number) => void;
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
}

const LessonCreateView: FC<LessonViewProps> = ({ lesson, activities, onLoadActivities, onBack, onSave, onDelete, onSelectVariant, setActivities }) => {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
      if (lesson.id) {
        onLoadActivities(lesson.id);
      }
    }, [lesson.id]);

  return (
    <div className="flex-1 p-10 grid grid-cols-12 gap-8 text-slate-900">
      {/* Left sidebar */}
      <aside className="col-span-3 bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
        <h2 className="font-bold text-xl text-slate-900">
          {lesson.title}
        </h2>

        <p className="text-sm">
          <span className="font-semibold text-slate-800">Fag:</span>{" "}
          <span className="text-slate-900">{lesson.subject}</span>
        </p>

        <p className="text-sm">
          <span className="font-semibold text-slate-800">Trinn:</span>{" "}
          <span className="text-slate-900">{lesson.grade}</span>
        </p>

        <p className="text-sm">
          <span className="font-semibold text-slate-800">Varighet:</span>{" "}
          <span className="text-slate-900">{lesson.duration} min</span>
        </p>

        <div className="mt-auto flex flex-col gap-3 pt-4">
          <button
            onClick={onBack}
            className="bg-slate-200 text-slate-900 py-2 rounded-lg font-medium hover:bg-slate-300 transition"
          >
            ← Tilbake
          </button>

          <button
            onClick={onSave}
            className="bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 transition"
          >
            Lagre
          </button>

          <button
            onClick={onDelete}
            className="bg-red-700 text-white py-2 rounded-lg font-semibold hover:bg-red-800 transition"
          >
            Slett økt
          </button>
        </div>
      </aside>

      {/* Right side activities */}
      <section
        ref={sectionRef}
        className="col-span-9 bg-white rounded-2xl shadow p-6 overflow-y-auto max-h-[80vh] space-y-4"
      >
        <h2 className="font-bold text-xl text-slate-900 mb-4">
          Aktiviteter
        </h2>

        <DndContext
          collisionDetection={closestCenter}
          onDragStart={(event: DragStartEvent) => {
            setActiveDragId(String(event.active.id));
            // Scroll container to top — collapsed bars are compact enough to all fit
            sectionRef.current?.scrollTo({ top: 0, behavior: "instant" });
          }}
          onDragEnd={(event: DragEndEvent) => {
            setActiveDragId(null);
            const { active, over } = event;
            if (!over || active.id === over.id) return;

            setActivities((items) => {
              const oldIndex = items.findIndex((a) => a.id === active.id);
              const newIndex = items.findIndex((a) => a.id === over.id);
              return arrayMove(items, oldIndex, newIndex).map((a, idx) => ({
                ...a,
                position: idx,
              }));
            });
          }}
          onDragCancel={() => setActiveDragId(null)}
        >
          <SortableContext
            items={activities.map((a) => a.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-3">
              {activities.map((a, i) => (
                <SortableActivityItem
                  key={a.id}
                  index={i}
                  activity={a}
                  collapsed={activeDragId !== null}
                  onRemove={() =>
                    setActivities((prev) => prev.filter((act) => act.id !== a.id))
                  }
                  onSelectVariant={(id, index) => onSelectVariant(id, index)}
                  onRegenerate={() => null}
                />
              ))}
            </ul>
          </SortableContext>

          {/* Floating overlay that follows the pointer */}
          <DragOverlay dropAnimation={null}>
            {activeDragId ? (
              <ActivityInfoBar
                activity={activities.find(a => a.id === activeDragId)!}
                index={activities.findIndex(a => a.id === activeDragId)}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </section>
    </div>
  );
};

export default LessonCreateView;
