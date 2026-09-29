-- Migration 0046: Soft Delete + Trash Bin
-- Aggiungi soft delete e cartella cestino

-- Aggiungi colonne soft delete
ALTER TABLE public.admin_google_drive_files
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id);

-- Indice per query cestino
CREATE INDEX IF NOT EXISTS idx_google_files_deleted ON public.admin_google_drive_files(deleted_at);

-- Crea cartella Cestino (speciale)
INSERT INTO public.admin_folders (id, name, parent_id, created_by)
VALUES (
  '00000000-0000-0000-0000-000000000000'::UUID,
  '🗑️ Cestino',
  NULL,
  (SELECT id FROM public.profiles WHERE role = 'superadmin' LIMIT 1)
)
ON CONFLICT (id) DO NOTHING;

-- Commento
COMMENT ON COLUMN public.admin_google_drive_files.deleted_at IS 'Timestamp eliminazione (soft delete)';
COMMENT ON COLUMN public.admin_google_drive_files.deleted_by IS 'Utente che ha eliminato il file';
