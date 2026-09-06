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

type AttendanceRecord = {
  id: string;
  userId: string;
  date: string;
  status: string; // ABSENT, HALF_DAY, LEAVE, PRESENT
  note?: string | null;
  markedBy?: string | null;
};

type PayrollDetailsResponse = {
  user: TeamMember;
  attendances: AttendanceRecord[];
};

export default function TeamMemberDetailPage() {
  const params = useParams<{ id: string }>();
  const memberId = params.id;
  const [member, setMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Attendance state
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [absentDate, setAbsentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [absenceStatus, setAbsenceStatus] = useState<string>("ABSENT");
  const [absenceNote, setAbsenceNote] = useState<string>("");
  const [markingAttendance, setMarkingAttendance] = useState(false);

  useEffect(() => {
    void load();
  }, [memberId]);

  async function load() {
    setLoading(true);
    try {
      const data = await loadTeamData();
      setMember(findTeamMember(data.team, memberId));

      // Fetch attendance records for this team member
      try {
        const payrollRes = await apiRequest<PayrollDetailsResponse>(`/users/${memberId}/payroll`);
        setAttendances(payrollRes.attendances || []);
      } catch (attErr) {
        console.warn("Could not load attendance records", attErr);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load team member");
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAttendance(e: React.FormEvent) {
    e.preventDefault();
    if (!absentDate) {
      setError("Please select a date to mark attendance.");
      return;
    }

    setMarkingAttendance(true);
    try {
      await apiRequest(`/users/${memberId}/attendance`, {
        method: "POST",
        body: {
          date: absentDate,
          status: absenceStatus,
          note: absenceNote.trim() || undefined,
        },
      });
      setMessage(`Attendance recorded as ${absenceStatus} for ${absentDate}`);
      setAbsenceNote("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark attendance");
    } finally {
      setMarkingAttendance(false);
    }
  }

  async function handleRemoveAttendance(dateStr: string) {
    try {
      await apiRequest(`/users/${memberId}/attendance/${dateStr}`, {
        method: "DELETE",
      });
      setMessage(`Attendance record for ${dateStr} removed.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove attendance record");
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

          <section className="bf-panel grid gap-4 p-5 md:grid-cols-2 mb-6">
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
              <button className="btn-secondary text-xs" type="button" onClick={() => setConfirmDeactivate(true)}>
                Deactivate Member
              </button>
            </div>
          </section>

          {/* ABSENCE MARKING & ATTENDANCE LOG SECTION FOR FRANCHISE OWNER */}
          <section className="bf-panel p-5 space-y-4">
            <div>
              <h3 className="font-display text-lg font-bold text-[#10201f]">
                Mark Staff Absent / Attendance Log
              </h3>
              <p className="mt-0.5 text-xs text-[#647876]">
                Mark specific absent or leave dates for this team member.
              </p>
            </div>

            <form onSubmit={handleMarkAttendance} className="flex flex-wrap items-end gap-3 rounded-xl bg-[#f2fbf9] p-4 border border-[#0f766e]/20">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-bold uppercase text-[#0f766e]">
                  Select Date *
                </label>
                <input
                  type="date"
                  required
                  value={absentDate}
                  onChange={(e) => setAbsentDate(e.target.value)}
                  className="form-input mt-1 text-xs"
                />
              </div>

              <div className="w-[140px]">
                <label className="block text-xs font-bold uppercase text-[#0f766e]">
                  Status
                </label>
                <select
                  value={absenceStatus}
                  onChange={(e) => setAbsenceStatus(e.target.value)}
                  className="form-input mt-1 text-xs"
                >
                  <option value="ABSENT">Full Day Absent</option>
                  <option value="HALF_DAY">Half Day Absent</option>
                  <option value="LEAVE">Paid Leave</option>
                  <option value="PRESENT">Present</option>
                </select>
              </div>

              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs font-bold uppercase text-[#0f766e]">
                  Reason / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Uninformed leave, Medical"
                  value={absenceNote}
                  onChange={(e) => setAbsenceNote(e.target.value)}
                  className="form-input mt-1 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={markingAttendance}
                className="btn-primary text-xs h-10 px-4 shrink-0"
              >
                {markingAttendance ? "Recording..." : "+ Mark Absent/Attendance"}
              </button>
            </form>

            <div>
              <h4 className="text-xs font-bold uppercase text-[#0f766e] mb-2">
                Logged Attendance Records ({attendances.length})
              </h4>

              {attendances.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#647876]/30 bg-[#f8faf9] p-4 text-center text-xs text-[#647876]">
                  No absences or attendance records logged for this team member.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#0f766e]/20 bg-white">
                  <table className="w-full text-left text-xs text-[#10201f]">
                    <thead className="bg-[#f2fbf9] font-bold text-[#0f766e] border-b border-[#0f766e]/20">
                      <tr>
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5">Note</th>
                        <th className="px-4 py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attendances.map((att) => {
                        const dateFormatted = new Date(att.date).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        });

                        return (
                          <tr key={att.id} className="hover:bg-[#f2fbf9]">
                            <td className="px-4 py-3 font-bold text-[#10201f]">
                              {dateFormatted}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-md px-2 py-0.5 font-bold text-[11px] border ${
                                  att.status === "ABSENT"
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : att.status === "HALF_DAY"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                }`}
                              >
                                {att.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[#647876]">
                              {att.note || "No note recorded"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveAttendance(att.date.split("T")[0])}
                                className="text-red-600 hover:underline font-semibold"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
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

