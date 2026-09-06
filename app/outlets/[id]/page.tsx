"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { PageTitle } from "@/components/page-title";
import { ResultDialog } from "@/components/result-dialog";
import { StatusBadge } from "@/components/status-badge";
import { findOutlet, loadOutlets, type Outlet } from "@/lib/outlet-data";

export default function OutletDetailPage() {
  const params = useParams<{ id: string }>();
  const outletId = params.id;
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void load();
  }, [outletId]);

  async function load() {
    setLoading(true);
    try {
      const outlets = await loadOutlets();
      setOutlet(findOutlet(outlets, outletId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load outlet");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <PageTitle title={outlet?.name || "Outlet"} description="View outlet services, timing and delivery pricing.">
        <div className="flex flex-wrap gap-2">
          <Link className="btn-secondary" href="/outlets">
            Back
          </Link>
          {outlet ? (
            <Link className="btn-primary" href={`/outlets/${outlet.id}/edit`}>
              Edit Outlet
            </Link>
          ) : null}
        </div>
      </PageTitle>

      {loading ? (
        <div className="bf-panel p-5 text-sm font-semibold text-[#647876]">Loading outlet...</div>
      ) : !outlet ? (
        <div className="bf-panel p-5 text-sm font-semibold text-[#647876]">Outlet not found.</div>
      ) : (
        <>
          <section className="mb-4 grid gap-3 md:grid-cols-4">
            <MetricCard label="Status" value={outlet.status} helper="Outlet state" />
            <MetricCard label="Menu" value={outlet.menuSetupStatus} helper="Menu setup" />
            <MetricCard label="POS" value={String(outlet._count?.posDevices ?? 0)} helper="Linked devices" />
            <MetricCard label="Team" value={String(outlet._count?.users ?? 0)} helper="Assigned users" />
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <div className="bf-panel grid gap-4 p-5 md:grid-cols-2">
              <Info label="Code" value={outlet.code} />
              <div>
                <p className="text-xs font-black uppercase text-[#0f766e]">Status</p>
                <div className="mt-2"><StatusBadge value={outlet.status} /></div>
              </div>
              <Info label="Address" value={outlet.address} />
              <Info label="Phone" value={outlet.phone || "-"} />
              <Info label="Email" value={outlet.email || "-"} />
              <Info label="Timing" value={`${outlet.openingTime || "--"} to ${outlet.closingTime || "--"}`} />
            </div>

            <div className="bf-panel grid gap-4 p-5 md:grid-cols-2">
              <Info label="Dine In" value={outlet.dineIn ? "Enabled" : "Disabled"} />
              <Info label="Takeaway" value={outlet.takeaway ? "Enabled" : "Disabled"} />
              <Info label="Delivery" value={outlet.delivery ? "Enabled" : "Disabled"} />
              <Info label="Online Ordering" value={outlet.onlineOrderingEnabled ? "Enabled" : "Disabled"} />
              <Info label="Platform Fee" value={`INR ${outlet.outletBaseCharge || "0"}`} />
              <Info label="Service Radius" value={`${outlet.serviceRadiusKm || "0"} km`} />
              <Info
                label="Delivery Pricing"
                value={
                  outlet.delivery
                    ? (outlet.deliveryKmPricing || [])
                      .map((row) => `${row.km} km = INR ${row.price}`)
                      .join(", ") || "No slabs added"
                    : "Delivery disabled"
                }
              />
            </div>
          </section>
        </>
      )}

      <ResultDialog open={!!error} title="Outlet error" message={error} tone="error" onPrimary={() => setError("")} />
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase text-[#0f766e]">{label}</p>
      <p className="mt-1 text-sm font-bold text-[#647876]">{value}</p>
    </div>
  );
}
