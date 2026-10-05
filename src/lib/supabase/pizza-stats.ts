import { SupabaseClient } from "@supabase/supabase-js";

export interface PizzaStats {
  totalPizzas: number;
  totalBookings: number;
  avgParticipants: number;
  upcomingPizzas: number;
  pastPizzas: number;
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
