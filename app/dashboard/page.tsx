"use client";

import { useEffect, useMemo, useState } from "react";

import { AnalyticsChart } from "@/components/analytics-chart";
import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { PageTitle } from "@/components/page-title";
import { apiRequest } from "@/lib/api";
import { loadOutlets, type Outlet } from "@/lib/outlet-data";
import { loadPosData, type PosDevice } from "@/lib/pos-data";

type DashboardData = {
  outletCount: number;
  activeOutletCount: number;
  posCount: number;
  activePosCount: number;
  todayOrders: number;
  todaySales: string;
  pendingAlerts: number;
};

type ReportData = {
  grossSales: string;
  orderCount: number;
  finalizedBills: number;
  averageOrderValue: string;
  chartSeries: Array<{ label: string; sales: number; bills: number }>;
  outletPerformance: Array<{ outletId: string; outlet?: { name: string; code: string } | null; _sum: { total: string | null }; _count: number }>;
  posPerformance: Array<{ posDeviceId: string; posDevice?: { name: string; outlet?: { name: string } } | null; _sum: { total: string | null }; _count: number }>;
};

type Alert = {
  id: string;
  title: string;
  message: string;
};

const ranges = [
  { label: "Last hour", value: "hour" },
  { label: "4 hours", value: "4hours" },
  { label: "Today", value: "day" },
  { label: "Last week", value: "week" },
  { label: "Last month", value: "month" },
];

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardData>({
    outletCount: 0,
    activeOutletCount: 0,
    posCount: 0,
    activePosCount: 0,
    todayOrders: 0,
    todaySales: "INR 0",
    pendingAlerts: 0,
  });
  const [report, setReport] = useState<ReportData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [devices, setDevices] = useState<PosDevice[]>([]);
  const [range, setRange] = useState("day");
  const [outletId, setOutletId] = useState("");
  const [posDeviceId, setPosDeviceId] = useState("");

  const filteredDevices = useMemo(
    () => devices.filter((device) => !outletId || device.outlet?.id === outletId),
    [devices, outletId],
  );

  useEffect(() => {
    apiRequest<DashboardData>("/franchise-portal/dashboard")
      .then(setSummary)
      .catch(() => undefined);
    apiRequest<Alert[]>("/franchise-portal/alerts")
      .then(setAlerts)
      .catch(() => undefined);
    void Promise.all([loadOutlets(), loadPosData()])
      .then(([outletData, posData]) => {
        setOutlets(outletData);
        setDevices(posData.devices);
      })
      .catch(() => undefined);
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
      .then(setReport)
      .catch(() => undefined);
  }, [range, outletId, posDeviceId]);

  useEffect(() => {
    if (posDeviceId && !filteredDevices.some((device) => device.id === posDeviceId)) {
      setPosDeviceId("");
    }
  }, [filteredDevices, posDeviceId]);

  const overview = [
    { label: "Gross Sales", value: report?.grossSales || "INR 0", helper: "Selected filter" },
    { label: "Orders", value: String(report?.orderCount || 0), helper: "Website + POS" },
    { label: "Avg Order", value: report?.averageOrderValue || "INR 0", helper: "Finalized bills" },
    { label: "POS Online", value: `${summary.activePosCount}/${summary.posCount}`, helper: "Live devices" },
  ];

  return (
    <AppShell>
      <PageTitle
        title="Franchise Dashboard"
        description="Real outlet performance, billing movement and operating alerts."
      />

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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overview.map((item) => (
          <MetricCard key={item.label} {...item} />
        ))}
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="bf-panel p-5">
          <h2 className="font-display text-xl font-bold text-[#10201f]">Sales Trend</h2>
          <p className="mt-1 text-sm font-semibold text-[#647876]">
            Finalized bill totals based on selected range, outlet and POS.
          </p>
          <div className="mt-4">
            <AnalyticsChart data={report?.chartSeries || []} />
          </div>
        </div>

        <div className="bf-panel p-5">
          <h2 className="font-display text-xl font-bold text-[#10201f]">Today Focus</h2>
          <div className="mt-4 space-y-3">
            {(alerts.length
              ? alerts.slice(0, 4)
              : [{ id: "ok", title: "No critical alerts", message: "All connected checks look stable." }]
            ).map((item) => (
              <div key={item.id} className="rounded-[16px] border border-[#d8e8e5] bg-white/68 px-4 py-3 text-sm font-bold text-[#244442]">
                <div>{item.title}</div>
                <div className="mt-1 text-xs font-semibold text-[#647876]">{item.message}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3">
            <Mini label="Active outlets" value={`${summary.activeOutletCount}/${summary.outletCount}`} />
            <Mini label="Today sales" value={summary.todaySales} />
            <Mini label="Pending alerts" value={String(summary.pendingAlerts)} />
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-2">
        <PerformancePanel
          title="Top Outlets"
          rows={(report?.outletPerformance || []).map((row) => ({
            id: row.outletId,
            name: row.outlet ? `${row.outlet.name} (${row.outlet.code})` : row.outletId,
            meta: `${row._count} bills`,
            value: `INR ${Number(row._sum.total || 0).toLocaleString("en-IN")}`,
          }))}
        />
        <PerformancePanel
          title="Top POS"
          rows={(report?.posPerformance || []).map((row) => ({
            id: row.posDeviceId,
            name: row.posDevice ? `${row.posDevice.name} - ${row.posDevice.outlet?.name || ""}` : row.posDeviceId,
            meta: `${row._count} bills`,
            value: `INR ${Number(row._sum.total || 0).toLocaleString("en-IN")}`,
          }))}
        />
      </section>
    </AppShell>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-[#e9fbf7] px-4 py-3">
      <div className="text-xs font-black uppercase text-[#0f766e]">{label}</div>
      <div className="mt-1 font-display text-lg font-bold text-[#10201f]">{value}</div>
    </div>
  );
}

function PerformancePanel({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ id: string; name: string; meta: string; value: string }>;
}) {
  return (
    <div className="bf-panel p-5">
      <h2 className="font-display text-xl font-bold text-[#10201f]">{title}</h2>
      <div className="mt-4 grid gap-3">
        {rows.length ? (
          rows.slice(0, 5).map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-3 rounded-[16px] border border-[#d8e8e5] bg-white/68 px-4 py-3">
              <div>
                <div className="text-sm font-bold text-[#10201f]">{row.name}</div>
                <div className="text-xs font-semibold text-[#647876]">{row.meta}</div>
              </div>
              <div className="text-sm font-black text-[#0f766e]">{row.value}</div>
            </div>
          ))
        ) : (
          <div className="text-sm font-semibold text-[#647876]">No finalized bills for this filter yet.</div>
        )}
      </div>
    </div>
  );
}
