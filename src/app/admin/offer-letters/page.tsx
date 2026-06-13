"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Upload, FileText, CheckCircle, Ban, Send, Search, Filter, X } from 'lucide-react';

export default function OfferLettersDashboard() {
  const [offers, setOffers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [background, setBackground] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [generatingCerts, setGeneratingCerts] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const router = useRouter();

  const fetchOffers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return router.push('/admin/login');
      const res = await axios.get('https://api-bcgs.brainovision.in/api/admin/offer-letters', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOffers(res.data);
    } catch (err) {
      router.push('/admin/login');
    }
  };

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get('https://api-bcgs.brainovision.in/api/admin/templates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(res.data);
      if (res.data.length > 0) setSelectedTemplate(res.data[0].template_id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOffers();
    fetchTemplates();
  }, []);

  // ── Derived: unique program types for filter dropdown ─────────────────────
  const programTypes = useMemo(() => {
    const set = new Set(offers.map((o: any) => o.program_type).filter(Boolean));
    return Array.from(set).sort();
  }, [offers]);

  // ── Filtered list (client-side) ───────────────────────────────────────────
  const filtered = useMemo(() => {
    return offers.filter((o: any) => {
      const q = searchQuery.toLowerCase();
      if (q) {
        const match =
          (o.name || '').toLowerCase().includes(q) ||
          (o.email || '').toLowerCase().includes(q) ||
          (o.internship_id || '').toLowerCase().includes(q) ||
          (o.offer_id || '').toLowerCase().includes(q) ||
          (o.college || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterStatus !== 'ALL' && o.status !== filterStatus) return false;
      if (filterProgram && o.program_type !== filterProgram) return false;
      if (filterDateFrom) {
        const issueDate = new Date(o.issue_date);
        if (issueDate < new Date(filterDateFrom)) return false;
      }
      if (filterDateTo) {
        const issueDate = new Date(o.issue_date);
        if (issueDate > new Date(filterDateTo + 'T23:59:59')) return false;
      }
      return true;
    });
  }, [offers, searchQuery, filterStatus, filterProgram, filterDateFrom, filterDateTo]);

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
      const res = await axios.post('https://api-bcgs.brainovision.in/api/admin/upload-bulk-offer-letters', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setFile(null); setBackground(null); setLogo(null);
      fetchOffers();
      const count = res.data.generated;
      if (count > 0) {
        alert(`Successfully generated ${count} offer letter(s)! Select them below and click Send to email.`);
      } else {
        alert("Success, but 0 offer letters were generated. Ensure your CSV has valid rows.");
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Error uploading file.";
      const details = err.response?.data?.details ? `\nDetails: ${err.response.data.details[0]}` : "";
      alert(errorMsg + details);
    } finally {
      setUploading(false);
    }
  };

  const handleRevoke = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`https://api-bcgs.brainovision.in/api/admin/offer-letters/${id}/revoke`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOffers();
    } catch (err) { alert("Failed to revoke"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this offer letter permanently?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`https://api-bcgs.brainovision.in/api/admin/offer-letters/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedIds(prev => prev.filter(x => x !== id));
      fetchOffers();
    } catch (err) { alert("Failed to delete record"); }
  };

  const handleSendSelected = async () => {
    if (selectedIds.length === 0) { alert("Select at least one offer letter to send."); return; }
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('https://api-bcgs.brainovision.in/api/admin/offer-letters/send', { ids: selectedIds }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { sent, failed, errors } = res.data;
      setSelectedIds([]);
      fetchOffers();
      if (sent > 0 && failed === 0) {
        alert(`✅ ${sent} offer letter(s) sent successfully!`);
      } else if (sent > 0) {
        alert(`⚠️ ${sent} sent, ${failed} failed.\n\nFailed:\n${errors.join('\n')}`);
      } else {
        alert(`❌ No emails sent.\n\n${errors.length > 0 ? errors.join('\n') : 'Check backend console for details.'}`);
      }
    } catch (err: any) {
      alert(`Failed to send offer letters: ${err.response?.data?.error || err.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleGenerateCertificates = async () => {
    if (selectedIds.length === 0) { alert("Select at least one offer letter to generate certificates."); return; }
    setGeneratingCerts(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('https://api-bcgs.brainovision.in/api/admin/offer-letters/generate-certificates', { ids: selectedIds }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedIds([]);
      alert(`✅ ${res.data.generated} certificate(s) generated! Go to the Certificates section to send them.`);
    } catch (err) {
      alert("Failed to generate certificates");
    } finally {
      setGeneratingCerts(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} selected offer letter(s) permanently?`)) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete('https://api-bcgs.brainovision.in/api/admin/offer-letters/bulk', {
        headers: { Authorization: `Bearer ${token}` },
        data: { ids: selectedIds }
      });
      setSelectedIds([]);
      fetchOffers();
      alert(`✅ ${selectedIds.length} record(s) deleted.`);
    } catch (err: any) {
      alert('Bulk delete failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelect = (id: number) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const selectAllFiltered = () => {
    const filteredIds = filtered.map((o: any) => o.id);
    const allSelected = filteredIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const filteredAllSelected = filtered.length > 0 && filtered.every((o: any) => selectedIds.includes(o.id));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Offer Letters</h1>
        <p className="text-slate-500 mt-1">Generate and send offer letters to candidates.</p>
      </div>

      {/* Upload Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center space-x-2 mb-4">
          <Upload className="w-5 h-5 text-indigo-600" />
          <span>Bulk Generate Offer Letters</span>
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
            {uploading ? 'Processing...' : 'Generate Offer Letters'}
          </button>
          <a href="/sample.csv" download className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition text-sm flex items-center">
            <FileText className="w-4 h-4 mr-2" /> Download Sample CSV
          </a>
        </div>
      </div>

      {/* Offer Letters Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>Generated Offer Letters</span>
              </h2>
              <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">
                {filtered.length}{filtered.length !== offers.length ? ` / ${offers.length}` : ''} records
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleGenerateCertificates}
                disabled={generatingCerts || selectedIds.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                <span>{generatingCerts ? 'Generating...' : `Gen Certs (${selectedIds.length})`}</span>
              </button>
              {selectedIds.length > 0 && (
                <>
                  <button onClick={handleSendSelected} disabled={sending}
                    className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition">
                    <Send className="w-4 h-4" />
                    <span>{sending ? 'Sending...' : `Send (${selectedIds.length})`}</span>
                  </button>
                  <button onClick={handleBulkDelete} disabled={deleting}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition">
                    <span>{deleting ? 'Deleting...' : `Delete (${selectedIds.length})`}</span>
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
                    placeholder="Search name, email, ID, college..."
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
                    <option value="GENERATED">Generated</option>
                    <option value="SENT">Sent</option>
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
                {/* Clear */}
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
                  Showing {filtered.length} of {offers.length} records matching current filters.
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
                <th className="px-6 py-3">ID / Internship ID</th>
                <th className="px-6 py-3">Candidate Name</th>
                <th className="px-6 py-3">Program</th>
                <th className="px-6 py-3">Issue Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o: any) => (
                <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <input type="checkbox" checked={selectedIds.includes(o.id)} onChange={() => toggleSelect(o.id)} />
                  </td>
                  <td className="px-6 py-4 font-mono font-medium text-slate-800">
                    <div className="text-xs">{o.offer_id}</div>
                    <div className="text-xs text-indigo-600 font-semibold">{o.internship_id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{o.name}</div>
                    <div className="text-xs text-slate-400">{o.email}</div>
                    {o.college && <div className="text-xs text-slate-400">{o.college}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div>{o.program_type}</div>
                    <div className="text-xs text-slate-400">{o.duration}</div>
                  </td>
                  <td className="px-6 py-4">{new Date(o.issue_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    {o.status === 'SENT' ? (
                      <span className="inline-flex items-center text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
                        <CheckCircle className="w-3 h-3 mr-1" /> Sent
                      </span>
                    ) : o.status === 'GENERATED' ? (
                      <span className="inline-flex items-center text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded">
                        <CheckCircle className="w-3 h-3 mr-1" /> Generated
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-medium text-red-700 bg-red-50 px-2 py-1 rounded">
                        <Ban className="w-3 h-3 mr-1" /> Revoked
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-3 items-center">
                      <a href={`https://api-bcgs.brainovision.in/api/public/verify/${o.offer_id}`} target="_blank" className="text-indigo-600 hover:text-indigo-800 font-medium">View</a>
                      {o.status !== 'REVOKED' && (
                        <button onClick={() => handleRevoke(o.id)} className="text-amber-600 hover:text-amber-800 font-medium">Revoke</button>
                      )}
                      <button onClick={() => handleDelete(o.id)} className="text-red-600 hover:text-red-800 font-medium ml-2">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-slate-400">
              {offers.length === 0 ? 'No offer letters generated yet.' : 'No records match your current filters.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
