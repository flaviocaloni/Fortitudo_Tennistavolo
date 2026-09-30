'use client';

import { useRef, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import useDrivePicker from 'react-google-drive-picker';

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

// Scope non sensibile: accesso solo ai file creati dall'app o selezionati
// esplicitamente dall'utente tramite Picker. Evita l'avviso "app non
// verificata" di Google (a differenza degli scope drive/drive.readonly).
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

export default function GoogleDrivePicker({
  onFileSelected,
  onError,
}: GoogleDrivePickerProps) {
  const [openPicker] = useDrivePicker();
  const [isUploading, setIsUploading] = useState(false);
  const accessTokenRef = useRef<string>('');
  const pendingFileRef = useRef<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      accessTokenRef.current = codeResponse.access_token;
      const file = pendingFileRef.current;
      pendingFileRef.current = null;
      if (file) uploadFile(file, codeResponse.access_token);
    },
    onError: (error) => {
      onError?.(`Login fallito: ${JSON.stringify(error)}`);
    },
    flow: 'implicit',
    scope: DRIVE_SCOPE,
  });

  // --- Selezione file esistente (Google Picker, sola selezione) ---
  const handleOpenPicker = () => {
    const CLIENT_ID = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim();
    const API_KEY = (process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '').trim();
    const FOLDER_ID = (process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID || '').trim();

    if (!CLIENT_ID || !API_KEY || !FOLDER_ID) {
      onError?.(
        'Configurazione Google Drive mancante (client ID, API key o folder ID)'
      );
      return;
    }

    openPicker({
      clientId: CLIENT_ID,
      developerKey: API_KEY,
      viewId: 'DOCS',
      setParentFolder: FOLDER_ID,
      setSelectFolderEnabled: false,
      showUploadView: false, // l'upload da PC usa un percorso separato (drive.file)
      supportDrives: false,
      multiselect: false,
      customScopes: [DRIVE_SCOPE],
      callbackFunction: (data: any) => {
        if (data.action === 'cancel') return;

        if (data.action === 'picked' && data.docs?.length) {
          const doc = data.docs[0];

          if (doc.parentId && doc.parentId !== FOLDER_ID) {
            onError?.(
              'File NON autorizzato: non è dentro la cartella "fortitudo-google-drive"'
            );
            return;
          }

          const file: GoogleDriveFile = {
            id: doc.id,
            name: doc.name,
            mimeType: doc.mimeType,
            size: doc.sizeBytes ? Number(doc.sizeBytes) : undefined,
            webViewLink:
              doc.url || `https://drive.google.com/file/d/${doc.id}/view`,
            parents: doc.parentId ? [doc.parentId] : undefined,
          };

          onFileSelected?.(file);
        }
      },
    });
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

  return (
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
        onClick={handleOpenPicker}
        disabled={isUploading}
        className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
      >
        📂 Apri Google Drive Picker
      </button>
    </div>
  );
}
