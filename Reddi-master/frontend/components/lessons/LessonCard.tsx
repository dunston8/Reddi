import { Lesson } from "@/types/lesson";

export default function LessonCard({
  lesson,
  onClick,
}: {
  lesson: Lesson;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-white rounded-2xl shadow hover:shadow-lg transition p-5 flex flex-col gap-3 border border-slate-200"
    >
      <h2 className="font-bold text-lg text-slate-900">
        {lesson.title}
      </h2>

      <div className="text-sm text-slate-700 space-y-1">
        <p>
          <strong>Fag:</strong> {lesson.subject}
        </p>
        <p>
          <strong>Trinn:</strong> {lesson.grade}
        </p>
        <p>
          <strong>Varighet:</strong> {lesson.duration} min
        </p>
      </div>

      <div className="mt-auto text-xs text-slate-500">
        {lesson.activityCount} aktiviteter
      </div>
    </button>
  );
}