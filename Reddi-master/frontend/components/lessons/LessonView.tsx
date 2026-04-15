"use client";

import { FC } from "react";
import { MessageCircle, PenLine, Play, User, Users, ClipboardList } from "lucide-react";
import { ActivityRenderer } from "@/components/activities/ActivityRenderer";
import { Activity, ActivityType, ActivityMode, Lesson } from "@/types/lesson";
import { useEffect } from "react";

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

interface LessonViewProps {
  lesson: Lesson;
  activities: Activity[];
  onLoadActivities: (lessonId: number) => void;
  onBack: () => void;
  onEdit: () => void;
  onExport: () => void;
}



const LessonView: FC<LessonViewProps> = ({ lesson, activities, onLoadActivities, onBack, onEdit, onExport }) => {
  useEffect(() => {
    if (lesson.id) {
      onLoadActivities(lesson.id);
    }
  }, [lesson.id, onLoadActivities]);

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
            onClick={onEdit}
            className="bg-slate-500 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 transition"
          >
            Rediger
          </button>

          <button
            onClick={onExport}
            className="bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Eksporter som PDF
          </button>
        </div>
      </aside>

      {/* Right side activities */}
      <section className="col-span-9 bg-white rounded-2xl shadow p-6 overflow-y-auto max-h-[80vh] space-y-4">
        <h2 className="font-bold text-xl text-slate-900 mb-4">
          Aktiviteter
        </h2>

        <ul className="space-y-3">
          {activities.map((a, index) => {
            const type = typeConfig[a.type];
            const mode = modeConfig[a.mode];
            const TypeIcon = type.icon;
            const ModeIcon = mode.icon;

            return (
              <li
                key={index}
                className={`
                  relative overflow-hidden rounded-xl border-l-4 ${type.border}
                  bg-white shadow-sm hover:shadow-md transition-all duration-200
                `}
              >
                {/* Background pattern */}
                <div
                  className="absolute inset-0 bg-right bg-no-repeat bg-contain opacity-90 pointer-events-none"
                  style={{ backgroundImage: `url(${type.bg})` }}
                />
                {/* Mode color overlay */}
                <div className={`absolute inset-0 ${mode.overlay} pointer-events-none`} />

                <div className="relative px-4 py-4 space-y-3">
                  {/* Activity header */}
                  <div className="flex items-center gap-3">
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
                      {a.duration} min
                    </span>
                  </div>

                  {/* Activity content */}
                  <ActivityRenderer activity={a} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
};

export default LessonView;