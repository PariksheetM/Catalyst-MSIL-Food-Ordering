"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FIELD_DEFS,
  DEFAULT_FIELD_ORDER,
  normalizeOrder,
  type FieldKey,
} from "@/lib/fields";

type Record = {
  id: number;
  entry_date: string;
  paratha_qty: number;
  emp_name: string;
  meal_type: string;
  item_name: string;
  rate: number;
  created_at: string;
};

const STORAGE_KEY = "paratha_admin_pw";

export default function AdminPage() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  // Field-order editor state.
  const [showOrder, setShowOrder] = useState(false);
  const [order, setOrder] = useState<FieldKey[]>(DEFAULT_FIELD_ORDER);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderMsg, setOrderMsg] = useState<{ ok: boolean; text: string } | null>(
    null
  );

  async function loadOrder() {
    try {
      const res = await fetch("/api/fields", { cache: "no-store" });
      const d = await res.json();
      if (d?.order) setOrder(normalizeOrder(d.order));
    } catch {}
  }

  async function load(password: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/records", {
        headers: { "x-admin-password": password },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load records.");
        setAuthed(false);
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {}
        return;
      }
      setRecords(data.records || []);
      setAuthed(true);
      try {
        sessionStorage.setItem(STORAGE_KEY, password);
      } catch {}
      loadOrder();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPw(saved);
        load(saved);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onLogin(e: React.FormEvent) {
    e.preventDefault();
    if (pw) load(pw);
  }

  function logout() {
    setAuthed(false);
    setPw("");
    setRecords([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  function moveField(index: number, dir: -1 | 1) {
    setOrderMsg(null);
    setOrder((prev) => {
      const arr = [...prev];
      const j = index + dir;
      if (j < 0 || j >= arr.length) return prev;
      [arr[index], arr[j]] = [arr[j], arr[index]];
      return arr;
    });
  }

  async function saveOrder() {
    setSavingOrder(true);
    setOrderMsg(null);
    try {
      const res = await fetch("/api/fields", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": pw,
        },
        body: JSON.stringify({ order }),
      });
      const d = await res.json();
      if (!res.ok) {
        setOrderMsg({ ok: false, text: d.error || "Could not save." });
      } else {
        setOrder(normalizeOrder(d.order));
        setOrderMsg({
          ok: true,
          text: "Saved. The submission form now uses this order.",
        });
      }
    } catch {
      setOrderMsg({ ok: false, text: "Network error. Please try again." });
    } finally {
      setSavingOrder(false);
    }
  }

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (r) =>
        r.emp_name.toLowerCase().includes(q) ||
        r.meal_type.toLowerCase().includes(q) ||
        r.item_name.toLowerCase().includes(q) ||
        r.entry_date.includes(q)
    );
  }, [records, filter]);

  const totalParathas = useMemo(
    () => filtered.reduce((sum, r) => sum + (r.paratha_qty || 0), 0),
    [filtered]
  );

  const totalAmount = useMemo(
    () =>
      filtered.reduce(
        (sum, r) => sum + (r.rate || 0) * (r.paratha_qty || 0),
        0
      ),
    [filtered]
  );

  return (
    <div className="wrap">
      <div className="topbar">
        <div className="brand">
          <span className="dot">C</span>
          <span>Catalyst-MSIL Food Ordering · Admin</span>
        </div>
      </div>

      {!authed ? (
        <div className="login-view">
          <div className="page-logo">
            <img src="/catalyst-logo.png" alt="Catalyst" />
          </div>
          <div className="card narrow">
            <h1>Admin sign in</h1>
          <p className="sub">Enter the admin password to view records.</p>
          <form onSubmit={onLogin}>
            <div className="field">
              <label htmlFor="pw">Password</label>
              <input
                id="pw"
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="••••••••"
                autoFocus
              />
            </div>
            <button type="submit" disabled={loading || !pw}>
              {loading ? "Checking…" : "View records"}
            </button>
            {error && <div className="note err">{error}</div>}
          </form>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="toolbar">
            <input
              type="text"
              placeholder="Filter by name, meal, item, or date…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <button
              type="button"
              className={`neutral${showOrder ? " on" : ""}`}
              onClick={() => setShowOrder((v) => !v)}
            >
              {showOrder ? "Close field order" : "Field order"}
            </button>
            <button type="button" className="neutral" onClick={() => load(pw)}>
              Refresh
            </button>
            <button type="button" className="neutral" onClick={logout}>
              Sign out
            </button>
          </div>

          {/* Collapsible field-order editor */}
          {showOrder && (
            <div className="order-panel">
              <p className="section-title">Form field order</p>
              <p className="sub" style={{ marginBottom: 4 }}>
                Use the arrows to set the sequence of fields on the submission
                form, then save.
              </p>
              <ul className="order-list">
                {order.map((key, i) => (
                  <li className="order-item" key={key}>
                    <span className="pos">{i + 1}</span>
                    <span className="name">{FIELD_DEFS[key].label}</span>
                    <span className="order-btns">
                      <button
                        type="button"
                        className="iconbtn"
                        aria-label={`Move ${FIELD_DEFS[key].label} up`}
                        onClick={() => moveField(i, -1)}
                        disabled={i === 0}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="iconbtn"
                        aria-label={`Move ${FIELD_DEFS[key].label} down`}
                        onClick={() => moveField(i, 1)}
                        disabled={i === order.length - 1}
                      >
                        ↓
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="mt"
                onClick={saveOrder}
                disabled={savingOrder}
              >
                {savingOrder ? "Saving…" : "Save field order"}
              </button>
              {orderMsg && (
                <div className={`note ${orderMsg.ok ? "ok" : "err"}`}>
                  {orderMsg.text}
                </div>
              )}
            </div>
          )}

          {/* Aggregates */}
          <div className="stats">
            <div className="stat">
              <span className="stat-label">Records</span>
              <span className="stat-value">{filtered.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Total Parathas</span>
              <span className="stat-value">{totalParathas}</span>
            </div>
            <div className="stat price">
              <span className="stat-label">Total Price</span>
              <span className="stat-value">
                ₹{totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {error && <div className="note err">{error}</div>}

          <div className="tablewrap">
            {filtered.length === 0 ? (
              <div className="empty">No records yet.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Emp Name</th>
                    <th>Date</th>
                    <th>Paratha Qty</th>
                    <th>Meal Type</th>
                    <th>Item Name</th>
                    <th>Rate</th>
                    <th>Total</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id}>
                      <td data-label="Emp Name">{r.emp_name}</td>
                      <td data-label="Date">{r.entry_date}</td>
                      <td className="qty" data-label="Paratha Qty">
                        {r.paratha_qty}
                      </td>
                      <td data-label="Meal Type">{r.meal_type}</td>
                      <td data-label="Item Name">{r.item_name}</td>
                      <td className="qty" data-label="Rate">
                        ₹{r.rate}
                      </td>
                      <td className="qty" data-label="Total">
                        ₹{((r.rate || 0) * (r.paratha_qty || 0)).toLocaleString()}
                      </td>
                      <td data-label="Submitted">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="totals-row">
                    <td>Totals</td>
                    <td></td>
                    <td className="qty">{totalParathas}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td className="qty">₹{totalAmount.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
