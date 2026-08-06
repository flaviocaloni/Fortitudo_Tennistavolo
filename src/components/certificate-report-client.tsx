"use client";

import { useMemo, useState } from "react";
import type { Profile } from "@/lib/types";

type SortField = "name" | "expiry" | "status";
type SortOrder = "asc" | "desc";
type StatusFilter = "all" | "missing" | "expired" | "expiring" | "valid";

const STATUS_LABELS: Record<string, string> = {
  missing: "Non inserito",
  expired: "Scaduto",
  expiring: "In scadenza",
  valid: "Valido",
};

const STATUS_COLORS: Record<string, string> = {
  missing: "bg-slate-100 text-slate-800",
  expired: "bg-red-100 text-red-800",
  expiring: "bg-amber-100 text-amber-800",
  valid: "bg-green-100 text-green-800",
};

interface CertStatus {
  status: "missing" | "expired" | "expiring" | "valid";
  label: string;
  daysLeft: number | null;
  expiryDate: string | null;
}

function getCertStatus(expiry: string | null): CertStatus {
  if (!expiry) {
    return {
      status: "missing",
      label: STATUS_LABELS.missing,
      daysLeft: null,
      expiryDate: null,
    };
  }

  const exp = new Date(expiry);
  const today = new Date();
  const daysLeft = Math.floor((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return {
      status: "expired",
      label: STATUS_LABELS.expired,
      daysLeft,
      expiryDate: expiry,
    };
  }

  if (daysLeft <= 30) {
    return {
      status: "expiring",
      label: `In scadenza - ${daysLeft}gg`,
      daysLeft,
      expiryDate: expiry,
    };
  }

  return {
    status: "valid",
    label: STATUS_LABELS.valid,
    daysLeft,
    expiryDate: expiry,
  };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("it-IT", { dateStyle: "long" });
}

interface ProfileWithStatus extends Profile {
  certStatus: CertStatus;
}

export default function CertificateReportClient({
  profiles,
}: {
  profiles: Profile[];
}) {
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const processedProfiles: ProfileWithStatus[] = useMemo(
    () => profiles.map((p) => ({ ...p, certStatus: getCertStatus(p.medical_certificate_expiry) })),
    [profiles]
  );

  const filtered = useMemo(() => {
    if (statusFilter === "all") return processedProfiles;
    return processedProfiles.filter((p) => p.certStatus.status === statusFilter);
  }, [processedProfiles, statusFilter]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let aVal: any, bVal: any;

      if (sortField === "name") {
        aVal = a.full_name.toLowerCase();
        bVal = b.full_name.toLowerCase();
      } else if (sortField === "expiry") {
        aVal = a.medical_certificate_expiry ?? "9999-12-31";
        bVal = b.medical_certificate_expiry ?? "9999-12-31";
      } else if (sortField === "status") {
        const statusOrder = { missing: 0, expired: 1, expiring: 2, valid: 3 };
        aVal = statusOrder[a.certStatus.status];
        bVal = statusOrder[b.certStatus.status];
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

  const counts = {
    all: processedProfiles.length,
    missing: processedProfiles.filter((p) => p.certStatus.status === "missing").length,
    expired: processedProfiles.filter((p) => p.certStatus.status === "expired").length,
    expiring: processedProfiles.filter((p) => p.certStatus.status === "expiring").length,
    valid: processedProfiles.filter((p) => p.certStatus.status === "valid").length,
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
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1 text-sm rounded ${
            statusFilter === "all"
              ? "bg-navy-600 text-white"
              : "bg-slate-200 text-slate-800 hover:bg-slate-300"
          }`}
        >
          Tutti ({counts.all})
        </button>
        <button
          onClick={() => setStatusFilter("missing")}
          className={`px-3 py-1 text-sm rounded ${
            statusFilter === "missing"
              ? "bg-slate-600 text-white"
              : "bg-slate-200 text-slate-800 hover:bg-slate-300"
          }`}
        >
          Non inserito ({counts.missing})
        </button>
        <button
          onClick={() => setStatusFilter("expired")}
          className={`px-3 py-1 text-sm rounded ${
            statusFilter === "expired"
              ? "bg-red-600 text-white"
              : "bg-red-100 text-red-800 hover:bg-red-200"
          }`}
        >
          Scaduti ({counts.expired})
        </button>
        <button
          onClick={() => setStatusFilter("expiring")}
          className={`px-3 py-1 text-sm rounded ${
            statusFilter === "expiring"
              ? "bg-amber-600 text-white"
              : "bg-amber-100 text-amber-800 hover:bg-amber-200"
          }`}
        >
          In scadenza ({counts.expiring})
        </button>
        <button
          onClick={() => setStatusFilter("valid")}
          className={`px-3 py-1 text-sm rounded ${
            statusFilter === "valid"
              ? "bg-green-600 text-white"
              : "bg-green-100 text-green-800 hover:bg-green-200"
          }`}
        >
          Validi ({counts.valid})
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <SortHeader field="name" label="Utente" />
              <th className="px-3 py-2">Ruolo</th>
              <SortHeader field="status" label="Stato" />
              <SortHeader field="expiry" label="Data scadenza" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium">{p.full_name}</td>
                <td className="px-3 py-2 text-xs">{p.role}</td>
                <td className="px-3 py-2">
                  <span className={`badge ${STATUS_COLORS[p.certStatus.status]}`}>
                    {p.certStatus.label}
                  </span>
                </td>
                <td className="px-3 py-2">{formatDate(p.medical_certificate_expiry)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <p className="py-4 text-center text-sm text-slate-500">Nessun risultato</p>
      )}
    </div>
  );
}
