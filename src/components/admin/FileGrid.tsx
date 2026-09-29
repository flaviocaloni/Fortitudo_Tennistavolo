'use client';

interface AdminFile {
  id: string;
  file_name: string;
  size_bytes: number;
  imported_at: string;
  web_view_link: string;
}

interface FileGridProps {
  files: AdminFile[];
  onDownload: (file: AdminFile) => void;
  onDelete: (fileId: string) => void;
}

export default function FileGrid({ files, onDownload, onDelete }: FileGridProps) {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('it-IT');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {files.map((file) => (
        <div
          key={file.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition hover:border-blue-300"
        >
          <div className="flex items-start justify-between mb-2">
            <p className="font-bold text-sm truncate flex-1">{file.file_name}</p>
          </div>

          <div className="space-y-1 mb-4">
            <p className="text-xs text-gray-600">
              📦 {formatSize(file.size_bytes)}
            </p>
            <p className="text-xs text-gray-500">
              📅 {formatDate(file.imported_at)}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onDownload(file)}
              className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition font-semibold"
              title="Scarica file"
            >
              ⬇️ Scarica
            </button>
            <button
              onClick={() => {
                if (confirm(`Spostare "${file.file_name}" in cestino?`)) {
                  onDelete(file.id);
                }
              }}
              className="px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
              title="Sposta in cestino"
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
