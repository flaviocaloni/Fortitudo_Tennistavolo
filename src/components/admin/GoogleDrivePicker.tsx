'use client';

import { useEffect, useRef, useState } from 'react';
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

declare global {
  interface Window {
    google?: {
      picker?: {
        Feature: any;
        ViewId: any;
        Dialog: any;
        Action?: any;
        PickerBuilder?: any;
        DocsView?: any;
      };
    };
  }
}

type PendingAction = 'picker' | 'upload' | null;

export default function GoogleDrivePicker({
  onFileSelected,
  onError,
}: GoogleDrivePickerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const accessTokenRef = useRef<string>('');
  const pendingActionRef = useRef<PendingAction>(null);
  const pendingFileRef = useRef<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Google Login
  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      accessTokenRef.current = codeResponse.access_token;

      if (pendingActionRef.current === 'upload') {
        setIsLoading(false);
        const file = pendingFileRef.current;
        pendingFileRef.current = null;
        if (file) uploadFile(file, codeResponse.access_token);
      } else {
        openPicker(codeResponse.access_token);
      }
    },
    onError: (error) => {
      setIsLoading(false);
      onError?.(`Login fallito: ${JSON.stringify(error)}`);
    },
    flow: 'implicit',
    // Solo drive.file: accesso ai soli file creati dall'app o selezionati
    // esplicitamente dall'utente tramite Picker. Scope non sensibile,
    // non richiede la verifica Google (a differenza di drive/drive.readonly).
    scope: 'https://www.googleapis.com/auth/drive.file',
  });

  // Carica Google Picker API
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const openPicker = (accessToken: string) => {
    // Aspetta che Picker API sia caricato
    if (!window.google?.picker) {
      setTimeout(() => openPicker(accessToken), 500);
      return;
    }

    const FOLDER_ID = (process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID || '').trim();

    if (!FOLDER_ID) {
      onError?.(
        'FOLDER_ID non configurato in .env.local (NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID)'
      );
      setIsLoading(false);
      return;
    }

    try {
      // DocsView limitata a cartella specifica
      const docsView = new window.google.picker.DocsView(
        window.google.picker.ViewId.DOCS
      )
        .setParent(FOLDER_ID) // IMPORTANTE: Limita a questa cartella
        .setIncludeFolders(true)
        .setMimeTypes(
          'application/vnd.google-apps.folder,' +
            'application/pdf,' +
            'image/jpeg,' +
            'image/png,' +
            'image/webp,' +
            'application/msword,' +
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document,' +
            'application/vnd.ms-excel,' +
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

      // Crea Picker
      const picker = new window.google.picker.PickerBuilder()
        .addView(docsView)
        .setCallback(handlePickerCallback)
        .setOAuthToken(accessToken)
        .build();

      picker.setVisible(true);
    } catch (error) {
      onError?.(
        `Errore apertura Picker: ${error instanceof Error ? error.message : 'Sconosciuto'}`
      );
      setIsLoading(false);
    }
  };

  const handlePickerCallback = (data: any) => {
    setIsLoading(false);

    // Azione: file selezionato
    if (data[window.google?.picker?.Action?.PICKED_ACTION]) {
      const doc = data[window.google?.picker?.Action?.PICKED_ACTION][0];

      // Validazione: file deve essere dentro cartella autorizzata
      const FOLDER_ID = (process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID || '').trim();

      if (doc.parents && !doc.parents.includes(FOLDER_ID)) {
        onError?.(
          'File NON autorizzato: non è dentro la cartella "fortitudo-google-drive"'
        );
        return;
      }

      const file: GoogleDriveFile = {
        id: doc.id,
        name: doc.name,
        mimeType: doc.mimeType,
        size: doc.sizeBytes,
        webViewLink: `https://drive.google.com/file/d/${doc.id}/view`,
        parents: doc.parents,
      };

      onFileSelected?.(file);
    }
    // Azione: cancellato
    else if (data[window.google?.picker?.Action?.CANCEL_ACTION]) {
      console.log('Picker cancelled');
    }
  };

  const handlePickerClick = () => {
    pendingActionRef.current = 'picker';
    setIsLoading(true);
    login();
  };

  const handleUploadClick = () => {
    // Apre subito il selettore file nativo: deve avvenire in modo sincrono
    // nello stesso gesto utente (click), altrimenti i browser lo bloccano.
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permette di riselezionare lo stesso file in futuro

    if (!file) return;

    const FOLDER_ID = (process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID || '').trim();
    if (!FOLDER_ID) {
      onError?.(
        'FOLDER_ID non configurato (NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID)'
      );
      return;
    }

    // Login Google (popup) DOPO la selezione del file: se abbiamo già un
    // token valido evitiamo un nuovo popup, altrimenti lo richiediamo ora.
    pendingActionRef.current = 'upload';
    pendingFileRef.current = file;

    if (accessTokenRef.current) {
      uploadFile(file, accessTokenRef.current);
    } else {
      setIsLoading(true);
      login();
    }
  };

  const uploadFile = async (file: File, accessToken: string) => {
    const FOLDER_ID = (process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID || '').trim();
    if (!FOLDER_ID) {
      onError?.(
        'FOLDER_ID non configurato (NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID)'
      );
      return;
    }

    setIsUploading(true);
    try {
      // 1) Crea il file (metadata) dentro la cartella autorizzata
      const createRes = await fetch(
        'https://www.googleapis.com/drive/v3/files',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: file.name,
            parents: [FOLDER_ID],
          }),
        }
      );

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => null);
        throw new Error(
          err?.error?.message || `Errore creazione file (${createRes.status})`
        );
      }

      const created = await createRes.json();

      // 2) Carica il contenuto del file
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

      // 3) Recupera i metadati completi
      const metaRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${created.id}?fields=id,name,mimeType,size,webViewLink,parents`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!metaRes.ok) {
        throw new Error('Errore recupero metadati file caricato');
      }

      const doc = await metaRes.json();

      const uploadedFile: GoogleDriveFile = {
        id: doc.id,
        name: doc.name,
        mimeType: doc.mimeType,
        size: doc.size ? Number(doc.size) : file.size,
        webViewLink:
          doc.webViewLink || `https://drive.google.com/file/d/${doc.id}/view`,
        parents: doc.parents,
      };

      onFileSelected?.(uploadedFile);
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
        disabled={isLoading || isUploading}
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
        onClick={handlePickerClick}
        disabled={isLoading || isUploading}
        className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <span className="animate-spin">⏳</span>
            Caricamento...
          </>
        ) : (
          <>📂 Apri Google Drive Picker</>
        )}
      </button>
    </div>
  );
}
