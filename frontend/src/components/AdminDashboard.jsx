import { useState, useEffect } from 'react';
import mediVisionLogo from '../assets/MediVision-Logo.jpeg';
import { getPatients, getStats, updatePatient } from '../services/api';
import { Users, Activity, Clock, TrendingUp, AlertCircle, LayoutDashboard, BarChart2, User, LogOut, Search, Eye, ChevronUp, ChevronDown, Moon, Sun } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

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

function getStatusColor(status, disposition) {
  if (status === 'Discharged') {
    if (disposition === 'Admit')    return 'bg-blue-100 text-blue-800';
    if (disposition === 'Referral') return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  }
  const colors = {
    'Registered':  'bg-purple-100 text-purple-800',
    'Vitals Taken':'bg-indigo-100 text-indigo-800',
    'Triaged':     'bg-orange-100 text-orange-800',
    'In Treatment':'bg-blue-100 text-blue-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

function getStatusLabel(status, disposition) {
  if (status === 'Discharged') {
    if (disposition === 'Admit')    return 'Admitted';
    if (disposition === 'Referral') return 'Referred';
    return 'Discharged';
  }
  return status;
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

const STATUS_ORDER = { 'Registered': 1, 'Vitals Taken': 2, 'Triaged': 3, 'In Treatment': 4, 'Discharged': 5 };

function PatientTable({ patients, onStatusUpdate }) {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [sortField, setSortField] = useState('arrivalTime');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filtered = patients.filter(p =>
    (p.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (p.patientId?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (p.icNumber?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    let aVal, bVal;
    switch (sortField) {
      case 'name':       aVal = a.name?.toLowerCase() || ''; bVal = b.name?.toLowerCase() || ''; break;
      case 'icNumber':   aVal = a.icNumber?.toLowerCase() || ''; bVal = b.icNumber?.toLowerCase() || ''; break;
      case 'age':        aVal = a.dateOfBirth ? new Date(a.dateOfBirth).getTime() : 0; bVal = b.dateOfBirth ? new Date(b.dateOfBirth).getTime() : 0; break;
      case 'triage':     aVal = a.triageCategory ?? 99; bVal = b.triageCategory ?? 99; break;
      case 'location':   aVal = a.assignedLocation?.toLowerCase() || ''; bVal = b.assignedLocation?.toLowerCase() || ''; break;
      case 'diagnosis':  aVal = a.treatment?.provisionalDiagnosis?.toLowerCase() || ''; bVal = b.treatment?.provisionalDiagnosis?.toLowerCase() || ''; break;
      case 'disposition':aVal = a.treatment?.disposition?.toLowerCase() || ''; bVal = b.treatment?.disposition?.toLowerCase() || ''; break;
      case 'status':     aVal = STATUS_ORDER[a.status] ?? 99; bVal = STATUS_ORDER[b.status] ?? 99; break;
      case 'arrivalTime':aVal = new Date(a.arrivalTime).getTime(); bVal = new Date(b.arrivalTime).getTime(); break;
      default:           aVal = 0; bVal = 0;
    }
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="ml-1 opacity-30">↕</span>;
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="inline ml-1 text-blue-500" />
      : <ChevronDown size={12} className="inline ml-1 text-blue-500" />;
  };

  const thClass = "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-blue-600 hover:bg-blue-50/60 transition-colors";
  const thNoSort = "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider";

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
              <th className={thClass} onClick={() => handleSort('name')}>Patient<SortIcon field="name" /></th>
              <th className={thClass} onClick={() => handleSort('icNumber')}>IC / Passport<SortIcon field="icNumber" /></th>
              <th className={thClass} onClick={() => handleSort('age')}>Age<SortIcon field="age" /></th>
              <th className={thClass} onClick={() => handleSort('triage')}>Triage<SortIcon field="triage" /></th>
              <th className={thClass} onClick={() => handleSort('location')}>Location<SortIcon field="location" /></th>
              <th className={thClass} onClick={() => handleSort('diagnosis')}>Diagnosis<SortIcon field="diagnosis" /></th>
              <th className={thClass} onClick={() => handleSort('disposition')}>Disposition<SortIcon field="disposition" /></th>
              <th className={thClass} onClick={() => handleSort('status')}>Status<SortIcon field="status" /></th>
              <th className={thClass} onClick={() => handleSort('arrivalTime')}>Arrival<SortIcon field="arrivalTime" /></th>
              <th className={thNoSort}>Update</th>
              <th className={thNoSort}>View</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((patient, i) => {
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
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(patient.status, patient.treatment?.disposition)}`}>
                        {getStatusLabel(patient.status, patient.treatment?.disposition)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(patient.arrivalTime).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={
                          patient.status === 'Discharged'
                            ? patient.treatment?.disposition === 'Admit' ? 'Admitted'
                            : patient.treatment?.disposition === 'Referral' ? 'Referred'
                            : 'Discharged'
                            : patient.status
                        }
                        onChange={(e) => onStatusUpdate(patient._id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer"
                      >
                        <option value="Registered">Registered</option>
                        <option value="Vitals Taken">Vitals Taken</option>
                        <option value="Triaged">Triaged</option>
                        <option value="In Treatment">In Treatment</option>
                        <option value="Discharged">Discharged</option>
                        <option value="Admitted">Admitted</option>
                        <option value="Referred">Referred</option>
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
  const [hourlyFlowDate, setHourlyFlowDate] = useState('today');
  const [statusOverviewDate, setStatusOverviewDate] = useState('today');

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

  const handleStatusUpdate = async (patientId, rawValue) => {
    try {
      let updateData;
      if (rawValue === 'Admitted') {
        const p = patients.find(x => x._id === patientId);
        updateData = { status: 'Discharged', treatment: { ...(p?.treatment || {}), disposition: 'Admit' } };
      } else if (rawValue === 'Referred') {
        const p = patients.find(x => x._id === patientId);
        updateData = { status: 'Discharged', treatment: { ...(p?.treatment || {}), disposition: 'Referral' } };
      } else {
        updateData = { status: rawValue };
      }
      await updatePatient(patientId, updateData);
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

  // Active patients: not yet discharged AND no final disposition recorded
  const activePatientsSet = patients.filter(p =>
    p.status !== 'Discharged' &&
    !['Discharge', 'Admit', 'Referral'].includes(p.treatment?.disposition)
  );
  const triageCounts = activePatientsSet.reduce((acc, p) => {
    const cat = p.triageCategory;
    if (cat) acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const triageData = [1, 2, 3]
    .filter(cat => triageCounts[cat])
    .map(cat => ({
      name: getTriageLabel(cat),
      value: triageCounts[cat],
      color: TRIAGE_COLORS[cat],
    }));

  // Compute hourly flow from patient list based on selected date filter
  const computeHourlyFlow = (filter) => {
    const now = new Date();
    let startDate, endDate;
    if (filter === 'today') {
      startDate = new Date(now); startDate.setHours(0, 0, 0, 0);
      endDate   = new Date(now); endDate.setHours(23, 59, 59, 999);
    } else if (filter === 'yesterday') {
      startDate = new Date(now); startDate.setDate(startDate.getDate() - 1); startDate.setHours(0, 0, 0, 0);
      endDate   = new Date(now); endDate.setDate(endDate.getDate() - 1);     endDate.setHours(23, 59, 59, 999);
    } else if (filter === 'week') {
      startDate = new Date(now); startDate.setDate(startDate.getDate() - 6); startDate.setHours(0, 0, 0, 0);
      endDate   = new Date(now);
    } else {
      startDate = null; endDate = null; // all time
    }
    const inRange = (d) => !startDate || (d >= startDate && d <= endDate);
    const arrivals   = new Array(24).fill(0);
    const discharges = new Array(24).fill(0);
    patients.forEach(p => {
      if (p.arrivalTime) {
        const d = new Date(p.arrivalTime);
        if (inRange(d)) arrivals[d.getHours()]++;
      }
      if (p.treatment?.treatmentEndTime && p.status === 'Discharged') {
        const d = new Date(p.treatment.treatmentEndTime);
        if (inRange(d)) discharges[d.getHours()]++;
      }
    });
    return Array.from({ length: 24 }, (_, h) => ({
      label: `${String(h).padStart(2, '0')}:00`,
      arrivals:   arrivals[h],
      discharges: discharges[h],
    }));
  };

  const hourlyFlowData = computeHourlyFlow(hourlyFlowDate);

  const hourlyFlowLabel = {
    today:     `Today — ${new Date().toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}`,
    yesterday: (() => { const d = new Date(); d.setDate(d.getDate() - 1); return `Yesterday — ${d.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}`; })(),
    week:      'Last 7 Days — arrivals & discharges by hour of day',
    all:       'All Time — arrivals & discharges by hour of day',
  }[hourlyFlowDate];

  const computeStatusOverview = (filter) => {
    const now = new Date();
    let startDate, endDate;
    if (filter === 'today') {
      startDate = new Date(now); startDate.setHours(0, 0, 0, 0);
      endDate   = new Date(now); endDate.setHours(23, 59, 59, 999);
    } else if (filter === 'yesterday') {
      startDate = new Date(now); startDate.setDate(startDate.getDate() - 1); startDate.setHours(0, 0, 0, 0);
      endDate   = new Date(now); endDate.setDate(endDate.getDate() - 1);     endDate.setHours(23, 59, 59, 999);
    } else if (filter === 'week') {
      startDate = new Date(now); startDate.setDate(startDate.getDate() - 6); startDate.setHours(0, 0, 0, 0);
      endDate   = new Date(now);
    } else {
      startDate = null; endDate = null;
    }
    const inRange = (d) => !startDate || (d >= startDate && d <= endDate);
    const counts = { Registered: 0, 'Vitals Taken': 0, Triaged: 0, 'In Treatment': 0, Discharged: 0 };
    patients.forEach(p => {
      if (p.arrivalTime) {
        const d = new Date(p.arrivalTime);
        if (inRange(d)) {
          const s = p.status || 'Registered';
          if (counts[s] !== undefined) counts[s]++;
        }
      }
    });
    return [
      { name: 'Registered',   count: counts['Registered'] },
      { name: 'Vitals Taken', count: counts['Vitals Taken'] },
      { name: 'Triaged',      count: counts['Triaged'] },
      { name: 'In Treatment', count: counts['In Treatment'] },
      { name: 'Discharged',   count: counts['Discharged'] },
    ];
  };

  const statusOverviewData = computeStatusOverview(statusOverviewDate);
  const statusOverviewLabel = {
    today:     `Today — ${new Date().toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}`,
    yesterday: (() => { const d = new Date(); d.setDate(d.getDate() - 1); return `Yesterday — ${d.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}`; })(),
    week:      'Last 7 Days',
    all:       'All Time',
  }[statusOverviewDate];

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
                      <p className="text-xs text-gray-400 mt-1">Awaiting disposition</p>
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
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">Patient Status Overview</h2>
                      <p className="text-xs text-gray-400 mt-0.5">{statusOverviewLabel}</p>
                    </div>
                    <select
                      value={statusOverviewDate}
                      onChange={e => setStatusOverviewDate(e.target.value)}
                      className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer shadow-sm"
                    >
                      <option value="today">Today</option>
                      <option value="yesterday">Yesterday</option>
                      <option value="week">Last 7 Days</option>
                      <option value="all">All Time</option>
                    </select>
                  </div>
                  <ResponsiveContainer width="100%" height={270}>
                    <BarChart data={statusOverviewData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
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
                      <p className="text-xs text-gray-400 mt-1">Awaiting disposition</p>
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
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">Patient Status Overview</h2>
                      <p className="text-xs text-gray-400 mt-0.5">{statusOverviewLabel}</p>
                    </div>
                    <select
                      value={statusOverviewDate}
                      onChange={e => setStatusOverviewDate(e.target.value)}
                      className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer shadow-sm"
                    >
                      <option value="today">Today</option>
                      <option value="yesterday">Yesterday</option>
                      <option value="week">Last 7 Days</option>
                      <option value="all">All Time</option>
                    </select>
                  </div>
                  <ResponsiveContainer width="100%" height={270}>
                    <BarChart data={statusOverviewData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── ED ANALYTICS SECTION ── */}
              <div className="mt-8 mb-3">
                <h2 className="text-base font-bold text-gray-700 uppercase tracking-wide">Emergency Department Analytics</h2>
                <p className="text-xs text-gray-400 mt-0.5">Live ED capacity, flow, and utilisation metrics</p>
              </div>

              {/* Row: ED Congestion Index + Avg LoS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

                {/* ED Congestion Index — spans 2 cols */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">ED Congestion Index</h2>
                      <p className="text-xs text-gray-400 mt-0.5">Total capacity: 55 bays / chairs</p>
                    </div>
                    {(() => {
                      const ED_CAPACITY = 55;
                      const active = (stats?.resusOccupied || 0) + (stats?.edBedOccupied || 0) + (stats?.waitingOccupied || 0);
                      const pct = Math.round((active / ED_CAPACITY) * 100);
                      const color = pct < 40 ? 'text-green-600' : pct <= 70 ? 'text-yellow-600' : 'text-red-600';
                      const label = pct < 40 ? 'Normal' : pct <= 70 ? 'Moderate' : 'Critical';
                      return (
                        <div className="text-right">
                          <p className={`text-3xl font-bold ${color}`}>{pct}%</p>
                          <p className={`text-xs font-semibold uppercase tracking-wide ${color}`}>{label}</p>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Overall progress bar */}
                  {(() => {
                    const ED_CAPACITY = 55;
                    const active = (stats?.resusOccupied || 0) + (stats?.edBedOccupied || 0) + (stats?.waitingOccupied || 0);
                    const pct = Math.min(Math.round((active / ED_CAPACITY) * 100), 100);
                    const barColor = pct < 40 ? 'bg-green-500' : pct <= 70 ? 'bg-yellow-500' : 'bg-red-500';
                    return (
                      <div className="mb-5">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{active} active patients</span>
                          <span>{ED_CAPACITY - active} available</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                          <div className={`h-3 rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Zone breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Resuscitation Zone Bays', key: 'resusOccupied', capacity: 5,  color: 'red',    icon: '🔴' },
                      { label: 'ED Treatment Beds',       key: 'edBedOccupied', capacity: 15, color: 'yellow', icon: '🟡' },
                      { label: 'Waiting Area Chairs',     key: 'waitingOccupied', capacity: 35, color: 'green', icon: '🟢' },
                    ].map(zone => {
                      const occupied = stats?.[zone.key] || 0;
                      const pct = Math.min(Math.round((occupied / zone.capacity) * 100), 100);
                      const barColor = pct < 60 ? 'bg-green-400' : pct <= 85 ? 'bg-yellow-400' : 'bg-red-400';
                      const textColor = pct < 60 ? 'text-green-700' : pct <= 85 ? 'text-yellow-700' : 'text-red-700';
                      const bgColor = pct < 60 ? 'bg-green-50' : pct <= 85 ? 'bg-yellow-50' : 'bg-red-50';
                      return (
                        <div key={zone.key} className={`${bgColor} rounded-xl p-4`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-600">{zone.icon} {zone.label}</span>
                          </div>
                          <div className="flex items-end justify-between mb-2">
                            <span className={`text-2xl font-bold ${textColor}`}>{occupied}</span>
                            <span className="text-xs text-gray-400">/ {zone.capacity}</span>
                          </div>
                          <div className="w-full bg-white/60 rounded-full h-2 overflow-hidden">
                            <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                          </div>
                          <p className={`text-xs font-semibold mt-1 ${textColor}`}>{pct}% occupied</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Avg LoS card */}
                <div className="bg-white rounded-2xl shadow p-6 flex flex-col justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-1">Avg ED Length of Stay</h2>
                    <p className="text-xs text-gray-400">Arrival to discharge (completed patients)</p>
                  </div>
                  <div className="mt-6 text-center">
                    <p className="text-5xl font-bold text-blue-700">{formatMetricDuration(stats?.averageLOS)}</p>
                    <p className="text-xs text-gray-400 mt-3">Based on {stats?.discharged || 0} completed visits</p>
                  </div>
                  <div className="mt-6 space-y-2 text-sm">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Avg Triage Time</span>
                      <span className="font-medium text-gray-700">{formatMetricDuration(stats?.averageTriageTime)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Avg Wait for Doctor</span>
                      <span className="font-medium text-gray-700">{formatMetricDuration(stats?.averageWaitingTime)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Avg Consultation</span>
                      <span className="font-medium text-gray-700">{formatMetricDuration(stats?.averageConsultationTime)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hourly Patient Flow */}
              <div className="bg-white rounded-2xl shadow p-6 mb-6">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">Hourly Patient Flow</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{hourlyFlowLabel}</p>
                  </div>
                  <select
                    value={hourlyFlowDate}
                    onChange={e => setHourlyFlowDate(e.target.value)}
                    className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer shadow-sm"
                  >
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="week">Last 7 Days</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={hourlyFlowData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={1} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value, name) => [value, name === 'arrivals' ? 'Arrivals' : 'Discharges']}
                      labelFormatter={(label) => `Hour: ${label}`}
                    />
                    <Legend formatter={(value) => value === 'arrivals' ? 'Arrivals' : 'Discharges'} />
                    <Line type="monotone" dataKey="arrivals"   stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="discharges" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Utilisation by ED Zone */}
              <div className="bg-white rounded-2xl shadow p-6 mb-6">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Utilisation by ED Zone</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Occupied vs available capacity per zone — colour coded by utilisation level</p>
                </div>
                {(() => {
                  const zones = [
                    { name: 'Resuscitation Zone Bays', occupied: stats?.resusOccupied || 0, total: 5 },
                    { name: 'ED Treatment Beds',       occupied: stats?.edBedOccupied  || 0, total: 15 },
                    { name: 'Waiting Area Chairs',     occupied: stats?.waitingOccupied || 0, total: 35 },
                  ];
                  const bedData = zones.map(z => {
                    const pct = Math.round((z.occupied / z.total) * 100);
                    return {
                      name: z.name,
                      Occupied: z.occupied,
                      Available: z.total - z.occupied,
                      pct,
                      occupiedFill: pct < 60 ? '#22c55e' : pct <= 85 ? '#eab308' : '#ef4444',
                    };
                  });
                  return (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={bedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} barSize={40}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip
                          formatter={(value, name) => [value, name]}
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0]?.payload;
                            return (
                              <div className="bg-white border border-gray-200 rounded-xl shadow p-3 text-sm">
                                <p className="font-semibold text-gray-800 mb-1">{label}</p>
                                <p className="text-blue-600">Occupied: {d?.Occupied}</p>
                                <p className="text-gray-400">Available: {d?.Available}</p>
                                <p className={`font-bold mt-1 ${d?.pct < 60 ? 'text-green-600' : d?.pct <= 85 ? 'text-yellow-600' : 'text-red-600'}`}>{d?.pct}% utilised</p>
                              </div>
                            );
                          }}
                        />
                        <Legend />
                        <Bar dataKey="Occupied" stackId="a" radius={[0, 0, 0, 0]}>
                          {bedData.map((entry, index) => (
                            <Cell key={`occ-${index}`} fill={entry.occupiedFill} />
                          ))}
                        </Bar>
                        <Bar dataKey="Available" stackId="a" fill="#e5e7eb" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
                {/* Legend for utilisation thresholds */}
                <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span> &lt;60% — Normal</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span> 60–85% — Busy</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> &gt;85% — Critical</span>
                </div>
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  );
}