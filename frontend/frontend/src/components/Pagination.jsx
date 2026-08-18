import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalRecords, 
  pageSize, 
  onPageChange, 
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100]
}) => {
  if (totalRecords === 0) return null;

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div className="pagination-bar">
      <div className="pagination-info">
        Showing <strong>{startRecord}-{endRecord}</strong> of <strong>{totalRecords}</strong> records
      </div>
      <div className="pagination-controls">
        <select 
          className="page-size-select" 
          value={pageSize} 
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          aria-label="Items per page"
        >
          {pageSizeOptions.map(size => (
            <option key={size} value={size}>{size} per page</option>
          ))}
        </select>
        <button 
          className="page-btn" 
          onClick={() => onPageChange(1)} 
          disabled={currentPage === 1}
          aria-label="First page"
        >
          <ChevronsLeft size={14} />
        </button>
        <button 
          className="page-btn" 
          onClick={() => onPageChange(currentPage - 1)} 
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="page-indicator">
          Page <strong>{currentPage}</strong> of <strong>{totalPages || 1}</strong>
        </span>
        <button 
          className="page-btn" 
          onClick={() => onPageChange(currentPage + 1)} 
          disabled={currentPage >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
        <button 
          className="page-btn" 
          onClick={() => onPageChange(totalPages)} 
          disabled={currentPage >= totalPages}
          aria-label="Last page"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;