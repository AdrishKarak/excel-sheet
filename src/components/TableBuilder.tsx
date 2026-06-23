import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  MoreHorizontal, 
  Type, 
  Hash, 
  Calendar, 
  Mail, 
  Phone as PhoneIcon, 
  ChevronDown, 
  CheckSquare, 
  X, 
  Edit2, 
  Check, 
  ArrowUpDown,
  MoveLeft,
  MoveRight,
  Info
} from 'lucide-react';
import { useTable } from '../context/TableContext';
import { TableColumn, ColumnType } from '../types';
import { toast } from 'react-hot-toast';

export default function TableBuilder() {
  const { 
    columns, 
    rows, 
    loadingData,
    sortColumnId,
    sortDirection,
    setSort,
    selectedRowIds,
    toggleSelectRow,
    toggleSelectAllRows,
    addColumn,
    renameColumn,
    changeColumnType,
    removeColumn,
    reorderColumns,
    addRow,
    editCell,
    removeRow,
    removeSelectedRows
  } = useTable();

  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null);
  const [editValue, setEditValue] = useState<any>('');
  
  // Header Actions
  const [activeHeaderDropdown, setActiveHeaderDropdown] = useState<string | null>(null);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState<ColumnType>('text');
  const [newColOptions, setNewColOptions] = useState('');

  // Column renaming/type editing modal
  const [editingCol, setEditingCol] = useState<TableColumn | null>(null);
  const [editColName, setEditColName] = useState('');
  const [editColType, setEditColType] = useState<ColumnType>('text');
  const [editColOptions, setEditColOptions] = useState('');

  // Custom Deletion Confirmation States
  const [colToDelete, setColToDelete] = useState<TableColumn | null>(null);
  const [rowIdToDelete, setRowIdToDelete] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);

  // Close header menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveHeaderDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Set focus on input cell when edit starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current.select) {
        inputRef.current.select();
      }
    }
  }, [editingCell]);

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 font-mono">Syncing records with Firestore...</p>
      </div>
    );
  }

  const handleStartEditing = (rowId: string, colId: string, val: any) => {
    setEditingCell({ rowId, columnId: colId });
    setEditValue(val === undefined || val === null ? '' : val);
  };

  const handleSaveCell = async (rowId: string, colId: string) => {
    if (!editingCell) return;
    
    // Type checking cell validation safely
    const colDef = columns.find(c => c.id === colId);
    let finalVal = editValue;
    
    if (colDef?.type === 'number') {
      const parsed = parseFloat(editValue);
      finalVal = isNaN(parsed) ? 0 : parsed;
    } else if (colDef?.type === 'email' && editValue) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(editValue))) {
        toast.error("Warning: Invalid email format entered");
      }
    } else if (colDef?.type === 'phone' && editValue) {
      const phoneRegex = /^[a-zA-Z0-9\-\s\+\(\)\.]{3,20}$/;
      if (!phoneRegex.test(String(editValue))) {
        toast.error("Warning: Invalid telephone format");
      }
    }

    setEditingCell(null);
    await editCell(rowId, colId, finalVal);
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowId: string, colId: string) => {
    if (e.key === 'Enter') {
      handleSaveCell(rowId, colId);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  // Get type icon helper
  const getColTypeIcon = (type: ColumnType) => {
    switch (type) {
      case 'text': return <Type className="w-3.5 h-3.5" />;
      case 'number': return <Hash className="w-3.5 h-3.5" />;
      case 'date': return <Calendar className="w-3.5 h-3.5" />;
      case 'email': return <Mail className="w-3.5 h-3.5" />;
      case 'phone': return <PhoneIcon className="w-3.5 h-3.5" />;
      case 'dropdown': return <ChevronDown className="w-3.5 h-3.5" />;
      case 'checkbox': return <CheckSquare className="w-3.5 h-3.5" />;
      default: return <Type className="w-3.5 h-3.5" />;
    }
  };

  // Custom pill tag colors for dropdown representations
  const getPillColor = (val: string, index: number) => {
    const list = [
      'bg-blue-50 text-blue-700 border border-blue-100',
      'bg-emerald-50 text-emerald-700 border border-emerald-100',
      'bg-amber-50 text-amber-700 border border-amber-100',
      'bg-sky-50 text-sky-700 border border-sky-100',
      'bg-rose-50 text-rose-700 border border-rose-100',
      'bg-purple-50 text-purple-700 border border-purple-100'
    ];
    let hash = 0;
    for (let i = 0; i < val.length; i++) {
      hash = val.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % list.length;
    return list[idx];
  };

  // Column operations trigger
  const handleAddNewColumnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) {
      toast.error("Column name is required");
      return;
    }
    const optionsArray = newColOptions.trim() 
      ? newColOptions.split(',').map(o => o.trim()).filter(Boolean) 
      : undefined;

    await addColumn(newColName, newColType, optionsArray);
    setNewColName('');
    setNewColType('text');
    setNewColOptions('');
    setShowAddColumnModal(false);
  };

  const handleStartEditingColumn = (col: TableColumn) => {
    setEditingCol(col);
    setEditColName(col.name);
    setEditColType(col.type);
    setEditColOptions(col.options ? col.options.join(', ') : '');
    setActiveHeaderDropdown(null);
  };

  const handleSaveColumnChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCol) return;
    if (!editColName.trim()) {
      toast.error("Column name cannot be blank");
      return;
    }

    const optionsArray = editColOptions.trim()
      ? editColOptions.split(',').map(o => o.trim()).filter(Boolean)
      : undefined;

    if (editingCol.name !== editColName) {
      await renameColumn(editingCol.id, editColName);
    }

    if (editingCol.type !== editColType || JSON.stringify(editingCol.options) !== JSON.stringify(optionsArray)) {
      await changeColumnType(editingCol.id, editColType, optionsArray);
    }

    setEditingCol(null);
  };

  const handleColumnSortClick = (colId: string) => {
    if (sortColumnId === colId) {
      if (sortDirection === 'asc') {
        setSort(colId, 'desc');
      } else if (sortDirection === 'desc') {
        setSort(null, null); // Clear Sort
      }
    } else {
      setSort(colId, 'asc');
    }
  };

  const handleShiftColumn = (index: number, direction: 'left' | 'right') => {
    const nextArr = [...columns];
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= nextArr.length) return; // boundary safety

    // swap
    const temp = nextArr[index];
    nextArr[index] = nextArr[targetIdx];
    nextArr[targetIdx] = temp;

    reorderColumns(nextArr);
    setActiveHeaderDropdown(null);
    toast.success("Column order shifted.");
  };

  return (
    <div className="w-full flex flex-col bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      
      {/* Table Action Controls Panel */}
      <div id="table-builder-controls" className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          {selectedRowIds.size > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 py-1.5 px-3 rounded-lg text-sm border border-blue-100">
              <span className="font-medium">{selectedRowIds.size} row(s) selected</span>
              <button
                onClick={removeSelectedRows}
                className="hover:text-red-500 p-0.5 rounded cursor-pointer"
                title="Delete Selected Rows"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setShowAddColumnModal(true)}
            className="flex items-center gap-1.5 text-xs md:text-sm font-medium py-1.5 px-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 hover:bg-blue-100 hover:text-blue-800 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Column
          </button>
          
          <button
            onClick={() => addRow()}
            className="flex items-center gap-1.5 text-xs md:text-sm font-medium py-1.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm font-sans transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Row
          </button>
        </div>
      </div>

      {/* Primary Scroll Window */}
      <div className="w-full overflow-x-auto select-none">
        
        {columns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <Info className="w-12 h-12 text-gray-300 mb-3" />
            <h4 className="font-semibold text-gray-800">No Columns Configured</h4>
            <p className="text-xs text-gray-500 max-w-xs mt-1">
              Add custom columns (Names, Dates, CGPA, checkboxes) to customize this table.
            </p>
            <button
              onClick={() => setShowAddColumnModal(true)}
              className="mt-4 flex items-center gap-1.5 text-sm py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create First Column
            </button>
          </div>
        ) : (
          <table className="w-full table-fixed border-collapse text-left text-sm" id="smarttable-core-grid">
            
            {/* Sticky Header Section */}
            <thead className="sticky top-0 bg-gray-50 text-gray-500 font-medium z-10 select-none border-b border-gray-200">
              <tr>
                {/* Selection Multi Checkbox Header */}
                <th className="w-12 py-3 px-3 text-center border-r border-gray-200 bg-gray-50">
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && selectedRowIds.size === rows.length}
                    onChange={toggleSelectAllRows}
                    disabled={rows.length === 0}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white cursor-pointer"
                  />
                </th>

                {/* Column Headers Loop */}
                {columns.map((col, idx) => (
                  <th 
                    key={col.id} 
                    className="relative py-5 px-4 border-r border-gray-200 align-middle pr-10 bg-gray-50/70"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">
                        {getColTypeIcon(col.type)}
                      </span>
                      
                      <button 
                        onClick={() => handleColumnSortClick(col.id)}
                        className="font-semibold text-gray-800 hover:text-blue-650 flex items-center gap-1 cursor-pointer truncate"
                      >
                        {col.name}
                        {sortColumnId === col.id && (
                          <span className="text-blue-600 text-xs">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Quick Column Settings Menu Toggle */}
                    <button
                      onClick={() => setActiveHeaderDropdown(activeHeaderDropdown === col.id ? null : col.id)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 rounded cursor-pointer hover:bg-gray-100"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu Portal */}
                    {activeHeaderDropdown === col.id && (
                      <div 
                        ref={dropdownRef}
                        className="absolute right-2 top-10 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden divide-y divide-gray-100 text-xs font-normal"
                      >
                        <div className="py-1">
                          <button
                            onClick={() => handleColumnSortClick(col.id)}
                            className="w-full text-left py-2 px-3 text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5" /> Sort Column
                          </button>
                          <button
                            onClick={() => handleStartEditingColumn(col)}
                            className="w-full text-left py-2 px-3 text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Rename / Edit Column
                          </button>
                        </div>

                        <div className="py-1 flex justify-around p-1.5">
                          <button
                            disabled={idx === 0}
                            onClick={() => handleShiftColumn(idx, 'left')}
                            className="p-1.5 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 flex-1 flex justify-center cursor-pointer"
                            title="Move Left"
                          >
                            <MoveLeft className="w-4 h-4" />
                          </button>
                          <button
                            disabled={idx === columns.length - 1}
                            onClick={() => handleShiftColumn(idx, 'right')}
                            className="p-1.5 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 flex-1 flex justify-center cursor-pointer"
                            title="Move Right"
                          >
                            <MoveRight className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="py-1">
                          <button
                            onClick={() => {
                              setColToDelete(col);
                              setActiveHeaderDropdown(null);
                            }}
                            className="w-full text-left py-2 px-3 text-red-650 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete Column
                          </button>
                        </div>
                      </div>
                    )}
                  </th>
                ))}
                
                {/* Trash Column Spacer */}
                <th className="w-16 py-3 px-4 border-r border-gray-200 text-center bg-gray-50">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Table Body Rows */}
            <tbody className="divide-y divide-gray-200 text-gray-700">
              
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} className="py-10 text-center text-gray-400">
                    No data entries. Click <strong className="text-gray-600">"+ Add Row"</strong> above to populate values.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr 
                    key={row.id}
                    className="hover:bg-gray-50/50 group transition-colors"
                  >
                    {/* Row Multi Select Checkbox Row */}
                    <td className="py-2.5 px-3 border-r border-gray-150 text-center select-none bg-white group-hover:bg-gray-50/50">
                      <input
                        type="checkbox"
                        checked={selectedRowIds.has(row.id)}
                        onChange={() => toggleSelectRow(row.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white cursor-pointer"
                      />
                    </td>

                    {/* Columns Cells iteration matching columns */}
                    {columns.map((col) => {
                      const val = row.cells[col.id];
                      const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === col.id;
                      
                      return (
                        <td 
                          key={col.id} 
                          onDoubleClick={() => handleStartEditing(row.id, col.id, val)}
                          className={`relative py-3 px-3 border-r border-gray-200 font-sans focus-within:ring-2 focus-within:ring-blue-550 overflow-hidden cursor-text transition-all duration-75 ${
                            isEditing ? 'bg-blue-50/20 p-0' : ''
                          }`}
                        >
                          {isEditing ? (
                            // Render Active Edit Views
                            col.type === 'dropdown' ? (
                              <select
                                ref={inputRef}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleSaveCell(row.id, col.id)}
                                onKeyDown={(e) => handleKeyDown(e, row.id, col.id)}
                                className="w-full h-12 px-3 bg-white text-gray-900 border-none outline-none focus:ring-0 text-sm font-sans"
                              >
                                <option value="">-- Choose Option --</option>
                                {col.options?.map((opt, i) => (
                                  <option key={i} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : col.type === 'checkbox' ? (
                              <div className="flex items-center justify-center h-12">
                                <input
                                  type="checkbox"
                                  ref={inputRef}
                                  checked={!!editValue}
                                  onChange={(e) => setEditValue(e.target.checked)}
                                  onBlur={() => handleSaveCell(row.id, col.id)}
                                  onKeyDown={(e) => handleKeyDown(e, row.id, col.id)}
                                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                              </div>
                            ) : col.type === 'date' ? (
                              <input
                                type="date"
                                ref={inputRef}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleSaveCell(row.id, col.id)}
                                onKeyDown={(e) => handleKeyDown(e, row.id, col.id)}
                                className="w-full h-12 px-3 bg-white text-gray-900 border-none outline-none focus:ring-0 text-sm font-sans"
                              />
                            ) : col.type === 'number' ? (
                              <input
                                type="number"
                                ref={inputRef}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleSaveCell(row.id, col.id)}
                                onKeyDown={(e) => handleKeyDown(e, row.id, col.id)}
                                className="w-full h-12 px-3 bg-white text-gray-900 border-none outline-none focus:ring-0 text-sm font-sans text-right"
                              />
                            ) : (
                              <input
                                type={col.type === 'email' ? 'email' : col.type === 'phone' ? 'tel' : 'text'}
                                ref={inputRef}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleSaveCell(row.id, col.id)}
                                onKeyDown={(e) => handleKeyDown(e, row.id, col.id)}
                                className="w-full h-12 px-3 bg-white text-gray-900 border-none outline-none focus:ring-0 text-sm font-sans"
                              />
                            )
                          ) : (
                            // Render Passive Views for Cells
                            <div className="w-full min-h-[3.75rem] flex items-center justify-start py-3.5 px-4 truncate select-text text-[15px]">
                              {col.type === 'checkbox' ? (
                                <div className="mx-auto">
                                  <input
                                    type="checkbox"
                                    checked={!!val}
                                    onChange={(e) => editCell(row.id, col.id, e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white cursor-pointer"
                                  />
                                </div>
                              ) : col.type === 'dropdown' ? (
                                val ? (
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getPillColor(val, val.length)}`}>
                                    {val}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic text-xs">--</span>
                                )
                              ) : col.type === 'number' ? (
                                <span className="font-mono text-right w-full text-gray-850 pr-1">
                                  {val !== undefined && val !== null ? Number(val).toLocaleString() : ''}
                                </span>
                              ) : col.type === 'email' ? (
                                <span className="text-blue-600 hover:underline truncate">
                                  {val}
                                </span>
                              ) : col.type === 'phone' ? (
                                <span className="text-emerald-700 font-mono truncate">
                                  {val}
                                </span>
                              ) : col.type === 'date' ? (
                                <span className="font-mono text-xs truncate">
                                  {val}
                                </span>
                              ) : (
                                <span className="truncate w-full block text-gray-700">
                                  {val !== undefined ? String(val) : ''}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Single Row Actions */}
                    <td className="py-2 px-3 border-r border-gray-150 text-center select-none">
                      <button
                        onClick={() => {
                          setRowIdToDelete(row.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 rounded-md transition-all duration-100 cursor-pointer"
                        title="Delete Row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}

            </tbody>
          </table>
        )}

      </div>

      {/* Row Count Footer */}
      <div id="table-footer-status" className="py-2.5 px-4 bg-gray-50 text-xs text-gray-400 border-t border-gray-100 flex justify-between items-center z-0">
        <div>
          Showing <span className="font-medium text-gray-600">{rows.length}</span> rows
        </div>
        <div className="font-mono text-[11px]">
          Double-click any cell to inline-edit. Auto-saves to Firestore.
        </div>
      </div>

      {/* Add Column Modal Form Frame */}
      {showAddColumnModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form 
            onSubmit={handleAddNewColumnSubmit}
            className="w-full max-w-sm bg-white rounded-2xl p-6 border border-gray-100 shadow-2xl relative animate-in fade-in zoom-in duration-100"
          >
            <button
              type="button"
              onClick={() => setShowAddColumnModal(false)}
              className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="text-base font-bold text-gray-900 mb-4">Add Table Column</h3>
            
            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Column Header ID / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Total Score"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="w-full px-3.5 py-2 hover:border-gray-300 focus:border-blue-500 border border-gray-200 bg-white text-gray-900 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Data Type</label>
                <select
                  value={newColType}
                  onChange={(e) => setNewColType(e.target.value as ColumnType)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 hover:border-gray-300 bg-white text-gray-900 rounded-xl outline-none"
                >
                  <option value="text">Text (Default)</option>
                  <option value="number">Number (Values)</option>
                  <option value="date">Date picker</option>
                  <option value="email">Email Address</option>
                  <option value="phone">Phone Number</option>
                  <option value="dropdown">Badge Dropdown Select</option>
                  <option value="checkbox">Boolean Checkbox</option>
                </select>
              </div>

              {newColType === 'dropdown' && (
                <div className="animate-in slide-in-from-top-1 duration-100">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Dropdown Selection Options (Separated by commas)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Active, Pending, Blocked"
                    value={newColOptions}
                    onChange={(e) => setNewColOptions(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 bg-white text-gray-900 rounded-xl outline-none"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">Separated choices with a comma.</span>
                </div>
              )}
            </div>

            <div className="flex gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => setShowAddColumnModal(false)}
                className="flex-1 py-1.5 px-3 bg-gray-105 text-gray-700 rounded-lg font-semibold cursor-pointer text-xs md:text-sm transition-all hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold cursor-pointer text-xs md:text-sm transition-all"
              >
                Add Column
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Header Column Modal Frame */}
      {editingCol && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form 
            onSubmit={handleSaveColumnChanges}
            className="w-full max-w-sm bg-white rounded-2xl p-6 border border-gray-100 shadow-2xl relative animate-in fade-in zoom-in duration-100"
          >
            <button
              type="button"
              onClick={() => setEditingCol(null)}
              className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="text-base font-bold text-gray-900 mb-4">Edit Column Settings</h3>
            
            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Column Name</label>
                <input
                  type="text"
                  required
                  value={editColName}
                  onChange={(e) => setEditColName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 bg-white text-gray-900 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Type Representation</label>
                <select
                  value={editColType}
                  onChange={(e) => setEditColType(e.target.value as ColumnType)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 bg-white text-gray-900 rounded-xl outline-none"
                >
                  <option value="text">Text (Default)</option>
                  <option value="number">Number (Values)</option>
                  <option value="date">Date picker</option>
                  <option value="email">Email Address</option>
                  <option value="phone">Phone Number</option>
                  <option value="dropdown">Badge Dropdown Select</option>
                  <option value="checkbox">Boolean Checkbox</option>
                </select>
              </div>

              {editColType === 'dropdown' && (
                <div className="animate-in slide-in-from-top-1 duration-100">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Badge Categories (Separated by commas)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. High, Medium, Low"
                    value={editColOptions}
                    onChange={(e) => setEditColOptions(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 bg-white text-gray-900 rounded-xl outline-none mr-2"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => setEditingCol(null)}
                className="flex-1 py-1.5 px-3 bg-gray-105 text-gray-700 rounded-lg font-semibold cursor-pointer text-xs md:text-sm transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-1.5 px-3 bg-blue-600 text-white rounded-lg font-semibold cursor-pointer text-xs md:text-sm transition-all hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Column Deletion Confirmation Modal */}
      {colToDelete && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 border border-gray-100 shadow-2xl relative animate-in fade-in zoom-in duration-100">
            <h3 className="text-base font-bold text-gray-900 mb-2 font-sans">Delete Column</h3>
            <p className="text-sm text-gray-500 mb-6 font-sans">
              Are you absolutely sure you want to delete column <strong className="text-gray-900">"{colToDelete.name}"</strong>? All cell values in this column for all rows will be discarded permanently.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setColToDelete(null)}
                className="flex-1 py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold cursor-pointer text-xs md:text-sm transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  removeColumn(colToDelete.id);
                  setColToDelete(null);
                }}
                className="flex-1 py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold cursor-pointer text-xs md:text-sm transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Row Deletion Confirmation Modal */}
      {rowIdToDelete && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 border border-gray-100 shadow-2xl relative animate-in fade-in zoom-in duration-100">
            <h3 className="text-base font-bold text-gray-900 mb-2 font-sans">Delete Row</h3>
            <p className="text-sm text-gray-500 mb-6 font-sans">
              Are you sure you want to delete this row entry? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRowIdToDelete(null)}
                className="flex-1 py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold cursor-pointer text-xs md:text-sm transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  removeRow(rowIdToDelete);
                  setRowIdToDelete(null);
                }}
                className="flex-1 py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold cursor-pointer text-xs md:text-sm transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
