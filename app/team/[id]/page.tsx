"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { PageTitle } from "@/components/page-title";
import { ResultDialog } from "@/components/result-dialog";
import { StatusBadge } from "@/components/status-badge";
import { apiRequest } from "@/lib/api";
import { findTeamMember, loadTeamData, type TeamMember } from "@/lib/team-data";

export default function TeamMemberDetailPage() {
  const params = useParams<{ id: string }>();
  const memberId = params.id;
  const [member, setMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void load();
  }, [memberId]);

  async function load() {
    setLoading(true);
    try {
      const data = await loadTeamData();
      setMember(findTeamMember(data.team, memberId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load team member");
    } finally {
      setLoading(false);
    }
  }

  async function deactivate() {
    try {
      await apiRequest(`/franchise-portal/team/${memberId}`, { method: "DELETE" });
      setMessage("Team member deactivated.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not deactivate team member");
    }
  }

  return (
    <AppShell>
      <PageTitle title={member?.name || "Team Member"} description="View role, outlet assignment and account status.">
        <div className="flex flex-wrap gap-2">
          <Link className="btn-secondary" href="/team">
            Back
          </Link>
          {member ? (
            <Link className="btn-primary" href={`/team/${member.id}/edit`}>
              Edit Member
            </Link>
          ) : null}
        </div>
      </PageTitle>

      {loading ? (
        <div className="bf-panel p-5 text-sm font-semibold text-[#647876]">Loading member...</div>
      ) : !member ? (
        <div className="bf-panel p-5 text-sm font-semibold text-[#647876]">Team member not found.</div>
      ) : (
        <>
          <section className="mb-4 grid gap-3 md:grid-cols-4">
            <MetricCard label="Role" value={member.role} helper="Access type" />
            <MetricCard label="Status" value={member.status} helper="Account state" />
            <MetricCard label="Outlet" value={member.outlet?.code || "All"} helper={member.outlet?.name || "No fixed outlet"} />
            <MetricCard label="Contact" value={member.phone || "-"} helper={member.email || "No email"} />
          </section>

          <section className="bf-panel grid gap-4 p-5 md:grid-cols-2">
            <div>
              <p className="text-xs font-black uppercase text-[#0f766e]">Name</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-[#10201f]">{member.name}</h2>
            </div>
            <div>
              <p className="text-xs font-black uppercase text-[#0f766e]">Status</p>
              <div className="mt-2">
                <StatusBadge value={member.status} />
              </div>
            </div>
            <Info label="Email" value={member.email || "-"} />
            <Info label="Phone" value={member.phone || "-"} />
            <Info label="Outlet" value={member.outlet ? `${member.outlet.name} (${member.outlet.code})` : "All outlets"} />
            <Info label="Role" value={member.role} />
            <div className="md:col-span-2">
              <button className="btn-secondary" type="button" onClick={() => setConfirmDeactivate(true)}>
                Deactivate Member
              </button>
            </div>
          </section>
        </>
      )}

      <ResultDialog open={!!message} title="Success" message={message} onPrimary={() => setMessage("")} />
      <ResultDialog open={!!error} title="Team error" message={error} tone="error" onPrimary={() => setError("")} />
      <ResultDialog
        open={confirmDeactivate}
        title="Deactivate team member?"
        message="This will disable the account but keep history and assignments."
        tone="confirm"
        primaryLabel="Deactivate"
        secondaryLabel="Cancel"
        onPrimary={() => {
          setConfirmDeactivate(false);
          void deactivate();
        }}
        onSecondary={() => setConfirmDeactivate(false)}
      />
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase text-[#0f766e]">{label}</p>
      <p className="mt-1 text-sm font-bold text-[#647876]">{value}</p>
    </div>
  );
}
