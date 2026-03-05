import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { getPatient, getQueuePosition } from '../services/api';
import { Clock, Users, Activity, CheckCircle } from 'lucide-react';

export default function PatientWaitingScreen() {
  const { id } = useParams();
  const location = useLocation();
  const [patient, setPatient] = useState(location.state?.patient || null);
  const [queueInfo, setQueueInfo] = useState(null);
  const [loading, setLoading] = useState(!patient);
  const [statusChanged, setStatusChanged] = useState(false);

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
        setQueueInfo(response.data);

        // Check if patient has been called (status changed from Registered)
        if (response.data.status && response.data.status !== 'Registered') {
          setStatusChanged(true);
        }
      } catch (error) {
        // Patient may no longer be in queue (already triaged)
        if (error.response?.status === 404) {
          setStatusChanged(true);
        }
      }
    };

    fetchQueue();
    const interval = setInterval(fetchQueue, 15000);
    return () => clearInterval(interval);
  }, [patient?.icNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-gray-600">Loading your queue information...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Registration not found. Please register at the check-in counter.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Status change notification */}
        {statusChanged && (
          <div className="bg-green-50 border border-green-300 text-green-800 px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
            <CheckCircle size={20} />
            <span className="font-medium">You are being attended to. Please proceed to the counter.</span>
          </div>
        )}

        {/* Queue number card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-full mb-3">
              <Activity className="text-white" size={28} />
            </div>
            <h1 className="text-xl font-bold text-gray-800">MediVision Emergency</h1>
            <p className="text-sm text-gray-500">Your Queue Status</p>
          </div>

          {/* Large queue number */}
          <div className="bg-blue-50 rounded-xl p-6 mb-6">
            <p className="text-sm text-blue-600 font-medium mb-1">Your Queue Number</p>
            <p className="text-6xl font-bold text-blue-700">
              {patient.queueNumber || '—'}
            </p>
            <p className="text-xs text-gray-500 mt-2">Patient ID: {patient.patientId}</p>
          </div>

          {/* Queue position */}
          {queueInfo && !statusChanged && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                  <Users size={16} />
                  <span className="text-xs font-medium">Your Position</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{queueInfo.position}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                  <Clock size={16} />
                  <span className="text-xs font-medium">Total Waiting</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{queueInfo.totalWaiting}</p>
              </div>
            </div>
          )}

          {/* Patient info */}
          <div className="text-left bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Name</span>
              <span className="font-medium text-gray-800">{patient.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Complaint</span>
              <span className="font-medium text-gray-800 text-right max-w-[200px]">{patient.chiefComplaint}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Registered</span>
              <span className="font-medium text-gray-800">
                {new Date(patient.arrivalTime).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Live indicator */}
          {!statusChanged && (
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              Live — updates automatically
            </div>
          )}
        </div>

        <p className="text-center text-gray-500 text-xs mt-4">
          Please wait in the waiting area. Your number will be called at the counter.
        </p>
      </div>
    </div>
  );
}
