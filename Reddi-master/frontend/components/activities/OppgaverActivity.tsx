import { OppgaverActivity as OppgaverActivityType } from "@/types/lesson"
import { BookOpen } from "lucide-react"

type Props = {
  activity: OppgaverActivityType
}

const difficultyConfig = {
  Lett: { bg: "bg-green-100", text: "text-green-700" },
  Middels: { bg: "bg-yellow-100", text: "text-yellow-700" },
  Vanskelig: { bg: "bg-red-100", text: "text-red-700" },
} as const;

function formatPageRef(pageStart?: number, pageEnd?: number): string {
  if (pageStart == null) return "—";
  if (pageEnd != null && pageEnd !== pageStart) {
    return `s. ${pageStart}–${pageEnd}`;
  }
  return `s. ${pageStart}`;
}

export default function OppgaverActivity({ activity }: Props) {
  const selectedVariant = activity.variants?.[activity.selected_variant_index];
  const tasks = selectedVariant?.tasks ?? [];

  return (
    <div className="space-y-2">
      {tasks?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tasks.map((task, index) => {
            const pageRef = formatPageRef(task.page_start, task.page_end);
            const diff = difficultyConfig[task.difficulty] ?? difficultyConfig.Lett;

            return (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg bg-white/80 border border-blue-100 px-3 py-2 text-sm shadow-sm"
              >
                <span className="font-semibold text-blue-700">
                  {index + 1}.
                </span>

                <span className="flex items-center gap-1 text-slate-700">
                  <BookOpen className="h-3.5 w-3.5 text-blue-400" />
                  {pageRef}
                </span>

                <span className={`text-xs rounded-full px-2 py-0.5 ${diff.bg} ${diff.text} font-medium`}>
                  {task.difficulty}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  )
}
