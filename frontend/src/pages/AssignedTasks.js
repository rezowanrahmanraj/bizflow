import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getAssignedIssues, resolveIssue } from '../services/api';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';

const AssignedTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | pending | resolved

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await getAssignedIssues();
      setTasks(res.data.issues);
    } catch (err) {
      toast.error('Failed to load assigned tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id, resolutionNote) => {
    try {
      await resolveIssue(id, { resolutionNote });
      toast.success('Task marked as complete!');
      // Update task in state directly (no need to refetch)
      setTasks((prev) =>
        prev.map((task) =>
          task._id === id
            ? {
                ...task,
                status: 'resolved',
                resolutionNote,
                resolvedBy: {
                  name: user.name,
                  employeeId: user.employeeId,
                },
              }
            : task
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve task');
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (filter === 'pending') return task.status === 'pending';
    if (filter === 'resolved') return task.status === 'resolved';
    return true;
  });

  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const resolvedCount = tasks.filter((t) => t.status === 'resolved').length;

  return (
    <div style={styles.wrapper}>
      {/* Page Header */}
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.pageTitle}>🎯 Assigned Tasks</h2>
          <p style={styles.pageSubtitle}>
            Issues assigned to you based on your category:{' '}
            <strong style={{ color: '#4f46e5' }}>{user?.category}</strong>
          </p>
        </div>
        <button onClick={fetchTasks} style={styles.refreshBtn}>
          🔄 Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div style={styles.summaryRow}>
        <div style={{ ...styles.summaryCard, backgroundColor: '#eef2ff' }}>
          <span style={styles.summaryIcon}>📋</span>
          <div>
            <p style={styles.summaryLabel}>Total Assigned</p>
            <h3 style={{ ...styles.summaryValue, color: '#4f46e5' }}>
              {tasks.length}
            </h3>
          </div>
        </div>
        <div style={{ ...styles.summaryCard, backgroundColor: '#fffbeb' }}>
          <span style={styles.summaryIcon}>⏳</span>
          <div>
            <p style={styles.summaryLabel}>Pending</p>
            <h3 style={{ ...styles.summaryValue, color: '#f59e0b' }}>
              {pendingCount}
            </h3>
          </div>
        </div>
        <div style={{ ...styles.summaryCard, backgroundColor: '#ecfdf5' }}>
          <span style={styles.summaryIcon}>✅</span>
          <div>
            <p style={styles.summaryLabel}>Completed</p>
            <h3 style={{ ...styles.summaryValue, color: '#10b981' }}>
              {resolvedCount}
            </h3>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={styles.filterRow}>
        {['all', 'pending', 'resolved'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              ...styles.filterBtn,
              ...(filter === f ? styles.filterBtnActive : {}),
            }}
          >
            {f === 'all' && '📋 '}
            {f === 'pending' && '⏳ '}
            {f === 'resolved' && '✅ '}
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span style={styles.filterCount}>
              {f === 'all' && tasks.length}
              {f === 'pending' && pendingCount}
              {f === 'resolved' && resolvedCount}
            </span>
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {loading ? (
        <Spinner />
      ) : filteredTasks.length === 0 ? (
        <div style={styles.emptyBox}>
          <p style={styles.emptyIcon}>
            {filter === 'pending' ? '🎉' : '📭'}
          </p>
          <p style={styles.emptyText}>
            {filter === 'pending'
              ? 'No pending tasks! You are all caught up.'
              : filter === 'resolved'
              ? 'No resolved tasks yet.'
              : 'No tasks assigned to you yet.'}
          </p>
          <p style={styles.emptyHint}>
            Tasks appear here when other employees report issues
            in the <strong>{user?.category}</strong> category.
          </p>
        </div>
      ) : (
        <div style={styles.taskList}>
          {filteredTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onResolve={handleResolve}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Task Card Component ───────────────────────────────────────────────
const TaskCard = ({ task, onResolve }) => {
  const [resolutionNote, setResolutionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [imgOpen, setImgOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = async () => {
    if (!resolutionNote.trim()) {
      return toast.error('Please write your resolution note');
    }
    setSubmitting(true);
    await onResolve(task._id, resolutionNote);
    setSubmitting(false);
  };

  const isResolved = task.status === 'resolved';

  return (
    <div
      style={{
        ...styles.taskCard,
        borderLeft: isResolved
          ? '4px solid #10b981'
          : '4px solid #f59e0b',
      }}
    >
      {/* Card Header */}
      <div style={styles.taskHeader}>
        <div style={styles.taskHeaderLeft}>
          <span style={styles.categoryTag}>{task.category}</span>
          <span
            style={{
              ...styles.statusTag,
              backgroundColor: isResolved ? '#dcfce7' : '#fef9c3',
              color: isResolved ? '#16a34a' : '#a16207',
            }}
          >
            {isResolved ? '✅ Resolved' : '⏳ Pending'}
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          style={styles.expandBtn}
        >
          {expanded ? '▲ Collapse' : '▼ Expand'}
        </button>
      </div>

      {/* Reporter Info */}
      <div style={styles.reporterBox}>
        <span style={styles.reporterIcon}>👤</span>
        <div>
          <p style={styles.reporterName}>{task.reportedBy?.name}</p>
          <p style={styles.reporterMeta}>
            ID: {task.reportedBy?.employeeId} &nbsp;|&nbsp;
            Dept: {task.reportedBy?.category}
          </p>
        </div>
        <span style={styles.dateText}>
          🕐{' '}
          {new Date(task.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>

      {/* Issue Details */}
      <p style={styles.taskDetails}>{task.details}</p>

      {/* Expanded Content */}
      {expanded && (
        <div style={styles.expandedContent}>
          {/* Attached Image */}
          {task.imageUrl && (
            <div style={styles.imgSection}>
              <p style={styles.imgLabel}>📎 Attached Image:</p>
              <img
                src={task.imageUrl}
                alt="Issue"
                style={styles.taskImg}
                onClick={() => setImgOpen(true)}
              />
              <p style={styles.imgHint}>Click image to enlarge</p>
            </div>
          )}

          {/* If Resolved — show resolution */}
          {isResolved ? (
            <div style={styles.resolutionBox}>
              <p style={styles.resolutionLabel}>🔧 Resolution Note:</p>
              <p style={styles.resolutionNote}>{task.resolutionNote}</p>
              {task.resolvedBy && (
                <p style={styles.resolvedBy}>
                  Resolved by:{' '}
                  <strong>{task.resolvedBy.name}</strong>
                  &nbsp;({task.resolvedBy.employeeId})
                </p>
              )}
            </div>
          ) : (
            /* If Pending — show resolve form */
            <div style={styles.resolveForm}>
              <label style={styles.resolveLabel}>
                ✍️ Your Resolution / Workflow Notes
              </label>
              <textarea
                placeholder="Describe what you did to resolve this issue..."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                style={styles.resolveTextarea}
                rows={4}
              />
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  ...styles.completeBtn,
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? 'Completing...' : '✅ Mark as Complete'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick Complete Button (when not expanded and pending) */}
      {!expanded && !isResolved && (
        <button
          onClick={() => setExpanded(true)}
          style={styles.quickResolveBtn}
        >
          🔧 Resolve this task
        </button>
      )}

      {/* Image Modal */}
      {imgOpen && (
        <div style={styles.modal} onClick={() => setImgOpen(false)}>
          <div style={styles.modalContent}>
            <img
              src={task.imageUrl}
              alt="Full size"
              style={styles.modalImg}
            />
            <p style={styles.modalHint}>Click anywhere to close</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────
const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  pageTitle: {
    margin: '0 0 4px 0',
    fontSize: '24px',
    color: '#1e293b',
  },
  pageSubtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#64748b',
  },
  refreshBtn: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0',
    padding: '10px 18px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  summaryRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '16px',
  },
  summaryCard: {
    borderRadius: '12px',
    padding: '18px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  summaryIcon: {
    fontSize: '28px',
  },
  summaryLabel: {
    margin: '0 0 2px 0',
    fontSize: '13px',
    color: '#64748b',
  },
  summaryValue: {
    margin: 0,
    fontSize: '26px',
    fontWeight: 'bold',
  },
  filterRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  filterBtn: {
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    border: '1px solid #e2e8f0',
    padding: '8px 18px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  filterBtnActive: {
    backgroundColor: '#4f46e5',
    color: 'white',
    border: '1px solid #4f46e5',
  },
  filterCount: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: '1px 7px',
    borderRadius: '10px',
    fontSize: '12px',
  },
  emptyBox: {
    textAlign: 'center',
    padding: '48px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  emptyIcon: {
    fontSize: '48px',
    margin: '0 0 8px 0',
  },
  emptyText: {
    fontSize: '16px',
    color: '#475569',
    fontWeight: '600',
    margin: '0 0 4px 0',
  },
  emptyHint: {
    fontSize: '14px',
    color: '#94a3b8',
    margin: 0,
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  taskCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  taskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  taskHeaderLeft: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  categoryTag: {
    backgroundColor: '#eef2ff',
    color: '#4f46e5',
    padding: '4px 10px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '700',
  },
  statusTag: {
    padding: '4px 10px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '600',
  },
  expandBtn: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    color: '#64748b',
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  reporterBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#f8fafc',
    padding: '12px',
    borderRadius: '8px',
    flexWrap: 'wrap',
  },
  reporterIcon: {
    fontSize: '24px',
  },
  reporterName: {
    margin: '0 0 2px 0',
    fontSize: '14px',
    fontWeight: '700',
    color: '#1e293b',
  },
  reporterMeta: {
    margin: 0,
    fontSize: '12px',
    color: '#64748b',
  },
  dateText: {
    marginLeft: 'auto',
    fontSize: '12px',
    color: '#94a3b8',
  },
  taskDetails: {
    margin: 0,
    fontSize: '14px',
    color: '#475569',
    lineHeight: '1.6',
  },
  expandedContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '16px',
  },
  imgSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  imgLabel: {
    margin: 0,
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
  },
  taskImg: {
    width: '100%',
    maxWidth: '360px',
    height: '200px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
  },
  imgHint: {
    margin: 0,
    fontSize: '11px',
    color: '#94a3b8',
  },
  resolutionBox: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    padding: '14px',
  },
  resolutionLabel: {
    margin: '0 0 6px 0',
    fontSize: '13px',
    fontWeight: '700',
    color: '#16a34a',
  },
  resolutionNote: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.5',
  },
  resolvedBy: {
    margin: 0,
    fontSize: '12px',
    color: '#64748b',
  },
  resolveForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  resolveLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  resolveTextarea: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: '1.5',
  },
  completeBtn: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
  quickResolveBtn: {
    backgroundColor: '#fef9c3',
    color: '#a16207',
    border: '1px solid #fde68a',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    textAlign: 'center',
  },
  modalImg: {
    maxWidth: '90vw',
    maxHeight: '80vh',
    borderRadius: '12px',
    objectFit: 'contain',
  },
  modalHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '13px',
    marginTop: '12px',
  },
};

export default AssignedTasks;