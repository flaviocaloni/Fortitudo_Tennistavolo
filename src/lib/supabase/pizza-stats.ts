import { SupabaseClient } from "@supabase/supabase-js";

export interface PizzaStats {
  totalPizzas: number;
  totalBookings: number;
  avgParticipants: number;
  upcomingPizzas: number;
  pastPizzas: number;
}

export interface PizzaSlotDetail {
  id: string;
  title: string;
  pizza_date: string;
  start_time: string;
  end_time: string;
  bookings_count: number;
  total_participants: number;
}

/**
 * Ottiene statistiche su slot pizza e prenotazioni
 */
export async function getPizzaStats(supabase: SupabaseClient): Promise<PizzaStats> {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Conta slot pizza totali
    const { count: totalPizzas } = await supabase
      .from("training_slots")
      .select("*", { count: "exact", head: true })
      .not("pizza_date", "is", null);

    // Primo: ottieni tutti gli slot pizza ID
    const { data: pizzaSlots } = await supabase
      .from("training_slots")
      .select("id")
      .not("pizza_date", "is", null);

    const pizzaSlotIds = (pizzaSlots || []).map((s: any) => s.id);

    // Conta prenotazioni pizza totali
    let totalBookings = 0;
    let avgData: any[] = [];

    if (pizzaSlotIds.length > 0) {
      const { count: bookingCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .in("slot_id", pizzaSlotIds);

      totalBookings = bookingCount || 0;

      // Media partecipanti per prenotazione pizza
      const { data: participantData } = await supabase
        .from("bookings")
        .select("selected_participants")
        .eq("status", "active")
        .not("selected_participants", "is", null)
        .in("slot_id", pizzaSlotIds);

      avgData = participantData || [];
    }

    const avgParticipants = avgData && avgData.length > 0
      ? avgData.reduce((sum: number, b: any) => sum + (b.selected_participants || 0), 0) / avgData.length
      : 0;

    // Conta pizza future (pizza_date > today)
    const { count: upcomingPizzas } = await supabase
      .from("training_slots")
      .select("*", { count: "exact", head: true })
      .not("pizza_date", "is", null)
      .gt("pizza_date", today);

    // Conta pizza passate (pizza_date <= today)
    const { count: pastPizzas } = await supabase
      .from("training_slots")
      .select("*", { count: "exact", head: true })
      .not("pizza_date", "is", null)
      .lte("pizza_date", today);

    return {
      totalPizzas: totalPizzas || 0,
      totalBookings,
      avgParticipants: Math.round(avgParticipants * 10) / 10,
      upcomingPizzas: upcomingPizzas || 0,
      pastPizzas: pastPizzas || 0,
    };
  } catch (error) {
    console.error("[getPizzaStats] Error:", error);
    return {
      totalPizzas: 0,
      totalBookings: 0,
      avgParticipants: 0,
      upcomingPizzas: 0,
      pastPizzas: 0,
    };
  }
}

/**
 * Ottiene dettaglio degli slot pizza con conteggio prenotazioni e partecipanti
 * Supporta filtri per nome slot e data
 */
export async function getPizzaSlotDetails(
  supabase: SupabaseClient,
  searchName?: string,
  searchDate?: string
): Promise<PizzaSlotDetail[]> {
  try {
    let query = supabase
      .from("training_slots")
      .select("id, title, pizza_date, start_time, end_time")
      .not("pizza_date", "is", null)
      .order("pizza_date", { ascending: false })
      .order("start_time", { ascending: true });

    if (searchName) {
      query = query.ilike("title", `%${searchName}%`);
    }

    if (searchDate) {
      query = query.eq("pizza_date", searchDate);
    }

    const { data: pizzaSlots } = await query;

    if (!pizzaSlots || pizzaSlots.length === 0) {
      return [];
    }

    const slotIds = pizzaSlots.map((s: any) => s.id);

    // Ottieni prenotazioni e partecipanti per ciascuno slot
    const { data: bookings } = await supabase
      .from("bookings")
      .select("slot_id, selected_participants")
      .eq("status", "active")
      .in("slot_id", slotIds);

    const bookingsBySlot = new Map<string, { count: number; totalParticipants: number }>();
    (bookings || []).forEach((b: any) => {
      if (!bookingsBySlot.has(b.slot_id)) {
        bookingsBySlot.set(b.slot_id, { count: 0, totalParticipants: 0 });
      }
      const slot = bookingsBySlot.get(b.slot_id)!;
      slot.count++;
      slot.totalParticipants += b.selected_participants || 1;
    });

    return pizzaSlots.map((s: any) => {
      const bookingData = bookingsBySlot.get(s.id) || { count: 0, totalParticipants: 0 };
      return {
        id: s.id,
        title: s.title,
        pizza_date: s.pizza_date,
        start_time: s.start_time,
        end_time: s.end_time,
        bookings_count: bookingData.count,
        total_participants: bookingData.totalParticipants,
      };
    });
  } catch (error) {
    console.error("[getPizzaSlotDetails] Error:", error);
    return [];
  }
}
