import { ForklaringsvideoActivity as VideoActivityType } from "@/types/lesson"
import { Clock, ExternalLink } from "lucide-react"

type Props = {
  activity: VideoActivityType
}

export default function VideoActivityView({ activity }: Props) {
  const url = activity.video_url;

  const isYouTube =
    url.includes("youtube.com") || url.includes("youtu.be");
  const isVimeo = url.includes("vimeo.com");

  const embedUrl = isYouTube
    ? url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")
    : isVimeo
    ? `https://player.vimeo.com/video/${url.split("/").pop()}`
    : null;

  return (
    <div className="space-y-3">
      {/* Video embed */}
      {activity.video_url && (
        <div className="aspect-video w-full overflow-hidden rounded-xl shadow-md border border-amber-100">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={url}
              controls
              className="w-full h-full object-cover"
            />
          )}
        </div>
      )}

      {/* Meta info */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-amber-700">
          <Clock className="h-3.5 w-3.5" />
          <span className="font-medium">{activity.duration} min</span>
        </div>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-slate-500 hover:text-amber-700 transition-colors truncate"
        >
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{url}</span>
        </a>
      </div>
    </div>
  );
}
