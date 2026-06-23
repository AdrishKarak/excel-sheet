import React, { useState } from 'react';
import { 
  Plus, 
  Table as TableIcon, 
  Star, 
  Trash2, 
  Copy, 
  Menu, 
  X, 
  History, 
  Database,
  BarChart2, 
  User as UserIcon, 
  LogOut, 
  Sparkles,
  Search,
  Edit2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useTable } from '../context/TableContext';
import { useAuth } from '../context/AuthContext';
import { TableMetadata } from '../types';
import { toast } from 'react-hot-toast';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const { 
    tables, 
    activeTable, 
    loadingTables, 
    selectTable, 
    createNewTable, 
    cloneTable, 
    toggleFavoriteTable, 
    removeActiveTable,
    recentTables,
    renameActiveTable
  } = useTable();

  const { userProfile, logout } = useAuth();
  
  // Mobile responsive sidebar toggle state
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Create table state modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<'empty' | 'student' | 'expense' | 'inventory'>('empty');
  const [creating, setCreating] = useState(false);

  // Table renaming modal state
  const [renamingTableId, setRenamingTableId] = useState<string | null>(null);
  const [renamingText, setRenamingText] = useState('');

  // Table deleting modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) {
      toast.error("Table name cannot be empty");
      return;
    }
    try {
      setCreating(true);
      await createNewTable(newTableName, selectedTemplate);
      setShowCreateModal(false);
      setNewTableName('');
      setSelectedTemplate('empty');
      setMobileOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent, tableId: string) => {
    e.preventDefault();
    if (!renamingText.trim()) return;
    await renameActiveTable(renamingText);
    setRenamingTableId(null);
  };

  // Group columns for cleaner separation in the panel
  const favoriteTables = tables.filter(t => t.isFavorite);
  const standardTables = tables.filter(t => !t.isFavorite);

  // Render sidebar contents inside a reusable component for mobile / desktop
  const SidebarContent = () => {
    if (collapsed) {
      return (
        <div id="collapsed-sidebar-container" className="flex flex-col h-full bg-white border-r border-gray-200 text-gray-700 select-none">
          {/* Collapse Header toggle */}
          <div className="flex items-center justify-center p-4 border-b border-gray-200 h-16 shrink-0">
            <button
              onClick={() => setCollapsed(false)}
              type="button"
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500 cursor-pointer transition-colors"
              title="Expand Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Create Table */}
          <div className="px-2 pt-5 pb-2 flex justify-center">
            <button
              onClick={() => setShowCreateModal(true)}
              type="button"
              className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full cursor-pointer shadow-sm transition-transform hover:scale-105"
              title="Create Table"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Collapsed Scroller Lists */}
          <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6 flex flex-col items-center">
            {/* Presets / Templates */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block font-mono">Tpls</span>
              <button
                onClick={() => {
                  setNewTableName("Student Records");
                  setSelectedTemplate("student");
                  setShowCreateModal(true);
                }}
                type="button"
                className="w-10 h-10 p-0 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:border-blue-200 text-sm cursor-pointer"
                title="🎓 Student Records Template"
              >
                🎓
              </button>
              <button
                onClick={() => {
                  setNewTableName("Expense Tracker");
                  setSelectedTemplate("expense");
                  setShowCreateModal(true);
                }}
                type="button"
                className="w-10 h-10 p-0 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:border-blue-200 text-sm cursor-pointer"
                title="💵 Expense Tracker Template"
              >
                💵
              </button>
            </div>

            {/* List Icon triggers */}
            <div className="w-full border-t border-gray-150 my-2"></div>

            <div className="flex flex-col items-center gap-2 w-full">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block font-mono">Tabs</span>
              {tables.map((t) => (
                <button
                  key={t.id}
                  onClick={() => selectTable(t.id)}
                  type="button"
                  className={`w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-all border ${
                    activeTable?.id === t.id
                      ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-xs'
                      : 'text-gray-500 hover:text-gray-950 hover:bg-gray-50 border-transparent'
                  }`}
                  title={`${t.name}${t.isFavorite ? ' (★ Favorite)' : ''}`}
                >
                  <TableIcon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* User profile compact */}
          <div className="p-3 border-t border-gray-200 bg-gray-50 flex flex-col items-center gap-3">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-sm" title={userProfile?.name || 'User'}>
              {userProfile?.name ? userProfile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'JD'}
            </div>
            <button
              onClick={logout}
              type="button"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    // Normal Expanded sidebar
    return (
      <div id="expanded-sidebar-container" className="flex flex-col h-full bg-white border-r border-gray-200 text-gray-700">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 h-16 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl select-none shadow-sm">
              S
            </div>
            <div className="truncate">
              <h1 className="font-bold text-gray-900 text-base tracking-tight font-sans leading-none">SmartTable</h1>
              <span className="text-[9px] text-blue-600 font-mono font-semibold tracking-wider">FIRESTORE SYSTEM</span>
            </div>
          </div>
          
          <button
            onClick={() => setCollapsed(true)}
            type="button"
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500 cursor-pointer transition-colors"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Tables Quick Creation Action */}
        <div className="px-4 pt-5 pb-2">
          <button
            onClick={() => setShowCreateModal(true)}
            type="button"
            className="w-full flex items-center justify-center gap-2 cursor-pointer py-2 px-3 bg-blue-600 hover:bg-blue-700 hover:scale-[1.01] transition-all text-white rounded-lg text-sm font-semibold shadow-sm font-sans"
          >
            <Plus className="w-4 h-4 text-white" /> Create Table
          </button>
        </div>

        {/* Main Scroller lists */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-7">
          
          {/* Templates Quick Launch Pad */}
          <div>
            <span className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 font-mono">Templates</span>
            <div className="grid grid-cols-2 gap-1.5 px-1">
              <button
                onClick={() => {
                  setNewTableName("Student Records");
                  setSelectedTemplate("student");
                  setShowCreateModal(true);
                }}
                type="button"
                className="text-left p-2 rounded-lg bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 transition text-[11px] font-semibold text-gray-700 cursor-pointer"
              >
                🎓 Student Records
              </button>
              <button
                onClick={() => {
                  setNewTableName("Expense Tracker");
                  setSelectedTemplate("expense");
                  setShowCreateModal(true);
                }}
                type="button"
                className="text-left p-2 rounded-lg bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 transition text-[11px] font-semibold text-gray-700 cursor-pointer"
              >
                💵 Expense Tracker
              </button>
            </div>
          </div>

          {/* Categories: Favorite tables */}
          {favoriteTables.length > 0 && (
            <div>
              <span className="px-3 text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 mb-2 font-mono">
                <Star className="w-3.5 h-3.5 fill-blue-600 text-blue-600" /> Favorites
              </span>
              <ul className="space-y-0.5">
                {favoriteTables.map((t) => (
                  <TableListItem key={t.id} table={t} />
                ))}
              </ul>
            </div>
          )}

          {/* Categories: All Private Tables */}
          <div>
            <span className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 font-mono">Your Tables</span>
            {loadingTables ? (
              <div className="px-3 py-4 text-xs text-gray-400 font-mono flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                Loading metadata...
              </div>
            ) : tables.length === 0 ? (
              <p className="px-3 text-xs text-gray-400 italic">No custom tables created. Use the wizard above to seed one.</p>
            ) : (
              <ul className="space-y-0.5">
                {standardTables.map((t) => (
                  <TableListItem key={t.id} table={t} />
                ))}
              </ul>
            )}
          </div>

          {/* Recently Opened Section */}
          {recentTables.length > 0 && (
            <div>
              <span className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 mb-2 font-mono">
                <History className="w-3 h-3 text-gray-400" /> Recently Opened
              </span>
              <ul className="space-y-0.5 bg-gray-50/50 border border-gray-100 rounded-lg p-1">
                {recentTables.map((rt) => (
                  <li key={rt.id}>
                    <button
                      onClick={() => {
                        selectTable(rt.id);
                        setMobileOpen(false);
                      }}
                      type="button"
                      className={`w-full text-left py-1.5 px-3 rounded-lg text-xs flex items-center justify-between cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-all ${
                        activeTable?.id === rt.id ? 'text-blue-600 font-semibold' : 'text-gray-500'
                      }`}
                    >
                      <span className="truncate">{rt.name}</span>
                      <span className="text-[9px] font-mono opacity-40">→</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>

        {/* User Info & Auth Drawer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col gap-3 font-sans">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {userProfile?.name ? userProfile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'JD'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-gray-900 leading-none">
                {userProfile?.name || 'Authorized User'}
              </p>
              <p className="text-xs text-gray-400 truncate mt-1">
                {userProfile?.email}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            type="button"
            className="w-full flex items-center justify-center gap-2 cursor-pointer py-1.5 px-3 border border-gray-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all text-xs font-medium text-gray-600 rounded-lg shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out from SmartTable
          </button>
        </div>
      </div>
    );
  };

  // Nested Component for visual Table item rows
  function TableListItem({ table }: { table: TableMetadata; key?: any }) {
    const isEditingName = renamingTableId === table.id;
    const isSelected = activeTable?.id === table.id;

    return (
      <li 
        className={`group flex items-center justify-between py-1 px-2.5 rounded-lg transition-all cursor-pointer select-none ${
          isSelected 
            ? 'bg-blue-600 border border-blue-500 text-white shadow-sm font-semibold' 
            : 'hover:bg-blue-50 text-gray-700 hover:text-blue-700 border border-transparent'
        }`}
      >
        <div
          onClick={() => {
            if (!isEditingName) {
              selectTable(table.id);
              setMobileOpen(false);
            }
          }}
          className="flex-1 min-w-0 flex items-center gap-2 py-0.5"
        >
          <TableIcon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
          
          {isEditingName ? (
            <form 
              onSubmit={(e) => handleRenameSubmit(e, table.id)}
              onClick={(e) => e.stopPropagation()}
              className="w-full pr-2"
            >
              <input
                type="text"
                autoFocus
                value={renamingText}
                onChange={(e) => setRenamingText(e.target.value)}
                onBlur={() => setRenamingTableId(null)}
                className="w-full text-xs font-sans px-1 py-0.5 rounded border border-gray-300 bg-white text-gray-900 outline-none focus:border-blue-500"
              />
            </form>
          ) : (
            <span className="truncate text-xs font-sans">{table.name}</span>
          )}
        </div>

        {/* Table item Actions hovered panel */}
        {!isEditingName && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavoriteTable(table.id);
              }}
              type="button"
              className={`p-0.5 rounded cursor-pointer ${
                table.isFavorite ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'
              }`}
              title={table.isFavorite ? "Remove favorite" : "Mark favorite"}
            >
              <Star className={`w-3.5 h-3.5 ${table.isFavorite ? 'fill-amber-500' : ''}`} />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                cloneTable(table.id);
              }}
              type="button"
              className="p-1 rounded text-slate-500 hover:text-blue-500 cursor-pointer"
              title="Duplicate Table"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setRenamingTableId(table.id);
                setRenamingText(table.name);
              }}
              type="button"
              className="p-1 rounded text-slate-500 hover:text-teal-400 cursor-pointer"
              title="Rename Table"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            {isSelected && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteModal(true);
                }}
                type="button"
                className="p-1 rounded text-slate-500 hover:text-red-500 cursor-pointer"
                title="Delete Table"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </li>
    );
  }

  return (
    <div className="h-full shrink-0 flex flex-col z-20">
      {/* Mobile Header Menu bar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 text-gray-900 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-sm tracking-wide text-gray-900">SmartTable</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            type="button"
            className="p-2 rounded bg-gray-50 border border-gray-200 text-gray-700"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Slide list */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 flex">
          {/* Backdrop blur */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          ></div>
          
          <div className="relative w-72 max-w-sm flex-1 flex flex-col h-full bg-white animate-in slide-in-from-left duration-150">
            <button
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-white"
              onClick={() => setMobileOpen(false)}
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="h-full">
              <SidebarContent />
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={`hidden lg:block h-full transition-all duration-200 ${collapsed ? 'w-16' : 'w-72'}`}>
        <SidebarContent />
      </div>

      {/* Seed Create Table Dialog Frame */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <form 
            onSubmit={handleCreateSubmit}
            className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-100 text-slate-700"
          >
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-gray-700 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-gray-950 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-blue-600 fill-blue-600/10" /> Create Table
            </h3>
            <p className="text-xs text-gray-400 mb-5">
              Define your data table properties. Choose a structured database setup below to auto-seed properties.
            </p>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Table name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Student Directory"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 bg-white text-gray-900 rounded-xl outline-none focus:border-blue-500 hover:border-gray-300 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Preset Schema Layout Template</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'empty', name: 'Empty Slate', desc: 'No presets, clean row headers', icon: '📝' },
                    { id: 'student', name: 'Student Records', desc: 'Preseeded names, roll, branch, GPA', icon: '📝' },
                    { id: 'expense', name: 'Expense Ledger', desc: 'Seeded items, bills, categories', icon: '💰' },
                    { id: 'inventory', name: 'Inventory Stack', desc: 'Prepopulated quantity, supply list', icon: '📦' }
                  ].map((temp) => (
                    <button
                      key={temp.id}
                      type="button"
                      onClick={() => setSelectedTemplate(temp.id as any)}
                      className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                        selectedTemplate === temp.id
                          ? 'border-blue-600 bg-blue-50/20 ring-1 ring-blue-600'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{temp.icon}</span>
                        <span className="font-semibold text-gray-950 text-xs">{temp.name}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 leading-snug">{temp.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 mt-7">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 rounded-lg font-semibold text-xs md:text-sm transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                {creating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : 'Assemble Table'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 border border-gray-100 shadow-2xl relative animate-in fade-in zoom-in duration-100">
            <h3 className="text-base font-bold text-gray-900 mb-2">Delete Table</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you absolutely sure you want to delete the table "{activeTable?.name}" and all of its cell data? This action is irreversible.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold cursor-pointer text-xs md:text-sm transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowDeleteModal(false);
                  await removeActiveTable();
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
