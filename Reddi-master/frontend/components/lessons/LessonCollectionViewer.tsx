"use client";

import { Lesson } from "@/types/lesson";
import LessonCard from "@/components/lessons/LessonCard";

interface Props {
  lessons: Lesson[];
  onBack: () => void;
  onOpenLesson: (lesson: Lesson) => void;
}

export default function LessonCollectionView({ lessons, onBack, onOpenLesson }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          ← Tilbake
        </button>

        <h1 className="text-2xl font-bold text-slate-900">Min samling</h1>
      </div>

      {lessons.length === 0 && (
        <p className="text-slate-600">Ingen lagrede økter ennå.</p>
      )}

      {/* Cards */}
      <div className="grid grid-cols-3 gap-6">
        {lessons.map((lesson) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            onClick={() => onOpenLesson(lesson)}
          />
        ))}
      </div>
    </div>
  );
}