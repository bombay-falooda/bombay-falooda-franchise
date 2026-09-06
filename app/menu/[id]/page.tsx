"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { MetricCard } from "@/components/metric-card";
import { PageTitle } from "@/components/page-title";
import { ResultDialog } from "@/components/result-dialog";
import { StatusBadge } from "@/components/status-badge";
import { apiRequest } from "@/lib/api";
import {
  findMenuItem,
  loadMenuData,
  type MenuItem,
  type Outlet,
} from "@/lib/menu-data";

export default function MenuItemDetailPage() {
  const params = useParams<{ id: string }>();
  const itemId = params.id;
  const [item, setItem] = useState<MenuItem | null>(null);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [activeTab, setActiveTab] = useState<"addons" | "outlets">("addons");
  const [addonFormMode, setAddonFormMode] = useState<"group" | "option">("group");

  // Forms state
  const [availability, setAvailability] = useState({
    outletId: "",
    price: "",
    isActive: true,
  });
  const [addonGroup, setAddonGroup] = useState({
    name: "",
    minSelect: 0,
    maxSelect: 1,
    isRequired: false,
  });
  const [addon, setAddon] = useState({ groupId: "", name: "", price: "" });

  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const addonGroups = item?.addonGroups || [];
  const addonCount = useMemo(
    () => addonGroups.reduce((sum, group) => sum + group.addons.length, 0),
    [addonGroups],
  );

  useEffect(() => {
    void load();
  }, [itemId]);

  async function load() {
    setLoading(true);
    try {
      const data = await loadMenuData();
      setOutlets(data.outlets);
      const selected = findMenuItem(data.items, itemId);
      setItem(selected);
      setAvailability((current) => ({
        ...current,
        outletId: current.outletId || data.outlets[0]?.id || "",
      }));
      setAddon((current) => ({
        ...current,
        groupId: current.groupId || selected?.addonGroups?.[0]?.id || "",
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load item details");
    } finally {
      setLoading(false);
    }
  }

  async function toggleItemStatus() {
    if (!item) return;
    setUpdatingStatus(true);
    try {
      const nextStatus = !item.isActive;
      await apiRequest(`/franchise-portal/menu/items/${item.id}`, {
        method: "PATCH",
        body: { isActive: nextStatus },
      });
      setItem((prev) => (prev ? { ...prev, isActive: nextStatus } : null));
      setMessage(`Item marked as ${nextStatus ? "Active" : "Inactive"}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function saveAvailability(event: FormEvent) {
    event.preventDefault();
    try {
      await apiRequest("/franchise-portal/menu/outlet-items", {
        method: "POST",
        body: {
          outletId: availability.outletId,
          itemId,
          price: availability.price ? Number(availability.price) : undefined,
          isActive: availability.isActive,
        },
      });
      setAvailability((current) => ({ ...current, price: "" }));
      setMessage("Outlet availability and price updated!");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update outlet menu");
    }
  }

  async function saveAddonGroup(event: FormEvent) {
    event.preventDefault();
    try {
      await apiRequest("/franchise-portal/menu/addon-groups", {
        method: "POST",
        body: {
          itemId,
          name: addonGroup.name,
          minSelect: Number(addonGroup.minSelect || 0),
          maxSelect: Number(addonGroup.maxSelect || 1),
          isRequired: addonGroup.isRequired,
        },
      });
      setAddonGroup({ name: "", minSelect: 0, maxSelect: 1, isRequired: false });
      setMessage("Add-on group created!");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save add-on group");
    }
  }

  async function saveAddon(event: FormEvent) {
    event.preventDefault();
    try {
      await apiRequest("/franchise-portal/menu/addons", {
        method: "POST",
        body: {
          groupId: addon.groupId,
          name: addon.name,
          price: Number(addon.price || 0),
        },
      });
      setAddon({ groupId: addon.groupId, name: "", price: "" });
      setMessage("Add-on option created!");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save add-on");
    }
  }

  return (
    <AppShell>
      <PageTitle
        title={item?.name || "Menu Item"}
        description="View item details, add-on customizations, and outlet pricing."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Link className="btn-secondary text-xs" href="/menu">
            ← Back to Directory
          </Link>
          {item && (
            <>
              <button
                type="button"
                onClick={toggleItemStatus}
                disabled={updatingStatus}
                className={`btn-secondary text-xs font-bold ${
                  item.isActive
                    ? "border-red-200 text-red-600 hover:bg-red-50"
                    : "border-green-200 text-green-700 hover:bg-green-50"
                }`}
              >
                {updatingStatus ? "Updating..." : item.isActive ? "Deactivate Item" : "Activate Item"}
              </button>
              <Link className="btn-primary text-xs" href={`/menu/${item.id}/edit`}>
                Edit Details
              </Link>
            </>
          )}
        </div>
      </PageTitle>

      {loading ? (
        <div className="bf-panel p-6 text-sm font-semibold text-[#647876]">
          Loading item details...
        </div>
      ) : !item ? (
        <div className="bf-panel p-6 text-sm font-semibold text-[#647876]">
          Menu item not found.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Item Card */}
          <div className="bf-panel p-5 bg-gradient-to-r from-white via-[#fcfdfe] to-[#f2faf7]">
            <div className="flex flex-col md:flex-row md:items-center gap-5">
              <div className="h-28 w-28 rounded-2xl overflow-hidden bg-[#e9fbf7] border border-[#d8e8e5] shrink-0 flex items-center justify-center shadow-xs">
                {item.imageUrl ? (
                  <Image
                    className="h-full w-full object-cover"
                    src={item.imageUrl}
                    alt={item.name}
                    width={112}
                    height={112}
                    unoptimized
                  />
                ) : (
                  <span className="text-xs font-bold text-[#0f766e]">No Photo</span>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge value={item.isActive} />
                  <span className="rounded-md bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-[#7c3fe0] border border-purple-200">
                    {item.category?.name || "Falooda"}
                  </span>
                  {item.subCategory && (
                    <span className="rounded-md bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-[#0f766e] border border-teal-200">
                      {item.subCategory}
                    </span>
                  )}
                </div>

                <h2 className="font-display text-2xl font-bold text-[#10201f]">{item.name}</h2>

                <p className="text-xs font-medium text-[#647876] max-w-2xl leading-relaxed">
                  {item.description || "No description provided for this menu item."}
                </p>
              </div>

              <div className="flex flex-row md:flex-col justify-between md:justify-center items-end border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 border-[#d8e8e5] min-w-[140px]">
                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#647876] block">
                    Base Price
                  </span>
                  <span className="font-mono text-2xl font-bold text-[#0f766e]">
                    ₹ {Number(item.basePrice).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <MetricCard
              label="Category"
              value={item.category?.name || "Falooda"}
              helper={item.subCategory || "No Subcategory"}
            />
            <MetricCard
              label="Status"
              value={item.isActive ? "Active" : "Inactive"}
              helper="Available in catalog"
            />
            <MetricCard
              label="Add-on Groups"
              value={String(addonGroups.length)}
              helper={`${addonCount} total options`}
            />
            <MetricCard
              label="Outlet Listing"
              value={String(item.outletMenuItems?.length || 0)}
              helper="Outlets selling this item"
            />
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[#d8e8e5] gap-6">
            <button
              type="button"
              onClick={() => setActiveTab("addons")}
              className={`pb-3 text-xs uppercase font-bold tracking-wider transition ${
                activeTab === "addons"
                  ? "text-[#0f766e] border-b-2 border-[#0f766e]"
                  : "text-[#647876] hover:text-[#10201f]"
              }`}
            >
              Add-ons & Options ({addonGroups.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("outlets")}
              className={`pb-3 text-xs uppercase font-bold tracking-wider transition ${
                activeTab === "outlets"
                  ? "text-[#0f766e] border-b-2 border-[#0f766e]"
                  : "text-[#647876] hover:text-[#10201f]"
              }`}
            >
              Outlet Availability & Pricing ({item.outletMenuItems?.length || 0})
            </button>
          </div>

          {/* TAB 1: ADD-ONS */}
          {activeTab === "addons" && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Add-on Display List */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#10201f]">
                  Configured Add-on Groups
                </h3>

                {addonGroups.length === 0 ? (
                  <div className="bf-panel p-8 text-center text-xs font-semibold text-[#647876]">
                    No add-on groups added to this item yet. Use the builder on the right to create options like Extra Toppings or Portion Sizes.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addonGroups.map((group) => (
                      <div key={group.id} className="bf-panel p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-[#10201f] text-sm">{group.name}</h4>
                            <p className="text-[11px] font-semibold text-[#647876]">
                              Min: {group.minSelect} | Max: {group.maxSelect} |{" "}
                              {group.isRequired ? "Required selection" : "Optional selection"}
                            </p>
                          </div>
                          <StatusBadge value={group.isActive} />
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#d8e8e5]/60">
                          {group.addons.map((option) => (
                            <span
                              key={option.id}
                              className="rounded-lg bg-[#e9fbf7] px-3 py-1.5 text-xs font-semibold text-[#0f766e] border border-[#d8e8e5]"
                            >
                              {option.name} — <span className="font-mono font-bold">₹{Number(option.price).toLocaleString("en-IN")}</span>
                            </span>
                          ))}
                          {group.addons.length === 0 && (
                            <span className="text-xs font-semibold text-[#647876] italic">
                              No options created inside this group.
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add-on Creation Box */}
              <div className="space-y-4">
                <div className="bf-panel p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#d8e8e5] pb-3">
                    <h4 className="font-bold text-[#10201f] text-xs uppercase tracking-wider">
                      Add Customization
                    </h4>
                    <div className="flex gap-1 bg-[#f0f4f4] p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setAddonFormMode("group")}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                          addonFormMode === "group"
                            ? "bg-white text-[#0f766e] shadow-xs"
                            : "text-[#647876] hover:text-[#10201f]"
                        }`}
                      >
                        + New Group
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddonFormMode("option")}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                          addonFormMode === "option"
                            ? "bg-white text-[#0f766e] shadow-xs"
                            : "text-[#647876] hover:text-[#10201f]"
                        }`}
                      >
                        + New Option
                      </button>
                    </div>
                  </div>

                  {addonFormMode === "group" ? (
                    <form className="space-y-3" onSubmit={saveAddonGroup}>
                      <div>
                        <label className="block text-xs font-bold uppercase text-[#0f766e] mb-1">
                          Group Title *
                        </label>
                        <input
                          className="form-input text-xs"
                          placeholder="e.g. Extra Toppings"
                          value={addonGroup.name}
                          onChange={(e) => setAddonGroup({ ...addonGroup, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold uppercase text-[#647876] mb-1">
                            Min Select
                          </label>
                          <input
                            className="form-input text-xs"
                            type="number"
                            value={addonGroup.minSelect}
                            onChange={(e) => setAddonGroup({ ...addonGroup, minSelect: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase text-[#647876] mb-1">
                            Max Select
                          </label>
                          <input
                            className="form-input text-xs"
                            type="number"
                            value={addonGroup.maxSelect}
                            onChange={(e) => setAddonGroup({ ...addonGroup, maxSelect: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                      <button className="btn-primary w-full text-xs font-bold mt-2" type="submit">
                        Create Add-on Group
                      </button>
                    </form>
                  ) : (
                    <form className="space-y-3" onSubmit={saveAddon}>
                      {addonGroups.length === 0 ? (
                        <p className="text-xs font-semibold text-[#647876]">
                          Please create an add-on group first before adding options.
                        </p>
                      ) : (
                        <>
                          <div>
                            <label className="block text-xs font-bold uppercase text-[#0f766e] mb-1">
                              Select Add-on Group *
                            </label>
                            <select
                              className="form-input text-xs"
                              value={addon.groupId}
                              onChange={(e) => setAddon({ ...addon, groupId: e.target.value })}
                              required
                            >
                              {addonGroups.map((g) => (
                                <option key={g.id} value={g.id}>
                                  {g.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase text-[#0f766e] mb-1">
                              Option Name *
                            </label>
                            <input
                              className="form-input text-xs"
                              placeholder="e.g. Extra Rabdi"
                              value={addon.name}
                              onChange={(e) => setAddon({ ...addon, name: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase text-[#0f766e] mb-1">
                              Extra Price (₹) *
                            </label>
                            <input
                              className="form-input text-xs font-mono"
                              type="number"
                              placeholder="30"
                              value={addon.price}
                              onChange={(e) => setAddon({ ...addon, price: e.target.value })}
                              required
                            />
                          </div>
                          <button className="btn-primary w-full text-xs font-bold mt-2" type="submit">
                            Add Option to Group
                          </button>
                        </>
                      )}
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OUTLETS */}
          {activeTab === "outlets" && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Outlet List Table */}
              <div className="lg:col-span-2 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#10201f]">
                  Outlet Pricing & Availability Status
                </h3>

                {item.outletMenuItems?.length ? (
                  <DataTable columns={["Outlet Location", "Selling Price", "Status"]}>
                    {item.outletMenuItems.map((row) => (
                      <tr key={row.id} className="hover:bg-[#f2fbf9]">
                        <td className="px-5 py-4 font-bold text-[#10201f]">
                          {row.outlet.name} ({row.outlet.code})
                        </td>
                        <td className="px-5 py-4 font-mono font-bold text-[#0f766e]">
                          ₹ {Number(row.price).toLocaleString("en-IN")}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge value={row.isActive} />
                        </td>
                      </tr>
                    ))}
                  </DataTable>
                ) : (
                  <div className="bf-panel p-8 text-center text-xs font-semibold text-[#647876]">
                    Item is not currently assigned to any outlet. Use the form on the right to set outlet availability.
                  </div>
                )}
              </div>

              {/* Configure Outlet Price Form */}
              <div>
                <form className="bf-panel p-4 space-y-3" onSubmit={saveAvailability}>
                  <h4 className="font-bold text-[#10201f] text-xs uppercase tracking-wider border-b border-[#d8e8e5] pb-2">
                    Configure Outlet Price
                  </h4>

                  <div>
                    <label className="block text-xs font-bold uppercase text-[#0f766e] mb-1">
                      Outlet *
                    </label>
                    <select
                      className="form-input text-xs"
                      value={availability.outletId}
                      onChange={(e) => setAvailability({ ...availability, outletId: e.target.value })}
                      required
                    >
                      {outlets.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name} ({o.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-[#0f766e] mb-1">
                      Outlet Selling Price (₹)
                    </label>
                    <input
                      className="form-input text-xs font-mono"
                      type="number"
                      placeholder={`Default Base: ₹${item.basePrice}`}
                      value={availability.price}
                      onChange={(e) => setAvailability({ ...availability, price: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-[#0f766e] mb-1">
                      Availability Status
                    </label>
                    <select
                      className="form-input text-xs"
                      value={String(availability.isActive)}
                      onChange={(e) => setAvailability({ ...availability, isActive: e.target.value === "true" })}
                    >
                      <option value="true">Available for Outlet</option>
                      <option value="false">Disabled / Unavailable</option>
                    </select>
                  </div>

                  <button className="btn-primary w-full text-xs font-bold mt-2" type="submit">
                    Save Outlet Pricing
                  </button>
                </form>
              </div>
            </div>
          )}
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
        title="Menu Error"
        message={error}
        tone="error"
        onPrimary={() => setError("")}
      />
    </AppShell>
  );
}
