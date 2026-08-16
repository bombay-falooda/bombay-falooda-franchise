"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { MetricCard } from "@/components/metric-card";
import { PageTitle } from "@/components/page-title";
import { ResultDialog } from "@/components/result-dialog";
import { StatusBadge } from "@/components/status-badge";
import { loadOutlets, type Outlet } from "@/lib/outlet-data";

export default function OutletsPage() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const activeCount = useMemo(
    () => outlets.filter((outlet) => outlet.status === "ACTIVE").length,
    [outlets],
  );
  const deliveryCount = useMemo(
    () => outlets.filter((outlet) => outlet.delivery).length,
    [outlets],
  );
  const onlineCount = useMemo(
    () => outlets.filter((outlet) => outlet.onlineOrderingEnabled).length,
    [outlets],
  );

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      setOutlets(await loadOutlets());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load outlets");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <PageTitle title="Outlets Directory" description="View outlets and operating settings." />

      <section className="mb-4 grid gap-3 md:grid-cols-4">
        <MetricCard label="Outlets" value={String(outlets.length)} helper="Assigned locations" />
        <MetricCard label="Active" value={String(activeCount)} helper="Operational outlets" />
        <MetricCard label="Delivery" value={String(deliveryCount)} helper="Delivery enabled" />
        <MetricCard label="Online" value={String(onlineCount)} helper="Website ordering" />
      </section>

      {loading ? (
        <div className="bf-panel p-5 text-sm font-semibold text-[#647876]">Loading outlets...</div>
      ) : outlets.length === 0 ? (
        <div className="bf-panel p-5 text-sm font-semibold text-[#647876]">No outlets assigned yet.</div>
      ) : (
        <DataTable columns={["Outlet", "Services", "Pricing", "Timing", "Menu", "Status", "Linked", "Actions"]}>
          {outlets.map((outlet) => (
            <tr key={outlet.id} className="hover:bg-[#f2fbf9]">
              <td className="px-5 py-4">
                <div className="font-bold text-[#10201f]">{outlet.name}</div>
                <div className="text-xs font-semibold text-[#647876]">
                  {outlet.code} | {outlet.address}
                </div>
              </td>
              <td className="px-5 py-4 text-xs font-semibold text-[#647876]">
                {[
                  outlet.dineIn ? "Dine in" : null,
                  outlet.takeaway ? "Takeaway" : null,
                  outlet.delivery ? "Delivery" : null,
                  outlet.onlineOrderingEnabled ? "Online" : null,
                ]
                  .filter(Boolean)
                  .join(", ") || "-"}
              </td>
              <td className="px-5 py-4 text-xs font-semibold text-[#647876]">
                Base INR {Number(outlet.outletBaseCharge || 0).toLocaleString("en-IN")}
                {outlet.delivery ? ` | ${outlet.deliveryKmPricing?.length || 0} delivery slabs` : ""}
              </td>
              <td className="px-5 py-4 font-semibold text-[#647876]">
                {outlet.openingTime || "--"} to {outlet.closingTime || "--"}
              </td>
              <td className="px-5 py-4">
                <StatusBadge value={outlet.menuSetupStatus} />
              </td>
              <td className="px-5 py-4">
                <StatusBadge value={outlet.status} />
              </td>
              <td className="px-5 py-4 font-semibold text-[#647876]">
                {outlet._count?.posDevices ?? 0} POS, {outlet._count?.users ?? 0} team
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-wrap gap-2">
                  <Link className="btn-secondary" href={`/outlets/${outlet.id}`}>
                    View
                  </Link>
                  <Link className="btn-secondary" href={`/outlets/${outlet.id}/edit`}>
                    Edit
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
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
