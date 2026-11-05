"use client";

import { useEffect, useState } from "react";
import {
  FIELD_DEFS,
  DEFAULT_FIELD_ORDER,
  normalizeOrder,
  type FieldKey,
} from "@/lib/fields";
import { checkOrderTiming, ORDER_TIMING_NOTE } from "@/lib/ordering";

function today() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export default function HomePage() {
  const [empName, setEmpName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [entryDate, setEntryDate] = useState(today());
  const [parathaQty, setParathaQty] = useState("");
  const [mealType, setMealType] = useState("");
  const [order, setOrder] = useState<FieldKey[]>(DEFAULT_FIELD_ORDER);
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Render fields in the order the admin saved.
  useEffect(() => {
    let active = true;
    fetch("/api/fields")
      .then((r) => r.json())
      .then((d) => {
        if (active && d?.order) setOrder(normalizeOrder(d.order));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const editable: Record<string, string> = {
    emp_name: empName,
    employee_id: employeeId,
    mobile_no: mobileNo,
    entry_date: entryDate,
    paratha_qty: parathaQty,
    meal_type: mealType,
  };

  function setValue(key: FieldKey, v: string) {
    if (key === "emp_name") setEmpName(v);
    else if (key === "employee_id") setEmployeeId(v);
    else if (key === "mobile_no") setMobileNo(v);
    else if (key === "entry_date") setEntryDate(v);
    else if (key === "paratha_qty") setParathaQty(v);
    else if (key === "meal_type") setMealType(v);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const timingError = checkOrderTiming(entryDate);
    if (timingError) {
      setMsg({ ok: false, text: timingError });
      return;
    }
    setStatus("saving");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emp_name: empName,
          employee_id: employeeId,
          mobile_no: mobileNo,
          entry_date: entryDate,
          paratha_qty: parathaQty,
          meal_type: mealType,
          item_name: FIELD_DEFS.item_name.prefill,
          rate: FIELD_DEFS.rate.prefill,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error || "Something went wrong." });
      } else {
        setMsg({ ok: true, text: "Record submitted. Thank you!" });
        setEmpName("");
        setEmployeeId("");
        setMobileNo("");
        setParathaQty("");
        setMealType("");
        setEntryDate(today());
      }
    } catch {
      setMsg({ ok: false, text: "Network error. Please try again." });
    } finally {
      setStatus("idle");
    }
  }

  function renderField(key: FieldKey) {
    const def = FIELD_DEFS[key];

    if (def.kind === "prefilled") {
      return (
        <div className="field" key={key}>
          <label>{def.label}</label>
          <div className="prefill-wrap">
            <input
              className={`prefilled${def.suffix ? " has-suffix" : ""}`}
              type="text"
              value={def.prefill ?? ""}
              readOnly
              tabIndex={-1}
              aria-readonly="true"
            />
            {def.suffix && <span className="suffix">{def.suffix}</span>}
          </div>
        </div>
      );
    }

    return (
      <div className="field" key={key}>
        <label htmlFor={key}>
          {def.label} {def.required && <span className="req">*</span>}
        </label>
        <input
          id={key}
          type={
            def.kind === "number" ? "number" : def.kind === "date" ? "date" : "text"
          }
          inputMode={
            def.kind === "number" || key === "mobile_no" ? "numeric" : undefined
          }
          maxLength={key === "mobile_no" ? 10 : undefined}
          min={def.kind === "number" ? "0" : undefined}
          step={def.kind === "number" ? "1" : undefined}
          autoComplete={key === "emp_name" ? "name" : undefined}
          placeholder={def.placeholder}
          value={editable[key] ?? ""}
          onChange={(e) => setValue(key, e.target.value)}
          required={def.required}
        />
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="topbar centered">
        <div className="brand">
          <span className="dot">C</span>
          <span>Catalyst-MSIL Food Ordering</span>
        </div>
      </div>

      <div className="form-shell">
        <div className="page-logo">
          <img src="/catalyst-logo.png" alt="Catalyst" />
        </div>

        <div className="card">
          <h1>Submit a record</h1>
        <p className="sub">Fill in the details below and submit.</p>

        <form onSubmit={onSubmit} noValidate>
          {order.map(renderField)}

          {(() => {
            const q = Number(parathaQty);
            const rate = Number(FIELD_DEFS.rate.prefill);
            if (parathaQty !== "" && Number.isFinite(q) && q >= 0) {
              return (
                <div className="total-line">
                  <span>Total</span>
                  <strong>₹{(rate * q).toLocaleString()}</strong>
                </div>
              );
            }
            return null;
          })()}

          <button type="submit" disabled={status === "saving"}>
            {status === "saving" ? "Submitting…" : "Submit record"}
          </button>

          {msg && (
            <div className={`note ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>
          )}
        </form>
        </div>
        <p className="timing-note">{ORDER_TIMING_NOTE}</p>
      </div>
    </div>
  );
}
