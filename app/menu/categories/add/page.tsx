"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageTitle } from "@/components/page-title";
import { ResultDialog } from "@/components/result-dialog";
import { apiRequest } from "@/lib/api";
import { blankCategory } from "@/lib/menu-data";

export default function AddMenuCategoryPage() {
  const router = useRouter();
  const [form, setForm] = useState(blankCategory);
  const [error, setError] = useState("");

  async function save(event: FormEvent) {
    event.preventDefault();
    try {
      await apiRequest("/franchise-portal/menu/categories", {
        method: "POST",
        body: {
          name: form.name,
          sortOrder: Number(form.sortOrder || 0),
          isActive: form.isActive,
        },
      });
      router.push("/menu");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create category");
    }
  }

  return (
    <AppShell>
      <PageTitle title="Add Category" description="Create a menu category for grouping items.">
        <Link className="btn-secondary" href="/menu">
          Back
        </Link>
      </PageTitle>

      <form className="bf-panel grid gap-3 p-4 md:grid-cols-3" onSubmit={save}>
        <input
          className="form-input"
          placeholder="Category name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
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
        <button className="btn-primary md:col-span-3" type="submit">
          Create Category
        </button>
      </form>

      <ResultDialog open={!!error} title="Category error" message={error} tone="error" onPrimary={() => setError("")} />
    </AppShell>
  );
}
