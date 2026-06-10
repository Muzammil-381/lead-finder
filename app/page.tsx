'use client';
import { useState } from 'react';
import { Search, Download, RefreshCw, Radio, Globe, Layers, ListFilter } from 'lucide-react';

export default function Home() {
  const [query, setQuery] = useState('business');
  const [totalPages, setTotalPages] = useState(2);
  const [activeDays, setActiveDays] = useState(90);
  const [minEpisodes, setMinEpisodes] = useState(10);
  const [includeRecent, setIncludeRecent] = useState(true);
  
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLeads = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/fetch-podcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, totalPages, activeDays, minEpisodes, includeRecent }),
      });
      const data = await response.json();
      if (data.success) {
        setLeads(data.leads);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Failed to connect to the server API');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!leads.length) return;
    const headers = Object.keys(leads[0]);
    const escape = v => {
      const s = String(v ?? "").replace(/"/g, '""');
      return /[,"\n\r]/.test(s) ? `"${s}"` : s;
    };
    
    const rows = [
      headers.join(","),
      ...leads.map(l => headers.map(h => escape(l[h])).join(","))
    ];

    const blob = new Blob([rows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `podcast_leads_${query || 'recent'}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
              🎙️ Podcast Lead Finder Pro
            </h1>
            <p className="text-slate-400 mt-1 text-sm">Discover podcast platforms, hosts, and RSS feeds for your marketing outreach.</p>
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

        {/* Configuration Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Controls */}
          <form onSubmit={fetchLeads} className="lg:col-span-1 bg-slate-800/50 p-6 rounded-2xl border border-slate-800 space-y-5 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 mb-2">
              <ListFilter size={18} className="text-indigo-400" /> Lead Filters
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Keyword Search</label>
              <input 
                type="text" 
                value={query} 
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" 
                placeholder="e.g. startup, tech, crypto"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">API Pages</label>
                <input 
                  type="number" 
                  value={totalPages} 
                  onChange={(e) => setTotalPages(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Min Episodes</label>
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

            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="recent" 
                checked={includeRecent} 
                onChange={(e) => setIncludeRecent(e.target.checked)}
                className="w-4 h-4 accent-indigo-500 rounded"
              />
              <label htmlFor="recent" className="text-sm font-medium text-slate-300 cursor-pointer select-none">Include Global Recent Feeds</label>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 transition py-3 rounded-xl font-medium text-sm shadow-md shadow-indigo-900/30"
            >
              {loading ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />}
              {loading ? 'Scanning Indices...' : 'Find Qualified Leads'}
            </button>
          </form>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Quick Stats */}
            {leads.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-800/30 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400 font-medium">Total Deduplicated</p>
                  <p className="text-2xl font-bold text-indigo-400 mt-1">{leads.length}</p>
                </div>
                <div className="bg-slate-800/30 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400 font-medium">With RSS Url</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{leads.filter(l => l.rss_url).length}</p>
                </div>
                <div className="bg-slate-800/30 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400 font-medium">With Websites</p>
                  <p className="text-2xl font-bold text-amber-400 mt-1">{leads.filter(l => l.website).length}</p>
                </div>
                <div className="bg-slate-800/30 border border-slate-800 p-4 rounded-xl">
                  <p className="text-xs text-slate-400 font-medium">Apple Podcasts Sync</p>
                  <p className="text-2xl font-bold text-purple-400 mt-1">{leads.filter(l => l.itunes_id).length}</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-rose-900/20 border border-rose-800 text-rose-300 px-4 py-3 rounded-xl text-sm">
                ❌ <strong>Error:</strong> {error}
              </div>
            )}

            {/* Leads Table Card */}
            <div className="bg-slate-800/40 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
              {!leads.length && !loading ? (
                <div className="flex flex-col items-center justify-center p-20 text-center space-y-3">
                  <Radio size={48} className="text-slate-600 animate-pulse" />
                  <p className="text-slate-400 text-sm max-w-sm">No data fetched yet. Configure your search filters and click find to build your dashboard.</p>
                </div>
              ) : loading ? (
                <div className="flex flex-col items-center justify-center p-24 text-center space-y-4">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-400 text-sm">Querying Podcast Index servers, deduplicating pages and checking criteria...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900/60 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="px-5 py-3.5">Podcast Info</th>
                        <th className="px-5 py-3.5">Publisher / Owner</th>
                        <th className="px-5 py-3.5 text-center">Episodes</th>
                        <th className="px-5 py-3.5">Last Active</th>
                        <th className="px-5 py-3.5 text-right">Links</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-sm">
                      {leads.map((lead, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-5 py-4 max-w-xs">
                            <p className="font-semibold text-slate-100 line-clamp-1">{lead.name}</p>
                            <p className="text-xs text-indigo-400 line-clamp-1 mt-0.5 flex items-center gap-1">
                              <Layers size={12} /> {lead.categories || 'No Category'}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            <p className="line-clamp-1">{lead.author || lead.owner_name || 'N/A'}</p>
                          </td>
                          <td className="px-5 py-4 text-center font-mono text-slate-400">
                            {lead.episodes}
                          </td>
                          <td className="px-5 py-4 text-slate-400 text-xs font-medium">
                            {lead.last_active}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-3 text-slate-400">
                              {lead.website && (
                                <a href={lead.website} target="_blank" rel="noreferrer" title="Website" className="hover:text-indigo-400 transition">
                                  <Globe size={16} />
                                </a>
                              )}
                              {lead.rss_url && (
                                <a href={lead.rss_url} target="_blank" rel="noreferrer" title="RSS Feed" className="hover:text-emerald-400 transition">
                                  <Radio size={16} />
                                </a>
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