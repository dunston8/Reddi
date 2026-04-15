import { Trash2, FileText } from "lucide-react";

export interface FileItem {
  id: number;
  filename: string;
  last_edited?: string;
  fagtype: string;
}

interface FileRowProps {
  file: FileItem;
  onOpen: (file: FileItem) => void;
  onDelete: (id: FileItem["id"]) => void;
}

export function FileRow({ file, onOpen, onDelete }: FileRowProps) {
  return (
    <div
      onClick={() => onOpen(file)}
      className="group flex items-center justify-between w-full rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:shadow-md hover:bg-slate-50 transition cursor-pointer"
    >
      {/* Left side */}
      <div className="flex items-center gap-3">
        <FileText className="w-5 h-5 text-slate-500" />

        <div className="flex flex-col">
          <span className="font-medium text-slate-900">
            {file.filename}
          </span>

          {file.last_edited && (
            <span className="text-xs text-slate-500">
              Sist endret:   {file.last_edited}
            </span>
          )}
        </div>
      </div>

      {/* Right side */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(file.id);
        }}
        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition"
        aria-label="Slett fil"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
}
