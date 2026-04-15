import { Activity } from "@/types/lesson"
import { User, Users, ClipboardList } from "lucide-react";

interface VariationIndicatorProps {
  activities: Activity[];
}

export default function VariationIndicator({ activities }: VariationIndicatorProps) {
  // Sum durations per mode
  const modeDurations: Record<string, number> = {};
  activities.forEach(a => {
    if (!modeDurations[a.mode]) modeDurations[a.mode] = 0;
    modeDurations[a.mode] += a.duration;
  });

  const totalDuration = activities.reduce((sum, a) => sum + a.duration, 0);
  const maxTotal = 60; // adjust as max expected
  const score = Math.min(100, Math.round((totalDuration / maxTotal) * 100));

  // Map score to angle (-75deg to +75deg)
  const minAngle = -75;
  const maxAngle = 75;
  const angle = minAngle + (score / 100) * (maxAngle - minAngle);

  // 10 segments, gradient from red → yellow → green
  const segmentsCount = 10;
  const segments: { color: string; start: number; end: number }[] = Array.from({ length: segmentsCount }, (_, i) => {
    const start = minAngle + ((maxAngle - minAngle) / segmentsCount) * i;
    const end = minAngle + ((maxAngle - minAngle) / segmentsCount) * (i + 1);

    // gradient colors
    const t = (i - 1) / 9; // normalize 0 → 1
    let r, g, b;

    if (t < 0.4) {
        // red → orange
        r = 255;
        g = Math.round(255 * (t / 0.4)); // 0 → 255
        b = 0;
    } else if (t < 0.7) {
        // orange → yellow
        r = 255;
        g = 255;
        b = 0;
    } else {
        // yellow → green
        r = Math.round(255 * (1 - (t - 0.7) / 0.3)); // 255 → 0
        g = 255;
        b = 0;
    }

    const color = `rgb(${r},${g},${b})`;
    return { color, start, end };
  });

  const modeIcon = (mode: string) => {
    if (mode === "Helklasse") return <ClipboardList className="w-4 h-4" />;
    if (mode === "Grupper") return <Users className="w-4 h-4" />;
    return <User className="w-4 h-4" />;
  };

  return (
    <div className="w-full h-full">
      <div className="bg-white rounded-2xl shadow p-6 space-y-4 h-full">
        <h2 className="font-bold text-lg text-slate-900">Variasjonsindikator</h2>

        {/* Gauge */}
        <div className="relative h-32 flex items-center justify-center">
          <svg viewBox="0 0 200 100" className="w-48 h-24">
            {segments.map((seg, i) => (
              <path
                key={i}
                d={describeArc(100, 100, 90, seg.start, seg.end)}
                stroke={seg.color}
                strokeWidth={15}
                fill="none"
                strokeLinecap="round"
              />
            ))}

            {/* Pointer */}
            <line
              x1={100}
              y1={100}
              x2={100 + 80 * Math.cos((angle - 90) * (Math.PI / 180))}
              y2={100 + 80 * Math.sin((angle - 90) * (Math.PI / 180))}
              stroke="black"
              strokeWidth={4}
              strokeLinecap="round"
            />
          </svg>

          <div className="absolute text-xl font-bold">{score}</div>
        </div>

        {/* Mode breakdown */}
        <div className="space-y-2 text-sm text-slate-800">
          {Object.entries(modeDurations).map(([mode, dur]) => (
            <div key={mode} className="flex items-center gap-2">
              {modeIcon(mode)}
              <span>{dur} min</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// Helper functions
function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  const round = (n: number) => Number(n.toFixed(3)); // round to 3 decimals
  return `M ${round(start.x)} ${round(start.y)} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${round(end.x)} ${round(end.y)}`;
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}
