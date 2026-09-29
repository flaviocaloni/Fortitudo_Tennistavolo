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

export default function GoogleDrivePicker({
  onFileSelected,
  onError,
}: GoogleDrivePickerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const accessTokenRef = useRef<string>('');

  // Google Login
  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      accessTokenRef.current = codeResponse.access_token;
      openPicker(codeResponse.access_token);
    },
    onError: (error) => {
      setIsLoading(false);
      onError?.(`Login fallito: ${JSON.stringify(error)}`);
    },
    flow: 'implicit',
    scope:
      'https://www.googleapis.com/auth/drive ' +
      'https://www.googleapis.com/auth/drive.file ' +
      'https://www.googleapis.com/auth/drive.readonly',
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

    const FOLDER_ID = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID || '';

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
      const FOLDER_ID = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID || '';

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

  const handleClick = () => {
    setIsLoading(true);
    login();
  };

  return (
    <div className="flex gap-4">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <span className="animate-spin">⏳</span>
            Caricamento...
          </>
        ) : (
          <>
            📂 Apri Google Drive Picker
          </>
        )}
      </button>
    </div>
  );
}
