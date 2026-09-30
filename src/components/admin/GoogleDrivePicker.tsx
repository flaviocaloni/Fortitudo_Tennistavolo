'use client';

import { useRef, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  webViewLink?: string;
  parents?: string[];
}

interface GoogleDrivePickerProps {
  onFileSelected?: (file: GoogleDriveFile) => void;
  onError?: (error: string) => void;
}

// drive.file: upload/scrittura senza avviso "app non verificata".
// drive.readonly: necessario per elencare file NON creati dall'app (es.
// caricati manualmente su drive.google.com) filtrati per cartella. Questo
// scope è "sensibile" e mostra l'avviso di Google una volta per sessione,
// ma la lista risultante è filtrata e mostrata nella nostra UI (mai nel
// picker nativo di Google, che esporrebbe l'intero Drive dell'utente).
const DRIVE_SCOPES =
  'https://www.googleapis.com/auth/drive.file ' +
  'https://www.googleapis.com/auth/drive.readonly';

type PendingAction = 'upload' | 'browse' | null;

export default function GoogleDrivePicker({
  onFileSelected,
  onError,
}: GoogleDrivePickerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [browseResults, setBrowseResults] = useState<GoogleDriveFile[] | null>(
    null
  );
  const accessTokenRef = useRef<string>('');
  const pendingActionRef = useRef<PendingAction>(null);
  const pendingFileRef = useRef<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      accessTokenRef.current = codeResponse.access_token;

      if (pendingActionRef.current === 'upload') {
        const file = pendingFileRef.current;
        pendingFileRef.current = null;
        if (file) uploadFile(file, codeResponse.access_token);
      } else if (pendingActionRef.current === 'browse') {
        listFolderFiles(codeResponse.access_token);
      }
    },
    onError: (error) => {
      setIsBrowsing(false);
      onError?.(`Login fallito: ${JSON.stringify(error)}`);
    },
    flow: 'implicit',
    scope: DRIVE_SCOPES,
  });

  // --- Sfoglia file esistenti nella cartella autorizzata (lista custom) ---
  const handleBrowseClick = () => {
    const FOLDER_ID = (process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID || '').trim();
    if (!FOLDER_ID) {
      onError?.('FOLDER_ID non configurato (NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID)');
      return;
    }

    pendingActionRef.current = 'browse';
    setIsBrowsing(true);

    if (accessTokenRef.current) {
      listFolderFiles(accessTokenRef.current);
    } else {
      login();
    }
  };

  const listFolderFiles = async (accessToken: string) => {
    const FOLDER_ID = (process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID || '').trim();

    setIsBrowsing(true);
    try {
      const query = encodeURIComponent(
        `'${FOLDER_ID}' in parents and trashed = false`
      );
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,size,webViewLink,parents)&orderBy=name`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(
          err?.error?.message || `Errore lettura cartella (${res.status})`
        );
      }

      const data = await res.json();
      const files: GoogleDriveFile[] = (data.files || []).map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        mimeType: doc.mimeType,
        size: doc.size ? Number(doc.size) : undefined,
        webViewLink:
          doc.webViewLink || `https://drive.google.com/file/d/${doc.id}/view`,
        parents: doc.parents,
      }));

      setBrowseResults(files);
    } catch (error) {
      onError?.(
        `Errore: ${error instanceof Error ? error.message : 'Sconosciuto'}`
      );
    } finally {
      setIsBrowsing(false);
    }
  };

  const handlePickExisting = (file: GoogleDriveFile) => {
    setBrowseResults(null);
    onFileSelected?.(file);
  };

  // --- Upload diretto da PC (REST API, scope drive.file) ---
  const handleUploadClick = () => {
    // Deve avvenire in modo sincrono nel gesto utente, altrimenti i browser
    // bloccano il selettore file nativo.
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    pendingActionRef.current = 'upload';
    pendingFileRef.current = file;

    if (accessTokenRef.current) {
      uploadFile(file, accessTokenRef.current);
    } else {
      login();
    }
  };

  const uploadFile = async (file: File, accessToken: string) => {
    const FOLDER_ID = (process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID || '').trim();
    if (!FOLDER_ID) {
      onError?.('FOLDER_ID non configurato (NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID)');
      return;
    }

    setIsUploading(true);
    try {
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: file.name, parents: [FOLDER_ID] }),
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => null);
        throw new Error(
          err?.error?.message || `Errore creazione file (${createRes.status})`
        );
      }

      const created = await createRes.json();

      const uploadRes = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${created.id}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': file.type || 'application/octet-stream',
          },
          body: file,
        }
      );

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => null);
        throw new Error(
          err?.error?.message || `Errore upload contenuto (${uploadRes.status})`
        );
      }

      const metaRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${created.id}?fields=id,name,mimeType,size,webViewLink,parents`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!metaRes.ok) throw new Error('Errore recupero metadati file caricato');

      const doc = await metaRes.json();

      onFileSelected?.({
        id: doc.id,
        name: doc.name,
        mimeType: doc.mimeType,
        size: doc.size ? Number(doc.size) : file.size,
        webViewLink:
          doc.webViewLink || `https://drive.google.com/file/d/${doc.id}/view`,
        parents: doc.parents,
      });
    } catch (error) {
      onError?.(
        `Errore upload: ${error instanceof Error ? error.message : 'Sconosciuto'}`
      );
    } finally {
      setIsUploading(false);
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-4">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileInputChange}
        />

        <button
          onClick={handleUploadClick}
          disabled={isUploading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
        >
          {isUploading ? (
            <>
              <span className="animate-spin">⏳</span>
              Caricamento file...
            </>
          ) : (
            <>⬆️ Carica File da PC</>
          )}
        </button>

        <button
          onClick={handleBrowseClick}
          disabled={isBrowsing}
          className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
        >
          {isBrowsing ? (
            <>
              <span className="animate-spin">⏳</span>
              Caricamento...
            </>
          ) : (
            <>📂 Sfoglia file già su Drive</>
          )}
        </button>
      </div>

      {browseResults && (
        <div className="border border-gray-200 rounded-lg bg-white shadow-lg max-h-80 overflow-y-auto">
          <div className="flex items-center justify-between p-3 border-b bg-gray-50">
            <span className="font-semibold text-sm">
              📁 File nella cartella "fortitudo-google-drive" ({browseResults.length})
            </span>
            <button
              onClick={() => setBrowseResults(null)}
              className="text-gray-500 hover:text-gray-800 text-sm"
            >
              ✕ Chiudi
            </button>
          </div>

          {browseResults.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">
              Nessun file trovato in questa cartella.
            </p>
          ) : (
            <ul className="divide-y">
              {browseResults.map((file) => (
                <li key={file.id}>
                  <button
                    onClick={() => handlePickExisting(file)}
                    className="w-full text-left p-3 hover:bg-blue-50 transition flex items-center justify-between gap-2"
                  >
                    <span className="truncate text-sm">{file.name}</span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {formatSize(file.size)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
