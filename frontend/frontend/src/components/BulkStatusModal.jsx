import React, { useState } from 'react';
import { CheckCircle, XCircle, X, AlertCircle, Users, Check, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { toast } from 'sonner';

export default function BulkStatusModal({ isOpen, onClose, selectedItems = [], onSuccess }) {
  const [status, setStatus] = useState('selected');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedItems || selectedItems.length === 0) {
      toast.error('No candidates selected.');
      return;
    }

    setSubmitting(true);
    try {
      const lockIds = selectedItems.map(item => item.id || item.lock_id || item.trainee_id);
      const res = await api.post('/jobs/bulk-status/', {
        locks: lockIds,
        status: status
      });

      toast.success(res.data.message || `Successfully updated ${res.data.updated || lockIds.length} candidate(s) to ${status}!`);
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.details?.join(' ') || err.response?.data?.error || 'Failed to update candidate status.';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        maxWidth: '520px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          background: status === 'selected' ? 'linear-gradient(135deg, #065f46 0%, #047857 100%)' : 'linear-gradient(135deg, #991b1b 0%, #b91c1c 100%)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {status === 'selected' ? <CheckCircle size={22} /> : <XCircle size={22} />}
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#fff' }}>
              Bulk Update Candidate Status
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Target Status Selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '8px', fontSize: '0.9rem' }}>
              Select Desired Outcome:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setStatus('selected')}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: status === 'selected' ? '2px solid #059669' : '1px solid #cbd5e1',
                  background: status === 'selected' ? '#ecfdf5' : '#ffffff',
                  color: status === 'selected' ? '#065f46' : '#64748b',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <CheckCircle size={18} color={status === 'selected' ? '#059669' : '#94a3b8'} />
                <span>Mark Selected</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('rejected')}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: status === 'rejected' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                  background: status === 'rejected' ? '#fef2f2' : '#ffffff',
                  color: status === 'rejected' ? '#991b1b' : '#64748b',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <XCircle size={18} color={status === 'rejected' ? '#dc2626' : '#94a3b8'} />
                <span>Mark Rejected</span>
              </button>
            </div>
          </div>

          {/* Selected Candidates Summary */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
              <Users size={16} color="#6366f1" />
              <span>Selected Candidates ({selectedItems.length})</span>
            </div>
            <div style={{
              maxHeight: '140px',
              overflowY: 'auto',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              background: '#f8fafc'
            }}>
              {selectedItems.map((item, i) => (
                <div key={i} style={{
                  padding: '8px 12px',
                  borderBottom: i === selectedItems.length - 1 ? 'none' : '1px solid #e2e8f0',
                  fontSize: '0.85rem',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <strong style={{ color: '#1e293b' }}>
                    {item.trainee_name || item.name || `Trainee #${item.id || item.trainee_id}`}
                  </strong>
                  <span style={{ color: '#64748b' }}>{item.job_title || item.projectName || ''}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Policy Info */}
          <div style={{
            background: status === 'selected' ? '#f0fdf4' : '#fff1f2',
            border: status === 'selected' ? '1px solid #bbf7d0' : '1px solid #fecdd3',
            borderRadius: '10px',
            padding: '12px',
            fontSize: '0.82rem',
            color: status === 'selected' ? '#166534' : '#9f1239',
            display: 'flex',
            gap: '8px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              {status === 'selected' ? (
                <span>
                  <strong>Selected Action:</strong> Candidates will be mapped to their project requirement (<code>isMapped=True</code>), remaining openings will decrement, and candidates will be locked from future matching elsewhere.
                </span>
              ) : (
                <span>
                  <strong>Rejected Action:</strong> Candidates will be released and marked rejected. They will not be matched for this specific requirement in the future.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#475569',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || selectedItems.length === 0}
            style={{
              padding: '9px 22px',
              borderRadius: '8px',
              border: 'none',
              background: status === 'selected' ? '#059669' : '#dc2626',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: status === 'selected' ? '0 4px 12px rgba(5, 150, 105, 0.3)' : '0 4px 12px rgba(220, 38, 38, 0.3)'
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Confirm Bulk {status === 'selected' ? 'Selection' : 'Rejection'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
