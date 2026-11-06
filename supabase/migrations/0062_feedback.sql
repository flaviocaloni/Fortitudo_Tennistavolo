-- ============================================================
-- Migration 0062: Feedback utenti e risposte
-- ============================================================

CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  page_path TEXT NOT NULL CHECK (char_length(page_path) <= 300),
  rating SMALLINT NOT NULL CHECK (rating IN (-1, 1)),
  note TEXT CHECK (char_length(note) <= 500),
  category TEXT CHECK (category IN ('BUG', 'UNEXPECTED', 'SUGGESTION', 'OTHER')),
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'REVIEWED', 'RESOLVED', 'DISMISSED')),
  admin_note TEXT CHECK (char_length(admin_note) <= 1000),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_page_path ON public.feedback(page_path);

CREATE TABLE IF NOT EXISTS public.feedback_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_replies_feedback_id ON public.feedback_replies(feedback_id);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users or admins view feedback"
  ON public.feedback FOR SELECT
  USING (
    auth.uid() = user_id
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
  );

CREATE POLICY "Admins update feedback"
  ON public.feedback FOR UPDATE
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'superadmin'));

CREATE POLICY "Users or admins view replies"
  ON public.feedback_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.feedback f
      WHERE f.id = feedback_replies.feedback_id AND f.user_id = auth.uid()
    )
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
  );

CREATE POLICY "Admins insert replies"
  ON public.feedback_replies FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
  );

INSERT INTO public.app_settings (key, value) VALUES
  ('feedback_enabled', 'false'),
  ('feedback_telegram', 'NEGATIVE')
ON CONFLICT (key) DO NOTHING;
