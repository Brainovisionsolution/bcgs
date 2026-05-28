"use client";

import { useState } from 'react';
import axios from 'axios';
import { Lock } from 'lucide-react';

export default function SettingsPage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/admin/reset-password', {
        oldPassword,
        newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage("Password updated successfully.");
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account preferences and security.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-md">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center space-x-2 mb-4">
          <Lock className="w-5 h-5 text-indigo-600" />
          <span>Change Password</span>
        </h2>

        <form onSubmit={handleReset} className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
          {message && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm">{message}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
            <input 
              type="password" 
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full border rounded-lg p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
            <input 
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border rounded-lg p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border rounded-lg p-2"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 mt-4"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
