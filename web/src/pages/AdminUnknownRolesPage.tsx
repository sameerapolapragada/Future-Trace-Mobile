import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchUnknownRolesAdmin } from "../lib/roleMatchService";

export default function AdminUnknownRolesPage() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof fetchUnknownRolesAdmin>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnknownRolesAdmin()
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="text-xl font-bold text-white">Unknown Role Requests</h1>
      <p className="mt-2 text-sm text-muted">
        Internal product intelligence — requires service role access in production.
      </p>

      {loading ? <p className="mt-6 text-sm text-muted">Loading…</p> : null}

      {!loading && rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No unknown role requests yet.</p>
      ) : null}

      <ul className="mt-6 space-y-3">
        {rows.map((row) => (
          <li key={row.role_input} className="rounded-2xl border border-white/8 bg-navy-elevated p-4">
            <p className="font-semibold text-white">{row.role_input}</p>
            <p className="mt-1 text-xs text-muted">
              {row.times_requested}× · {row.match_status} · {row.status}
            </p>
            {row.suggested_family ? <p className="text-xs text-muted">Family: {row.suggested_family}</p> : null}
            <p className="text-xs text-muted">
              {new Date(row.first_seen).toLocaleDateString()} – {new Date(row.last_seen).toLocaleDateString()}
            </p>
          </li>
        ))}
      </ul>

      <Link to="/home" className="mt-8 inline-block text-sm text-accent">
        ← Back
      </Link>
    </div>
  );
}
