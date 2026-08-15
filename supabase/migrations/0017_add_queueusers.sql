-- =======================================================================
-- CONTROLLA SE IL NUMERO MASSIMO DI PRENOTAZIONI E' STATO RAGGIUNTO
-- SE SI, ANZICHE' BLOCCARE L'UTENTE → LO INSERISCE IN UNA CODA DI ATTESA
-- QUANDO SI LIBERA UN POSTO → IL PRIMO IN CODA VIENE PROMOSSO 
-- AUTOMATICAMENTE ALLA PRENOTAZIONE 
-- =======================================================================

ALTER TABLE public.training_slots
ADD COLUMN queue uuid[] DEFAULT '{}';
