'use server';

import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper: Get current user
async function getCurrentUserId(): Promise<string | null> {
  try {
    const headersList = await headers();
    const auth = headersList.get('authorization');
    if (!auth) return null;

    const { data } = await supabase.auth.getUser(auth.replace('Bearer ', ''));
    return data.user?.id || null;
  } catch {
    return null;
  }
}

// Check admin
async function requireAdmin(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
    throw new Error('Permessi insufficienti');
  }

  return userId;
}

// FOLDER OPERATIONS

export async function getFolders() {
  try {
    const { data } = await supabase
      .from('admin_folders')
      .select('*')
      .order('name');

    const folders = data || [];
    return buildFolderTree(folders);
  } catch (error) {
    console.error('Error getting folders:', error);
    return [];
  }
}

function buildFolderTree(
  folders: any[],
  parentId: string | null = null
): any[] {
  return folders
    .filter((f) => f.parent_id === parentId)
    .map((f) => ({
      ...f,
      children: buildFolderTree(folders, f.id),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function createFolder({
  name,
  parent_id,
}: {
  name: string;
  parent_id?: string | null;
}) {
  const userId = await requireAdmin();

  const { error } = await supabase.from('admin_folders').insert({
    name,
    parent_id: parent_id || null,
    created_by: userId,
  });

  if (error) throw new Error(error.message);
}

export async function deleteFolder(folderId: string) {
  await requireAdmin();

  // Sposta file in cartella in cestino
  await supabase
    .from('admin_google_drive_files')
    .update({ deleted_at: new Date().toISOString() })
    .eq('folder_id', folderId);

  // Elimina cartella
  const { error } = await supabase
    .from('admin_folders')
    .delete()
    .eq('id', folderId);

  if (error) throw new Error(error.message);
}

export async function renameFolder(
  folderId: string,
  newName: string
) {
  await requireAdmin();

  const { error } = await supabase
    .from('admin_folders')
    .update({ name: newName })
    .eq('id', folderId);

  if (error) throw new Error(error.message);
}

// FILE OPERATIONS

export async function getFilesInFolder(folderId: string) {
  try {
    const { data, error } = await supabase
      .from('admin_google_drive_files')
      .select('*')
      .eq('folder_id', folderId)
      .is('deleted_at', null)
      .order('imported_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  } catch (error) {
    console.error('Error getting files:', error);
    return [];
  }
}

export async function saveGoogleDriveFile(data: {
  googleFileId: string;
  fileName: string;
  fileType: string;
  webViewLink: string;
  sizeBytes?: number;
  folderId?: string;
  description?: string;
}) {
  const userId = await requireAdmin();

  const { error } = await supabase.from('admin_google_drive_files').insert({
    google_file_id: data.googleFileId,
    file_name: data.fileName,
    file_type: data.fileType,
    mime_type: data.fileType,
    size_bytes: data.sizeBytes || 0,
    web_view_link: data.webViewLink,
    download_link: data.webViewLink,
    folder_id: data.folderId || null,
    imported_by: userId,
    description: data.description,
  });

  if (error) throw new Error(error.message);

  // Audit log
  await supabase.from('admin_file_audit').insert({
    action: 'upload',
    actor_id: userId,
    details: {
      source: 'google_drive',
      fileName: data.fileName,
      fileId: data.googleFileId,
    },
  });

  return { success: true };
}

export async function moveFileToTrash(fileId: string) {
  const userId = await requireAdmin();

  const { error } = await supabase
    .from('admin_google_drive_files')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
    })
    .eq('id', fileId);

  if (error) throw new Error(error.message);

  // Audit
  await supabase.from('admin_file_audit').insert({
    file_id: fileId,
    action: 'delete',
    actor_id: userId,
    details: { type: 'soft_delete' },
  });
}

export async function restoreFileFromTrash(fileId: string) {
  const userId = await requireAdmin();

  const { error } = await supabase
    .from('admin_google_drive_files')
    .update({
      deleted_at: null,
      deleted_by: null,
    })
    .eq('id', fileId);

  if (error) throw new Error(error.message);

  // Audit
  await supabase.from('admin_file_audit').insert({
    file_id: fileId,
    action: 'upload',
    actor_id: userId,
    details: { type: 'restore' },
  });
}

export async function permanentlyDeleteFile(fileId: string) {
  const userId = await requireAdmin();

  const { error } = await supabase
    .from('admin_google_drive_files')
    .delete()
    .eq('id', fileId);

  if (error) throw new Error(error.message);

  // Audit
  await supabase.from('admin_file_audit').insert({
    file_id: fileId,
    action: 'delete',
    actor_id: userId,
    details: { type: 'permanent_delete' },
  });
}

export async function getDeletedFiles() {
  try {
    const { data } = await supabase
      .from('admin_google_drive_files')
      .select('id, file_name, deleted_at')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    return data || [];
  } catch (error) {
    console.error('Error getting deleted files:', error);
    return [];
  }
}

export async function searchFiles(query: string) {
  try {
    if (!query.trim()) return [];

    const { data } = await supabase
      .from('admin_google_drive_files')
      .select('*')
      .ilike('file_name', `%${query}%`)
      .is('deleted_at', null)
      .order('imported_at', { ascending: false });

    return data || [];
  } catch (error) {
    console.error('Error searching files:', error);
    return [];
  }
}
