import { useState, useEffect } from 'react';
import mediVisionLogo from '../assets/MediVision-Logo.jpeg';
import { getPatients, getStats, updatePatient } from '../services/api';
import { Users, Activity, Clock, TrendingUp, AlertCircle, LayoutDashboard, BarChart2, User, LogOut, Search, Eye, ChevronUp, ChevronDown, Moon, Sun } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function computeAge(dob) {
  if (!dob) return '—';
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getTriageColor(category) {
  const colors = {
    1: 'bg-red-100 text-red-800 border-red-300',
    2: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    3: 'bg-green-100 text-green-800 border-green-300'
  };
  return colors[category] || 'bg-gray-100 text-gray-800 border-gray-300';
}

function getTriageLabel(category) {
  const labels = { 1: 'Cat 1 (Red)', 2: 'Cat 2 (Yellow)', 3: 'Cat 3 (Green)' };
  return labels[category] || 'Not triaged';
}

function getStatusColor(status) {
  const colors = {
    'Registered': 'bg-purple-100 text-purple-800',
    'Vitals Taken': 'bg-indigo-100 text-indigo-800',
    'Triaged': 'bg-orange-100 text-orange-800',
    'In Treatment': 'bg-blue-100 text-blue-800',
    'Discharged': 'bg-green-100 text-green-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function PatientTable({ patients, onStatusUpdate }) {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const filtered = patients.filter(p =>
    (p.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (p.patientId?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (p.icNumber?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const toggleExpand = (id) => setExpandedId(prev => (prev === id ? null : id));

  return (
    <div className="bg-white rounded-2xl shadow overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-800">All Patients</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {filtered.length} record{filtered.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search name, ID or IC…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 w-56"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth: '900px' }}>
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">IC / Passport</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Age</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Triage</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Diagnosis</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Disposition</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Arrival</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Update</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">View</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((patient, i) => {
              const isExpanded = expandedId === patient._id;
              return (
                <>
                  <tr
                    key={patient._id}
                    className={`border-b border-gray-100 hover:bg-blue-50/40 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {getInitials(patient.name)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 leading-tight">{patient.name}</p>
                          <p className="text-xs text-gray-400">{patient.patientId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{patient.icNumber || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{computeAge(patient.dateOfBirth)}</td>
                    <td className="px-4 py-3">
                      {patient.triageCategory ? (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getTriageColor(patient.triageCategory)}`}>
                          {getTriageLabel(patient.triageCategory)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{patient.assignedLocation || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate" title={patient.treatment?.provisionalDiagnosis || ''}>
                      {patient.treatment?.provisionalDiagnosis || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{patient.treatment?.disposition || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(patient.status)}`}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(patient.arrivalTime).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={patient.status}
                        onChange={(e) => onStatusUpdate(patient._id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer"
                      >
                        <option value="Registered">Registered</option>
                        <option value="Vitals Taken">Vitals Taken</option>
                        <option value="Triaged">Triaged</option>
                        <option value="In Treatment">In Treatment</option>
                        <option value="Discharged">Discharged</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleExpand(patient._id)}
                        title="View patient details"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          isExpanded
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                        }`}
                      >
                        <Eye size={13} />
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </td>
                  </tr>

                  {/* ── Expanded detail panel ── */}
                  {isExpanded && (
                    <tr key={`${patient._id}-detail`} className="bg-blue-50/30">
                      <td colSpan={11} className="px-4 py-4">
                        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 overflow-x-auto">
                          <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <Eye size={15} className="text-blue-500" />
                            Patient Details — {patient.name}
                          </h3>

                          {/* Section: Demographics */}
                          <div className="mb-5">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Demographics</p>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">Full Name</p>
                                <p className="text-sm font-medium text-gray-800">{patient.name || '—'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">IC / Passport</p>
                                <p className="text-sm font-medium text-gray-800">{patient.icNumber || '—'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">Age</p>
                                <p className="text-sm font-medium text-gray-800">{computeAge(patient.dateOfBirth)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">Contact Number</p>
                                <p className="text-sm font-medium text-gray-800">{patient.contactNumber || '—'}</p>
                              </div>
                            </div>
                          </div>

                          <hr className="border-gray-100 mb-5" />

                          {/* Section: Presentation */}
                          <div className="mb-5">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Presentation</p>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">Chief Complaint</p>
                                <p className="text-sm font-medium text-gray-800">{patient.chiefComplaint || '—'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">Arrival Time</p>
                                <p className="text-sm font-medium text-gray-800">{new Date(patient.arrivalTime).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">Location</p>
                                <p className="text-sm font-medium text-gray-800">{patient.assignedLocation || '—'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">Triage Category</p>
                                {patient.triageCategory ? (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getTriageColor(patient.triageCategory)}`}>
                                    {getTriageLabel(patient.triageCategory)}
                                  </span>
                                ) : (
                                  <p className="text-sm font-medium text-gray-400">Not triaged</p>
                                )}
                              </div>
                            </div>
                          </div>

                          <hr className="border-gray-100 mb-5" />

                          {/* Section: Vitals */}
                          <div className="mb-5">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Vitals</p>
                            <div className="grid grid-cols-3 gap-3">
                              {[
                                { label: 'SpO₂',         value: patient.vitalSigns?.spO2 != null ? `${patient.vitalSigns.spO2}%` : '—' },
                                { label: 'Heart Rate',   value: patient.vitalSigns?.heartRate != null ? `${patient.vitalSigns.heartRate} bpm` : '—' },
                                { label: 'Blood Pressure', value: (patient.vitalSigns?.systolicBP != null && patient.vitalSigns?.diastolicBP != null) ? `${patient.vitalSigns.systolicBP}/${patient.vitalSigns.diastolicBP} mmHg` : '—' },
                                { label: 'Temperature',  value: patient.vitalSigns?.temperature != null ? `${patient.vitalSigns.temperature}°C` : '—' },
                                { label: 'Resp. Rate',   value: patient.vitalSigns?.respiratoryRate != null ? `${patient.vitalSigns.respiratoryRate} /min` : '—' },
                                { label: 'GCS',          value: patient.vitalSigns?.gcs != null ? patient.vitalSigns.gcs : '—' },
                              ].map(v => (
                                <div key={v.label} className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
                                  <p className="text-xs text-gray-400 mb-1">{v.label}</p>
                                  <p className="text-sm font-bold text-gray-800">{v.value}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <hr className="border-gray-100 mb-5" />

                          {/* Section: Treatment */}
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Treatment</p>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">Provisional Diagnosis</p>
                                <p className="text-sm font-medium text-gray-800">{patient.treatment?.provisionalDiagnosis || '—'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">Clinical Notes</p>
                                <p className="text-sm font-medium text-gray-800">{patient.treatment?.clinicalNotes || '—'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">Treatment Given</p>
                                <p className="text-sm font-medium text-gray-800">{patient.treatment?.treatmentGiven || '—'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">Disposition</p>
                                <p className="text-sm font-medium text-gray-800">{patient.treatment?.disposition || '—'}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-xs text-gray-400 mb-0.5">Reason for Disposition</p>
                                <p className="text-sm font-medium text-gray-800">{patient.treatment?.dispositionReason || '—'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Users size={26} />
            </div>
            <p className="font-medium text-gray-500">
              {search ? 'No patients match your search' : 'No patients registered yet'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-2 text-sm text-blue-500 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('medivision-dark') === 'true');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem('medivision-dark', darkMode);
  }, [darkMode]);

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

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'dark-mode bg-gray-900' : 'bg-gray-50'}`}>
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

  const TRIAGE_COLORS = { 1: '#ef4444', 2: '#eab308', 3: '#22c55e' };

  const triageData = stats?.triageStats
    ?.slice()
    .sort((a, b) => a._id - b._id)
    .map(item => ({
      name: getTriageLabel(item._id),
      value: item.count,
      color: TRIAGE_COLORS[item._id] || '#9ca3af',
    })) || [];

  const navItems = [
    { key: 'overview',   label: 'Overview',   icon: <LayoutDashboard size={20} /> },
    { key: 'patients',   label: 'Patients',   icon: <Users size={20} /> },
    { key: 'analytics',  label: 'Analytics',  icon: <BarChart2 size={20} /> },
  ];

  return (
    <div className={`min-h-screen flex ${darkMode ? 'dark-mode bg-gray-900' : 'bg-[#f0f4f8]'}`}>

      {/* â”€â”€ Sidebar â”€â”€ */}
      <aside className="w-32 flex-shrink-0 flex flex-col items-center py-6 gap-3 min-h-screen" style={{ backgroundColor: '#1C3D6E' }}>
        {/* Logo */}
        <div className="flex flex-col items-center mb-5">
          <img
            src={mediVisionLogo}
            alt="MediVision Logo"
            className="w-20 h-20 rounded-2xl object-cover shadow"
          />
        </div>

        {/* Nav items */}
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            className={`flex flex-col items-center gap-1 px-3 py-3 rounded-full w-28 text-white transition-all duration-150 ${
              activeTab === item.key
                ? 'bg-white/25 font-semibold shadow-inner'
                : 'hover:bg-white/10'
            }`}
          >
            {item.icon}
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </aside>

      {/* â”€â”€ Main area â”€â”€ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* â”€â”€ Top Navbar â”€â”€ */}
        <header className="flex items-center justify-between px-6 py-3 shadow-md" style={{ backgroundColor: '#1C3D6E' }}>
          {/* Page title */}
          <h1 className="text-white font-semibold text-base tracking-wide">Hospital Flow Dashboard</h1>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(prev => !prev)}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="flex items-center justify-center bg-white/15 hover:bg-white/25 rounded-full w-9 h-9 text-white transition"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="flex items-center gap-2 bg-white/15 rounded-full px-4 py-2 text-white text-sm select-none">
              <User size={15} />
              <span>Admin</span>
            </div>
            <button
              onClick={() => { localStorage.clear(); window.location.href = '/'; }}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 rounded-full px-4 py-2 text-white text-sm transition"
            >
              <LogOut size={15} />
              <span>Log Out</span>
            </button>
          </div>
        </header>

        {/* â”€â”€ Tab content â”€â”€ */}
        <main className="flex-1 p-6 overflow-auto">

          {/* â”€â”€ OVERVIEW â”€â”€ */}
          {activeTab === 'overview' && (
            <>
              {/* Stats cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
                <div className="bg-white rounded-2xl shadow p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Patients</p>
                      <p className="text-3xl font-bold text-gray-800">{stats?.totalPatients || 0}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-2">
                      <Users className="text-blue-600" size={36} />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Registered</p>
                      <p className="text-3xl font-bold text-yellow-600">{stats?.registered || 0}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-2">
                      <Clock className="text-yellow-500" size={36} />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">In Treatment</p>
                      <p className="text-3xl font-bold text-blue-600">{stats?.inTreatment || 0}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-2">
                      <Activity className="text-blue-600" size={36} />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Discharged</p>
                      <p className="text-3xl font-bold text-green-600">{stats?.discharged || 0}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-2">
                      <TrendingUp className="text-green-600" size={36} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="bg-white rounded-2xl shadow p-5">
                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Avg Triage Time</p>
                  <p className="text-3xl font-bold text-purple-700">{formatMetricDuration(stats?.averageTriageTime)}</p>
                  <p className="text-xs text-gray-400 mt-1">Check-in to Triage complete</p>
                </div>
                <div className="bg-white rounded-2xl shadow p-5">
                  <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">Avg Wait Time</p>
                  <p className="text-3xl font-bold text-orange-600">{formatMetricDuration(stats?.averageWaitingTime)}</p>
                  <p className="text-xs text-gray-400 mt-1">Triage complete to Doctor</p>
                </div>
                <div className="bg-white rounded-2xl shadow p-5">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Avg Consultation</p>
                  <p className="text-3xl font-bold text-blue-700">{formatMetricDuration(stats?.averageConsultationTime)}</p>
                  <p className="text-xs text-gray-400 mt-1">Doctor start to end</p>
                </div>
                <div className="bg-white rounded-2xl shadow p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">ED Congestion</p>
                      <p className="text-3xl font-bold text-red-600">{stats?.edCongestion ?? 0}</p>
                      <p className="text-xs text-gray-400 mt-1">Patients not discharged</p>
                    </div>
                    <AlertCircle className="text-red-300" size={34} />
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="bg-white rounded-2xl shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Triage Distribution</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={triageData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                        {triageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-2xl shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Patient Status Overview</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { name: 'Registered',   count: stats?.registered   || 0 },
                      { name: 'Triaged',      count: stats?.triaged      || 0 },
                      { name: 'In Treatment', count: stats?.inTreatment  || 0 },
                      { name: 'Discharged',   count: stats?.discharged   || 0 },
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

              {/* Patients Table */}
              <div className="mt-6">
                <PatientTable patients={patients} onStatusUpdate={handleStatusUpdate} />
              </div>
            </>
          )}

          {/* \u2500\u2500 PATIENTS \u2500\u2500 */}
          {activeTab === 'patients' && (
            <PatientTable patients={patients} onStatusUpdate={handleStatusUpdate} />
          )}

          {/* ── ANALYTICS ── */}
          {activeTab === 'analytics' && (
            <>
              {/* Stats cards — row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-5">
                <div className="bg-white rounded-2xl shadow p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Patients</p>
                      <p className="text-3xl font-bold text-gray-800">{stats?.totalPatients || 0}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-2"><Users className="text-blue-600" size={36} /></div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Registered</p>
                      <p className="text-3xl font-bold text-yellow-600">{stats?.registered || 0}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-2"><Clock className="text-yellow-500" size={36} /></div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">In Treatment</p>
                      <p className="text-3xl font-bold text-blue-600">{stats?.inTreatment || 0}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-2"><Activity className="text-blue-600" size={36} /></div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Discharged</p>
                      <p className="text-3xl font-bold text-green-600">{stats?.discharged || 0}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-2"><TrendingUp className="text-green-600" size={36} /></div>
                  </div>
                </div>
              </div>

              {/* Performance metrics — row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
                <div className="bg-white rounded-2xl shadow p-5">
                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Avg Triage Time</p>
                  <p className="text-3xl font-bold text-purple-700">{formatMetricDuration(stats?.averageTriageTime)}</p>
                  <p className="text-xs text-gray-400 mt-1">Check-in to Triage complete</p>
                </div>
                <div className="bg-white rounded-2xl shadow p-5">
                  <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">Avg Wait Time</p>
                  <p className="text-3xl font-bold text-orange-600">{formatMetricDuration(stats?.averageWaitingTime)}</p>
                  <p className="text-xs text-gray-400 mt-1">Triage complete to Doctor</p>
                </div>
                <div className="bg-white rounded-2xl shadow p-5">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Avg Consultation</p>
                  <p className="text-3xl font-bold text-blue-700">{formatMetricDuration(stats?.averageConsultationTime)}</p>
                  <p className="text-xs text-gray-400 mt-1">Doctor start to end</p>
                </div>
                <div className="bg-white rounded-2xl shadow p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">ED Congestion</p>
                      <p className="text-3xl font-bold text-red-600">{stats?.edCongestion ?? 0}</p>
                      <p className="text-xs text-gray-400 mt-1">Patients not discharged</p>
                    </div>
                    <AlertCircle className="text-red-300" size={34} />
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Triage Distribution</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={triageData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                        {triageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-2xl shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Patient Status Overview</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { name: 'Registered',   count: stats?.registered   || 0 },
                      { name: 'Triaged',      count: stats?.triaged      || 0 },
                      { name: 'In Treatment', count: stats?.inTreatment  || 0 },
                      { name: 'Discharged',   count: stats?.discharged   || 0 },
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
            </>
          )}

        </main>
      </div>
    </div>
  );
}