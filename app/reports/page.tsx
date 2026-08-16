"use client";

import { useEffect, useMemo, useState } from "react";

import { AnalyticsChart } from "@/components/analytics-chart";
import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { MetricCard } from "@/components/metric-card";
import { PageTitle } from "@/components/page-title";
import { ResultDialog } from "@/components/result-dialog";
import { apiRequest } from "@/lib/api";
import { loadOutlets, type Outlet } from "@/lib/outlet-data";
import { loadPosData, type PosDevice } from "@/lib/pos-data";

type ReportData = {
  range: string;
  outletId: string | null;
  posDeviceId: string | null;
  grossSales: string;
  grossSalesValue: number;
  orderCount: number;
  finalizedBills: number;
  averageOrderValue: string;
  averageOrderValueValue: number;
  chartSeries: Array<{ label: string; sales: number; bills: number }>;
  outletPerformance: Array<{ outletId: string; outlet?: { name: string; code: string } | null; _sum: { total: string | null }; _count: number }>;
  itemPerformance: Array<{ itemId: string; name: string; _sum: { quantity: number | null; total: string | null } }>;
  posPerformance: Array<{ posDeviceId: string; posDevice?: { name: string; outlet?: { name: string; code: string } } | null; _sum: { total: string | null }; _count: number }>;
};

