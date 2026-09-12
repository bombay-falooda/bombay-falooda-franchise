"use client";

import Link from "next/link";

export default function FranchiseDownloadsPage() {
  const apps = [
    {
      id: "pos",
      name: "POS Billing Terminal App",
      badge: "Counter Billing & KOT",
      filename: "Bombay-Falooda-POS-Setup-v1.0.0.exe",
      size: "84.2 MB",
      version: "v1.0.0 (64-bit)",
      color: "bg-[#b82e46] text-white",
      description:
        "Dedicated desktop billing application for outlet cashiers. Direct WebSerial thermal printer support, KOT printing, and offline till resilience.",
      features: [
        "WebSerial & Network Thermal Printer Support (80mm / 58mm)",
        "Instant Offline Till Resilience & Local Storage Sync",
        "Fast One-Click KOT & Split Billing",
        "Real-Time OS Push Alerts for Digital Orders",
      ],
      downloadUrl: "https://api.bombayfalooda.com/api/downloads/pos-setup.exe",
    },
    {
      id: "franchise",
      name: "Franchise Owner Portal App",
      badge: "Outlet & Sales Operations",
      filename: "Bombay-Falooda-Franchise-Setup-v1.0.0.exe",
      size: "88.6 MB",
      version: "v1.0.0 (64-bit)",
      color: "bg-purple-600 text-white",
      description:
        "Native desktop client for Franchise Owners to manage outlet operations, item channel toggles (Zomato/Swiggy/POS), staff attendance, and revenue analytics.",
      features: [
        "Real-Time Sales Breakdown (Cash, UPI, Card, Online Gateways)",
        "Multi-Channel Item On/Off Management (POS, Web, Zomato, Swiggy)",
        "Staff Attendance & Check-In Monitoring",
        "Direct Z-Report Generation & Till Auditing",
      ],
      downloadUrl: "https://api.bombayfalooda.com/api/downloads/franchise-setup.exe",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] flex flex-col font-sans">
      {/* Header Bar */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition flex items-center gap-1 text-xs font-semibold"
          >
            <span>← Back to Dashboard</span>
          </Link>
          <div className="h-5 w-px bg-slate-300" />
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-600 text-white font-bold text-xs">
              EXE
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">Franchise App Download Center</h1>
              <p className="text-[11px] text-slate-500 font-mono">
                Official Production Windows Executables (.exe) for Franchise Owners & POS Cashiers
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-purple-900 via-slate-900 to-purple-950 text-white rounded-2xl p-6 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            ✓ Official Desktop Release Builds
          </div>
          <h2 className="text-2xl font-black">Download Production Desktop Executables</h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Install native desktop applications for Windows 10/11 (64-bit). Built with hardware thermal printer drivers, low-latency audio alerts, and native OS desktop push notifications.
          </p>
        </div>

        {/* Apps Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {apps.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xl transition flex flex-col justify-between overflow-hidden"
            >
              <div>
                <div className={`p-4 ${app.color} space-y-1`}>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white/20">
                    {app.badge}
                  </span>
                  <h3 className="font-black text-base leading-tight pt-1">{app.name}</h3>
                  <div className="text-[11px] font-mono opacity-80">{app.version} • {app.size}</div>
                </div>

                <div className="p-5 space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {app.description}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Key Included Features:</span>
                    {app.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                        <span className="text-emerald-600 font-bold shrink-0">✓</span>
                        <span className="leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Download Button Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200">
                <a
                  href={app.downloadUrl}
                  download={app.filename}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
                >
                  <span>Download {app.filename}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
