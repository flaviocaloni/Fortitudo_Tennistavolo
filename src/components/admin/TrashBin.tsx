'use client';

import { useEffect, useState } from 'react';
import { getDeletedFiles } from '@/lib/actions/admin-file-manager';

interface DeletedFile {
  id: string;
  file_name: string;
  deleted_at: string;
}

interface TrashBinProps {
  onRestore: (fileId: string) => void;
  onPermanentlyDelete: (fileId: string) => void;
}

export default function TrashBin({
  onRestore,
  onPermanentlyDelete,
}: TrashBinProps) {
  const [files, setFiles] = useState<DeletedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDeletedFiles();
  }, []);

  const loadDeletedFiles = async () => {
    setIsLoading(true);
    try {
      const result = await getDeletedFiles();
      setFiles(result);
    } catch (error) {
      console.error('Error loading deleted files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return <div className="text-center text-gray-500 py-8">⏳ Caricamento...</div>;
  }

  if (files.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        <p className="text-lg">🗑️ Cestino vuoto</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">🗑️ Cestino ({files.length})</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-3 text-left font-semibold text-sm">Nome File</th>
              <th className="p-3 text-left font-semibold text-sm">Eliminato</th>
              <th className="p-3 text-right font-semibold text-sm">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr
                key={file.id}
                className="border-b hover:bg-gray-50 transition"
              >
                <td className="p-3 text-sm">
                  <span className="truncate block">{file.file_name}</span>
                </td>
                <td className="p-3 text-sm text-gray-600">
                  {formatDate(file.deleted_at)}
                </td>
                <td className="p-3 text-right">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        if (
                          confirm(`Ripristinare "${file.file_name}"?`)
                        ) {
                          onRestore(file.id);
                        }
                      }}
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition"
                      title="Ripristina file"
                    >
                      ↩️ Ripristina
                    </button>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `Eliminare definitivamente "${file.file_name}"? Non si può annullare.`
                          )
                        ) {
                          onPermanentlyDelete(file.id);
                        }
                      }}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
                      title="Elimina permanentemente"
                    >
                      🗑️ Elimina
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
