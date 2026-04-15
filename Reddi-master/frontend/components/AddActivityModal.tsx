"use client";

import { useState } from "react";
import { X, ClipboardList, Image } from "lucide-react";
import type { ActivityMode } from "@/types/lesson";

type SelectableActivityType = "Oppgaver" | "Samtalebilde";

interface Props {
  onAdd: (type: SelectableActivityType, mode: ActivityMode, duration: number) => void;
  onClose: () => void;
}

const DURATIONS = [5, 10, 15, 20, 30];

const ACTIVITY_OPTIONS: { type: SelectableActivityType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    type: "Oppgaver",
    label: "Oppgaver",
    description: "Elevene løser individuelle eller gruppebaserte oppgaver",
    icon: <ClipboardList className="w-6 h-6" />,
  },
  {
    type: "Samtalebilde",
    label: "Samtalebilde",
    description: "Et bilde danner grunnlag for klassediskusjon",
    icon: <Image className="w-6 h-6" />,
  },
];

const MODE_OPTIONS: { value: ActivityMode; label: string }[] = [
  { value: "Helklasse", label: "Helklasse" },
  { value: "Grupper", label: "Gruppe" },
  { value: "Individuelt", label: "Individuelt" },
];

export default function AddActivityModal({ onAdd, onClose }: Props) {
  const [selectedType, setSelectedType] = useState<SelectableActivityType | null>(null);
  const [selectedMode, setSelectedMode] = useState<ActivityMode>("Helklasse");
  const [selectedDuration, setSelectedDuration] = useState<number>(10);

  function handleAdd() {
    if (!selectedType) return;
    onAdd(selectedType, selectedMode, selectedDuration);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Legg til aktivitet</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition rounded-lg p-1 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Activity type selection */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">Aktivitetstype</p>
          <div className="grid grid-cols-2 gap-3">
            {ACTIVITY_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                onClick={() => setSelectedType(opt.type)}
                className={`flex flex-col items-start gap-2 border-2 rounded-xl p-4 text-left transition
                  ${selectedType === opt.type
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                  }`}
              >
                <span className={selectedType === opt.type ? "text-emerald-600" : "text-slate-500"}>
                  {opt.icon}
                </span>
                <span className="font-semibold text-sm">{opt.label}</span>
                <span className="text-xs text-slate-500 leading-snug">{opt.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mode selection */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">Organiseringsform</p>
          <div className="flex gap-2">
            {MODE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedMode(opt.value)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition
                  ${selectedMode === opt.value
                    ? "bg-slate-900 text-white border-slate-900"
                    : "border-slate-200 text-slate-600 hover:border-slate-400"
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration selection */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">Varighet</p>
          <div className="flex gap-2 flex-wrap">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDuration(d)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition
                  ${selectedDuration === d
                    ? "bg-slate-900 text-white border-slate-900"
                    : "border-slate-200 text-slate-600 hover:border-slate-400"
                  }`}
              >
                {d} min
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition"
          >
            Avbryt
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedType}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Legg til
          </button>
        </div>
      </div>
    </div>
  );
}
