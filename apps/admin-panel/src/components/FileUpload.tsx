import React, { useRef, useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, File } from 'lucide-react';

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  label?: string;
}

export default function FileUpload({ onUpload, accept = 'image/*,audio/*', label = 'Drop files here or click to browse' }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      await onUpload(file);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    }
    setUploading(false);
  }, [onUpload]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
        dragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
      } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      <Upload className="w-8 h-8 mx-auto mb-2 text-textMuted" />
      <p className="text-sm text-textMuted">{uploading ? 'Uploading...' : label}</p>
      {error && <p className="text-xs text-danger mt-2">{error}</p>}
    </div>
  );
}

export function AssetIcon({ mimeType, className = 'w-8 h-8' }: { mimeType: string; className?: string }) {
  if (mimeType.startsWith('image/')) return <ImageIcon className={`${className} text-primary`} />;
  return <File className={`${className} text-textMuted`} />;
}
