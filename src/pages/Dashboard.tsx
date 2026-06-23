import React, { useState } from 'react';
import { useTable } from '../context/TableContext';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import TableBuilder from '../components/TableBuilder';
import CSVExportImport from '../components/CSVExportImport';
import { 
  Undo, 
  Redo, 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  Database, 
  Calendar, 
  Layers, 
  Sparkles, 
  BarChart2, 
  Info, 
  Heart,
  Star
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Dashboard() {
  const { 
    activeTable, 
    columns, 
    rows, 
    searchQuery, 
    setSearchQuery, 
    filters, 
    addFilter, 
    removeFilter, 
    clearFilters,
    undo,
    redo,
    canUndo,
    canRedo,
    toggleFavoriteTable
  } = useTable();

  const { userProfile } = useAuth();

  // Responsive sidebar toggle state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Local filter builder interface state
  const [filterColId, setFilterColId] = useState('');
  const [filterCondition, setFilterCondition] = useState<'contains' | 'equals' | 'greaterThan' | 'lessThan' | 'empty' | 'notEmpty'>('contains');
  const [filterValue, setFilterValue] = useState('');
  const [showFilterForm, setShowFilterForm] = useState(false);

  const handleAddFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!filterColId) {
      toast.error("Choose a target column first!");
      return;
    }
    
    addFilter({
      columnId: filterColId,
      condition: filterCondition,
      value: filterValue
    });

    setFilterValue('');
    setShowFilterForm(false);
    toast.success("Filter rule applied.");
  };

  // Human date representation
  const formatLastUpdated = (timestamp: number | undefined) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString();
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col lg:flex-row bg-white text-gray-800">
      
      {/* 1. Sidebar Container */}
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      {/* 2. Main Workstation Area */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 bg-slate-50/50">
        
        {activeTable ? (
          <>
            {/* Header section - Table metadata & Undo/Redo controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-150 pb-5 select-none">
              <div className="flex items-center gap-2.5 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 truncate font-sans">
                  {activeTable.name}
                </h1>
                
                <button
                  onClick={() => toggleFavoriteTable(activeTable.id)}
                  className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                    activeTable.isFavorite
                      ? 'text-amber-500 hover:bg-amber-50/50'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title={activeTable.isFavorite ? "Remove Favorite" : "Add Favorite"}
                >
                  <Star className={`w-5 h-5 ${activeTable.isFavorite ? 'fill-amber-500' : ''}`} />
                </button>
              </div>

              {/* Undo / Redo visual deck */}
              <div className="flex items-center gap-2 sm:ml-auto">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-blue-600 disabled:opacity-40 disabled:hover:text-gray-500 transition-colors shadow-sm cursor-pointer"
                  title="Undo cell action"
                >
                  <Undo className="w-4 h-4" />
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-blue-600 disabled:opacity-40 disabled:hover:text-gray-500 transition-colors shadow-sm cursor-pointer"
                  title="Redo cell action"
                >
                  <Redo className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Queries & Filter Builders Workspace */}
            <div id="queries-and-filters-panel" className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 select-none">
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Search Bar query */}
                <div className="relative flex-1 flex items-center">
                  <Search className="absolute left-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search database entries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 hover:border-gray-300 focus:border-blue-500 border border-gray-150 bg-white text-gray-850 rounded-xl text-sm outline-none shadow-xs"
                  />
                </div>

                {/* Combined Filter & CSV Actions */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <button
                    onClick={() => setShowFilterForm(!showFilterForm)}
                    type="button"
                    className="flex items-center gap-1.5 py-2 px-3 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:text-blue-600 bg-white hover:bg-gray-50 cursor-pointer shadow-xs transition-colors"
                  >
                    <Filter className="w-4 h-4" /> Filter Rules ({filters.length})
                  </button>

                  <CSVExportImport />
                </div>
              </div>

              {/* Dynamic Filter creation form overlay */}
              {showFilterForm && (
                <form 
                  onSubmit={handleAddFilterSubmit}
                  className="p-4 bg-gray-50 border border-gray-100 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-3 items-end animate-in slide-in-from-top-1 duration-100 text-xs"
                >
                  <div>
                    <label className="block text-gray-400 mb-1 font-semibold uppercase tracking-wider text-[10px]">Column</label>
                    <select
                      required
                      value={filterColId}
                      onChange={(e) => setFilterColId(e.target.value)}
                      className="w-full p-2 border border-gray-200 bg-white text-gray-900 rounded-lg outline-none"
                    >
                      <option value="">-- Select Column --</option>
                      {columns.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1 font-semibold uppercase tracking-wider text-[10px]">Rule</label>
                    <select
                      value={filterCondition}
                      onChange={(e) => setFilterCondition(e.target.value as any)}
                      className="w-full p-2 border border-gray-200 bg-white text-gray-900 rounded-lg outline-none"
                    >
                      <option value="contains">contains substring</option>
                      <option value="equals">equals string</option>
                      <option value="greaterThan">is greater than (&gt;)</option>
                      <option value="lessThan">is less than (&lt;)</option>
                      <option value="empty">is empty or unchecked</option>
                      <option value="notEmpty">is populated or active</option>
                    </select>
                  </div>

                  {filterCondition !== 'empty' && filterCondition !== 'notEmpty' && (
                    <div>
                      <label className="block text-gray-400 mb-1 font-semibold uppercase tracking-wider text-[10px]">Value</label>
                      <input
                        type="text"
                        required
                        placeholder="Search key..."
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        className="w-full p-2 border border-gray-200 bg-white text-gray-900 rounded-lg outline-none"
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all cursor-pointer"
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFilterForm(false)}
                      className="flex-1 py-2 px-3 bg-gray-150 hover:bg-gray-200 text-gray-700 rounded-lg font-bold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Activated Filter Pills chips row */}
              {filters.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-gray-100">
                  <span className="text-xs text-gray-400 font-medium">Applied Rules:</span>
                  
                  {filters.map((f, idx) => {
                    const colName = columns.find(c => c.id === f.columnId)?.name || 'Column';
                    return (
                      <div 
                        key={idx}
                        className="flex items-center gap-1.5 py-1 px-2.5 bg-gray-50 text-xs font-semibold rounded-lg border border-gray-150 text-blue-700"
                      >
                        <span className="font-sans text-[11px] font-normal text-gray-400">{colName}</span>
                        <span className="lowercase italic font-serif">{f.condition}</span>
                        {f.condition !== 'empty' && f.condition !== 'notEmpty' && (
                          <span className="font-sans">"{f.value}"</span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFilter(idx)}
                          className="text-gray-400 hover:text-red-500 rounded cursor-pointer p-0.5"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}

                  <button
                    onClick={clearFilters}
                    className="text-xs text-blue-600 hover:underline cursor-pointer font-bold ml-auto"
                  >
                    Clear All
                  </button>
                </div>
              )}

            </div>

            {/* 3. Primary Table Interactive Area */}
            <TableBuilder />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
            {/* Empty Screen */}
            <Database className="w-16 h-16 text-blue-600 fill-blue-600/10 mb-4 animate-bounce duration-1000" />
            <h2 className="text-xl font-bold text-gray-900">Welcome to SmartTable</h2>
            <p className="text-sm text-gray-500 max-w-sm mt-2">
              Create your very first live dynamic database table using the "+ Create Table" button in the sidebar. You can choose layouts like student records, expense tracking, and list managers!
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
