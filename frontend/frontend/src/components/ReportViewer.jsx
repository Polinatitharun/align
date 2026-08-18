import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Loader2,
  Sparkles,
  RefreshCw,
  FileSpreadsheet,
  FileType,
  Copy,
  Check,
  TrendingUp,
  AlertCircle,
  BarChart3,
  Users,
  Briefcase,
  CheckCircle,
  Clock,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';
import XlsxPopulate from 'xlsx-populate';

const ReportViewer = ({ selectedBatch, autoLoad = true }) => {
  const [report, setReport] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchSummaryAndReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBatch) params.append('batch', selectedBatch);
      params.append('type', 'full');

      const [reportRes, summaryRes] = await Promise.allSettled([
        api.get(`/reports/generate/?${params.toString()}`),
        api.get(`/reports/hr-summary/?${params.toString()}`)
      ]);

      if (reportRes.status === 'fulfilled') {
        setReport(reportRes.value.data);
      }
      if (summaryRes.status === 'fulfilled') {
        setSummaryData(summaryRes.value.data);
      }
      toast.success('Analysis report loaded successfully');
    } catch (err) {
      console.error('Report error:', err);
      toast.error('Failed to load analysis report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad) {
      fetchSummaryAndReport();
    }
  }, [selectedBatch, autoLoad]);

  const downloadAsPdf = async () => {
    setDownloadingPdf(true);
    try {
      const params = new URLSearchParams();
      if (selectedBatch) params.append('batch', selectedBatch);

      const response = await api.get(`/reports/hr-summary-pdf/?${params.toString()}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `talent_align_executive_report_${selectedBatch || 'all'}_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Executive PDF report downloaded');
    } catch (err) {
      console.error('PDF download error:', err);
      toast.error('Failed to download PDF report');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const downloadAsExcel = async () => {
    if (!report) return;
    setDownloadingExcel(true);
    try {
      const wb = await XlsxPopulate.fromBlankAsync();
      const sheet = wb.sheet(0).name('HR Intelligence Report');

      let row = 1;
      sheet.cell(row, 1).value(report.report_title || 'Talent Align - HR Diagnostic Report').style({ bold: true, fontSize: 16 });
      row += 2;
      sheet.cell(row, 1).value('Batch Filter: ' + (selectedBatch || 'All Batches'));
      row += 1;
      sheet.cell(row, 1).value('Generated At: ' + (report.generated_at || new Date().toLocaleString()));
      row += 2;

      if (summaryData) {
        sheet.cell(row, 1).value('KEY PERFORMANCE TELEMETRY').style({ bold: true, fontSize: 13 });
        row += 1;
        sheet.cell(row, 1).value('Total Trainees');
        sheet.cell(row, 2).value(summaryData.total_trainees || 0);
        row += 1;
        sheet.cell(row, 1).value('Mapped Trainees');
        sheet.cell(row, 2).value(summaryData.mapped_trainees || 0);
        row += 1;
        sheet.cell(row, 1).value('Overall Placement Rate');
        sheet.cell(row, 2).value(`${summaryData.placement_rate || 0}%`);
        row += 2;
      }

      if (report.sections && Array.isArray(report.sections)) {
        report.sections.forEach((section) => {
          sheet.cell(row, 1).value(`${section.icon || '▪'} ${section.title}`).style({ bold: true, fontSize: 13 });
          row += 1;

          const lines = (section.content || '').split('\n');
          lines.forEach((line) => {
            sheet.cell(row, 1).value(line.trim());
            row += 1;
          });
          row += 1;
        });
      }

      const blob = await wb.outputAsync();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `talent_align_hr_report_${selectedBatch || 'all'}_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Excel workbook downloaded');
    } catch (err) {
      console.error('Excel export error:', err);
      toast.error('Download failed');
    } finally {
      setDownloadingExcel(false);
    }
  };

  const copyReportToClipboard = () => {
    if (!report) return;
    let text = `${report.report_title || 'HR Intelligence Report'}\nGenerated: ${report.generated_at || ''}\n\n`;
    if (report.sections) {
      report.sections.forEach(s => {
        text += `== ${s.title} ==\n${s.content}\n\n`;
      });
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Report narrative copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="report-viewer" style={{ padding: '0.5rem 0' }}>
      {/* Context Action Bar */}
      <div className="page-context-bar" style={{ marginBottom: '1rem' }}>
        <div className="breadcrumb-nav">
          <span className="breadcrumb-root">HR Operations</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">AI Diagnostic & Analytics Report</span>
          {selectedBatch && (
            <span className="badge badge-primary" style={{ marginLeft: '0.45rem' }}>
              Batch: {selectedBatch}
            </span>
          )}
        </div>
        <div className="page-context-actions">
          {report && (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={copyReportToClipboard}
                title="Copy entire narrative text"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={downloadAsExcel}
                disabled={downloadingExcel}
                title="Export as formatted Excel workbook"
              >
                {downloadingExcel ? <Loader2 size={14} className="spinning" /> : <FileSpreadsheet size={14} />}
                <span>Excel Report</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={downloadAsPdf}
                disabled={downloadingPdf}
                title="Download official PDF report"
              >
                {downloadingPdf ? <Loader2 size={14} className="spinning" /> : <FileType size={14} />}
                <span>Official PDF</span>
              </button>
            </>
          )}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchSummaryAndReport}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
            <span>Pull Fresh Report</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="empty-state" style={{ padding: '3.5rem 1rem' }}>
          <Loader2 size={36} className="spinning" style={{ color: 'var(--primary)', marginBottom: '0.75rem' }} />
          <h4 style={{ margin: '0 0 0.25rem 0' }}>Synthesizing Deep Analysis...</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Gathering pipeline velocity, skill deficits, and matching distributions across all datasets.
          </p>
        </div>
      )}

      {!loading && !report && (
        <div className="empty-state" style={{ padding: '3.5rem 1rem' }}>
          <Sparkles size={44} style={{ color: 'var(--primary)', marginBottom: '0.75rem' }} />
          <h3 style={{ margin: '0 0 0.45rem 0' }}>No Analysis Report Generated Yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '440px', margin: '0 auto 1.25rem auto' }}>
            Click below to generate a real-time narrative report analyzing candidate pipeline, demand-supply gaps, and operational velocity.
          </p>
          <button className="btn btn-primary" onClick={fetchSummaryAndReport}>
            <Sparkles size={16} /> Generate Comprehensive Report
          </button>
        </div>
      )}

      {!loading && report && (
        <div className="report-content-container">
          {/* Executive KPI Bar */}
          {summaryData && (
            <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                  <Users size={20} />
                </div>
                <div className="stat-content">
                  <h3>Total Trainees</h3>
                  <div className="stat-value">{summaryData.total_trainees || 0}</div>
                  <span className="stat-subtext">Registered in cohort</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                  <CheckCircle size={20} />
                </div>
                <div className="stat-content">
                  <h3>Mapped to Projects</h3>
                  <div className="stat-value">{summaryData.mapped_trainees || 0}</div>
                  <span className="stat-subtext">Active allocations</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                  <Briefcase size={20} />
                </div>
                <div className="stat-content">
                  <h3>Jobs Open</h3>
                  <div className="stat-value">{summaryData.active_jobs || 0}</div>
                  <span className="stat-subtext">Unfilled project demands</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                  <TrendingUp size={20} />
                </div>
                <div className="stat-content">
                  <h3>Placement Rate</h3>
                  <div className="stat-value">{summaryData.placement_rate || 0}%</div>
                  <span className="stat-subtext">Allocation velocity</span>
                </div>
              </div>
            </div>
          )}

          {/* Narrative Diagnostic Sections */}
          <div className="report-sections-grid" style={{ display: 'grid', gap: '0.85rem' }}>
            {report.sections &&
              report.sections.map((section, idx) => (
                <div
                  key={idx}
                  className="card"
                  style={{
                    padding: '1.15rem 1.35rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    background: '#fff'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.55rem',
                      marginBottom: '0.75rem',
                      borderBottom: '1px solid #f1f5f9',
                      paddingBottom: '0.55rem'
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>{section.icon || '📌'}</span>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                      {section.title}
                    </h3>
                  </div>
                  <div
                    style={{
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.88rem',
                      lineHeight: '1.65',
                      color: '#334155'
                    }}
                  >
                    {section.content}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportViewer;