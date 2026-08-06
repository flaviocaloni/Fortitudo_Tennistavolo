"use client";

import { useMemo, useState } from "react";
import type { Profile } from "@/lib/types";

interface UserStats {
  profile: Profile;
  stats: {
    week: number;
    month: number;
    year: number;
    cancelled: number;
  };
}

type SortField = "name" | "role" | "weekly_limit" | "week" | "month" | "year" | "cancelled";
type SortOrder = "asc" | "desc";
type RoleFilter = "all" | "admin" | "agonista" | "amatore";

export default function AdminUsersReport({ users }: { users: UserStats[] }) {
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    let result = users;

    if (roleFilter !== "all") {
      result = result.filter((u) => u.profile.role === roleFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (u) =>
          u.profile.full_name.toLowerCase().includes(term) ||
          u.profile.id.toLowerCase().includes(term)
      );
    }

    return result;
  }, [users, roleFilter, searchTerm]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let aVal: any, bVal: any;

      if (sortField === "name") {
        aVal = a.profile.full_name.toLowerCase();
        bVal = b.profile.full_name.toLowerCase();
      } else if (sortField === "role") {
        aVal = a.profile.role;
        bVal = b.profile.role;
      } else if (sortField === "weekly_limit") {
        aVal = a.profile.weekly_limit;
        bVal = b.profile.weekly_limit;
      } else {
        aVal = a.stats[sortField];
        bVal = b.stats[sortField];
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

  const roleLabel: Record<string, string> = {
    admin: "Amministratore",
    agonista: "Agonista",
    amatore: "Amatore",
  };

  const roleCounts = {
    all: users.length,
    admin: users.filter((u) => u.profile.role === "admin").length,
    agonista: users.filter((u) => u.profile.role === "agonista").length,
    amatore: users.filter((u) => u.profile.role === "amatore").length,
  };

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th
      className="cursor-pointer select-none px-3 py-2 text-left hover:bg-slate-200"
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortField === field && (
          <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
        )}
      </span>
    </th>
  );

  return (
    <div className="card">
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setRoleFilter("all")}
            className={`px-3 py-1 text-sm rounded ${
              roleFilter === "all"
                ? "bg-navy-600 text-white"
                : "bg-slate-200 text-slate-800 hover:bg-slate-300"
            }`}
          >
            Tutti ({roleCounts.all})
          </button>
          <button
            onClick={() => setRoleFilter("admin")}
            className={`px-3 py-1 text-sm rounded ${
              roleFilter === "admin"
                ? "bg-amber-600 text-white"
                : "bg-amber-100 text-amber-800 hover:bg-amber-200"
            }`}
          >
            Admin ({roleCounts.admin})
          </button>
          <button
            onClick={() => setRoleFilter("agonista")}
            className={`px-3 py-1 text-sm rounded ${
              roleFilter === "agonista"
                ? "bg-blue-600 text-white"
                : "bg-blue-100 text-blue-800 hover:bg-blue-200"
            }`}
          >
            Agonisti ({roleCounts.agonista})
          </button>
          <button
            onClick={() => setRoleFilter("amatore")}
            className={`px-3 py-1 text-sm rounded ${
              roleFilter === "amatore"
                ? "bg-navy-600 text-white"
                : "bg-navy-100 text-navy-800 hover:bg-navy-200"
            }`}
          >
            Amatori ({roleCounts.amatore})
          </button>
        </div>

        <div>
          <input
            type="text"
            placeholder="Cerca per nome o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full sm:w-64"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <SortHeader field="name" label="Utente" />
              <SortHeader field="role" label="Ruolo" />
              <SortHeader field="weekly_limit" label="Limite/sett." />
              <SortHeader field="week" label="Settimana" />
              <SortHeader field="month" label="Mese" />
              <SortHeader field="year" label="Anno" />
              <SortHeader field="cancelled" label="Cancellate" />
            </tr>
          </thead>
          <tbody>
            {sorted.map(({ profile: p, stats }) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium">{p.full_name}</td>
                <td className="px-3 py-2">
                  <span
                    className={`badge text-xs ${
                      p.role === "admin"
                        ? "bg-amber-100 text-amber-800"
                        : p.role === "agonista"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-navy-100 text-navy-800"
                    }`}
                  >
                    {roleLabel[p.role]}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">{p.weekly_limit}</td>
                <td className="px-3 py-2 text-right font-medium">{stats.week}</td>
                <td className="px-3 py-2 text-right font-medium">{stats.month}</td>
                <td className="px-3 py-2 text-right font-medium">{stats.year}</td>
                <td className="px-3 py-2 text-right text-red-600">{stats.cancelled}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <p className="py-4 text-center text-sm text-slate-500">Nessun risultato</p>
      )}

      <div className="mt-2 text-xs text-slate-500">
        Visualizzati {sorted.length} di {users.length} utenti
      </div>
    </div>
  );
}
