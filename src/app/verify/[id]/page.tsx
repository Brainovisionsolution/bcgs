"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { CheckCircle, XCircle, AlertTriangle, FileText, User, Calendar, BookOpen, Download } from 'lucide-react';

export default function VerifyPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/public/verify/${id}`);
        setData(res.data);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchVerification();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md bg-white p-8 rounded-2xl shadow-lg text-center border border-slate-200">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid Document</h1>
          <p className="text-slate-500 mb-6">The document ID you entered does not exist in our records or has been deleted.</p>
          <a href="/" className="inline-block px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition">Go Back</a>
        </div>
      </div>
    );
  }

  const isValid = data.status !== 'REVOKED';

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex flex-col items-center">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* Header Status */}
        <div className={`p-6 md:p-8 text-center text-white ${isValid ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {isValid ? <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-100" /> : <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-100" />}
          <h1 className="text-3xl font-bold mb-2">
            {isValid ? `${data.document_type === 'OFFER_LETTER' ? 'Offer Letter' : 'Certificate'} is Valid` : `${data.document_type === 'OFFER_LETTER' ? 'Offer Letter' : 'Certificate'} has been Revoked`}
          </h1>
          <p className="text-white/80 font-medium tracking-wide">ID: {data.document_id}</p>
        </div>

        {/* Certificate Details */}
        <div className="p-6 md:p-10">
          <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-2">Candidate Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="flex items-start space-x-3">
              <User className="w-5 h-5 text-indigo-600 mt-1" />
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Name</p>
                <p className="text-lg font-medium text-slate-900">{data.name}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <BookOpen className="w-5 h-5 text-indigo-600 mt-1" />
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Program</p>
                <p className="text-lg font-medium text-slate-900">{data.program}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-indigo-600 mt-1" />
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Start Date</p>
                <p className="text-lg font-medium text-slate-900">{data.start_date}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-indigo-600 mt-1" />
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">End Date</p>
                <p className="text-lg font-medium text-slate-900">{data.end_date}</p>
              </div>
            </div>
          </div>
          
          {isValid && (
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href={`http://localhost:5000${data.pdf_url}`} 
                target="_blank"
                download
                className="flex-1 flex items-center justify-center space-x-2 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
              >
                <Download className="w-5 h-5" />
                <span>Download PDF</span>
              </a>
              <a 
                href="/"
                className="flex-1 flex items-center justify-center py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition"
              >
                Verify Another
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
