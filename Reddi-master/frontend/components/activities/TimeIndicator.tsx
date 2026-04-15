import { Activity } from "@/types/lesson";

interface TimeIndicatorProps {
  activities: Activity[];
  sessionDuration: number;
}

export default function TimeIndicator({ activities, sessionDuration }: TimeIndicatorProps) {
  const totalActivityTime = activities.reduce((sum, a) => sum + a.duration, 0);
  const maxMinutes = 60;

  const radius = 70;
  const strokeWidth = 14;
  const size = 200;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Background arc: session duration as fraction of 60 min
  // 60 min = full circle, 30 min = half circle
  const bgFraction = sessionDuration / maxMinutes;
  const bgDash = bgFraction * circumference;

  // Foreground arc: activity time as fraction of 60 min, clamped to session duration
  const fgFraction = Math.min(totalActivityTime, sessionDuration) / maxMinutes;
  const fgDash = fgFraction * circumference;

  const isOver = totalActivityTime > sessionDuration;
  const strokeColor = isOver ? "#ef4444" : "#22c55e";

  return (
    <div className="w-full h-full">
      <div className="bg-white rounded-2xl shadow p-6 space-y-4 h-full">
        <h2 className="font-bold text-lg text-slate-900">Tidsindikator</h2>

        <div className="flex items-center justify-center">
          <svg width="160" height="160" viewBox={`0 0 ${size} ${size}`}>
            {/* Background ring */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={strokeWidth}
              strokeDasharray={`${bgDash} ${circumference}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
            />

            {/* Foreground ring */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={`${fgDash} ${circumference}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
              style={{ transition: "stroke-dasharray 0.3s ease" }}
            />

            {/* Center text */}
            <text
              x={center}
              y={center - 8}
              textAnchor="middle"
              dominantBaseline="central"
              style={{ fontSize: "28px", fontWeight: "bold", fill: "#1e293b" }}
            >
              {totalActivityTime}/{sessionDuration}
            </text>
            <text
              x={center}
              y={center + 16}
              textAnchor="middle"
              dominantBaseline="central"
              style={{ fontSize: "14px", fill: "#64748b" }}
            >
              min
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}
