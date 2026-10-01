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

    // Leggi la configurazione della notifica per determinare il tipo
    const { data: config } = await supabase
      .from("notification_configs")
      .select("notification_code")
      .eq("id", notificationConfigId)
      .single();

    if (!config) {
      return NextResponse.json(
        { error: "Notification config not found" },
        { status: 404 }
      );
    }

    // Prepara payload in base al tipo di notifica
    const isAttendanceRemoved = config.notification_code === "CHAMPIONSHIP_MATCH_ATTENDANCE_REMOVED";

    const payload = isAttendanceRemoved
      ? {
          bookingTitle: "Mario Rossi - Test Messaggio",
          userName: "Mario Rossi",
          slotName: "ESEMPIO",
          sessionDate: "lunedì 3 ottobre 2026",
          registrationDate: new Date().toISOString(),
          bookingId: "test-" + Date.now(),
          notificationConfigId,
          teamName: "Babyteam",
          opponentName: "ASD Rivale",
          notificationType: "attendance_removed" as const,
        }
      : {
          bookingTitle: "Mario Rossi - Test Messaggio",
          userName: "Mario Rossi",
          slotName: "Allenamento Lunedì (ESEMPIO)",
          sessionDate: "lunedì 30 settembre 2026",
          registrationDate: new Date().toISOString(),
          bookingId: "test-" + Date.now(),
          notificationConfigId,
        };

    // Invia messaggio d'esempio
    const result = await sendNotificationTelegram(payload, supabase);

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
