"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Upload, FileText, CheckCircle, Ban, Send, Search, Filter, X } from 'lucide-react';

export default function AdminDashboard() {
  const [certs, setCerts] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [background, setBackground] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sendingCerts, setSendingCerts] = useState(false);
  const [deletingCerts, setDeletingCerts] = useState(false);
  const [selectedCertIds, setSelectedCertIds] = useState<number[]>([]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const router = useRouter();

  const fetchCerts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return router.push('/admin/login');
      const res = await axios.get('http://localhost:5000/api/admin/certificates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCerts(res.data);
    } catch (err) {
      router.push('/admin/login');
    }
  };

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get('http://localhost:5000/api/admin/templates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(res.data);
      if (res.data.length > 0) setSelectedTemplate(res.data[0].template_id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCerts();
    fetchTemplates();
  }, []);

  // ── Derived: unique program types ─────────────────────────────────────────
  const programTypes = useMemo(() => {
    const set = new Set(certs.map((c: any) => c.program_type).filter(Boolean));
    return Array.from(set).sort() as string[];
  }, [certs]);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return certs.filter((c: any) => {
      const q = searchQuery.toLowerCase();
      if (q) {
        const match =
          (c.name || '').toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q) ||
          (c.internship_id || '').toLowerCase().includes(q) ||
          (c.certificate_id || '').toLowerCase().includes(q) ||
          (c.college || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;
      if (filterProgram && c.program_type !== filterProgram) return false;
      if (filterDateFrom) {
        const issueDate = new Date(c.issue_date);
        if (issueDate < new Date(filterDateFrom)) return false;
      }
      if (filterDateTo) {
        const issueDate = new Date(c.issue_date);
        if (issueDate > new Date(filterDateTo + 'T23:59:59')) return false;
      }
      return true;
    });
  }, [certs, searchQuery, filterStatus, filterProgram, filterDateFrom, filterDateTo]);

  const clearFilters = () => {
    setSearchQuery('');
    setFilterStatus('ALL');
    setFilterProgram('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const hasActiveFilters = searchQuery || filterStatus !== 'ALL' || filterProgram || filterDateFrom || filterDateTo;

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) { alert("Please upload the CSV data file."); return; }
    setUploading(true);
    const formData = new FormData();
    formData.append('csv', file);
    if (background) formData.append('background', background);
    if (logo) formData.append('logo', logo);
    if (selectedTemplate) formData.append('template_id', selectedTemplate);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/admin/upload-bulk', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setFile(null); setBackground(null); setLogo(null);
      fetchCerts();
      const count = res.data?.generated || 0;
      alert(`✅ ${count} certificate(s) generated! Select them below and click Send to email.`);
    } catch (err) {
      alert("Error uploading file");
    } finally {
      setUploading(false);
    }
  };

  const handleRevoke = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/admin/certificates/${id}/revoke`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCerts();
    } catch (err) { alert("Failed to revoke"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this certificate permanently?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/certificates/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedCertIds(prev => prev.filter(x => x !== id));
      fetchCerts();
    } catch (err) { alert("Failed to delete record"); }
  };

  const toggleCertSelect = (id: number) =>
    setSelectedCertIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const selectAllFiltered = () => {
    const filteredIds = filtered.map((c: any) => c.id);
    const allSelected = filteredIds.every(id => selectedCertIds.includes(id));
    if (allSelected) {
      setSelectedCertIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedCertIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const filteredAllSelected = filtered.length > 0 && filtered.every((c: any) => selectedCertIds.includes(c.id));

  const handleSendCerts = async () => {
    if (selectedCertIds.length === 0) { alert("Select at least one certificate to send."); return; }
    setSendingCerts(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/admin/certificates/send', { ids: selectedCertIds }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { sent, failed, errors } = res.data;
      setSelectedCertIds([]);
      if (sent > 0 && failed === 0) {
        alert(`✅ ${sent} certificate(s) sent successfully!`);
      } else if (sent > 0) {
        alert(`⚠️ ${sent} sent, ${failed} failed.\n\nFailed:\n${errors.join('\n')}`);
      } else {
        alert(`❌ No emails sent.\n\n${errors.length > 0 ? errors.join('\n') : 'Check backend console for details.'}`);
      }
    } catch (err: any) {
      alert(`Failed to send certificates: ${err.response?.data?.error || err.message}`);
    } finally {
      setSendingCerts(false);
    }
  };

  const handleBulkDeleteCerts = async () => {
    if (selectedCertIds.length === 0) return;
    if (!confirm(`Delete ${selectedCertIds.length} selected certificate(s) permanently?`)) return;
    setDeletingCerts(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete('http://localhost:5000/api/admin/certificates/bulk', {
        headers: { Authorization: `Bearer ${token}` },
        data: { ids: selectedCertIds }
      });
      setSelectedCertIds([]);
      fetchCerts();
      alert(`✅ ${selectedCertIds.length} certificate(s) deleted.`);
    } catch (err: any) {
      alert('Bulk delete failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setDeletingCerts(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Certificates Dashboard</h1>
        <p className="text-slate-500 mt-1">Generate and manage internship certificates. Send emails manually after review.</p>
      </div>

      {/* Upload Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center space-x-2 mb-4">
          <Upload className="w-5 h-5 text-indigo-600" />
          <span>Bulk Generate Certificates</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">1. Select Template</label>
            <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} className="block w-full text-sm p-2 border rounded-md">
              <option value="">Auto (Male/Female)</option>
              {templates.map((t: any) => (
                <option key={t.id} value={t.template_id}>{t.name} ({t.orientation})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">2. CSV Data File</label>
            <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">3. Override Background (Opt)</label>
            <input type="file" accept="image/*" onChange={(e) => setBackground(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">4. Override Logo (Opt)</label>
            <input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition" />
          </div>
        </div>
        <div className="flex items-center justify-between space-x-4 border-t pt-4">
          <button onClick={handleUpload} disabled={!file || uploading}
            className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition min-w-[200px]">
            {uploading ? 'Processing...' : 'Generate Certificates'}
          </button>
          <a href="/sample.csv" download className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition text-sm flex items-center">
            <FileText className="w-4 h-4 mr-2" /> Download Sample CSV
          </a>
        </div>
        <p className="text-xs text-slate-400 mt-3">Required CSV columns: name, email, gender, college, course, program_type, duration, start_date, end_date, role. Optional: internship_id</p>
      </div>

      {/* Certificates Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>Generated Certificates</span>
              </h2>
              <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">
                {filtered.length}{filtered.length !== certs.length ? ` / ${certs.length}` : ''} records
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedCertIds.length > 0 && (
                <>
                  <button onClick={handleSendCerts} disabled={sendingCerts}
                    className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition">
                    <Send className="w-4 h-4" />
                    <span>{sendingCerts ? 'Sending...' : `Send (${selectedCertIds.length})`}</span>
                  </button>
                  <button onClick={handleBulkDeleteCerts} disabled={deletingCerts}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition">
                    <span>{deletingCerts ? 'Deleting...' : `Delete (${selectedCertIds.length})`}</span>
                  </button>
                </>
              )}
              <button
                onClick={() => setShowFilters(f => !f)}
                className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-lg border transition ${showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <Filter className="w-4 h-4" />
                <span>Filter{hasActiveFilters ? ' •' : ''}</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Search */}
                <div className="lg:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, email, internship ID, college..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                {/* Status */}
                <div>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300">
                    <option value="ALL">All Statuses</option>
                    <option value="VALID">Valid</option>
                    <option value="REVOKED">Revoked</option>
                  </select>
                </div>
                {/* Program */}
                <div>
                  <select value={filterProgram} onChange={e => setFilterProgram(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300">
                    <option value="">All Programs</option>
                    {programTypes.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                {/* Date range + clear */}
                <div className="flex items-center space-x-2">
                  <div className="flex flex-col w-full space-y-1">
                    <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                      title="Issue date from"
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                    <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                      title="Issue date to"
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                  </div>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} title="Clear all filters"
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition flex-shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {hasActiveFilters && (
                <p className="text-xs text-indigo-600 mt-2">
                  Showing {filtered.length} of {certs.length} records matching current filters.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 font-medium">
              <tr>
                <th className="px-6 py-3">
                  <input type="checkbox" onChange={selectAllFiltered} checked={filteredAllSelected} />
                </th>
                <th className="px-6 py-3">Internship / Cert ID</th>
                <th className="px-6 py-3">Student Name</th>
                <th className="px-6 py-3">Program</th>
                <th className="px-6 py-3">Issue Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <input type="checkbox" checked={selectedCertIds.includes(c.id)} onChange={() => toggleCertSelect(c.id)} />
                  </td>
                  <td className="px-6 py-4 font-mono font-medium text-slate-800">
                    <div className="text-xs text-indigo-600 font-semibold">{c.internship_id}</div>
                    <div className="text-xs text-slate-400">{c.certificate_id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{c.name}</div>
                    <div className="text-xs text-slate-400">{c.email}</div>
                    {c.college && <div className="text-xs text-slate-400">{c.college}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div>{c.program_type}</div>
                    <div className="text-xs text-slate-400">{c.duration}</div>
                  </td>
                  <td className="px-6 py-4">{new Date(c.issue_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    {c.status === 'VALID' ? (
                      <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                        <CheckCircle className="w-3 h-3 mr-1" /> Valid
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-medium text-red-700 bg-red-50 px-2 py-1 rounded">
                        <Ban className="w-3 h-3 mr-1" /> Revoked
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-3 items-center">
                      <a href={`http://localhost:5000/api/public/verify/${c.certificate_id}`} target="_blank" className="text-indigo-600 hover:text-indigo-800 font-medium">View</a>
                      {c.status === 'VALID' && (
                        <button onClick={() => handleRevoke(c.id)} className="text-amber-600 hover:text-amber-800 font-medium">Revoke</button>
                      )}
                      <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-800 font-medium ml-2">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-slate-400">
              {certs.length === 0 ? 'No certificates generated yet.' : 'No records match your current filters.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
