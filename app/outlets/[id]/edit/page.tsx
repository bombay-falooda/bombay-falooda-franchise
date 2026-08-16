"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageTitle } from "@/components/page-title";
import { ResultDialog } from "@/components/result-dialog";
import { apiRequest } from "@/lib/api";
import {
  findOutlet,
  loadOutlets,
  outletUpdateBody,
  toOutletForm,
  type OutletFormState,
} from "@/lib/outlet-data";

const blankForm: OutletFormState = {
  name: "",
  address: "",
  phone: "",
  email: "",
  status: "ACTIVE",
  dineIn: true,
  takeaway: true,
  delivery: false,
  onlineOrderingEnabled: true,
  serviceRadiusKm: "",
  outletBaseCharge: "",
  deliveryKmPricing: [],
  openingTime: "",
  closingTime: "",
};

export default function EditOutletPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const outletId = params.id;
  const [form, setForm] = useState<OutletFormState>(blankForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void load();
  }, [outletId]);

  async function load() {
    setLoading(true);
    try {
      const outlets = await loadOutlets();
      const outlet = findOutlet(outlets, outletId);
      if (!outlet) {
        setError("Outlet not found.");
        return;
      }
      setForm(toOutletForm(outlet));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load outlet");
    } finally {
      setLoading(false);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiRequest(`/franchise-portal/outlets/${outletId}`, {
        method: "PATCH",
        body: outletUpdateBody(form),
      });
      router.push(`/outlets/${outletId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update outlet");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <PageTitle
        title="Edit Outlet"
        description="Update operating settings and delivery pricing for this outlet."
      >
        <div className="flex flex-wrap gap-2">
          <Link className="btn-secondary" href={`/outlets/${outletId}`}>
            Back
          </Link>
          <Link className="btn-secondary" href="/outlets">
            Outlets Directory
          </Link>
        </div>
      </PageTitle>

      {loading ? (
        <div className="bf-panel p-5 text-sm font-semibold text-[#647876]">Loading outlet...</div>
      ) : (
        <form className="grid gap-4" onSubmit={save}>
          <section className="bf-panel grid gap-3 p-4 lg:grid-cols-6">
            <h2 className="font-display text-lg font-bold text-[#10201f] lg:col-span-6">
              Outlet Details
            </h2>
            <input
              className="form-input lg:col-span-2"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Outlet name"
              required
            />
            <input
              className="form-input lg:col-span-2"
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
              placeholder="Address"
              required
            />
            <input
              className="form-input"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              placeholder="Phone"
            />
            <input
              className="form-input"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="Email"
            />
            <input
              className="form-input"
              value={form.openingTime}
              onChange={(event) => setForm({ ...form, openingTime: event.target.value })}
              placeholder="Opening time"
            />
            <input
              className="form-input"
              value={form.closingTime}
              onChange={(event) => setForm({ ...form, closingTime: event.target.value })}
              placeholder="Closing time"
            />
            <select
              className="form-input"
              value={form.status}
              onChange={(event) =>
                setForm({ ...form, status: event.target.value as OutletFormState["status"] })
              }
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </section>

          <section className="bf-panel grid gap-3 p-4 md:grid-cols-4">
            <h2 className="font-display text-lg font-bold text-[#10201f] md:col-span-4">
              Services
            </h2>
            {(["dineIn", "takeaway", "onlineOrderingEnabled"] as const).map((key) => (
              <label
                key={key}
                className="flex h-11 items-center gap-2 rounded-[12px] border border-[#d8e8e5] bg-white/70 px-3 text-sm font-bold text-[#244442]"
              >
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(event) => setForm({ ...form, [key]: event.target.checked })}
                />
                {labelFor(key)}
              </label>
            ))}
            <div className="flex h-11 items-center gap-2 rounded-[12px] border border-[#d8e8e5] bg-white/70 px-3 text-sm font-bold text-[#244442]">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  form.delivery ? "bg-[#22c55e]" : "bg-[#cbd5e1]"
                }`}
              />
              Delivery {form.delivery ? "Enabled" : "Disabled"} by Superadmin
            </div>
          </section>

          <section className="bf-panel grid gap-3 p-4 md:grid-cols-2">
            <div>
              <h2 className="font-display text-lg font-bold text-[#10201f]">
                Outlet Base Charge
              </h2>
              <p className="mt-1 text-sm font-semibold text-[#647876]">
                This charge applies to dine-in, takeaway and delivery orders for this outlet.
              </p>
            </div>
            <input
              className="form-input"
              type="number"
              min="0"
              step="0.01"
              placeholder="Outlet base charge INR"
              value={form.outletBaseCharge}
              onChange={(event) =>
                setForm({ ...form, outletBaseCharge: event.target.value })
              }
            />
          </section>

          {form.delivery ? (
            <section className="bf-panel grid gap-3 p-4">
              <div className="md:col-span-4">
                <h2 className="font-display text-lg font-bold text-[#10201f]">
                  Delivery Pricing
                </h2>
                <p className="mt-1 text-sm font-semibold text-[#647876]">
                  Add simple slabs like 2 km = INR 30, 3 km = INR 45, 5 km = INR 70.
                </p>
              </div>
              <input
                className="form-input max-w-sm"
                type="number"
                min="0"
                step="0.1"
                placeholder="Maximum delivery radius km"
                value={form.serviceRadiusKm}
                onChange={(event) => setForm({ ...form, serviceRadiusKm: event.target.value })}
              />
              <div className="grid gap-3">
                {form.deliveryKmPricing.map((row, index) => (
                  <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]" key={index}>
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="Up to km"
                      value={row.km}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          deliveryKmPricing: form.deliveryKmPricing.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, km: event.target.value } : item,
                          ),
                        })
                      }
                    />
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Price INR"
                      value={row.price}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          deliveryKmPricing: form.deliveryKmPricing.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, price: event.target.value } : item,
                          ),
                        })
                      }
                    />
                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          deliveryKmPricing: form.deliveryKmPricing.filter(
                            (_item, itemIndex) => itemIndex !== index,
                          ),
                        })
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      deliveryKmPricing: [
                        ...form.deliveryKmPricing,
                        { km: "", price: "" },
                      ],
                    })
                  }
                >
                  Add KM Price
                </button>
              </div>
            </section>
          ) : (
            <div className="bf-panel p-4 text-sm font-semibold text-[#647876]">
              Delivery pricing fields will appear when delivery is enabled for this outlet.
            </div>
          )}

          <button className="btn-primary" disabled={saving} type="submit">
            {saving ? "Saving..." : "Save Outlet"}
          </button>
        </form>
      )}

      <ResultDialog
        open={!!error}
        title="Outlet error"
        message={error}
        tone="error"
        onPrimary={() => setError("")}
      />
    </AppShell>
  );
}

function labelFor(key: "dineIn" | "takeaway" | "onlineOrderingEnabled") {
  return {
    dineIn: "Dine In",
    takeaway: "Takeaway",
    onlineOrderingEnabled: "Online Ordering",
  }[key];
}
