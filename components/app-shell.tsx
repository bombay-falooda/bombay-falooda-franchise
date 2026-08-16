"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";
import { clearAuthSession, getAccessToken, getAuthUser, type AuthUser } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "chart" },
  { href: "/outlets", label: "Outlets", icon: "store" },
  { href: "/menu", label: "Menu", icon: "menu" },
  { href: "/pos-devices", label: "POS", icon: "terminal" },
  { href: "/team", label: "Team", icon: "team" },
  { href: "/order-routing", label: "Routing", icon: "route" },
  { href: "/reports", label: "Reports", icon: "report" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

function NavIcon({ name }: { name: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      {name === "chart" ? (
        <>
          <path {...common} d="M4 19h16" />
          <path {...common} d="M6 16l4-5 4 3 4-7" />
          <path {...common} d="M18 7h-4" />
        </>
      ) : name === "store" ? (
        <>
          <path {...common} d="M5 10h14l-1-5H6l-1 5Z" />
          <path {...common} d="M7 10v9h10v-9" />
          <path {...common} d="M10 19v-5h4v5" />
        </>
      ) : name === "menu" ? (
        <>
          <path {...common} d="M6 5h12" />
          <path {...common} d="M6 12h12" />
          <path {...common} d="M6 19h8" />
        </>
      ) : name === "terminal" ? (
        <>
          <rect {...common} x="4" y="5" width="16" height="14" rx="3" />
          <path {...common} d="M8 10l3 2-3 2" />
          <path {...common} d="M13 15h3" />
        </>
      ) : name === "team" ? (
        <>
          <path {...common} d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path {...common} d="M3.5 19a5.5 5.5 0 0 1 11 0" />
          <path {...common} d="M16 11a2.5 2.5 0 0 0 0-5" />
          <path {...common} d="M17 15a4.5 4.5 0 0 1 3.5 4" />
        </>
      ) : name === "route" ? (
        <>
          <path {...common} d="M6 6h.01" />
          <path {...common} d="M18 18h.01" />
          <path {...common} d="M7 6h4a4 4 0 0 1 0 8h2a4 4 0 0 1 4 4" />
        </>
      ) : name === "report" ? (
        <>
          <path {...common} d="M7 3h7l3 3v15H7V3Z" />
          <path {...common} d="M14 3v4h4" />
          <path {...common} d="M9 13h6" />
          <path {...common} d="M9 17h4" />
        </>
      ) : (
        <>
          <circle {...common} cx="12" cy="12" r="3" />
          <path {...common} d="M19 12a7.2 7.2 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7 7 0 0 0-1.8-1L14.4 3h-4.8l-.3 3.1a7 7 0 0 0-1.8 1l-2.4-1-2 3.4 2 1.5a7.2 7.2 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 1.8 1l.3 3.1h4.8l.3-3.1a7 7 0 0 0 1.8-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z" />
        </>
      )}
    </svg>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [alerts, setAlerts] = useState<Array<{ id: string; title: string; message: string }>>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    const currentUser = getAuthUser();

    if (!token) {
      router.replace("/login");
      return;
    }

    setUser(currentUser);
    apiRequest<Array<{ id: string; title: string; message: string }>>("/franchise-portal/alerts")
      .then(setAlerts)
      .catch(() => undefined);
  }, [router]);

  function logout() {
    clearAuthSession();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.2),rgba(240,250,248,0.45))] p-2 sm:p-4">
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#10201f]/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-out Navigation Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-hidden bg-[#10201f] p-4 text-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <Link
            className="flex items-center gap-3 rounded-[18px] py-1"
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-white shadow-sm ring-1 ring-white/20">
              <Image src="/bombay-logo.png" alt="Bombay Falooda" width={48} height={48} />
            </span>
            <span>
              <span className="block font-display text-lg font-bold leading-tight">
                Bombay Falooda
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9ce4dc]">
                Franchise
              </span>
            </span>
          </Link>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white"
            onClick={() => setMobileMenuOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="mt-4 px-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/40">
          Main Menu
        </div>

        <nav className="mt-2 min-h-0 flex-1 overflow-y-auto flex flex-col gap-1 pr-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                className={`group flex items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-xs font-extrabold transition ${
                  active
                    ? "bg-white text-[#10201f] shadow-md"
                    : "text-white/70 hover:bg-white/[0.07] hover:text-white"
                }`}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] ${
                    active ? "bg-[#e9fbf7] text-[#0f766e]" : "bg-white/[0.08] text-white/70"
                  }`}
                >
                  <NavIcon name={item.icon} />
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-white/10">
          <div className="rounded-[18px] border border-white/10 bg-white/[0.06] p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-extrabold">{user?.name || "Franchise Owner"}</div>
                <div className="mt-0.5 max-w-[170px] truncate text-xs font-semibold text-white/50">
                  {user?.email || "owner@bombayfalooda.com"}
                </div>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-[#3ad67a]" />
            </div>
            <button
              className="mt-3 flex h-9 w-full items-center justify-center rounded-[12px] bg-white text-xs font-extrabold text-[#10201f] transition hover:bg-[#9ce4dc]"
              type="button"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="mx-auto grid h-full w-full gap-4 lg:grid-cols-[264px_1fr]">
        <aside className="hidden h-full flex-col overflow-hidden rounded-[24px] border border-[#d8e8e5] bg-[#10201f] p-3 text-white shadow-[0_18px_60px_rgba(16,32,31,0.18)] lg:flex">
          <Link
            className="flex items-center gap-3 rounded-[18px] px-2 py-2 transition hover:bg-white/[0.06]"
            href="/dashboard"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-white shadow-sm ring-1 ring-white/20">
              <Image src="/bombay-logo.png" alt="Bombay Falooda" width={52} height={52} />
            </span>
            <span>
              <span className="block font-display text-xl font-bold leading-tight">
                Bombay Falooda
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9ce4dc]">
                Franchise
              </span>
            </span>
          </Link>

          <div className="mt-4 px-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/40">
            Main Menu
          </div>

          <nav className="scrollbar-none mt-2 min-h-0 flex-1 overflow-y-auto pr-1 flex flex-col gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  className={`group flex items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-xs font-extrabold transition ${
                    active
                      ? "bg-white text-[#10201f] shadow-[0_12px_28px_rgba(0,0,0,0.16)]"
                      : "text-white/70 hover:bg-white/[0.07] hover:text-white"
                  }`}
                  href={item.href}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] ${
                      active
                        ? "bg-[#e9fbf7] text-[#0f766e]"
                        : "bg-white/[0.08] text-white/70 group-hover:text-white"
                    }`}
                  >
                    <NavIcon name={item.icon} />
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-4">
            <div className="rounded-[18px] border border-white/10 bg-white/[0.06] p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-extrabold">{user?.name || "Franchise Owner"}</div>
                  <div className="mt-0.5 max-w-[180px] truncate text-xs font-semibold text-white/50">
                    {user?.email || "owner@bombayfalooda.com"}
                  </div>
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-[#3ad67a]" />
              </div>
              <button
                className="mt-3 flex h-9 w-full items-center justify-center rounded-[12px] bg-white text-xs font-extrabold text-[#10201f] transition hover:bg-[#9ce4dc]"
                type="button"
                onClick={logout}
              >
                Logout
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-col gap-4">
          <header className="flex shrink-0 flex-col gap-3 rounded-[22px] border border-[#d8e8e5] bg-white/80 p-3.5 shadow-[0_14px_38px_rgba(20,83,78,0.06)] backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-[#d8e8e5] bg-white text-[#10201f] shadow-sm lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#0f766e]">
                  Owner Operations
                </div>
                <div className="font-display text-lg font-bold text-[#10201f] sm:text-xl">
                  Franchise Control Room
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="h-10 min-w-[180px] flex-1 sm:flex-none sm:min-w-[220px] rounded-[12px] border border-[#d8e8e5] bg-white/70 px-3.5 text-xs sm:text-sm font-semibold leading-10 text-[#647876]">
                Search outlets, menu, team...
              </div>
              <button
                className="relative h-10 rounded-[12px] border border-[#d8e8e5] bg-white/70 px-3 text-xs sm:text-sm font-extrabold text-[#10201f]"
                type="button"
                onClick={() => setShowAlerts((value) => !value)}
              >
                Alerts
                {alerts.length ? (
                  <span className="ml-2 rounded-full bg-[#be3455] px-2 py-0.5 text-xs text-white">{alerts.length}</span>
                ) : null}
              </button>
              <div className="hidden rounded-[14px] bg-[#e9fbf7] px-3.5 py-2 sm:block">
                <div className="text-xs font-extrabold uppercase text-[#0f766e]">Today</div>
                <div className="text-sm font-extrabold text-[#10201f]">Open shift</div>
              </div>
            </div>
          </header>

          <nav className="scrollbar-none flex shrink-0 gap-2 overflow-x-auto lg:hidden">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  className={`flex shrink-0 items-center gap-2 rounded-[14px] px-3 py-2 text-xs font-extrabold ${
                    active ? "bg-[#10201f] text-white" : "bg-white/80 text-[#244442]"
                  }`}
                  href={item.href}
                >
                  <NavIcon name={item.icon} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {showAlerts ? (
            <section className="shrink-0 rounded-[18px] border border-[#d8e8e5] bg-white/90 p-3 shadow-[0_14px_38px_rgba(20,83,78,0.06)]">
              <div className="mb-2 font-display text-lg font-bold text-[#10201f]">Notifications</div>
              <div className="grid gap-2 md:grid-cols-2">
                {alerts.length ? alerts.map((alert) => (
                  <div key={alert.id} className="rounded-[14px] border border-[#d8e8e5] bg-[#f8fffd] px-3 py-2">
                    <div className="text-sm font-extrabold text-[#10201f]">{alert.title}</div>
                    <div className="text-xs font-semibold text-[#647876]">{alert.message}</div>
                  </div>
                )) : <div className="text-sm font-semibold text-[#647876]">No active alerts.</div>}
              </div>
            </section>
          ) : null}

          <main className="min-h-0 min-w-0 overflow-y-auto pr-1 pb-7">
            <section className="mb-4 grid gap-3 grid-cols-1 sm:grid-cols-3">
              <div className="rounded-[18px] border border-[#d8e8e5] bg-[#e9fbf7] px-3.5 py-2.5">
                <div className="text-xs font-extrabold uppercase text-[#0f766e]">Live Orders</div>
                <div className="mt-1 font-display text-lg font-bold text-[#10201f]">12 pending</div>
              </div>
              <div className="rounded-[18px] border border-[#f4dcaa] bg-[#fff5dd] px-3.5 py-2.5">
                <div className="text-xs font-extrabold uppercase text-[#a06412]">Selected Outlet</div>
                <div className="mt-1 font-display text-lg font-bold text-[#10201f]">All outlets</div>
              </div>
              <div className="rounded-[18px] border border-[#f2cbd4] bg-[#fff0f3] px-3.5 py-2.5">
                <div className="text-xs font-extrabold uppercase text-[#be3455]">Attention</div>
                <div className="mt-1 font-display text-lg font-bold text-[#10201f]">Menu sync due</div>
              </div>
            </section>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
