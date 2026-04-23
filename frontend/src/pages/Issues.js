import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { createIssue, getMyIssues } from '../services/api';
import Spinner from '../components/Spinner';

const CATEGORIES = ['IT', 'HR', 'Accounts', 'Maintenance', 'Marketing', 'Operations'];

const Issues = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    category: '',
    details: '',
    image: null,
  });

  // Fetch my issues on load
  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const res = await getMyIssues();
      setIssues(res.data.issues);
    } catch (err) {
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image: null });
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category || !formData.details) {
      return toast.error('Category and details are required');
    }

    try {
      setSubmitting(true);

      // Build FormData for multipart upload
      const data = new FormData();
      data.append('category', formData.category);
      data.append('details', formData.details);
      if (formData.image) {
        data.append('image', formData.image);
      }

      await createIssue(data);
      toast.success('Issue reported successfully!');

      // Reset form
      setFormData({ category: '', details: '', image: null });
      setImagePreview(null);
      setShowForm(false);

      // Refresh issues list
      fetchIssues();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to report issue');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({ category: '', details: '', image: null });
    setImagePreview(null);
    setShowForm(false);
  };

  return (
    <div style={styles.wrapper}>
      {/* Page Header */}
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.pageTitle}>🐛 Issues / Support</h2>
          <p style={styles.pageSubtitle}>
            Report issues you're facing and track their status
          </p>
        </div>
        <button
          style={styles.newBtn}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Cancel' : '+ Report New Issue'}
        </button>
      </div>

      {/* Report Issue Form */}
      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>📝 Report an Issue</h3>
          <form onSubmit={handleSubmit} style={styles.form}>

            {/* Category */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Issue Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="">-- Select category --</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <p style={styles.hint}>
                This determines which team will handle your issue
              </p>
            </div>

            {/* Details */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Issue Details</label>
              <textarea
                name="details"
                placeholder="Describe the issue in detail..."
                value={formData.details}
                onChange={handleChange}
                style={styles.textarea}
                rows={5}
              />
            </div>

            {/* Image Upload */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Attach Image (Optional)</label>
              {!imagePreview ? (
                <label style={styles.uploadBox}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  <div style={styles.uploadInner}>
                    <span style={styles.uploadIcon}>📁</span>
                    <p style={styles.uploadText}>
                      Click to upload an image
                    </p>
                    <p style={styles.uploadHint}>
                      JPEG, PNG, GIF, WEBP up to 5MB
                    </p>
                  </div>
                </label>
              ) : (
                <div style={styles.previewBox}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={styles.previewImg}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    style={styles.removeImgBtn}
                  >
                    ✕ Remove Image
                  </button>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div style={styles.btnRow}>
              <button
                type="button"
                onClick={handleCancel}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  ...styles.submitBtn,
                  opacity: submitting ? 0.7 : 1,
                }}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : '🚀 Submit Issue'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Issues List */}
      <div style={styles.listSection}>
        <div style={styles.listHeader}>
          <h3 style={styles.listTitle}>📋 My Reported Issues</h3>
          <span style={styles.countBadge}>{issues.length} total</span>
        </div>

        {loading ? (
          <Spinner />
        ) : issues.length === 0 ? (
          <div style={styles.emptyBox}>
            <p style={styles.emptyIcon}>📭</p>
            <p style={styles.emptyText}>No issues reported yet.</p>
            <p style={styles.emptyHint}>
              Click "Report New Issue" to get started.
            </p>
          </div>
        ) : (
          <div style={styles.issueGrid}>
            {issues.map((issue) => (
              <IssueCard key={issue._id} issue={issue} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Issue Card Component ──────────────────────────────────────────────
const IssueCard = ({ issue }) => {
  const [imgOpen, setImgOpen] = useState(false);

  return (
    <div style={styles.issueCard}>
      {/* Card Top */}
      <div style={styles.cardTop}>
        <span style={styles.categoryTag}>{issue.category}</span>
        <span
          style={{
            ...styles.statusTag,
            backgroundColor:
              issue.status === 'resolved' ? '#dcfce7' : '#fef9c3',
            color: issue.status === 'resolved' ? '#16a34a' : '#a16207',
          }}
        >
          {issue.status === 'resolved' ? '✅ Resolved' : '⏳ Pending'}
        </span>
      </div>

      {/* Details */}
      <p style={styles.issueDetails}>{issue.details}</p>

      {/* Image */}
      {issue.imageUrl && (
        <div style={styles.imgWrapper}>
          <img
            src={issue.imageUrl}
            alt="Issue"
            style={styles.issueImg}
            onClick={() => setImgOpen(true)}
          />
          <p style={styles.imgHint}>Click image to enlarge</p>
        </div>
      )}

      {/* Resolution Note */}
      {issue.status === 'resolved' && issue.resolutionNote && (
        <div style={styles.resolutionBox}>
          <p style={styles.resolutionLabel}>🔧 Resolution:</p>
          <p style={styles.resolutionNote}>{issue.resolutionNote}</p>
          {issue.resolvedBy && (
            <p style={styles.resolvedBy}>
              Resolved by: <strong>{issue.resolvedBy.name}</strong>
              &nbsp;({issue.resolvedBy.employeeId})
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={styles.cardFooter}>
        <span style={styles.dateText}>
          🕐 {new Date(issue.createdAt).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
          })}
        </span>
      </div>

      {/* Image Modal */}
      {imgOpen && (
        <div style={styles.modal} onClick={() => setImgOpen(false)}>
          <div style={styles.modalContent}>
            <img
              src={issue.imageUrl}
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
  newBtn: {
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0',
  },
  formTitle: {
    margin: '0 0 20px 0',
    fontSize: '18px',
    color: '#1e293b',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  hint: {
    margin: '4px 0 0 0',
    fontSize: '12px',
    color: '#94a3b8',
  },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    backgroundColor: 'white',
    outline: 'none',
  },
  textarea: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  uploadBox: {
    border: '2px dashed #c7d2fe',
    borderRadius: '12px',
    padding: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundColor: '#f8faff',
    transition: 'background 0.2s',
  },
  uploadInner: {
    textAlign: 'center',
  },
  uploadIcon: {
    fontSize: '36px',
  },
  uploadText: {
    margin: '8px 0 4px 0',
    fontSize: '14px',
    color: '#4f46e5',
    fontWeight: '600',
  },
  uploadHint: {
    margin: 0,
    fontSize: '12px',
    color: '#94a3b8',
  },
  previewBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '10px',
  },
  previewImg: {
    width: '100%',
    maxWidth: '320px',
    height: '180px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  removeImgBtn: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  btnRow: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  submitBtn: {
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    padding: '10px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  listSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  listHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  listTitle: {
    margin: 0,
    fontSize: '18px',
    color: '#1e293b',
  },
  countBadge: {
    backgroundColor: '#eef2ff',
    color: '#4f46e5',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600',
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
  issueGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '16px',
  },
  issueCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #f1f5f9',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
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
  issueDetails: {
    margin: 0,
    fontSize: '14px',
    color: '#475569',
    lineHeight: '1.5',
  },
  imgWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  issueImg: {
    width: '100%',
    height: '160px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
  },
  imgHint: {
    margin: 0,
    fontSize: '11px',
    color: '#94a3b8',
    textAlign: 'center',
  },
  resolutionBox: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    padding: '12px',
  },
  resolutionLabel: {
    margin: '0 0 4px 0',
    fontSize: '13px',
    fontWeight: '700',
    color: '#16a34a',
  },
  resolutionNote: {
    margin: '0 0 6px 0',
    fontSize: '13px',
    color: '#374151',
    lineHeight: '1.5',
  },
  resolvedBy: {
    margin: 0,
    fontSize: '12px',
    color: '#64748b',
  },
  cardFooter: {
    borderTop: '1px solid #f1f5f9',
    paddingTop: '10px',
  },
  dateText: {
    fontSize: '12px',
    color: '#94a3b8',
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

export default Issues;