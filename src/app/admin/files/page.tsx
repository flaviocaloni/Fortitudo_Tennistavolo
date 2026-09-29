'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import GoogleDrivePicker, { GoogleDriveFile } from '@/components/admin/GoogleDrivePicker';
import FolderTree from '@/components/admin/FolderTree';
import FileGrid from '@/components/admin/FileGrid';
import SearchBar from '@/components/admin/SearchBar';
import TrashBin from '@/components/admin/TrashBin';
import { AdminFile, GridFile } from '@/lib/types/file-manager';
import {
  getFolders,
  getFilesInFolder,
  createFolder,
  deleteFolder,
  moveFileToTrash,
  restoreFileFromTrash,
  permanentlyDeleteFile,
  searchFiles,
  saveGoogleDriveFile,
} from '@/lib/actions/admin-file-manager';

interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  children?: Folder[];
}

const CESTINO_FOLDER_ID = '00000000-0000-0000-0000-000000000000';

export default function AdminFilesPage() {
  const router = useRouter();

  // State
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<AdminFile[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showTrash, setShowTrash] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // Auto-dismiss messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Carica cartelle
  useEffect(() => {
    loadFolders();
  }, []);

  // Carica file quando cartella cambia
  useEffect(() => {
    if (!showTrash && selectedFolderId) {
      loadFilesInFolder();
    }
  }, [selectedFolderId, showTrash]);

  const loadFolders = async () => {
    try {
      const result = await getFolders();
      setFolders(result);
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Errore caricamento cartelle',
      });
    }
  };

  const loadFilesInFolder = async () => {
    if (!selectedFolderId) return;

    setIsLoading(true);
    try {
      const result = await getFilesInFolder(selectedFolderId);
      setFiles(result);
    } catch (error) {
      setMessage({ type: 'error', text: 'Errore caricamento file' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setMessage({ type: 'error', text: 'Nome cartella vuoto' });
      return;
    }

    if (selectedFolderId === CESTINO_FOLDER_ID) {
      setMessage({
        type: 'error',
        text: 'Non è possibile creare sottocartelle dentro il Cestino',
      });
      return;
    }

    setIsCreatingFolder(true);
    try {
      await createFolder({
        name: newFolderName,
        parent_id: selectedFolderId,
      });
      setMessage({ type: 'success', text: '✅ Cartella creata' });
      setNewFolderName('');
      setShowNewFolderDialog(false);
      loadFolders();
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Errore: ${error instanceof Error ? error.message : 'Sconosciuto'}`,
      });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (
      !confirm(
        'Eliminare cartella? I file dentro verranno spostati in cestino.'
      )
    ) {
      return;
    }

    try {
      await deleteFolder(folderId);
      setMessage({ type: 'success', text: '✅ Cartella eliminata' });
      loadFolders();
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Errore: ${error instanceof Error ? error.message : 'Sconosciuto'}`,
      });
    }
  };

  const handleDownloadFile = (file: GridFile) => {
    window.open(file.web_view_link, '_blank');
  };

  const handleMoveToTrash = async (fileId: string) => {
    try {
      await moveFileToTrash(fileId);
      setMessage({ type: 'success', text: '✅ File spostato in cestino' });
      loadFilesInFolder();
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Errore: ${error instanceof Error ? error.message : 'Sconosciuto'}`,
      });
    }
  };

  const handleRestoreFile = async (fileId: string) => {
    try {
      await restoreFileFromTrash(fileId);
      setMessage({ type: 'success', text: '✅ File ripristinato' });
      loadFilesInFolder();
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Errore: ${error instanceof Error ? error.message : 'Sconosciuto'}`,
      });
    }
  };

  const handlePermanentlyDelete = async (fileId: string) => {
    try {
      await permanentlyDeleteFile(fileId);
      setMessage({
        type: 'success',
        text: '✅ File eliminato permanentemente',
      });
      loadFilesInFolder();
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Errore: ${error instanceof Error ? error.message : 'Sconosciuto'}`,
      });
    }
  };

  const handleFileSelected = async (file: GoogleDriveFile) => {
    try {
      await saveGoogleDriveFile({
        googleFileId: file.id,
        fileName: file.name,
        fileType: file.mimeType,
        webViewLink: file.webViewLink || '',
        sizeBytes: file.size,
        folderId: selectedFolderId || undefined,
      });

      setMessage({
        type: 'success',
        text: `✅ File salvato: ${file.name}`,
      });
      loadFilesInFolder();
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Errore: ${error instanceof Error ? error.message : 'Sconosciuto'}`,
      });
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      loadFilesInFolder();
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchFiles(query);
      setFiles(results);
    } catch (error) {
      setMessage({ type: 'error', text: 'Errore ricerca' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">📁 Gestione File Admin</h1>
        <p className="text-gray-600 text-sm mt-1">
          Google Drive Picker + Organizzazione Cartelle
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-4 space-y-3 md:space-y-0 md:flex md:gap-4 md:items-center">
        <GoogleDrivePicker
          onFileSelected={handleFileSelected}
          onError={(err) =>
            setMessage({ type: 'error', text: err })
          }
        />

        <button
          onClick={() => setShowNewFolderDialog(!showNewFolderDialog)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold whitespace-nowrap"
        >
          ➕ Nuova Cartella
        </button>

        <button
          onClick={() => setShowTrash(!showTrash)}
          className={`px-4 py-2 rounded-lg transition font-semibold whitespace-nowrap ${
            showTrash
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
          }`}
        >
          🗑️ Cestino
        </button>

        {!showTrash && <div className="flex-1">
          <SearchBar onSearch={handleSearch} />
        </div>}
      </div>

      {/* Dialog Nuova Cartella */}
      {showNewFolderDialog && (
        <div className="bg-blue-50 border-b border-blue-200 p-4 flex gap-2">
          <input
            type="text"
            placeholder="Nome cartella..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
              if (e.key === 'Escape') {
                setShowNewFolderDialog(false);
                setNewFolderName('');
              }
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            disabled={isCreatingFolder}
          />
          <button
            onClick={handleCreateFolder}
            disabled={isCreatingFolder}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition font-semibold"
          >
            {isCreatingFolder ? '⏳' : '✅'} Crea
          </button>
          <button
            onClick={() => {
              setShowNewFolderDialog(false);
              setNewFolderName('');
            }}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition font-semibold"
          >
            ❌ Annulla
          </button>
        </div>
      )}

      {/* Messaggi */}
      {message && (
        <div
          className={`px-4 py-3 font-semibold ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 border-b border-green-300'
              : 'bg-red-100 text-red-800 border-b border-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar: Folder Tree */}
        {!showTrash && (
          <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto shadow-sm">
            <FolderTree
              folders={folders}
              selectedFolderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
              onDeleteFolder={handleDeleteFolder}
            />
          </div>
        )}

        {/* Main: File Grid or Trash */}
        <div className="flex-1 overflow-auto p-6">
          {showTrash ? (
            <TrashBin
              onRestore={handleRestoreFile}
              onPermanentlyDelete={handlePermanentlyDelete}
            />
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-6">
                📄 File{' '}
                {selectedFolderId &&
                  folders.length > 0 &&
                  folders[0].name &&
                  `(${folders.find((f) => f.id === selectedFolderId)?.name || 'Cartella'})`}
              </h2>
              {isLoading ? (
                <div className="text-center text-gray-500 py-12">
                  <p className="text-lg">⏳ Caricamento...</p>
                </div>
              ) : files.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <p className="text-lg">
                    {searchQuery
                      ? '❌ Nessun file trovato'
                      : '📭 Nessun file in questa cartella'}
                  </p>
                </div>
              ) : (
                <FileGrid
                  files={files}
                  onDownload={handleDownloadFile}
                  onDelete={handleMoveToTrash}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
