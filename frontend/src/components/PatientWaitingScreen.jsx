import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getPatient, getQueuePosition } from '../services/api';
import mediVisionLogo from '../assets/MediVision-Logo.jpeg';
import {
  Clock, Users, Activity, CheckCircle, MapPin, Heart,
  AlertCircle, Moon, Sun
} from 'lucide-react';

const STATUS_ORDER = ['Registered', 'Vitals Taken', 'Triaged', 'In Treatment', 'Discharged'];

const JOURNEY_STEPS = [
  { label: 'Checked In', minStatus: 'Registered' },
  { label: 'Triage Assessment', minStatus: 'Vitals Taken' },
  { label: 'Waiting for Doctor', minStatus: 'Triaged' },
  { label: 'Medical Examination', minStatus: 'In Treatment' },
  { label: 'Disposition', minStatus: 'Discharged' }
];

function computeAge(dob) {
  if (!dob) return '—';
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getStatusIndex(status) {
  const idx = STATUS_ORDER.indexOf(status);
  return idx === -1 ? 0 : idx;
}

function getEffectiveStatus(patient) {
  // If vitals have been recorded but status is still Registered, treat as Vitals Taken for journey display
  if (patient?.status === 'Registered' && patient?.vitalSigns?.heartRate != null) {
    return 'Vitals Taken';
  }
  return patient?.status || 'Registered';
}

function getStepState(stepMinStatus, currentStatus) {
  // Discharged is terminal — its own step should show as completed, not current
  if (currentStatus === 'Discharged' && stepMinStatus === 'Discharged') return 'completed';
  const stepIdx = getStatusIndex(stepMinStatus);
  const currentIdx = getStatusIndex(currentStatus);

  if (currentIdx > stepIdx) return 'completed';
  if (currentIdx === stepIdx) return 'current';
  return 'pending';
}


function formatTime(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(ms) {
  const totalMins = Math.round(Math.abs(ms) / 60000);
  if (totalMins < 60) return `${totalMins} minute${totalMins !== 1 ? 's' : ''}`;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getPatientTimestamps(patient) {
  return {
    checkIn:        patient?.arrivalTime                   ? new Date(patient.arrivalTime) : null,
    triageComplete: patient?.triageTimestamp               ? new Date(patient.triageTimestamp) : null,
    treatmentStart: patient?.treatment?.treatmentStartTime ? new Date(patient.treatment.treatmentStartTime) : null,
    treatmentEnd:   patient?.treatment?.treatmentEndTime   ? new Date(patient.treatment.treatmentEndTime) : null,
  };
}

function getStepDisplayData(index, patient) {
  if (!patient) return { primaryTime: null, durationLabel: null };
  const ts = getPatientTimestamps(patient);
  const now = new Date();

  switch (index) {
    case 0: // Checked In
      return { primaryTime: formatTime(ts.checkIn), durationLabel: null };

    case 1: { // Triage Assessment — duration from check-in to triage complete
      const durationMs = ts.triageComplete && ts.checkIn
        ? ts.triageComplete - ts.checkIn
        : ts.checkIn ? now - ts.checkIn : null;
      return {
        primaryTime: formatTime(ts.triageComplete),
        durationLabel: durationMs != null ? `Duration: ${formatDuration(durationMs)}` : null,
      };
    }

    case 2: { // Waiting for Doctor — triage complete → treatment start
      const start = ts.triageComplete;
      const end = ts.treatmentStart;
      const durationMs = start && end ? end - start : start ? now - start : null;
      return {
        primaryTime: start && end
          ? `${formatTime(start)} – ${formatTime(end)}`
          : formatTime(start),
        durationLabel: durationMs != null ? `Wait time: ${formatDuration(durationMs)}` : null,
      };
    }

    case 3: { // Medical Examination — treatment start → treatment end
      const start = ts.treatmentStart;
      const end = ts.treatmentEnd;
      const durationMs = start && end ? end - start : start ? now - start : null;
      return {
        primaryTime: start && end
          ? `${formatTime(start)} – ${formatTime(end)}`
          : formatTime(start),
        durationLabel: durationMs != null ? `Consultation: ${formatDuration(durationMs)}` : null,
      };
    }

    case 4: { // Treatment / Discharge
      const disposition = patient.treatment?.disposition;
      return {
        primaryTime: formatTime(ts.treatmentEnd),
        durationLabel: disposition || null,
      };
    }

    default:
      return { primaryTime: null, durationLabel: null };
  }
}

function getEstimatedWait(patient, queueInfo) {
  if (!patient) return 'Pending';
  if (patient.status === 'In Treatment' || patient.status === 'Discharged') return 'N/A';
  if (patient.triageCategory) {
    const waits = { 1: 'Immediate', 2: '~30 Minutes', 3: '~60 Minutes' };
    return waits[patient.triageCategory] || 'Pending';
  }
  if (queueInfo?.position) {
    return `~${queueInfo.position * 10} Minutes`;
  }
  return 'Pending Assessment';
}

function getPriorityLabel(category) {
  const labels = { 1: 'Critical', 2: 'Urgent', 3: 'Non-Urgent' };
  return labels[category] || 'Pending';
}

function getPriorityStyle(category) {
  const styles = {
    1: 'bg-red-100 text-red-700',
    2: 'bg-yellow-100 text-yellow-700',
    3: 'bg-green-100 text-green-700'
  };
  return styles[category] || 'bg-gray-100 text-gray-600';
}

function getStatusBadgeStyle(status, disposition) {
  if (status === 'Discharged') {
    if (disposition === 'Admit')    return 'bg-blue-100 text-blue-700';
    if (disposition === 'Referral') return 'bg-orange-100 text-orange-700';
    return 'bg-green-100 text-green-700'; // Discharge / default
  }
  const styles = {
    'Registered':  'bg-purple-100 text-purple-700',
    'Vitals Taken':'bg-indigo-100 text-indigo-700',
    'Triaged':     'bg-orange-100 text-orange-700',
    'In Treatment':'bg-blue-100 text-blue-700',
  };
  return styles[status] || 'bg-gray-100 text-gray-600';
}

function getStatusLabel(status, disposition) {
  if (status === 'Discharged') {
    if (disposition === 'Admit')    return 'Admitted';
    if (disposition === 'Referral') return 'Referred';
    return 'Discharged';
  }
  const labels = {
    'Registered':  'Registered',
    'Vitals Taken':'Vitals Taken',
    'Triaged':     'Triaged',
    'In Treatment':'In Treatment',
  };
  return labels[status] || status;
}

export default function PatientWaitingScreen() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(location.state?.patient || null);
  const [queueInfo, setQueueInfo] = useState(null);
  const [loading, setLoading] = useState(!patient);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('medivision-dark') === 'true');

  useEffect(() => {
    localStorage.setItem('medivision-dark', darkMode);
  }, [darkMode]);

  // Fetch patient data if not passed via navigation state
  useEffect(() => {
    if (!patient) {
      const fetchPatient = async () => {
        try {
          const response = await getPatient(id);
          setPatient(response.data);
        } catch (error) {
          console.error('Error fetching patient:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchPatient();
    }
  }, [id, patient]);

  // Poll queue position every 15 seconds
  useEffect(() => {
    if (!patient?.icNumber) return;

    const fetchQueue = async () => {
      try {
        const response = await getQueuePosition(patient.icNumber);
        const data = response.data;
        setQueueInfo(data);
        // Merge enriched data back into patient state
        setPatient(prev => ({ ...prev, ...data }));
      } catch (error) {
        // Patient may no longer be in queue
        if (error.response?.status === 404) {
          // Re-fetch by ID to get latest state
          try {
            const res = await getPatient(id);
            setPatient(res.data);
          } catch (e) {
            console.error('Error re-fetching patient:', e);
          }
        }
      }
    };

    fetchQueue();
    const interval = setInterval(fetchQueue, 15000);
    return () => clearInterval(interval);
  }, [patient?.icNumber, id]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'dark-mode bg-gray-900' : 'bg-[#1C3D6E]'}`}>
        <div className="text-center">
          <Activity className="animate-spin mx-auto mb-4 text-blue-400" size={48} />
          <p className="text-white/80">Loading your information...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'dark-mode bg-gray-900' : 'bg-[#1C3D6E]'}`}>
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 text-white/50" size={48} />
          <p className="text-white/80">Registration not found. Please register at the check-in counter.</p>
        </div>
      </div>
    );
  }

  const hasVitals = patient.vitalSigns && patient.vitalSigns.heartRate != null;
  const currentLocation = patient.assignedLocation || 'Waiting Area';
  const estimatedWait = getEstimatedWait(patient, queueInfo);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark-mode bg-gray-900' : 'bg-[#1C3D6E]'}`}>
      {/* Header */}
      <header className="px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left — Dark mode toggle */}
          <div className="w-32 flex items-start">
            <button
              onClick={() => setDarkMode(prev => !prev)}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="flex items-center justify-center bg-white/15 hover:bg-white/25 rounded-full w-9 h-9 text-white transition"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          {/* Centre — Logo + title + live indicator + queue */}
          <div className="flex flex-col items-center gap-1">
            <img src={mediVisionLogo} alt="MediVision Logo" className="w-16 h-16 rounded-2xl object-cover shadow-lg" />
            <h1 className="text-xl font-bold text-white tracking-wide mt-1">Patient Visitation</h1>
            <div className="flex items-center gap-2 text-white/80 text-sm mt-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span>Live — updates automatically</span>
            </div>
            <p className="text-white/60 text-xs mt-0.5">Stay on for live updates. Please do not refresh or close.</p>
            <div className="flex items-center gap-3 mt-3 bg-white/15 rounded-2xl px-6 py-3">
              <span className="text-base font-medium text-white/80">Queue Number</span>
              <span className="text-4xl font-extrabold text-white">{patient.queueNumber || '—'}</span>
            </div>
          </div>

          {/* Right — spacer for symmetry */}
          <div className="w-32"></div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-3 space-y-6">
            {/* Next Steps */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h3 className="font-semibold text-blue-900 mb-2">Next Steps</h3>
              <p className="text-sm text-blue-800">
                {patient.status === 'Registered' && 'A doctor will see you shortly. Please remain calm. If you experience any worsening symptoms, please notify the staff immediately.'}
                {patient.status === 'Vitals Taken' && 'Your vitals have been recorded. Please wait while the nurse completes your triage assessment.'}
                {patient.status === 'Triaged' && `Your triage assessment is complete. Please proceed to your assigned location: ${currentLocation}. A doctor will attend to you shortly.`}
                {patient.status === 'In Treatment' && `You are currently being treated${patient.assignedDoctor ? ` by Dr. ${patient.assignedDoctor}` : ''}. Please follow your doctor's instructions.`}
                {patient.status === 'Discharged' && (
                  patient.treatment?.disposition === 'Admit'
                    ? "Your treatment is complete. You will be admitted for further care. Please follow the staff's instructions for your admission."
                    : patient.treatment?.disposition === 'Referral'
                    ? 'Your treatment is complete. You have been referred for specialist consultation. Please check with the front desk for your referral details.'
                    : 'You have been discharged. Thank you for using MediVision. Please follow your discharge instructions and take care.'
                )}
              </p>
            </div>

            {/* Welcome + Status Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-1">
                Welcome, {patient.name}
              </h1>
              <p className="text-sm text-gray-500 mb-6">Patient ID: {patient.patientId}</p>

              <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Status</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Current Location:</span>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-blue-600" />
                    <span className="font-medium text-gray-800">{currentLocation}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeStyle(patient.status, patient.treatment?.disposition)}`}>
                    {getStatusLabel(patient.status, patient.treatment?.disposition)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Estimated Wait:</span>
                  <span className="font-bold text-gray-800">{estimatedWait}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Priority Level:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityStyle(patient.triageCategory)}`}>
                    {getPriorityLabel(patient.triageCategory)}
                  </span>
                </div>
              </div>
            </div>

            {/* Vital Signs Card - only shown after vitals are taken */}
            {hasVitals && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Vital Signs</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Heart Rate */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Heart Rate</p>
                        <p className="text-xs text-gray-400">bpm</p>
                      </div>
                      <span className={`text-2xl font-bold ${
                        patient.vitalSigns.heartRate > 100 || patient.vitalSigns.heartRate < 60
                          ? 'text-red-500' : 'text-blue-600'
                      }`}>
                        {patient.vitalSigns.heartRate}
                      </span>
                    </div>
                  </div>

                  {/* Blood Pressure */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Blood Pressure</p>
                        <p className="text-xs text-gray-400">mmHg</p>
                      </div>
                      <span className={`text-2xl font-bold ${
                        patient.vitalSigns.systolicBP > 140 || patient.vitalSigns.diastolicBP > 90
                          ? 'text-red-500' : 'text-blue-600'
                      }`}>
                        {patient.vitalSigns.systolicBP}/{patient.vitalSigns.diastolicBP}
                      </span>
                    </div>
                  </div>

                  {/* Temperature */}
                  {patient.vitalSigns.temperature != null && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Temperature</p>
                          <p className="text-xs text-gray-400">°C</p>
                        </div>
                        <span className={`text-2xl font-bold ${
                          patient.vitalSigns.temperature >= 38 ? 'text-red-500' : 'text-blue-600'
                        }`}>
                          {patient.vitalSigns.temperature}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* SpO2 */}
                  {patient.vitalSigns.spO2 != null && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">SpO2</p>
                          <p className="text-xs text-gray-400">%</p>
                        </div>
                        <span className={`text-2xl font-bold ${
                          patient.vitalSigns.spO2 < 95 ? 'text-red-500' : 'text-blue-600'
                        }`}>
                          {patient.vitalSigns.spO2}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Queue Position */}
            {queueInfo && patient.status === 'Registered' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Queue Status</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                      <Users size={16} />
                      <span className="text-xs font-medium">Your Position</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-700">{queueInfo.position}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                      <Clock size={16} />
                      <span className="text-xs font-medium">Total Waiting</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-700">{queueInfo.totalWaiting}</p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN - Journey Timeline */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-6">Your Journey</h2>

              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-200" />

                <div className="space-y-8">
                  {JOURNEY_STEPS.map((step, index) => {
                    const state = getStepState(step.minStatus, getEffectiveStatus(patient));
                    const { primaryTime, durationLabel } = getStepDisplayData(index, patient);

                    return (
                      <div key={index} className="relative flex items-start gap-4">
                        {/* Circle indicator */}
                        <div className="relative z-10 flex-shrink-0">
                          {state === 'completed' && (
                            <div className="w-[30px] h-[30px] rounded-full bg-green-500 flex items-center justify-center">
                              <CheckCircle size={16} className="text-white" />
                            </div>
                          )}
                          {state === 'current' && (
                            <div className="w-[30px] h-[30px] rounded-full bg-blue-500 flex items-center justify-center">
                              <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                              </span>
                            </div>
                          )}
                          {state === 'pending' && (
                            <div className="w-[30px] h-[30px] rounded-full bg-gray-200 flex items-center justify-center">
                              <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="pt-1">
                          <p className={`font-semibold ${
                            state === 'completed' ? 'text-gray-800' :
                            state === 'current' ? 'text-blue-700' :
                            'text-gray-400'
                          }`}>
                            {step.label}
                          </p>
                          {state === 'pending' ? (
                            <p className="text-sm text-gray-400">Pending</p>
                          ) : (
                            <>
                              {primaryTime && (
                                <p className={`text-sm ${
                                  state === 'current' ? 'text-blue-500' : 'text-gray-600'
                                }`}>
                                  {primaryTime}
                                </p>
                              )}
                              {durationLabel && (
                                <p className="text-xs text-gray-400 mt-0.5">{durationLabel}</p>
                              )}
                              {state === 'current' && !primaryTime && (
                                <p className="text-sm text-blue-500">In Progress</p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Patient Details Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Details</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Name</span>
                  <span className="font-medium text-gray-800">{patient.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">IC / Passport Number</span>
                  <span className="font-medium text-gray-800">{patient.icNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Age / Gender</span>
                  <span className="font-medium text-gray-800">{computeAge(patient.dateOfBirth)} / {patient.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Contact</span>
                  <span className="font-medium text-gray-800">{patient.contactNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Chief Complaint</span>
                  <span className="font-medium text-gray-800 text-right max-w-[200px]">{patient.chiefComplaint}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Registered</span>
                  <span className="font-medium text-gray-800">
                    {new Date(patient.arrivalTime).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
