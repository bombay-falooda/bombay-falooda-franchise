"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { MetricCard } from "@/components/metric-card";
import { PageTitle } from "@/components/page-title";
import { ResultDialog } from "@/components/result-dialog";
import { StatusBadge } from "@/components/status-badge";
import { apiRequest } from "@/lib/api";

type PosDetailData = {
  device: {
    id: string;
    name: string;
    type: "PERMANENT" | "TEMPORARY";
    status: string;
    accessKey: string;
    deviceCode?: string | null;
    eventName?: string | null;
    eventLocation?: string | null;
    handlerName?: string | null;
    handlerPhone?: string | null;
    validFrom?: string | null;
    validUntil?: string | null;
    lastLoginAt?: string | null;
    lastLoginDeviceCode?: string | null;
    outlet?: {
      id: string;
      name: string;
      code: string;
      address?: string;
      phone?: string;
    } | null;
  };
  range: string;
  metrics: {
    totalSales: number;
    totalSalesFormatted: string;
    billCount: number;
    avgBillValue: number;
    avgBillValueFormatted: string;
    subtotal: number;
    taxAmount: number;
    discount: number;
  };
  paymentBreakdown: Array<{
    method: string;
    count: number;
    total: number;
    totalFormatted: string;
  }>;
  recentBills: Array<{
    id: string;
    billNumber: string;
    customerName: string;
    customerPhone: string;
    total: number;
    totalFormatted: string;
    orderType: string;
    orderSource: string;
    paymentMethod: string;
    itemsCount: number;
    itemsSummary: string;
    finalizedAt: string;
  }>;
};

