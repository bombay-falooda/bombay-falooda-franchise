"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageTitle } from "@/components/page-title";
import { ResultDialog } from "@/components/result-dialog";
import { apiRequest } from "@/lib/api";
import { blankCategory, findMenuCategory, loadMenuData } from "@/lib/menu-data";

export default function EditMenuCategoryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const categoryId = params.id;
  const [form, setForm] = useState(blankCategory);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void load();
  }, [categoryId]);

  async function load() {
    setLoading(true);
    try {
      const data = await loadMenuData();
      const category = findMenuCategory(data.categories, categoryId);
      if (!category) {
        setError("Category not found.");
        return;
      }
      setForm(category);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load category");
    } finally {
      setLoading(false);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    try {
      await apiRequest(`/franchise-portal/menu/categories/${categoryId}`, {
        method: "PATCH",
        body: {
          name: form.name,
          sortOrder: Number(form.sortOrder || 0),
          isActive: form.isActive,
        },
      });
      router.push("/menu");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update category");
    }
  }

  return (
    <AppShell>
      <PageTitle title="Edit Category" description="Update category name, sort order and status.">
        <Link className="btn-secondary" href="/menu">
          Back
        </Link>
      </PageTitle>

      {loading ? (
        <div className="bf-panel p-5 text-sm font-semibold text-[#647876]">Loading category...</div>
      ) : (
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
            Save Category
          </button>
        </form>
      )}

      <ResultDialog open={!!error} title="Category error" message={error} tone="error" onPrimary={() => setError("")} />
    </AppShell>
  );
}
