import { useState, useMemo, useEffect } from "react";

const COLORS = {
  bg: "#0f1117", surface: "#1a1d27", card: "#22263a", border: "#2e3354",
  green: "#4ade80", red: "#f87171", orange: "#fb923c", blue: "#60a5fa",
  yellow: "#fbbf24", purple: "#a78bfa", text: "#f1f5f9", muted: "#94a3b8", accent: "#38bdf8",
};

const INCOME_CATS = [
  { id: "salary", label: "เงินเดือน", icon: "💼" },
  { id: "allowance", label: "เบี้ยเลี้ยง", icon: "📋" },
  { id: "extra", label: "รายได้พิเศษ", icon: "✨" },
];
const EXPENSE_CATS = [
  { id: "rent", label: "ห้องพัก", icon: "🏠" },
  { id: "food", label: "อาหาร", icon: "🍱" },
  { id: "fuel", label: "น้ำมัน", icon: "⛽" },
  { id: "maintain", label: "ดูแลรักษา", icon: "🔧" },
  { id: "water", label: "น้ำดื่ม", icon: "💧" },
  { id: "debt", label: "คืนหนี้", icon: "🏦" },
  { id: "credit", label: "บัตรเครดิต", icon: "💳" },
  { id: "goods", label: "ของใช้", icon: "🛒" },
  { id: "phone", label: "มือถือ", icon: "📱" },
  { id: "other", label: "อื่นๆ", icon: "📦" },
];
const EXPENSE_COLORS = {
  rent: "#f87171", food: "#fb923c", fuel: "#fbbf24", maintain: "#4ade80",
  water: "#60a5fa", debt: "#a78bfa", credit: "#f472b6",
  goods: "#34d399", phone: "#38bdf8", other: "#94a3b8",
};

const DEMO = [
  { id: 1, type: "income", category: "salary", amount: 25000, note: "เงินเดือนมิถุนายน", date: "2026-06-01" },
  { id: 2, type: "expense", category: "rent", amount: 4500, note: "ค่าห้องพัก", date: "2026-06-01" },
  { id: 3, type: "expense", category: "food", amount: 1200, note: "อาหารสัปดาห์แรก", date: "2026-06-03" },
  { id: 4, type: "expense", category: "fuel", amount: 500, note: "เติมน้ำมัน PTT", date: "2026-06-05", fuelLiters: 25, fuelPrice: 20, odometer: 45200 },
  { id: 5, type: "income", category: "extra", amount: 3000, note: "งานพิเศษ wedding", date: "2026-06-08" },
];

function formatMoney(n) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function FuelGauge({ pct }) {
  const r = 70, cx = 90, cy = 90;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const arcX = (deg) => cx + r * Math.cos(toRad(deg));
  const arcY = (deg) => cy + r * Math.sin(toRad(deg));
  const startDeg = -225;
  const angle = startDeg + pct * 2.7;
  const needleRad = toRad(angle);
  const nx = cx + 55 * Math.cos(needleRad);
  const ny = cy + 55 * Math.sin(needleRad);
  const color = pct < 25 ? "#f87171" : pct < 60 ? "#fbbf24" : "#4ade80";
  return (
    <svg viewBox="0 0 180 120" style={{ width: "100%", maxWidth: 220 }}>
      <path d={`M ${arcX(startDeg)} ${arcY(startDeg)} A ${r} ${r} 0 1 1 ${arcX(45)} ${arcY(45)}`} fill="none" stroke="#2e3354" strokeWidth="12" strokeLinecap="round" />
      <path d={`M ${arcX(startDeg)} ${arcY(startDeg)} A ${r} ${r} 0 ${pct > 50 ? 1 : 0} 1 ${arcX(startDeg + pct * 2.7)} ${arcY(startDeg + pct * 2.7)}`} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#f1f5f9" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="5" fill="#f1f5f9" />
      <text x="25" y="108" fill="#94a3b8" fontSize="9" textAnchor="middle">E</text>
      <text x="155" y="108" fill="#94a3b8" fontSize="9" textAnchor="middle">F</text>
      <text x={cx} y="78" fill={color} fontSize="14" fontWeight="bold" textAnchor="middle">{Math.round(pct)}%</text>
    </svg>
  );
}

