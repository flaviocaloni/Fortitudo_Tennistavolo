-- ============================================================
-- Aggiungere nuovo tipo di slot: PIZZA
-- Separare RECURRING, EVENT, e PIZZA con una colonna slot_type
-- ============================================================

-- Step 1: Creare enum slot_type
CREATE TYPE public.slot_type AS ENUM ('RECURRING', 'EVENT', 'PIZZA');

-- Step 2: Aggiungere colonna slot_type a training_slots
ALTER TABLE public.training_slots ADD COLUMN slot_type public.slot_type;

-- Step 3: Aggiungere pizza_date per slot Pizza
ALTER TABLE public.training_slots ADD COLUMN pizza_date date;

-- Step 4: Aggiungere max_participants per slot Pizza (1-5)
ALTER TABLE public.training_slots
  ADD COLUMN max_participants smallint DEFAULT 1 CHECK (max_participants BETWEEN 1 AND 5);

-- Step 5: Aggiungere selected_participants a bookings per slot Pizza
ALTER TABLE public.bookings
  ADD COLUMN selected_participants smallint DEFAULT 1 CHECK (selected_participants BETWEEN 1 AND 5);

-- Step 6: Popolare slot_type basato su weekday/event_date
-- Slot ricorrenti: weekday is not null, event_date is null
UPDATE public.training_slots
SET slot_type = 'RECURRING'
WHERE weekday IS NOT NULL AND event_date IS NULL;

-- Slot evento: weekday is null, event_date is not null
UPDATE public.training_slots
SET slot_type = 'EVENT'
WHERE weekday IS NULL AND event_date IS NOT NULL;

-- Step 7: Aggiungere PIZZA_BOOKING a notification_code enum
ALTER TYPE public.notification_code ADD VALUE 'PIZZA_BOOKING' BEFORE 'EVENT_NON_RECURRING_BOOKING';

-- Step 8: Rendere slot_type NOT NULL (dopo il popolo)
ALTER TABLE public.training_slots ALTER COLUMN slot_type SET NOT NULL;

-- Step 9: Aggiornare constraint di validazione
-- Rimuovere il vecchio constraint recurring_xor_event
ALTER TABLE public.training_slots DROP CONSTRAINT recurring_xor_event;

-- Aggiungere nuovo constraint per slot type validation
ALTER TABLE public.training_slots
  ADD CONSTRAINT valid_slot_type_fields
    CHECK (
      -- RECURRING: weekday not null, event_date null, pizza_date null
      (slot_type = 'RECURRING' AND weekday IS NOT NULL AND event_date IS NULL AND pizza_date IS NULL)
      OR
      -- EVENT: weekday null, event_date not null, pizza_date null
      (slot_type = 'EVENT' AND weekday IS NULL AND event_date IS NOT NULL AND pizza_date IS NULL)
      OR
      -- PIZZA: weekday null, event_date null, pizza_date not null
      (slot_type = 'PIZZA' AND weekday IS NULL AND event_date IS NULL AND pizza_date IS NOT NULL)
    );

-- Step 10: Creare index per pizza_date
CREATE INDEX idx_slots_pizza_date ON public.training_slots(pizza_date) WHERE slot_type = 'PIZZA';
