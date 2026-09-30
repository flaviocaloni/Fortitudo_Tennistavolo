'use client';

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

export default function GoogleDrivePicker({
  onFileSelected,
  onError,
}: GoogleDrivePickerProps) {
  const [openPicker] = useDrivePicker();

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
      showUploadView: true,
      showUploadFolders: false,
      supportDrives: false,
      multiselect: false,
      customScopes: ['https://www.googleapis.com/auth/drive.file'],
      callbackFunction: (data: any) => {
        if (data.action === 'cancel') {
          return;
        }

        if (data.action === 'picked' && data.docs?.length) {
          const doc = data.docs[0];

          // Validazione: file deve essere dentro la cartella autorizzata
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

  return (
    <div className="flex gap-4">
      <button
        onClick={handleOpenPicker}
        className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold flex items-center gap-2"
      >
        📂 Apri Google Drive (seleziona o carica file)
      </button>
    </div>
  );
}
