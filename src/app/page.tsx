"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ShieldCheck } from 'lucide-react';

export default function Home() {
  const [certId, setCertId] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (certId.trim()) {
      router.push(`/verify/${certId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <ShieldCheck className="w-16 h-16 text-indigo-600" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
          Document Verification
        </h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto">
          Verify the authenticity of Brainovision certificates and offer letters using the unique ID.
        </p>
      </div>

      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-slate-200">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
            <input 
              type="text" 
              placeholder="Enter Internship ID (e.g. INT-12345)"
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-lg border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition"
              required
            />
          </div>
          <button 
            type="submit"
            className="py-4 px-8 bg-indigo-600 text-white text-lg font-bold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 whitespace-nowrap"
          >
            Verify Now
          </button>
        </form>
      </div>
      
      <div className="mt-16 text-center text-slate-400 text-sm">
        &copy; {new Date().getFullYear()} Brainovision Solutions India Pvt. Ltd. All rights reserved.
      </div>
    </div>
  );
}
