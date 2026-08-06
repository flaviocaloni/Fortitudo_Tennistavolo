import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";
import { startOfISOWeek, toISODate } from "@/lib/dates";
import type { Booking, Profile } from "@/lib/types";
import CertificateReportClient from "@/components/certificate-report-client";
import AdminBookingsChart from "@/components/admin-bookings-chart";
import AdminUsersReport from "@/components/admin-users-report";

export const dynamic = "force-dynamic";

const MONTHS = [
  "Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
  "Lug", "Ago", "Set", "Ott", "Nov", "Dic",
];

interface Periods {
  week: number;
  month: number;
  year: number;
  cancelled: number;
}

function countPeriods(bookings: Pick<Booking, "session_date" | "status">[]): Periods {
  const today = toISODate(new Date());
  const weekStart = startOfISOWeek(today);
  const monthPrefix = today.slice(0, 7); // YYYY-MM
  const yearPrefix = today.slice(0, 4); // YYYY

  const res: Periods = { week: 0, month: 0, year: 0, cancelled: 0 };
  for (const b of bookings) {
    if (b.status === "cancelled") {
      if (b.session_date.startsWith(yearPrefix)) res.cancelled++;
      continue;
    }
    if (b.session_date.startsWith(yearPrefix)) res.year++;
    if (b.session_date.startsWith(monthPrefix)) res.month++;
    if (b.session_date >= weekStart) res.week++;
  }
  return res;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card text-center">
      <p className="text-3xl font-bold text-navy-700">{value}</p>
      <p className="text-sm text-slate-600">{label}</p>
    </div>
  );
}

export default async function StatistichePage() {
  const { supabase, user, profile } = await getSessionProfile();
  if (!user || !profile) redirect("/login");

  const isAdmin = profile.role === "admin";
  const year = new Date().getFullYear();

  // RLS filtra automaticamente:
  // - Admin vede TUTTI i booking
  // - Utente normale vede solo i suoi booking
  let allVisible: Booking[] = [];
  let errorMsg: string | null = null;

  try {
    // Carica solo i booking degli ultimi 2 anni per evitare timeout
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const minDate = twoYearsAgo.toISOString().split("T")[0];

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*")
      .gte("session_date", minDate)
      .order("session_date", { ascending: false });

    if (error) {
      errorMsg = error.message || "Errore sconosciuto nel caricamento dati";
    } else {
      allVisible = bookings ?? [];
    }
  } catch (e) {
    errorMsg = e instanceof Error ? e.message : "Errore nel caricamento dati";
  }

  const mineAll = (allVisible).filter((b) => b.user_id === user.id);
  const my = countPeriods(mineAll);

  // Andamento mensile personale (anno corrente, senza cancellate)
  const monthly = Array(12).fill(0) as number[];
  for (const b of mineAll) {
    if (b.status !== "cancelled" && b.session_date.startsWith(String(year))) {
      monthly[Number(b.session_date.slice(5, 7)) - 1]++;
    }
  }
  const maxMonthly = Math.max(1, ...monthly);

  // Riepilogo admin per utente
  let adminRows: { profile: Profile; stats: Periods }[] = [];
  let allProfiles: Profile[] = [];
  if (isAdmin) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name");
    allProfiles = profiles ?? [];
    adminRows = allProfiles.map((p: Profile) => ({
      profile: p,
      stats: countPeriods((allVisible ?? []).filter((b) => b.user_id === p.id)),
    }));
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Statistiche</h1>

      {errorMsg && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          <b>Errore caricamento dati:</b> {errorMsg}
        </div>
      )}

      <div className="mb-4 text-xs text-slate-500">
        Debug: {allVisible.length} prenotazioni caricate | Ruolo: {profile.role}
      </div>

      <h2 className="mb-2 font-semibold text-slate-700">Le mie prenotazioni</h2>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Questa settimana" value={my.week} />
        <StatCard label="Questo mese" value={my.month} />
        <StatCard label={`Anno ${year}`} value={my.year} />
        <StatCard label={`Cancellate ${year}`} value={my.cancelled} />
      </div>

      <h2 className="mb-2 font-semibold text-slate-700">
        Andamento mensile {year}
      </h2>
      <div className="card mb-8 flex items-end gap-2" style={{ height: 160 }}>
        {monthly.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
            <span className="text-xs text-slate-600">{v || ""}</span>
            <div
              className="w-full rounded-t bg-navy-500"
              style={{ height: `${(v / maxMonthly) * 100}px` }}
            />
            <span className="text-[10px] text-slate-500">{MONTHS[i]}</span>
          </div>
        ))}
      </div>

      {isAdmin && (
        <>
          <AdminBookingsChart bookings={allVisible ?? []} />

          <h2 className="my-8 font-semibold text-amber-700">
            Riepilogo per utente (solo admin)
          </h2>
          <AdminUsersReport users={adminRows} />

          <h2 className="my-8 font-semibold text-amber-700">
            Certificati medici (solo admin)
          </h2>
          <CertificateReportClient profiles={allProfiles} />
        </>
      )}
    </div>
  );
}
