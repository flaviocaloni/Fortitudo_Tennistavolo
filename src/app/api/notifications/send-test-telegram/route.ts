import { createClient } from "@/lib/supabase/server";
import { sendNotificationTelegram } from "@/lib/services/telegram-sender";
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
    const { notificationConfigId } = await request.json();

    if (!notificationConfigId) {
      return NextResponse.json(
        { error: "Missing notificationConfigId" },
        { status: 400 }
      );
    }

    // Invia messaggio d'esempio
    const result = await sendNotificationTelegram(
      {
        bookingTitle: "Mario Rossi - Test Messaggio",
        userName: "Mario Rossi",
        slotName: "Allenamento Lunedì (ESEMPIO)",
        sessionDate: "lunedì 30 settembre 2026",
        registrationDate: new Date().toLocaleDateString("it-IT", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        bookingId: "test-" + Date.now(),
        notificationConfigId,
      },
      supabase
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: "Messaggio d'esempio inviato sul canale Telegram!",
    });
  } catch (error) {
    console.error("[send-test-telegram] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
