"use client";

import { FormEvent, useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { PageTitle } from "@/components/page-title";
import { ResultDialog } from "@/components/result-dialog";
import { StatusBadge } from "@/components/status-badge";
import { apiRequest } from "@/lib/api";

type Outlet = { id: string; name: string; code: string };
type PosDevice = { id: string; name: string; status: string; outlet?: Outlet | null };
type Route = {
  id: string;
  source: string;
  isActive: boolean;
  outlet: Outlet;
  posDevice: PosDevice;
};

const sources = ["WEBSITE", "POS", "ZOMATO", "SWIGGY", "EZCATER", "OTHER"];

export default function OrderRoutingPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [devices, setDevices] = useState<PosDevice[]>([]);
  const [form, setForm] = useState({ outletId: "", source: "WEBSITE", posDeviceId: "", isActive: true });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [routeData, outletData, deviceData] = await Promise.all([
        apiRequest<Route[]>("/franchise-portal/order-routes"),
        apiRequest<Outlet[]>("/franchise-portal/outlets"),
        apiRequest<PosDevice[]>("/franchise-portal/pos-devices"),
      ]);
      setRoutes(routeData);
      setOutlets(outletData);
      setDevices(deviceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load order routing");
    } finally {
      setLoading(false);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    try {
      await apiRequest("/franchise-portal/order-routes", {
        method: "POST",
        body: form,
      });
      setMessage("Order route saved.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save order route");
    }
  }

  return (
    <AppShell>
      <PageTitle title="Order Routing" description="Route website, POS and aggregator orders to the correct outlet POS." />

      <form className="bf-panel mb-4 grid gap-3 p-4 lg:grid-cols-5" onSubmit={save}>
        <select className="form-input" value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })}>
          {sources.map((source) => <option key={source} value={source}>{source}</option>)}
        </select>
        <select className="form-input lg:col-span-2" value={form.outletId} onChange={(event) => setForm({ ...form, outletId: event.target.value })} required>
          <option value="">Select outlet</option>
          {outlets.map((outlet) => <option key={outlet.id} value={outlet.id}>{outlet.name} ({outlet.code})</option>)}
        </select>
        <select className="form-input" value={form.posDeviceId} onChange={(event) => setForm({ ...form, posDeviceId: event.target.value })} required>
          <option value="">Select POS</option>
          {devices
            .filter((device) => !form.outletId || device.outlet?.id === form.outletId)
            .map((device) => <option key={device.id} value={device.id}>{device.name}</option>)}
        </select>
        <button className="btn-primary" type="submit">Save Route</button>
      </form>

      {loading ? (
        <div className="bf-panel p-5 text-sm font-semibold text-[#647876]">Loading routes...</div>
      ) : routes.length === 0 ? (
        <div className="bf-panel p-5 text-sm font-semibold text-[#647876]">No order routes configured yet.</div>
      ) : (
        <DataTable columns={["Source", "Outlet", "POS Device", "POS Status", "Route Status"]}>
          {routes.map((route) => (
            <tr key={route.id} className="hover:bg-[#f2fbf9]">
              <td className="px-5 py-4 font-bold text-[#10201f]">{route.source}</td>
              <td className="px-5 py-4 font-semibold text-[#647876]">{route.outlet.name} ({route.outlet.code})</td>
              <td className="px-5 py-4 font-semibold text-[#647876]">{route.posDevice.name}</td>
              <td className="px-5 py-4"><StatusBadge value={route.posDevice.status} /></td>
              <td className="px-5 py-4"><StatusBadge value={route.isActive} /></td>
            </tr>
          ))}
        </DataTable>
      )}

      <ResultDialog open={!!message} title="Success" message={message} onPrimary={() => setMessage("")} />
      <ResultDialog open={!!error} title="Routing error" message={error} tone="error" onPrimary={() => setError("")} />
    </AppShell>
  );
}
