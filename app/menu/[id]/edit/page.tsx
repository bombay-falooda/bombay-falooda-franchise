"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageTitle } from "@/components/page-title";
import { ResultDialog } from "@/components/result-dialog";
import { StatusBadge } from "@/components/status-badge";
import { apiRequest } from "@/lib/api";
import {
  blankItem,
  findMenuItem,
  loadMenuData,
  type Category,
} from "@/lib/menu-data";

export default function EditMenuItemPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const itemId = params.id;
  const [categories, setCategories] = useState<Category[]>([]);
  const [itemForm, setItemForm] = useState(blankItem);
  const [categoryName, setCategoryName] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isCustomSubCategory, setIsCustomSubCategory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void load();
  }, [itemId]);

  async function load() {
    setLoading(true);
    try {
      const data = await loadMenuData();
      const item = findMenuItem(data.items, itemId);
      setCategories(data.categories);

      if (!item) {
        setError("Menu item not found.");
        return;
      }

      setItemForm({
        id: item.id,
        categoryId: item.categoryId,
        subCategory: item.subCategory || "",
        categoryName: item.category?.name || "",
        name: item.name,
        description: item.description || "",
        imageUrl: item.imageUrl || "",
        basePrice: String(item.basePrice),
        isActive: item.isActive,
      });
      if (item.subCategory) {
        setSubCategory(item.subCategory);
      }
      if (item.category?.name) {
        setCategoryName(item.category.name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load menu item");
    } finally {
      setLoading(false);
    }
  }

  async function saveItem(event: FormEvent) {
    event.preventDefault();
    try {
      await apiRequest(`/franchise-portal/menu/items/${itemId}`, {
        method: "PATCH",
        body: {
          categoryId: !isCustomCategory && itemForm.categoryId ? itemForm.categoryId : undefined,
          categoryName: isCustomCategory || !itemForm.categoryId ? categoryName : undefined,
          subCategory: subCategory.trim() || undefined,
          name: itemForm.name,
          description: itemForm.description || undefined,
          imageUrl: itemForm.imageUrl || undefined,
          basePrice: Number(itemForm.basePrice || 0),
          isActive: itemForm.isActive,
        },
      });
      router.push(`/menu/${itemId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update menu item");
    }
  }

  function uploadImage(file: File | null) {
    if (!file) {
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("Image is too large. Please choose an image below 8 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxSize = 900;
        const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d");
        if (!context) {
          setError("Could not prepare image.");
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        setItemForm((current) => ({
          ...current,
          imageUrl: canvas.toDataURL("image/jpeg", 0.72),
        }));
      };
      image.onerror = () => setError("Could not read image file.");
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  }

  return (
    <AppShell>
      <PageTitle
        title="Edit Menu Item"
        description="Update catalog details, category, subcategory, pricing, image and active status."
      >
        <div className="flex flex-wrap gap-2">
          <Link className="btn-secondary" href={`/menu/${itemId}`}>
            Back
          </Link>
          <Link className="btn-secondary" href="/menu">
            Menu Directory
          </Link>
        </div>
      </PageTitle>

      {loading ? (
        <div className="bf-panel p-5 text-sm font-semibold text-[#647876]">Loading item...</div>
      ) : (
        <form className="bf-panel grid gap-4 p-5 md:grid-cols-2" onSubmit={saveItem}>
          <div className="md:col-span-2">
            <StatusBadge value={itemForm.isActive} />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0f766e]">
              Item Name *
            </label>
            <input
              className="form-input mt-1"
              placeholder="Item name"
              value={itemForm.name}
              onChange={(event) => setItemForm({ ...itemForm, name: event.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0f766e]">
              Base Price (INR) *
            </label>
            <input
              className="form-input mt-1 font-mono font-bold text-[#10201f]"
              placeholder="Base price"
              type="number"
              step="0.01"
              value={itemForm.basePrice}
              onChange={(event) =>
                setItemForm({ ...itemForm, basePrice: event.target.value })
              }
              required
            />
          </div>

          {/* Category Selector */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0f766e]">
                Category *
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCustomCategory(!isCustomCategory);
                  if (!isCustomCategory) setCategoryName("");
                }}
                className="text-[11px] font-bold text-[#0f766e] hover:underline"
              >
                {isCustomCategory ? "Choose existing" : "+ New category"}
              </button>
            </div>

            {isCustomCategory ? (
              <input
                type="text"
                required
                placeholder="Type custom category name..."
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="form-input mt-1"
              />
            ) : (
              <select
                className="form-input mt-1 font-semibold"
                value={itemForm.categoryId}
                onChange={(event) => {
                  const val = event.target.value;
                  if (val === "__NEW__") {
                    setIsCustomCategory(true);
                    setCategoryName("");
                  } else {
                    setItemForm({ ...itemForm, categoryId: val });
                    const selectedCat = categories.find((c) => c.id === val);
                    if (selectedCat) setCategoryName(selectedCat.name);
                  }
                }}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
                <option value="Faloodas">Faloodas</option>
                <option value="Ice Creams">Ice Creams</option>
                <option value="Beverages & Shakes">Beverages & Shakes</option>
                <option value="Rabdi & Kulfi">Rabdi & Kulfi</option>
                <option value="__NEW__">+ Create New Category...</option>
              </select>
            )}
          </div>

          {/* Subcategory Selector */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0f766e]">
                Subcategory (Optional)
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCustomSubCategory(!isCustomSubCategory);
                  if (!isCustomSubCategory) setSubCategory("");
                }}
                className="text-[11px] font-bold text-[#0f766e] hover:underline"
              >
                {isCustomSubCategory ? "Choose preset" : "+ Custom subcategory"}
              </button>
            </div>

            {isCustomSubCategory ? (
              <input
                type="text"
                placeholder="e.g. Classic Mawa Falooda..."
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="form-input mt-1"
              />
            ) : (
              <select
                className="form-input mt-1 font-semibold"
                value={subCategory}
                onChange={(event) => {
                  const val = event.target.value;
                  if (val === "__NEW__") {
                    setIsCustomSubCategory(true);
                    setSubCategory("");
                  } else {
                    setSubCategory(val);
                  }
                }}
              >
                <option value="">-- No Subcategory --</option>
                <option value="Classic Mawa Falooda">Classic Mawa Falooda</option>
                <option value="Kulfi Falooda">Kulfi Falooda</option>
                <option value="Rabdi Falooda">Rabdi Falooda</option>
                <option value="Upvas (Fast) Falooda">Upvas (Fast) Falooda</option>
                <option value="Bowl Dry Kulfi Rabdi">Bowl Dry Kulfi Rabdi</option>
                <option value="Bombay Specials">Bombay Specials</option>
                <option value="Classic Ice Cream">Classic Ice Cream</option>
                <option value="Fresh Fruits Ice Cream">Fresh Fruits Ice Cream</option>
                <option value="Premium Ice Cream">Premium Ice Cream</option>
                <option value="Cold Coco">Cold Coco</option>
                <option value="Badam Shake">Badam Shake</option>
                <option value="Kulhad Rabdi">Kulhad Rabdi</option>
                <option value="Kulfi Stick">Kulfi Stick</option>
                <option value="Kulfi Roll Cut (Tukda)">Kulfi Roll Cut (Tukda)</option>
                <option value="__NEW__">+ Enter Custom Subcategory...</option>
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0f766e]">
              Active Status
            </label>
            <select
              className="form-input mt-1"
              value={String(itemForm.isActive)}
              onChange={(event) =>
                setItemForm({ ...itemForm, isActive: event.target.value === "true" })
              }
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0f766e]">
              Image URL / Upload
            </label>
            <input
              className="form-input mt-1"
              placeholder="https://..."
              value={itemForm.imageUrl}
              onChange={(event) =>
                setItemForm({ ...itemForm, imageUrl: event.target.value })
              }
            />
          </div>

          <div className="md:col-span-2">
            <input
              className="form-input"
              type="file"
              accept="image/*"
              onChange={(event) => uploadImage(event.target.files?.[0] || null)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0f766e]">
              Item Description
            </label>
            <input
              className="form-input mt-1"
              placeholder="Description"
              value={itemForm.description}
              onChange={(event) =>
                setItemForm({ ...itemForm, description: event.target.value })
              }
            />
          </div>

          <button className="btn-primary md:col-span-2 mt-2 h-11 text-sm font-bold" type="submit">
            Save Changes
          </button>
        </form>
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
