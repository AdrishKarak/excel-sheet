import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Database, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AuthPage() {
  const { login, register, loginWithGoogle } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      if (isRegister) {
        if (!name.trim()) {
          toast.error("Name is required is register form");
          setLoading(false);
          return;
        }
        await register(email, name, password);
        toast.success("Account registered successfully!");
      } else {
        await login(email, password);
        toast.success("Welcome back to SmartTable!");
      }
    } catch (err: any) {
      console.error(err);
      let msg = "Authentication failed. Please verify credentials.";
      if (err.code === 'auth/email-already-in-use') {
        msg = "Email address is already registered!";
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        msg = "Incorrect username or password.";
      } else if (err.code === 'auth/invalid-email') {
        msg = "Invalid email format entered.";
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = "Email/Password provider is not enabled in Firebase Auth. Please use Google Sign-In or enable Email/Password in your project console.";
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
      toast.success("Welcome back to SmartTable!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Google sign-in was unsuccessful.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 transition-colors duration-150">
      
      {/* Decorative colored glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-sky-400/20 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl shadow-xl hover:shadow-2xl p-8 relative z-10 transition-all duration-155">
        
        {/* Brand visual Header */}
        <div className="flex flex-col items-center mb-8 text-center select-none">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-sky-500 rounded-2xl shadow-lg text-white mb-3">
            <Database className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 tracking-tight font-sans">
            {isRegister ? 'Set Up Your Vault' : 'Welcome to SmartTable'}
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-[280px]">
            {isRegister 
              ? 'Create a unified, dynamic spreadsheet backed by Firestore.' 
              : 'Sign in to access your personal workspace, tables, and rows.'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {isRegister && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5 font-mono">Full Name</label>
              <div className="relative flex items-center">
                <User className="absolute left-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 outline-none hover:border-gray-300 focus:border-blue-500 border border-gray-200 dark:border-gray-800 dark:bg-gray-800 bg-white text-gray-900 dark:text-gray-100 rounded-2xl text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5 font-mono">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 outline-none hover:border-gray-300 focus:border-blue-500 border border-gray-200 dark:border-gray-800 dark:bg-gray-800 bg-white text-gray-900 dark:text-gray-100 rounded-2xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5 font-mono">Secret Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-gray-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 outline-none hover:border-gray-300 focus:border-blue-500 border border-gray-200 dark:border-gray-800 dark:bg-gray-800 bg-white text-gray-900 dark:text-gray-100 rounded-2xl text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 cursor-pointer mt-6 py-3 px-4 bg-blue-600 hover:bg-blue-700 hover:scale-[1.01] text-white font-semibold rounded-2xl text-sm shadow-md transition-all duration-100"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                {isRegister ? 'Register Account' : 'Sign In Workspace'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="relative my-5 flex py-1 items-center">
            <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
            <span className="flex-shrink mx-3 text-[10px] font-mono tracking-widest text-gray-400 dark:text-gray-500 uppercase">Or Continue With</span>
            <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 cursor-pointer py-2.5 px-4 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850 text-gray-700 dark:text-gray-200 font-semibold rounded-2xl text-sm transition-all shadow-xs"
          >
            <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Sign In with Google
          </button>

        </form>

        <div className="mt-6 text-center select-none text-xs">
          <p className="text-gray-500">
            {isRegister ? 'Already have a secure workspace?' : "Don't have a Vault yet?"}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setEmail('');
                setPassword('');
                setName('');
              }}
              className="ml-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
            >
              {isRegister ? 'Sign In' : 'Create Account'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