const ranges = [
  { label: "Last hour", value: "hour" },
  { label: "4 hours", value: "4hours" },
  { label: "Today", value: "day" },
  { label: "Last week", value: "week" },
  { label: "Last month", value: "month" },
];

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [devices, setDevices] = useState<PosDevice[]>([]);
  const [range, setRange] = useState("day");
  const [outletId, setOutletId] = useState("");
  const [posDeviceId, setPosDeviceId] = useState("");
  const [error, setError] = useState("");

  const filteredDevices = useMemo(
    () =>
      devices.filter(
        (device) => !outletId || device.outlet?.id === outletId,
      ),
    [devices, outletId],
  );

  useEffect(() => {
    void Promise.all([loadOutlets(), loadPosData()])
      .then(([outletData, posData]) => {
        setOutlets(outletData);
        setDevices(posData.devices);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load filters"),
      );
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ range });
    if (outletId) {
      params.set("outletId", outletId);
    }
    if (posDeviceId) {
      params.set("posDeviceId", posDeviceId);
    }

    apiRequest<ReportData>(`/franchise-portal/reports?${params.toString()}`)
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load reports"),
      );
  }, [range, outletId, posDeviceId]);

  useEffect(() => {
    if (posDeviceId && !filteredDevices.some((device) => device.id === posDeviceId)) {
      setPosDeviceId("");
    }
  }, [filteredDevices, posDeviceId]);

  return (
    <AppShell>
      <PageTitle title="Reports" description="Sales, orders, outlet, item and POS performance from real billing data." />

      <section className="bf-panel mb-4 grid gap-3 p-4 xl:grid-cols-[1fr_auto_auto]">
        <div className="flex flex-wrap gap-2">
          {ranges.map((item) => (
            <button
              key={item.value}
              className={item.value === range ? "btn-primary" : "btn-secondary"}
              type="button"
              onClick={() => setRange(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <select className="form-input" value={outletId} onChange={(event) => setOutletId(event.target.value)}>
          <option value="">All outlets</option>
          {outlets.map((outlet) => (
            <option key={outlet.id} value={outlet.id}>
              {outlet.name} ({outlet.code})
            </option>
          ))}
        </select>
        <select className="form-input" value={posDeviceId} onChange={(event) => setPosDeviceId(event.target.value)}>
          <option value="">All POS</option>
          {filteredDevices.map((device) => (
            <option key={device.id} value={device.id}>
              {device.name}
            </option>
          ))}
        </select>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Gross Sales" value={data?.grossSales || "INR 0"} helper="Finalized bills" />
        <MetricCard label="Orders" value={String(data?.orderCount || 0)} helper="Website + POS order records" />
        <MetricCard label="Bills" value={String(data?.finalizedBills || 0)} helper="Completed bills" />
        <MetricCard label="Avg Order" value={data?.averageOrderValue || "INR 0"} helper="Net basket value" />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="bf-panel p-5">
          <h2 className="font-display text-xl font-bold text-[#10201f]">Sales Trend</h2>
          <p className="mt-1 text-sm font-semibold text-[#647876]">
            Real finalized bill totals for the selected filter.
          </p>
          <div className="mt-4">
            <AnalyticsChart data={data?.chartSeries || []} />
          </div>
        </div>

        <div className="bf-panel p-5">
          <h2 className="font-display text-xl font-bold text-[#10201f]">Filter Summary</h2>
          <div className="mt-4 grid gap-3">
            <Summary label="Range" value={ranges.find((item) => item.value === range)?.label || range} />
            <Summary label="Outlet" value={outlets.find((outlet) => outlet.id === outletId)?.name || "All outlets"} />
            <Summary label="POS" value={devices.find((device) => device.id === posDeviceId)?.name || "All POS"} />
            <Summary label="Chart points" value={String(data?.chartSeries.length || 0)} />
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <div>
          <h2 className="mb-3 font-display text-xl font-bold text-[#10201f]">Item Performance</h2>
          <DataTable columns={["Item", "Qty", "Sales"]}>
            {(data?.itemPerformance || []).map((item) => (
              <tr key={item.itemId} className="hover:bg-[#f2fbf9]">
                <td className="px-5 py-4 font-bold text-[#10201f]">{item.name}</td>
                <td className="px-5 py-4 font-semibold text-[#647876]">{item._sum.quantity || 0}</td>
                <td className="px-5 py-4 font-semibold text-[#647876]">INR {Number(item._sum.total || 0).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </DataTable>
        </div>

        <div>
          <h2 className="mb-3 font-display text-xl font-bold text-[#10201f]">Outlet Performance</h2>
          <DataTable columns={["Outlet", "Bills", "Sales"]}>
            {(data?.outletPerformance || []).map((outlet) => (
              <tr key={outlet.outletId} className="hover:bg-[#f2fbf9]">
                <td className="px-5 py-4 font-bold text-[#10201f]">{outlet.outlet ? `${outlet.outlet.name} (${outlet.outlet.code})` : outlet.outletId}</td>
                <td className="px-5 py-4 font-semibold text-[#647876]">{outlet._count}</td>
                <td className="px-5 py-4 font-semibold text-[#647876]">INR {Number(outlet._sum.total || 0).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </DataTable>
        </div>
      </section>

      <div className="mt-4">
        <h2 className="mb-3 font-display text-xl font-bold text-[#10201f]">POS-wise Billing</h2>
        <DataTable columns={["POS", "Bills", "Sales"]}>
          {(data?.posPerformance || []).map((pos) => (
            <tr key={pos.posDeviceId} className="hover:bg-[#f2fbf9]">
              <td className="px-5 py-4 font-bold text-[#10201f]">{pos.posDevice ? `${pos.posDevice.name} - ${pos.posDevice.outlet?.name || ""}` : pos.posDeviceId}</td>
              <td className="px-5 py-4 font-semibold text-[#647876]">{pos._count}</td>
              <td className="px-5 py-4 font-semibold text-[#647876]">INR {Number(pos._sum.total || 0).toLocaleString("en-IN")}</td>
            </tr>
          ))}
        </DataTable>
      </div>

      <ResultDialog open={!!error} title="Reports error" message={error} tone="error" onPrimary={() => setError("")} />
    </AppShell>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-[#d8e8e5] bg-white/68 px-4 py-3">
      <div className="text-xs font-black uppercase text-[#0f766e]">{label}</div>
      <div className="mt-1 text-sm font-bold text-[#244442]">{value}</div>
    </div>
  );
}
