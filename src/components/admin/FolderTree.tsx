'use client';

import { useState } from 'react';

interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  children?: Folder[];
}

interface FolderTreeProps {
  folders: Folder[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onDeleteFolder: (id: string) => void;
}

export default function FolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
  onDeleteFolder,
}: FolderTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  const renderFolder = (folder: Folder, level = 0) => (
    <div key={folder.id}>
      <div
        className={`flex items-center gap-2 px-3 py-2 cursor-pointer rounded ${
          selectedFolderId === folder.id
            ? 'bg-blue-100 text-blue-900 font-semibold'
            : 'hover:bg-gray-100'
        }`}
        style={{ marginLeft: `${level * 16}px` }}
      >
        {folder.children && folder.children.length > 0 && (
          <button
            onClick={() => toggleExpand(folder.id)}
            className="text-sm w-4 text-center"
          >
            {expanded.has(folder.id) ? '▼' : '▶'}
          </button>
        )}
        {!folder.children && <span className="w-4" />}

        <span
          className="flex-1 truncate"
          onClick={() => onSelectFolder(folder.id)}
        >
          {folder.name}
        </span>

        {!folder.id.startsWith('00000000') && (
          <button
            onClick={() => onDeleteFolder(folder.id)}
            className="text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100"
            title="Elimina cartella"
          >
            🗑️
          </button>
        )}
      </div>
      {expanded.has(folder.id) && folder.children && (
        <div>
          {folder.children.map((child) => renderFolder(child, level + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-3">
      <h3 className="font-bold mb-3 text-sm text-gray-700">📂 CARTELLE</h3>
      <div className="space-y-0.5">
        <div
          className={`flex items-center gap-2 px-3 py-2 cursor-pointer rounded ${
            selectedFolderId === null
              ? 'bg-blue-100 text-blue-900 font-semibold'
              : 'hover:bg-gray-100'
          }`}
          onClick={() => onSelectFolder(null)}
        >
          <span className="w-4" />
          <span className="flex-1 truncate">🏠 Principale</span>
        </div>
        {folders.map((folder) => renderFolder(folder))}
      </div>
    </div>
  );
}
