'use server';

import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SaveGoogleDriveFileRequest {
  googleFileId: string;
  fileName: string;
  fileType: string;
  webViewLink: string;
  sizeBytes?: number;
  description?: string;
  folderId?: string;
  parents?: string[];
}

/**
 * Salva file Google Drive nel DB
 */
export async function saveGoogleDriveFile(
  data: SaveGoogleDriveFileRequest
): Promise<{ success: boolean; error?: string; fileId?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Utente non autenticato' };
    }

    // Verifica permessi: solo admin/superadmin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return { success: false, error: 'Profilo non trovato' };
    }

    if (!['admin', 'superadmin'].includes(profile.role)) {
      return { success: false, error: 'Permessi insufficienti (admin required)' };
    }

    // Validazione cartella autorizzata (lato server)
    const AUTHORIZED_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (
      data.parents &&
      !data.parents.includes(AUTHORIZED_FOLDER_ID || '')
    ) {
      return {
        success: false,
        error: 'File NON autorizzato: non è nella cartella Fortitudo',
      };
    }

    // Salva nel DB
    const { data: fileRecord, error: dbError } = await supabase
      .from('admin_google_drive_files')
      .insert({
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
      })
      .select('id')
      .single();

    if (dbError) {
      return { success: false, error: `DB Error: ${dbError.message}` };
    }

    // Log audit
    await supabase.from('admin_file_audit').insert({
      file_id: fileRecord.id,
      action: 'upload',
      actor_id: userId,
      details: {
        source: 'google_drive',
        fileName: data.fileName,
        fileId: data.googleFileId,
      },
    });

    return { success: true, fileId: fileRecord.id };
  } catch (error) {
    return {
      success: false,
      error: `Server Error: ${error instanceof Error ? error.message : 'Unknown'}`,
    };
  }
}

/**
 * Lista file Google Drive importati
 */
export async function listGoogleDriveFiles(folderId?: string): Promise<
  Array<{
    id: string;
    file_name: string;
    size_bytes: number;
    imported_at: string;
    web_view_link: string;
  }>
> {
  try {
    let query = supabase
      .from('admin_google_drive_files')
      .select('id, file_name, size_bytes, imported_at, web_view_link');

    if (folderId) {
      query = query.eq('folder_id', folderId);
    }

    const { data, error } = await query.order('imported_at', {
      ascending: false,
    });

    if (error) {
      console.error('Error listing Google Drive files:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in listGoogleDriveFiles:', error);
    return [];
  }
}

/**
 * Elimina file Google Drive importato
 */
export async function deleteGoogleDriveFile(
  fileId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Utente non autenticato' };
    }

    // Verifica permessi
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
      return { success: false, error: 'Permessi insufficienti' };
    }

    // Elimina dal DB
    const { error: dbError } = await supabase
      .from('admin_google_drive_files')
      .delete()
      .eq('id', fileId);

    if (dbError) {
      return { success: false, error: dbError.message };
    }

    // Log audit
    await supabase.from('admin_file_audit').insert({
      file_id: fileId,
      action: 'delete',
      actor_id: userId,
      details: { source: 'google_drive' },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Helper: Ottieni ID utente corrente
 */
async function getCurrentUserId(): Promise<string | null> {
  try {
    const headersList = await headers();
    const auth = headersList.get('authorization');
    if (!auth) return null;

    const { data } = await supabase.auth.getUser(auth.replace('Bearer ', ''));
    return data.user?.id || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
