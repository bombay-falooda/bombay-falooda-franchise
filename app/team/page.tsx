"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { MetricCard } from "@/components/metric-card";
import { PageTitle } from "@/components/page-title";
import { ResultDialog } from "@/components/result-dialog";
import { StatusBadge } from "@/components/status-badge";
import { loadTeamData, type TeamMember } from "@/lib/team-data";

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const activeCount = useMemo(
    () => team.filter((member) => member.status === "ACTIVE").length,
    [team],
  );
  const outletAssignedCount = useMemo(
    () => team.filter((member) => member.outletId).length,
    [team],
  );
  const posUsers = useMemo(
    () => team.filter((member) => member.role === "POS_USER").length,
    [team],
  );

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await loadTeamData();
      setTeam(data.team);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load team");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <PageTitle title="Team Directory" description="View outlet staff, POS users and assignments.">
        <Link className="btn-primary" href="/team/add">
          Add Team Member
        </Link>
      </PageTitle>

      <section className="mb-4 grid gap-3 md:grid-cols-4">
        <MetricCard label="Team Members" value={String(team.length)} helper="Franchise users" />
        <MetricCard label="Active Staff" value={String(activeCount)} helper="Enabled accounts" />
        <MetricCard label="Assigned" value={String(outletAssignedCount)} helper="Outlet-linked users" />
        <MetricCard label="POS Users" value={String(posUsers)} helper="Billing access" />
      </section>

      {loading ? (
        <div className="bf-panel p-5 text-sm font-semibold text-[#647876]">Loading team...</div>
      ) : team.length === 0 ? (
        <div className="bf-panel p-5 text-sm font-semibold text-[#647876]">No team members added yet.</div>
      ) : (
        <DataTable columns={["Name", "Role", "Outlet", "Contact", "Status", "Actions"]}>
          {team.map((member) => (
            <tr key={member.id} className="hover:bg-[#f2fbf9]">
              <td className="px-5 py-4 font-bold text-[#10201f]">{member.name}</td>
              <td className="px-5 py-4 font-semibold text-[#647876]">{member.role}</td>
              <td className="px-5 py-4 font-semibold text-[#647876]">
                {member.outlet ? `${member.outlet.name} (${member.outlet.code})` : "All outlets"}
              </td>
              <td className="px-5 py-4 text-xs font-semibold text-[#647876]">
                {member.email || member.phone || "-"}
              </td>
              <td className="px-5 py-4">
                <StatusBadge value={member.status} />
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-wrap gap-2">
                  <Link className="btn-secondary" href={`/team/${member.id}`}>
                    View
                  </Link>
                  <Link className="btn-secondary" href={`/team/${member.id}/edit`}>
                    Edit
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <ResultDialog
        open={!!error}
        title="Team error"
        message={error}
        tone="error"
        onPrimary={() => setError("")}
      />
    </AppShell>
  );
}
