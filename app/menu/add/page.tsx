"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageTitle } from "@/components/page-title";
import { ResultDialog } from "@/components/result-dialog";
import { apiRequest } from "@/lib/api";
import { blankItem, loadMenuData, type Category } from "@/lib/menu-data";

export default function AddMenuItemPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [itemForm, setItemForm] = useState(blankItem);
  const [error, setError] = useState("");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      const data = await loadMenuData();
      setCategories(data.categories);
      setItemForm((current) => ({
        ...current,
        categoryId: current.categoryId || data.categories[0]?.id || "",
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load menu setup");
    }
  }

  async function saveItem(event: FormEvent) {
    event.preventDefault();
    try {
      const item = await apiRequest<{ id: string }>("/franchise-portal/menu/items", {
        method: "POST",
        body: {
          categoryId: itemForm.categoryId,
          name: itemForm.name,
          description: itemForm.description || undefined,
          imageUrl: itemForm.imageUrl || undefined,
          basePrice: Number(itemForm.basePrice || 0),
          isActive: itemForm.isActive,
        },
      });
      router.push(`/menu/${item.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save menu item");
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
        title="Add Menu Item"
        description="Create one item, then configure outlet availability and add-ons from its detail page."
      >
        <div className="flex flex-wrap gap-2">
          <Link className="btn-secondary" href="/menu">
            Back
          </Link>
          <Link className="btn-secondary" href="/menu/categories/add">
            Add Category
          </Link>
        </div>
      </PageTitle>

      {!categories.length ? (
        <div className="bf-panel p-5 text-sm font-semibold text-[#647876]">
          Create a category before adding menu items.
          <Link className="ml-2 font-black text-[#0f766e]" href="/menu/categories/add">
            Add category
          </Link>
        </div>
      ) : (
        <form className="bf-panel grid gap-3 p-4 md:grid-cols-2" onSubmit={saveItem}>
          <input
            className="form-input"
            placeholder="Item name"
            value={itemForm.name}
            onChange={(event) => setItemForm({ ...itemForm, name: event.target.value })}
            required
          />
          <select
            className="form-input"
            value={itemForm.categoryId}
            onChange={(event) =>
              setItemForm({ ...itemForm, categoryId: event.target.value })
            }
            required
          >
            <option value="">Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            className="form-input"
            placeholder="Base price"
            type="number"
            value={itemForm.basePrice}
            onChange={(event) =>
              setItemForm({ ...itemForm, basePrice: event.target.value })
            }
            required
          />
          <select
            className="form-input"
            value={String(itemForm.isActive)}
            onChange={(event) =>
              setItemForm({ ...itemForm, isActive: event.target.value === "true" })
            }
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <input
            className="form-input"
            placeholder="Image URL"
            value={itemForm.imageUrl}
            onChange={(event) =>
              setItemForm({ ...itemForm, imageUrl: event.target.value })
            }
          />
          <input
            className="form-input"
            type="file"
            accept="image/*"
            onChange={(event) => uploadImage(event.target.files?.[0] || null)}
          />
          <input
            className="form-input md:col-span-2"
            placeholder="Description"
            value={itemForm.description}
            onChange={(event) =>
              setItemForm({ ...itemForm, description: event.target.value })
            }
          />
          <button className="btn-primary md:col-span-2" type="submit">
            Create Item
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
