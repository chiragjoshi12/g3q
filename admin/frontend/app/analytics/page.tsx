"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
  type ChartEvent,
  type ActiveElement,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { AdminShell } from "@/components/AdminShell";
import { AnalyticsDashboard, api, getToken } from "@/lib/api";

ChartJS.register(ArcElement, Tooltip, Legend);

type Slice = { label: string; value: number; color: string };
type ViewTab = "district" | "taluka" | "school" | "caste" | "weekly";

const PIE_COLORS = [
  "#0f5c61",
  "#d97706",
  "#1f7a4c",
  "#3b6ea5",
  "#b45309",
  "#0e7490",
  "#7c3aed",
  "#be123c",
  "#64748b",
  "#0f766e",
];

function buildSlices(
  items: Array<{ label: string; value: number }>,
  maxSlices = 8
): Slice[] {
  const sorted = [...items]
    .filter((i) => i.value > 0)
    .sort((a, b) => b.value - a.value);
  if (!sorted.length) return [];

  const top = sorted.slice(0, maxSlices);
  const rest = sorted.slice(maxSlices);
  const otherValue = rest.reduce((sum, i) => sum + i.value, 0);
  const slices = top.map((item, idx) => ({
    label: item.label,
    value: item.value,
    color: PIE_COLORS[idx % PIE_COLORS.length],
  }));
  if (otherValue > 0) {
    slices.push({
      label: "Other",
      value: otherValue,
      color: "#94a3b8",
    });
  }
  return slices;
}

