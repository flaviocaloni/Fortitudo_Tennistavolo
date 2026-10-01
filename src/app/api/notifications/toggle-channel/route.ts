import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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

    // Parse body
    const { notification_code, channel, enabled } = await request.json();

    if (!notification_code || !channel || typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Valida channel
    if (!["email", "telegram"].includes(channel)) {
      return NextResponse.json(
        { error: "Invalid channel" },
        { status: 400 }
      );
    }

    // Update notification_configs
    const updateData = channel === "email"
      ? { email_enabled: enabled }
      : { telegram_enabled: enabled };

    const { error, data } = await supabase
      .from("notification_configs")
      .update(updateData)
      .eq("notification_code", notification_code)
      .select()
      .single();

    if (error) {
      console.error("[toggle-channel] Update error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("[toggle-channel] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
