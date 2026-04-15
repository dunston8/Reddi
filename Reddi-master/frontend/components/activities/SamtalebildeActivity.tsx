import { SamtalebildeActivity as SamtalebildeActivityType } from "@/types/lesson"
import { MessageCircle } from "lucide-react"
import Image from "next/image"

type Props = {
  activity: SamtalebildeActivityType
}

export default function SamtalebildeActivity({ activity }: Props) {
  const selectedVariant = activity.variants?.[activity.selected_variant_index];

  const imageUrl = selectedVariant?.image?.url;
  const imageAlt = selectedVariant?.image?.prompt ?? "Samtalebilde";
  const questions = selectedVariant?.questions ?? [];

  return (
    <div className="space-y-4">
      {imageUrl && (
        <div className="overflow-hidden rounded-xl shadow-md border border-emerald-100">
          <Image
            src={imageUrl}
            className="w-full object-cover"
            alt={imageAlt}
            width={400}
            height={300}
          />
        </div>
      )}

      <div className="rounded-lg bg-emerald-50/60 border border-emerald-100 px-4 py-3 text-sm text-slate-700 space-y-1">
        <p className="font-medium text-emerald-800">Gjennomføring:</p>
        <ol className="list-decimal list-inside space-y-0.5 text-slate-600">
          <li>Vis bildet på tavla.</li>
          <li>Elevene ser på bildet i stillhet i ca. 30 sekunder.</li>
          <li>Elevene snakker med læringspartner i 1-2 minutter.</li>
          <li>Læreren leder en kort felles samtale i klassen.</li>
        </ol>
      </div>

      {questions.length > 0 && (
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg bg-white/80 border border-emerald-100 px-3 py-2 shadow-sm"
            >
              <MessageCircle className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
              <span className="text-slate-800 font-medium">{q}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
