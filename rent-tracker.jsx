import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "rent-tracker-data";

// Convert a Date to a local ISO date string "YYYY-MM-DD"
function toKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseKey(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Build all weeks from a tenant's startDate (ISO string), filtered to a given year view.
// Each week is exactly 7 days. Weeks are identified by their start date key.
// We generate enough weeks to cover from startDate up to end of (viewYear + 1) at most.
function buildTenantWeeks(startDateStr, viewYear) {
  if (!startDateStr) return [];
  const start = parseKey(startDateStr);
  const viewStart = new Date(viewYear, 0, 1);
  const viewEnd = new Date(viewYear, 11, 31);

  const weeks = [];
  let cursor = new Date(start);
  // Safety: cap at 520 weeks (10 years)
  for (let i = 0; i < 520; i++) {
    const wStart = new Date(cursor);
    const wEnd = new Date(cursor);
    wEnd.setDate(wEnd.getDate() + 6);

    // Stop once the week starts after the view year
    if (wStart > viewEnd) break;

    // Only include weeks that overlap with the view year
    if (wEnd >= viewStart) {
      weeks.push({ weekNum: i + 1, start: wStart, end: wEnd, key: toKey(wStart) });
    }

    cursor.setDate(cursor.getDate() + 7);
  }
  return weeks;
}

// Find which week contains today
function getCurrentWeekKey(startDateStr) {
  if (!startDateStr) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = parseKey(startDateStr);
  if (now < start) return null;
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const weekIdx = Math.floor(diffDays / 7);
  const wStart = new Date(start);
  wStart.setDate(wStart.getDate() + weekIdx * 7);
  return toKey(wStart);
}

// Get the year range a tenant spans (start year to current year + 1)
function getTenantYearRange(startDateStr) {
  if (!startDateStr) return [];
  const startYear = parseKey(startDateStr).getFullYear();
  const endYear = new Date().getFullYear() + 1;
  const years = [];
  for (let y = startYear; y <= endYear; y++) years.push(y);
  return years;
}

function fmtShort(d) {
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function fmtDate(d) {
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function todayISO() {
  return toKey(new Date());
}

const ACCENT = "#4ade80";
const ACCENT_DIM = "#16a34a";
const BG = "#0f1117";
const CARD = "#181c26";
const BORDER = "#252a38";
const TEXT = "#e2e8f0";
const MUTED = "#64748b";
const DANGER = "#f87171";

export default function RentTracker() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const [showAddTenant, setShowAddTenant] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newRent, setNewRent] = useState("");
  const [newStartDate, setNewStartDate] = useState(todayISO());

  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const result = await window.storage.get(STORAGE_KEY);
        if (result && result.value) {
          const data = JSON.parse(result.value);
          setTenants(data.tenants || []);
          setSelectedTenant(data.selectedTenant || null);
          if (data.year) setYear(data.year);
        }
      } catch (e) {}
      setLoaded(true);
    }
    load();
  }, []);

  const save = useCallback(async (t, sel, yr) => {
    try {
      await window.storage.set(STORAGE_KEY, JSON.stringify({ tenants: t, selectedTenant: sel, year: yr }));
    } catch (e) {}
  }, []);

  const updateTenants = (updated, sel = selectedTenant, yr = year) => {
    setTenants(updated);
    save(updated, sel, yr);
  };

  const addTenant = () => {
    if (!newName.trim() || !newStartDate) return;
    const tenant = {
      id: Date.now().toString(),
      name: newName.trim(),
      unit: newUnit.trim(),
      weeklyRent: parseFloat(newRent) || 0,
      startDate: newStartDate,
      paidWeeks: {},
    };
    const updated = [...tenants, tenant];
    const startYear = parseKey(newStartDate).getFullYear();
    const viewYear = startYear;
    setYear(viewYear);
    setSelectedTenant(tenant.id);
    updateTenants(updated, tenant.id, viewYear);
    setNewName(""); setNewUnit(""); setNewRent(""); setNewStartDate(todayISO());
    setShowAddTenant(false);
  };

  const deleteTenant = (id) => {
    const updated = tenants.filter((t) => t.id !== id);
    const sel = updated.length > 0 ? updated[0].id : null;
    setSelectedTenant(sel);
    updateTenants(updated, sel, year);
    setConfirmDelete(null);
  };

  const toggleWeek = (key) => {
    const updated = tenants.map((t) => {
      if (t.id !== selectedTenant) return t;
      const pw = { ...t.paidWeeks };
      if (pw[key]) delete pw[key]; else pw[key] = true;
      return { ...t, paidWeeks: pw };
    });
    updateTenants(updated);
  };

  const markAllPaid = () => {
    const weeks = buildTenantWeeks(activeTenant?.startDate, year);
    const updated = tenants.map((t) => {
      if (t.id !== selectedTenant) return t;
      const pw = { ...t.paidWeeks };
      weeks.forEach(w => { pw[w.key] = true; });
      return { ...t, paidWeeks: pw };
    });
    updateTenants(updated);
  };

  const clearYear = () => {
    const weeks = buildTenantWeeks(activeTenant?.startDate, year);
    const updated = tenants.map((t) => {
      if (t.id !== selectedTenant) return t;
      const pw = { ...t.paidWeeks };
      weeks.forEach(w => { delete pw[w.key]; });
      return { ...t, paidWeeks: pw };
    });
    updateTenants(updated);
  };

  const changeYear = (y) => { setYear(y); save(tenants, selectedTenant, y); };

  const activeTenant = tenants.find((t) => t.id === selectedTenant);
  const weeks = activeTenant ? buildTenantWeeks(activeTenant.startDate, year) : [];
  const currentWeekKey = activeTenant ? getCurrentWeekKey(activeTenant.startDate) : null;
  const isCurrentYear = year === currentYear;

  // Stats
  const paidCount = weeks.filter(w => activeTenant?.paidWeeks[w.key]).length;
  const now = new Date(); now.setHours(0,0,0,0);
  const pastWeeks = weeks.filter(w => w.end < now || w.key === currentWeekKey);
  const overdueCount = pastWeeks.filter(w => !activeTenant?.paidWeeks[w.key]).length;
  const totalPaid = activeTenant ? paidCount * activeTenant.weeklyRent : 0;
  const totalOwed = activeTenant ? overdueCount * activeTenant.weeklyRent : 0;

  // Tenant year range for year nav
  const tenantYears = activeTenant ? getTenantYearRange(activeTenant.startDate) : [currentYear];
  const canGoPrev = tenantYears.includes(year - 1);
  const canGoNext = tenantYears.includes(year + 1);

  // Sidebar stats per tenant
  function tenantSidebarStats(t) {
    const now2 = new Date(); now2.setHours(0,0,0,0);
    const cwk = getCurrentWeekKey(t.startDate);
    // All weeks from start up to today
    const allYears = getTenantYearRange(t.startDate);
    let paid = 0, overdue = 0;
    allYears.forEach(y => {
      const wks = buildTenantWeeks(t.startDate, y);
      wks.forEach(w => {
        if (t.paidWeeks[w.key]) { paid++; }
        else if (w.end < now2 || w.key === cwk) { overdue++; }
      });
    });
    // Deduplicate (weeks can appear in two years if they straddle Jan 1)
    // Actually buildTenantWeeks filters by year overlap so we need to deduplicate by key
    const paidKeys = new Set();
    const overdueKeys = new Set();
    allYears.forEach(y => {
      const wks = buildTenantWeeks(t.startDate, y);
      wks.forEach(w => {
        if (t.paidWeeks[w.key]) paidKeys.add(w.key);
        else if (w.end < now2 || w.key === cwk) overdueKeys.add(w.key);
      });
    });
    return { paid: paidKeys.size, overdue: overdueKeys.size };
  }

  if (!loaded) return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: ACCENT, fontFamily: "monospace", letterSpacing: 3 }}>LOADING...</span>
    </div>
  );

  return (
    <div style={{ background: BG, minHeight: "100vh", color: TEXT, fontFamily: "'DM Mono', 'Courier New', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@600;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: ${BG}; }
        ::-webkit-scrollbar-thumb { background: ${BORDER}; border-radius: 3px; }

        .week-row {
          display: grid;
          grid-template-columns: 52px 1fr;
          border-radius: 7px;
          overflow: hidden;
          border: 1px solid transparent;
          transition: transform 0.1s, box-shadow 0.1s;
          cursor: pointer;
          user-select: none;
        }
        .week-row:hover { transform: translateX(3px); }
        .week-row.paid { border-color: #1a4731; }
        .week-row.paid:hover { border-color: #16a34a; box-shadow: 0 0 12px rgba(74,222,128,0.12); }
        .week-row.overdue { border-color: #4c1515; }
        .week-row.overdue:hover { border-color: #dc2626; box-shadow: 0 0 12px rgba(248,113,113,0.12); }
        .week-row.unpaid { border-color: ${BORDER}; }
        .week-row.unpaid:hover { border-color: #3a4255; }
        .week-row.current { box-shadow: 0 0 0 1.5px #f59e0b !important; border-color: #f59e0b !important; }

        .week-stripe {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          padding: 6px 0;
        }
        .week-body {
          display: flex;
          align-items: center;
          padding: 9px 14px;
          gap: 12px;
        }
        .check-icon {
          width: 18px; height: 18px;
          border-radius: 50%;
          border: 1.5px solid;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px;
          flex-shrink: 0;
        }
        .btn-primary {
          background: ${ACCENT}; color: #0a1a0f;
          border: none; padding: 9px 18px; border-radius: 6px;
          cursor: pointer; font-family: inherit; font-size: 13px;
          font-weight: 500; transition: all 0.15s;
        }
        .btn-primary:hover { background: #86efac; }
        .btn-ghost {
          background: transparent; color: ${MUTED};
          border: 1px solid ${BORDER}; padding: 9px 18px; border-radius: 6px;
          cursor: pointer; font-family: inherit; font-size: 13px; transition: all 0.15s;
        }
        .btn-ghost:hover { border-color: ${MUTED}; color: ${TEXT}; }
        .btn-ghost:disabled { opacity: 0.3; cursor: default; }
        .btn-ghost:disabled:hover { border-color: ${BORDER}; color: ${MUTED}; }
        .btn-danger {
          background: transparent; color: ${DANGER};
          border: 1px solid #7f1d1d; padding: 7px 12px; border-radius: 6px;
          cursor: pointer; font-family: inherit; font-size: 12px; transition: all 0.15s;
        }
        .btn-danger:hover { background: #3b1010; }
        .tenant-btn {
          width: 100%; background: transparent; border: 1px solid ${BORDER};
          color: ${MUTED}; padding: 10px 14px; border-radius: 8px;
          cursor: pointer; text-align: left; transition: all 0.15s;
          font-family: inherit; font-size: 13px;
        }
        .tenant-btn:hover { border-color: ${ACCENT_DIM}; color: ${TEXT}; background: #1a1f2e; }
        .tenant-btn.active { border-color: ${ACCENT}; color: ${ACCENT}; background: #0d2318; }
        input[type="text"], input[type="number"], input[type="date"] {
          background: #1a1f2e; border: 1px solid ${BORDER};
          color: ${TEXT}; padding: 9px 12px; border-radius: 6px;
          font-family: inherit; font-size: 13px; width: 100%;
          outline: none; transition: border-color 0.15s;
        }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6); cursor: pointer; }
        input:focus { border-color: ${ACCENT_DIM}; }
        .stat-card {
          background: ${CARD}; border: 1px solid ${BORDER};
          border-radius: 10px; padding: 16px 20px; flex: 1; min-width: 120px;
        }
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.7);
          display: flex; align-items: center; justify-content: center;
          z-index: 100; backdrop-filter: blur(4px);
        }
        .modal {
          background: ${CARD}; border: 1px solid ${BORDER};
          border-radius: 12px; padding: 28px; width: 360px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }
        .year-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 12px; background: rgba(74,222,128,0.08);
          border: 1px solid ${ACCENT_DIM}; border-radius: 20px;
          color: ${ACCENT}; font-size: 13px;
        }
        .no-weeks-msg {
          text-align: center; padding: 60px 20px;
          color: ${MUTED}; font-size: 13px; line-height: 2;
        }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: ACCENT, boxShadow: `0 0 10px ${ACCENT}` }} />
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 19, fontWeight: 800, letterSpacing: 1 }}>RENT LEDGER</span>
        </div>
        {/* Year nav — only shown when a tenant is selected, locked to their valid year range */}
        {activeTenant && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="btn-ghost" style={{ padding: "5px 11px", fontSize: 12 }} onClick={() => changeYear(year - 1)} disabled={!canGoPrev}>← {year - 1}</button>
            <span className="year-pill">{year}</span>
            <button className="btn-ghost" style={{ padding: "5px 11px", fontSize: 12 }} onClick={() => changeYear(year + 1)} disabled={!canGoNext}>{year + 1} →</button>
          </div>
        )}
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 57px)" }}>

        {/* Sidebar */}
        <div style={{ width: 215, borderRight: `1px solid ${BORDER}`, padding: 18, display: "flex", flexDirection: "column", gap: 10, flexShrink: 0, overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
            <span style={{ fontSize: 10, color: MUTED, letterSpacing: 1.5, textTransform: "uppercase" }}>Tenants</span>
            <span style={{ fontSize: 10, color: MUTED }}>{tenants.length}</span>
          </div>
          {tenants.map((t) => {
            const stats = tenantSidebarStats(t);
            const startFmt = t.startDate ? fmtDate(parseKey(t.startDate)) : "—";
            return (
              <button key={t.id} className={`tenant-btn${selectedTenant === t.id ? " active" : ""}`}
                onClick={() => {
                  setSelectedTenant(t.id);
                  // Jump to that tenant's start year if current year has no weeks
                  const startYear = t.startDate ? parseKey(t.startDate).getFullYear() : currentYear;
                  const viewY = year >= startYear ? year : startYear;
                  setYear(viewY);
                  save(tenants, t.id, viewY);
                }}>
                <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                {t.unit && <div style={{ fontSize: 11, opacity: 0.55, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.unit}</div>}
                <div style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>from {startFmt}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: ACCENT_DIM }}>{stats.paid}w paid</span>
                  {stats.overdue > 0 && <span style={{ fontSize: 10, color: DANGER }}>{stats.overdue}w overdue</span>}
                </div>
              </button>
            );
          })}
          <button className="btn-ghost" style={{ fontSize: 12, marginTop: 2 }} onClick={() => setShowAddTenant(true)}>+ Add Tenant</button>
        </div>

        {/* Main */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {!activeTenant ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 14, color: MUTED }}>
              <div style={{ fontSize: 44 }}>🏠</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, color: TEXT }}>No tenant selected</div>
              <div style={{ fontSize: 13 }}>Add a tenant to get started</div>
              <button className="btn-primary" onClick={() => setShowAddTenant(true)}>+ Add First Tenant</button>
            </div>
          ) : (
            <>
              {/* Tenant header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800 }}>{activeTenant.name}</h2>
                  {activeTenant.unit && <div style={{ color: MUTED, fontSize: 13, marginTop: 3 }}>{activeTenant.unit}</div>}
                  <div style={{ display: "flex", gap: 16, marginTop: 5, flexWrap: "wrap" }}>
                    {activeTenant.weeklyRent > 0 && (
                      <span style={{ color: ACCENT_DIM, fontSize: 13 }}>${activeTenant.weeklyRent.toLocaleString("en-AU")}/week</span>
                    )}
                    <span style={{ color: MUTED, fontSize: 13 }}>
                      Tenancy from <span style={{ color: TEXT }}>{fmtDate(parseKey(activeTenant.startDate))}</span>
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="btn-ghost" style={{ fontSize: 12 }} onClick={markAllPaid} disabled={weeks.length === 0}>Mark All Paid</button>
                  <button className="btn-ghost" style={{ fontSize: 12 }} onClick={clearYear} disabled={weeks.length === 0}>Clear {year}</button>
                  <button className="btn-danger" onClick={() => setConfirmDelete(activeTenant.id)}>Delete Tenant</button>
                </div>
              </div>

              {/* Stats */}
              {weeks.length > 0 && (
                <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
                  <div className="stat-card">
                    <div style={{ fontSize: 10, color: MUTED, letterSpacing: 1.2, textTransform: "uppercase" }}>Paid ({year})</div>
                    <div style={{ fontSize: 26, fontWeight: 500, color: ACCENT, marginTop: 4 }}>
                      {paidCount}<span style={{ fontSize: 13, color: MUTED }}>/{weeks.length} wks</span>
                    </div>
                    {activeTenant.weeklyRent > 0 && <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>${totalPaid.toLocaleString("en-AU")} collected</div>}
                  </div>
                  <div className="stat-card">
                    <div style={{ fontSize: 10, color: MUTED, letterSpacing: 1.2, textTransform: "uppercase" }}>Overdue ({year})</div>
                    <div style={{ fontSize: 26, fontWeight: 500, color: overdueCount > 0 ? DANGER : ACCENT, marginTop: 4 }}>
                      {overdueCount}<span style={{ fontSize: 13, color: MUTED }}> wks</span>
                    </div>
                    {activeTenant.weeklyRent > 0 && <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>${totalOwed.toLocaleString("en-AU")} outstanding</div>}
                  </div>
                  <div className="stat-card">
                    <div style={{ fontSize: 10, color: MUTED, letterSpacing: 1.2, textTransform: "uppercase" }}>Coverage</div>
                    <div style={{ fontSize: 26, fontWeight: 500, color: TEXT, marginTop: 4 }}>
                      {weeks.length > 0 ? Math.round((paidCount / weeks.length) * 100) : 0}<span style={{ fontSize: 13, color: MUTED }}>%</span>
                    </div>
                    <div style={{ marginTop: 7, height: 3, background: BORDER, borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${weeks.length > 0 ? (paidCount / weeks.length) * 100 : 0}%`, background: ACCENT, borderRadius: 2, transition: "width 0.3s" }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Legend */}
              {weeks.length > 0 && (
                <div style={{ display: "flex", gap: 18, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
                  {[
                    { bg: "#0a1e12", border: "#1a4731", label: "Paid" },
                    { bg: "#1a0a0a", border: "#4c1515", label: "Overdue" },
                    { bg: CARD, border: BORDER, label: "Unpaid / Upcoming" },
                    { bg: "transparent", border: "#f59e0b", label: "Current Week" },
                  ].map(({ bg, border, label }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 22, height: 10, borderRadius: 3, background: bg, border: `1px solid ${border}` }} />
                      <span style={{ fontSize: 11, color: MUTED }}>{label}</span>
                    </div>
                  ))}
                  <span style={{ fontSize: 11, color: MUTED, marginLeft: "auto" }}>Click any row to toggle</span>
                </div>
              )}

              {/* No weeks message */}
              {weeks.length === 0 && (
                <div className="no-weeks-msg">
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
                  <div style={{ color: TEXT, fontSize: 15, fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 8 }}>No weeks in {year}</div>
                  <div>This tenant's tenancy starts <strong style={{ color: TEXT }}>{fmtDate(parseKey(activeTenant.startDate))}</strong>.</div>
                  <div style={{ marginTop: 6 }}>
                    Use the year arrows to navigate to{" "}
                    <button style={{ background: "none", border: "none", color: ACCENT, cursor: "pointer", fontFamily: "inherit", fontSize: 13, textDecoration: "underline" }}
                      onClick={() => changeYear(parseKey(activeTenant.startDate).getFullYear())}>
                      {parseKey(activeTenant.startDate).getFullYear()}
                    </button>
                    {" "}or later.
                  </div>
                </div>
              )}

              {/* Week rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {weeks.map(({ weekNum, start, end, key }) => {
                  const isPaid = !!activeTenant.paidWeeks[key];
                  const isCurrent = key === currentWeekKey;
                  const isOverdue = !isPaid && (end < now || isCurrent);
                  const isFuture = !isCurrent && start > now;

                  let rowClass = "week-row";
                  let stripeColor, stripeTextColor, bodyBg, dateColor, statusText, statusColor;

                  if (isPaid) {
                    rowClass += " paid";
                    stripeColor = "#0d3320"; stripeTextColor = ACCENT_DIM;
                    bodyBg = "#0a1e12"; dateColor = "#86efac";
                    statusText = "PAID"; statusColor = ACCENT;
                  } else if (isOverdue) {
                    rowClass += " overdue";
                    stripeColor = "#2a0e0e"; stripeTextColor = "#b91c1c";
                    bodyBg = "#1a0a0a"; dateColor = "#fca5a5";
                    statusText = isCurrent ? "DUE NOW" : "OVERDUE"; statusColor = DANGER;
                  } else {
                    rowClass += " unpaid";
                    stripeColor = "#141824"; stripeTextColor = "#3a4255";
                    bodyBg = CARD; dateColor = isFuture ? "#475569" : MUTED;
                    statusText = "UPCOMING"; statusColor = "#3a4255";
                  }
                  if (isCurrent) rowClass += " current";

                  return (
                    <div key={key} className={rowClass} onClick={() => toggleWeek(key)}>
                      {/* Left stripe: week number since tenancy start */}
                      <div className="week-stripe" style={{ background: stripeColor }}>
                        <span style={{ fontSize: 8, color: stripeTextColor, letterSpacing: 0.5 }}>WK</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: stripeTextColor }}>{weekNum}</span>
                      </div>
                      <div className="week-body" style={{ background: bodyBg }}>
                        {/* Date range */}
                        <div style={{ flex: 1, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 500, color: dateColor, minWidth: 64 }}>{fmtShort(start)}</span>
                          <span style={{ color: MUTED, fontSize: 11 }}>→</span>
                          <span style={{ fontSize: 14, fontWeight: 500, color: dateColor, minWidth: 64 }}>{fmtShort(end)}</span>
                          {isCurrent && (
                            <span style={{ fontSize: 9, color: "#f59e0b", background: "rgba(245,158,11,0.12)", padding: "2px 8px", borderRadius: 10, letterSpacing: 0.5 }}>
                              THIS WEEK
                            </span>
                          )}
                        </div>
                        {/* Rent amount */}
                        {activeTenant.weeklyRent > 0 && (
                          <div style={{ fontSize: 12, color: isPaid ? ACCENT_DIM : isOverdue ? "#b91c1c" : MUTED, minWidth: 58, textAlign: "right", flexShrink: 0 }}>
                            ${activeTenant.weeklyRent.toLocaleString("en-AU")}
                          </div>
                        )}
                        {/* Status */}
                        <div style={{ fontSize: 11, color: statusColor, minWidth: 70, textAlign: "right", letterSpacing: 0.4, flexShrink: 0 }}>
                          {statusText}
                        </div>
                        {/* Checkbox */}
                        <div className="check-icon" style={{ borderColor: isPaid ? ACCENT : isOverdue ? DANGER : BORDER, color: isPaid ? ACCENT : isOverdue ? DANGER : BORDER, background: isPaid ? "rgba(74,222,128,0.1)" : "transparent" }}>
                          {isPaid ? "✓" : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Tenant Modal */}
      {showAddTenant && (
        <div className="modal-overlay" onClick={() => setShowAddTenant(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 6px", fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800 }}>Add New Tenant</h3>
            <p style={{ color: MUTED, fontSize: 12, margin: "0 0 20px", lineHeight: 1.6 }}>Weeks will be counted from the tenancy start date, each covering exactly 7 days.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 10, color: MUTED, letterSpacing: 1.2, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Tenant Name *</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. John Smith" autoFocus onKeyDown={(e) => e.key === "Enter" && addTenant()} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: MUTED, letterSpacing: 1.2, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Tenancy Start Date *</label>
                <input type="date" value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)} />
                <div style={{ fontSize: 11, color: MUTED, marginTop: 5 }}>Week 1 will begin on this date</div>
              </div>
              <div>
                <label style={{ fontSize: 10, color: MUTED, letterSpacing: 1.2, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Unit / Property</label>
                <input type="text" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} placeholder="e.g. Unit 2B, 123 Main St" />
              </div>
              <div>
                <label style={{ fontSize: 10, color: MUTED, letterSpacing: 1.2, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Weekly Rent ($)</label>
                <input type="number" value={newRent} onChange={(e) => setNewRent(e.target.value)} placeholder="e.g. 450" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={addTenant} disabled={!newName.trim() || !newStartDate}>Add Tenant</button>
              <button className="btn-ghost" onClick={() => setShowAddTenant(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 12px", fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: DANGER }}>Delete Tenant?</h3>
            <p style={{ color: MUTED, fontSize: 13, margin: "0 0 22px", lineHeight: 1.6 }}>
              This will permanently remove <strong style={{ color: TEXT }}>{tenants.find(t => t.id === confirmDelete)?.name}</strong> and all their payment history.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-danger" style={{ flex: 1, padding: 10 }} onClick={() => deleteTenant(confirmDelete)}>Yes, Delete</button>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
