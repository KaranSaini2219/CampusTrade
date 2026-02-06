import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Admin() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [blockLogs, setBlockLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tab === 'users') {
      api.get('/admin/users').then((res) => setUsers(res.data)).catch(() => {});
    } else if (tab === 'reports') {
      api.get('/admin/reports').then((res) => setReports(res.data)).catch(() => {});
    } else if (tab === 'block-logs') {
      api.get('/admin/block-logs').then((res) => setBlockLogs(res.data)).catch(() => {});
    }
    setLoading(false);
  }, [tab]);

  const handleBan = async (userId, ban) => {
    try {
      await api.put(`/admin/users/${userId}/ban`, { ban });
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, isBanned: ban } : u)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleRemoveListing = async (listingId) => {
    if (!confirm('Remove this listing?')) return;
    try {
      await api.delete(`/admin/listings/${listingId}`);
      alert('Listing removed.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleReportStatus = async (reportId, status) => {
    try {
      await api.put(`/admin/reports/${reportId}`, { status });
      setReports((prev) => prev.map((r) => (r._id === reportId ? { ...r, status } : r)));
    } catch (err) {}
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Admin Panel</h1>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('users')}
          className={`px-4 py-2 rounded-lg font-medium ${
            tab === 'users' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-700'
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setTab('reports')}
          className={`px-4 py-2 rounded-lg font-medium ${
            tab === 'reports' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-700'
          }`}
        >
          Reports
        </button>
        <button
          onClick={() => setTab('block-logs')}
          className={`px-4 py-2 rounded-lg font-medium ${
            tab === 'block-logs' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-700'
          }`}
        >
          Block Logs
        </button>
      </div>

      {tab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-t border-slate-100">
                      <td className="px-4 py-3">{u.name}</td>
                      <td className="px-4 py-3">{u.email}</td>
                      <td className="px-4 py-3">{u.role}</td>
                      <td className="px-4 py-3">
                        {u.isBanned ? (
                          <span className="text-red-600 font-medium">Banned</span>
                        ) : (
                          <span className="text-green-600">Active</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleBan(u._id, !u.isBanned)}
                            className={`px-3 py-1 rounded text-sm ${
                              u.isBanned ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {u.isBanned ? 'Unban' : 'Ban'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'reports' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {reports.length === 0 ? (
            <p className="p-8 text-slate-500">No reports.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {reports.map((r) => (
                <div key={r._id} className="p-4">
                  <p className="font-medium text-slate-800">{r.listingId?.title}</p>
                  <p className="text-sm text-slate-500">
                    By {r.reporterId?.name} · {r.reason} · {r.status}
                  </p>
                  {r.comment && <p className="text-sm text-slate-600 mt-1">{r.comment}</p>}
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleReportStatus(r._id, 'reviewed')}
                      className="text-sm px-2 py-1 bg-slate-100 rounded"
                    >
                      Reviewed
                    </button>
                    <button
                      onClick={() => handleReportStatus(r._id, 'resolved')}
                      className="text-sm px-2 py-1 bg-green-100 text-green-700 rounded"
                    >
                      Resolved
                    </button>
                    <button
                      onClick={() => handleRemoveListing(r.listingId?._id)}
                      className="text-sm px-2 py-1 bg-red-100 text-red-700 rounded"
                    >
                      Remove Listing
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'block-logs' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {blockLogs.length === 0 ? (
            <p className="p-8 text-slate-500">No block logs.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {blockLogs.map((log) => (
                <div key={log._id} className="p-4">
                  <p className="font-medium text-slate-800">{log.userId?.name}</p>
                  <p className="text-sm text-slate-500">{log.userId?.email}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    Title: {log.listingDraft?.title}
                  </p>
                  <p className="text-sm text-red-600">Matched: {log.matchedKeywords?.join(', ')}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
