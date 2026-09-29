-- Migration 0044: Admin File Management - Folders
-- Tabella per organizzare file in cartelle

CREATE TABLE IF NOT EXISTS public.admin_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.admin_folders(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(parent_id, name)
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_admin_folders_parent ON public.admin_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_admin_folders_creator ON public.admin_folders(created_by);

-- Row Level Security
ALTER TABLE public.admin_folders ENABLE ROW LEVEL SECURITY;

-- Policy: Solo admin/superadmin possono accedere
CREATE POLICY "admin_folders_access" ON public.admin_folders
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
  );

-- Commenti
COMMENT ON TABLE public.admin_folders IS 'Cartelle per organizzare file admin';
COMMENT ON COLUMN public.admin_folders.name IS 'Nome cartella';
COMMENT ON COLUMN public.admin_folders.parent_id IS 'ID cartella padre (per sottocartelle)';
COMMENT ON COLUMN public.admin_folders.created_by IS 'Admin che ha creato la cartella';
