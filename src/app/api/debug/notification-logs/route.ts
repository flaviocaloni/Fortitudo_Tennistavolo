import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verifica autenticazione
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verifica ruolo admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Leggi ultimi log di notification_delivery (ultimi 20 record)
    const { data: logs, error } = await supabase
      .from("notification_delivery")
      .select(
        "id, notification_config_id, booking_id, recipient_email, channel, provider, status, error_code, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Leggi configurazioni notifiche per context
    const { data: configs } = await supabase
      .from("notification_configs")
      .select("id, notification_code, is_active, email_enabled, telegram_enabled");

    return NextResponse.json({
      success: true,
      logs: logs || [],
      configs: configs || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[debug/notification-logs] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
