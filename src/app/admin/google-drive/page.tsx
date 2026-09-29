'use client';

import { useState } from 'react';
import GoogleDrivePicker, { GoogleDriveFile } from '@/components/admin/GoogleDrivePicker';
import { saveGoogleDriveFile } from '@/lib/actions/google-drive-files';
import { useRouter } from 'next/navigation';

export default function GoogleDrivePage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<GoogleDriveFile | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleFileSelected = (file: GoogleDriveFile) => {
    setSelectedFile(file);
    setMessage(null);
  };

  const handleError = (error: string) => {
    setMessage({ type: 'error', text: error });
    setSelectedFile(null);
  };

  const handleSaveFile = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Nessun file selezionato' });
      return;
    }

    setSaving(true);
    try {
      const result = await saveGoogleDriveFile({
        googleFileId: selectedFile.id,
        fileName: selectedFile.name,
        fileType: selectedFile.mimeType,
        webViewLink: selectedFile.webViewLink || '',
        sizeBytes: selectedFile.size,
        description: `Importato da Google Drive: ${selectedFile.name}`,
      });

      if (result.success) {
        setMessage({
          type: 'success',
          text: `✅ File salvato: ${selectedFile.name}`,
        });
        setSelectedFile(null);
        setTimeout(() => {
          router.refresh();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: `❌ Errore: ${result.error}` });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Errore: ${error instanceof Error ? error.message : 'Sconosciuto'}`,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">📂 Google Drive Picker</h1>

      {/* Sezione Picker */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Seleziona File da Google Drive
        </h2>
        <p className="text-gray-600 text-sm mb-4">
          Clicca il bottone per aprire Google Drive Picker e selezionare un file
          dalla cartella <code className="bg-gray-100 px-2 py-1 rounded">fortitudo-google-drive</code>
        </p>
        <GoogleDrivePicker
          onFileSelected={handleFileSelected}
          onError={handleError}
        />
      </div>

      {/* File Selezionato */}
      {selectedFile && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">📄 File Selezionato</h3>
          <div className="space-y-3 mb-6">
            <div>
              <p className="text-sm text-gray-600">Nome</p>
              <p className="font-semibold">{selectedFile.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tipo</p>
              <p className="font-semibold">{selectedFile.mimeType}</p>
            </div>
            {selectedFile.size && (
              <div>
                <p className="text-sm text-gray-600">Dimensione</p>
                <p className="font-semibold">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Link Google Drive</p>
              <a
                href={selectedFile.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-semibold break-all"
              >
                Apri in Google Drive ↗
              </a>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSaveFile}
              disabled={saving}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {saving ? '⏳ Salvataggio...' : '✅ Salva in Fortitudo'}
            </button>
            <button
              onClick={() => setSelectedFile(null)}
              className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-semibold"
            >
              ❌ Cancella
            </button>
          </div>
        </div>
      )}

      {/* Messaggi */}
      {message && (
        <div
          className={`p-4 rounded-lg font-semibold ${
            message.type === 'success'
              ? 'bg-green-100 border border-green-400 text-green-800'
              : 'bg-red-100 border border-red-400 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
