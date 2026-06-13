"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, FileImage, Settings, Type } from 'lucide-react';
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('react-simple-wysiwyg').then(mod => mod.DefaultEditor), { ssr: false });

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [orientation, setOrientation] = useState('LANDSCAPE');
  const [layoutJson, setLayoutJson] = useState('{\n  "NAME": { "x": 60, "y": 360, "font": "16px Arial", "color": "#000" }\n}');
  const [qrPosition, setQrPosition] = useState('BOTTOM_RIGHT');
  const [background, setBackground] = useState<File | null>(null);
  const [signature, setSignature] = useState<File | null>(null);
  const [seal, setSeal] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [existingBackgroundUrl, setExistingBackgroundUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<'JSON' | 'WORD'>('JSON');
  const [wordContent, setWordContent] = useState('');
  const [wordMargin, setWordMargin] = useState('100px 50px');
  const [detectedTags, setDetectedTags] = useState<string[]>([]);
  const [tagMapping, setTagMapping] = useState<Record<string, string>>({});
  
  const standardTags = [
    'NAME', 'COLLEGE', 'COURSE', 'PROGRAM_TYPE', 'DURATION', 
    'START_DATE', 'END_DATE', 'DATE', 'CERTIFICATE_ID', 'INTERNSHIP_ID', 'ROLE'
  ];

  const sampleCertificate = `{\n  "TO_LABEL": { "x": 60, "y": 320, "default": "<b>TO</b>", "font": "16px Arial", "color": "#000" },\n  "DATE_LABEL": { "x": 600, "y": 320, "default": "<b>Date: {{DATE}}</b>", "font": "16px Arial", "color": "#000" },\n  "NAME": { "x": 60, "y": 360, "font": "16px Arial", "color": "#000" },\n  "COLLEGE": { "x": 60, "y": 380, "font": "16px Arial", "color": "#000" },\n  "CERT_PARAGRAPH": { "x": 60, "y": 440, "width": 700, "lineHeight": "1.8", "font": "14px Arial", "color": "#333", "textAlign": "justify", "default": "This is to certify that <b>{{NAME}}</b> has successfully completed {{PRONOUN_HIS}} <b>{{PROGRAM_TYPE}}</b> program with <b>BrainOvision Solutions Pvt. Ltd.</b> {{PRONOUN_HE_CAP}} has worked on <b>{{COURSE}}</b> and was actively & diligently involved in the projects and tasks assigned to {{PRONOUN_HIM}}. During the span, we found {{PRONOUN_HIM}} punctual and hardworking person. {{PRONOUN_HIS_CAP}} feedback and evolution proved that {{PRONOUN_HE}} is a quick learner.<br><br>Congratulations and Best Wishes." },\n  "ROLE_LABEL": { "x": 60, "y": 580, "default": "ROLE", "font": "14px Arial", "color": "#333" },\n  "ROLE_VAL": { "x": 180, "y": 580, "default": ": <b>{{ROLE}}</b>", "font": "14px Arial", "color": "#333" },\n  "ID_LABEL": { "x": 60, "y": 605, "default": "INTERN ID", "font": "14px Arial", "color": "#333" },\n  "ID_VAL": { "x": 180, "y": 605, "default": ": <b>{{INTERNSHIP_ID}}</b>", "font": "14px Arial", "color": "#333" },\n  "MODE_LABEL": { "x": 60, "y": 630, "default": "MODE", "font": "14px Arial", "color": "#333" },\n  "MODE_VAL": { "x": 180, "y": 630, "default": ": <b>OFFLINE</b>", "font": "14px Arial", "color": "#333" },\n  "START_LABEL": { "x": 60, "y": 655, "default": "START DATE", "font": "14px Arial", "color": "#333" },\n  "START_VAL": { "x": 180, "y": 655, "default": ": <b>{{START_DATE}}</b>", "font": "14px Arial", "color": "#333" },\n  "END_LABEL": { "x": 60, "y": 680, "default": "END DATE", "font": "14px Arial", "color": "#333" },\n  "END_VAL": { "x": 180, "y": 680, "default": ": <b>{{END_DATE}}</b>", "font": "14px Arial", "color": "#333" },\n  "SIGNATURE_YOURS": { "x": 60, "y": 750, "default": "Yours Faithfully,", "font": "14px Arial", "color": "#333" },\n  "SIGNATURE": { "x": 60, "y": 770, "width": 120 },\n  "SEAL": { "x": 80, "y": 760, "width": 100, "opacity": 0.5 },\n  "SIGNATURE_NAME": { "x": 60, "y": 820, "default": "<b>Ganesh Nag Doddi</b><br>Founder & CEO<br>Brainovision Solutions India Pvt Ltd", "font": "14px Arial", "color": "#333", "lineHeight": "1.5" },\n  "QR_CODE": { "x": 350, "y": 800, "width": 100 },\n  "QR_POSITION": "BOTTOM_MIDDLE",\n  "QR_SIZE": 100\n}`;
  const sampleOfferLetter = `{\n  "DATE": { "x": 650, "y": 80, "font": "bold 16px Arial", "color": "#000" },\n  "TO_TEXT": { "x": 80, "y": 80, "font": "16px Arial", "color": "#000", "default": "To" },\n  "NAME": { "x": 80, "y": 100, "font": "16px Arial", "color": "#000" },\n  "COLLEGE": { "x": 80, "y": 120, "font": "16px Arial", "color": "#000" },\n  "HEADER": { "x": 240, "y": 200, "font": "bold 24px Arial", "color": "#000", "default": "INTERNSHIP OFFER LETTER", "textDecoration": "underline" },\n  "OFFER_PARAGRAPHS": { "x": 80, "y": 250, "font": "18px Arial", "color": "#000", "width": 650, "lineHeight": "1.6", "textAlign": "justify" },\n  "START_DATE_LABEL": { "x": 80, "y": 550, "font": "16px Arial", "color": "#000", "default": "START DATE" },\n  "START_DATE": { "x": 220, "y": 550, "font": "bold 16px Arial", "color": "#000" },\n  "ROLE_LABEL": { "x": 80, "y": 580, "font": "16px Arial", "color": "#000", "default": "ROLE" },\n  "ROLE": { "x": 220, "y": 580, "font": "bold 16px Arial", "color": "#000" },\n  "INTERN_ID_LABEL": { "x": 80, "y": 610, "font": "16px Arial", "color": "#000", "default": "INTERN ID" },\n  "INTERNSHIP_ID": { "x": 220, "y": 610, "font": "bold 16px Arial", "color": "#000" },\n  "SIGNATURE": { "x": 80, "y": 700, "width": 120 },\n  "YOURS_FAITHFULLY": { "x": 80, "y": 780, "font": "bold 16px Arial", "color": "#000", "default": "Yours faithfully" },\n  "AUTH_NAME": { "x": 80, "y": 800, "font": "16px Arial", "color": "#000", "default": "Name: Ganesh Nagu D" },\n  "AUTH_DESIG": { "x": 80, "y": 820, "font": "16px Arial", "color": "#000", "default": "Designation: Founder & CEO" },\n  "AUTH_COMP": { "x": 80, "y": 840, "font": "16px Arial", "color": "#000", "default": "Brain O Vision Solutions Ind Pvt Ltd" },\n  "SEAL": { "x": 120, "y": 750, "width": 140, "opacity": 0.8 }\n}`;

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('https://api-bcgs.brainovision.in/api/admin/templates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetDefault = async (id: number, type: 'certificate' | 'offer_letter') => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`https://api-bcgs.brainovision.in/api/admin/templates/${id}/set-default`, { type }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Template set as default for ${type === 'certificate' ? 'Certificates' : 'Offer Letters'}`);
      fetchTemplates();
    } catch (err: any) {
      alert(`Failed to set default template: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`https://api-bcgs.brainovision.in/api/admin/templates/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTemplates();
    } catch (err) {
      alert('Failed to delete template');
    }
  };

  const handleEditClick = (t: any) => {
    setEditingTemplateId(t.id);
    setName(t.name);
    setTemplateId(t.template_id || '');
    setOrientation(t.orientation);
    setExistingBackgroundUrl(t.background_image || null);
    
    let parsed = t.layout_json;
    if (typeof t.layout_json === 'string') {
      try { parsed = JSON.parse(t.layout_json); } catch(e){}
    }

    // Restore QR Position from saved layout
    if (parsed) {
      if (parsed['QR_POSITION']) {
        setQrPosition(parsed['QR_POSITION']);
      } else if (parsed['QR_CODE']) {
        setQrPosition('CUSTOM'); // Has manual QR coordinates
      } else {
        setQrPosition('BOTTOM_RIGHT');
      }
    }
    
    if (parsed && parsed.WORD_TEMPLATE) {
      setMode('WORD');
      setWordContent(parsed.WORD_TEMPLATE.html || '');
      setWordMargin(parsed.WORD_TEMPLATE.margin || '100px 50px');
    } else {
      setMode('JSON');
      setLayoutJson(JSON.stringify(parsed, null, 2));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', name);
    if (templateId) formData.append('template_id', templateId);
    formData.append('orientation', orientation);

    if (mode === 'WORD') {
      if (!name || (!background && !editingTemplateId) || !wordContent) {
        alert("Name, Background (if new), and Word Content are required in Word Mode.");
        return;
      }
      setUploading(true);
      // Replace custom tags with standard tags
      let finalHtml = wordContent;
      for (const tag of detectedTags) {
        const mappedTag = tagMapping[tag];
        if (mappedTag) {
          // Replace all occurrences of {{tag}} with {{MAPPED_TAG}}
          const regex = new RegExp(`{{${tag}}}`, 'g');
          finalHtml = finalHtml.replace(regex, `{{${mappedTag}}}`);
        }
      }
      
      const payloadLayout = {
        WORD_TEMPLATE: {
          html: finalHtml,
          margin: wordMargin
        },
        QR_POSITION: qrPosition !== 'CUSTOM' ? qrPosition : undefined,
        QR_SIZE: qrPosition !== 'CUSTOM' ? 120 : undefined,
        SIGNATURE: { x: 80, y: 700, width: 120 },
        SEAL: { x: 120, y: 750, width: 140, opacity: 0.8 }
      };
      
      formData.append('layout_json', JSON.stringify(payloadLayout));
    } else {
      if (!name || (!background && !editingTemplateId) || !layoutJson) {
        alert("Name, Background (if new), and Layout JSON are required.");
        return;
      }
      setUploading(true);
      let finalLayoutJson = layoutJson;
      try {
        const parsed = JSON.parse(layoutJson);
        if (qrPosition !== 'CUSTOM') {
          parsed["QR_POSITION"] = qrPosition;
          parsed["QR_SIZE"] = 120;
        }
        finalLayoutJson = JSON.stringify(parsed);
      } catch (e) {
        alert("Invalid JSON in Layout. Please fix before uploading.");
        setUploading(false);
        return;
      }
      formData.append('layout_json', finalLayoutJson);
    }

    if (background) formData.append('background', background);
    if (signature) formData.append('signature', signature);
    if (seal) formData.append('seal', seal);

    try {
      const token = localStorage.getItem('token');
      if (editingTemplateId) {
        await axios.put(`https://api-bcgs.brainovision.in/api/admin/templates/${editingTemplateId}`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        alert('Template updated successfully!');
      } else {
        await axios.post('https://api-bcgs.brainovision.in/api/admin/templates', formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        alert('Template created successfully!');
      }
      
      setName('');
      setTemplateId('');
      setLayoutJson('{\n  "NAME": { "x": 60, "y": 360, "font": "16px Arial", "color": "#000" }\n}');
      setBackground(null);
      setOrientation('LANDSCAPE');
      setQrPosition('BOTTOM_RIGHT');
      setWordContent('');
      setDetectedTags([]);
      setTagMapping({});
      setEditingTemplateId(null);
      setExistingBackgroundUrl(null);
      fetchTemplates();
    } catch (err) {
      alert("Failed to save template");
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyzeTags = () => {
    const matches = wordContent.match(/{{(.*?)}}/g);
    if (matches) {
      const uniqueTags = Array.from(new Set(matches.map(m => m.replace(/[{}]/g, ''))));
      setDetectedTags(uniqueTags);
      
      const newMapping: Record<string, string> = { ...tagMapping };
      uniqueTags.forEach(tag => {
        if (!newMapping[tag]) {
          if (standardTags.includes(tag.toUpperCase())) {
            newMapping[tag] = tag.toUpperCase();
          } else {
            newMapping[tag] = '';
          }
        }
      });
      setTagMapping(newMapping);
    } else {
      setDetectedTags([]);
      alert("No {{tags}} found in the text.");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Certificate Templates</h1>
        <p className="text-slate-500 mt-1">Design and manage your certificate templates.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center space-x-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            <span>{editingTemplateId ? 'Edit Template' : 'Create New Template'}</span>
          </h2>
          <div className="flex space-x-2 items-center">
            {editingTemplateId && (
              <button 
                type="button" 
                onClick={() => { 
                setEditingTemplateId(null); 
                setExistingBackgroundUrl(null); 
                setName(''); 
                setTemplateId(''); 
                setBackground(null); 
                setQrPosition('BOTTOM_RIGHT');
              }} 
                className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-md shadow-sm"
              >
                Cancel Edit
              </button>
            )}
            <div className="flex space-x-2 bg-slate-100 p-1 rounded-lg">
            <button 
              type="button"
              onClick={() => setMode('JSON')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition ${mode === 'JSON' ? 'bg-white shadow text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Classic JSON Mode
            </button>
            <button 
              type="button"
              onClick={() => setMode('WORD')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition flex items-center space-x-2 ${mode === 'WORD' ? 'bg-white shadow text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Type className="w-4 h-4" />
              <span>Word Editor Mode</span>
            </button>
          </div>
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Template Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border rounded-lg p-2"
                placeholder="e.g. Summer Bootcamp 2024"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Template ID (Optional)</label>
              <input 
                type="text" 
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full border rounded-lg p-2"
                placeholder="e.g. MOCK_MALE_02"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Orientation</label>
              <select 
                value={orientation}
                onChange={(e) => setOrientation(e.target.value)}
                className="w-full border rounded-lg p-2 bg-white"
              >
                <option value="LANDSCAPE">Landscape</option>
                <option value="PORTRAIT">Portrait</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">QR Code Position</label>
              <select 
                value={qrPosition}
                onChange={(e) => setQrPosition(e.target.value)}
                className="w-full border rounded-lg p-2 bg-white mb-2"
              >
                <option value="BOTTOM_RIGHT">Bottom Right</option>
                <option value="BOTTOM_LEFT">Bottom Left</option>
                <option value="BOTTOM_MIDDLE">Bottom Middle</option>
                <option value="TOP_RIGHT">Top Right</option>
                <option value="TOP_LEFT">Top Left</option>
                <option value="MIDDLE_RIGHT">Middle Right</option>
                <option value="MIDDLE_LEFT">Middle Left</option>
                <option value="CUSTOM">Custom (Define QR_CODE in JSON)</option>
              </select>
              {/* Visual QR position preview */}
              {qrPosition !== 'CUSTOM' && (
                <div className="mt-2">
                  <p className="text-xs text-slate-500 mb-1">Position preview:</p>
                  <div className="relative border border-slate-300 rounded bg-slate-50" style={{ width: 96, height: 64 }}>
                    {/* Grid dots */}
                    {['TOP_LEFT','TOP_RIGHT','BOTTOM_LEFT','BOTTOM_RIGHT','BOTTOM_MIDDLE','MIDDLE_LEFT','MIDDLE_RIGHT'].map(pos => {
                      const styles: Record<string, React.CSSProperties> = {
                        TOP_LEFT:      { top: 4,  left: 4 },
                        TOP_RIGHT:     { top: 4,  right: 4 },
                        BOTTOM_LEFT:   { bottom: 4, left: 4 },
                        BOTTOM_RIGHT:  { bottom: 4, right: 4 },
                        BOTTOM_MIDDLE: { bottom: 4, left: '50%', transform: 'translateX(-50%)' },
                        MIDDLE_LEFT:   { top: '50%', left: 4, transform: 'translateY(-50%)' },
                        MIDDLE_RIGHT:  { top: '50%', right: 4, transform: 'translateY(-50%)' },
                      };
                      const isActive = qrPosition === pos;
                      return (
                        <div
                          key={pos}
                          onClick={() => setQrPosition(pos)}
                          title={pos.replace('_', ' ')}
                          style={{ ...styles[pos], position: 'absolute', width: 14, height: 14, borderRadius: 3, cursor: 'pointer', transition: 'all 0.15s' }}
                          className={isActive ? 'bg-indigo-600 shadow-md' : 'bg-slate-300 hover:bg-indigo-300'}
                        />
                      );
                    })}
                  </div>
                  <p className="text-xs text-indigo-600 mt-1 font-medium">{qrPosition.replace(/_/g,' ')}</p>
                </div>
              )}
              {qrPosition === 'CUSTOM' && (
                <p className="text-xs text-amber-600 mt-1">⚙️ Define <code className="bg-amber-50 px-1 rounded">QR_CODE</code> with x/y/width in the Layout JSON below.</p>
              )}
            </div>
          </div>
          
          {mode === 'JSON' ? (
            <div>
              <div className="flex justify-between items-end mb-1">
                <label className="block text-sm font-medium text-slate-700">Layout JSON (Positions & Styling)</label>
                <div className="space-x-2">
                  <button type="button" onClick={() => setLayoutJson(sampleCertificate)} className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 transition">Sample Certificate</button>
                  <button type="button" onClick={() => setLayoutJson(sampleOfferLetter)} className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition">Sample Offer Letter</button>
                </div>
              </div>
              <textarea
                value={layoutJson}
                onChange={(e) => setLayoutJson(e.target.value)}
                className="w-full border rounded-lg p-2 font-mono text-sm h-48"
                placeholder='{"NAME": { "x": 60, "y": 360, "font": "16px Arial", "color": "#000" }}'
              />
              <p className="text-xs text-slate-500 mt-1">Available fields: NAME, COLLEGE, COURSE, PROGRAM_TYPE, DURATION, START_DATE, END_DATE, DATE, CERTIFICATE_ID, ROLE, PRONOUN_HE, PRONOUN_HIS, PRONOUN_HIM, PRONOUN_HE_CAP, PRONOUN_HIS_CAP, DURATION_PROGRAM, OFFER_PARAGRAPHS</p>
            </div>
          ) : (
            <div className="space-y-4 border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Document Content</label>
                <p className="text-xs text-slate-500 mb-2">Type your letter. Insert dynamic tags using double braces, e.g., <code className="bg-slate-100 px-1 rounded">{`{{CandidateName}}`}</code></p>
                <div className="visual-editor-container bg-slate-200 p-4 md:p-8 rounded-lg overflow-auto flex justify-center mb-12" style={{ maxHeight: '800px' }}>
                  <style>{`
                    .visual-editor .rsw-ce {
                      padding: ${wordMargin || '0px'} !important;
                      min-height: 100%;
                      outline: none;
                    }
                    .visual-editor .rsw-toolbar {
                      border-bottom: 1px solid #ddd;
                      background: white !important;
                      border-top-left-radius: 4px;
                      border-top-right-radius: 4px;
                      position: sticky;
                      top: 0;
                      z-index: 10;
                    }
                    .visual-editor.rsw-editor {
                      background-color: transparent !important;
                      border: none !important;
                      box-shadow: none !important;
                      height: 100%;
                    }
                  `}</style>
                  <div 
                    className="visual-editor-page relative shadow-xl rounded-sm flex flex-col transition-all duration-300"
                    style={{
                      width: orientation === 'PORTRAIT' ? '794px' : '1123px',
                      minHeight: orientation === 'PORTRAIT' ? '1123px' : '794px',
                      backgroundImage: background ? `url(${URL.createObjectURL(background)})` : (existingBackgroundUrl ? `url(${existingBackgroundUrl.startsWith('data:') ? existingBackgroundUrl : `https://api-bcgs.brainovision.in${existingBackgroundUrl}`})` : 'none'),
                      backgroundSize: '100% 100%',
                      backgroundColor: 'white'
                    }}
                  >
                    <Editor 
                      value={wordContent} 
                      onChange={(e: any) => setWordContent(e.target.value)} 
                      className="visual-editor flex-1"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Page Margins</label>
                <input 
                  type="text" 
                  value={wordMargin}
                  onChange={(e) => setWordMargin(e.target.value)}
                  className="w-full md:w-1/2 border rounded-lg p-2"
                  placeholder="e.g. 100px 50px 50px 50px"
                />
                <p className="text-xs text-slate-500 mt-1">CSS margin (Top Right Bottom Left) so your text stays inside the background border.</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-slate-800">Tag Mapping</h3>
                  <button 
                    type="button" 
                    onClick={handleAnalyzeTags}
                    className="px-4 py-2 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-200 transition"
                  >
                    Analyze & Find Tags
                  </button>
                </div>
                
                {detectedTags.length > 0 ? (
                  <div className="space-y-3">
                    {detectedTags.map(tag => (
                      <div key={tag} className="flex items-center space-x-4">
                        <div className="w-1/3 font-mono text-sm bg-white border p-2 rounded-md">{`{{${tag}}}`}</div>
                        <div className="text-slate-400">{'->'}</div>
                        <select 
                          value={tagMapping[tag] || ''}
                          onChange={(e) => setTagMapping({ ...tagMapping, [tag]: e.target.value })}
                          className="w-2/3 border rounded-md p-2 bg-white text-sm"
                        >
                          <option value="">-- Select Platform Field --</option>
                          {standardTags.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">Click "Analyze & Find Tags" to detect custom tags in your document.</p>
                )}
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center space-x-2">
              <FileImage className="w-4 h-4 text-slate-500" />
              <span>Upload Images</span>
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Background Image (Required)</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FileImage className="w-8 h-8 mb-3 text-slate-400" />
                      <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-slate-500">{background ? background.name : 'PNG, JPG (A4 Size)'}</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => setBackground(e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Signature Image (Optional)</label>
                  <input type="file" className="block w-full text-sm text-slate-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100
                    border border-slate-300 rounded-md p-1" 
                    accept="image/*" 
                    onChange={(e) => setSignature(e.target.files?.[0] || null)} />
                  <p className="text-xs text-slate-500 mt-1">Leave empty if no signature is needed, or if it's in the background.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Seal/Stamp Image (Optional)</label>
                  <input type="file" className="block w-full text-sm text-slate-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100
                    border border-slate-300 rounded-md p-1" 
                    accept="image/*" 
                    onChange={(e) => setSeal(e.target.files?.[0] || null)} />
                  <p className="text-xs text-slate-500 mt-1">Leave empty if no seal is needed.</p>
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={uploading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>{uploading ? (editingTemplateId ? 'Updating...' : 'Creating...') : (editingTemplateId ? 'Update Template' : 'Upload Template')}</span>
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center space-x-2">
            <FileImage className="w-5 h-5 text-indigo-600" />
            <span>Existing Templates</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Preview</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Orientation</th>
                <th className="px-6 py-3">Default For</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t: any) => (
                <tr key={t.id} className="border-b">
                  <td className="px-6 py-4 font-mono">{t.template_id}</td>
                  <td className="px-6 py-4">
                    {t.background_image ? (
                      <img src={t.background_image.startsWith('data:') ? t.background_image : `https://api-bcgs.brainovision.in${t.background_image}`} alt={t.name} className="h-12 w-auto object-contain border border-slate-200" />
                    ) : (
                      <span className="text-slate-400 text-xs">No image</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">{t.name}</td>
                  <td className="px-6 py-4">{t.orientation}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-1">
                      {t.is_default_certificate && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded inline-block w-fit">Certificate</span>}
                      {t.is_default_offer_letter && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded inline-block w-fit">Offer Letter</span>}
                      {!t.is_default_certificate && !t.is_default_offer_letter && <span className="text-slate-400 text-xs">-</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col space-y-2 items-end">
                      {!t.is_default_certificate && (
                        <button onClick={() => handleSetDefault(t.id, 'certificate')} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100 border border-green-200">
                          Set Default Cert
                        </button>
                      )}
                      {!t.is_default_offer_letter && (
                        <button onClick={() => handleSetDefault(t.id, 'offer_letter')} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200">
                          Set Default Offer
                        </button>
                      )}
                      <div className="flex space-x-2 pt-2">
                        <button onClick={() => handleEditClick(t)} className="text-xs px-2 py-1 bg-slate-50 text-slate-700 rounded hover:bg-slate-100 border border-slate-200">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 border border-red-200">
                          Delete
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
