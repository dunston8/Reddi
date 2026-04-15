"use client";

import { FileRow, FileItem } from "@/components/files/FileRow";
import { Upload } from "lucide-react";
import { useRef } from "react";

interface FileCollectionViewProps {
  files: FileItem[];
  onBack: () => void;
  onUpload: (files: FileList) => void;
  onOpenFile: (file: FileItem) => void;
  onDeleteFile: (id: FileItem["id"]) => void;
}

export function FileCollectionViewer({
  files,
  onBack,
  onUpload,
  onOpenFile,
  onDeleteFile,
}: FileCollectionViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;

    onUpload(e.target.files);

    // Reset input so same file can be uploaded again
    e.target.value = "";
  }
  
  
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="text-sm text-slate-600 hover:text-slate-900"
      >
        ← Tilbake
      </button>

      <h1 className="font-bold text-lg text-slate-900">Mine filer</h1>

      {/* Upload */}
      <>
        <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition"
        >
          <Upload className="w-4 h-4" />
          Last opp filer
        </button>
      </>

      <div className="space-y-3">
        {files.length === 0 ? (
          <p className="text-sm text-slate-500">
            Ingen filer enda
          </p>
        ) : (
          files.map((file) => (
            <FileRow
              key={file.id}
              file={file}
              onOpen={onOpenFile}
              onDelete={onDeleteFile}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default FileCollectionViewer;