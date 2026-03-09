import { useState, useEffect } from 'react';
import { getPatients, updatePatient } from '../services/api';
import { Stethoscope, User, Clock, AlertCircle, CheckCircle, Activity, MapPin } from 'lucide-react';
import VitalsFormModal from './VitalsFormModal';

export default function ClinicianDashboard() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('registered');
  const [vitalsModalPatient, setVitalsModalPatient] = useState(null);

  useEffect(() => {
    const runFetchPatients = async () => {
      try {
        await fetchPatients();
      } catch (error) {
        console.error('Error in scheduled fetchPatients:', error);
      }
    };

    runFetchPatients();
    const interval = setInterval(runFetchPatients, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const handleUpdateStatus = async (patientId, status) => {
    try {
      await updatePatient(patientId, { status });
      fetchPatients();
    } catch (error) {
      console.error('Error updating patient:', error);
    }
  };

  const handleAssignDoctor = async (patientId) => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;

    let user;
    try {
      user = JSON.parse(storedUser);
    } catch (parseError) {
      console.error('Failed to parse user:', parseError);
      return;
    }

    if (!user || typeof user.name !== 'string' || user.name.trim() === '') {
      console.error('Invalid user info: missing name');
      return;
    }

    try {
      await updatePatient(patientId, {
        assignedDoctor: user.name,
        status: 'In Treatment'
      });
      fetchPatients();
    } catch (error) {
      console.error('Error assigning doctor:', error);
    }
  };

  const getTriageColor = (category) => {
    const colors = { 1: 'bg-red-500', 2: 'bg-yellow-500', 3: 'bg-green-500' };
    return colors[category] || 'bg-gray-400';
  };

  const getTriageLabel = (category) => {
    const labels = {
      1: 'Cat 1 — Critical (Red)',
      2: 'Cat 2 — Semi-Critical (Yellow)',
      3: 'Cat 3 — Non-Critical (Green)'
    };
    return labels[category] || 'Not triaged';
  };

  const filteredPatients = patients.filter(p => {
    if (activeTab === 'registered') return p.status === 'Registered';
    if (activeTab === 'triaged') return p.status === 'Triaged' || p.status === 'Vitals Taken';
    if (activeTab === 'treatment') return p.status === 'In Treatment';
    return true;
  });

  const registeredCount = patients.filter(p => p.status === 'Registered').length;
  const triagedCount = patients.filter(p => p.status === 'Triaged' || p.status === 'Vitals Taken').length;
  const inTreatmentCount = patients.filter(p => p.status === 'In Treatment').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Stethoscope className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-gray-600">Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Stethoscope className="text-blue-600" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Clinician Dashboard</h1>
                <p className="text-sm text-gray-600">
                  {(() => {
                    const storedUser = localStorage.getItem('user');
                    if (!storedUser) return '';
                    try {
                      const parsedUser = JSON.parse(storedUser);
                      const displayName = parsedUser?.name || parsedUser?.username || '';
                      return displayName.startsWith('Dr.') ? displayName : `Dr. ${displayName}`;
                    } catch (e) {
                      return '';
                    }
                  })()}
                </p>
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
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 mb-1">Waiting for Vitals</p>
                <p className="text-4xl font-bold">{registeredCount}</p>
              </div>
              <Clock size={48} className="opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-400 to-purple-500 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 mb-1">Triaged</p>
                <p className="text-4xl font-bold">{triagedCount}</p>
              </div>
              <Activity size={48} className="opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 mb-1">In Treatment</p>
                <p className="text-4xl font-bold">{inTreatmentCount}</p>
              </div>
              <User size={48} className="opacity-80" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('registered')}
              className={`flex-1 px-6 py-4 text-sm font-medium ${
                activeTab === 'registered'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Waiting for Vitals ({registeredCount})
            </button>
            <button
              onClick={() => setActiveTab('triaged')}
              className={`flex-1 px-6 py-4 text-sm font-medium ${
                activeTab === 'triaged'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Triaged ({triagedCount})
            </button>
            <button
              onClick={() => setActiveTab('treatment')}
              className={`flex-1 px-6 py-4 text-sm font-medium ${
                activeTab === 'treatment'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              In Treatment ({inTreatmentCount})
            </button>
          </div>
        </div>

        {/* Patient List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPatients.length === 0 ? (
            <div className="col-span-2 bg-white rounded-xl shadow p-12 text-center">
              <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">
                No patients in {
                  activeTab === 'registered' ? 'waiting queue' :
                  activeTab === 'triaged' ? 'triaged queue' :
                  'treatment'
                }
              </p>
            </div>
          ) : (
            filteredPatients.map((patient) => (
              <div key={patient._id} className="bg-white rounded-xl shadow hover:shadow-lg transition">
                <div className="p-6">
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{patient.name}</h3>
                      <p className="text-sm text-gray-600">ID: {patient.patientId}</p>
                      {patient.icNumber && (
                        <p className="text-sm text-gray-500">IC: {patient.icNumber}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {patient.queueNumber && (
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">
                          Q{patient.queueNumber}
                        </span>
                      )}
                      {patient.triageCategory && (
                        <span className={`${getTriageColor(patient.triageCategory)} text-white px-3 py-1 rounded-full text-xs font-bold`}>
                          Cat {patient.triageCategory}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info row */}
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <span className="ml-2 font-medium">{patient.contactNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Arrival:</span>
                      <span className="ml-2 font-medium">
                        {new Date(patient.arrivalTime).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {/* Chief complaint */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-600 mb-1">Chief Complaint:</p>
                    <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded">{patient.chiefComplaint}</p>
                  </div>

                  {/* Triage info for triaged patients */}
                  {patient.triageCategory && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-600 mb-1">Triage:</p>
                      <p className="text-sm font-medium">{getTriageLabel(patient.triageCategory)}</p>
                      {patient.nurseOverride && (
                        <p className="text-xs text-orange-600 mt-1">
                          Nurse override — {patient.nurseOverrideReason}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Location assignment */}
                  {patient.assignedLocation && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-600 mb-1">Assigned Location:</p>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-blue-600" />
                        <p className="text-sm font-medium text-blue-800">{patient.assignedLocation}</p>
                      </div>
                    </div>
                  )}

                  {/* Vital signs display */}
                  {patient.vitalSigns && patient.vitalSigns.heartRate && (
                    <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
                      {patient.vitalSigns.spO2 != null && (
                        <div className="bg-green-50 p-2 rounded">
                          <span className="text-gray-600">SpO2:</span>
                          <span className="ml-1 font-medium">{patient.vitalSigns.spO2}%</span>
                        </div>
                      )}
                      {patient.vitalSigns.heartRate != null && (
                        <div className="bg-red-50 p-2 rounded">
                          <span className="text-gray-600">HR:</span>
                          <span className="ml-1 font-medium">{patient.vitalSigns.heartRate} bpm</span>
                        </div>
                      )}
                      {patient.vitalSigns.systolicBP != null && (
                        <div className="bg-blue-50 p-2 rounded">
                          <span className="text-gray-600">BP:</span>
                          <span className="ml-1 font-medium">{patient.vitalSigns.systolicBP}/{patient.vitalSigns.diastolicBP}</span>
                        </div>
                      )}
                      {patient.vitalSigns.temperature != null && (
                        <div className="bg-orange-50 p-2 rounded">
                          <span className="text-gray-600">Temp:</span>
                          <span className="ml-1 font-medium">{patient.vitalSigns.temperature}°C</span>
                        </div>
                      )}
                      {patient.vitalSigns.respiratoryRate != null && (
                        <div className="bg-purple-50 p-2 rounded">
                          <span className="text-gray-600">RR:</span>
                          <span className="ml-1 font-medium">{patient.vitalSigns.respiratoryRate}/min</span>
                        </div>
                      )}
                      {patient.vitalSigns.gcs != null && (
                        <div className="bg-yellow-50 p-2 rounded">
                          <span className="text-gray-600">GCS:</span>
                          <span className="ml-1 font-medium">{patient.vitalSigns.gcs}/15</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {patient.status === 'Registered' && (
                      <button
                        onClick={() => setVitalsModalPatient(patient)}
                        className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                      >
                        Take Vitals
                      </button>
                    )}
                    {patient.status === 'Triaged' && (
                      <button
                        onClick={() => handleAssignDoctor(patient._id)}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                      >
                        Start Treatment
                      </button>
                    )}
                    {patient.status === 'In Treatment' && (
                      <button
                        onClick={() => handleUpdateStatus(patient._id, 'Discharged')}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium"
                      >
                        Discharge Patient
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Vitals Modal */}
      {vitalsModalPatient && (
        <VitalsFormModal
          patient={vitalsModalPatient}
          onClose={() => setVitalsModalPatient(null)}
          onVitalsSubmitted={() => {
            setVitalsModalPatient(null);
            fetchPatients();
          }}
        />
      )}
    </div>
  );
}
