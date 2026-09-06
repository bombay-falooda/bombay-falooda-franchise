import { apiRequest } from "@/lib/api";
import type { Outlet } from "@/lib/menu-data";

export type TeamMember = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: "STAFF" | "POS_USER" | "FRANCHISE_OWNER";
  status: string;
  outletId: string | null;
  outlet?: Outlet | null;
};

export type TeamFormState = {
  name: string;
  email: string;
  countryCode: string;
  phone: string;
  password: string;
  role: "STAFF" | "POS_USER";
  outletId: string;
  address: string;
  state: string;
  city: string;
  pincode: string;
};

export const blankTeamForm: TeamFormState = {
  name: "",
  email: "",
  countryCode: "+91",
  phone: "",
  password: "",
  role: "STAFF",
  outletId: "",
  address: "",
  state: "Gujarat",
  city: "Surat",
  pincode: "",
};

export async function loadTeamData() {
  const [team, outlets] = await Promise.all([
    apiRequest<TeamMember[]>("/franchise-portal/team"),
    apiRequest<Outlet[]>("/franchise-portal/outlets"),
  ]);

  return { team, outlets };
}

export function findTeamMember(team: TeamMember[], id: string) {
  return team.find((member) => member.id === id) || null;
}
