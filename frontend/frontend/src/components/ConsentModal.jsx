import React, { useState } from 'react';
import { Send, X, AlertCircle, CheckCircle2, Users, Briefcase } from 'lucide-react';
import api from '../api/axios';
import { toast } from 'sonner';

export default function ConsentModal({ isOpen, onClose, selectedCandidates = [], selectedJob, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSendConsent = async () => {
    if (!selectedJob?.id) {
      toast.error("No job selected.");
      return;
    }
    if (!selectedCandidates || selectedCandidates.length === 0) {
      toast.error("Please select at least one candidate.");
      return;
    }

    setSubmitting(true);
    try {
      const candidateIds = selectedCandidates.map(c => c.trainee_id || c.userId || c.employeeId || c.id);
      const res = await api.post('/consent/send/', {
        job_id: selectedJob.id,
        trainee_ids: candidateIds
      });
      toast.success(res.data.message || `Consent requests sent to ${candidateIds.length} candidate(s)!`);
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to send consent requests.");
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
        maxWidth: '560px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60a5fa'
            }}>
              <Send size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#fff' }}>Send Consent Request</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                Request candidate confirmation for project alignment
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Target Job Info Card */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 600, fontSize: '0.95rem', marginBottom: '8px' }}>
              <Briefcase size={16} color="#3b82f6" />
              <span>Target Project Requirement</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: '#64748b' }}>Project: </span>
                <strong style={{ color: '#1e293b' }}>{selectedJob?.project_name || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Location: </span>
                <strong style={{ color: '#1e293b' }}>{selectedJob?.location || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Stream/Skills: </span>
                <strong style={{ color: '#1e293b' }}>{selectedJob?.stream || selectedJob?.skills || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Openings Left: </span>
                <strong style={{ color: '#10b981' }}>{Math.max(0, (selectedJob?.openings || 0) - (selectedJob?.filled || 0))}</strong>
              </div>
            </div>
          </div>

          {/* Selected Candidates List Summary */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
                <Users size={16} color="#6366f1" />
                <span>Selected Candidates ({selectedCandidates.length})</span>
              </div>
            </div>
            <div style={{
              maxHeight: '160px',
              overflowY: 'auto',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              background: '#ffffff'
            }}>
              {selectedCandidates.map((c, i) => (
                <div key={i} style={{
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: i === selectedCandidates.length - 1 ? 'none' : '1px solid #f1f5f9',
                  fontSize: '0.85rem'
                }}>
                  <div>
                    <strong style={{ color: '#0f172a' }}>{c.trainee_name || c.name || 'Candidate'}</strong>
                    <span style={{ color: '#64748b', marginLeft: '8px' }}>({c.employee_id || c.employeeId || c.userId || `ID: ${c.trainee_id}`})</span>
                  </div>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: '#e0e7ff',
                    color: '#4338ca'
                  }}>
                    {c.total_percentage || c.score ? `${Math.round(c.total_percentage || c.score)}% Match` : 'Ready'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Notice Alert */}
          <div style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '10px',
            padding: '12px 14px',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
            fontSize: '0.82rem',
            color: '#1e40af'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Workflow Isolation Rule:</strong> Once consent is sent, these candidates will be marked as <em>Consent Pending</em> and automatically locked from matching searches for other project requirements until responded or released.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
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
              padding: '10px 18px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSendConsent}
            disabled={submitting || selectedCandidates.length === 0}
            style={{
              padding: '10px 22px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: submitting || selectedCandidates.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}
          >
            {submitting ? (
              <span>Sending...</span>
            ) : (
              <>
                <Send size={16} />
                <span>Confirm & Send Consent ({selectedCandidates.length})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
