import { useState } from 'react';
import { completeTreatment } from '../services/api';
import { Activity, X, XCircle } from 'lucide-react';

export default function TreatmentFormModal({ patient, onClose, onTreatmentCompleted }) {
  const [formData, setFormData] = useState({
    provisionalDiagnosis: '',
    clinicalNotes: '',
    treatmentGiven: '',
    disposition: '',
    dispositionReason: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : {};
      const doctorName = user.name || user.username || 'Unknown';

      await completeTreatment(patient._id, {
        ...formData,
        treatedBy: doctorName.startsWith('Dr.') ? doctorName : `Dr. ${doctorName}`
      });
      onTreatmentCompleted();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete treatment');
    } finally {
      setLoading(false);
    }
  };

  const getTriageBadge = (category) => {
    const styles = {
      1: 'bg-red-100 border-red-400 text-red-800',
      2: 'bg-yellow-100 border-yellow-400 text-yellow-800',
      3: 'bg-green-100 border-green-400 text-green-800'
    };
    const labels = {
      1: 'Cat 1 — Critical (Red)',
      2: 'Cat 2 — Semi-Critical (Yellow)',
      3: 'Cat 3 — Non-Critical (Green)'
    };
    return { style: styles[category] || '', label: labels[category] || 'Not triaged' };
  };

  const triage = getTriageBadge(patient.triageCategory);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Treatment Form</h2>
            <p className="text-sm text-gray-500 mt-1">
              Patient: {patient.name} — {patient.patientId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <XCircle size={18} />
              {error}
            </div>
          )}

          {/* Read-only Patient Information */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Patient Information</h3>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Name:</span>
                  <span className="ml-2 font-medium text-gray-800">{patient.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Patient ID:</span>
                  <span className="ml-2 font-medium text-gray-800">{patient.patientId}</span>
                </div>
              </div>

              <div className="text-sm">
                <span className="text-gray-500">Chief Complaint:</span>
                <span className="ml-2 font-medium text-gray-800">{patient.chiefComplaint}</span>
              </div>

              <div className="text-sm">
                <span className="text-gray-500">Triage:</span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold border ${triage.style}`}>
                  {triage.label}
                </span>
              </div>

              {/* Vital Signs Grid */}
              {patient.vitalSigns && patient.vitalSigns.heartRate != null && (
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {patient.vitalSigns.spO2 != null && (
                    <div className="bg-green-50 p-2 rounded text-xs text-center">
                      <span className="text-gray-500 block">SpO2</span>
                      <span className="font-bold text-gray-800">{patient.vitalSigns.spO2}%</span>
                    </div>
                  )}
                  {patient.vitalSigns.heartRate != null && (
                    <div className="bg-red-50 p-2 rounded text-xs text-center">
                      <span className="text-gray-500 block">HR</span>
                      <span className="font-bold text-gray-800">{patient.vitalSigns.heartRate} bpm</span>
                    </div>
                  )}
                  {patient.vitalSigns.systolicBP != null && (
                    <div className="bg-blue-50 p-2 rounded text-xs text-center">
                      <span className="text-gray-500 block">BP</span>
                      <span className="font-bold text-gray-800">{patient.vitalSigns.systolicBP}/{patient.vitalSigns.diastolicBP}</span>
                    </div>
                  )}
                  {patient.vitalSigns.temperature != null && (
                    <div className="bg-orange-50 p-2 rounded text-xs text-center">
                      <span className="text-gray-500 block">Temp</span>
                      <span className="font-bold text-gray-800">{patient.vitalSigns.temperature}°C</span>
                    </div>
                  )}
                  {patient.vitalSigns.respiratoryRate != null && (
                    <div className="bg-purple-50 p-2 rounded text-xs text-center">
                      <span className="text-gray-500 block">RR</span>
                      <span className="font-bold text-gray-800">{patient.vitalSigns.respiratoryRate}/min</span>
                    </div>
                  )}
                  {patient.vitalSigns.gcs != null && (
                    <div className="bg-yellow-50 p-2 rounded text-xs text-center">
                      <span className="text-gray-500 block">GCS</span>
                      <span className="font-bold text-gray-800">{patient.vitalSigns.gcs}/15</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Treatment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provisional Diagnosis *</label>
              <input
                type="text"
                name="provisionalDiagnosis"
                required
                value={formData.provisionalDiagnosis}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Minor head injury, Acute gastroenteritis"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Notes</label>
              <textarea
                name="clinicalNotes"
                rows="3"
                value={formData.clinicalNotes}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Patient conscious, vitals stable. Minor abrasions on left arm."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Given</label>
              <textarea
                name="treatmentGiven"
                rows="3"
                value={formData.treatmentGiven}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Pain medication given, wound dressing applied"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Disposition *</label>
              <select
                name="disposition"
                required
                value={formData.disposition}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select disposition...</option>
                <option value="Discharge">Discharge</option>
                <option value="Admit">Admit</option>
                <option value="Referral">Referral</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Disposition *</label>
              <textarea
                name="dispositionReason"
                rows="2"
                required
                value={formData.dispositionReason}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Stable condition, safe for discharge"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Activity className="animate-spin" size={18} />
                  Completing Treatment...
                </span>
              ) : (
                'Complete Treatment'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
