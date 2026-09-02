"use client";

import { useMemo, useState } from "react";
import { formatDateIT, formatTime } from "@/lib/dates";
import { adminCancelBooking } from "@/lib/actions/admin";

interface BookingRow {
  id: string;
  session_date: string;
  created_at: string;
  training_slots?: { title: string; start_time: string; end_time: string }[] | null;
  profiles?: { full_name: string; role: string }[] | null;
}

function getTrainingSlot(ts: any) {
  return Array.isArray(ts) ? ts[0] : ts;
}

function getProfile(p: any) {
  return Array.isArray(p) ? p[0] : p;
}

type SortField = "event_date" | "registration_date" | "slot" | "user" | "role";
type SortOrder = "asc" | "desc";

export default function BookingsTableClient({
  bookings: initialBookings,
}: {
  bookings: BookingRow[];
}) {
  const [sortField, setSortField] = useState<SortField>("event_date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [eventDateFrom, setEventDateFrom] = useState("");
  const [eventDateTo, setEventDateTo] = useState("");
  const [registrationDateFrom, setRegistrationDateFrom] = useState("");
  const [registrationDateTo, setRegistrationDateTo] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const slotTitles = useMemo(
    () => [...new Set(initialBookings.map((b) => getTrainingSlot(b.training_slots)?.title || "").filter(Boolean))],
    [initialBookings]
  );

  const roles = useMemo(
    () => [...new Set(initialBookings.map((b) => getProfile(b.profiles)?.role || "").filter(Boolean))],
    [initialBookings]
  );

  const userNames = useMemo(
    () => [...new Set(initialBookings.map((b) => getProfile(b.profiles)?.full_name || "").filter(Boolean))].sort(),
    [initialBookings]
  );

  const filteredUserNames = useMemo(
    () =>
      userSearch
        ? userNames.filter((u) => u.toLowerCase().includes(userSearch.toLowerCase()))
        : userNames,
    [userNames, userSearch]
  );

  const filtered = useMemo(() => {
    return initialBookings.filter((b) => {
      const slot = getTrainingSlot(b.training_slots);
      const profile = getProfile(b.profiles);
      if (selectedSlots.size > 0 && !selectedSlots.has(slot?.title || "")) return false;
      if (selectedRoles.size > 0 && !selectedRoles.has(profile?.role || "")) return false;
      if (selectedUsers.size > 0 && !selectedUsers.has(profile?.full_name || "")) return false;
      if (eventDateFrom && b.session_date < eventDateFrom) return false;
      if (eventDateTo && b.session_date > eventDateTo) return false;
      if (registrationDateFrom && b.created_at.split("T")[0] < registrationDateFrom) return false;
      if (registrationDateTo && b.created_at.split("T")[0] > registrationDateTo) return false;
      return true;
    });
  }, [initialBookings, selectedSlots, selectedRoles, selectedUsers, eventDateFrom, eventDateTo, registrationDateFrom, registrationDateTo]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let aVal: any, bVal: any;

      if (sortField === "event_date") {
        aVal = a.session_date;
        bVal = b.session_date;
      } else if (sortField === "registration_date") {
        aVal = a.created_at;
        bVal = b.created_at;
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
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-700">Filtri</div>
          <button
            onClick={() => {
              setEventDateFrom("");
              setEventDateTo("");
              setRegistrationDateFrom("");
              setRegistrationDateTo("");
              setSelectedSlots(new Set());
              setSelectedRoles(new Set());
              setSelectedUsers(new Set());
              setUserSearch("");
            }}
            className="btn-ghost text-xs"
          >
            Reset
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="label text-xs">Data evento</label>
            <div className="space-y-1">
              <div>
                <input
                  type="date"
                  value={eventDateFrom}
                  onChange={(e) => setEventDateFrom(e.target.value)}
                  className="input w-full text-sm"
                  placeholder="Da"
                />
              </div>
              <div>
                <input
                  type="date"
                  value={eventDateTo}
                  onChange={(e) => setEventDateTo(e.target.value)}
                  className="input w-full text-sm"
                  placeholder="A"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="label text-xs">Data registrazione</label>
            <div className="space-y-1">
              <div>
                <input
                  type="date"
                  value={registrationDateFrom}
                  onChange={(e) => setRegistrationDateFrom(e.target.value)}
                  className="input w-full text-sm"
                  placeholder="Da"
                />
              </div>
              <div>
                <input
                  type="date"
                  value={registrationDateTo}
                  onChange={(e) => setRegistrationDateTo(e.target.value)}
                  className="input w-full text-sm"
                  placeholder="A"
                />
              </div>
            </div>
          </div>

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

          <div className="relative">
            <label className="label text-xs">Utente</label>
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              onFocus={() => setUserDropdownOpen(true)}
              onBlur={() => setTimeout(() => setUserDropdownOpen(false), 150)}
              placeholder={
                selectedUsers.size > 0 ? `${selectedUsers.size} selezionati` : "Cerca utente…"
              }
              className="input w-full text-sm"
            />
            {userDropdownOpen && (
              <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
                {filteredUserNames.length === 0 && (
                  <p className="px-2 py-2 text-xs text-slate-500">Nessun utente trovato</p>
                )}
                {filteredUserNames.map((user) => (
                  <label
                    key={user}
                    className="flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-slate-50"
                  >
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
            )}
            {selectedUsers.size > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {[...selectedUsers].map((user) => (
                  <span
                    key={user}
                    className="badge flex items-center gap-1 bg-navy-100 text-xs text-navy-800"
                  >
                    {user}
                    <button
                      type="button"
                      onClick={() => toggleUser(user)}
                      className="ml-1 text-navy-600 hover:text-navy-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Visualizzate {sorted.length} di {initialBookings.length} prenotazioni
          </span>
          <button className="btn-primary text-xs">Cerca</button>
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <SortHeader field="event_date" label="Data evento" />
              <SortHeader field="registration_date" label="Data registrazione" />
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
                  <td className="px-3 py-2 text-xs">{formatDateIT(b.created_at.split("T")[0])}</td>
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