function MiniBar({ data, max }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {data.map((item, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontSize: 12, color: COLORS.text }}>{item.icon} {item.label}</span>
            <span style={{ fontSize: 12, color: COLORS.muted }}>฿{formatMoney(item.value)}</span>
          </div>
          <div style={{ background: COLORS.border, borderRadius: 99, height: 6 }}>
            <div style={{ background: item.color, borderRadius: 99, height: 6, width: `${max > 0 ? (item.value / max) * 100 : 0}%`, transition: "width 0.5s ease" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

async function sendLineMessage(token, userId, text) {
  if (!token || !userId) return;
  try {
    await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ to: userId, messages: [{ type: "text", text }] }),
    });
  } catch {}
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [records, setRecords] = useState(() => {
    try {
      const s = localStorage.getItem("expense_records");
      return s ? JSON.parse(s) : DEMO;
    } catch {
      return DEMO;
    }
  });
  const [form, setForm] = useState({
    type: "expense",
    category: "",
    amount: "",
    note: "",
    date: new Date().toISOString().slice(0, 10),
    fuelLiters: "",
    fuelPrice: "",
    odometer: "",
  });
  const [toast, setToast] = useState(null);
  const [lineModal, setLineModal] = useState(false);
  const [lineToken, setLineToken] = useState(() => localStorage.getItem("line_token") || "");
  const [lineUserId, setLineUserId] = useState(() => localStorage.getItem("line_user_id") || "");
  const [showSettings, setShowSettings] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem("expense_records", JSON.stringify(records));
    } catch {}
  }, [records]);

  function showToast(msg, color = "#4ade80") {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSubmit() {
    if (!form.category || !form.amount) {
      showToast("กรุณากรอกหมวดหมู่และจำนวนเงิน", "#f87171");
      return;
    }
    const newRec = {
      ...form,
      id: Date.now(),
      amount: parseFloat(form.amount),
      fuelLiters: form.fuelLiters ? parseFloat(form.fuelLiters) : null,
      fuelPrice: form.fuelPrice ? parseFloat(form.fuelPrice) : null,
      odometer: form.odometer ? parseFloat(form.odometer) : null,
    };
    const updated = [newRec, ...records];
    setRecords(updated);

    const cat = [...INCOME_CATS, ...EXPENSE_CATS].find((c) => c.id === form.category);
    const inc = updated.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0);
    const exp = updated.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);
    const sign = form.type === "income" ? "+" : "-";
    const msg = `${form.type === "income" ? "💰 รายรับ" : "💸 รายจ่าย"}: ${cat?.label}\n${sign}฿${parseFloat(form.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}\n📅 ${form.date}${form.note ? "\n📝 " + form.note : ""}\n\n💼 คงเหลือ: ${inc - exp >= 0 ? "+" : ""}฿${(inc - exp).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;
    await sendLineMessage(lineToken, lineUserId, msg);

    setForm({
      type: "expense",
      category: "",
      amount: "",
      note: "",
      date: new Date().toISOString().slice(0, 10),
      fuelLiters: "",
      fuelPrice: "",
      odometer: "",
    });
    showToast("✓ บันทึกแล้ว!");
    setPage("dashboard");
  }

  function deleteRecord(id) {
    setDeleteConfirm(null);
    setRecords((prev) => prev.filter((r) => r.id !== id));
    showToast("ลบแล้ว");
  }

  function clearAllData() {
    if (confirm("ลบข้อมูลทั้งหมด? ไม่สามารถกู้คืนได้")) {
      setRecords([]);
      localStorage.removeItem("expense_records");
      showToast("ลบข้อมูลทั้งหมดแล้ว", "#f87171");
    }
  }

  // ── Aggregations ──
  const thisMonth = useMemo(() => {
    const now = new Date();
    return records.filter((r) => {
      const d = new Date(r.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [records]);

  const totalIncome = useMemo(
    () => thisMonth.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0),
    [thisMonth]
  );
  const totalExpense = useMemo(
    () => thisMonth.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0),
    [thisMonth]
  );
  const balance = totalIncome - totalExpense;

  const expenseByCategory = useMemo(() => {
    const map = {};
    thisMonth
      .filter((r) => r.type === "expense")
      .forEach((r) => {
        map[r.category] = (map[r.category] || 0) + r.amount;
      });
    return EXPENSE_CATS.map((c) => ({ ...c, value: map[c.id] || 0, color: EXPENSE_COLORS[c.id] }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [thisMonth]);

  const fuelRecords = useMemo(
    () =>
      records
        .filter((r) => r.type === "expense" && r.category === "fuel" && r.fuelLiters)
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [records]
  );

  const lastFuel = fuelRecords[0];
  const fuelPct = lastFuel ? Math.min(100, Math.max(0, (lastFuel.fuelLiters / 40) * 100)) : 0;

  const avgConsumption = useMemo(() => {
    if (fuelRecords.length < 2) return null;
    const sorted = [...fuelRecords].sort((a, b) => a.odometer - b.odometer);
    const totalLiters = sorted.slice(0, -1).reduce((s, r) => s + r.fuelLiters, 0);
    const totalKm = sorted[sorted.length - 1].odometer - sorted[0].odometer;
    return totalKm > 0 ? (totalLiters / totalKm) * 100 : null;
  }, [fuelRecords]);

  const s = {
    wrap: {
      background: COLORS.bg,
      minHeight: "100vh",
      color: COLORS.text,
      fontFamily: "'Sarabun','Noto Sans Thai',sans-serif",
      maxWidth: 1200,
      margin: "0 auto",
      position: "relative",
      display: "flex",
      flexDirection: "column",
    },
    header: {
      background: COLORS.surface,
      padding: "16px 24px",
      borderBottom: `1px solid ${COLORS.border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      position: "sticky",
      top: 0,
      zIndex: 50,
    },
    main: { flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 20 },
    card: { background: COLORS.card, borderRadius: 16, padding: 20, border: `1px solid ${COLORS.border}` },
    input: {
      background: COLORS.surface,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 10,
      padding: "12px 16px",
      color: COLORS.text,
      fontSize: 14,
      width: "100%",
      boxSizing: "border-box",
      outline: "none",
      fontFamily: "inherit",
    },
    label: { fontSize: 13, color: COLORS.muted, marginBottom: 6, display: "block", fontWeight: 600 },
    btn: (c, textColor = "#000") => ({
      background: c,
      border: "none",
      borderRadius: 12,
      padding: "12px 20px",
      color: textColor,
      fontWeight: 700,
      fontSize: 14,
      cursor: "pointer",
      fontFamily: "inherit",
      transition: "opacity 0.2s",
    }),
    gridCol2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 },
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
  };

  // ── Pages ──
  const Dashboard = () => (
    <>
      {/* Summary Cards */}
      <div style={s.gridCol2}>
        <div style={s.card}>
          <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 8 }}>
            {new Date().toLocaleDateString("th-TH", { month: "long", year: "numeric" })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: COLORS.green, marginBottom: 4 }}>▲ รายรับ</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>฿{formatMoney(totalIncome)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: COLORS.red, marginBottom: 4 }}>▼ รายจ่าย</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>฿{formatMoney(totalExpense)}</div>
            </div>
          </div>
          <div
            style={{
              borderTop: `1px solid ${COLORS.border}`,
              paddingTop: 12,
              marginTop: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 14, color: COLORS.muted }}>คงเหลือ</span>
            <span
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: balance >= 0 ? COLORS.green : COLORS.red,
              }}
            >
              {balance >= 0 ? "+" : ""}฿{formatMoney(balance)}
            </span>
          </div>
        </div>

        {/* Fuel Widget */}
        <div style={s.card}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>⛽ น้ำมัน</div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <FuelGauge pct={fuelPct} />
            </div>
            <div style={{ flex: 1 }}>
              {lastFuel ? (
                <>
                  <div style={{ fontSize: 12, color: COLORS.muted }}>เติมล่าสุด</div>
                  <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{lastFuel.fuelLiters} ลิตร</div>
                  <div style={{ fontSize: 12, color: COLORS.muted }}>฿{formatMoney(lastFuel.amount)}</div>
                  <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 6 }}>
                    {formatDate(lastFuel.date)}
                  </div>
                  {avgConsumption && (
                    <div style={{ fontSize: 12, color: COLORS.yellow, marginTop: 8, fontWeight: 600 }}>
                      🔥 {avgConsumption.toFixed(1)} ล./100กม.
                    </div>
                  )}
                </>
              ) : (
                <div style={{ fontSize: 13, color: COLORS.muted }}>ยังไม่มีข้อมูล</div>
              )}
            </div>
          </div>
          <button
            onClick={() => setPage("fuel")}
            style={{ ...s.btn(COLORS.yellow, "#000"), marginTop: 12, width: "100%" }}
          >
            ดูรายละเอียดน้ำมัน →
          </button>
        </div>
      </div>

      {/* Expense Breakdown */}
      {expenseByCategory.length > 0 && (
        <div style={s.card}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>📊 รายจ่ายแยกประเภท</div>
          <MiniBar data={expenseByCategory} max={expenseByCategory[0]?.value || 1} />
        </div>
      )}

      {/* Recent Transactions */}
      <div style={s.card}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>🕐 รายการล่าสุด</div>
        {records.length === 0 ? (
          <div style={{ color: COLORS.muted, textAlign: "center", padding: 20 }}>ยังไม่มีรายการ</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {records.slice(0, 10).map((r) => {
              const cat = [...INCOME_CATS, ...EXPENSE_CATS].find((c) => c.id === r.category);
              return (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    paddingBottom: 12,
                    marginBottom: 12,
                    borderBottom: `1px solid ${COLORS.border}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: 1 }}>
                    <span style={{ fontSize: 24 }}>{cat?.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{cat?.label}</div>
                      <div style={{ fontSize: 12, color: COLORS.muted }}>{r.note}</div>
                      <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 3 }}>
                        {formatDate(r.date)}
                        {r.fuelLiters && ` · ⛽ ${r.fuelLiters}ล. @ ฿${r.fuelPrice}/ล.`}
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 15,
                      color: r.type === "income" ? COLORS.green : COLORS.red,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.type === "income" ? "+" : "-"}฿{formatMoney(r.amount)}
                  </span>
                </div>
              );
            })}
            {records.length > 10 && (
              <button
                onClick={() => setPage("history")}
                style={{
                  background: "none",
                  border: "none",
                  color: COLORS.accent,
                  cursor: "pointer",
                  fontWeight: 600,
                  padding: 0,
                }}
              >
                ดูทั้งหมด ({records.length}) →
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );

  const AddTransaction = () => (
    <div style={s.card}>
      <h2 style={{ marginTop: 0 }}>เพิ่มรายการ</h2>

      <div style={{ marginBottom: 20 }}>
        <label style={s.label}>ประเภท</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {["expense", "income"].map((t) => (
            <button
              key={t}
              onClick={() => setForm((f) => ({ ...f, type: t, category: "" }))}
              style={{
                ...s.btn(form.type === t ? (t === "income" ? COLORS.green : COLORS.red) : COLORS.border),
                color: form.type === t ? "#000" : COLORS.muted,
              }}
            >
              {t === "income" ? "💰 รายรับ" : "💸 รายจ่าย"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={s.label}>หมวดหมู่</label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
            gap: 10,
          }}
        >
          {(form.type === "income" ? INCOME_CATS : EXPENSE_CATS).map((c) => (
            <button
              key={c.id}
              onClick={() => setForm((f) => ({ ...f, category: c.id }))}
              style={{
                background: form.category === c.id ? COLORS.accent : COLORS.surface,
                border: `1px solid ${form.category === c.id ? COLORS.accent : COLORS.border}`,
                borderRadius: 10,
                padding: "10px",
                color: form.category === c.id ? "#000" : COLORS.text,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "center",
                fontWeight: form.category === c.id ? 700 : 500,
              }}
            >
              {c.icon}
              <div style={{ marginTop: 4, fontSize: 11 }}>{c.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div>
          <label style={s.label}>จำนวนเงิน (฿)</label>
          <input
            type="number"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            style={{ ...s.input, fontSize: 18, fontWeight: 700 }}
          />
        </div>
        <div>
          <label style={s.label}>วันที่</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            style={s.input}
          />
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={s.label}>หมายเหตุ</label>
        <input
          type="text"
          placeholder="บันทึกเพิ่มเติม..."
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          style={s.input}
        />
      </div>

      {form.category === "fuel" && (
        <div
          style={{
            background: COLORS.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            border: `1px solid ${COLORS.yellow}44`,
          }}
        >
          <div style={{ fontSize: 14, color: COLORS.yellow, marginBottom: 12, fontWeight: 700 }}>
            ⛽ ข้อมูลน้ำมัน
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
            <div>
              <label style={s.label}>จำนวนลิตร</label>
              <input
                type="number"
                placeholder="25"
                value={form.fuelLiters}
                onChange={(e) => setForm((f) => ({ ...f, fuelLiters: e.target.value }))}
                style={s.input}
              />
            </div>
            <div>
              <label style={s.label}>ราคา/ลิตร</label>
              <input
                type="number"
                placeholder="20"
                value={form.fuelPrice}
                onChange={(e) => setForm((f) => ({ ...f, fuelPrice: e.target.value }))}
                style={s.input}
              />
            </div>
            <div>
              <label style={s.label}>เลขไมล์ (กม.)</label>
              <input
                type="number"
                placeholder="45000"
                value={form.odometer}
                onChange={(e) => setForm((f) => ({ ...f, odometer: e.target.value }))}
                style={s.input}
              />
            </div>
          </div>
        </div>
      )}

      <button onClick={handleSubmit} style={{ ...s.btn(COLORS.accent), width: "100%", padding: "16px" }}>
        ✓ บันทึกรายการ
      </button>
    </div>
  );

  const History = () => (
    <div style={s.card}>
      <h2 style={{ marginTop: 0, marginBottom: 20 }}>ประวัติทั้งหมด ({records.length})</h2>
      {records.length === 0 ? (
        <div style={{ color: COLORS.muted, textAlign: "center", padding: 40 }}>ยังไม่มีรายการ</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {records.map((r) => {
            const cat = [...INCOME_CATS, ...EXPENSE_CATS].find((c) => c.id === r.category);
            return (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: 12,
                  marginBottom: 12,
                  borderBottom: `1px solid ${COLORS.border}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: 1 }}>
                  <span style={{ fontSize: 24, marginTop: 2 }}>{cat?.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{cat?.label}</div>
                    <div style={{ fontSize: 12, color: COLORS.muted }}>{r.note}</div>
                    <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 3 }}>
                      {formatDate(r.date)}
                      {r.fuelLiters && ` · ⛽ ${r.fuelLiters}ล. @ ฿${r.fuelPrice}/ล.`}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 15,
                      color: r.type === "income" ? COLORS.green : COLORS.red,
                    }}
                  >
                    {r.type === "income" ? "+" : "-"}฿{formatMoney(r.amount)}
                  </span>
                  <button
                    onClick={() => setDeleteConfirm(r.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: COLORS.muted,
                      cursor: "pointer",
                      fontSize: 18,
                      padding: 0,
                    }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <button
        onClick={clearAllData}
        style={{
          ...s.btn(COLORS.red, "#fff"),
          width: "100%",
          marginTop: 20,
        }}
      >
        ลบข้อมูลทั้งหมด
      </button>
    </div>
  );

  const FuelTracking = () => (
    <>
      <div style={s.card}>
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>⛽ ติดตามการเติมน้ำมัน</h2>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <FuelGauge pct={fuelPct} />
        </div>
        {avgConsumption && (
          <div style={{ textAlign: "center", padding: 16, background: COLORS.surface, borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: COLORS.muted }}>อัตราสิ้นเปลือง</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.yellow }}>
              {avgConsumption.toFixed(1)} ล./100กม.
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
        {[
          {
            label: "ค่าน้ำมันเดือนนี้",
            value: `฿${formatMoney(thisMonth.filter((r) => r.category === "fuel").reduce((s, r) => s + r.amount, 0))}`,
            icon: "💰",
            color: COLORS.orange,
          },
          {
            label: "ลิตรรวมเดือนนี้",
            value: `${fuelRecords.filter((r) => { const d = new Date(r.date); const n = new Date(); return d.getMonth() === n.getMonth(); }).reduce((s, r) => s + (r.fuelLiters || 0), 0)} ล.`,
            icon: "🧪",
            color: COLORS.blue,
          },
          {
            label: "ครั้งที่เติม",
            value: `${fuelRecords.length} ครั้ง`,
            icon: "🔄",
            color: COLORS.purple,
          },
          {
            label: "เฉลี่ย/ครั้ง",
            value: fuelRecords.length ? `฿${formatMoney(fuelRecords.reduce((s, r) => s + r.amount, 0) / fuelRecords.length)}` : "-",
            icon: "📊",
            color: COLORS.green,
          },
        ].map((item, i) => (
          <div key={i} style={{ ...s.card, textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: item.color }}>{item.value}</div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 8 }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div style={s.card}>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>ประวัติการเติม</h3>
        {fuelRecords.length === 0 ? (
          <div style={{ color: COLORS.muted, textAlign: "center", padding: 20 }}>ยังไม่มีข้อมูล</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {fuelRecords.map((r, i) => {
              const kmSinceLast =
                i < fuelRecords.length - 1 ? r.odometer - fuelRecords[i + 1].odometer : null;
              return (
                <div
                  key={r.id}
                  style={{
                    paddingBottom: 12,
                    marginBottom: 12,
                    borderBottom: `1px solid ${COLORS.border}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, color: COLORS.yellow, fontSize: 16 }}>
                      ⛽ {r.fuelLiters} ลิตร
                    </span>
                    <span style={{ color: COLORS.red, fontWeight: 700 }}>฿{formatMoney(r.amount)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.muted }}>
                    {formatDate(r.date)} · ฿{r.fuelPrice}/ล.
                    {r.odometer && ` · ไมล์ ${r.odometer.toLocaleString()} กม.`}
                    {kmSinceLast > 0 && ` · วิ่ง ${kmSinceLast} กม.`}
                  </div>
                  {r.note && (
                    <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>{r.note}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div style={s.wrap}>
      {/* Header */}
      <div style={s.header}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>📊 รายรับ-รายจ่าย</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setLineModal(true)} style={{ ...s.btn("#06c75533", "#06c755"), padding: "10px 14px", fontSize: 12 }}>
            💬 LINE
          </button>
          <button onClick={() => setShowSettings(!showSettings)} style={{ ...s.btn(COLORS.border, COLORS.text), padding: "10px 14px", fontSize: 12 }}>
            ⚙️
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ borderBottom: `1px solid ${COLORS.border}`, background: COLORS.surface, padding: "12px 24px", display: "flex", gap: 8, overflowX: "auto" }}>
        {[
          { id: "dashboard", label: "📊 ภาพรวม" },
          { id: "add", label: "➕ เพิ่มรายการ" },
          { id: "fuel", label: "⛽ น้ำมัน" },
          { id: "history", label: "📋 ประวัติ" },
        ].map((n) => (
          <button
            key={n.id}
            onClick={() => setPage(n.id)}
            style={{
              background: page === n.id ? COLORS.accent : "none",
              border: `1px solid ${page === n.id ? COLORS.accent : COLORS.border}`,
              borderRadius: 8,
              padding: "8px 14px",
              color: page === n.id ? "#000" : COLORS.text,
              cursor: "pointer",
              fontWeight: page === n.id ? 700 : 500,
              whiteSpace: "nowrap",
              fontSize: 13,
              fontFamily: "inherit",
            }}
          >
            {n.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main style={s.main}>
        {page === "dashboard" && <Dashboard />}
        {page === "add" && <AddTransaction />}
        {page === "history" && <History />}
        {page === "fuel" && <FuelTracking />}
      </main>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: toast.color,
            color: "#000",
            fontWeight: 700,
            fontSize: 14,
            padding: "12px 24px",
            borderRadius: 99,
            zIndex: 300,
            boxShadow: "0 4px 20px #0008",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#000a",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: COLORS.card,
              borderRadius: 16,
              padding: 24,
              border: `1px solid ${COLORS.border}`,
              maxWidth: 320,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>ลบรายการนี้?</div>
            <div style={{ color: COLORS.muted, fontSize: 14, marginBottom: 20 }}>ไม่สามารถกู้คืนได้</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{ ...s.btn(COLORS.border, COLORS.text) }}
              >
                ยกเลิก
              </button>
              <button
                onClick={() => deleteRecord(deleteConfirm)}
                style={{ ...s.btn(COLORS.red, "#fff") }}
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LINE Modal */}
      {lineModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#000b",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setLineModal(false)}
        >
          <div
            style={{
              background: COLORS.surface,
              borderRadius: 20,
              padding: 28,
              border: `1px solid ${COLORS.border}`,
              maxWidth: 500,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 4 }}>💬 LINE Messaging API</div>
            <div style={{ fontSize: 13, color: COLORS.yellow, background: "#fbbf2415", borderRadius: 8, padding: 10, marginBottom: 20 }}>
              LINE Notify ปิดบริการแล้ว → ใช้ LINE Messaging API แทน
            </div>

            <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 12, fontWeight: 700 }}>
              วิธีตั้งค่า (ทำครั้งเดียว)
            </div>

            {[
              { step: "เข้า developers.line.biz → Login → Create provider", sub: "" },
              { step: "สร้าง Channel เลือก Messaging API", sub: "กรอกชื่อและ Category" },
              { step: "Basic settings → คัดลอก User ID", sub: "เริ่มด้วย U..." },
              { step: "Messaging API tab → Issue token", sub: "คัดลอก long-lived token" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 12, fontSize: 13 }}>
                <div
                  style={{
                    background: "#06c755",
                    borderRadius: "50%",
                    width: 28,
                    height: 28,
                    minWidth: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 800,
                  }}
                >
                  {i + 1}
                </div>
                <div>
                  <div style={{ color: COLORS.text, lineHeight: 1.5 }}>{item.step}</div>
                  {item.sub && <div style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>{item.sub}</div>}
                </div>
              </div>
            ))}

            <div style={{ display: "flex", flexDirection: "column", gap: 12, margin: "16px 0" }}>
              <div>
                <label style={s.label}>User ID</label>
                <input
                  type="text"
                  placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={lineUserId}
                  onChange={(e) => setLineUserId(e.target.value)}
                  style={{ ...s.input, fontFamily: "monospace", fontSize: 12 }}
                />
              </div>
              <div>
                <label style={s.label}>Channel Access Token</label>
                <input
                  type="password"
                  placeholder="Token..."
                  value={lineToken}
                  onChange={(e) => setLineToken(e.target.value)}
                  style={{ ...s.input, fontFamily: "monospace", fontSize: 12 }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => setLineModal(false)} style={{ ...s.btn(COLORS.border, COLORS.text) }}>
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  localStorage.setItem("line_token", lineToken);
                  localStorage.setItem("line_user_id", lineUserId);
                  setLineModal(false);
                  showToast("✓ บันทึกการตั้งค่า LINE!");
                }}
                style={{ ...s.btn("#06c755", "#fff") }}
              >
                💬 บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings */}
      {showSettings && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#000b",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowSettings(false)}
        >
          <div
            style={{
              background: COLORS.surface,
              borderRadius: 20,
              padding: 28,
              border: `1px solid ${COLORS.border}`,
              maxWidth: 400,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 20 }}>⚙️ ตั้งค่า</div>
            <button
              onClick={() => {
                setShowSettings(false);
                setLineModal(true);
              }}
              style={{ ...s.btn(COLORS.accent), width: "100%", marginBottom: 10 }}
            >
              💬 ตั้งค่า LINE Notify
            </button>
            <button onClick={() => setShowSettings(false)} style={{ ...s.btn(COLORS.border, COLORS.text), width: "100%" }}>
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
