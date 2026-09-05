import { createClient } from "@/lib/supabase/server";
import { getAllUsersWithAutoBooking } from "@/lib/supabase/auto-booking";

export const maxDuration = 60;

export async function POST(request: Request) {
  // Verify Vercel Cron signature
  const vercelCronHeader = request.headers.get("x-vercel-cron");
  if (vercelCronHeader !== "true") {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const supabase = await createClient();

    // Get all users with auto-booking enabled
    const usersWithAutoBooking = await getAllUsersWithAutoBooking(supabase);

    const enabledUsers = usersWithAutoBooking.filter((u) => u.auto_booking_enabled);

    if (enabledUsers.length === 0) {
      return Response.json({
        success: true,
        message: "No users with auto-booking enabled",
        users_processed: 0,
        bookings_created: 0,
        bookings_skipped: 0,
        bookings_failed: 0,
      });
    }

    // Calculate date range: today to today + 30 days
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const startDate = today.toISOString().split("T")[0];

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 30);
    const endDateStr = endDate.toISOString().split("T")[0];

    let totalBookingsCreated = 0;
    let totalBookingsSkipped = 0;
    let totalBookingsFailed = 0;
    const errors: string[] = [];

    // Call auto_book_recurring_slots for each user
    for (const user of enabledUsers) {
      try {
        const { data, error } = await supabase.rpc("auto_book_recurring_slots", {
          p_user_id: user.user_id,
          p_start_date: startDate,
          p_end_date: endDateStr,
        });

        if (error) {
          errors.push(`User ${user.user_id}: ${error.message}`);
        } else if (data) {
          totalBookingsCreated += data.bookings_created || 0;
          totalBookingsSkipped += data.bookings_skipped || 0;
          totalBookingsFailed += data.bookings_failed || 0;
        }
      } catch (err) {
        errors.push(`User ${user.user_id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return Response.json({
      success: true,
      message: "Auto-booking cron job completed",
      users_processed: enabledUsers.length,
      bookings_created: totalBookingsCreated,
      bookings_skipped: totalBookingsSkipped,
      bookings_failed: totalBookingsFailed,
      errors: errors.length > 0 ? errors : null,
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
