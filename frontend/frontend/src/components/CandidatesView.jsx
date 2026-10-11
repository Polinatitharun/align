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
  AlertCircle,
  MapPin
} from 'lucide-react';
import DataTable from './DataTable';
import BulkStatusModal from './BulkStatusModal';
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
  onRequestDownload,
  onOpenPrefLoc
}) => {
  const [statusFilter, setStatusFilter] = useState('all'); // all | selected | locked | rejected | unassigned
  const [jobFilter, setJobFilter] = useState('');
  const [locks, setLocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);

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

  // Helper to extract all 3 preferred locations (or fallback) from trainee profile and locks
  const extractTraineePreferredLocations = (trainee, lock) => {
    const u = trainee?.userInfo || trainee?.traineeData?.userInfo || lock?.trainee?.userInfo || {};
    const rawList = [
      trainee?.preferredLocation1,
      trainee?.preferredLocation2,
      trainee?.preferredLocation3,
      trainee?.preferred_location_1,
      trainee?.preferred_location_2,
      trainee?.preferred_location_3,
      u?.preferred_location_1,
      u?.preferred_location_2,
      u?.preferred_location_3,
      lock?.preferred_location_1,
      lock?.preferred_location_2,
      lock?.preferred_location_3,
      ...(Array.isArray(trainee?.preferredLocations) ? trainee.preferredLocations : []),
      ...(Array.isArray(trainee?.preferred_locations) ? trainee.preferred_locations : []),
      ...(Array.isArray(lock?.preferred_locations) ? lock.preferred_locations : []),
    ];

    const clean = [];
    rawList.forEach(item => {
      if (item && typeof item === 'string') {
        const trimmed = item.trim();
        if (trimmed && !['unknown', 'none', 'null', 'n/a', '-', '—', 'undefined'].includes(trimmed.toLowerCase())) {
          if (!clean.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
            clean.push(trimmed);
          }
        }
      }
    });

    if (clean.length === 0) {
      const fallback = lock?.trainee_location || trainee?.location || u?.location || lock?.location || '';
      if (fallback && typeof fallback === 'string') {
        const parts = fallback.split(',').map(s => s.trim()).filter(Boolean);
        parts.forEach(p => {
          if (p && !['unknown', 'none', 'null', 'n/a', '-', '—'].includes(p.toLowerCase())) {
            if (!clean.some(c => c.toLowerCase() === p.toLowerCase())) {
              clean.push(p.charAt(0).toUpperCase() + p.slice(1));
            }
          }
        });
      }
    }

    return clean;
  };

  // Combine Interview Locks with Trainee Profile Data for a complete unified candidate view
  const unifiedCandidates = useMemo(() => {
    const records = [];
    const processedUserIds = new Set();

    // Helper to find matched job object across ID, demand_id, rgs_id, or project_name
    const findJob = (jobRef, demandRef, titleRef) => {
      const cleanJobRef = jobRef != null && typeof jobRef !== 'object' ? String(jobRef).trim() : '';
      const cleanDemandRef = demandRef ? String(demandRef).trim().toLowerCase() : '';
      const cleanTitleRef = titleRef ? String(titleRef).trim().toLowerCase() : '';

      return (jobs || []).find(j => {
        const jId = String(j.id || j.pk || '').trim();
        const jDemand = String(j.demand_id || j.demandId || '').trim().toLowerCase();
        const jRgs = String(j.rgs_id || '').trim().toLowerCase();
        const jName = String(j.project_name || j.projectName || '').trim().toLowerCase();

        if (cleanJobRef && (jId === cleanJobRef || jDemand === cleanJobRef.toLowerCase() || jName === cleanJobRef.toLowerCase())) return true;
        if (cleanDemandRef && (jDemand === cleanDemandRef || jRgs === cleanDemandRef)) return true;
        if (cleanTitleRef && jName === cleanTitleRef) return true;
        return false;
      });
    };

    // 1. Process Interview Locks
    (locks || []).forEach(lock => {
      const traineeId = String(
        lock.trainee_id || 
        lock.profile_id || 
        lock.trainee?.id || 
        lock.trainee?.pk || 
        (typeof lock.trainee === 'number' || typeof lock.trainee === 'string' ? lock.trainee : '') || 
        ''
      );
      
      const traineeObj = (allTrainees || []).find(t => 
        (traineeId && (String(t.userId || '') === traineeId || String(t.id || '') === traineeId || (t.employeeId && String(t.employeeId) === traineeId)))
      );

      if (traineeId) processedUserIds.add(traineeId);
      if (traineeObj?.id) processedUserIds.add(String(traineeObj.id));
      if (traineeObj?.userId) processedUserIds.add(String(traineeObj.userId));
      if (traineeObj?.employeeId) processedUserIds.add(String(traineeObj.employeeId));

      const rawJobId = lock.job_id || (typeof lock.job === 'object' ? (lock.job?.id || lock.job?.pk) : lock.job) || '';
      const lockJobTitle = lock.job_title || (typeof lock.job === 'object' ? (lock.job?.project_name || lock.job?.projectName) : '') || '';
      const lockDemandId = lock.demand_id || (typeof lock.job === 'object' ? lock.job?.demand_id : '') || '';

      const matchedJob = findJob(rawJobId, lockDemandId, lockJobTitle) || findJob(traineeObj?.projectId, '', traineeObj?.projectName);

      const finalJobId = matchedJob ? String(matchedJob.id) : (rawJobId ? String(rawJobId) : '');
      const finalJobTitle = matchedJob?.project_name || lockJobTitle || traineeObj?.projectName || '—';
      const finalDemandId = matchedJob?.demand_id || lockDemandId || '';

      const prefLocs = extractTraineePreferredLocations(traineeObj, lock);

      records.push({
        id: `lock-${lock.id}`,
        lockId: lock.id,
        traineeId: traineeId || traineeObj?.userId || traineeObj?.id || '',
        name: lock.trainee_name || traineeObj?.name || 'Unknown Candidate',
        email: traineeObj?.email || (traineeId ? `${traineeId}@tcs.com` : '—'),
        jobId: finalJobId,
        demandId: finalDemandId,
        jobTitle: finalJobTitle,
        rawJob: matchedJob || null,
        status: lock.status || 'locked', // locked | selected | rejected | cancelled
        source: 'Interview',
        interviewer: lock.assigned_to_name || 'Not Assigned',
        interviewDate: lock.interview_datetime,
        skills: traineeObj?.skills || [],
        score: traineeObj?.score ?? 0,
        preferredLocations: prefLocs,
        preferredLocation1: prefLocs[0] || '',
        preferredLocation2: prefLocs[1] || '',
        preferredLocation3: prefLocs[2] || '',
        location: prefLocs.length > 0 ? prefLocs.join(', ') : '—',
        batch: traineeObj?.batch_name || lock.batch_name || selectedBatch || '—',
        group: traineeObj?.group_name || traineeObj?.groupName || lock.group_name || lock.groupName || lock.trainee?.group_name || '—',
        groupRank: traineeObj?.groupRank || lock.groupRank || traineeObj?.group_rank || '—',
        batchRank: traineeObj?.batchRank || lock.batchRank || traineeObj?.batch_rank || '—',
        dpi: traineeObj?.dpi ?? lock.dpi ?? '—',
        isMapped: traineeObj?.isMapped ?? (lock.status === 'selected' || lock.status === 'mapped'),
        rawLock: lock,
        rawTrainee: traineeObj,
      });
    });

    // 2. Process Direct Mapped Trainees not in interview locks
    (allTrainees || []).forEach(trainee => {
      const traineeId = String(trainee.userId || trainee.id || '');
      const tEmpId = trainee.employeeId ? String(trainee.employeeId) : '';
      const tProfileId = trainee.id ? String(trainee.id) : '';

      const isAlreadyProcessed = 
        processedUserIds.has(traineeId) || 
        (tEmpId && processedUserIds.has(tEmpId)) || 
        (tProfileId && processedUserIds.has(tProfileId));

      const prefLocs = extractTraineePreferredLocations(trainee, null);

      if (!isAlreadyProcessed && trainee.isMapped) {
        const rawProjectId = trainee.projectId || '';
        const rawProjectName = trainee.projectName || '';
        const matchedJob = findJob(rawProjectId, '', rawProjectName);

        const finalJobId = matchedJob ? String(matchedJob.id) : (rawProjectId ? String(rawProjectId) : '');
        const finalJobTitle = matchedJob?.project_name || rawProjectName || 'Direct Mapped';
        const finalDemandId = matchedJob?.demand_id || '';

        records.push({
          id: `trainee-${traineeId}`,
          lockId: null,
          traineeId: traineeId,
          name: trainee.name || 'Unknown Candidate',
          email: trainee.email || `${traineeId}@tcs.com`,
          jobId: finalJobId,
          demandId: finalDemandId,
          jobTitle: finalJobTitle,
          rawJob: matchedJob || null,
          status: 'selected',
          source: 'Direct Mapping',
          interviewer: 'HR Direct',
          interviewDate: null,
          skills: trainee.skills || [],
          score: trainee.score ?? 0,
          preferredLocations: prefLocs,
          preferredLocation1: prefLocs[0] || '',
          preferredLocation2: prefLocs[1] || '',
          preferredLocation3: prefLocs[2] || '',
          location: prefLocs.length > 0 ? prefLocs.join(', ') : '—',
          batch: trainee.batch_name || selectedBatch || '—',
          group: trainee.group_name || trainee.groupName || '—',
          groupRank: trainee.groupRank || trainee.group_rank || '—',
          batchRank: trainee.batchRank || trainee.batch_rank || '—',
          dpi: trainee.dpi ?? '—',
          isMapped: true,
          rawLock: null,
          rawTrainee: trainee,
        });
      } else if (!isAlreadyProcessed && !trainee.isMapped) {
        // 3. Unassigned Trainees
        records.push({
          id: `unassigned-${traineeId}`,
          lockId: null,
          traineeId: traineeId,
          name: trainee.name || 'Unknown Candidate',
          email: trainee.email || `${traineeId}@tcs.com`,
          jobId: '',
          demandId: '',
          jobTitle: 'Not Assigned',
          rawJob: null,
          status: 'unassigned',
          source: 'Pool',
          interviewer: '—',
          interviewDate: null,
          skills: trainee.skills || [],
          score: trainee.score ?? 0,
          preferredLocations: prefLocs,
          preferredLocation1: prefLocs[0] || '',
          preferredLocation2: prefLocs[1] || '',
          preferredLocation3: prefLocs[2] || '',
          location: prefLocs.length > 0 ? prefLocs.join(', ') : '—',
          batch: trainee.batch_name || selectedBatch || '—',
          group: trainee.group_name || trainee.groupName || '—',
          groupRank: trainee.groupRank || trainee.group_rank || '—',
          batchRank: trainee.batchRank || trainee.batch_rank || '—',
          dpi: trainee.dpi ?? '—',
          isMapped: false,
          rawLock: null,
          rawTrainee: trainee,
        });
      }
    });

    return records;
  }, [locks, allTrainees, jobs, selectedBatch]);

  // Filtered by Status & Job
  const filteredData = useMemo(() => {
    const selectedJobObj = jobFilter ? (jobs || []).find(j => String(j.id) === String(jobFilter)) : null;

    return unifiedCandidates.filter(item => {
      // Status Filter
      if (statusFilter === 'selected' && item.status !== 'selected') return false;
      if (statusFilter === 'locked' && item.status !== 'locked') return false;
      if (statusFilter === 'rejected' && item.status !== 'rejected') return false;
      if (statusFilter === 'unassigned' && item.status !== 'unassigned') return false;

      // Job Filter
      if (jobFilter) {
        const itemJobId = String(item.jobId || '').trim();
        const itemDemandId = String(item.demandId || '').trim().toLowerCase();
        const itemJobTitle = String(item.jobTitle || '').trim().toLowerCase();
        const filterStr = String(jobFilter).trim();

        const matchDirectId = itemJobId && itemJobId === filterStr;
        const matchRawJob = item.rawJob && String(item.rawJob.id) === filterStr;
        const matchDemand = selectedJobObj?.demand_id && (
          itemDemandId === String(selectedJobObj.demand_id).toLowerCase() ||
          itemJobId.toLowerCase() === String(selectedJobObj.demand_id).toLowerCase()
        );
        const matchTitle = selectedJobObj?.project_name && (
          itemJobTitle && itemJobTitle === String(selectedJobObj.project_name).trim().toLowerCase()
        );

        if (!matchDirectId && !matchRawJob && !matchDemand && !matchTitle) {
          return false;
        }
      }

      return true;
    });
  }, [unifiedCandidates, statusFilter, jobFilter, jobs]);

  // Selected locks for bulk status modal
  const selectedCandidatesForBulk = useMemo(() => {
    return unifiedCandidates.filter(c => selectedIds.includes(c.id));
  }, [unifiedCandidates, selectedIds]);

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
      key: 'select',
      label: (
        <input 
          type="checkbox"
          checked={filteredData.length > 0 && selectedIds.length === filteredData.length}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedIds(filteredData.map(c => c.id));
            } else {
              setSelectedIds([]);
            }
          }}
          title="Select All"
        />
      ),
      render: (row) => (
        <input 
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedIds(prev => [...prev, row.id]);
            } else {
              setSelectedIds(prev => prev.filter(id => id !== row.id));
            }
          }}
        />
      ),
    },
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Briefcase size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span style={{ fontWeight: 500 }}>{row.jobTitle}</span>
          </div>
          {row.demandId && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingLeft: '1.15rem' }}>
              Demand: {row.demandId}
            </span>
          )}
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
        let badgeClass = 'status-unassigned';
        let label = 'Unassigned';

        if (row.status === 'selected') {
          badgeClass = 'status-selected';
          label = 'Selected';
        } else if (row.status === 'locked') {
          badgeClass = 'status-locked';
          label = 'Locked for Interview';
        } else if (row.status === 'rejected') {
          badgeClass = 'status-rejected';
          label = 'Rejected';
        } else if (row.status === 'cancelled') {
          badgeClass = 'status-rejected';
          label = 'Cancelled';
        }

        return (
          <span className={`status-badge ${badgeClass}`}>
            {label}
          </span>
        );
      },
    },
    {
      key: 'source',
      label: 'Allocation Source',
      sortable: true,
      filterable: true,
      filterOptions: [
        { label: 'Interview', value: 'Interview' },
        { label: 'Direct Mapping', value: 'Direct Mapping' },
        { label: 'Pool', value: 'Pool' },
      ],
      render: (row) => (
        <span className={`source-badge source-${row.source === 'Interview' ? 'interview' : 'direct'}`}>
          {row.source}
        </span>
      ),
    },
    {
      key: 'interviewer',
      label: 'Interviewer',
      sortable: true,
      render: (row) => row.interviewer || '—',
    },
    {
      key: 'interviewDate',
      label: 'Interview Schedule',
      sortable: true,
      render: (row) => {
        if (!row.interviewDate) return '—';
        const d = new Date(row.interviewDate);
        return isNaN(d.getTime()) ? row.interviewDate : d.toLocaleString();
      },
    },
    {
      key: 'location',
      label: 'Preferred Location(s)',
      sortable: true,
      filterable: true,
      sorter: (a, b) => (a.location || '').localeCompare(b.location || ''),
      render: (row) => {
        const locs = (row.preferredLocations && row.preferredLocations.length > 0)
          ? row.preferredLocations
          : (row.location && row.location !== '—' && row.location !== 'unknown'
              ? row.location.split(',').map(s => s.trim()).filter(Boolean)
              : []);

        if (locs.length === 0) {
          return <span style={{ color: '#94a3b8' }}>—</span>;
        }

        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', alignItems: 'center', maxWidth: '240px' }}>
            {locs.map((loc, idx) => (
              <span
                key={idx}
                className="badge"
                style={{
                  fontSize: '0.74rem',
                  padding: '0.18rem 0.45rem',
                  background: '#f0f9ff',
                  color: '#0369a1',
                  border: '1px solid #bae6fd',
                  borderRadius: '4px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}
              >
                <MapPin size={11} style={{ opacity: 0.7 }} />
                {loc}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'group',
      label: 'Group',
      sortable: true,
      filterable: true,
      render: (row) => (
        <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#4f46e5', fontWeight: 600 }}>
          {row.group || '—'}
        </span>
      ),
    },
    {
      key: 'skills',
      label: 'Key Skills',
      render: (row) => {
        const list = Array.isArray(row.skills) ? row.skills : [];
        if (list.length === 0) return '—';
        return (
          <div className="skills-cell" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', maxWidth: '240px' }}>
            {list.slice(0, 3).map((s, i) => (
              <span key={i} className="skill-tag-small">{s}</span>
            ))}
            {list.length > 3 && (
              <span className="more-skills">+{list.length - 3}</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'score',
      label: 'Score',
      sortable: true,
      sorter: (a, b) => (a.score || 0) - (b.score || 0),
      render: (row) => (
        <span className="badge" style={{ 
          background: row.score >= 80 ? 'rgba(16,185,129,0.1)' : row.score >= 60 ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)',
          color: row.score >= 80 ? '#10b981' : row.score >= 60 ? '#3b82f6' : '#ef4444',
          fontWeight: 700
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
                onViewTrainee({
                  ...row.rawTrainee,
                  location: row.location,
                  preferredLocations: row.preferredLocations,
                  preferredLocation1: row.preferredLocation1,
                  preferredLocation2: row.preferredLocation2,
                  preferredLocation3: row.preferredLocation3,
                });
              } else if (onViewTrainee && row.status === 'locked' && row.rawLock) {
                onViewTrainee({
                  ...row.rawLock,
                  location: row.location,
                  preferredLocations: row.preferredLocations,
                  preferredLocation1: row.preferredLocation1,
                  preferredLocation2: row.preferredLocation2,
                  preferredLocation3: row.preferredLocation3,
                });
              } else if (onViewTrainee) {
                onViewTrainee({ 
                  id: row.traineeId, 
                  userId: row.traineeId, 
                  name: row.name, 
                  email: row.email, 
                  skills: row.skills, 
                  location: row.location,
                  preferredLocations: row.preferredLocations,
                  preferredLocation1: row.preferredLocation1,
                  preferredLocation2: row.preferredLocation2,
                  preferredLocation3: row.preferredLocation3,
                });
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
  ], [filteredData, selectedIds, onViewTrainee, onUnlockInterview, onCancelSelected, onUnmapTrainee]);

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
          {selectedIds.length > 0 && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowBulkStatusModal(true)}
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', fontWeight: 600 }}
              title="Bulk update candidate statuses (Selected / Rejected)"
            >
              <CheckCircle size={14} />
              <span>Bulk Update Status ({selectedIds.length})</span>
            </button>
          )}
          {onRequestDownload && (
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={() => onRequestDownload(statusFilter === 'all' ? 'candidates' : statusFilter, {
                status: statusFilter,
                jobFilter,
                filteredCandidates: filteredData
              })}
              title="Download password-protected report"
            >
              <Download size={14} />
              <span>Export Report</span>
            </button>
          )}
          {onOpenPrefLoc && (
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={onOpenPrefLoc}
              title="Upload preferred locations with state/city for trainees (Excel)"
            >
              <MapPin size={14} />
              <span>Upload Locations</span>
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
          style={{ maxWidth: '380px', padding: '0.35rem 0.65rem', fontSize: '0.82rem' }}
        >
          <option value="">All Jobs & Projects ({jobs.length})</option>
          {jobs.map(job => (
            <option key={job.id} value={job.id}>
              {job.project_name || job.projectName || `Job #${job.id}`} {job.demand_id ? `(${job.demand_id})` : ''} {job.department || job.stream ? `— ${job.department || job.stream}` : ''}
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

      <BulkStatusModal
        isOpen={showBulkStatusModal}
        onClose={() => setShowBulkStatusModal(false)}
        selectedLocks={selectedCandidatesForBulk}
        onSuccess={() => {
          setSelectedIds([]);
          handleRefresh();
        }}
      />
    </div>
  );
};

export default CandidatesView;