import { useState, useEffect } from 'react';
import { getPatients, updatePatient } from '../services/api';
import { Stethoscope, User, Clock, AlertCircle, CheckCircle } from 'lucide-react';

export default function ClinicianDashboard() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('waiting');

  useEffect(() => {
    fetchPatients();
    const interval = setInterval(fetchPatients, 30000); // Refresh every 30 seconds
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
      if (selectedPatient && selectedPatient._id === patientId) {
        setSelectedPatient({ ...selectedPatient, status });
      }
    } catch (error) {
      console.error('Error updating patient:', error);
    }
  };

  const handleAssignDoctor = async (patientId) => {
    const user = JSON.parse(localStorage.getItem('user'));
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
    const colors = {
      1: 'bg-red-500',
      2: 'bg-orange-500',
      3: 'bg-yellow-500',
      4: 'bg-green-500',
      5: 'bg-blue-500'
    };
    return colors[category] || colors[3];
  };

  const getTriageLabel = (category) => {
    const labels = {
      1: 'Critical - Immediate',
      2: 'Emergency - 10 mins',
      3: 'Urgent - 30 mins',
      4: 'Semi-urgent - 60 mins',
      5: 'Non-urgent - 120 mins'
    };
    return labels[category] || 'Unknown';
  };

  const filteredPatients = patients.filter(p => {
    if (activeTab === 'waiting') return p.status === 'Waiting';
    if (activeTab === 'treatment') return p.status === 'In Treatment';
    return true;
  });

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
                  Dr. {JSON.parse(localStorage.getItem('user')).name}
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
                <p className="text-yellow-100 mb-1">Waiting Queue</p>
                <p className="text-4xl font-bold">{patients.filter(p => p.status === 'Waiting').length}</p>
              </div>
              <Clock size={48} className="opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 mb-1">In Treatment</p>
                <p className="text-4xl font-bold">{patients.filter(p => p.status === 'In Treatment').length}</p>
              </div>
              <User size={48} className="opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 mb-1">Discharged Today</p>
                <p className="text-4xl font-bold">{patients.filter(p => p.status === 'Discharged').length}</p>
              </div>
              <CheckCircle size={48} className="opacity-80" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('waiting')}
              className={`flex-1 px-6 py-4 text-sm font-medium ${
                activeTab === 'waiting'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Waiting Queue ({patients.filter(p => p.status === 'Waiting').length})
            </button>
            <button
              onClick={() => setActiveTab('treatment')}
              className={`flex-1 px-6 py-4 text-sm font-medium ${
                activeTab === 'treatment'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              In Treatment ({patients.filter(p => p.status === 'In Treatment').length})
            </button>
          </div>
        </div>

        {/* Patient List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPatients.length === 0 ? (
            <div className="col-span-2 bg-white rounded-xl shadow p-12 text-center">
              <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">No patients in {activeTab === 'waiting' ? 'queue' : 'treatment'}</p>
            </div>
          ) : (
            filteredPatients.map((patient) => (
              <div key={patient._id} className="bg-white rounded-xl shadow hover:shadow-lg transition">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{patient.name}</h3>
                      <p className="text-sm text-gray-600">ID: {patient.patientId}</p>
                    </div>
                    <div className={`${getTriageColor(patient.triageCategory)} text-white px-3 py-1 rounded-full text-xs font-bold`}>
                      Category {patient.triageCategory}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div>
                      <span className="text-gray-600">Age:</span>
                      <span className="ml-2 font-medium">{patient.age} years</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Gender:</span>
                      <span className="ml-2 font-medium">{patient.gender}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Arrival:</span>
                      <span className="ml-2 font-medium">
                        {new Date(patient.arrivalTime).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-600 mb-1">Chief Complaint:</p>
                    <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded">{patient.chiefComplaint}</p>
                  </div>

                  {patient.vitalSigns && (
                    <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
                      {patient.vitalSigns.bloodPressure && (
                        <div className="bg-blue-50 p-2 rounded">
                          <span className="text-gray-600">BP:</span>
                          <span className="ml-1 font-medium">{patient.vitalSigns.bloodPressure}</span>
                        </div>
                      )}
                      {patient.vitalSigns.heartRate && (
                        <div className="bg-red-50 p-2 rounded">
                          <span className="text-gray-600">HR:</span>
                          <span className="ml-1 font-medium">{patient.vitalSigns.heartRate} bpm</span>
                        </div>
                      )}
                      {patient.vitalSigns.temperature && (
                        <div className="bg-orange-50 p-2 rounded">
                          <span className="text-gray-600">Temp:</span>
                          <span className="ml-1 font-medium">{patient.vitalSigns.temperature}°C</span>
                        </div>
                      )}
                      {patient.vitalSigns.oxygenSaturation && (
                        <div className="bg-green-50 p-2 rounded">
                          <span className="text-gray-600">SpO2:</span>
                          <span className="ml-1 font-medium">{patient.vitalSigns.oxygenSaturation}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {patient.status === 'Waiting' && (
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
    </div>
  );
}
