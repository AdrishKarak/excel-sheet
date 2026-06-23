/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TableProvider } from './context/TableContext';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import { Toaster } from 'react-hot-toast';
import { Database } from 'lucide-react';

function AppContent() {
  const { currentUser, loading } = useAuth();

  useEffect(() => {
    // Explicitly guarantee only light/white theme is used
    document.documentElement.classList.remove('dark');
    try {
      localStorage.setItem('theme', 'light');
    } catch (e) {
      console.warn(e);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 select-none">
        <div className="relative">
          <div className="p-4 bg-gradient-to-br from-blue-600 to-sky-500 rounded-3xl text-white shadow-xl animate-pulse">
            <Database className="w-8 h-8" />
          </div>
          <div className="absolute -inset-1 border border-blue-500 rounded-3xl animate-ping opacity-25"></div>
        </div>
        <h3 className="text-sm font-semibold text-gray-800 mt-6 tracking-wide">Syncing Security Credentials...</h3>
        <p className="text-xs text-gray-400 mt-1 font-mono">Stand by</p>
      </div>
    );
  }

  return currentUser ? <Dashboard /> : <AuthPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <TableProvider>
        <AppContent />
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f172a',
              color: '#f8fafc',
              borderRadius: '1rem',
              fontSize: '0.850rem',
              border: '1px solid #1e293b'
            }
          }}
        />
      </TableProvider>
    </AuthProvider>
  );
}

