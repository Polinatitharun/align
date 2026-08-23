import React, { useState } from 'react';
import { Sparkles, X, Check, Loader2, Briefcase } from 'lucide-react';
import api from '../api/axios';
import { toast } from 'sonner';

export default function JDParserModal({ isOpen, onClose, onSuccess, currentBatch }) {
  const [rawText, setRawText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsedData, setParsedData] = useState(null);

  if (!isOpen) return null;

  const handleParse = async () => {
    if (!rawText.trim()) {
      toast.error('Please paste job description text to parse.');
      return;
    }

    setParsing(true);
    try {
      const res = await api.post('/jobs/parse-jd/', { text: rawText });
      setParsedData({
        project_name: res.data.project_name || '',
        location: res.data.location || '',
        skills: res.data.skills || '',
        stream: res.data.stream || '',
        openings: res.data.openings || 1,
        role: res.data.role || 'Developer',
        bg: res.data.bg || 'Technology',
        isu_hsu: res.data.isu_hsu || 'ISU',
        rmg_head: res.data.rmg_head || '',
        spoc_name: res.data.spoc_name || '',
        spoc_emp_id: res.data.spoc_emp_id || '',
        rgs_id: res.data.rgs_id || '',
        batch_name: currentBatch || ''
      });
      toast.success('JD successfully parsed with AI!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to parse JD text.');
    } finally {
      setParsing(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setParsedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateJob = async () => {
    if (!parsedData.project_name || !parsedData.location || !parsedData.skills) {
      toast.error('Project Name, Location, and Skills are required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        project_name: parsedData.project_name,
        location: parsedData.location,
        skills: parsedData.skills,
        stream: parsedData.stream,
        openings: parseInt(parsedData.openings, 10) || 1,
        role: parsedData.role,
        bg: parsedData.bg,
        isu_hsu: parsedData.isu_hsu,
        rmg_head: parsedData.rmg_head,
        spoc_name: parsedData.spoc_name,
        spoc_emp_id: parsedData.spoc_emp_id,
        rgs_id: parsedData.rgs_id,
        demand_id: parsedData.rgs_id || `DMD-${Date.now().toString().slice(-5)}`,
        batch_name: currentBatch || parsedData.batch_name || '',
        status: 'active'
      };

      const res = await api.post('/jobs/', payload);
      toast.success(`Job requirement '${res.data.project_name}' created successfully! Matching engine initiated.`);
      if (onSuccess) {
        onSuccess(res.data);
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to create job requirement.');
    } finally {
      setSaving(false);
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
        maxWidth: '780px',
        width: '100%',
        maxHeight: '90vh',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(129, 140, 248, 0.2)',
              border: '1px solid rgba(129, 140, 248, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a5b4fc'
            }}>
              <Sparkles size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: '#fff' }}>
                AI Job Description (JD) Parser
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#c7d2fe' }}>
                Paste unstructured text to automatically extract structured job requirement fields
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#c7d2fe',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {!parsedData ? (
            <div>
              <label style={{ display: 'block', fontWeight: 600, color: '#1e293b', marginBottom: '8px', fontSize: '0.9rem' }}>
                Paste Raw Job Description / Email / Text:
              </label>
              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder="Example: We need 3 Senior Java Full Stack Developers for our Banking Project in Hyderabad. Required skills: Java, Spring Boot, Microservices, React. Role is Developer, BG Technology, ISU Banking. SPOC: John Doe (EMP1092)..."
                rows={9}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  lineHeight: '1.5',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              />

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleParse}
                  disabled={parsing || !rawText.trim()}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: parsing || !rawText.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)'
                  }}
                >
                  {parsing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Parsing with Ollama LLM...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>Parse JD with AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: 600 }}>
                  <Check size={18} />
                  <span>Parsed Fields (Review & Edit before creation)</span>
                </div>
                <button
                  onClick={() => setParsedData(null)}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    color: '#475569'
                  }}
                >
                  Paste New Text
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={parsedData.project_name}
                    onChange={e => handleFieldChange('project_name', e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Location(s) *
                  </label>
                  <input
                    type="text"
                    value={parsedData.location}
                    onChange={e => handleFieldChange('location', e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Skills (comma-separated) *
                  </label>
                  <input
                    type="text"
                    value={parsedData.skills}
                    onChange={e => handleFieldChange('skills', e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Stream
                  </label>
                  <input
                    type="text"
                    value={parsedData.stream}
                    onChange={e => handleFieldChange('stream', e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Openings (COUNT)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={parsedData.openings}
                    onChange={e => handleFieldChange('openings', e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Role
                  </label>
                  <input
                    type="text"
                    value={parsedData.role}
                    onChange={e => handleFieldChange('role', e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    BG (Business Group)
                  </label>
                  <input
                    type="text"
                    value={parsedData.bg}
                    onChange={e => handleFieldChange('bg', e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    ISU / HSU
                  </label>
                  <input
                    type="text"
                    value={parsedData.isu_hsu}
                    onChange={e => handleFieldChange('isu_hsu', e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    RGS ID
                  </label>
                  <input
                    type="text"
                    value={parsedData.rgs_id}
                    onChange={e => handleFieldChange('rgs_id', e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    RMG Head
                  </label>
                  <input
                    type="text"
                    value={parsedData.rmg_head}
                    onChange={e => handleFieldChange('rmg_head', e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Project SPOC Name
                  </label>
                  <input
                    type="text"
                    value={parsedData.spoc_name}
                    onChange={e => handleFieldChange('spoc_name', e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Project SPOC Emp ID
                  </label>
                  <input
                    type="text"
                    value={parsedData.spoc_emp_id}
                    onChange={e => handleFieldChange('spoc_emp_id', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {parsedData && (
          <div style={{
            padding: '16px 24px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            flexShrink: 0
          }}>
            <button
              onClick={onClose}
              disabled={saving}
              style={{
                padding: '10px 18px',
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
              onClick={handleCreateJob}
              disabled={saving}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
              }}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Creating Job...</span>
                </>
              ) : (
                <>
                  <Briefcase size={16} />
                  <span>Create Job Requirement</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  fontSize: '0.88rem',
  boxSizing: 'border-box',
  outline: 'none'
};
