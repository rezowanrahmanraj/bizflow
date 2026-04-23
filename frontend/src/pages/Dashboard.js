import React, { useState, useEffect } from 'react';
import { getStats, getMyIssues, getAssignedIssues } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentIssues, setRecentIssues] = useState([]);
  const [recentAssigned, setRecentAssigned] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, myIssuesRes, assignedRes] = await Promise.all([
          getStats(),
          getMyIssues(),
          getAssignedIssues(),
        ]);
        setStats(statsRes.data);
        setRecentIssues(myIssuesRes.data.issues.slice(0, 3));
        setRecentAssigned(assignedRes.data.issues.slice(0, 3));
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <Spinner />;

  // Bar chart data
  const barData = [
    {
      name: 'My Issues',
      Total: stats?.reported?.total || 0,
      Pending: stats?.reported?.pending || 0,
      Resolved: stats?.reported?.resolved || 0,
    },
    {
      name: 'Assigned Tasks',
      Total: stats?.assigned?.total || 0,
      Pending: stats?.assigned?.pending || 0,
      Resolved: stats?.assigned?.resolved || 0,
    },
  ];

  // Pie chart data
  const pieData = [
    { name: 'My Pending', value: stats?.reported?.pending || 0 },
    { name: 'My Resolved', value: stats?.reported?.resolved || 0 },
    { name: 'Task Pending', value: stats?.assigned?.pending || 0 },
    { name: 'Task Resolved', value: stats?.assigned?.resolved || 0 },
  ];

  return (
    <div style={styles.wrapper}>
      {/* Welcome Banner */}
      <div style={styles.banner}>
        <div>
          <h2 style={styles.bannerTitle}>
            👋 Welcome back, {user?.name}!
          </h2>
          <p style={styles.bannerSub}>
            Employee ID: <strong>{user?.employeeId}</strong> &nbsp;|&nbsp;
            Category: <strong>{user?.category}</strong>
          </p>
        </div>
        <div style={styles.bannerDate}>
          📅 {new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric',
            month: 'long', day: 'numeric',
          })}
        </div>
      </div>

      {/* Stat Cards */}
      <div style={styles.cardGrid}>
        <StatCard
          title="Total Issues Reported"
          value={stats?.reported?.total || 0}
          icon="📋"
          color="#4f46e5"
          bg="#eef2ff"
        />
        <StatCard
          title="My Pending Issues"
          value={stats?.reported?.pending || 0}
          icon="⏳"
          color="#f59e0b"
          bg="#fffbeb"
        />
        <StatCard
          title="My Resolved Issues"
          value={stats?.reported?.resolved || 0}
          icon="✅"
          color="#10b981"
          bg="#ecfdf5"
        />
        <StatCard
          title="Tasks Assigned to Me"
          value={stats?.assigned?.total || 0}
          icon="🎯"
          color="#6366f1"
          bg="#f5f3ff"
        />
        <StatCard
          title="Tasks Pending"
          value={stats?.assigned?.pending || 0}
          icon="🔧"
          color="#ef4444"
          bg="#fef2f2"
        />
        <StatCard
          title="Tasks Completed"
          value={stats?.assigned?.resolved || 0}
          icon="🏆"
          color="#0ea5e9"
          bg="#f0f9ff"
        />
      </div>

      {/* Charts Row */}
      <div style={styles.chartRow}>
        {/* Bar Chart */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>📊 Issues vs Tasks Overview</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Total" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>🥧 Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity Row */}
      <div style={styles.activityRow}>
        {/* Recent Issues */}
        <div style={styles.activityCard}>
          <h3 style={styles.activityTitle}>🐛 My Recent Issues</h3>
          {recentIssues.length === 0 ? (
            <p style={styles.empty}>No issues reported yet.</p>
          ) : (
            recentIssues.map((issue) => (
              <div key={issue._id} style={styles.activityItem}>
                <div style={styles.activityLeft}>
                  <span style={styles.activityCategory}>{issue.category}</span>
                  <p style={styles.activityDetails}>{issue.details}</p>
                </div>
                <span
                  style={{
                    ...styles.statusBadge,
                    backgroundColor:
                      issue.status === 'resolved' ? '#dcfce7' : '#fef9c3',
                    color:
                      issue.status === 'resolved' ? '#16a34a' : '#a16207',
                  }}
                >
                  {issue.status}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Recent Assigned Tasks */}
        <div style={styles.activityCard}>
          <h3 style={styles.activityTitle}>🎯 Recently Assigned Tasks</h3>
          {recentAssigned.length === 0 ? (
            <p style={styles.empty}>No tasks assigned yet.</p>
          ) : (
            recentAssigned.map((issue) => (
              <div key={issue._id} style={styles.activityItem}>
                <div style={styles.activityLeft}>
                  <span style={styles.activityCategory}>
                    From: {issue.reportedBy?.name}
                  </span>
                  <p style={styles.activityDetails}>{issue.details}</p>
                </div>
                <span
                  style={{
                    ...styles.statusBadge,
                    backgroundColor:
                      issue.status === 'resolved' ? '#dcfce7' : '#fef9c3',
                    color:
                      issue.status === 'resolved' ? '#16a34a' : '#a16207',
                  }}
                >
                  {issue.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ── Reusable Stat Card Component ─────────────────────────────────────
const StatCard = ({ title, value, icon, color, bg }) => (
  <div style={{ ...styles.statCard, backgroundColor: bg }}>
    <div style={{ ...styles.statIcon, color }}>{icon}</div>
    <div>
      <p style={styles.statTitle}>{title}</p>
      <h3 style={{ ...styles.statValue, color }}>{value}</h3>
    </div>
  </div>
);

// ── Styles ────────────────────────────────────────────────────────────
const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  banner: {
    backgroundColor: '#4f46e5',
    borderRadius: '16px',
    padding: '24px 28px',
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  bannerTitle: {
    margin: '0 0 6px 0',
    fontSize: '22px',
  },
  bannerSub: {
    margin: 0,
    fontSize: '14px',
    opacity: 0.85,
  },
  bannerDate: {
    fontSize: '14px',
    opacity: 0.85,
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
  },
  statCard: {
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  statIcon: {
    fontSize: '32px',
  },
  statTitle: {
    margin: '0 0 4px 0',
    fontSize: '13px',
    color: '#64748b',
  },
  statValue: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 'bold',
  },
  chartRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '20px',
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  chartTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    color: '#1e293b',
  },
  activityRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '20px',
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  activityTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    color: '#1e293b',
  },
  activityItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '12px 0',
    borderBottom: '1px solid #f1f5f9',
    gap: '12px',
  },
  activityLeft: {
    flex: 1,
  },
  activityCategory: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#4f46e5',
    backgroundColor: '#eef2ff',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  activityDetails: {
    margin: '6px 0 0 0',
    fontSize: '13px',
    color: '#475569',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '220px',
  },
  statusBadge: {
    fontSize: '12px',
    fontWeight: '600',
    padding: '4px 10px',
    borderRadius: '10px',
    whiteSpace: 'nowrap',
  },
  empty: {
    color: '#94a3b8',
    fontSize: '14px',
    textAlign: 'center',
    padding: '20px 0',
  },
};

export default Dashboard;