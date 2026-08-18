import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, 
  CheckCircle, 
  Lock, 
  XCircle, 
  Eye, 
  RefreshCw, 
  Download, 
  Briefcase, 
  Search, 
  FileSpreadsheet, 
  Unlock, 
  UserX,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import DataTable from './DataTable';
import api from '../api/axios';
import { toast } from 'sonner';

const CandidatesView = ({ 
  selectedBatch, 
  allTrainees = [], 
  jobs = [],
  onViewTrainee,
  onUnlockInterview,
  onCancelSelected,
  onUnmapTrainee,
  onRefresh,
  onRequestDownload
}) => {
  const [statusFilter, setStatusFilter] = useState('all'); // all | selected | locked | rejected | unassigned
  const [jobFilter, setJobFilter] = useState('');
  const [locks, setLocks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLocksData = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/interview-locks/${selectedBatch ? `?batch=${encodeURIComponent(selectedBatch)}` : ''}`;
      const res = await api.get(url);
      setLocks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to load candidate interview records');
      setLocks([]);
    } finally {
      setLoading(false);
    }
  }, [selectedBatch]);

  useEffect(() => {
    fetchLocksData();
  }, [fetchLocksData]);

  // Combine Interview Locks with Trainee Profile Data for a complete unified candidate view
  const unifiedCandidates = useMemo(() => {
    const records = [];
    const processedUserIds = new Set();

    // 1. Process Interview Locks
    (locks || []).forEach(lock => {
      const traineeId = String(lock.trainee_id || '');
      processedUserIds.add(traineeId);
      
      const traineeObj = (allTrainees || []).find(t => String(t.userId || t.id) === traineeId);
      
      records.push({
        id: `lock-${lock.id}`,
        lockId: lock.id,
        traineeId: traineeId,
        name: lock.trainee_name || traineeObj?.name || 'Unknown Candidate',
        email: traineeObj?.email || `${traineeId}@tcs.com`,
        jobId: String(lock.job_id || lock.job || ''),
        jobTitle: lock.job_title || traineeObj?.projectName || '—',
        status: lock.status || 'locked', // locked | selected | rejected
        source: 'Interview',
        interviewer: lock.assigned_to_name || 'Not Assigned',
        interviewDate: lock.interview_datetime,
        skills: traineeObj?.skills || [],
        score: traineeObj?.score ?? 0,
        location: traineeObj?.location || '—',
        batch: traineeObj?.batch_name || lock.batch_name || selectedBatch || '—',
        isMapped: traineeObj?.isMapped ?? false,
        rawLock: lock,
        rawTrainee: traineeObj,
      });
    });

    // 2. Process Direct Mapped Trainees not in interview locks
    (allTrainees || []).forEach(trainee => {
      const traineeId = String(trainee.userId || trainee.id || '');
      if (!processedUserIds.has(traineeId) && trainee.isMapped) {
        records.push({
          id: `trainee-${traineeId}`,
          lockId: null,
          traineeId: traineeId,
          name: trainee.name || 'Unknown Candidate',
          email: trainee.email || `${traineeId}@tcs.com`,
          jobId: String(trainee.projectId || ''),
          jobTitle: trainee.projectName || 'Direct Project Assignment',
          status: 'selected',
          source: 'Direct Assignment',
          interviewer: 'Direct HR Placement',
          interviewDate: null,
          skills: trainee.skills || [],
          score: trainee.score ?? 0,
          location: trainee.location || '—',
          batch: trainee.batch_name || selectedBatch || '—',
          isMapped: true,
          rawLock: null,
          rawTrainee: trainee,
        });
      } else if (!processedUserIds.has(traineeId) && !trainee.isMapped) {
        // Unassigned / Open pool trainees
        records.push({
          id: `trainee-${traineeId}`,
          lockId: null,
          traineeId: traineeId,
          name: trainee.name || 'Unknown Candidate',
          email: trainee.email || `${traineeId}@tcs.com`,
          jobId: '',
          jobTitle: 'Unassigned',
          status: 'unassigned',
          source: 'Talent Pool',
          interviewer: '—',
          interviewDate: null,
          skills: trainee.skills || [],
          score: trainee.score ?? 0,
          location: trainee.location || '—',
          batch: trainee.batch_name || selectedBatch || '—',
          isMapped: false,
          rawLock: null,
          rawTrainee: trainee,
        });
      }
    });

    return records;
  }, [locks, allTrainees, selectedBatch]);

  // Filtered by Status & Job
  const filteredData = useMemo(() => {
    return unifiedCandidates.filter(item => {
      // Status Filter
      if (statusFilter === 'selected' && item.status !== 'selected') return false;
      if (statusFilter === 'locked' && item.status !== 'locked') return false;
      if (statusFilter === 'rejected' && item.status !== 'rejected') return false;
      if (statusFilter === 'unassigned' && item.status !== 'unassigned') return false;

      // Job Filter
      if (jobFilter && String(item.jobId) !== String(jobFilter)) return false;

      return true;
    });
  }, [unifiedCandidates, statusFilter, jobFilter]);

  // Counts for tabs
  const counts = useMemo(() => ({
    all: unifiedCandidates.length,
    selected: unifiedCandidates.filter(c => c.status === 'selected').length,
    locked: unifiedCandidates.filter(c => c.status === 'locked').length,
    rejected: unifiedCandidates.filter(c => c.status === 'rejected').length,
    unassigned: unifiedCandidates.filter(c => c.status === 'unassigned').length,
  }), [unifiedCandidates]);

  // Excel Table Columns
  const columns = useMemo(() => [
    {
      key: 'name',
      label: 'Candidate Name',
      sortable: true,
      filterable: true,
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{row.name}</span>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{row.email}</span>
        </div>
      ),
    },
    {
      key: 'jobTitle',
      label: 'Assigned Job / Demand',
      sortable: true,
      filterable: true,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Briefcase size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <span style={{ fontWeight: 500 }}>{row.jobTitle}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Candidate Status',
      sortable: true,
      filterable: true,
      filterOptions: [
        { label: 'Selected', value: 'selected' },
        { label: 'Locked for Interview', value: 'locked' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Unassigned', value: 'unassigned' },
      ],
      render: (row) => {
        if (row.status === 'selected') {
          return <span className="status-badge status-selected"><CheckCircle size={12} /> Selected</span>;
        }
        if (row.status === 'locked') {
          return <span className="status-badge status-locked"><Lock size={12} /> Locked</span>;
        }
        if (row.status === 'rejected') {
          return <span className="status-badge status-rejected"><XCircle size={12} /> Rejected</span>;
        }
        return <span className="status-badge status-inactive">Unassigned Pool</span>;
      },
    },
    {
      key: 'source',
      label: 'Source',
      sortable: true,
      filterable: true,
      render: (row) => (
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          {row.source}
        </span>
      ),
    },
    {
      key: 'interviewer',
      label: 'Assigned Interviewer',
      sortable: true,
      filterable: true,
      render: (row) => row.interviewer || '—',
    },
    {
      key: 'interviewDate',
      label: 'Interview Date',
      sortable: true,
      render: (row) => row.interviewDate ? new Date(row.interviewDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—',
    },
    {
      key: 'score',
      label: 'Avg Score',
      sortable: true,
      render: (row) => (
        <span style={{ 
          fontWeight: 700, 
          fontSize: '0.78rem', 
          color: row.score >= 75 ? 'var(--success)' : row.score >= 50 ? 'var(--warning)' : 'var(--danger)' 
        }}>
          {row.score > 0 ? `${row.score}%` : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button 
            type="button"
            className="btn-icon" 
            title="View Candidate Profile"
            onClick={() => {
              if (onViewTrainee && row.rawTrainee) {
                onViewTrainee(row.rawTrainee);
              } else if (onViewTrainee) {
                onViewTrainee({ id: row.traineeId, userId: row.traineeId, name: row.name, email: row.email, skills: row.skills, location: row.location });
              }
            }}
          >
            <Eye size={15} />
          </button>

          {row.status === 'locked' && row.rawLock && onUnlockInterview && (
            <button 
              type="button"
              className="btn-icon" 
              title="Unlock / Reschedule Interview"
              onClick={() => onUnlockInterview(row.rawLock)}
              style={{ color: 'var(--warning)' }}
            >
              <Unlock size={15} />
            </button>
          )}

          {row.status === 'selected' && onCancelSelected && (
            <button 
              type="button"
              className="btn-icon" 
              title="Cancel Selection / Unmap"
              onClick={() => {
                if (row.lockId) {
                  onCancelSelected(row.lockId);
                } else if (row.rawTrainee && onUnmapTrainee) {
                  onUnmapTrainee(row.rawTrainee);
                }
              }}
              style={{ color: 'var(--danger)' }}
            >
              <UserX size={15} />
            </button>
          )}
        </div>
      ),
    },
  ], [onViewTrainee, onUnlockInterview, onCancelSelected, onUnmapTrainee]);

  const handleRefresh = async () => {
    await fetchLocksData();
    if (onRefresh) onRefresh();
    toast.success('Candidates list updated');
  };

  return (
    <div className="unified-candidates-view">
      {/* Context Breadcrumb */}
      <div className="page-context-bar">
        <div className="breadcrumb-nav">
          <span className="breadcrumb-root">HR Dashboard</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">Candidate Management</span>
          {selectedBatch && (
            <span className="badge badge-primary" style={{ marginLeft: '0.5rem' }}>
              Batch: {selectedBatch}
            </span>
          )}
        </div>

        <div className="page-context-actions">
          {onRequestDownload && (
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={() => onRequestDownload(statusFilter === 'all' ? 'selected' : statusFilter)}
              title="Download password-protected report"
            >
              <Download size={14} />
              <span>Export Report</span>
            </button>
          )}
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={handleRefresh} 
            disabled={loading}
            title="Refresh candidate data"
          >
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Unified Status Filter Tabs */}
      <div className="nav-tab-strip">
        <button 
          type="button"
          className={`nav-tab ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          <Users size={14} />
          <span>All Candidates</span>
          <span className="tab-badge">{counts.all}</span>
        </button>

        <button 
          type="button"
          className={`nav-tab ${statusFilter === 'selected' ? 'active' : ''}`}
          onClick={() => setStatusFilter('selected')}
        >
          <CheckCircle size={14} style={{ color: 'var(--success)' }} />
          <span>Selected Candidates</span>
          <span className="tab-badge">{counts.selected}</span>
        </button>

        <button 
          type="button"
          className={`nav-tab ${statusFilter === 'locked' ? 'active' : ''}`}
          onClick={() => setStatusFilter('locked')}
        >
          <Lock size={14} style={{ color: 'var(--warning)' }} />
          <span>Locked for Interview</span>
          <span className="tab-badge">{counts.locked}</span>
        </button>

        <button 
          type="button"
          className={`nav-tab ${statusFilter === 'rejected' ? 'active' : ''}`}
          onClick={() => setStatusFilter('rejected')}
        >
          <XCircle size={14} style={{ color: 'var(--danger)' }} />
          <span>Rejected Candidates</span>
          <span className="tab-badge">{counts.rejected}</span>
        </button>

        <button 
          type="button"
          className={`nav-tab ${statusFilter === 'unassigned' ? 'active' : ''}`}
          onClick={() => setStatusFilter('unassigned')}
        >
          <AlertCircle size={14} />
          <span>Unassigned Pool</span>
          <span className="tab-badge">{counts.unassigned}</span>
        </button>
      </div>

      {/* Secondary Filter: Job Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Briefcase size={15} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Filter by Job:</span>
        </div>
        <select 
          className="form-control" 
          value={jobFilter} 
          onChange={(e) => setJobFilter(e.target.value)}
          style={{ maxWidth: '320px', padding: '0.35rem 0.65rem', fontSize: '0.82rem' }}
        >
          <option value="">All Jobs & Projects ({jobs.length})</option>
          {jobs.map(job => (
            <option key={job.id} value={job.id}>
              {job.project_name} ({job.department || 'General'})
            </option>
          ))}
        </select>

        {jobFilter && (
          <button 
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setJobFilter('')}
          >
            Clear Job Filter
          </button>
        )}
      </div>

      {/* Main Excel-like DataTable */}
      <DataTable
        columns={columns}
        data={filteredData}
        loading={loading}
        pageSize={10}
        pageSizeOptions={[10, 25, 50, 100]}
        emptyMessage="No candidates match your current filter criteria."
        searchPlaceholder="Search candidates by name, email, skills..."
      />
    </div>
  );
};

export default CandidatesView;