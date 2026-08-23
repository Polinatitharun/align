import React, { useState, useEffect } from 'react';
import { 
  Send, Clock, CheckCircle2, XCircle, Search, Filter, RefreshCw, 
  Upload, UserCheck, AlertTriangle, FileSpreadsheet, ShieldAlert, ArrowUpDown
} from 'lucide-react';
import api from '../api/axios';
import { toast } from 'sonner';

export default function ConsentStatusView({ currentBatch, jobs = [] }) {
  const [consents, setConsents] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, accepted: 0, declined: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedJobFilter, setSelectedJobFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [overridingId, setOverridingId] = useState(null);

  useEffect(() => {
    fetchConsents();
  }, [currentBatch, selectedJobFilter, statusFilter]);

  const fetchConsents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (currentBatch) params.batch = currentBatch;
      if (selectedJobFilter) params.job_id = selectedJobFilter;
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;

      const res = await api.get('/consent/', { params });
      setConsents(res.data.records || []);
      setStats({
        total: res.data.total || 0,
        pending: res.data.pending || 0,
        accepted: res.data.accepted || 0,
        declined: res.data.declined || 0
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load consent records.');
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async (consentId, newStatus) => {
    const reason = window.prompt(`Enter reason for HR override to '${newStatus}':`, 'HR Operational Adjustment');
    if (reason === null) return;

    setOverridingId(consentId);
    try {
      const res = await api.post('/consent/override/', {
        consent_id: consentId,
        status: newStatus,
        remarks: reason
      });
      toast.success(res.data.message || `Consent status updated to ${newStatus}`);
      fetchConsents();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to update consent status.');
    } finally {
      setOverridingId(null);
    }
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await api.post('/consent/bulk-upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.message || 'Bulk consent requests processed successfully!');
      fetchConsents();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to process bulk consent upload.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const filteredRecords = consents.filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.trainee_name?.toLowerCase().includes(term) ||
      r.employee_id?.toLowerCase().includes(term) ||
      r.job_title?.toLowerCase().includes(term) ||
      r.rgs_id?.toLowerCase().includes(term) ||
      r.demand_id?.toLowerCase().includes(term)
    );
  });

  return (
    <div style={{ padding: '4px 0' }}>
      {/* Top Header & Telemetry */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>
            Associate Consent Management
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Track and oversee project alignment consent requests sent to trainees
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <label style={{
            padding: '8px 14px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            color: '#334155',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: uploading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Upload size={15} />
            <span>{uploading ? 'Uploading...' : 'Bulk Consent Excel'}</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleBulkUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>

          <button
            onClick={fetchConsents}
            disabled={loading}
            style={{
              padding: '8px 14px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              color: '#334155',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Telemetry Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px',
        marginBottom: '24px'
      }}>
        <div style={kpiCardStyle('#3b82f6')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Total Requests</span>
            <Send size={18} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0f172a', marginTop: '6px' }}>
            {stats.total}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Sent across requirements</span>
        </div>

        <div style={kpiCardStyle('#f59e0b')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#b45309' }}>Pending Response</span>
            <Clock size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#d97706', marginTop: '6px' }}>
            {stats.pending}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#b45309' }}>Awaiting candidate action</span>
        </div>

        <div style={kpiCardStyle('#10b981')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#047857' }}>Accepted</span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#059669', marginTop: '6px' }}>
            {stats.accepted}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#047857' }}>Confirmed & locked</span>
        </div>

        <div style={kpiCardStyle('#ef4444')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#b91c1c' }}>Declined</span>
            <XCircle size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#dc2626', marginTop: '6px' }}>
            {stats.declined}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#b91c1c' }}>Released for other jobs</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '18px',
        display: 'flex',
        gap: '14px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by candidate name, employee ID, project, RGS ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Job Filter */}
        <div style={{ minWidth: '200px' }}>
          <select
            value={selectedJobFilter}
            onChange={e => setSelectedJobFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              background: '#ffffff',
              outline: 'none'
            }}
          >
            <option value="">All Job Requirements</option>
            {jobs.map(j => (
              <option key={j.id} value={j.id}>
                {j.project_name} ({j.location})
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {['ALL', 'PENDING', 'ACCEPTED', 'DECLINED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: statusFilter === st ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                background: statusFilter === st ? '#eff6ff' : '#ffffff',
                color: statusFilter === st ? '#1d4ed8' : '#64748b',
                fontWeight: 600,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Consent Records */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                <th style={{ padding: '12px 16px' }}>Candidate</th>
                <th style={{ padding: '12px 16px' }}>Emp ID</th>
                <th style={{ padding: '12px 16px' }}>Batch</th>
                <th style={{ padding: '12px 16px' }}>Project Requirement</th>
                <th style={{ padding: '12px 16px' }}>RGS ID</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Remarks</th>
                <th style={{ padding: '12px 16px' }}>Timeline</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>HR Override</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px', display: 'block' }} />
                    Loading consent tracking records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                    No consent records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => (
                  <tr key={r.id || idx} style={{
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                  }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>
                      {r.trainee_name}
                      {r.email && <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>{r.email}</div>}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>
                      {r.employee_id || 'N/A'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>
                      {r.batch_name || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#1e293b', fontWeight: 500 }}>
                      {r.job_title}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>
                      {r.rgs_id || r.demand_id || '-'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: r.status === 'ACCEPTED' ? '#dcfce7' : r.status === 'DECLINED' ? '#fee2e2' : '#fef3c7',
                        color: r.status === 'ACCEPTED' ? '#15803d' : r.status === 'DECLINED' ? '#b91c1c' : '#b45309'
                      }}>
                        {r.status === 'ACCEPTED' && <CheckCircle2 size={12} />}
                        {r.status === 'DECLINED' && <XCircle size={12} />}
                        {r.status === 'PENDING' && <Clock size={12} />}
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', maxWidth: '200px', color: '#334155' }}>
                      {r.remarks ? (
                        <div style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '0.78rem',
                          fontStyle: 'italic'
                        }}>
                          "{r.remarks}"
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: '#64748b' }}>
                      <div>Sent: {r.sent_at ? new Date(r.sent_at).toLocaleDateString() : '-'}</div>
                      {r.responded_at && <div>Resp: {new Date(r.responded_at).toLocaleDateString()}</div>}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        {r.status !== 'ACCEPTED' && (
                          <button
                            onClick={() => handleOverride(r.id, 'ACCEPTED')}
                            disabled={overridingId === r.id}
                            title="Force Accept"
                            style={{
                              padding: '4px 8px',
                              background: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              color: '#065f46',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Accept
                          </button>
                        )}
                        {r.status !== 'DECLINED' && (
                          <button
                            onClick={() => handleOverride(r.id, 'DECLINED')}
                            disabled={overridingId === r.id}
                            title="Force Decline"
                            style={{
                              padding: '4px 8px',
                              background: '#fff1f2',
                              border: '1px solid #fecdd3',
                              color: '#9f1239',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Decline
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const kpiCardStyle = (borderColor) => ({
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderTop: `4px solid ${borderColor}`,
  borderRadius: '12px',
  padding: '16px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
});
