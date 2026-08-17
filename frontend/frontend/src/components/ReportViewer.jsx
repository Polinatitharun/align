import React, { useState } from 'react';
import { FileText, Download, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';
import XlsxPopulate from 'xlsx-populate';

const ReportViewer = ({ selectedBatch }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBatch) params.append('batch', selectedBatch);
      params.append('type', 'full');
      const res = await api.get(`/reports/generate/?${params.toString()}`);
      setReport(res.data);
      toast.success('Report generated');
    } catch (err) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadAsExcel = async () => {
    if (!report) return;
    setDownloading(true);
    try {
      const wb = await XlsxPopulate.fromBlankAsync();
      const sheet = wb.sheet(0).name('HR Report');
      
      let row = 1;
      sheet.cell(row, 1).value(report.report_title).style({ bold: true, fontSize: 16 });
      row += 2;
      sheet.cell(row, 1).value('Generated: ' + report.generated_at);
      row += 2;
      
      report.sections.forEach((section) => {
        sheet.cell(row, 1).value(`${section.icon} ${section.title}`).style({ bold: true, fontSize: 14 });
        row += 1;
        
        // Split content into lines
        const lines = section.content.split('\n');
        lines.forEach((line) => {
          sheet.cell(row, 1).value(line.trim());
          row += 1;
        });
        row += 1;
      });
      
      const blob = await wb.outputAsync();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hr_report_${selectedBatch || 'all'}_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Report downloaded');
    } catch (err) {
      toast.error('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="report-viewer">
      <div className="section-header">
        <div className="header-title">
          <h2><Sparkles size={22} /> AI Report Generator</h2>
          <p className="subtitle">Generates human-like narrative reports analyzing entire system</p>
        </div>
        <div className="header-actions">
          {report && (
            <button className="btn btn-primary" onClick={downloadAsExcel} disabled={downloading}>
              {downloading ? <Loader2 size={16} className="spinning" /> : <Download size={16} />}
              Download Report
            </button>
          )}
          <button className="btn btn-secondary" onClick={generateReport} disabled={loading}>
            {loading ? <Loader2 size={16} className="spinning" /> : <FileText size={16} />}
            Generate Report
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Analyzing data and generating report...</p>
        </div>
      )}

      {!report && !loading && (
        <div className="no-data" style={{ padding: '3rem' }}>
          <Sparkles size={48} />
          <h3>No Report Yet</h3>
          <p>Click "Generate Report" to create a comprehensive narrative analysis of your Talent Align system.</p>
        </div>
      )}

      {report && !loading && (
        <div className="report-sections">
          {report.sections.map((section, idx) => (
            <div key={idx} className="bento-panel" style={{ marginBottom: '0.75rem' }}>
              <div className="bento-panel-header">
                <h3>{section.icon} {section.title}</h3>
              </div>
              <div className="bento-panel-body" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: '1.6' }}>
                {section.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportViewer;