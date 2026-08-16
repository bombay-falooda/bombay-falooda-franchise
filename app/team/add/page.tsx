"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageTitle } from "@/components/page-title";
import { ResultDialog } from "@/components/result-dialog";
import { apiRequest } from "@/lib/api";
import type { Outlet } from "@/lib/menu-data";
import { blankTeamForm, loadTeamData, type TeamFormState } from "@/lib/team-data";

export default function AddTeamMemberPage() {
  const router = useRouter();
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [form, setForm] = useState<TeamFormState>(blankTeamForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      const data = await loadTeamData();
      setOutlets(data.outlets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load outlets");
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const member = await apiRequest<{ id: string }>("/franchise-portal/team", {
        method: "POST",
        body: {
          name: form.name,
          email: form.email || undefined,
          phone: form.phone || undefined,
          password: form.password,
          role: form.role,
          outletId: form.outletId || undefined,
        },
      });
      router.push(`/team/${member.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create team member");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <PageTitle title="Add Team Member" description="Create staff or POS users and assign them to an outlet.">
        <Link className="btn-secondary" href="/team">
          Back
        </Link>
      </PageTitle>

      <form className="bf-panel grid gap-3 p-4 lg:grid-cols-6" onSubmit={save}>
        <input className="form-input lg:col-span-2" placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        <input className="form-input lg:col-span-2" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <input className="form-input" placeholder="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        <select className="form-input" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as TeamFormState["role"] })}>
          <option value="STAFF">Staff</option>
          <option value="POS_USER">POS User</option>
        </select>
        <select className="form-input lg:col-span-2" value={form.outletId} onChange={(event) => setForm({ ...form, outletId: event.target.value })}>
          <option value="">No outlet assignment</option>
          {outlets.map((outlet) => (
            <option key={outlet.id} value={outlet.id}>
              {outlet.name} ({outlet.code})
            </option>
          ))}
        </select>
        <input className="form-input lg:col-span-2" placeholder="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
        <button className="btn-primary lg:col-span-2" disabled={saving} type="submit">
          {saving ? "Saving..." : "Create Member"}
        </button>
      </form>

      <ResultDialog open={!!error} title="Team error" message={error} tone="error" onPrimary={() => setError("")} />
    </AppShell>
  );
}
