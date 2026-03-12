import { useState, useEffect } from 'react';
import mediVisionLogo from '../assets/MediVision-Logo.jpeg';
import { getPatients, updatePatient } from '../services/api';
import { LayoutDashboard, Clock, Activity, Users, AlertCircle, MapPin, LogOut, User, Stethoscope, Moon, Sun } from 'lucide-react';
import VitalsFormModal from './VitalsFormModal';
import TreatmentFormModal from './TreatmentFormModal';

function computeAge(dob) {
  if (!dob) return '—';
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getTriageBadgeColor(category) {
  const colors = {
    1: 'bg-red-100 text-red-800 border-red-300',
    2: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    3: 'bg-green-100 text-green-800 border-green-300',
  };
  return colors[category] || 'bg-gray-100 text-gray-800 border-gray-300';
}

function getTriageLabel(category) {
  const labels = {
    1: 'Cat 1 — Critical',
    2: 'Cat 2 — Semi-Critical',
    3: 'Cat 3 — Non-Critical',
  };
  return labels[category] || 'Not triaged';
}

function getStatusColor(status) {
  const colors = {
    Registered: 'bg-purple-100 text-purple-800',
    'Vitals Taken': 'bg-indigo-100 text-indigo-800',
    Triaged: 'bg-orange-100 text-orange-800',
    'In Treatment': 'bg-blue-100 text-blue-800',
    Discharged: 'bg-green-100 text-green-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

function PatientCard({ patient, showActions, onTakeVitals, onStartTreatment, onCompleteTreatment }) {
  return (
    <div className="bg-white rounded-2xl shadow hover:shadow-md transition-shadow">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-gray-800 leading-tight">{patient.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{patient.patientId}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {patient.queueNumber && (
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-bold">
                Q{patient.queueNumber}
              </span>
            )}
            {patient.triageCategory && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getTriageBadgeColor(patient.triageCategory)}`}>
                Cat {patient.triageCategory}
              </span>
            )}
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(patient.status)}`}>
              {patient.status}
            </span>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mb-3">
          <div><span className="text-gray-400">Age</span><span className="ml-2 font-medium text-gray-700">{computeAge(patient.dateOfBirth)} yrs</span></div>
          <div><span className="text-gray-400">Phone</span><span className="ml-2 font-medium text-gray-700">{patient.contactNumber || '—'}</span></div>
          <div>
            <span className="text-gray-400">Arrival</span>
            <span className="ml-2 font-medium text-gray-700">{new Date(patient.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {patient.assignedLocation && (
            <div className="flex items-center gap-1">
              <MapPin size={11} className="text-blue-500 flex-shrink-0" />
              <span className="font-medium text-blue-700">{patient.assignedLocation}</span>
            </div>
          )}
        </div>

        {/* Chief Complaint */}
        <div className="bg-gray-50 rounded-xl px-3 py-2 mb-3">
          <p className="text-xs text-gray-400 mb-0.5">Chief Complaint</p>
          <p className="text-xs font-medium text-gray-700">{patient.chiefComplaint || '—'}</p>
        </div>

        {/* Triage details */}
        {patient.triageCategory && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-700">{getTriageLabel(patient.triageCategory)}</p>
            {patient.nurseOverride && (
              <p className="text-xs text-orange-600 mt-0.5">Nurse override — {patient.nurseOverrideReason}</p>
            )}
          </div>
        )}

        {/* Vitals */}
        {patient.vitalSigns?.heartRate && (
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {[
              { label: 'SpO₂',  value: patient.vitalSigns.spO2 != null ? `${patient.vitalSigns.spO2}%` : null },
              { label: 'HR',    value: patient.vitalSigns.heartRate != null ? `${patient.vitalSigns.heartRate} bpm` : null },
              { label: 'BP',    value: (patient.vitalSigns.systolicBP != null && patient.vitalSigns.diastolicBP != null) ? `${patient.vitalSigns.systolicBP}/${patient.vitalSigns.diastolicBP}` : null },
              { label: 'Temp',  value: patient.vitalSigns.temperature != null ? `${patient.vitalSigns.temperature}°C` : null },
              { label: 'RR',    value: patient.vitalSigns.respiratoryRate != null ? `${patient.vitalSigns.respiratoryRate}/min` : null },
              { label: 'GCS',   value: patient.vitalSigns.gcs != null ? `${patient.vitalSigns.gcs}/15` : null },
            ].filter(v => v.value !== null).map(v => (
              <div key={v.label} className="bg-blue-50 rounded-lg px-2 py-1.5 text-center">
                <p className="text-xs text-gray-400 leading-none mb-0.5">{v.label}</p>
                <p className="text-xs font-bold text-gray-800">{v.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons — only shown on non-overview tabs */}
        {showActions && (
          <div className="mt-1">
            {patient.status === 'Registered' && (
              <button
                onClick={() => onTakeVitals(patient)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-xl text-sm font-medium transition"
              >
                Take Vitals
              </button>
            )}
            {(patient.status === 'Triaged' || patient.status === 'Vitals Taken') && (
              <button
                onClick={() => onStartTreatment(patient)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-sm font-medium transition"
              >
                Start Treatment
              </button>
            )}
            {patient.status === 'In Treatment' && (
              <button
                onClick={() => onCompleteTreatment(patient)}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl text-sm font-medium transition"
              >
                Complete Treatment
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="col-span-2 bg-white rounded-2xl shadow p-14 text-center">
      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <AlertCircle className="text-gray-400" size={26} />
      </div>
      <p className="text-gray-500 font-medium">No patients in {label}</p>
    </div>
  );
}

export default function ClinicianDashboard() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [overviewSort, setOverviewSort] = useState('arrival_desc');
  const [vitalsModalPatient, setVitalsModalPatient] = useState(null);
  const [treatmentModalPatient, setTreatmentModalPatient] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('medivision-dark') === 'true');

  useEffect(() => {
    fetchPatients();
    const interval = setInterval(fetchPatients, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('medivision-dark', darkMode);
  }, [darkMode]);

  const fetchPatients = async () => {
    try {
      const response = await getPatients();
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTreatment = async (patient) => {
    setTreatmentModalPatient(patient);
    try {
      await updatePatient(patient._id, { status: 'In Treatment' });
      await fetchPatients();
    } catch (error) {
      console.error('Error starting treatment:', error);
    }
  };

  const waitingPatients = patients.filter(p => p.status === 'Registered');
  const triagedPatients = patients.filter(p => p.status === 'Triaged' || p.status === 'Vitals Taken');
  const inTreatmentPatients = patients.filter(p => p.status === 'In Treatment');

  // Overview: all non-discharged, sorted by chosen sort
  const overviewPatients = (() => {
    const base = patients.filter(p => p.status !== 'Discharged');
    switch (overviewSort) {
      case 'arrival_asc':   return [...base].sort((a, b) => new Date(a.arrivalTime) - new Date(b.arrivalTime));
      case 'name_asc':      return [...base].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'name_desc':     return [...base].sort((a, b) => (b.name || '').localeCompare(a.name || ''));
      case 'triage_asc':    return [...base].sort((a, b) => (a.triageCategory ?? 99) - (b.triageCategory ?? 99));
      case 'status':        return [...base].sort((a, b) => (a.status || '').localeCompare(b.status || ''));
      case 'arrival_desc':
      default:              return [...base].sort((a, b) => new Date(b.arrivalTime) - new Date(a.arrivalTime));
    }
  })();

  const doctorName = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      const name = u?.name || u?.username || 'Clinician';
      return name.startsWith('Dr.') ? name : `Dr. ${name}`;
    } catch { return 'Clinician'; }
  })();

  const navItems = [
    { key: 'overview',   label: 'Overview',   icon: <LayoutDashboard size={20} /> },
    { key: 'waiting',    label: 'Waiting',     icon: <Clock size={20} />,       count: waitingPatients.length },
    { key: 'triaged',    label: 'Triaged',     icon: <Activity size={20} />,    count: triagedPatients.length },
    { key: 'treatment',  label: 'Treatment',   icon: <Stethoscope size={20} />, count: inTreatmentPatients.length },
  ];

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'dark-mode bg-gray-900' : 'bg-[#f0f4f8]'}`}>
        <div className="text-center">
          <Activity className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-gray-600">Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex ${darkMode ? 'dark-mode bg-gray-900' : 'bg-[#f0f4f8]'}`}>

      {/* ── Sidebar ── */}
      <aside className="w-32 flex-shrink-0 flex flex-col items-center py-6 gap-3 min-h-screen" style={{ backgroundColor: '#1C3D6E' }}>
        <div className="flex flex-col items-center mb-5">
          <img src={mediVisionLogo} alt="MediVision Logo" className="w-20 h-20 rounded-2xl object-cover shadow" />
        </div>
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            className={`relative flex flex-col items-center gap-1 px-3 py-3 rounded-full w-28 text-white transition-all duration-150 ${
              activeTab === item.key ? 'bg-white/25 font-semibold shadow-inner' : 'hover:bg-white/10'
            }`}
          >
            {item.icon}
            <span className="text-xs text-center leading-tight">{item.label}</span>
            {item.count > 0 && (
              <span className="absolute top-1 right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {item.count}
              </span>
            )}
          </button>
        ))}
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Navbar ── */}
        <header className="flex items-center justify-between px-6 py-3 shadow-md" style={{ backgroundColor: '#1C3D6E' }}>
          <h1 className="text-white font-semibold text-base tracking-wide">Smart Patient Flow Platform</h1>
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
              <span>{doctorName}</span>
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

        {/* ── Tab content ── */}
        <main className="flex-1 p-6 overflow-auto">

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <>
              {/* Stats cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                <button onClick={() => setActiveTab('waiting')} className="bg-white rounded-2xl shadow p-5 text-left hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Waiting for Vitals</p>
                      <p className="text-3xl font-bold text-yellow-600">{waitingPatients.length}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-2"><Clock className="text-yellow-500" size={36} /></div>
                  </div>
                </button>
                <button onClick={() => setActiveTab('triaged')} className="bg-white rounded-2xl shadow p-5 text-left hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Triaged</p>
                      <p className="text-3xl font-bold text-purple-600">{triagedPatients.length}</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-2"><Activity className="text-purple-500" size={36} /></div>
                  </div>
                </button>
                <button onClick={() => setActiveTab('treatment')} className="bg-white rounded-2xl shadow p-5 text-left hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">In Treatment</p>
                      <p className="text-3xl font-bold text-blue-600">{inTreatmentPatients.length}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-2"><Stethoscope className="text-blue-500" size={36} /></div>
                  </div>
                </button>
              </div>

              {/* Patient cards — all non-discharged, no actions */}
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-gray-700">
                  All Active Patients
                  <span className="ml-2 text-sm font-normal text-gray-400">({overviewPatients.length})</span>
                </h2>
                <select
                  value={overviewSort}
                  onChange={e => setOverviewSort(e.target.value)}
                  className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer shadow-sm"
                >
                  <option value="arrival_desc">Latest Arrival First</option>
                  <option value="arrival_asc">Earliest Arrival First</option>
                  <option value="triage_asc">Triage Severity (Critical First)</option>
                  <option value="status">Status (A–Z)</option>
                  <option value="name_asc">Name (A–Z)</option>
                  <option value="name_desc">Name (Z–A)</option>
                </select>
              </div>
              {overviewPatients.length === 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <EmptyState label="queue" />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {overviewPatients.map(patient => (
                    <PatientCard
                      key={patient._id}
                      patient={patient}
                      showActions={false}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── WAITING FOR VITALS ── */}
          {activeTab === 'waiting' && (
            <>
              <h2 className="text-base font-bold text-gray-700 mb-4">Waiting for Vitals <span className="text-yellow-600">({waitingPatients.length})</span></h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {waitingPatients.length === 0
                  ? <EmptyState label="waiting queue" />
                  : waitingPatients.map(patient => (
                      <PatientCard
                        key={patient._id}
                        patient={patient}
                        showActions={true}
                        onTakeVitals={setVitalsModalPatient}
                      />
                    ))
                }
              </div>
            </>
          )}

          {/* ── TRIAGED ── */}
          {activeTab === 'triaged' && (
            <>
              <h2 className="text-base font-bold text-gray-700 mb-4">Triaged <span className="text-purple-600">({triagedPatients.length})</span></h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {triagedPatients.length === 0
                  ? <EmptyState label="triaged queue" />
                  : triagedPatients.map(patient => (
                      <PatientCard
                        key={patient._id}
                        patient={patient}
                        showActions={true}
                        onStartTreatment={handleStartTreatment}
                      />
                    ))
                }
              </div>
            </>
          )}

          {/* ── IN TREATMENT ── */}
          {activeTab === 'treatment' && (
            <>
              <h2 className="text-base font-bold text-gray-700 mb-4">In Treatment <span className="text-blue-600">({inTreatmentPatients.length})</span></h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {inTreatmentPatients.length === 0
                  ? <EmptyState label="treatment" />
                  : inTreatmentPatients.map(patient => (
                      <PatientCard
                        key={patient._id}
                        patient={patient}
                        showActions={true}
                        onCompleteTreatment={setTreatmentModalPatient}
                      />
                    ))
                }
              </div>
            </>
          )}

        </main>
      </div>

      {/* Vitals Modal */}
      {vitalsModalPatient && (
        <VitalsFormModal
          patient={vitalsModalPatient}
          onClose={() => setVitalsModalPatient(null)}
          onVitalsSubmitted={() => { setVitalsModalPatient(null); fetchPatients(); }}
        />
      )}

      {/* Treatment Modal */}
      {treatmentModalPatient && (
        <TreatmentFormModal
          patient={treatmentModalPatient}
          onClose={() => setTreatmentModalPatient(null)}
          onTreatmentCompleted={() => { setTreatmentModalPatient(null); fetchPatients(); }}
        />
      )}
    </div>
  );
}