import { Activity } from "@/types/lesson"

import SamtalebildeActivity from "@/components/activities/SamtalebildeActivity"
import VideoActivity from "@/components/activities/ForklaringsvideoActivity"
import OppgaverActivity from "@/components/activities/OppgaverActivity"


type ActivityRendererProps = {
  activity: Activity
}

export function ActivityRenderer({ activity } : ActivityRendererProps) {
  switch (activity.type) {
    case "Samtalebilde":
      return <SamtalebildeActivity activity={activity} />

    case "Oppgaver":
      return <OppgaverActivity activity={activity} />

    case "Forklaringsvideo":
      return <VideoActivity activity={activity} />

     default:
      return (
        <div className="p-4 border rounded-xl bg-red-50 text-red-700">
          Ukjent aktivitetstype.
        </div>
      )
  }
}
