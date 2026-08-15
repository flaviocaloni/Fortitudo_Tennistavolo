ALTER TABLE public.training_slots
ADD COLUMN queue uuid[] DEFAULT '{}';
