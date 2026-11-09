import { createAdminClient } from "@/lib/supabase/admin";
import { runAutoBookingJob } from "@/lib/services/auto-booking-job";

export const maxDuration = 60;

export async function POST(request: Request) {
  // Verify Vercel Cron signature
  const vercelCronHeader = request.headers.get("x-vercel-cron");
  if (vercelCronHeader !== "true") {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Service role: il cron non ha sessione utente, quindi le RLS
    // di user_auto_booking_enabled nasconderebbero tutte le righe.
    const supabase = createAdminClient();
    if (!supabase) {
      return Response.json(
        { success: false, message: "SUPABASE_SERVICE_ROLE_KEY non configurata" },
        { status: 500 }
      );
    }

    const result = await runAutoBookingJob(supabase);

    return Response.json({
      success: true,
      message: result.message,
      users_processed: result.users_processed,
      bookings_created: result.bookings_created,
      bookings_skipped: result.bookings_skipped,
      bookings_failed: result.bookings_failed,
      errors: result.errors.length > 0 ? result.errors : null,
    });
  } catch (error) {
    console.error("Auto-booking cron error:", error);

    return Response.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
