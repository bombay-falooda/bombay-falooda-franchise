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
      setError(err instanceof Error ? err.message : "Could not load item");
    } finally {
      setLoading(false);
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
      setMessage("Outlet menu availability updated.");
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
      setMessage("Add-on group created.");
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
      setMessage("Add-on option created.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save add-on");
    }
  }

  return (
    <AppShell>
      <PageTitle
        title={item?.name || "Menu Item"}
        description="View item details, outlet availability and add-on configuration."
      >
        <div className="flex flex-wrap gap-2">
          <Link className="btn-secondary" href="/menu">
            Back
          </Link>
          {item ? (
            <Link className="btn-primary" href={`/menu/${item.id}/edit`}>
              Edit Item
            </Link>
          ) : null}
        </div>
      </PageTitle>

      {loading ? (
        <div className="bf-panel p-5 text-sm font-semibold text-[#647876]">Loading item...</div>
      ) : !item ? (
        <div className="bf-panel p-5 text-sm font-semibold text-[#647876]">
          Menu item not found.
        </div>
      ) : (
        <>
          <section className="mb-4 grid gap-3 md:grid-cols-4">
            <MetricCard label="Base Price" value={`INR ${Number(item.basePrice).toLocaleString("en-IN")}`} helper={item.category?.name || "Category"} />
            <MetricCard label="Outlet Links" value={String(item.outletMenuItems?.length || 0)} helper="Availability rows" />
            <MetricCard label="Add-on Groups" value={String(addonGroups.length)} helper="Customization groups" />
            <MetricCard label="Add-on Options" value={String(addonCount)} helper="Customer choices" />
          </section>

          <section className="mb-4 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="bf-panel p-4">
              <div className="flex gap-4">
                {item.imageUrl ? (
                  <Image
                    className="h-28 w-32 rounded-[18px] object-cover"
                    src={item.imageUrl}
                    alt={item.name}
                    width={160}
                    height={120}
                    unoptimized
                  />
                ) : (
                  <div className="flex h-28 w-32 items-center justify-center rounded-[18px] bg-[#e9fbf7] text-xs font-bold text-[#0f766e]">
                    No image
                  </div>
                )}
                <div>
                  <StatusBadge value={item.isActive} />
                  <h2 className="mt-3 font-display text-xl font-bold text-[#10201f]">
                    {item.name}
                  </h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#647876]">
                    {item.description || "No description added yet."}
                  </p>
                </div>
              </div>
            </div>

            <form className="bf-panel grid gap-3 p-4 md:grid-cols-4" onSubmit={saveAvailability}>
              <h2 className="font-display text-lg font-bold text-[#10201f] md:col-span-4">
                Outlet Availability
              </h2>
              <select
                className="form-input md:col-span-2"
                value={availability.outletId}
                onChange={(event) =>
                  setAvailability({ ...availability, outletId: event.target.value })
                }
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
                className="form-input"
                placeholder="Outlet price optional"
                type="number"
                value={availability.price}
                onChange={(event) =>
                  setAvailability({ ...availability, price: event.target.value })
                }
              />
              <select
                className="form-input"
                value={String(availability.isActive)}
                onChange={(event) =>
                  setAvailability({
                    ...availability,
                    isActive: event.target.value === "true",
                  })
                }
              >
                <option value="true">Available</option>
                <option value="false">Unavailable</option>
              </select>
              <button className="btn-primary md:col-span-4" type="submit">
                Save Availability
              </button>
            </form>
          </section>

          <section className="mb-4 grid gap-4 xl:grid-cols-2">
            <form className="bf-panel grid gap-3 p-4 md:grid-cols-4" onSubmit={saveAddonGroup}>
              <h2 className="font-display text-lg font-bold text-[#10201f] md:col-span-4">
                Add-on Group
              </h2>
              <input
                className="form-input md:col-span-2"
                placeholder="Group name e.g. Size, Toppings"
                value={addonGroup.name}
                onChange={(event) =>
                  setAddonGroup({ ...addonGroup, name: event.target.value })
                }
                required
              />
              <input
                className="form-input"
                type="number"
                placeholder="Min"
                value={addonGroup.minSelect}
                onChange={(event) =>
                  setAddonGroup({
                    ...addonGroup,
                    minSelect: Number(event.target.value),
                  })
                }
              />
              <input
                className="form-input"
                type="number"
                placeholder="Max"
                value={addonGroup.maxSelect}
                onChange={(event) =>
                  setAddonGroup({
                    ...addonGroup,
                    maxSelect: Number(event.target.value),
                  })
                }
              />
              <label className="flex h-11 items-center gap-2 rounded-[12px] border border-[#d8e8e5] bg-white/70 px-3 text-sm font-bold text-[#244442]">
                <input
                  type="checkbox"
                  checked={addonGroup.isRequired}
                  onChange={(event) =>
                    setAddonGroup({
                      ...addonGroup,
                      isRequired: event.target.checked,
                    })
                  }
                />
                Required
              </label>
              <button className="btn-primary md:col-span-3" type="submit">
                Add Group
              </button>
            </form>

            <form className="bf-panel grid gap-3 p-4 md:grid-cols-4" onSubmit={saveAddon}>
              <h2 className="font-display text-lg font-bold text-[#10201f] md:col-span-4">
                Add-on Option
              </h2>
              <select
                className="form-input md:col-span-2"
                value={addon.groupId}
                onChange={(event) => setAddon({ ...addon, groupId: event.target.value })}
                required
              >
                <option value="">Select group</option>
                {addonGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <input
                className="form-input"
                placeholder="Option name"
                value={addon.name}
                onChange={(event) => setAddon({ ...addon, name: event.target.value })}
                required
              />
              <input
                className="form-input"
                type="number"
                placeholder="Price"
                value={addon.price}
                onChange={(event) => setAddon({ ...addon, price: event.target.value })}
                required
              />
              <button className="btn-primary md:col-span-4" type="submit">
                Add Option
              </button>
            </form>
          </section>

          <section className="mb-4 grid gap-4 xl:grid-cols-2">
            <div>
              <h2 className="mb-3 font-display text-lg font-bold text-[#10201f]">
                Outlet Availability
              </h2>
              {item.outletMenuItems?.length ? (
                <DataTable columns={["Outlet", "Price", "Status"]}>
                  {item.outletMenuItems.map((row) => (
                    <tr key={row.id} className="hover:bg-[#f2fbf9]">
                      <td className="px-5 py-4 font-semibold text-[#647876]">
                        {row.outlet.name} ({row.outlet.code})
                      </td>
                      <td className="px-5 py-4 font-semibold text-[#647876]">
                        INR {Number(row.price).toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge value={row.isActive} />
                      </td>
                    </tr>
                  ))}
                </DataTable>
              ) : (
                <div className="bf-panel p-5 text-sm font-semibold text-[#647876]">
                  Not assigned to any outlet yet.
                </div>
              )}
            </div>

            <div>
              <h2 className="mb-3 font-display text-lg font-bold text-[#10201f]">
                Add-on Groups
              </h2>
              <div className="grid gap-3">
                {addonGroups.map((group) => (
                  <div className="bf-panel p-4" key={group.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-[#10201f]">{group.name}</h3>
                        <p className="text-xs font-semibold text-[#647876]">
                          Min {group.minSelect} / Max {group.maxSelect} /{" "}
                          {group.isRequired ? "Required" : "Optional"}
                        </p>
                      </div>
                      <StatusBadge value={group.isActive} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {group.addons.map((option) => (
                        <span
                          className="rounded-full bg-[#e9fbf7] px-3 py-1 text-xs font-bold text-[#0f766e]"
                          key={option.id}
                        >
                          {option.name} - INR {Number(option.price).toLocaleString("en-IN")}
                        </span>
                      ))}
                      {!group.addons.length ? (
                        <span className="text-xs font-semibold text-[#647876]">
                          No options added yet.
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
                {!addonGroups.length ? (
                  <div className="bf-panel p-5 text-sm font-semibold text-[#647876]">
                    No add-on groups added yet.
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </>
      )}

      <ResultDialog
        open={!!message}
        title="Success"
        message={message}
        onPrimary={() => setMessage("")}
      />
      <ResultDialog
        open={!!error}
        title="Menu error"
        message={error}
        tone="error"
        onPrimary={() => setError("")}
      />
    </AppShell>
  );
}
