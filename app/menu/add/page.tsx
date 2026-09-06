"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PageTitle } from "@/components/page-title";
import { ResultDialog } from "@/components/result-dialog";
import { apiRequest } from "@/lib/api";
import { blankItem, loadMenuData, type Category } from "@/lib/menu-data";

const DEFAULT_IMAGES = [
  { label: "Royal Falooda", url: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80" },
  { label: "Mango Falooda", url: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80" },
  { label: "Chocolate Fudge", url: "https://images.unsplash.com/photo-1579954115545-aad505958169?auto=format&fit=crop&w=600&q=80" },
  { label: "Kesar Pista", url: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=600&q=80" },
];

export default function AddMenuItemPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [itemForm, setItemForm] = useState(blankItem);
  const [categoryName, setCategoryName] = useState("Faloodas");
  const [subCategory, setSubCategory] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isCustomSubCategory, setIsCustomSubCategory] = useState(false);
  const [itemAddonGroups, setItemAddonGroups] = useState<
    Array<{ name: string; addons: Array<{ name: string; price: string }> }>
  >([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      const data = await loadMenuData();
      setCategories(data.categories);
      if (data.categories.length > 0) {
        setItemForm((current) => ({
          ...current,
          categoryId: current.categoryId || data.categories[0].id,
        }));
        setCategoryName(data.categories[0].name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load menu setup");
    }
  }

  function addAddonGroupRow() {
    setItemAddonGroups([
      ...itemAddonGroups,
      { name: "Extra Toppings", addons: [{ name: "Extra Rabdi", price: "30" }] },
    ]);
  }

  function removeAddonGroupRow(gIdx: number) {
    setItemAddonGroups(itemAddonGroups.filter((_, idx) => idx !== gIdx));
  }

  function addAddonOptionRow(gIdx: number) {
    const updated = [...itemAddonGroups];
    updated[gIdx].addons.push({ name: "", price: "0" });
    setItemAddonGroups(updated);
  }

  function removeAddonOptionRow(gIdx: number, aIdx: number) {
    const updated = [...itemAddonGroups];
    updated[gIdx].addons = updated[gIdx].addons.filter((_, idx) => idx !== aIdx);
    setItemAddonGroups(updated);
  }

  async function saveItem(event: FormEvent) {
    event.preventDefault();
    try {
      const item = await apiRequest<{ id: string }>("/franchise-portal/menu/items", {
        method: "POST",
        body: {
          categoryId: !isCustomCategory && itemForm.categoryId ? itemForm.categoryId : undefined,
          categoryName: isCustomCategory || !itemForm.categoryId ? categoryName : undefined,
          subCategory: subCategory.trim() || undefined,
          name: itemForm.name,
          description: itemForm.description || undefined,
          imageUrl: itemForm.imageUrl || undefined,
          basePrice: Number(itemForm.basePrice || 0),
          isActive: itemForm.isActive,
          addonGroups: itemAddonGroups
            .filter((g) => g.name.trim())
            .map((g) => ({
              name: g.name.trim(),
              minSelect: 0,
              maxSelect: 3,
              isRequired: false,
              addons: g.addons
                .filter((a) => a.name.trim())
                .map((a) => ({
                  name: a.name.trim(),
                  price: Number(a.price) || 0,
                })),
            })),
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
        description="Create one item with category and subcategory, then configure outlet availability."
      >
        <div className="flex flex-wrap gap-2">
          <Link className="btn-secondary" href="/menu">
            Back
          </Link>
        </div>
      </PageTitle>

      <form className="bf-panel grid gap-4 p-5 md:grid-cols-2" onSubmit={saveItem}>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0f766e]">
            Item Name *
          </label>
          <input
            className="form-input mt-1"
            placeholder="e.g. Royal Bombay Falooda"
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
            placeholder="e.g. 180"
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
            <option value="true">Active (Available for outlets)</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {/* Image Upload & Photo Selection */}
        <div className="md:col-span-2 rounded-xl border border-[#d8e8e5] bg-[#f4faf9] p-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0f766e] mb-2">
            Item Photo / Image Upload
          </label>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="h-20 w-20 rounded-xl bg-white border border-[#d8e8e5] overflow-hidden shrink-0 shadow-xs flex items-center justify-center">
              {itemForm.imageUrl ? (
                <img src={itemForm.imageUrl} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[10px] text-[#647876] font-semibold text-center p-1">No Image</span>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Image URL (https://...)"
                  value={itemForm.imageUrl}
                  onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
                  className="form-input text-xs flex-1"
                />
                <label className="cursor-pointer shrink-0 rounded-xl bg-[#0f766e] px-3 py-2 text-xs font-bold text-white hover:bg-[#0d645d] transition flex items-center gap-1">
                  <span>Upload File</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => uploadImage(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#647876] block mb-1">
                  Or select a sample photo preset:
                </span>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_IMAGES.map((img) => (
                    <button
                      key={img.label}
                      type="button"
                      onClick={() => setItemForm((prev) => ({ ...prev, imageUrl: img.url }))}
                      className="rounded-lg border border-[#d8e8e5] bg-white px-2.5 py-1 text-xs font-medium text-[#10201f] hover:border-[#0f766e] hover:bg-[#f4faf9] transition"
                    >
                      {img.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0f766e]">
            Item Description
          </label>
          <input
            className="form-input mt-1"
            placeholder="Rich Rabdi, rose syrup, basil seeds & dry fruit mix..."
            value={itemForm.description}
            onChange={(event) =>
              setItemForm({ ...itemForm, description: event.target.value })
            }
          />
        </div>

        {/* Addons Builder */}
        <div className="md:col-span-2 rounded-xl border border-[#d8e8e5] bg-[#f4faf9] p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0f766e]">
              Add-ons & Options Pricing Builder
            </label>
            <button
              type="button"
              onClick={addAddonGroupRow}
              className="text-xs font-bold text-[#0f766e] hover:underline"
            >
              + Add Add-on Group
            </button>
          </div>

          {itemAddonGroups.length === 0 ? (
            <p className="text-xs text-[#647876] italic">
              No add-ons added yet. Click "+ Add Add-on Group" to add portion upgrades or toppings (e.g. Extra Rabdi, Scoops, Portion Sizes).
            </p>
          ) : (
            <div className="space-y-3">
              {itemAddonGroups.map((g, gIdx) => (
                <div key={gIdx} className="rounded-xl border border-[#d8e8e5] bg-white p-3 space-y-3 shadow-xs">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0f766e]">
                        Add-on Group Title *
                      </label>
                      <button
                        type="button"
                        onClick={() => removeAddonGroupRow(gIdx)}
                        className="text-xs font-semibold text-red-600 hover:underline shrink-0"
                      >
                        Remove Group
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Extra Toppings or Select Portion Size"
                      value={g.name}
                      onChange={(e) => {
                        const updated = [...itemAddonGroups];
                        updated[gIdx].name = e.target.value;
                        setItemAddonGroups(updated);
                      }}
                      className="w-full rounded-lg border border-[#d8e8e5] px-2.5 py-1.5 text-xs font-bold text-[#10201f] focus:border-[#0f766e] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2 border-t border-[#d8e8e5]/60 pt-2">
                    <div className="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-[#647876]">
                      <div className="col-span-6">Option Name (e.g. Extra Rabdi)</div>
                      <div className="col-span-4">Extra Charge (INR)</div>
                      <div className="col-span-2 text-right">Action</div>
                    </div>

                    {g.addons.map((a, aIdx) => (
                      <div key={aIdx} className="grid grid-cols-12 gap-2 items-center">
                        <input
                          type="text"
                          placeholder="e.g. Extra Rabdi / 350ML"
                          value={a.name}
                          onChange={(e) => {
                            const updated = [...itemAddonGroups];
                            updated[gIdx].addons[aIdx].name = e.target.value;
                            setItemAddonGroups(updated);
                          }}
                          className="col-span-6 rounded-md border border-[#d8e8e5] px-2.5 py-1.5 text-xs"
                        />
                        <input
                          type="number"
                          placeholder="0"
                          value={a.price}
                          onChange={(e) => {
                            const updated = [...itemAddonGroups];
                            updated[gIdx].addons[aIdx].price = e.target.value;
                            setItemAddonGroups(updated);
                          }}
                          className="col-span-4 rounded-md border border-[#d8e8e5] px-2.5 py-1.5 text-xs font-mono"
                        />
                        <div className="col-span-2 text-right">
                          <button
                            type="button"
                            onClick={() => removeAddonOptionRow(gIdx, aIdx)}
                            className="text-xs font-bold text-red-500 hover:underline"
                          >
                            ✕ Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addAddonOptionRow(gIdx)}
                      className="text-xs font-bold text-[#0f766e] hover:underline pt-1 block"
                    >
                      + Add Option
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="btn-primary md:col-span-2 mt-2 h-11 text-sm font-bold" type="submit">
          + Create Menu Item
        </button>
      </form>

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
