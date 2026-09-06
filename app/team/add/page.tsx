"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { CountryCodePicker } from "@/components/country-code-picker";
import { PageTitle } from "@/components/page-title";
import { ResultDialog } from "@/components/result-dialog";
import { apiRequest } from "@/lib/api";
import { INDIAN_STATES_AND_CITIES } from "@/lib/indian-states-cities";
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

  // State Options
  const stateOptions = useMemo(() => {
    return INDIAN_STATES_AND_CITIES.map((s) => ({ label: s.state, value: s.state }));
  }, []);

  // City Options based on selected State
  const cityOptions = useMemo(() => {
    const foundState = INDIAN_STATES_AND_CITIES.find((s) => s.state === form.state);
    return foundState
      ? foundState.cities.map((c) => ({ label: c, value: c }))
      : [{ label: form.city || "Custom", value: form.city }];
  }, [form.state, form.city]);

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const member = await apiRequest<{ id: string }>("/franchise-portal/team", {
        method: "POST",
        body: {
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          countryCode: form.countryCode,
          phone: form.phone.trim() || undefined,
          password: form.password.trim(),
          role: form.role,
          outletId: form.outletId || undefined,
          address: form.address.trim() || undefined,
          state: form.state,
          city: form.city,
          pincode: form.pincode.trim() || undefined,
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
      <PageTitle
        title="Add Team Member"
        description="Onboard outlet staff or POS cashiers and assign location & outlet access."
      >
        <Link className="btn-secondary text-xs" href="/team">
          ← Back to Team Directory
        </Link>
      </PageTitle>

      <form className="space-y-6" onSubmit={save}>
        {/* Section 1: Basic & Contact Details */}
        <div className="bf-panel p-6 space-y-4">
          <h2 className="font-display text-base font-bold text-[#10201f] border-b border-[#d8e8e5] pb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#0f766e]"></span>
            1. Basic & Contact Details
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase text-[#0f766e] mb-1">
                Full Name *
              </label>
              <input
                className="form-input text-xs font-semibold"
                placeholder="e.g. Sahir Qureshi"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#0f766e] mb-1">
                Email Address
              </label>
              <input
                type="email"
                className="form-input text-xs"
                placeholder="e.g. sahir@bombayfalooda.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#0f766e] mb-1">
                Phone Number
              </label>
              <div className="flex items-center gap-2">
                <CountryCodePicker
                  value={form.countryCode}
                  onChange={(code) => setForm({ ...form, countryCode: code })}
                />
                <input
                  type="tel"
                  className="form-input text-xs font-mono w-full"
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#0f766e] mb-1">
                Initial Password *
              </label>
              <input
                type="password"
                className="form-input text-xs"
                placeholder="Minimum 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        {/* Section 2: Access Role & Outlet Assignment */}
        <div className="bf-panel p-6 space-y-4">
          <h2 className="font-display text-base font-bold text-[#10201f] border-b border-[#d8e8e5] pb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#7c3fe0]"></span>
            2. Access Role & Outlet Assignment
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase text-[#0f766e] mb-1">
                Access Role *
              </label>
              <select
                className="form-input text-xs font-semibold"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as TeamFormState["role"] })}
              >
                <option value="STAFF">Outlet Staff (Order fulfillment / Non-billing)</option>
                <option value="POS_USER">POS User (Cashier & Billing Register Access)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#0f766e] mb-1">
                Outlet Assignment
              </label>
              <select
                className="form-input text-xs font-semibold"
                value={form.outletId}
                onChange={(e) => setForm({ ...form, outletId: e.target.value })}
              >
                <option value="">-- Unassigned / All Outlets --</option>
                {outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name} ({outlet.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Address & Location Details */}
        <div className="bf-panel p-6 space-y-4">
          <h2 className="font-display text-base font-bold text-[#10201f] border-b border-[#d8e8e5] pb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            3. Address & Location Details
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-3">
              <label className="block text-xs font-bold uppercase text-[#0f766e] mb-1">
                Street / Door Address
              </label>
              <input
                className="form-input text-xs"
                placeholder="e.g. Shop #4, Ground Floor, Ring Road"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#0f766e] mb-1">
                State
              </label>
              <select
                className="form-input text-xs font-semibold"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              >
                {stateOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#0f766e] mb-1">
                City
              </label>
              <select
                className="form-input text-xs font-semibold"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              >
                {cityOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#0f766e] mb-1">
                Pincode
              </label>
              <input
                type="text"
                className="form-input text-xs font-mono"
                placeholder="e.g. 395006"
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link className="btn-secondary text-xs" href="/team">
            Cancel
          </Link>
          <button className="btn-primary text-xs font-bold px-6 py-2.5" disabled={saving} type="submit">
            {saving ? "Saving Member..." : "Create Team Member"}
          </button>
        </div>
      </form>

      <ResultDialog
        open={!!error}
        title="Team Error"
        message={error}
        tone="error"
        onPrimary={() => setError("")}
      />
    </AppShell>
  );
}
