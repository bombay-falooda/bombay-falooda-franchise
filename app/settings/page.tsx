"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { FormSection } from "@/components/form-section";
import { PageTitle } from "@/components/page-title";
import { ResultDialog } from "@/components/result-dialog";
import { StatusBadge } from "@/components/status-badge";
import { apiRequest } from "@/lib/api";

type Profile = {
  id: string;
  name: string;
  ownerName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
};
type Permissions = Record<string, boolean>;
type Alert = { id: string; type: string; title: string; message: string };
type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  actor?: { name: string; email: string | null } | null;
};
type SetupResponse = {
  issuer: string;
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
};
type MeResponse = {
  twoFactorEnabled: boolean;
  twoFactorMethod?: string | null;
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permissions, setPermissions] = useState<Permissions>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [setup, setSetup] = useState<SetupResponse | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [authenticatorCode, setAuthenticatorCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [profileData, permissionsData, alertData, auditData] = await Promise.all([
        apiRequest<Profile>("/franchise-portal/profile"),
        apiRequest<Permissions>("/franchise-portal/permissions"),
        apiRequest<Alert[]>("/franchise-portal/alerts"),
        apiRequest<AuditLog[]>("/franchise-portal/audit-logs"),
      ]);
      const meData = await apiRequest<MeResponse>("/auth/me");
      setProfile(profileData);
      setPermissions(permissionsData);
      setAlerts(alertData);
      setAuditLogs(auditData);
      setMe(meData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load settings");
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!profile) return;

    try {
      await apiRequest("/franchise-portal/profile", {
        method: "PATCH",
        body: {
          ownerName: profile.ownerName,
          phone: profile.phone,
          email: profile.email,
          address: profile.address,
          city: profile.city,
          state: profile.state,
          pincode: profile.pincode,
        },
      });
      setMessage("Franchise profile updated.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update profile");
    }
  }

  async function startAuthenticatorSetup() {
    try {
      const response = await apiRequest<SetupResponse>("/auth/2fa/setup", {
        method: "POST",
      });
      setSetup(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start authenticator setup");
    }
  }

  async function enableAuthenticator(event: FormEvent) {
    event.preventDefault();

    if (!setup) {
      return;
    }

    try {
      await apiRequest("/auth/2fa/enable", {
        method: "POST",
        body: { secret: setup.secret, code: authenticatorCode },
      });
      setMessage("Authenticator App 2FA enabled.");
      setSetup(null);
      setAuthenticatorCode("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not enable authenticator");
    }
  }

  return (
    <AppShell>
      <PageTitle title="Settings" description="Franchise profile, permissions, alerts and audit history." />

      {profile ? (
        <form onSubmit={save}>
          <FormSection title="Franchise Profile">
            <label>
              <span className="form-label">Franchise Name</span>
              <input className="form-input" value={profile.name} readOnly />
            </label>
            <label>
              <span className="form-label">Owner Name</span>
              <input className="form-input" value={profile.ownerName || ""} onChange={(event) => setProfile({ ...profile, ownerName: event.target.value })} />
            </label>
            <label>
              <span className="form-label">Email</span>
              <input className="form-input" value={profile.email || ""} onChange={(event) => setProfile({ ...profile, email: event.target.value })} />
            </label>
            <label>
              <span className="form-label">Phone</span>
              <input className="form-input" value={profile.phone || ""} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} />
            </label>
            <label>
              <span className="form-label">Address</span>
              <input className="form-input" value={profile.address || ""} onChange={(event) => setProfile({ ...profile, address: event.target.value })} />
            </label>
            <label>
              <span className="form-label">City</span>
              <input className="form-input" value={profile.city || ""} onChange={(event) => setProfile({ ...profile, city: event.target.value })} />
            </label>
            <label>
              <span className="form-label">State</span>
              <input className="form-input" value={profile.state || ""} onChange={(event) => setProfile({ ...profile, state: event.target.value })} />
            </label>
            <label>
              <span className="form-label">Pincode</span>
              <input className="form-input" value={profile.pincode || ""} onChange={(event) => setProfile({ ...profile, pincode: event.target.value })} />
            </label>
            <div>
              <button className="btn-primary" type="submit">Save Profile</button>
            </div>
          </FormSection>
        </form>
      ) : null}

      <section className="bf-panel mt-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#0f766e]">
              Two-factor authentication
            </p>
            <h2 className="font-display mt-2 text-xl font-bold text-[#10201f]">
              Authenticator App
            </h2>
            <div className="mt-3 inline-flex rounded-full border border-[#d8e8e5] bg-white/80 px-3 py-1 text-xs font-extrabold text-[#647876]">
              Status: {me?.twoFactorEnabled ? `Enabled${me.twoFactorMethod ? ` (${me.twoFactorMethod})` : ""}` : "Not enabled"}
            </div>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#647876]">
              Add Google Authenticator, Microsoft Authenticator, Authy or any
              TOTP app. After phone OTP login, this portal will ask for the
              authenticator code before opening your franchise dashboard.
            </p>
          </div>
          <button className="btn-primary" type="button" onClick={startAuthenticatorSetup}>
            Setup Authenticator
          </button>
        </div>

        {setup ? (
          <form className="mt-5 grid gap-5 rounded-[18px] border border-[#d8e8e5] bg-white/75 p-4" onSubmit={enableAuthenticator}>
            <div className="flex flex-wrap items-center gap-5">
              <Image
                src={setup.qrCodeDataUrl}
                alt="Authenticator QR code"
                width={170}
                height={170}
                unoptimized
                className="rounded-[16px] border border-[#d8e8e5] bg-white p-2"
              />
              <div className="max-w-md">
                <p className="text-sm font-extrabold text-[#10201f]">Manual secret</p>
                <p className="mt-2 break-all rounded-[14px] bg-[#f2fbf9] p-3 text-sm font-bold text-[#647876]">
                  {setup.secret}
                </p>
                <p className="mt-3 text-xs font-semibold leading-5 text-[#647876]">
                  Scan the QR code, then enter the current 6-digit app code.
                </p>
              </div>
            </div>
            <label>
              <span className="form-label">Authenticator code</span>
              <input className="form-input max-w-xs text-center text-lg tracking-[0.4em]" maxLength={6} value={authenticatorCode} onChange={(event) => setAuthenticatorCode(event.target.value)} />
            </label>
            <div>
              <button className="btn-primary" type="submit">Enable Authenticator</button>
            </div>
          </form>
        ) : null}
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="bf-panel p-4">
          <h2 className="font-display text-xl font-bold text-[#10201f]">Permissions</h2>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {Object.entries(permissions).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-[14px] border border-[#d8e8e5] bg-white/70 px-3 py-2 text-sm font-bold text-[#244442]">
                <span>{key}</span>
                <StatusBadge value={value} />
              </div>
            ))}
          </div>
        </div>

        <div className="bf-panel p-4">
          <h2 className="font-display text-xl font-bold text-[#10201f]">Alerts</h2>
          <div className="mt-4 space-y-2">
            {alerts.length === 0 ? (
              <div className="text-sm font-semibold text-[#647876]">No active alerts.</div>
            ) : alerts.map((alert) => (
              <div key={alert.id} className="rounded-[14px] border border-[#d8e8e5] bg-white/70 px-3 py-2">
                <div className="text-sm font-extrabold text-[#10201f]">{alert.title}</div>
                <div className="text-xs font-semibold text-[#647876]">{alert.message}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-4">
        <h2 className="mb-3 font-display text-xl font-bold text-[#10201f]">Audit History</h2>
        <DataTable columns={["Action", "Entity", "Actor", "Date"]}>
          {auditLogs.map((log) => (
            <tr key={log.id} className="hover:bg-[#f2fbf9]">
              <td className="px-5 py-4 font-bold text-[#10201f]">{log.action}</td>
              <td className="px-5 py-4 font-semibold text-[#647876]">{log.entityType}</td>
              <td className="px-5 py-4 font-semibold text-[#647876]">{log.actor?.name || "-"}</td>
              <td className="px-5 py-4 text-xs font-semibold text-[#647876]">{new Date(log.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </DataTable>
      </div>

      <ResultDialog open={!!message} title="Success" message={message} onPrimary={() => setMessage("")} />
      <ResultDialog open={!!error} title="Settings error" message={error} tone="error" onPrimary={() => setError("")} />
    </AppShell>
  );
}
