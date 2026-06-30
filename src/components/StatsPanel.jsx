import { useState, useEffect, useCallback } from 'react'
import { useLang } from '../contexts/LanguageContext.jsx'
import './StatsPanel.css'

function pad2(n) { return String(n).padStart(2, '0') }

function fmtDay(isoDate) {
  const d = new Date(isoDate)
  return `${pad2(d.getUTCDate())}.${pad2(d.getUTCMonth() + 1)}`
}

function fmtDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function buildTimeline(rows, days = 30) {
  const map = {}
  for (const r of rows) map[r.day.slice(0, 10)] = r.count
  const result = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setUTCHours(0, 0, 0, 0)
    d.setUTCDate(d.getUTCDate() - i)
    const key = d.toISOString().slice(0, 10)
    result.push({ day: key, count: map[key] || 0 })
  }
  return result
}

function StatCard({ label, value, accent }) {
  return (
    <div className={`stat-card ${accent ? 'accent' : ''}`}>
      <div className="stat-value">{value ?? '…'}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function VisitsChart({ rows }) {
  const timeline = buildTimeline(rows)
  const max = Math.max(...timeline.map(d => d.count), 1)
  const showLabel = (i) => i % 5 === 0 || i === timeline.length - 1
  return (
    <div className="visits-chart">
      <div className="visits-bars">
        {timeline.map((d, i) => (
          <div key={d.day} className="visits-bar-col" title={`${fmtDay(d.day)}: ${d.count}`}>
            <div
              className={`visits-bar ${d.count > 0 ? 'has-data' : ''}`}
              style={{ height: `${Math.round((d.count / max) * 100)}%` }}
            />
            <div className="visits-bar-label">
              {showLabel(i) ? fmtDay(d.day) : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TopThemes({ rows, t }) {
  if (!rows.length) return <p className="stats-empty">{t.admin.statsNoData}</p>
  const max = Math.max(...rows.map(r => Number(r.plays)), 1)
  return (
    <div className="top-themes">
      {rows.map(r => (
        <div key={r.theme_id} className="top-theme-row">
          <div className="top-theme-name">{t.themeNames[r.theme_id] || r.theme_id}</div>
          <div className="top-theme-bar-wrap">
            <div
              className="top-theme-bar"
              style={{ width: `${Math.round((Number(r.plays) / max) * 100)}%` }}
            />
          </div>
          <div className="top-theme-count">{r.plays}</div>
        </div>
      ))}
    </div>
  )
}

function UsersTable({ users, t }) {
  return (
    <div className="stats-users-wrap">
      <table className="stats-users">
        <thead>
          <tr>
            <th>{t.admin.statsUserName}</th>
            <th>{t.admin.statsUserEmail}</th>
            <th>{t.admin.statsUserVisits}</th>
            <th>{t.admin.statsUserRounds}</th>
            <th>{t.admin.statsUserLastSeen}</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => {
            const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || '—'
            return (
              <tr key={u.id}>
                <td>{name}</td>
                <td className="stats-email">{u.email || '—'}</td>
                <td className="stats-num">{u.visit_count}</td>
                <td className="stats-num">{u.rounds_count}</td>
                <td className="stats-date">{fmtDateTime(u.last_seen)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function StatsPanel() {
  const { t } = useLang()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/stats')
      if (!res.ok) throw new Error('failed')
      setData(await res.json())
    } catch {
      setError(t.admin.errorGeneric)
    } finally {
      setLoading(false)
    }
  }, [t.admin.errorGeneric])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="stats-loading">{t.admin.statsLoading}</div>
  if (error) return <div className="stats-error">{error} <button className="btn-mini" onClick={load}>{t.admin.statsRefresh}</button></div>

  const { overview, visitsByDay, topThemes, recentUsers } = data

  return (
    <div className="stats-panel">
      <div className="stats-overview">
        <StatCard label={t.admin.statsUniqueVisitors} value={overview.unique_visitors} />
        <StatCard label={t.admin.statsVisitorsToday} value={overview.visitors_today} accent />
        <StatCard label={t.admin.statsRegistered} value={overview.registered_users} />
        <StatCard label={t.admin.statsRoundsTotal} value={overview.total_rounds} />
        <StatCard label={t.admin.statsRoundsToday} value={overview.rounds_today} accent />
      </div>

      <div className="stats-section">
        <div className="stats-section-head">
          <span>{t.admin.statsVisitsChart}</span>
          <button className="btn-mini" onClick={load}>{t.admin.statsRefresh}</button>
        </div>
        <VisitsChart rows={visitsByDay} />
      </div>

      {topThemes.length > 0 && (
        <div className="stats-section">
          <div className="stats-section-head">{t.admin.statsTopThemes}</div>
          <TopThemes rows={topThemes} t={t} />
        </div>
      )}

      <div className="stats-section">
        <div className="stats-section-head">{t.admin.statsUsers}</div>
        {recentUsers.length === 0 ? (
          <p className="stats-empty">{t.admin.statsNoData}</p>
        ) : (
          <UsersTable users={recentUsers} t={t} />
        )}
      </div>
    </div>
  )
}
