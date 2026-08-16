"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageTitle } from "@/components/page-title";
import { ResultDialog } from "@/components/result-dialog";
import { apiRequest } from "@/lib/api";
import { findMenuAddon, loadMenuData } from "@/lib/menu-data";

export default function EditMenuAddonPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const addonId = params.id;
  const [form, setForm] = useState({
    name: "",
    price: "",
    sortOrder: 0,
    isActive: true,
    groupName: "",
    itemName: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void load();
  }, [addonId]);

  async function load() {
    setLoading(true);
    try {
      const data = await loadMenuData();
      const addon = findMenuAddon(data.items, addonId);
      if (!addon) {
        setError("Add-on not found.");
        return;
      }
      setForm({
        name: addon.name,
        price: String(addon.price),
        sortOrder: addon.sortOrder || 0,
        isActive: addon.isActive,
        groupName: addon.groupName,
        itemName: addon.itemName,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load add-on");
    } finally {
      setLoading(false);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    try {
      await apiRequest(`/franchise-portal/menu/addons/${addonId}`, {
        method: "PATCH",
        body: {
          name: form.name,
          price: Number(form.price || 0),
          sortOrder: Number(form.sortOrder || 0),
          isActive: form.isActive,
        },
      });
      router.push("/menu");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update add-on");
    }
  }

  return (
    <AppShell>
      <PageTitle title="Edit Add-on" description="Update add-on name, price, sort order and active status.">
        <Link className="btn-secondary" href="/menu">
          Back
        </Link>
      </PageTitle>

      {loading ? (
        <div className="bf-panel p-5 text-sm font-semibold text-[#647876]">Loading add-on...</div>
      ) : (
        <form className="bf-panel grid gap-3 p-4 md:grid-cols-4" onSubmit={save}>
          <div className="md:col-span-4 rounded-[16px] bg-[#e9fbf7] p-4 text-sm font-bold text-[#0f766e]">
            {form.itemName} - {form.groupName}
          </div>
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
          <button className="btn-primary md:col-span-4" type="submit">
            Save Add-on
          </button>
        </form>
      )}

      <ResultDialog open={!!error} title="Add-on error" message={error} tone="error" onPrimary={() => setError("")} />
    </AppShell>
  );
}
