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
import {
  flattenMenuAddons,
  loadMenuData,
  type Category,
  type MenuAddonOption,
  type MenuItem,
} from "@/lib/menu-data";

type MenuView = "items" | "categories" | "addons";

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<MenuView>("items");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [error, setError] = useState("");

  const addons = useMemo(() => flattenMenuAddons(items), [items]);
  const publishedItems = useMemo(
    () => items.filter((item) => item.isActive).length,
    [items],
  );
  const outletLinks = useMemo(
    () => items.reduce((sum, item) => sum + (item.outletMenuItems?.length || 0), 0),
    [items],
  );

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesQuery = [item.name, item.description || "", item.category?.name || ""]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesStatus =
          statusFilter === "all" || String(item.isActive) === statusFilter;
        const matchesCategory =
          categoryFilter === "all" || item.categoryId === categoryFilter;
        return matchesQuery && matchesStatus && matchesCategory;
      }),
    [items, query, statusFilter, categoryFilter],
  );

  const filteredCategories = useMemo(
    () =>
      categories.filter((category) => {
        const matchesQuery = category.name.toLowerCase().includes(query.toLowerCase());
        const matchesStatus =
          statusFilter === "all" || String(category.isActive) === statusFilter;
        return matchesQuery && matchesStatus;
      }),
    [categories, query, statusFilter],
  );

  const filteredAddons = useMemo(
    () =>
      addons.filter((addon) => {
        const matchesQuery = [
          addon.name,
          addon.groupName,
          addon.itemName,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesStatus =
          statusFilter === "all" || String(addon.isActive) === statusFilter;
        return matchesQuery && matchesStatus;
      }),
    [addons, query, statusFilter],
  );

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await loadMenuData();
      setCategories(data.categories);
      setItems(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load menu");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleItemStatus(itemId: string, currentStatus: boolean) {
    try {
      await apiRequest(`/franchise-portal/menu/items/${itemId}`, {
        method: "PATCH",
        body: { isActive: !currentStatus },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not toggle item status");
    }
  }

  const primaryHref =
    view === "categories"
      ? "/menu/categories/add"
      : view === "addons"
        ? "/menu/addons/add"
        : "/menu/add";
  const primaryLabel =
    view === "categories" ? "Add Category" : view === "addons" ? "Add Add-on" : "Add Item";

  return (
    <AppShell>
      <PageTitle
        title="Menu Directory"
        description="View and filter items, categories and add-on options."
      >
        <div className="flex flex-wrap gap-2">
          <Link className="btn-secondary" href="/menu/categories/add">
            Add Category
          </Link>
          <Link className="btn-secondary" href="/menu/addons/add">
            Add Add-on
          </Link>
          <Link className="btn-primary" href={primaryHref}>
            {primaryLabel}
          </Link>
        </div>
      </PageTitle>

      <section className="mb-4 grid gap-3 md:grid-cols-4">
        <MetricCard label="Categories" value={String(categories.length)} helper="Menu groups" />
        <MetricCard label="Items" value={String(items.length)} helper={`${publishedItems} active`} />
        <MetricCard label="Outlet Links" value={String(outletLinks)} helper="Outlet availability rows" />
        <MetricCard label="Add-ons" value={String(addons.length)} helper="Configured options" />
      </section>

      <section className="bf-panel mb-4 grid gap-3 p-4 lg:grid-cols-[auto_1fr_auto_auto]">
        <div className="flex flex-wrap gap-2">
          {(["items", "categories", "addons"] as const).map((tab) => (
            <button
              className={view === tab ? "btn-primary" : "btn-secondary"}
              key={tab}
              type="button"
              onClick={() => setView(tab)}
            >
              {tab === "items" ? "Items" : tab === "categories" ? "Categories" : "Add-ons"}
            </button>
          ))}
        </div>
        <input
          className="form-input"
          placeholder="Search menu..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {view === "items" ? (
          <select
            className="form-input"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        ) : null}
        <select
          className="form-input"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">All status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </section>

      {loading ? (
        <div className="bf-panel p-5 text-sm font-semibold text-[#647876]">Loading menu...</div>
      ) : view === "items" ? (
        <ItemsTable items={filteredItems} onToggleStatus={handleToggleItemStatus} />
      ) : view === "categories" ? (
        <CategoriesTable categories={filteredCategories} />
      ) : (
        <AddonsTable addons={filteredAddons} />
      )}

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

function ItemsTable({
  items,
  onToggleStatus,
}: {
  items: MenuItem[];
  onToggleStatus: (itemId: string, currentStatus: boolean) => void;
}) {
  if (!items.length) {
    return <EmptyState text="No menu items match this filter." />;
  }

  return (
    <DataTable columns={["Item", "Category", "Price", "Add-ons", "Outlets", "Status", "Actions"]}>
      {items.map((item) => (
        <tr key={item.id} className={`hover:bg-[#f2fbf9] ${!item.isActive ? "bg-slate-50/80 opacity-75" : ""}`}>
          <td className="px-5 py-4">
            <div className="font-bold text-[#10201f]">{item.name}</div>
            <div className="mt-1 max-w-[340px] truncate text-xs font-semibold text-[#647876]">
              {item.description || "No description added"}
            </div>
          </td>
          <td className="px-5 py-4 font-semibold text-[#647876]">
            {item.category?.name || "-"}
          </td>
          <td className="px-5 py-4 font-semibold text-[#647876]">
            INR {Number(item.basePrice).toLocaleString("en-IN")}
          </td>
          <td className="px-5 py-4 text-xs font-semibold text-[#647876]">
            {(item.addonGroups || []).length} groups /{" "}
            {(item.addonGroups || []).reduce((sum, group) => sum + group.addons.length, 0)} options
          </td>
          <td className="px-5 py-4 text-xs font-semibold text-[#647876]">
            {item.outletMenuItems?.length || 0} outlets
          </td>
          <td className="px-5 py-4">
            <button
              type="button"
              onClick={() => onToggleStatus(item.id, item.isActive)}
              className={`h-8 px-3 rounded-[12px] text-xs font-semibold border transition flex items-center gap-1.5 ${
                item.isActive
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                  : "bg-red-50 text-red-800 border-red-300 hover:bg-red-100"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${item.isActive ? "bg-emerald-500" : "bg-red-500"}`} />
              <span>{item.isActive ? "Active" : "Inactive"}</span>
            </button>
          </td>
          <td className="px-5 py-4">
            <div className="flex flex-wrap gap-2">
              <Link className="btn-secondary" href={`/menu/${item.id}`}>
                View
              </Link>
              <Link className="btn-secondary" href={`/menu/${item.id}/edit`}>
                Edit
              </Link>
            </div>
          </td>
        </tr>
      ))}
    </DataTable>
  );
}

function CategoriesTable({ categories }: { categories: Category[] }) {
  if (!categories.length) {
    return <EmptyState text="No categories match this filter." />;
  }

  return (
    <DataTable columns={["Category", "Sort", "Items", "Status", "Actions"]}>
      {categories.map((category) => (
        <tr key={category.id} className="hover:bg-[#f2fbf9]">
          <td className="px-5 py-4 font-bold text-[#10201f]">{category.name}</td>
          <td className="px-5 py-4 font-semibold text-[#647876]">{category.sortOrder}</td>
          <td className="px-5 py-4 font-semibold text-[#647876]">
            {category._count?.items ?? 0}
          </td>
          <td className="px-5 py-4">
            <StatusBadge value={category.isActive} />
          </td>
          <td className="px-5 py-4">
            <Link className="btn-secondary" href={`/menu/categories/${category.id}/edit`}>
              Edit
            </Link>
          </td>
        </tr>
      ))}
    </DataTable>
  );
}

function AddonsTable({ addons }: { addons: MenuAddonOption[] }) {
  if (!addons.length) {
    return <EmptyState text="No add-on options match this filter." />;
  }

  return (
    <DataTable columns={["Add-on", "Group", "Item", "Price", "Status", "Actions"]}>
      {addons.map((addon) => (
        <tr key={addon.id} className="hover:bg-[#f2fbf9]">
          <td className="px-5 py-4 font-bold text-[#10201f]">{addon.name}</td>
          <td className="px-5 py-4 font-semibold text-[#647876]">{addon.groupName}</td>
          <td className="px-5 py-4 font-semibold text-[#647876]">{addon.itemName}</td>
          <td className="px-5 py-4 font-semibold text-[#647876]">
            INR {Number(addon.price).toLocaleString("en-IN")}
          </td>
          <td className="px-5 py-4">
            <StatusBadge value={addon.isActive} />
          </td>
          <td className="px-5 py-4">
            <Link className="btn-secondary" href={`/menu/addons/${addon.id}/edit`}>
              Edit
            </Link>
          </td>
        </tr>
      ))}
    </DataTable>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="bf-panel p-5 text-sm font-semibold text-[#647876]">{text}</div>;
}
