"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageTitle } from "@/components/page-title";
import { ResultDialog } from "@/components/result-dialog";
import { apiRequest } from "@/lib/api";
import {
  blankPosRequest,
  loadPosData,
  posRequestBody,
  type PosOutlet,
  type PosRequestForm,
} from "@/lib/pos-data";

export default function RequestPosPage() {
  const router = useRouter();
  const [outlets, setOutlets] = useState<PosOutlet[]>([]);
  const [form, setForm] = useState<PosRequestForm>(blankPosRequest);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      const data = await loadPosData();
      setOutlets(data.outlets);
      setForm((current) => ({
        ...current,
        outletId: current.outletId || data.outlets[0]?.id || "",
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load outlets");
    }
  }

  async function submitRequest(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiRequest("/franchise-portal/pos-devices/request", {
        method: "POST",
        body: posRequestBody(form),
      });
      setMessage("POS request created. Superadmin can approve and activate it.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not request POS device");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <PageTitle
        title="Request POS"
        description="Request permanent outlet POS or temporary event POS access."
      >
        <Link className="btn-secondary" href="/pos-devices">
          Back
        </Link>
      </PageTitle>

      <form className="grid gap-4" onSubmit={submitRequest}>
        <section className="grid gap-3 md:grid-cols-2">
          <button
            className={`bf-panel p-5 text-left ${
              form.type === "PERMANENT" ? "ring-2 ring-[#14b8a6]" : ""
            }`}
            type="button"
            onClick={() => setForm({ ...form, type: "PERMANENT" })}
          >
            <p className="text-xs font-black uppercase text-[#0f766e]">Permanent POS</p>
            <h2 className="mt-2 font-display text-xl font-bold text-[#10201f]">
              Outlet Counter POS
            </h2>
            <p className="mt-2 text-sm font-semibold text-[#647876]">
              For daily billing at a fixed outlet. Extra POS billing is INR 1000/month.
            </p>
          </button>

          <button
            className={`bf-panel p-5 text-left ${
              form.type === "TEMPORARY" ? "ring-2 ring-[#14b8a6]" : ""
            }`}
            type="button"
            onClick={() => setForm({ ...form, type: "TEMPORARY" })}
          >
            <p className="text-xs font-black uppercase text-[#a06412]">Temporary POS</p>
            <h2 className="mt-2 font-display text-xl font-bold text-[#10201f]">
              Event or Stall POS
            </h2>
            <p className="mt-2 text-sm font-semibold text-[#647876]">
              For festival stalls, exhibitions, pop-ups or short-term counters.
            </p>
          </button>
        </section>

        <section className="bf-panel grid gap-3 p-4 lg:grid-cols-6">
          <h2 className="font-display text-lg font-bold text-[#10201f] lg:col-span-6">
            POS Details
          </h2>
          <select
            className="form-input lg:col-span-3"
            value={form.outletId}
            onChange={(event) => setForm({ ...form, outletId: event.target.value })}
            required
          >
            <option value="">Select outlet</option>
            {outlets.map((outlet) => (
              <option key={outlet.id} value={outlet.id}>
                {outlet.name} ({outlet.code})
              </option>
            ))}
          </select>
          <input
            className="form-input lg:col-span-3"
            placeholder={form.type === "TEMPORARY" ? "Device name e.g. Exhibition Counter" : "Device name e.g. Main Counter POS"}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <div className="rounded-[12px] bg-[#fff5dd] px-3 py-2 text-xs font-bold text-[#a06412] lg:col-span-6">
            Extra POS pricing: INR 1000/month per POS device.
          </div>
        </section>

        {form.type === "TEMPORARY" ? (
          <section className="bf-panel grid gap-3 p-4 lg:grid-cols-6">
            <h2 className="font-display text-lg font-bold text-[#10201f] lg:col-span-6">
              Temporary Event Details
            </h2>
            <input
              className="form-input lg:col-span-2"
              placeholder="Event name"
              value={form.eventName}
              onChange={(event) => setForm({ ...form, eventName: event.target.value })}
              required
            />
            <input
              className="form-input lg:col-span-2"
              placeholder="Event location"
              value={form.eventLocation}
              onChange={(event) =>
                setForm({ ...form, eventLocation: event.target.value })
              }
              required
            />
            <input
              className="form-input"
              placeholder="Handler name"
              value={form.handlerName}
              onChange={(event) => setForm({ ...form, handlerName: event.target.value })}
              required
            />
            <input
              className="form-input"
              placeholder="Handler phone"
              value={form.handlerPhone}
              onChange={(event) => setForm({ ...form, handlerPhone: event.target.value })}
              required
            />
            <input
              className="form-input lg:col-span-3"
              type="date"
              value={form.validFrom}
              onChange={(event) => setForm({ ...form, validFrom: event.target.value })}
              required
            />
            <input
              className="form-input lg:col-span-3"
              type="date"
              value={form.validUntil}
              onChange={(event) => setForm({ ...form, validUntil: event.target.value })}
              required
            />
          </section>
        ) : null}

        <button className="btn-primary" disabled={saving} type="submit">
          {saving ? "Submitting..." : `Submit ${form.type === "TEMPORARY" ? "Temporary" : "Permanent"} POS Request`}
        </button>
      </form>

      <ResultDialog
        open={!!message}
        title="Success"
        message={message}
        primaryLabel="View POS Devices"
        onPrimary={() => router.push("/pos-devices")}
      />
      <ResultDialog
        open={!!error}
        title="POS request error"
        message={error}
        tone="error"
        onPrimary={() => setError("")}
      />
    </AppShell>
  );
}
