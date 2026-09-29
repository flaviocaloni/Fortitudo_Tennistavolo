-- Migration 0045: Google Drive Picker Integration
-- Tabella per tracciare file importati da Google Drive

CREATE TABLE IF NOT EXISTS public.admin_google_drive_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Metadata Google Drive
  google_file_id TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  mime_type TEXT,
  size_bytes BIGINT,

  -- Link e accesso
  web_view_link TEXT,
  download_link TEXT,

  -- Metadata Fortitudo
  folder_id UUID REFERENCES public.admin_folders(id) ON DELETE SET NULL,
  imported_by UUID NOT NULL REFERENCES public.profiles(id),
  imported_at TIMESTAMPTZ DEFAULT now(),
  description TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_admin_google_files_folder ON public.admin_google_drive_files(folder_id);
CREATE INDEX IF NOT EXISTS idx_admin_google_files_importer ON public.admin_google_drive_files(imported_by);
CREATE INDEX IF NOT EXISTS idx_admin_google_files_created ON public.admin_google_drive_files(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_google_files_google_id ON public.admin_google_drive_files(google_file_id);

-- Row Level Security
ALTER TABLE public.admin_google_drive_files ENABLE ROW LEVEL SECURITY;

-- Policy: Solo admin/superadmin possono accedere
CREATE POLICY "admin_google_files_access" ON public.admin_google_drive_files
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
  );

-- Commenti
COMMENT ON TABLE public.admin_google_drive_files IS 'File importati da Google Drive via Picker API';
COMMENT ON COLUMN public.admin_google_drive_files.google_file_id IS 'ID unico di Google Drive';
COMMENT ON COLUMN public.admin_google_drive_files.imported_by IS 'Utente che ha importato il file';
