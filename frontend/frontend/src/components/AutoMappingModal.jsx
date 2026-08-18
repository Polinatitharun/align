import React, { useState, useMemo } from 'react';
import {
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Sliders,
  Users,
  Briefcase,
  Layers,
  ArrowRight,
  Sparkles,
  Loader2,
  X,
  MapPin,
  Target,
  Percent,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';

const AutoMappingModal = ({
  isOpen,
  onClose,
  jobs = [],
  trainees = [],
  recommendations = [],
  onMappingComplete,
  selectedBatch = ''
}) => {
  // Matching configuration
  const [minScore, setMinScore] = useState(70);
  const [requireLocationMatch, setRequireLocationMatch] = useState(false);
  const [prioritizeRecommendations, setPrioritizeRecommendations] = useState(true);
  const [selectedProposals, setSelectedProposals] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Compute unmapped active jobs that have remaining openings
  const activeJobsWithOpenings = useMemo(() => {
    return jobs.filter(j => {
      if (j.status !== 'active') return false;
      const openings = parseInt(j.openings || j.unfilled_openings || 1, 10);
      return openings > 0;
    });
  }, [jobs]);

  // Compute unassigned trainees
  const unassignedTrainees = useMemo(() => {
    return trainees.filter(t => {
      // Must not be mapped
      if (t.isMapped || t.userInfo?.isMapped || t.is_mapped) return false;
      // Filter by batch if specified
      if (selectedBatch && t.batch !== selectedBatch && t.batch_name !== selectedBatch && t.userInfo?.batch !== selectedBatch) {
        return false;
      }
      return true;
    });
  }, [trainees, selectedBatch]);

  // Generate automated mapping proposals based on algorithms & rules
  const proposedMappings = useMemo(() => {
    if (!isOpen) return [];

    const proposals = [];
    const assignedTraineeIds = new Set();
    const jobCapacity = {};

    // Initialize capacity for each job
    activeJobsWithOpenings.forEach(j => {
      jobCapacity[j.id] = parseInt(j.openings || j.unfilled_openings || 1, 10);
    });

    // Step 1: Prioritize Course Owner Accepted Recommendations if enabled
    if (prioritizeRecommendations && recommendations.length > 0) {
      recommendations
        .filter(r => (r.status === 'Accepted' || r.status === 'approved') && !r.is_mapped)
        .forEach(rec => {
          const targetJob = activeJobsWithOpenings.find(j => j.id === (rec.job_id || rec.job));
          const traineeId = rec.trainee_id || rec.trainee?.id;
          const trainee = unassignedTrainees.find(t => (t.userId || t.id || t.userInfo?.userId) === traineeId);

          if (targetJob && trainee && jobCapacity[targetJob.id] > 0 && !assignedTraineeIds.has(traineeId)) {
            proposals.push({
              id: `rec-${rec.id}`,
              traineeId: traineeId,
              traineeName: trainee.name || trainee.userInfo?.name || rec.trainee_name || 'Trainee',
              traineeLocation: trainee.location || trainee.userInfo?.location || 'Unknown',
              traineeScore: trainee.averageScore || trainee.userInfo?.averageScore || 80,
              jobId: targetJob.id,
              jobTitle: targetJob.project_name || targetJob.title || 'Project Role',
              jobLocation: targetJob.location || targetJob.preferred_location || 'Any',
              matchScore: Math.round(rec.total_percentage || rec.score || 95),
              reason: 'Course Owner Verified & Accepted',
              type: 'RECOMMENDED',
              badgeColor: 'primary'
            });
            assignedTraineeIds.add(traineeId);
            jobCapacity[targetJob.id] -= 1;
          }
        });
    }

    // Step 2: Algorithmic Match Pairing for remaining job capacity
    activeJobsWithOpenings.forEach(job => {
      if (jobCapacity[job.id] <= 0) return;

      const jobReqSkills = (job.skills_required || job.tech_stack || job.description || '')
        .toLowerCase()
        .split(/[,\s/]+/)
        .filter(s => s.length > 1);

      const jobLoc = (job.location || job.preferred_location || '').toLowerCase();

      // Find suitable candidate candidates
      const candidateRankings = [];

      unassignedTrainees.forEach(trainee => {
        const traineeId = trainee.userId || trainee.id || trainee.userInfo?.userId;
        if (assignedTraineeIds.has(traineeId)) return;

        const traineeLoc = (trainee.location || trainee.userInfo?.location || '').toLowerCase();
        const traineeSkills = [
          ...(trainee.skills || trainee.userInfo?.skills || []),
          ...(trainee.strengths || trainee.userInfo?.strengths || [])
        ].map(s => (typeof s === 'string' ? s.toLowerCase() : ''));

        // Location condition check
        const isLocMatch = !jobLoc || jobLoc === 'any' || jobLoc === 'pan india' || traineeLoc.includes(jobLoc) || jobLoc.includes(traineeLoc);
        if (requireLocationMatch && !isLocMatch) return;

        // Calculate skill overlap
        let matchedSkillsCount = 0;
        jobReqSkills.forEach(reqSkill => {
          if (traineeSkills.some(ts => ts.includes(reqSkill) || reqSkill.includes(ts))) {
            matchedSkillsCount++;
          }
        });

        const skillScore = jobReqSkills.length > 0 ? (matchedSkillsCount / jobReqSkills.length) * 60 : 40;
        const avgAcademicScore = parseFloat(trainee.averageScore || trainee.userInfo?.averageScore || 75) * 0.4;
        const locationBonus = isLocMatch ? 10 : 0;
        const totalEstimatedScore = Math.min(99, Math.round(skillScore + avgAcademicScore + locationBonus));

        if (totalEstimatedScore >= minScore) {
          candidateRankings.push({
            trainee,
            traineeId,
            score: totalEstimatedScore,
            isLocMatch
          });
        }
      });

      // Sort by best score descending
      candidateRankings.sort((a, b) => b.score - a.score);

      // Fill remaining openings for this job
      const toAssign = candidateRankings.slice(0, jobCapacity[job.id]);
      toAssign.forEach(({ trainee, traineeId, score, isLocMatch }) => {
        proposals.push({
          id: `auto-${job.id}-${traineeId}`,
          traineeId: traineeId,
          traineeName: trainee.name || trainee.userInfo?.name || 'Trainee',
          traineeLocation: trainee.location || trainee.userInfo?.location || 'Unknown',
          traineeScore: trainee.averageScore || trainee.userInfo?.averageScore || 75,
          jobId: job.id,
          jobTitle: job.project_name || job.title || 'Project Role',
          jobLocation: job.location || job.preferred_location || 'Any',
          matchScore: score,
          reason: score >= 85 ? 'High Skill & Score Overlap' : isLocMatch ? 'Location & Competency Match' : 'Skill Overlap Fit',
          type: score >= 85 ? 'PERFECT_FIT' : 'HIGH_FIT',
          badgeColor: score >= 85 ? 'success' : 'info'
        });
        assignedTraineeIds.add(traineeId);
        jobCapacity[job.id] -= 1;
      });
    });

    return proposals;
  }, [isOpen, activeJobsWithOpenings, unassignedTrainees, recommendations, minScore, requireLocationMatch, prioritizeRecommendations]);

  // Initialize all proposals as selected by default when proposals compute
  React.useEffect(() => {
    if (proposedMappings.length > 0) {
      const initial = {};
      proposedMappings.forEach(p => {
        initial[p.id] = true;
      });
      setSelectedProposals(initial);
    } else {
      setSelectedProposals({});
    }
  }, [proposedMappings]);

  const toggleSelectAll = () => {
    const allSelected = Object.keys(selectedProposals).length === proposedMappings.length && Object.values(selectedProposals).every(Boolean);
    if (allSelected) {
      setSelectedProposals({});
    } else {
      const updated = {};
      proposedMappings.forEach(p => {
        updated[p.id] = true;
      });
      setSelectedProposals(updated);
    }
  };

  const toggleProposal = (id) => {
    setSelectedProposals(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const activeSelectedCount = Object.values(selectedProposals).filter(Boolean).length;

  const handleExecuteAutoMapping = async () => {
    const mappingsToApply = proposedMappings.filter(p => selectedProposals[p.id]);
    if (mappingsToApply.length === 0) {
      toast.warning('Please select at least one mapping to execute.');
      return;
    }

    setIsProcessing(true);
    setProgress(10);

    try {
      let successCount = 0;
      let failCount = 0;
      const total = mappingsToApply.length;

      // Process mapping in parallel batches for high velocity
      const batchSize = 5;
      for (let i = 0; i < total; i += batchSize) {
        const chunk = mappingsToApply.slice(i, i + batchSize);
        await Promise.all(
          chunk.map(async (mapping) => {
            try {
              await api.patch(`/api/userinfo/${mapping.traineeId}/update-mapping/`, {
                isMapped: true,
                projectId: mapping.jobId,
                projectName: mapping.jobTitle
              });
              successCount++;
            } catch (err) {
              console.error(`Failed to map trainee ${mapping.traineeId}:`, err);
              failCount++;
            }
          })
        );
        setProgress(Math.round(((i + chunk.length) / total) * 100));
      }

      if (successCount > 0) {
        toast.success(`Successfully auto-mapped ${successCount} candidates!`);
        if (onMappingComplete) {
          await onMappingComplete();
        }
        onClose();
      } else {
        toast.error('Failed to map selected candidates. Please try again.');
      }
    } catch (err) {
      toast.error('Auto-mapping execution encountered an error.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '960px', width: '92vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ padding: '0.45rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.12)', color: 'var(--primary)' }}>
              <Zap size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>⚡ 1-Click Smart Auto-Mapping Engine</h3>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Automatically pair top-scoring unassigned candidates to unfilled project positions without manual 1-by-1 searching.
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} disabled={isProcessing}>
            <X size={18} />
          </button>
        </div>

        {/* Configuration Toolbar */}
        <div style={{ padding: '0.85rem 1.25rem', background: 'var(--bg-light)', borderBottom: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          {/* Min Score Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.78rem', fontWeight: 600 }}>
              <span>Minimum Match Score:</span>
              <span className="badge badge-primary">{minScore}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={minScore}
              onChange={e => setMinScore(parseInt(e.target.value, 10))}
              style={{ width: '100%', cursor: 'pointer' }}
              disabled={isProcessing}
            />
          </div>

          {/* Location Requirement */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="reqLoc"
              checked={requireLocationMatch}
              onChange={e => setRequireLocationMatch(e.target.checked)}
              disabled={isProcessing}
              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
            />
            <label htmlFor="reqLoc" style={{ fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer' }}>
              Require Strict Location Fit
            </label>
          </div>

          {/* Prioritize Course Owner Accepted */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="prioritizeRecs"
              checked={prioritizeRecommendations}
              onChange={e => setPrioritizeRecommendations(e.target.checked)}
              disabled={isProcessing}
              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
            />
            <label htmlFor="prioritizeRecs" style={{ fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer' }}>
              Prioritize Verified Recommendations
            </label>
          </div>
        </div>

        {/* Proposals Summary Bar */}
        <div style={{ padding: '0.65rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 600 }}>
              Found <strong>{proposedMappings.length}</strong> Optimal Matches
            </span>
            <span style={{ color: 'var(--text-muted)' }}>|</span>
            <span style={{ color: 'var(--text-muted)' }}>
              Selected: <strong>{activeSelectedCount}</strong> of {proposedMappings.length}
            </span>
          </div>

          {proposedMappings.length > 0 && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={toggleSelectAll}
              disabled={isProcessing}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
            >
              {Object.keys(selectedProposals).length === proposedMappings.length && Object.values(selectedProposals).every(Boolean) ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>

        {/* Proposals Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem 1.25rem' }}>
          {proposedMappings.length === 0 ? (
            <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
              <Sparkles size={40} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
              <h4 style={{ margin: '0 0 0.25rem 0' }}>No Auto-Mapping Proposals Found</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', maxWidth: '420px', margin: '0 auto' }}>
                Try lowering the minimum match score threshold or turning off strict location match to discover available talent.
              </p>
            </div>
          ) : (
            <div className="table-container" style={{ margin: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '38px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={activeSelectedCount === proposedMappings.length && proposedMappings.length > 0}
                        onChange={toggleSelectAll}
                        disabled={isProcessing}
                      />
                    </th>
                    <th>Candidate</th>
                    <th>Target Project / Opening</th>
                    <th>Match Quality</th>
                    <th>Location Fit</th>
                    <th>Recommendation Basis</th>
                  </tr>
                </thead>
                <tbody>
                  {proposedMappings.map(p => {
                    const isSelected = !!selectedProposals[p.id];
                    return (
                      <tr key={p.id} style={{ background: isSelected ? 'rgba(59, 130, 246, 0.03)' : undefined }}>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleProposal(p.id)}
                            disabled={isProcessing}
                          />
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <div className="avatar" style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700 }}>
                              {p.traineeName?.charAt(0)}
                            </div>
                            <div>
                              <strong style={{ fontSize: '0.82rem' }}>{p.traineeName}</strong>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Score: {p.traineeScore}%</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Briefcase size={14} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{p.jobTitle}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-${p.badgeColor}`} style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                            {p.matchScore}% Fit
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <MapPin size={12} style={{ color: 'var(--text-muted)' }} />
                            <span>{p.traineeLocation} → {p.jobLocation}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.reason}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Progress bar during execution */}
        {isProcessing && (
          <div style={{ padding: '0.65rem 1.25rem', background: 'var(--bg-light)', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Loader2 size={14} className="spinning" /> Applying Auto-Mappings...
              </span>
              <span>{progress}%</span>
            </div>
            <div style={{ height: '6px', width: '100%', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--primary)', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="modal-actions" style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={isProcessing}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleExecuteAutoMapping}
            disabled={isProcessing || activeSelectedCount === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
          >
            {isProcessing ? (
              <>
                <Loader2 size={16} className="spinning" />
                <span>Executing ({progress}%)...</span>
              </>
            ) : (
              <>
                <Zap size={16} />
                <span>Confirm & Apply Auto-Mapping ({activeSelectedCount})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoMappingModal;
