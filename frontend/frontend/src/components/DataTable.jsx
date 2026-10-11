import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  X, 
  RotateCcw, 
  SlidersHorizontal 
} from 'lucide-react';
import Pagination from './Pagination';

const DataTable = ({
  columns = [],
  data = [],
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onRowClick,
  emptyMessage = 'No matching records found.',
  loading = false,
  loadingRows = 5,
  showGlobalSearch = true,
  searchPlaceholder = 'Search all records...',
  title = null,
  actions = null,
  selectable = false,
  selectedIds = [],
  onSelectRow = null,
  onSelectAll = null,
  idKey = 'id',
}) => {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [filters, setFilters] = useState({});
  const [globalSearch, setGlobalSearch] = useState('');
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(pageSize);

  // Reset page when data or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length, filters, globalSearch, itemsPerPage]);

  // Sorting
  const handleSort = useCallback((key) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }, [sortKey]);

  // Column Filtering
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({});
    setGlobalSearch('');
    setSortKey(null);
    setCurrentPage(1);
  }, []);

  // Process data: global search → column filters → sort → paginate
  const processedData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    let result = [...data];

    // 1. Global Search
    if (globalSearch.trim()) {
      const q = globalSearch.toLowerCase().trim();
      result = result.filter(row => {
        if (!row) return false;
        return columns.some(col => {
          const val = row[col.key];
          if (val == null) return false;
          if (typeof val === 'object') {
            return JSON.stringify(val).toLowerCase().includes(q);
          }
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    // 2. Column Filters
    Object.entries(filters).forEach(([key, filterVal]) => {
      if (filterVal === '' || filterVal == null) return;
      const colDef = columns.find(c => c.key === key);
      const strFilter = String(filterVal).toLowerCase().trim();

      result = result.filter(row => {
        if (!row) return false;
        const cellValue = row[key];
        if (cellValue == null) return false;

        if (colDef && typeof colDef.filterMatch === 'function') {
          return colDef.filterMatch(cellValue, filterVal, row);
        }

        if (Array.isArray(cellValue)) {
          return cellValue.some(item => String(item).toLowerCase().includes(strFilter));
        }

        return String(cellValue).toLowerCase().includes(strFilter);
      });
    });

    // 3. Sorting
    if (sortKey) {
      const colDef = columns.find(c => c.key === sortKey);
      result.sort((a, b) => {
        if (!a && !b) return 0;
        if (!a) return 1;
        if (!b) return -1;

        if (colDef && typeof colDef.sorter === 'function') {
          const customRes = colDef.sorter(a, b);
          return sortDir === 'asc' ? customRes : -customRes;
        }

        const av = a[sortKey];
        const bv = b[sortKey];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;

        if (typeof av === 'number' && typeof bv === 'number') {
          return sortDir === 'asc' ? av - bv : bv - av;
        }

        // Date sorting check
        const aDate = Date.parse(av);
        const bDate = Date.parse(bv);
        if (!isNaN(aDate) && !isNaN(bDate) && typeof av === 'string' && av.includes('-')) {
          return sortDir === 'asc' ? aDate - bDate : bDate - aDate;
        }

        return sortDir === 'asc'
          ? String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' })
          : String(bv).localeCompare(String(av), undefined, { numeric: true, sensitivity: 'base' });
      });
    }

    return result;
  }, [data, columns, globalSearch, filters, sortKey, sortDir]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedData.slice(start, start + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage]);

  const activeFilterCount = useMemo(() => {
    const count = Object.values(filters).filter(v => v !== '' && v != null).length;
    return count + (globalSearch.trim() ? 1 : 0);
  }, [filters, globalSearch]);

  const filterableColumns = useMemo(() => columns.filter(c => c.filterable), [columns]);

  // Selection helpers
  const allCurrentPageSelected = useMemo(() => {
    if (!paginatedData.length) return false;
    return paginatedData.every(row => {
      const id = String(row[idKey] ?? row.id ?? row.trainee_id ?? '');
      return id && selectedIds.includes(id);
    });
  }, [paginatedData, selectedIds, idKey]);

  if (loading) {
    return (
      <div className="data-table-wrapper">
        <div className="table-loading-container">
          <div className="skeleton-toolbar" />
          <div className="skeleton-table">
            {Array.from({ length: loadingRows }).map((_, i) => (
              <div key={i} className="skeleton-row">
                {columns.map((_, j) => (
                  <div key={j} className="skeleton-cell" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="data-table-wrapper">
      {/* Table Toolbar */}
      {(title || showGlobalSearch || filterableColumns.length > 0 || actions) && (
        <div className="table-toolbar">
          <div className="toolbar-left">
            {title && <div className="table-title">{title}</div>}
            {showGlobalSearch && (
              <div className="table-search-box">
                <Search size={15} className="search-icon" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={globalSearch}
                  onChange={e => setGlobalSearch(e.target.value)}
                  className="table-search-input"
                  aria-label="Search records"
                />
                {globalSearch && (
                  <button 
                    className="clear-search-btn" 
                    onClick={() => setGlobalSearch('')}
                    title="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="toolbar-right">
            {filterableColumns.length > 0 && (
              <button
                type="button"
                className={`btn btn-secondary btn-sm ${showColumnFilters || activeFilterCount > 0 ? 'active-filter-btn' : ''}`}
                onClick={() => setShowColumnFilters(prev => !prev)}
                title="Toggle column filters"
              >
                <SlidersHorizontal size={14} />
                <span>Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
              </button>
            )}

            {activeFilterCount > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm text-danger"
                onClick={clearAllFilters}
                title="Reset all filters and sorting"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}

            {actions}
          </div>
        </div>
      )}

      {/* Column Filters Bar (Excel-like) */}
      {showColumnFilters && filterableColumns.length > 0 && (
        <div className="table-column-filters-bar">
          <div className="filters-grid">
            {filterableColumns.map(col => {
              const currentVal = filters[col.key] || '';
              return (
                <div key={col.key} className="column-filter-item">
                  <label className="column-filter-label">{col.label}</label>
                  {col.filterOptions ? (
                    <select
                      className="column-filter-select"
                      value={currentVal}
                      onChange={e => handleFilterChange(col.key, e.target.value)}
                    >
                      <option value="">All</option>
                      {col.filterOptions.map(opt => (
                        <option 
                          key={typeof opt === 'object' ? opt.value : opt} 
                          value={typeof opt === 'object' ? opt.value : opt}
                        >
                          {typeof opt === 'object' ? opt.label : opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="column-filter-input"
                      placeholder={`Filter ${col.label}...`}
                      value={currentVal}
                      onChange={e => handleFilterChange(col.key, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {selectable && (
                <th className="th-checkbox" style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={allCurrentPageSelected}
                    onChange={e => {
                      if (onSelectAll) {
                        onSelectAll(e.target.checked, paginatedData);
                      }
                    }}
                    aria-label="Select all visible"
                  />
                </th>
              )}
              {columns.map(col => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.maxWidth }}
                    className={col.className || ''}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        className={`sort-header ${isSorted ? 'sorted' : ''}`}
                        onClick={() => handleSort(col.key)}
                        title={`Sort by ${col.label}`}
                      >
                        <span className="th-text">{col.label}</span>
                        <span className="sort-icon-wrapper">
                          {isSorted ? (
                            sortDir === 'asc' ? (
                              <ChevronUp size={14} className="sort-active" />
                            ) : (
                              <ChevronDown size={14} className="sort-active" />
                            )
                          ) : (
                            <ChevronDown size={14} className="sort-inactive" />
                          )}
                        </span>
                      </button>
                    ) : (
                      <span className="th-text">{col.label}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="no-data-cell">
                  <div className="empty-state-inner">
                    <p className="empty-message">{emptyMessage}</p>
                    {activeFilterCount > 0 && (
                      <button 
                        type="button"
                        className="btn btn-secondary btn-sm" 
                        onClick={clearAllFilters}
                        style={{ marginTop: '0.5rem' }}
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => {
                const rowId = String(row[idKey] ?? row.id ?? row.trainee_id ?? idx);
                const isSelected = selectedIds.includes(rowId);

                return (
                  <tr
                    key={rowId}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={`${onRowClick ? 'clickable-row' : ''} ${isSelected ? 'row-selected' : ''}`}
                  >
                    {selectable && (
                      <td className="td-checkbox" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={e => {
                            if (onSelectRow) {
                              onSelectRow(rowId, e.target.checked, row);
                            }
                          }}
                          aria-label={`Select row ${rowId}`}
                        />
                      </td>
                    )}
                    {columns.map(col => (
                      <td
                        key={col.key}
                        className={col.cellClassName || ''}
                        style={{ width: col.width, minWidth: col.minWidth, maxWidth: col.maxWidth }}
                      >
                        {col.render ? col.render(row) : (row[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {processedData.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={processedData.length}
          pageSize={itemsPerPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={setItemsPerPage}
          pageSizeOptions={pageSizeOptions}
        />
      )}
    </div>
  );
};

export default DataTable;