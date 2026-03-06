import { useState, useEffect } from 'react';
import { getPatients, getStats, updatePatient } from '../services/api';
import { Users, Activity, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const COLORS = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#3b82f6'];

const normalizeStatus = (status) => {
  if (status === 'In Treatment' || status === 'Discharged') return status;
  return 'Waiting';
};

const alertStyles = {
  error: { bg: 'bg-red-50', border: 'border-l-4 border-red-500', icon: 'text-red-500', iconBg: 'bg-red-100' },
  warning: { bg: 'bg-yellow-50', border: 'border-l-4 border-yellow-400', icon: 'text-yellow-500', iconBg: 'bg-yellow-100' },
  info: { bg: 'bg-blue-50', border: 'border-l-4 border-blue-400', icon: 'text-blue-500', iconBg: 'bg-blue-100' },
};

const formatWaitTime = (minutes) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''}`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks !== 1 ? 's' : ''}`;
};

const generateAlerts = (patients) => {
  const alerts = [];
  patients.forEach((patient) => {
    const arrivalTime = new Date(patient.arrivalTime);
    const now = new Date();
    const minutesWaiting = Math.floor((now - arrivalTime) / 60000);

    const ns = normalizeStatus(patient.status);
    if ((patient.triageCategory === 1 || patient.triageCategory === 2) && ns === 'Waiting') {
      alerts.push({
        id: `triage-${patient._id}`,
        message: `${patient.name} (${patient.patientId}) - Cat ${patient.triageCategory} patient still waiting`,
        time: `Waiting for ${formatWaitTime(minutesWaiting)}`,
        type: 'error',
      });
    }
    if (minutesWaiting > 30 && ns === 'Waiting') {
      alerts.push({
        id: `wait-${patient._id}`,
        message: `${patient.name} (${patient.patientId}) - Waiting for ${formatWaitTime(minutesWaiting)}`,
        time: `Arrived ${formatWaitTime(minutesWaiting)} ago`,
        type: 'warning',
      });
    }
    if (ns === 'In Treatment') {
      alerts.push({
        id: `treatment-${patient._id}`,
        message: `${patient.name} (${patient.patientId}) - Currently in treatment`,
        time: `Arrived: ${arrivalTime.toLocaleTimeString()}`,
        type: 'info',
      });
    }
    if (ns === 'Discharged') {
      alerts.push({
        id: `discharge-${patient._id}`,
        message: `${patient.name} (${patient.patientId}) - Discharged`,
        time: `Arrived: ${arrivalTime.toLocaleTimeString()}`,
        type: 'info',
      });
    }
  });

  const order = { error: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => order[a.type] - order[b.type]).slice(0, 6);
};

const generateHourlyData = (patients) => {
  const slots = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
  const slotMap = {};
  slots.forEach((s) => (slotMap[s] = { time: s, arrivals: 0, discharges: 0 }));

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  patients.forEach((patient) => {
    const arrivalTime = new Date(patient.arrivalTime);
    if (arrivalTime < cutoff) return; // only last 24 hours

    const ns = normalizeStatus(patient.status);

    const hour = arrivalTime.getHours();
    let slot;
    if (hour < 4) slot = '00:00';
    else if (hour < 8) slot = '04:00';
    else if (hour < 12) slot = '08:00';
    else if (hour < 16) slot = '12:00';
    else if (hour < 20) slot = '16:00';
    else slot = '20:00';

    if (ns === 'Waiting' || ns === 'In Treatment') slotMap[slot].arrivals += 1;
    if (ns === 'Discharged') slotMap[slot].discharges += 1;
  });

  return slots.map((s) => slotMap[s]);
};

const generateBedOccupancy = (patients) => {
  const departments = {
    ER: { occupied: 0, total: 25 },
    ICU: { occupied: 0, total: 20 },
    Surgery: { occupied: 0, total: 15 },
    General: { occupied: 0, total: 60 },
  };

  patients.forEach((patient) => {
    if (normalizeStatus(patient.status) === 'Discharged') return;
    if (patient.triageCategory === 1) departments.ICU.occupied += 1;
    else if (patient.triageCategory === 2 || patient.triageCategory === 3) departments.ER.occupied += 1;
    else departments.General.occupied += 1;
  });

  return Object.entries(departments).map(([department, data]) => ({
    department,
    occupied: Math.min(data.occupied, data.total),
    total: data.total,
  }));
};

