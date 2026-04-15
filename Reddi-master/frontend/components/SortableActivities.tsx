"use client";

import { GripVertical, X, MessageCircle, PenLine, Play, User, Users, ClipboardList } from "lucide-react";
import { Activity, ActivityType, ActivityMode } from "@/types/lesson";
import {
  DndContext,
  DragEndEvent,
  closestCenter
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy
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

function SortableActivityItem({
  activity,
  id,
  onRemove,
  maxDuration,
}: {
  activity: Activity;
  id: string;
  onRemove: () => void;
  maxDuration: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const type = typeConfig[activity.type];
  const mode = modeConfig[activity.mode];
  const TypeIcon = type.icon;
  const ModeIcon = mode.icon;

  const durationFraction = maxDuration > 0 ? Math.min(activity.duration / maxDuration, 1) : 0;

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`
        relative overflow-hidden rounded-xl border-l-4 ${type.border}
        bg-white shadow-sm
        transition-all duration-200
        ${isDragging ? "shadow-lg scale-[1.02]" : "hover:shadow-md hover:scale-[1.01]"}
      `}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-right bg-no-repeat bg-contain opacity-90 pointer-events-none"
        style={{ backgroundImage: `url(${type.bg})` }}
      />
      {/* Mode color overlay */}
      <div className={`absolute inset-0 ${mode.overlay} pointer-events-none`} />

      {/* Content */}
      <div className="relative px-4 py-4 flex items-start gap-3">
        {/* Drag handle */}
        <button
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-200/60 transition-colors"
        >
          <GripVertical className="h-5 w-5 text-slate-400" />
        </button>

        {/* Main info */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Top row: type + mode */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 font-semibold ${type.accent}`}>
              <TypeIcon className="h-4 w-4" />
              <span>{type.label}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <ModeIcon className="h-3.5 w-3.5" />
              <span>{mode.label}</span>
            </div>
          </div>

          {/* Duration bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${type.barColor} rounded-full transition-all duration-300`}
                style={{ width: `${durationFraction * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
              {activity.duration} min
            </span>
          </div>
        </div>

        {/* Delete button */}
        <button
          onClick={onRemove}
          className="mt-1 p-1 rounded hover:bg-red-100 transition-colors group"
        >
          <X className="h-4 w-4 text-slate-400 group-hover:text-red-500 transition-colors" />
        </button>
      </div>
    </li>
  );
}

interface Props {
  onDragEnd: (event: DragEndEvent) => void;
  onRemove: (activityPos: number) => void;
  activities: Activity[];
}

export default function SortableActivities(props: Props) {
  const maxDuration = props.activities.length > 0
    ? Math.max(...props.activities.map(a => a.duration))
    : 1;

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={props.onDragEnd}
    >
      <SortableContext
        items={props.activities.map((a) => a.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="space-y-3">
          {props.activities.map((a, i) => (
            <SortableActivityItem
              key={a.id}
              id={a.id}
              activity={a}
              onRemove={() => props.onRemove(i)}
              maxDuration={maxDuration}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