export default function PosDeviceDetailPage() {
  const params = useParams<{ id: string }>();
  const posId = params.id;
  const [data, setData] = useState<PosDetailData | null>(null);
  const [range, setRange] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void loadData(range);
  }, [posId, range]);

  async function loadData(selectedRange: string) {
    setLoading(true);
    try {
      const res = await apiRequest<PosDetailData>(
        `/franchise-portal/pos-devices/${posId}?range=${selectedRange}`,
      );
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load POS details");
    } finally {
      setLoading(false);
    }
  }

  async function togglePosStatus() {
    if (!data?.device) return;
    setUpdating(true);
    try {
      const nextStatus = data.device.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await apiRequest(`/franchise-portal/pos-devices/${data.device.id}/status`, {
        method: "PATCH",
        body: { status: nextStatus },
      });
      setMessage(`POS status updated to ${nextStatus}`);
      await loadData(range);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <AppShell>
      <PageTitle
        title={data?.device ? `${data.device.name} — Unified POS Insights` : "POS Device Sales & Details"}
        description="Unified POS-wise sales performance, transaction history, and payment breakdowns."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Link className="btn-secondary text-xs" href="/pos-devices">
            ← Back to POS Devices
          </Link>
          {data?.device && (
            <button
              type="button"
              onClick={togglePosStatus}
              disabled={updating}
              className={`btn-secondary text-xs font-bold ${
                data.device.status === "ACTIVE"
                  ? "border-red-200 text-red-600 hover:bg-red-50"
                  : "border-green-200 text-green-700 hover:bg-green-50"
              }`}
            >
              {updating
                ? "Updating..."
                : data.device.status === "ACTIVE"
                ? "Disable POS Device"
                : "Enable POS Device"}
            </button>
          )}
        </div>
      </PageTitle>

      {loading && !data ? (
        <div className="bf-panel p-6 text-xs font-semibold text-[#647876]">
          Loading POS device analytics & sales details...
        </div>
      ) : !data ? (
        <div className="bf-panel p-6 text-xs font-semibold text-[#647876]">
          POS Device details not found.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Hero Device Info Banner */}
          <div className="bf-panel p-5 bg-gradient-to-r from-white via-[#fcfdfe] to-[#f2faf7]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge value={data.device.status} />
                  <span className="rounded-md bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-[#7c3fe0] border border-purple-200">
                    {data.device.type} POS
                  </span>
                  <span className="font-mono text-xs font-bold text-[#0f766e] bg-[#e9fbf7] px-2.5 py-0.5 rounded-md border border-[#d8e8e5]">
                    Key: {data.device.accessKey}
                  </span>
                </div>

                <h2 className="font-display text-2xl font-bold text-[#10201f]">
                  {data.device.name}
                </h2>

                <p className="text-xs font-semibold text-[#647876]">
                  Connected Outlet:{" "}
                  <span className="font-bold text-[#10201f]">
                    {data.device.outlet
                      ? `${data.device.outlet.name} (${data.device.outlet.code})`
                      : "Unassigned"}
                  </span>
                </p>

                {data.device.type === "TEMPORARY" && (
                  <p className="text-xs font-medium text-[#7c3fe0]">
                    Event: {data.device.eventName || "Short-term deployment"} | Handler:{" "}
                    {data.device.handlerName || "N/A"} ({data.device.handlerPhone || "No contact"})
                  </p>
                )}
              </div>

              {/* Login Timestamp & Code */}
              <div className="text-right border-t md:border-t-0 md:border-l pt-3 md:pt-0 md:pl-5 border-[#d8e8e5]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#647876] block">
                  Last Terminal Session
                </span>
                <span className="text-xs font-bold text-[#10201f] block">
                  {formatDateTime(data.device.lastLoginAt)}
                </span>
                <span className="text-[11px] font-mono text-[#647876] block mt-0.5">
                  Device Code: {data.device.lastLoginDeviceCode || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Time Range Filter Bar */}
          <div className="flex items-center justify-between border-b border-[#d8e8e5] pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#10201f]">
              Unified Sales Analytics
            </h3>
            <div className="flex gap-1 bg-[#f0f4f4] p-1 rounded-lg">
              {["all", "today", "week", "month"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={`px-3 py-1 text-xs font-bold rounded-md capitalize transition ${
                    range === r
                      ? "bg-white text-[#0f766e] shadow-xs"
                      : "text-[#647876] hover:text-[#10201f]"
                  }`}
                >
                  {r === "all" ? "All Time" : r}
                </button>
              ))}
            </div>
          </div>

          {/* Sales Metrics Strip */}
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <MetricCard
              label="Total Gross Sales"
              value={data.metrics.totalSalesFormatted}
              helper="Total revenue from this POS"
            />
            <MetricCard
              label="Finalized Bills"
              value={String(data.metrics.billCount)}
              helper="Completed billing orders"
            />
            <MetricCard
              label="Average Order Value"
              value={data.metrics.avgBillValueFormatted}
              helper="Per-bill average"
            />
            <MetricCard
              label="Taxes & Discounts"
              value={`Tax: ₹${data.metrics.taxAmount.toLocaleString("en-IN")}`}
              helper={`Disc: ₹${data.metrics.discount.toLocaleString("en-IN")}`}
            />
          </div>

          {/* Payment Method Breakdown Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#10201f]">
              Payment Collection Breakdown
            </h3>
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
              {data.paymentBreakdown.map((pm) => (
                <div key={pm.method} className="bf-panel p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#647876]">
                      {pm.method} Sales
                    </span>
                    <span className="text-[10px] font-bold bg-[#e9fbf7] text-[#0f766e] px-2 py-0.5 rounded-full">
                      {pm.count} bills
                    </span>
                  </div>
                  <div className="font-mono text-xl font-bold text-[#0f766e]">
                    {pm.totalFormatted}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Bills Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#10201f]">
                Recent POS Transactions ({data.recentBills.length})
              </h3>
            </div>

            {data.recentBills.length === 0 ? (
              <div className="bf-panel p-8 text-center text-xs font-semibold text-[#647876]">
                No completed bills recorded on this POS device for the selected range.
              </div>
            ) : (
              <DataTable
                columns={[
                  "Bill Number",
                  "Date & Time",
                  "Customer",
                  "Order Type",
                  "Payment",
                  "Items",
                  "Amount",
                ]}
              >
                {data.recentBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-[#f2fbf9]">
                    <td className="px-5 py-4 font-mono font-bold text-[#10201f]">
                      {bill.billNumber}
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-[#647876]">
                      {formatDateTime(bill.finalizedAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-[#10201f] text-xs">
                        {bill.customerName}
                      </div>
                      <div className="text-[11px] font-mono text-[#647876]">
                        {bill.customerPhone}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-[#0f766e] border border-teal-200">
                        {bill.orderType}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-[#7c3fe0] border border-purple-200">
                        {bill.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-[#647876] max-w-xs truncate">
                      {bill.itemsSummary || `${bill.itemsCount} items`}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-[#0f766e]">
                      {bill.totalFormatted}
                    </td>
                  </tr>
                ))}
              </DataTable>
            )}
          </div>
        </div>
      )}

      <ResultDialog
        open={!!message}
        title="Success"
        message={message}
        onPrimary={() => setMessage("")}
      />
      <ResultDialog
        open={!!error}
        title="POS Error"
        message={error}
        tone="error"
        onPrimary={() => setError("")}
      />
    </AppShell>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
