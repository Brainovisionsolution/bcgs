"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/admin/login', { email, password });
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        router.push('/admin');
      }
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8 border border-slate-200 shadow-indigo-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin Login</h1>
          <p className="text-slate-500 mt-2">Sign in to manage certificates</p>
        </div>
        
        {error && <div className="p-3 mb-6 bg-red-50 text-red-600 rounded-md text-sm font-medium">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 py-2 w-5 h-5 text-slate-400" />
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
                required 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 py-2 w-5 h-5 text-slate-400" />
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
                required 
              />
            </div>
          </div>
          <button 
            type="submit" 
            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
