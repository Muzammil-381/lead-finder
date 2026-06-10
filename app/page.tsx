'use client';
import { useState } from 'react';
import { Search, Download, RefreshCw, Radio, Globe, Layers, ListFilter, Copy, Check } from 'lucide-react';

export default function Home() {
  const [bulkKeywords, setBulkKeywords] = useState("business\nstartup\nmarketing");
  const [totalPages, setTotalPages] = useState(1);
  const [activeDays, setActiveDays] = useState(90);
  const [minEpisodes, setMinEpisodes] = useState(10);
  const [includeRecent, setIncludeRecent] = useState(false);
  
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedText, setCopiedText] = useState("");

  const fetchLeads = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const queriesArray = bulkKeywords
      .split(/[\n,]+/)
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (queriesArray.length === 0) {
      setError("Please paste or type at least one keyword.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/fetch-podcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries: queriesArray, totalPages, activeDays, minEpisodes, includeRecent }),
      });
      const data = await response.json();
      if (data.success) {
        setLeads(data.leads || []);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Failed to connect to the server API');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, type) => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedText(`${type} copied!`);
      setTimeout(() => setCopiedText(""), 2000);
    }
  };

  const downloadCSV = () => {
    if (!leads.length) return;
    const headers = Object.keys(leads[0]);
    const escape = (v) => {
      const s = String(v ?? "").replace(/"/g, '""');
      return /[,"\n\r]/.test(s) ? `"${s}"` : s;
    };
    
    const rows = [
      headers.join(","),
      ...leads.map((l) => headers.map(h => escape(l[h])).join(","))
    ];

    const blob = new Blob([rows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bulk_podcast_leads_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 font-sans" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {copiedText && (
          <div className="fixed top-5 right-5 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 z-50 text-sm font-semibold border border-emerald-500">
            <Check size={16} />
            {copiedText}
          </div>
        )}

        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
              🎙️ Bulk Lead Finder Pro
            </h1>
            <p className="text-slate-400 mt-1 text-sm">Paste lists of domains or niches to clean and extract production-ready podcast RSS streams.</p>
          </div>
          {leads.length > 0 && (
            <button 
              onClick={downloadCSV}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 transition px-5 py-2.5 rounded-lg text-sm font-semibold shadow-lg shadow-emerald-900/20"
            >
              <Download size={18} /> Download Master CSV ({leads.length})
            </button>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          <form onSubmit={fetchLeads} className="lg:col-span-1 bg-slate-800/50 p-6 rounded-2xl border border-slate-800 space-y-5 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 mb-2">
              <ListFilter size={18} className="text-indigo-400" /> Bulk Inputs
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Paste Keywords (Line by Line)
              </label>
              <textarea 
                rows={6}
                value={bulkKeywords}
                onChange={(e) => setBulkKeywords(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 resize-none" 
                placeholder="crypto&#10;fitness"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Detected: {bulkKeywords.split(/[\n,]+/).filter(k => k.trim()).length} unique target lines.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Pages/Key</label>
                <input 
                  type="number" 
                  value={totalPages} 
                  onChange={(e) => setTotalPages(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Min Ep.</label>
                <input 
                  type="number" 
                  value={minEpisodes} 
                  onChange={(e) => setMinEpisodes(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Active Recency (Days)</label>
              <input 
                type="number" 
                value={activeDays} 
                onChange={(e) => setActiveDays(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" 
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input 
                type="checkbox" 
                id="recent" 
                checked={includeRecent} 
                onChange={(e) => setIncludeRecent(e.target.checked)}
                className="w-4 h-4 accent-indigo-500 rounded"
              />
              <label htmlFor="recent" className="text-sm font-medium text-slate-300 cursor-pointer select-none">Include Recent Stream</label>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 transition py-3 rounded-xl font-medium text-sm shadow-md"
            >
              {loading ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />}
              {loading ? 'Processing List...' : 'Scan All Keywords'}
            </button>
          </form>

          <div className="lg:col-span-3 space-y-6">
            {leads.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-800/30 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400 font-medium">Total Clean Leads</p>
                  <p className="text-2xl font-bold text-indigo-400 mt-1">{leads.length}</p>
                </div>
                <div className="bg-slate-800/30 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400 font-medium">With Live RSS</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{leads.filter((l) => l.rss_url).length}</p>
                </div>
                <div className="bg-slate-800/30 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400 font-medium">Websites Bound</p>
                  <p className="text-2xl font-bold text-amber-400 mt-1">{leads.filter((l) => l.website).length}</p>
                </div>
                <div className="bg-slate-800/30 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400 font-medium">Apple Index Verified</p>
                  <p className="text-2xl font-bold text-purple-400 mt-1">{leads.filter((l) => l.itunes_id).length}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-rose-900/20 border border-rose-800 text-rose-300 px-4 py-3 rounded-xl text-sm">
                ❌ <strong>Error:</strong> {error}
              </div>
            )}

            <div className="bg-slate-800/40 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
              {!leads.length && !loading ? (
                <div className="flex flex-col items-center justify-center p-20 text-center space-y-3">
                  <Radio size={48} className="text-slate-600 animate-pulse" />
                  <p className="text-slate-400 text-sm max-w-sm">System idling. Paste your target keywords on the left window block to initiate automated indexing.</p>
                </div>
              ) : loading ? (
                <div className="flex flex-col items-center justify-center p-24 text-center space-y-4">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-400 text-sm">Running query loops across lists, executing filter validations...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900/60 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="px-5 py-3.5">Podcast Info</th>
                        <th className="px-5 py-3.5">Publisher</th>
                        <th className="px-5 py-3.5 text-center">Episodes</th>
                        <th className="px-5 py-3.5">Last Active</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-sm">
                      {leads.map((lead, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-5 py-4 max-w-xs">
                            <p className="font-semibold text-slate-100 line-clamp-1">{lead.name}</p>
                            <p className="text-xs text-indigo-400 line-clamp-1 mt-0.5 flex items-center gap-1">
                              <Layers size={12} /> {lead.categories || 'General'}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            <p className="line-clamp-1">{lead.author || lead.owner_name || 'N/A'}</p>
                          </td>
                          <td className="px-5 py-4 text-center font-mono text-slate-400">{lead.episodes}</td>
                          <td className="px-5 py-4 text-slate-400 text-xs">{lead.last_active}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2 text-slate-400">
                              
                              {lead.website && (
                                <div className="flex items-center bg-slate-900/50 rounded-md border border-slate-700/60 p-0.5">
                                  <button type="button" onClick={() => handleCopy(lead.website, "Website Link")} className="p-1.5 hover:text-indigo-400 transition hover:bg-slate-800 rounded" title="Copy Website">
                                    <Copy size={13} />
                                  </button>
                                  <a href={lead.website} target="_blank" rel="noreferrer" className="p-1.5 hover:text-indigo-400 transition hover:bg-slate-800 rounded border-l border-slate-800" title="Open Website">
                                    <Globe size={13} />
                                  </a>
                                </div>
                              )}

                              {lead.rss_url && (
                                <div className="flex items-center bg-slate-900/50 rounded-md border border-slate-700/60 p-0.5">
                                  <button type="button" onClick={() => handleCopy(lead.rss_url, "RSS Stream")} className="p-1.5 hover:text-emerald-400 transition hover:bg-slate-800 rounded" title="Copy RSS Feed">
                                    <Copy size={13} />
                                  </button>
                                  <a href={lead.rss_url} target="_blank" rel="noreferrer" className="p-1.5 hover:text-emerald-400 transition hover:bg-slate-800 rounded border-l border-slate-800" title="Open RSS Feed">
                                    <Radio size={13} />
                                  </a>
                                </div>
                              )}

                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}