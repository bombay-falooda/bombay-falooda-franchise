"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageTitle } from "@/components/page-title";
import { ResultDialog } from "@/components/result-dialog";
import { apiRequest } from "@/lib/api";
import type { Outlet } from "@/lib/menu-data";
import {
  blankTeamForm,
  findTeamMember,
  loadTeamData,
  type TeamFormState,
} from "@/lib/team-data";

export default function EditTeamMemberPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const memberId = params.id;
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [form, setForm] = useState<TeamFormState>(blankTeamForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void load();
  }, [memberId]);

  async function load() {
    setLoading(true);
    try {
      const data = await loadTeamData();
      const member = findTeamMember(data.team, memberId);
      setOutlets(data.outlets);

      if (!member) {
        setError("Team member not found.");
        return;
      }

      setForm({
        name: member.name,
        email: member.email || "",
        phone: member.phone || "",
        password: "",
        role: member.role === "POS_USER" ? "POS_USER" : "STAFF",
        outletId: member.outletId || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load team member");
    } finally {
      setLoading(false);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiRequest(`/franchise-portal/team/${memberId}`, {
        method: "PATCH",
        body: {
          name: form.name,
          email: form.email || undefined,
          phone: form.phone || undefined,
          password: form.password || undefined,
          role: form.role,
          outletId: form.outletId || undefined,
        },
      });
      router.push(`/team/${memberId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update team member");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <PageTitle title="Edit Team Member" description="Update staff details, role and outlet assignment.">
        <div className="flex flex-wrap gap-2">
          <Link className="btn-secondary" href={`/team/${memberId}`}>
            Back
          </Link>
          <Link className="btn-secondary" href="/team">
            Team Directory
          </Link>
        </div>
      </PageTitle>

      {loading ? (
        <div className="bf-panel p-5 text-sm font-semibold text-[#647876]">Loading member...</div>
      ) : (
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
          <input className="form-input lg:col-span-2" placeholder="New password optional" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          <button className="btn-primary lg:col-span-2" disabled={saving} type="submit">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      )}

      <ResultDialog open={!!error} title="Team error" message={error} tone="error" onPrimary={() => setError("")} />
    </AppShell>
  );
}
