"use client";

import { useMemo, useState } from "react";
import { formatDateIT, formatTime } from "@/lib/dates";
import { adminCancelBooking } from "@/lib/actions/admin";

interface BookingRow {
  id: string;
  session_date: string;
  training_slots?: { title: string; start_time: string; end_time: string }[] | null;
  profiles?: { full_name: string; role: string }[] | null;
}

function getTrainingSlot(ts: any) {
  return Array.isArray(ts) ? ts[0] : ts;
}

function getProfile(p: any) {
  return Array.isArray(p) ? p[0] : p;
}

type SortField = "date" | "slot" | "user" | "role";
type SortOrder = "asc" | "desc";

export default function BookingsTableClient({
  bookings: initialBookings,
}: {
  bookings: BookingRow[];
}) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const slotTitles = useMemo(
    () => [...new Set(initialBookings.map((b) => getTrainingSlot(b.training_slots)?.title || "").filter(Boolean))],
    [initialBookings]
  );

  const roles = useMemo(
    () => [...new Set(initialBookings.map((b) => getProfile(b.profiles)?.role || "").filter(Boolean))],
    [initialBookings]
  );

  const userNames = useMemo(
    () => [...new Set(initialBookings.map((b) => getProfile(b.profiles)?.full_name || "").filter(Boolean))],
    [initialBookings]
  );

  const filtered = useMemo(() => {
    return initialBookings.filter((b) => {
      const slot = getTrainingSlot(b.training_slots);
      const profile = getProfile(b.profiles);
      if (selectedSlots.size > 0 && !selectedSlots.has(slot?.title || "")) return false;
      if (selectedRoles.size > 0 && !selectedRoles.has(profile?.role || "")) return false;
      if (selectedUsers.size > 0 && !selectedUsers.has(profile?.full_name || "")) return false;
      if (dateFrom && b.session_date < dateFrom) return false;
      if (dateTo && b.session_date > dateTo) return false;
      return true;
    });
  }, [initialBookings, selectedSlots, selectedRoles, selectedUsers, dateFrom, dateTo]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let aVal: any, bVal: any;

      if (sortField === "date") {
        aVal = a.session_date;
        bVal = b.session_date;
      } else if (sortField === "slot") {
        aVal = getTrainingSlot(a.training_slots)?.title || "";
        bVal = getTrainingSlot(b.training_slots)?.title || "";
      } else if (sortField === "user") {
        aVal = getProfile(a.profiles)?.full_name || "";
        bVal = getProfile(b.profiles)?.full_name || "";
      } else if (sortField === "role") {
        aVal = getProfile(a.profiles)?.role || "";
        bVal = getProfile(b.profiles)?.role || "";
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return copy;
  }, [filtered, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const toggleSlot = (slot: string) => {
    const newSet = new Set(selectedSlots);
    if (newSet.has(slot)) {
      newSet.delete(slot);
    } else {
      newSet.add(slot);
    }
    setSelectedSlots(newSet);
  };

  const toggleRole = (role: string) => {
    const newSet = new Set(selectedRoles);
    if (newSet.has(role)) {
      newSet.delete(role);
    } else {
      newSet.add(role);
    }
    setSelectedRoles(newSet);
  };

  const toggleUser = (user: string) => {
    const newSet = new Set(selectedUsers);
    if (newSet.has(user)) {
      newSet.delete(user);
    } else {
      newSet.add(user);
    }
    setSelectedUsers(newSet);
  };

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th
      className="cursor-pointer select-none px-3 py-2 text-left hover:bg-slate-200"
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortField === field && <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>}
      </span>
    </th>
  );

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <div className="text-sm font-semibold text-slate-700">Filtri</div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label text-xs">Slot</label>
            <div className="max-h-32 space-y-1 overflow-y-auto">
              {slotTitles.map((slot) => (
                <label key={slot} className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={selectedSlots.has(slot)}
                    onChange={() => toggleSlot(slot)}
                    className="rounded"
                  />
                  {slot}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label text-xs">Ruolo</label>
            <div className="space-y-1">
              {roles.map((role) => (
                <label key={role} className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={selectedRoles.has(role)}
                    onChange={() => toggleRole(role)}
                    className="rounded"
                  />
                  {role}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label text-xs">Utente</label>
            <div className="max-h-32 space-y-1 overflow-y-auto">
              {userNames.map((user) => (
                <label key={user} className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user)}
                    onChange={() => toggleUser(user)}
                    className="rounded"
                  />
                  {user}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <div>
              <label className="label text-xs">Da</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input w-full text-sm"
              />
            </div>
            <div>
              <label className="label text-xs">A</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input w-full text-sm"
              />
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Visualizzate {sorted.length} di {initialBookings.length} prenotazioni
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <SortHeader field="date" label="Data" />
              <SortHeader field="slot" label="Slot" />
              <SortHeader field="user" label="Utente" />
              <SortHeader field="role" label="Ruolo" />
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((b) => {
              const slot = getTrainingSlot(b.training_slots);
              const profile = getProfile(b.profiles);
              return (
                <tr key={b.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 capitalize">{formatDateIT(b.session_date)}</td>
                  <td className="px-3 py-2">
                    {slot?.title} ({formatTime(slot?.start_time ?? "")}–
                    {formatTime(slot?.end_time ?? "")})
                  </td>
                  <td className="px-3 py-2 font-medium">{profile?.full_name}</td>
                  <td className="px-3 py-2">{profile?.role}</td>
                  <td className="px-3 py-2 text-right">
                    <form action={adminCancelBooking}>
                      <input type="hidden" name="booking_id" value={b.id} />
                      <button className="btn-danger">Cancella</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <p className="text-center text-sm text-slate-500">Nessuna prenotazione corrispondente ai filtri.</p>
      )}
    </div>
  );
}