function InteractivePie({
  slices,
  centerFallback,
}: {
  slices: Slice[];
  centerFallback: { label: string; value: string };
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  useEffect(() => {
    setSelected(null);
  }, [slices]);

  const chartData = useMemo(
    () => ({
      labels: slices.map((s) => s.label),
      datasets: [
        {
          data: slices.map((s) => s.value),
          backgroundColor: slices.map((s, idx) =>
            selected == null || selected === idx
              ? s.color
              : `${s.color}55`
          ),
          borderColor: "#fffdf8",
          borderWidth: 3,
          hoverOffset: 12,
          offset: selected == null ? 0 : 8,
        },
      ],
    }),
    [slices, selected]
  );

  const active = selected != null ? slices[selected] : null;
  const activePct =
    active && total ? Math.round((active.value / total) * 100) : null;

  if (!total) {
    return (
      <div className="pie-empty">
        <p className="muted-note">Nothing to show yet.</p>
      </div>
    );
  }

  return (
    <div className="pie-wrap">
      <div className="pie-chart-box">
        <Doughnut
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: true,
            cutout: "62%",
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label(ctx) {
                    const value = Number(ctx.raw) || 0;
                    const pct = Math.round((value / total) * 100);
                    return ` ${value.toLocaleString()} · ${pct}%`;
                  },
                },
              },
            },
            onClick: (_event: ChartEvent, elements: ActiveElement[]) => {
              if (!elements.length) {
                setSelected(null);
                return;
              }
              const idx = elements[0].index;
              setSelected((prev) => (prev === idx ? null : idx));
            },
          }}
        />
        <div className="pie-center-overlay">
          <strong>
            {active ? active.value.toLocaleString() : centerFallback.value}
          </strong>
          <span>{active ? active.label : centerFallback.label}</span>
          {activePct != null ? <em>{activePct}%</em> : null}
        </div>
      </div>

      <ul className="pie-legend">
        {slices.map((slice, idx) => {
          const pct = Math.round((slice.value / total) * 100);
          return (
            <li key={slice.label}>
              <button
                type="button"
                className={
                  selected === idx ? "pie-legend-btn active" : "pie-legend-btn"
                }
                onClick={() =>
                  setSelected((prev) => (prev === idx ? null : idx))
                }
              >
                <i style={{ background: slice.color }} />
                <span className="pie-legend-label" title={slice.label}>
                  {slice.label}
                </span>
                <em>
                  {slice.value.toLocaleString()} · {pct}%
                </em>
              </button>
            </li>
          );
        })}
      </ul>

      {active ? (
        <p className="pie-selection-note">
          Selected <strong>{active.label}</strong> —{" "}
          {active.value.toLocaleString()} ({activePct}%). Click again to clear.
        </p>
      ) : (
        <p className="pie-selection-note muted-note">
          Click a slice or legend item to focus it.
        </p>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewTab>("district");

  const load = useCallback(async () => {
    if (!getToken()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api<AnalyticsDashboard>("/api/v1/admin/analytics");
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    load();
  }, [load]);

  const o = data?.overview;

  const viewSlices = useMemo(() => {
    if (!data) return [];
    if (view === "district") {
      return buildSlices(
        data.by_district.map((d) => ({
          label: d.label,
          value: d.students_played,
        }))
      );
    }
    if (view === "taluka") {
      return buildSlices(
        data.by_taluka.map((d) => ({
          label: d.label,
          value: d.students_played,
        }))
      );
    }
    if (view === "school") {
      return buildSlices(
        data.by_school.map((d) => ({
          label: d.label,
          value: d.students_played,
        }))
      );
    }
    if (view === "caste") {
      return buildSlices(
        data.by_caste.map((d) => ({
          label: d.caste_category,
          value: d.students_played,
        }))
      );
    }
    return buildSlices(
      data.weekly.map((w) => ({
        label: w.week_start,
        value: w.sessions_completed,
      }))
    );
  }, [data, view]);

  const viewTitle =
    view === "district"
      ? "Who played — by district"
      : view === "taluka"
        ? "Who played — by taluka"
        : view === "school"
          ? "Who played — by school"
          : view === "caste"
            ? "Who played — by caste category"
            : "Quiz attempts — by week";

  return (
    <AdminShell title="Analytics">
      {loading ? <p className="muted-note">Loading…</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      {data && o ? (
        <>
          <section className="analytics-hero-head">
            <div>
              <h2>Student participation</h2>
              <p>
                <b>{o.play_rate_pct}%</b> of registered students have played
              </p>
            </div>
            <button type="button" className="ghost compact" onClick={load}>
              Refresh
            </button>
          </section>

          <section className="participation-squares">
            <article className="stat-square">
              <span>Registered</span>
              <strong>{o.total_students.toLocaleString()}</strong>
            </article>
            <article className="stat-square played">
              <span>Played</span>
              <strong>{o.students_played.toLocaleString()}</strong>
            </article>
          </section>

          <section className="stats-row analytics-simple-stats">
            <article>
              <span>Quiz sessions</span>
              <strong>{o.sessions_completed.toLocaleString()}</strong>
            </article>
            <article>
              <span>Questions attempted</span>
              <strong>{o.questions_attempted.toLocaleString()}</strong>
            </article>
            <article>
              <span>Correct answers</span>
              <strong>{o.accuracy_pct}%</strong>
            </article>
          </section>

          <section className="panel-block">
            <div className="panel-head">
              <div>
                <h2>{viewTitle}</h2>
                <p>Click a slice to focus that group.</p>
              </div>
            </div>

            <div className="inline-actions geo-tabs analytics-view-tabs">
              {(
                [
                  ["district", "District"],
                  ["taluka", "Taluka"],
                  ["school", "School"],
                  ["caste", "Caste"],
                  ["weekly", "Weekly"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={view === id ? "compact" : "ghost compact"}
                  onClick={() => setView(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            <InteractivePie
              slices={viewSlices}
              centerFallback={{
                label: view === "weekly" ? "sessions" : "played",
                value:
                  view === "weekly"
                    ? o.sessions_completed.toLocaleString()
                    : o.students_played.toLocaleString(),
              }}
            />
          </section>
        </>
      ) : null}
    </AdminShell>
  );
}
