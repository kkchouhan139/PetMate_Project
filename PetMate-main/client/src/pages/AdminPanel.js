import React, { useState, useEffect } from 'react';
import { Users, Heart, Flag, BarChart3, Shield, CheckCircle, XCircle, Search, Crown, Trash2, Ban, Edit } from 'lucide-react';
import API from '../utils/api';
import toast from 'react-hot-toast';

const AdminPanel = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPets: 0,
    totalMatches: 0,
    pendingReports: 0,
    pendingApprovals: 0
  });
  const [activeTab, setActiveTab] = useState('approvals');
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allPets, setAllPets] = useState([]);
  const [reports, setReports] = useState([]);
  const [activity, setActivity] = useState({ recentUsers: [], recentPets: [], recentReports: [], recentMatches: [] });
  const [jobs, setJobs] = useState([]);
  const [jobForm, setJobForm] = useState({ title: '', department: '', location: '', type: '', description: '', requirements: '' });
  const [searchUser, setSearchUser] = useState('');
  const [searchPet, setSearchPet] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [editingPet, setEditingPet] = useState(null);
  const [premiumForm, setPremiumForm] = useState({ userId: null, days: 30 });

  useEffect(() => {
    fetchAdminStats();
    fetchPendingUsers();
    fetchReports();
    fetchActivity();
    fetchJobs();
    if (activeTab === 'users') fetchAllUsers();
    if (activeTab === 'pets') fetchAllPets();
  }, [activeTab, filterStatus, filterRole, searchUser, searchPet]);

  const fetchAdminStats = async () => {
    try {
      const response = await API.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to fetch admin stats');
    }
  };

  const fetchPendingUsers = async () => {
    try {
      const response = await API.get('/admin/users?status=pending');
      setPendingUsers(response.data.users || []);
    } catch (error) {
      toast.error('Failed to fetch pending users');
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await API.get(`/admin/users?status=${filterStatus}&search=${searchUser}&role=${filterRole}&limit=50`);
      setAllUsers(response.data.users || []);
    } catch (error) {
      toast.error('Failed to fetch users');
    }
  };

  const fetchAllPets = async () => {
    try {
      const response = await API.get(`/admin/pets?search=${searchPet}&limit=50`);
      setAllPets(response.data.pets || []);
    } catch (error) {
      toast.error('Failed to fetch pets');
    }
  };

  const fetchReports = async () => {
    try {
      const response = await API.get('/admin/reports');
      setReports(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch reports');
    }
  };

  const fetchActivity = async () => {
    try {
      const response = await API.get('/admin/activity');
      setActivity(response.data);
    } catch (error) {
      toast.error('Failed to fetch activity');
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await API.get('/admin/jobs');
      setJobs(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch jobs');
    }
  };

  const createJob = async () => {
    try {
      await API.post('/admin/jobs', {
        ...jobForm,
        requirements: jobForm.requirements
      });
      toast.success('Job posted');
      setJobForm({ title: '', department: '', location: '', type: '', description: '', requirements: '' });
      fetchJobs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post job');
    }
  };

  const updateJobStatus = async (jobId, status) => {
    try {
      await API.put(`/admin/jobs/${jobId}`, { status });
      fetchJobs();
    } catch (error) {
      toast.error('Failed to update job');
    }
  };

  const deleteJob = async (jobId) => {
    try {
      await API.delete(`/admin/jobs/${jobId}`);
      fetchJobs();
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };

  const approveUser = async (userId) => {
    try {
      await API.put(`/admin/users/${userId}/approve`);
      toast.success('User approved');
      fetchAdminStats();
      fetchPendingUsers();
      fetchActivity();
    } catch (error) {
      toast.error('Failed to approve user');
    }
  };

  const rejectUser = async (userId) => {
    try {
      await API.put(`/admin/users/${userId}/reject`, { reason: 'Not approved' });
      toast.success('User rejected');
      fetchAdminStats();
      fetchPendingUsers();
      fetchActivity();
    } catch (error) {
      toast.error('Failed to reject user');
    }
  };

  const banUser = async (userId, banned) => {
    try {
      await API.put(`/admin/users/${userId}/ban`, { banned });
      toast.success(banned ? 'User banned' : 'User unbanned');
      fetchAllUsers();
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await API.delete(`/admin/users/${userId}`);
      toast.success('User deleted');
      fetchAllUsers();
      fetchAdminStats();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const grantPremium = async (userId, isPremium) => {
    try {
      await API.put(`/admin/users/${userId}/premium`, { isPremium, days: premiumForm.days });
      toast.success(isPremium ? 'Premium granted' : 'Premium revoked');
      fetchAllUsers();
      setPremiumForm({ userId: null, days: 30 });
    } catch (error) {
      toast.error('Failed to update premium');
    }
  };

  const deletePet = async (petId) => {
    if (!window.confirm('Are you sure you want to delete this pet?')) return;
    try {
      await API.delete(`/admin/pets/${petId}`);
      toast.success('Pet deleted');
      fetchAllPets();
      fetchAdminStats();
    } catch (error) {
      toast.error('Failed to delete pet');
    }
  };

  const updatePet = async (petId, data) => {
    try {
      await API.put(`/admin/pets/${petId}`, data);
      toast.success('Pet updated');
      setEditingPet(null);
      fetchAllPets();
    } catch (error) {
      toast.error('Failed to update pet');
    }
  };

  const updateReport = async (reportId, status, action = null, notes = '') => {
    try {
      await API.put(`/admin/reports/${reportId}`, { status, action, adminNotes: notes });
      toast.success('Report updated');
      fetchReports();
      fetchAdminStats();
    } catch (error) {
      toast.error('Failed to update report');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="w-11/12 max-w-6xl mx-auto px-0 sm:px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600">Manage PetMate platform</p>
        </div>
      </div>

      <div className="w-11/12 max-w-6xl mx-auto px-0 sm:px-4 py-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Total Users</p>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Total Pets</p>
                <p className="text-3xl font-bold">{stats.totalPets}</p>
              </div>
              <Heart className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Total Matches</p>
                <p className="text-3xl font-bold">{stats.totalMatches}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Pending Reports</p>
                <p className="text-3xl font-bold text-red-600">{stats.pendingReports}</p>
              </div>
              <Flag className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          {['approvals', 'users', 'pets', 'reports', 'jobs', 'activity'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === tab ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {tab === 'approvals' && `Pending Approvals (${stats.pendingApprovals})`}
              {tab === 'users' && 'All Users'}
              {tab === 'pets' && 'All Pets'}
              {tab === 'reports' && `Reports (${stats.pendingReports})`}
              {tab === 'jobs' && 'Jobs'}
              {tab === 'activity' && 'Recent Activity'}
            </button>
          ))}
        </div>

        {activeTab === 'approvals' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <Shield className="w-6 h-6 text-blue-500 mr-2" />
              <h3 className="text-lg font-semibold">Pending User Approvals</h3>
            </div>
            {pendingUsers.length === 0 ? (
              <p className="text-gray-500">No pending approvals.</p>
            ) : (
              <div className="space-y-3">
                {pendingUsers.map((user) => (
                  <div key={user._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border rounded-lg p-3">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveUser(user._id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg flex items-center space-x-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => rejectUser(user._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg flex items-center space-x-1"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">All Users</h3>
              <div className="flex gap-2">
                <select className="input-field" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="banned">Banned</option>
                </select>
                <select className="input-field" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                  <option value="all">All Roles</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    className="input-field pl-10"
                    placeholder="Search..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {allUsers.map((user) => (
                <div key={user._id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{user.name} {user.isPremium && <Crown className="inline w-4 h-4 text-yellow-500" />}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400">Role: {user.role} | Status: {user.isApproved ? 'Approved' : 'Pending'} {user.isBanned && '| Banned'}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => banUser(user._id, !user.isBanned)} className="btn-secondary text-xs">
                        <Ban className="w-3 h-3 inline" /> {user.isBanned ? 'Unban' : 'Ban'}
                      </button>
                      <button onClick={() => grantPremium(user._id, !user.isPremium)} className="btn-secondary text-xs">
                        <Crown className="w-3 h-3 inline" /> {user.isPremium ? 'Revoke' : 'Grant'}
                      </button>
                      <button onClick={() => deleteUser(user._id)} className="bg-red-500 text-white px-2 py-1 rounded text-xs">
                        <Trash2 className="w-3 h-3 inline" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'pets' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">All Pets</h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    className="input-field pl-10"
                    placeholder="Search pets..."
                    value={searchPet}
                    onChange={(e) => setSearchPet(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {allPets.map((pet) => (
                <div key={pet._id} className="border rounded-lg p-3">
                  {editingPet === pet._id ? (
                    <div className="space-y-2">
                      <input className="input-field" defaultValue={pet.name} id={`name-${pet._id}`} placeholder="Name" />
                      <input className="input-field" defaultValue={pet.breed} id={`breed-${pet._id}`} placeholder="Breed" />
                      <div className="flex gap-2">
                        <button onClick={() => updatePet(pet._id, { name: document.getElementById(`name-${pet._id}`).value, breed: document.getElementById(`breed-${pet._id}`).value })} className="btn-primary text-xs">Save</button>
                        <button onClick={() => setEditingPet(null)} className="btn-secondary text-xs">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{pet.name}</p>
                        <p className="text-sm text-gray-500">{pet.species} - {pet.breed}</p>
                        <p className="text-xs text-gray-400">Owner: {pet.owner?.name || 'Unknown'}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingPet(pet._id)} className="btn-secondary text-xs">
                          <Edit className="w-3 h-3 inline" /> Edit
                        </button>
                        <button onClick={() => deletePet(pet._id)} className="bg-red-500 text-white px-2 py-1 rounded text-xs">
                          <Trash2 className="w-3 h-3 inline" /> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <Flag className="w-6 h-6 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold">Reports</h3>
            </div>
            {reports.length === 0 ? (
              <p className="text-gray-500">No reports.</p>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div key={report._id} className="border rounded-lg p-3">
                    <p className="font-medium capitalize">{report.reason.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-600">{report.description}</p>
                    <p className="text-xs text-gray-500 mt-1">Reporter: {report.reporter?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">Status: <span className={report.status === 'pending' ? 'text-yellow-600' : 'text-green-600'}>{report.status}</span></p>
                    {report.adminNotes && <p className="text-xs text-gray-600 mt-1">Admin Notes: {report.adminNotes}</p>}
                    {report.status === 'pending' && (
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => updateReport(report._id, 'resolved', null, 'Reviewed and resolved')} className="bg-green-500 text-white px-3 py-1 rounded text-xs">
                          Resolve
                        </button>
                        <button onClick={() => updateReport(report._id, 'resolved', 'ban_user', 'User banned')} className="bg-orange-500 text-white px-3 py-1 rounded text-xs">
                          Ban User
                        </button>
                        <button onClick={() => updateReport(report._id, 'resolved', 'delete_pet', 'Pet deleted')} className="bg-red-500 text-white px-3 py-1 rounded text-xs">
                          Delete Pet
                        </button>
                        <button onClick={() => updateReport(report._id, 'dismissed', null, 'No action needed')} className="bg-gray-500 text-white px-3 py-1 rounded text-xs">
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="bg-white p-6 rounded-lg shadow space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Post a Job</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <input className="input-field" placeholder="Title" value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} />
                <input className="input-field" placeholder="Department" value={jobForm.department} onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })} />
                <input className="input-field" placeholder="Location" value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} />
                <input className="input-field" placeholder="Type (Full-time/Part-time)" value={jobForm.type} onChange={(e) => setJobForm({ ...jobForm, type: e.target.value })} />
              </div>
              <textarea className="input-field mt-4" rows="4" placeholder="Description" value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}></textarea>
              <input className="input-field mt-4" placeholder="Requirements (comma separated)" value={jobForm.requirements} onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })} />
              <button onClick={createJob} className="btn-primary mt-4">Post Job</button>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">All Jobs</h3>
              {jobs.length === 0 ? (
                <p className="text-gray-500">No jobs posted yet.</p>
              ) : (
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <div key={job._id} className="border rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{job.title}</p>
                        <p className="text-sm text-gray-600">{job.department || 'General'} • {job.location || 'Remote'} • {job.type || 'Any'}</p>
                        <p className="text-xs text-gray-500">Status: {job.status}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn-secondary" onClick={() => updateJobStatus(job._id, job.status === 'open' ? 'closed' : 'open')}>
                          {job.status === 'open' ? 'Close' : 'Reopen'}
                        </button>
                        <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg" onClick={() => deleteJob(job._id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-3">New Users</h3>
              {activity.recentUsers?.length ? (
                <ul className="space-y-2 text-sm">
                  {activity.recentUsers.map((u) => (
                    <li key={u._id} className="flex justify-between">
                      <span>{u.name}</span>
                      <span className="text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-gray-500">No recent users.</p>}
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-3">New Pets</h3>
              {activity.recentPets?.length ? (
                <ul className="space-y-2 text-sm">
                  {activity.recentPets.map((p) => (
                    <li key={p._id} className="flex justify-between">
                      <span>{p.name}</span>
                      <span className="text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-gray-500">No recent pets.</p>}
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-3">Recent Reports</h3>
              {activity.recentReports?.length ? (
                <ul className="space-y-2 text-sm">
                  {activity.recentReports.map((r) => (
                    <li key={r._id} className="flex justify-between">
                      <span className="capitalize">{r.reason.replace('_', ' ')}</span>
                      <span className="text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-gray-500">No recent reports.</p>}
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-3">Recent Matches</h3>
              {activity.recentMatches?.length ? (
                <ul className="space-y-2 text-sm">
                  {activity.recentMatches.map((m) => (
                    <li key={m._id} className="flex justify-between">
                      <span className="capitalize">{m.status}</span>
                      <span className="text-gray-500">{new Date(m.createdAt).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-gray-500">No recent matches.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
