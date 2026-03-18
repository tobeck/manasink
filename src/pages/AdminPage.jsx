import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import styles from './AdminPage.module.css'

export function AdminPage() {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [userStats, setUserStats] = useState([])
  const [dailyStats, setDailyStats] = useState([])
  const [popularCommanders, setPopularCommanders] = useState([])
  const [buyStats, setBuyStats] = useState(null)
  const [engagement, setEngagement] = useState(null)
  const [error, setError] = useState(null)

  // Check if user is admin
  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('is_admin')
          .eq('user_id', user.id)
          .single()

        if (error) throw error
        setIsAdmin(data?.is_admin || false)
      } catch (err) {
        console.error('Error checking admin status:', err)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdmin()
  }, [user])

  // Fetch stats if admin
  useEffect(() => {
    if (!isAdmin) return

    async function fetchStats() {
      try {
        // Fetch admin stats (RPC function — admin-only)
        const { data: adminStats, error: statsError } = await supabase
          .rpc('get_admin_stats')

        if (statsError) throw statsError
        setStats(adminStats)

        // Fetch user stats (RPC function — admin-only)
        const { data: users, error: usersError } = await supabase
          .rpc('get_user_stats', { result_limit: 20 })

        if (!usersError) setUserStats(users || [])

        // Fetch daily stats via RPC (replaces broken view query)
        const { data: daily, error: dailyError } = await supabase
          .rpc('get_daily_stats', { day_count: 14 })

        if (!dailyError) setDailyStats(daily || [])

        // Fetch engagement stats
        const { data: eng, error: engError } = await supabase
          .rpc('get_engagement_stats')

        if (!engError) setEngagement(eng)

        // Fetch popular commanders
        const { data: commanders, error: cmdError } = await supabase
          .from('popular_commanders')
          .select('*')
          .limit(10)

        if (!cmdError) setPopularCommanders(commanders || [])

        // Fetch buy stats
        const { data: buyExpands } = await supabase
          .from('analytics_events')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'buy_expand')

        const { data: buyClicks } = await supabase
          .from('analytics_events')
          .select('event_data', { count: 'exact' })
          .eq('event_type', 'buy_click')

        const storeBreakdown = {}
        if (buyClicks) {
          buyClicks.forEach(event => {
            const store = event.event_data?.store || 'Unknown'
            storeBreakdown[store] = (storeBreakdown[store] || 0) + 1
          })
        }

        setBuyStats({
          expands: buyExpands?.length || 0,
          clicks: buyClicks?.length || 0,
          byStore: storeBreakdown,
        })

      } catch (err) {
        console.error('Error fetching stats:', err)
        setError(err.message)
      }
    }

    fetchStats()
  }, [isAdmin])

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.unauthorized}>
          <h2>Not logged in</h2>
          <p>Please sign in to access this page.</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.unauthorized}>
          <h2>Access Denied</h2>
          <p>You do not have permission to view this page.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Error: {error}</div>
      </div>
    )
  }

  // Compute deltas from engagement stats
  const deltas = engagement ? {
    swipes: computeDelta(engagement.curr_week_swipes, engagement.prev_week_swipes),
    likes: computeDelta(engagement.curr_week_likes, engagement.prev_week_likes),
    active: computeDelta(engagement.curr_week_active, engagement.prev_week_active),
    newUsers: computeDelta(engagement.curr_week_new_users, engagement.prev_week_new_users),
  } : null

  // Reverse dailyStats for charts (oldest first)
  const chartData = [...dailyStats].reverse()

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Admin Dashboard</h1>

      {/* Overview Stats */}
      {stats && (
        <div className={styles.statsGrid}>
          <StatCard label="Total Users" value={stats.total_users} />
          <StatCard label="Active (7d)" value={stats.active_users_7d} delta={deltas?.active} />
          <StatCard label="New (7d)" value={stats.new_users_7d} delta={deltas?.newUsers} />
          <StatCard label="Total Swipes" value={stats.total_swipes?.toLocaleString()} delta={deltas?.swipes} />
          <StatCard label="Total Likes" value={stats.total_likes?.toLocaleString()} delta={deltas?.likes} />
          <StatCard label="Like Rate" value={`${stats.overall_like_rate || 0}%`} />
          <StatCard label="Total Decks" value={stats.total_decks} />
          <StatCard label="Active (30d)" value={stats.active_users_30d} />
        </div>
      )}

      {/* Trend Charts */}
      {chartData.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Trends (Last 14 days)</h2>
          <div className={styles.chartsGrid}>
            <TrendChart
              title="Active Users"
              data={chartData}
              valueKey="active_users"
              color="var(--accent)"
            />
            <TrendChart
              title="Swipes"
              data={chartData}
              valueKey="total_swipes"
              color="var(--text-secondary)"
            />
            <TrendChart
              title="Like Rate"
              data={chartData}
              valueKey="like_rate_pct"
              color="var(--color-like)"
              suffix="%"
            />
          </div>
        </section>
      )}

      {/* Engagement Metrics */}
      {engagement && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Engagement</h2>
          <div className={styles.statsGrid}>
            <StatCard
              label="DAU/WAU"
              value={engagement.wau > 0
                ? `${Math.round((engagement.dau / engagement.wau) * 100)}%`
                : '0%'}
            />
            <StatCard
              label="Avg Swipes/User"
              value={engagement.avg_swipes_per_user_7d}
            />
            <StatCard label="New Active" value={engagement.new_users_active_7d} />
            <StatCard label="Returning" value={engagement.returning_users_7d} />
            <StatCard label="Deeply Engaged" value={engagement.deeply_engaged_30d} />
          </div>
          {(engagement.new_users_active_7d > 0 || engagement.returning_users_7d > 0) && (
            <div className={styles.ratioBarSection}>
              <div className={styles.ratioLabel}>
                <span>New ({engagement.new_users_active_7d})</span>
                <span>Returning ({engagement.returning_users_7d})</span>
              </div>
              <RatioBar
                left={engagement.new_users_active_7d}
                right={engagement.returning_users_7d}
              />
            </div>
          )}
        </section>
      )}

      {/* Week-over-Week Comparison */}
      {engagement && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Week over Week</h2>
          <div className={styles.statsGrid}>
            <ComparisonCard
              label="Swipes"
              current={engagement.curr_week_swipes}
              previous={engagement.prev_week_swipes}
            />
            <ComparisonCard
              label="Likes"
              current={engagement.curr_week_likes}
              previous={engagement.prev_week_likes}
            />
            <ComparisonCard
              label="Active Users"
              current={engagement.curr_week_active}
              previous={engagement.prev_week_active}
            />
            <ComparisonCard
              label="New Users"
              current={engagement.curr_week_new_users}
              previous={engagement.prev_week_new_users}
            />
          </div>
        </section>
      )}

      {/* Buy Stats */}
      {buyStats && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Buy Button Stats</h2>
          <div className={styles.statsGrid}>
            <StatCard label="Buy Expands" value={buyStats.expands} />
            <StatCard label="Buy Clicks" value={buyStats.clicks} />
            <StatCard
              label="Click Rate"
              value={buyStats.expands > 0
                ? `${Math.round(buyStats.clicks / buyStats.expands * 100)}%`
                : '0%'
              }
            />
          </div>
          {Object.keys(buyStats.byStore).length > 0 && (
            <div className={styles.storeBreakdown}>
              <h3 className={styles.subTitle}>Clicks by Store</h3>
              {Object.entries(buyStats.byStore).map(([store, count]) => (
                <div key={store} className={styles.storeRow}>
                  <span>{store}</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Daily Stats Table */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Daily Activity (Last 14 days)</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Active Users</th>
                <th>Swipes</th>
                <th>Likes</th>
                <th>Passes</th>
                <th>Like Rate</th>
              </tr>
            </thead>
            <tbody>
              {dailyStats.map(day => (
                <tr key={day.date}>
                  <td>{new Date(day.date).toLocaleDateString()}</td>
                  <td>{day.active_users}</td>
                  <td>{day.total_swipes}</td>
                  <td>{day.likes}</td>
                  <td>{day.passes}</td>
                  <td>{day.like_rate_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Popular Commanders */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Popular Commanders</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Commander</th>
                <th>Colors</th>
                <th>Likes</th>
                <th>Unique Users</th>
              </tr>
            </thead>
            <tbody>
              {popularCommanders.map(cmd => (
                <tr key={cmd.commander_id}>
                  <td>{cmd.name}</td>
                  <td>{(cmd.color_identity || []).join('')}</td>
                  <td>{cmd.like_count}</td>
                  <td>{cmd.unique_users}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* User Stats */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Top Users</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Joined</th>
                <th>Last Active</th>
                <th>Swipes</th>
                <th>Likes</th>
                <th>Decks</th>
              </tr>
            </thead>
            <tbody>
              {userStats.map(u => (
                <tr key={u.user_id}>
                  <td>
                    <div className={styles.userCell}>
                      {u.avatar_url && (
                        <img src={u.avatar_url} alt="" className={styles.avatar} />
                      )}
                      <span>{u.full_name || u.email}</span>
                    </div>
                  </td>
                  <td>{new Date(u.joined_at).toLocaleDateString()}</td>
                  <td>{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : '-'}</td>
                  <td>{u.total_swipes}</td>
                  <td>{u.liked_count}</td>
                  <td>{u.deck_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function computeDelta(current, previous) {
  if (!previous || previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

function StatCard({ label, value, delta }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
      {delta != null && delta !== undefined && (
        <div className={`${styles.delta} ${delta > 0 ? styles.deltaUp : delta < 0 ? styles.deltaDown : styles.deltaNeutral}`}>
          {delta > 0 ? '\u25B2' : delta < 0 ? '\u25BC' : '\u2014'}{' '}
          {Math.abs(delta)}%
        </div>
      )}
    </div>
  )
}

function TrendChart({ title, data, valueKey, color, suffix = '' }) {
  const values = data.map(d => d[valueKey] || 0)
  const max = Math.max(...values, 1)

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartTitle}>{title}</div>
      <div className={styles.chart}>
        {data.map((d, i) => {
          const val = d[valueKey] || 0
          const heightPct = (val / max) * 100
          const dateStr = new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          return (
            <div key={d.date} className={styles.chartBar}>
              <div
                className={styles.chartFill}
                style={{ height: `${heightPct}%`, background: color }}
              >
                {val > 0 && <span className={styles.chartBarValue}>{val}{suffix}</span>}
              </div>
              {i % 2 === 0 && <span className={styles.chartDateLabel}>{dateStr}</span>}
              {i % 2 !== 0 && <span className={styles.chartDateLabel}>&nbsp;</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RatioBar({ left, right }) {
  const total = left + right
  const leftPct = total > 0 ? (left / total) * 100 : 50

  return (
    <div className={styles.ratioBar}>
      <div className={styles.ratioLeft} style={{ width: `${leftPct}%` }} />
      <div className={styles.ratioRight} style={{ width: `${100 - leftPct}%` }} />
    </div>
  )
}

function ComparisonCard({ label, current, previous }) {
  const delta = computeDelta(current, previous)

  return (
    <div className={styles.statCard}>
      <div className={styles.statValue}>{(current || 0).toLocaleString()}</div>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.comparisonPrev}>vs {(previous || 0).toLocaleString()}</div>
      <div className={`${styles.delta} ${delta > 0 ? styles.deltaUp : delta < 0 ? styles.deltaDown : styles.deltaNeutral}`}>
        {delta > 0 ? '\u25B2' : delta < 0 ? '\u25BC' : '\u2014'}{' '}
        {Math.abs(delta)}%
      </div>
    </div>
  )
}
