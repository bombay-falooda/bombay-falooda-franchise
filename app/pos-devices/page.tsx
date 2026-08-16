"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { MetricCard } from "@/components/metric-card";
import { PageTitle } from "@/components/page-title";
import { ResultDialog } from "@/components/result-dialog";
import { StatusBadge } from "@/components/status-badge";
import { apiRequest } from "@/lib/api";
import { loadPosData, type PosDevice } from "@/lib/pos-data";

export default function PosDevicesPage() {
  const [devices, setDevices] = useState<PosDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmStatus, setConfirmStatus] = useState<{ id: string; status: string } | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeCount = useMemo(
    () => devices.filter((device) => device.status === "ACTIVE").length,
    [devices],
  );
  const temporaryCount = useMemo(
    () => devices.filter((device) => device.type === "TEMPORARY").length,
    [devices],
  );
  const pendingCount = useMemo(
    () => devices.filter((device) => device.status === "PENDING").length,
    [devices],
  );

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await loadPosData();
      setDevices(data.devices);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load POS devices");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await apiRequest(`/franchise-portal/pos-devices/${id}/status`, {
        method: "PATCH",
        body: { status },
      });
      setMessage(`POS device marked ${status}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update POS status");
    }
  }

  return (
    <AppShell>
      <PageTitle title="POS Devices" description="Monitor POS devices, access keys and status.">
        <Link className="btn-primary" href="/pos-devices/request">
          Request POS
        </Link>
      </PageTitle>

      <section className="mb-4 grid gap-3 md:grid-cols-4">
        <MetricCard label="Devices" value={String(devices.length)} helper="Total linked POS" />
        <MetricCard label="Active" value={`${activeCount}/${devices.length}`} helper="Working devices" />
        <MetricCard label="Pending" value={String(pendingCount)} helper="Awaiting approval" />
        <MetricCard label="Temporary" value={String(temporaryCount)} helper="Event or short-term POS" />
      </section>

      {loading ? (
        <div className="bf-panel p-5 text-sm font-semibold text-[#647876]">Loading POS devices...</div>
      ) : devices.length === 0 ? (
        <div className="bf-panel p-5 text-sm font-semibold text-[#647876]">
          No POS devices connected yet.
        </div>
      ) : (
        <DataTable columns={["Device", "Outlet", "Type", "Status", "Access Key", "Last Login", "Validity", "Actions"]}>
          {devices.map((device) => (
            <tr key={device.id} className="hover:bg-[#f2fbf9]">
              <td className="px-5 py-4">
                <div className="font-bold text-[#10201f]">{device.name}</div>
                <div className="text-xs font-semibold text-[#647876]">
                  {device.eventName || device.handlerName || "Standard POS"}
                </div>
              </td>
              <td className="px-5 py-4 font-semibold text-[#647876]">
                {device.outlet ? `${device.outlet.name} (${device.outlet.code})` : "Not connected"}
              </td>
              <td className="px-5 py-4 font-semibold text-[#647876]">{device.type}</td>
              <td className="px-5 py-4">
                <StatusBadge value={device.status} />
              </td>
              <td className="px-5 py-4 font-mono text-xs font-semibold text-[#647876]">
                {device.accessKey}
              </td>
              <td className="px-5 py-4 text-xs font-semibold text-[#647876]">
                <div>{formatDateTime(device.lastLoginAt)}</div>
                <div className="mt-1 font-mono text-[11px] text-[#8ca09d]">
                  {device.lastLoginDeviceCode || "No device code"}
                </div>
              </td>
              <td className="px-5 py-4 text-xs font-semibold text-[#647876]">
                {device.type === "TEMPORARY"
                  ? `${formatDate(device.validFrom)} to ${formatDate(device.validUntil)}`
                  : "Permanent"}
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-wrap gap-2">
                  <button className="btn-secondary" type="button" onClick={() => setConfirmStatus({ id: device.id, status: "INACTIVE" })}>
                    Close
                  </button>
                  <button className="btn-secondary" type="button" onClick={() => setConfirmStatus({ id: device.id, status: "ACTIVE" })}>
                    Open
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <ResultDialog open={!!message} title="Success" message={message} onPrimary={() => setMessage("")} />
      <ResultDialog open={!!error} title="POS error" message={error} tone="error" onPrimary={() => setError("")} />
      <ResultDialog
        open={!!confirmStatus}
        title="Update POS status?"
        message={`This will mark the device ${confirmStatus?.status || ""}.`}
        tone="confirm"
        primaryLabel="Confirm"
        secondaryLabel="Cancel"
        onPrimary={() => {
          const next = confirmStatus;
          setConfirmStatus(null);
          if (next) {
            void updateStatus(next.id, next.status);
          }
        }}
        onSecondary={() => setConfirmStatus(null)}
      />
    </AppShell>
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return "--";
  }

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Never logged in";
  }

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
