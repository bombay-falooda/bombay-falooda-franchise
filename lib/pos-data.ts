import { apiRequest } from "@/lib/api";

export type PosOutlet = { id: string; name: string; code: string; address: string };

export type PosDevice = {
  id: string;
  name: string;
  type: "PERMANENT" | "TEMPORARY";
  status: string;
  accessKey: string;
  deviceCode?: string | null;
  eventName?: string | null;
  eventLocation?: string | null;
  handlerName?: string | null;
  handlerPhone?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
  lastLoginAt?: string | null;
  lastLoginDeviceCode?: string | null;
  outlet?: PosOutlet | null;
};

export type PosRequestForm = {
  outletId: string;
  name: string;
  type: "PERMANENT" | "TEMPORARY";
  eventName: string;
  eventLocation: string;
  handlerName: string;
  handlerPhone: string;
  validFrom: string;
  validUntil: string;
};

export const blankPosRequest: PosRequestForm = {
  outletId: "",
  name: "",
  type: "PERMANENT",
  eventName: "",
  eventLocation: "",
  handlerName: "",
  handlerPhone: "",
  validFrom: "",
  validUntil: "",
};

export async function loadPosData() {
  const [devices, outlets] = await Promise.all([
    apiRequest<PosDevice[]>("/franchise-portal/pos-devices"),
    apiRequest<PosOutlet[]>("/franchise-portal/outlets"),
  ]);

  return { devices, outlets };
}

export function posRequestBody(form: PosRequestForm) {
  return {
    outletId: form.outletId,
    name: form.name,
    type: form.type,
    eventName: form.type === "TEMPORARY" ? form.eventName || undefined : undefined,
    eventLocation:
      form.type === "TEMPORARY" ? form.eventLocation || undefined : undefined,
    handlerName: form.type === "TEMPORARY" ? form.handlerName || undefined : undefined,
    handlerPhone: form.type === "TEMPORARY" ? form.handlerPhone || undefined : undefined,
    validFrom: form.type === "TEMPORARY" ? form.validFrom || undefined : undefined,
    validUntil: form.type === "TEMPORARY" ? form.validUntil || undefined : undefined,
  };
}
