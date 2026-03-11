import { useState, useEffect } from 'react';
import { getPatients, getStats, updatePatient } from '../services/api';
import { Users, Activity, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#ef4444', '#eab308', '#22c55e'];

export default function AdminDashboard() {
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [patientsRes, statsRes] = await Promise.all([
        getPatients(),
        getStats()
      ]);
      setPatients(patientsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (patientId, newStatus) => {
    try {
      await updatePatient(patientId, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getTriageColor = (category) => {
    const colors = {
      1: 'bg-red-100 text-red-800 border-red-300',
      2: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      3: 'bg-green-100 text-green-800 border-green-300'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getTriageLabel = (category) => {
    const labels = { 1: 'Cat 1 (Red)', 2: 'Cat 2 (Yellow)', 3: 'Cat 3 (Green)' };
    return labels[category] || 'Not triaged';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Registered': 'bg-purple-100 text-purple-800',
      'Vitals Taken': 'bg-indigo-100 text-indigo-800',
      'Triaged': 'bg-orange-100 text-orange-800',
      'In Treatment': 'bg-blue-100 text-blue-800',
      'Discharged': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const formatMetricDuration = (minutes) => {
    if (minutes == null) return '—';
    const mins = Math.round(minutes);
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const triageData = stats?.triageStats?.map(item => ({
    name: getTriageLabel(item._id),
    value: item.count
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="text-blue-600" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">MediVision Hospital Management</p>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/';
              }}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Patients</p>
                <p className="text-3xl font-bold text-gray-800">{stats?.totalPatients || 0}</p>
              </div>
              <Users className="text-blue-600" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Registered</p>
                <p className="text-3xl font-bold text-yellow-600">{stats?.registered || 0}</p>
              </div>
              <Clock className="text-yellow-600" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">In Treatment</p>
                <p className="text-3xl font-bold text-blue-600">{stats?.inTreatment || 0}</p>
              </div>
              <Activity className="text-blue-600" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Discharged</p>
                <p className="text-3xl font-bold text-green-600">{stats?.discharged || 0}</p>
              </div>
              <TrendingUp className="text-green-600" size={40} />
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Avg Triage Time</p>
            <p className="text-3xl font-bold text-purple-700">{formatMetricDuration(stats?.averageTriageTime)}</p>
            <p className="text-xs text-gray-400 mt-1">Check-in → Triage complete</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">Avg Wait Time</p>
            <p className="text-3xl font-bold text-orange-600">{formatMetricDuration(stats?.averageWaitingTime)}</p>
            <p className="text-xs text-gray-400 mt-1">Triage complete → Doctor</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Avg Consultation</p>
            <p className="text-3xl font-bold text-blue-700">{formatMetricDuration(stats?.averageConsultationTime)}</p>
            <p className="text-xs text-gray-400 mt-1">Doctor start → end</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">ED Congestion</p>
                <p className="text-3xl font-bold text-red-600">{stats?.edCongestion ?? 0}</p>
                <p className="text-xs text-gray-400 mt-1">Patients not discharged</p>
              </div>
              <AlertCircle className="text-red-300" size={36} />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Triage Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={triageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {triageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Patient Status Overview</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'Registered', count: stats?.registered || 0 },
                { name: 'Triaged', count: stats?.triaged || 0 },
                { name: 'In Treatment', count: stats?.inTreatment || 0 },
                { name: 'Discharged', count: stats?.discharged || 0 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Patient List */}
        <div className="bg-white rounded-xl shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">All Patients</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IC Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Triage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diagnosis</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disposition</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Arrival Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {patients.map((patient) => (
                  <tr key={patient._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{patient.patientId}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{patient.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{patient.icNumber || '—'}</td>
                    <td className="px-6 py-4">
                      {patient.triageCategory ? (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTriageColor(patient.triageCategory)}`}>
                          {getTriageLabel(patient.triageCategory)}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {patient.assignedLocation || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {patient.treatment?.provisionalDiagnosis || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {patient.treatment?.disposition || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(patient.status)}`}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(patient.arrivalTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={patient.status}
                        onChange={(e) => handleStatusUpdate(patient._id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="Registered">Registered</option>
                        <option value="Vitals Taken">Vitals Taken</option>
                        <option value="Triaged">Triaged</option>
                        <option value="In Treatment">In Treatment</option>
                        <option value="Discharged">Discharged</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {patients.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">No patients registered yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
