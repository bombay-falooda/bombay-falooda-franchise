import { apiRequest } from "@/lib/api";

export type Outlet = {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string | null;
  email: string | null;
  status: "ACTIVE" | "INACTIVE";
  dineIn: boolean;
  takeaway: boolean;
  delivery: boolean;
  onlineOrderingEnabled: boolean;
  serviceRadiusKm: string | null;
  outletBaseCharge: string | null;
  deliveryKmPricing: Array<{ km: number; price: number }> | null;
  openingTime: string | null;
  closingTime: string | null;
  menuSetupStatus: string;
  _count?: { posDevices: number; users: number };
};

export type OutletFormState = {
  name: string;
  address: string;
  phone: string;
  email: string;
  status: "ACTIVE" | "INACTIVE";
  dineIn: boolean;
  takeaway: boolean;
  delivery: boolean;
  onlineOrderingEnabled: boolean;
  serviceRadiusKm: string;
  outletBaseCharge: string;
  deliveryKmPricing: Array<{ km: string; price: string }>;
  openingTime: string;
  closingTime: string;
};

export async function loadOutlets() {
  return apiRequest<Outlet[]>("/franchise-portal/outlets");
}

export function findOutlet(outlets: Outlet[], id: string) {
  return outlets.find((outlet) => outlet.id === id) || null;
}

export function toOutletForm(outlet: Outlet): OutletFormState {
  return {
    name: outlet.name,
    address: outlet.address,
    phone: outlet.phone || "",
    email: outlet.email || "",
    status: outlet.status,
    dineIn: outlet.dineIn,
    takeaway: outlet.takeaway,
    delivery: outlet.delivery,
    onlineOrderingEnabled: outlet.onlineOrderingEnabled,
    serviceRadiusKm: outlet.serviceRadiusKm ? String(outlet.serviceRadiusKm) : "",
    outletBaseCharge: outlet.outletBaseCharge ? String(outlet.outletBaseCharge) : "",
    deliveryKmPricing: (outlet.deliveryKmPricing || []).map((row) => ({
      km: String(row.km),
      price: String(row.price),
    })),
    openingTime: outlet.openingTime || "",
    closingTime: outlet.closingTime || "",
  };
}

export function outletUpdateBody(form: OutletFormState) {
  return {
    name: form.name,
    address: form.address,
    phone: form.phone || undefined,
    email: form.email || undefined,
    status: form.status,
    dineIn: form.dineIn,
    takeaway: form.takeaway,
    delivery: form.delivery,
    onlineOrderingEnabled: form.onlineOrderingEnabled,
    serviceRadiusKm: form.serviceRadiusKm ? Number(form.serviceRadiusKm) : undefined,
    outletBaseCharge: form.outletBaseCharge ? Number(form.outletBaseCharge) : undefined,
    deliveryKmPricing: form.deliveryKmPricing
      .filter((row) => row.km !== "" && row.price !== "")
      .map((row) => ({
        km: Number(row.km),
        price: Number(row.price),
      })),
    openingTime: form.openingTime || undefined,
    closingTime: form.closingTime || undefined,
  };
}
