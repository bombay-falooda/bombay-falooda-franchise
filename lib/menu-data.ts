import { apiRequest } from "@/lib/api";

export type Outlet = { id: string; name: string; code: string };

export type Category = {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  _count?: { items: number };
};

export type MenuItem = {
  id: string;
  categoryId: string;
  subCategory?: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  basePrice: string;
  isActive: boolean;
  category?: Category;
  addonGroups?: Array<{
    id: string;
    name: string;
    minSelect: number;
    maxSelect: number;
    isRequired: boolean;
    isActive: boolean;
    addons: Array<{
      id: string;
      name: string;
      price: string;
      isActive: boolean;
      sortOrder?: number;
    }>;
  }>;
  outletMenuItems?: Array<{
    id: string;
    outletId: string;
    price: string;
    isActive: boolean;
    outlet: Outlet;
  }>;
};

export type MenuAddonOption = {
  id: string;
  groupId: string;
  groupName: string;
  itemId: string;
  itemName: string;
  name: string;
  price: string;
  isActive: boolean;
  sortOrder?: number;
};

export type MenuData = {
  categories: Category[];
  items: MenuItem[];
  outlets: Outlet[];
};

export const blankCategory = { id: "", name: "", sortOrder: 0, isActive: true };

export const blankItem = {
  id: "",
  categoryId: "",
  subCategory: "",
  categoryName: "",
  name: "",
  description: "",
  imageUrl: "",
  basePrice: "",
  isActive: true,
};

export async function loadMenuData(): Promise<MenuData> {
  const [categories, items, outlets] = await Promise.all([
    apiRequest<Category[]>("/franchise-portal/menu/categories"),
    apiRequest<MenuItem[]>("/franchise-portal/menu/items"),
    apiRequest<Outlet[]>("/franchise-portal/outlets"),
  ]);

  return { categories, items, outlets };
}

export function findMenuItem(items: MenuItem[], id: string) {
  return items.find((item) => item.id === id) || null;
}

export function findMenuCategory(categories: Category[], id: string) {
  return categories.find((category) => category.id === id) || null;
}

export function flattenMenuAddons(items: MenuItem[]): MenuAddonOption[] {
  return items.flatMap((item) =>
    (item.addonGroups || []).flatMap((group) =>
      group.addons.map((addon) => ({
        id: addon.id,
        groupId: group.id,
        groupName: group.name,
        itemId: item.id,
        itemName: item.name,
        name: addon.name,
        price: addon.price,
        isActive: addon.isActive,
        sortOrder: addon.sortOrder,
      })),
    ),
  );
}

export function findMenuAddon(items: MenuItem[], id: string) {
  return flattenMenuAddons(items).find((addon) => addon.id === id) || null;
}
