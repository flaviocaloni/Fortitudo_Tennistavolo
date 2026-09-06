"use client";

import { useMemo, useState } from "react";
import {
  adminDeleteUser,
  adminSendPasswordReset,
  adminSetPassword,
  adminToggleUserActive,
  adminUpdateUser,
} from "@/lib/actions/users";
import type { Profile } from "@/lib/types";

interface AuthInfo {
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  confirmed: boolean;
  provider: string;
}

interface UserRow {
  profile: Profile;
  info?: AuthInfo;
  assignedTeamId?: string;
}

interface Team {
  id: string;
  name: string;
  series: string;
  group_code: string;
  championship_id: string;
  championshipName: string;
}

type RoleFilter = "all" | "admin" | "agonista" | "amatore";

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  agonista: "Agonista",
  amatore: "Amatore",
};

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" }) : "mai";
}

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("it-IT", { dateStyle: "long" }) : "—";
}

function getCertStatus(expiry: string | null) {
  if (!expiry) return { status: "missing", label: "Cert. mancante", color: "bg-slate-100 text-slate-800" };
  const exp = new Date(expiry);
  const today = new Date();
  const daysLeft = Math.floor((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { status: "expired", label: "Cert. SCADUTO", color: "bg-red-100 text-red-800" };
  if (daysLeft <= 30) return { status: "expiring", label: `Cert. scade tra ${daysLeft}gg`, color: "bg-amber-100 text-amber-800" };
  return { status: "valid", label: "Cert. valido", color: "bg-green-100 text-green-800" };
}

export default function AdminUsersListClient({
  users,
  isAdmin,
  teams = [],
}: {
  users: UserRow[];
  isAdmin: boolean;
  teams?: Team[];
}) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [selectedTeamsByUser, setSelectedTeamsByUser] = useState<Record<string, string>>({});

  const counts = useMemo(
    () => ({
      admin: users.filter((u) => u.profile.role === "admin").length,
      agonista: users.filter((u) => u.profile.role === "agonista").length,
      amatore: users.filter((u) => u.profile.role === "amatore").length,
    }),
    [users]
  );

  const filtered = useMemo(() => {
    let result = users;
    if (roleFilter !== "all") {
      result = result.filter((u) => u.profile.role === roleFilter);
    }
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter(
        (u) =>
          u.profile.full_name.toLowerCase().includes(term) ||
          (u.info?.email ?? "").toLowerCase().includes(term)
      );
    }
    return result;
  }, [users, roleFilter, search]);

  const showList = search.trim().length > 0 || roleFilter !== "all";

  const StatCard = ({
    label,
    value,
    filter,
    color,
  }: {
    label: string;
    value: number;
    filter: RoleFilter;
    color: string;
  }) => (
    <button
      onClick={() => {
        setRoleFilter(roleFilter === filter ? "all" : filter);
        setSearch("");
      }}
      className={`card text-center transition-all hover:shadow-md ${
        roleFilter === filter ? "ring-2 ring-navy-500" : ""
      }`}
    >
      <p className={`text-3xl font-bold ${color} underline-offset-4 hover:underline`}>{value}</p>
      <p className="text-sm text-slate-600">{label}</p>
    </button>
  );

  return (
    <div suppressHydrationWarning>
      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard label="Admin" value={counts.admin} filter="admin" color="text-amber-700" />
        <StatCard label="Agonisti" value={counts.agonista} filter="agonista" color="text-blue-700" />
        <StatCard label="Amatori" value={counts.amatore} filter="amatore" color="text-navy-700" />
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Cerca utente per nome o email…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setRoleFilter("all");
          }}
          className="input w-full sm:w-80"
        />
      </div>

      {!showList && (
        <p className="text-sm text-slate-500">
          Cerca un utente o clicca su una statistica sopra per visualizzare l&apos;elenco.
        </p>
      )}

      {showList && (
        <>
          <p className="mb-3 text-sm text-slate-600">
            {filtered.length} di {users.length} utenti
          </p>

          <div className="space-y-3">
            {filtered.map(({ profile: p, info, assignedTeamId }) => (
              <div key={p.id} className="card">
                <div className="mb-2 space-y-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <span className="font-semibold">{p.full_name}</span>
                      {!p.is_active && (
                        <span className="badge ml-2 bg-red-100 text-red-800">
                          Accesso disattivato
                        </span>
                      )}
                      {info && (
                        <span className="ml-2 text-sm text-slate-500">
                          {info.email} · via {info.provider}
                          {!info.confirmed && (
                            <span className="badge ml-2 bg-amber-100 text-amber-800">
                              email non confermata
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      Registrato: {fmt(info?.created_at ?? p.created_at)} · Ultimo accesso:{" "}
                      {fmt(info?.last_sign_in_at ?? null)}
                    </span>
                  </div>
                  {(() => {
                    const cert = getCertStatus(p.medical_certificate_expiry);
                    return (
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className={`badge ${cert.color}`}>{cert.label}</span>
                        {p.medical_certificate_expiry && (
                          <span className="text-slate-600">
                            Scade il: {fmtDate(p.medical_certificate_expiry)}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="flex flex-wrap items-end gap-4">
                  <form action={adminUpdateUser} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="user_id" value={p.id} />
                    <div>
                      <label className="label">Nome</label>
                      <input name="full_name" defaultValue={p.full_name} className="input w-44" />
                    </div>
                    {isAdmin && (
                      <div>
                        <label className="label">Email</label>
                        <input
                          name="email"
                          type="email"
                          defaultValue={info?.email ?? ""}
                          className="input w-56"
                        />
                      </div>
                    )}
                    <div>
                      <label className="label">Ruolo</label>
                      <select name="role" className="input w-auto" defaultValue={p.role}>
                        <option value="amatore">Amatore</option>
                        <option value="agonista">Agonista</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Limite/sett.</label>
                      <select name="weekly_limit" className="input w-auto" defaultValue={p.weekly_limit}>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Cert. medico (scadenza)</label>
                      <input
                        type="date"
                        name="medical_certificate_expiry"
                        defaultValue={p.medical_certificate_expiry ?? ""}
                        className="input w-auto"
                      />
                    </div>
                    {p.role === "agonista" && (
                      <>
                        {(() => {
                          const assignedTeam = assignedTeamId
                            ? teams?.find((t) => t.id === assignedTeamId)
                            : null;
                          return (
                            <>
                              <div>
                                <label className="label">Squadra - Campionato</label>
                                <div className="input w-40 bg-slate-100 inline-flex items-center">
                                  {assignedTeam ? (
                                    <span className="text-gray-700">
                                      {assignedTeam.name} ({assignedTeam.championshipName})
                                    </span>
                                  ) : (
                                    <span className="text-gray-500">Nessuna squadra</span>
                                  )}
                                </div>
                                <input type="hidden" name="squadra" value={assignedTeam?.name ?? ""} />
                              </div>
                              <input type="hidden" name="girone" value={assignedTeam?.group_code ?? ""} />
                              <input type="hidden" name="serie" value={assignedTeam?.series ?? ""} />
                              <div>
                                <label className="label">Girone</label>
                                <input
                                  type="text"
                                  value={assignedTeam?.group_code ?? ""}
                                  readOnly
                                  className="input w-40 bg-slate-100"
                                />
                              </div>
                              <div>
                                <label className="label">Serie</label>
                                <input
                                  type="text"
                                  value={assignedTeam?.series ?? ""}
                                  readOnly
                                  className="input w-40 bg-slate-100"
                                />
                              </div>
                            </>
                          );
                        })()}
                        <div>
                          <label className="label">Tessera FITET</label>
                          <input
                            name="fitet_card_number"
                            defaultValue={p.fitet_card_number ?? ""}
                            placeholder="Numero tessera"
                            className="input w-40"
                          />
                        </div>
                      </>
                    )}
                    <button className="btn-navy">Salva</button>
                  </form>

                  {isAdmin && info && (
                    <>
                      <form action={adminSetPassword} className="flex items-end gap-2">
                        <input type="hidden" name="user_id" value={p.id} />
                        <div>
                          <label className="label">Nuova password</label>
                          <input
                            name="new_password"
                            minLength={6}
                            required
                            className="input w-40"
                            placeholder="min 6 caratteri"
                          />
                        </div>
                        <button className="btn-ghost">Imposta password</button>
                      </form>

                      <form action={adminSendPasswordReset}>
                        <input type="hidden" name="email" value={info.email} />
                        <button className="btn-ghost">✉️ Invia reset password</button>
                      </form>

                      {/* Impersonificazione temporaneamente disabilitata: vedi TODO_IMPERSONIFICAZIONE.md */}

                      <form action={adminToggleUserActive}>
                        <input type="hidden" name="user_id" value={p.id} />
                        <input type="hidden" name="activate" value={String(!p.is_active)} />
                        <button className="btn-ghost">
                          {p.is_active ? "🚫 Disattiva accesso" : "✅ Riattiva accesso"}
                        </button>
                      </form>

                      <button
                        className="btn-danger"
                        onClick={() => {
                          setDeleteTarget(p);
                          setConfirmChecked(false);
                        }}
                      >
                        🗑️ Elimina utente
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card w-full max-w-md">
            <h3 className="mb-2 font-semibold text-red-700">Elimina utente</h3>
            <p className="mb-3 text-sm text-slate-700">
              Stai per eliminare <b>{deleteTarget.full_name}</b> e{" "}
              <b>tutti i dati storicizzati</b> (profilo, prenotazioni, storico).
              L&apos;operazione è <b>irreversibile</b>.
            </p>
            <form action={adminDeleteUser} className="space-y-3">
              <input type="hidden" name="user_id" value={deleteTarget.id} />
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  name="confirm_delete"
                  checked={confirmChecked}
                  onChange={(e) => setConfirmChecked(e.target.checked)}
                  className="mt-0.5 rounded"
                />
                Confermo di voler eliminare definitivamente questo utente e tutti i
                suoi dati.
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setDeleteTarget(null)}
                >
                  Annulla
                </button>
                <button type="submit" disabled={!confirmChecked} className="btn-danger">
                  Elimina definitivamente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