export default function AdminDashboard() {
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updateError, setUpdateError] = useState(null);
  const [searchName, setSearchName] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [patientsRes, statsRes] = await Promise.all([getPatients(), getStats()]);
      setPatients(patientsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (patientId, newStatus) => {
    setUpdateError(null);
    // Optimistic update: reflect change in UI immediately
    setPatients(prev =>
      prev.map(p => p._id === patientId ? { ...p, status: newStatus } : p)
    );
    try {
      await updatePatient(patientId, { status: newStatus });
      fetchData(); // sync stats/triage from server
    } catch (error) {
      console.error('Error updating status:', error);
      setUpdateError('Failed to update patient status. Please try again.');
      fetchData(); // revert on failure
    }
  };

  const getTriageColor = (category) => {
    const colors = {
      1: 'bg-red-100 text-red-800 border-red-300',
      2: 'bg-orange-100 text-orange-800 border-orange-300',
      3: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      4: 'bg-green-100 text-green-800 border-green-300',
      5: 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return colors[category] || colors[3];
  };

  const getStatusColor = (status) => {
    const colors = {
      'Waiting': 'bg-yellow-100 text-yellow-800',
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

  const triageData = stats?.triageStats?.map(item => ({
    name: `Cat ${item._id}`,
    value: item.count
  })) || [];

  const statusData = [
    { name: 'Waiting', count: patients.filter(p => normalizeStatus(p.status) === 'Waiting').length },
    { name: 'In Treatment', count: patients.filter(p => normalizeStatus(p.status) === 'In Treatment').length },
    { name: 'Discharged', count: patients.filter(p => normalizeStatus(p.status) === 'Discharged').length },
  ];

  const activeAlerts = generateAlerts(patients);
  const hourlyPatientData = generateHourlyData(patients);
  const bedOccupancyData = generateBedOccupancy(patients);

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
              onClick={() => { localStorage.removeItem('token'); window.location.href = '/'; }}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Update Error Banner */}
        {updateError && (
          <div className="mb-6 flex items-center justify-between gap-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-500 shrink-0" size={20} />
              <p className="text-sm font-medium text-red-700">{updateError}</p>
            </div>
            <button onClick={() => setUpdateError(null)} className="text-red-400 hover:text-red-600 text-lg font-bold leading-none">&times;</button>
          </div>
        )}
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Patients', value: patients.length, color: 'text-gray-800', icon: <Users className="text-blue-600" size={40} /> },
            { label: 'Waiting', value: patients.filter(p => normalizeStatus(p.status) === 'Waiting').length, color: 'text-yellow-600', icon: <Clock className="text-yellow-600" size={40} /> },
            { label: 'In Treatment', value: patients.filter(p => normalizeStatus(p.status) === 'In Treatment').length, color: 'text-blue-600', icon: <Activity className="text-blue-600" size={40} /> },
            { label: 'Discharged', value: patients.filter(p => normalizeStatus(p.status) === 'Discharged').length, color: 'text-green-600', icon: <TrendingUp className="text-green-600" size={40} /> },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{card.label}</p>
                  <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                </div>
                {card.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Triage Distribution */}
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
                  dataKey="value"
                >
                  {triageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Patient Status Overview */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Patient Status Overview</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`${value} patients`, 'Count']} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  <Cell fill="#eab308" />
                  <Cell fill="#3b82f6" />
                  <Cell fill="#22c55e" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Hourly Patient Flow */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Hourly Patient Flow</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyPatientData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="arrivals" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="discharges" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bed Occupancy */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Bed Occupancy By Department</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bedOccupancyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="occupied" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total" fill="#d1d5db" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Active Alerts
            {activeAlerts.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full font-medium">
                {activeAlerts.length}
              </span>
            )}
          </h2>
          <div className="space-y-3">
            {activeAlerts.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <AlertCircle className="mx-auto mb-2" size={32} />
                <p className="text-sm">No active alerts at this time</p>
              </div>
            ) : (
              activeAlerts.map((alert) => {
                const style = alertStyles[alert.type];
                return (
                  <div key={alert.id} className={`flex items-center gap-4 p-4 rounded-lg ${style.bg} ${style.border}`}>
                    <div className={`p-2 rounded-full ${style.iconBg}`}>
                      <AlertCircle className={style.icon} size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{alert.message}</p>
                      <p className="text-xs text-gray-500">{alert.time}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Patient List */}
        <div className="bg-white rounded-xl shadow">
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-gray-800">All Patients</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Search by name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="All">All Statuses</option>
                <option value="Waiting">Waiting</option>
                <option value="In Treatment">In Treatment</option>
                <option value="Discharged">Discharged</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Patient ID', 'Name', 'Age', 'Triage', 'Status', 'Arrival Time', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {patients
                  .filter(p =>
                    p.name.toLowerCase().includes(searchName.toLowerCase()) &&
                    (filterStatus === 'All' || normalizeStatus(p.status) === filterStatus)
                  )
                  .map((patient) => (
                  <tr key={patient._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{patient.patientId}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{patient.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{patient.age}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTriageColor(patient.triageCategory)}`}>
                        Cat {patient.triageCategory}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(normalizeStatus(patient.status))}`}>
                        {normalizeStatus(patient.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(patient.arrivalTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={normalizeStatus(patient.status)}
                        onChange={(e) => handleStatusUpdate(patient._id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="Waiting">Waiting</option>
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
            {patients.length > 0 && patients.filter(p =>
              p.name.toLowerCase().includes(searchName.toLowerCase()) &&
              (filterStatus === 'All' || normalizeStatus(p.status) === filterStatus)
            ).length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">No patients match the current filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 