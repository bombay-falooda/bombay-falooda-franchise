"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageTitle } from "@/components/page-title";
import { ResultDialog } from "@/components/result-dialog";
import { apiRequest } from "@/lib/api";
import { loadMenuData, type MenuItem } from "@/lib/menu-data";

export default function AddMenuAddonPage() {
  const router = useRouter();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [form, setForm] = useState({
    groupId: "",
    name: "",
    price: "",
    sortOrder: 0,
    isActive: true,
  });
  const [error, setError] = useState("");

  const groups = useMemo(
    () =>
      items.flatMap((item) =>
        (item.addonGroups || []).map((group) => ({
          id: group.id,
          name: group.name,
          itemName: item.name,
        })),
      ),
    [items],
  );

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      const data = await loadMenuData();
      setItems(data.items);
      setForm((current) => ({
        ...current,
        groupId: current.groupId || data.items.flatMap((item) => item.addonGroups || [])[0]?.id || "",
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load add-on groups");
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    try {
      await apiRequest("/franchise-portal/menu/addons", {
        method: "POST",
        body: {
          groupId: form.groupId,
          name: form.name,
          price: Number(form.price || 0),
          sortOrder: Number(form.sortOrder || 0),
          isActive: form.isActive,
        },
      });
      router.push("/menu");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create add-on");
    }
  }

  return (
    <AppShell>
      <PageTitle title="Add Add-on" description="Create an add-on option under an existing add-on group.">
        <Link className="btn-secondary" href="/menu">
          Back
        </Link>
      </PageTitle>

      {!groups.length ? (
        <div className="bf-panel p-5 text-sm font-semibold text-[#647876]">
          No add-on groups exist yet. Open a menu item detail page and create an add-on group first.
        </div>
      ) : (
        <form className="bf-panel grid gap-3 p-4 md:grid-cols-4" onSubmit={save}>
          <select
            className="form-input md:col-span-2"
            value={form.groupId}
            onChange={(event) => setForm({ ...form, groupId: event.target.value })}
            required
          >
            <option value="">Select group</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.itemName} - {group.name}
              </option>
            ))}
          </select>
          <input
            className="form-input"
            placeholder="Add-on name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <input
            className="form-input"
            placeholder="Price"
            type="number"
            value={form.price}
            onChange={(event) => setForm({ ...form, price: event.target.value })}
            required
          />
          <input
            className="form-input"
            placeholder="Sort order"
            type="number"
            value={form.sortOrder}
            onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })}
          />
          <select
            className="form-input"
            value={String(form.isActive)}
            onChange={(event) => setForm({ ...form, isActive: event.target.value === "true" })}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button className="btn-primary md:col-span-2" type="submit">
            Create Add-on
          </button>
        </form>
      )}

      <ResultDialog open={!!error} title="Add-on error" message={error} tone="error" onPrimary={() => setError("")} />
    </AppShell>
  );
}
