"use client";
import { useState } from "react";

export default function NewFaabForm({ teams }) {
  const [teamId, setTeamId] = useState(teams[0]?.id || "");
  const [type, setType] = useState("debit");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0,10));
  const [status, setStatus] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setStatus("saving");

    try {
      const res = await fetch("/api/faab/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          type,
          amount: Number(amount),
          description,
          transactionDate
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Request failed");
      }

      setStatus("success");
      // Reset form (optional)
      setAmount("");
      setDescription("");
    } catch (err) {
      setStatus(`error:${err.message}`);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{
      display: "grid",
      gap: 12,
      maxWidth: 560,
      background: "#151a30",
      border: "1px solid #243",
      borderRadius: 12,
      padding: 16
    }}>
      <label style={{ display: "grid", gap: 6 }}>
        <span>Team</span>
        <select value={teamId} onChange={(e) => setTeamId(e.target.value)} style={{ padding: 8, borderRadius: 8 }}>
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span>Type</span>
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding: 8, borderRadius: 8 }}>
          <option value="debit">debit (spend)</option>
          <option value="credit">credit (refund/adjust)</option>
        </select>
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span>Amount</span>
        <input
          type="number"
          min="0"
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g. 12"
          style={{ padding: 8, borderRadius: 8 }}
          required
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span>Date</span>
        <input
          type="date"
          value={transactionDate}
          onChange={(e) => setTransactionDate(e.target.value)}
          style={{ padding: 8, borderRadius: 8 }}
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span>Description (optional)</span>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Waiver claim for Player X"
          style={{ padding: 8, borderRadius: 8 }}
        />
      </label>

      <button
        type="submit"
        disabled={status === "saving"}
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid #375",
          background: status === "saving" ? "#2a4" : "#396",
          color: "#e6f0ff",
          fontWeight: 600
        }}
      >
        {status === "saving" ? "Saving..." : "Create Transaction"}
      </button>

      {status?.startsWith("error:") && (
        <div style={{ color: "#f66" }}>{status.replace("error:", "")}</div>
      )}
      {status === "success" && (
        <div style={{ color: "#6f6" }}>Transaction created & published!</div>
      )}
    </form>
  );
}
