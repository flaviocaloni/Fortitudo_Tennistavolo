-- =======================================================================
-- Controlla se il numero massimo di prenotazioni è stato raggiunto.
-- Se sì, invece di bloccare l’utente → lo inserisce in una coda di attesa.
-- Quando si libera un posto → il primo in coda viene promosso automaticamente alla prenotazione.
-- Eseguire nel SQL Editor di Supabase.
-- =======================================================================

ALTER TABLE public.training_slots
ADD COLUMN queue uuid[] DEFAULT '{}';
