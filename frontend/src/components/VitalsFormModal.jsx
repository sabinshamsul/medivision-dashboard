import { useState } from 'react';
import { submitVitals, confirmTriage, predictAI } from '../services/api';
import { Activity, CheckCircle, AlertTriangle, XCircle, X, Brain } from 'lucide-react';

export default function VitalsFormModal({ patient, onClose, onVitalsSubmitted }) {
  const [vitals, setVitals] = useState({
    spO2: '',
    respiratoryRate: '',
    heartRate: '',
    systolicBP: '',
    diastolicBP: '',
    gcs: '15',
    painScore: '',
    temperature: '',
    glucose: ''
  });
  const [step, setStep] = useState('vitals'); // 'vitals' | 'recommendation'
  const [triageResult, setTriageResult] = useState(null);
  const [showOverride, setShowOverride] = useState(false);
  const [overrideCategory, setOverrideCategory] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const handleVitalChange = (e) => {
    const { name, value } = e.target;
    setVitals({ ...vitals, [name]: value });
  };

  // Step 1: Submit vitals and get AI recommendation
  const handleSubmitVitals = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Convert string values to numbers, omit empty fields
      const vitalsData = {};
      Object.entries(vitals).forEach(([key, value]) => {
        if (value !== '' && value !== null) {
          vitalsData[key] = Number(value);
        }
      });

      const response = await submitVitals(patient._id, vitalsData);
      setTriageResult(response.data.triageResult);
      setStep('recommendation');

      // Fire AI prediction in background (non-blocking)
      setAiLoading(true);
      setAiError('');
      try {
        const aiResponse = await predictAI(patient._id, vitalsData);
        if (aiResponse.data.aiPrediction) {
          setAiResult(aiResponse.data);
        } else {
          setAiError(aiResponse.data.error || 'AI service unavailable');
        }
      } catch (aiErr) {
        setAiError('AI prediction unavailable');
      } finally {
        setAiLoading(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit vitals');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm AI recommendation
  const handleAgree = async () => {
    setLoading(true);
    setError('');

    try {
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : {};

      await confirmTriage(patient._id, {
        confirmedCategory: triageResult.category,
        nurseOverride: false,
        triagedBy: user.name || user.username || 'Unknown'
      });
      onVitalsSubmitted();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm triage');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Override AI recommendation
  const handleOverride = async () => {
    if (!overrideCategory || !overrideReason.trim()) {
      setError('Please select a category and provide a reason for the override.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : {};

      await confirmTriage(patient._id, {
        confirmedCategory: Number(overrideCategory),
        nurseOverride: true,
        nurseOverrideReason: overrideReason,
        triagedBy: user.name || user.username || 'Unknown'
      });
      onVitalsSubmitted();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to override triage');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryStyle = (category) => {
    const styles = {
      1: 'bg-red-100 border-red-400 text-red-800',
      2: 'bg-yellow-100 border-yellow-400 text-yellow-800',
      3: 'bg-green-100 border-green-400 text-green-800'
    };
    return styles[category] || '';
  };

  const getCategoryLabel = (category) => {
    const labels = {
      1: 'Category 1 — Critical (Red Zone)',
      2: 'Category 2 — Semi-Critical (Yellow Zone)',
      3: 'Category 3 — Non-Critical (Green Zone)'
    };
    return labels[category] || 'Unknown';
  };

  const getFindingIcon = (category) => {
    if (category === 1) return <XCircle size={16} className="text-red-500 flex-shrink-0" />;
    if (category === 2) return <AlertTriangle size={16} className="text-yellow-600 flex-shrink-0" />;
    return <CheckCircle size={16} className="text-green-500 flex-shrink-0" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {step === 'vitals' ? 'Record Vital Signs' : 'AI Triage Recommendation'}
            </h2>
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

          {/* STEP 1: Vitals Input */}
          {step === 'vitals' && (
            <form onSubmit={handleSubmitVitals} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Chief Complaint:</strong> {patient.chiefComplaint}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SpO2 (%) *</label>
                  <input
                    type="number"
                    name="spO2"
                    required
                    min="0"
                    max="100"
                    value={vitals.spO2}
                    onChange={handleVitalChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="98"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Respiratory Rate (/min) *</label>
                  <input
                    type="number"
                    name="respiratoryRate"
                    required
                    min="0"
                    max="60"
                    value={vitals.respiratoryRate}
                    onChange={handleVitalChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="16"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heart Rate (bpm) *</label>
                  <input
                    type="number"
                    name="heartRate"
                    required
                    min="0"
                    max="300"
                    value={vitals.heartRate}
                    onChange={handleVitalChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="72"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Systolic BP (mmHg) *</label>
                  <input
                    type="number"
                    name="systolicBP"
                    required
                    min="0"
                    max="300"
                    value={vitals.systolicBP}
                    onChange={handleVitalChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="120"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diastolic BP (mmHg) *</label>
                  <input
                    type="number"
                    name="diastolicBP"
                    required
                    min="0"
                    max="200"
                    value={vitals.diastolicBP}
                    onChange={handleVitalChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="80"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GCS (3-15) *</label>
                  <input
                    type="number"
                    name="gcs"
                    required
                    min="3"
                    max="15"
                    value={vitals.gcs}
                    onChange={handleVitalChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="15"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pain Score (0-10) *</label>
                  <input
                    type="number"
                    name="painScore"
                    required
                    min="0"
                    max="10"
                    value={vitals.painScore}
                    onChange={handleVitalChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°C) *</label>
                  <input
                    type="number"
                    name="temperature"
                    required
                    step="0.1"
                    min="30"
                    max="45"
                    value={vitals.temperature}
                    onChange={handleVitalChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="36.5"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Glucose (mmol/L) — Optional</label>
                  <input
                    type="number"
                    name="glucose"
                    step="0.1"
                    min="0"
                    max="50"
                    value={vitals.glucose}
                    onChange={handleVitalChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="5.5"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Activity className="animate-spin" size={18} />
                    Analysing Vitals...
                  </span>
                ) : (
                  'Submit Vitals & Get AI Recommendation'
                )}
              </button>
            </form>
          )}

          {/* STEP 2: AI Recommendation */}
          {step === 'recommendation' && triageResult && (
            <div className="space-y-4">
              {/* Recommendation card */}
              <div className={`border-2 rounded-xl p-6 text-center ${getCategoryStyle(triageResult.category)}`}>
                <p className="text-sm font-medium mb-2">AI Triage Recommendation</p>
                <p className="text-2xl font-bold">{getCategoryLabel(triageResult.category)}</p>
              </div>

              {/* Findings list */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Assessment Findings</h3>
                <div className="space-y-2">
                  {triageResult.findings.map((finding, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      {getFindingIcon(finding.category)}
                      <span className="text-gray-700">
                        <strong>{finding.parameter}:</strong> {finding.reason}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Critical findings highlight */}
              {triageResult.criticalFindings.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-red-800 mb-1">
                    Critical Findings ({triageResult.criticalFindings.length})
                  </p>
                  {triageResult.criticalFindings.map((f, i) => (
                    <p key={i} className="text-sm text-red-700">{f.reason}</p>
                  ))}
                </div>
              )}

              {/* AI Model Prediction */}
              {aiLoading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-blue-700">
                    <Activity className="animate-spin" size={18} />
                    <span className="text-sm font-medium">Running AI model prediction...</span>
                  </div>
                </div>
              )}

              {aiResult && aiResult.aiPrediction && (
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain size={18} className="text-purple-600" />
                    <h3 className="text-sm font-semibold text-gray-700">AI Model Prediction</h3>
                  </div>

                  {/* AI Category */}
                  <div className={`border rounded-lg p-3 text-center ${getCategoryStyle(aiResult.aiPrediction.category)}`}>
                    <p className="text-lg font-bold">{getCategoryLabel(aiResult.aiPrediction.category)}</p>
                  </div>

                  {/* Probability Bars */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Risk Probabilities</p>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-600 w-24">Critical</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${aiResult.aiPrediction.red_risk}%`, backgroundColor: '#EF4444' }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-700 w-12 text-right">
                        {aiResult.aiPrediction.red_risk}%
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-600 w-24">Semi-Critical</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${aiResult.aiPrediction.yellow_risk}%`, backgroundColor: '#F59E0B' }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-700 w-12 text-right">
                        {aiResult.aiPrediction.yellow_risk}%
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-600 w-24">Non-Critical</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${aiResult.aiPrediction.green_risk}%`, backgroundColor: '#22C55E' }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-700 w-12 text-right">
                        {aiResult.aiPrediction.green_risk}%
                      </span>
                    </div>
                  </div>

                  {aiResult.mappedFeatures && (
                    <p className="text-xs text-gray-400 mt-2">
                      Model inputs: Age {aiResult.mappedFeatures.age},{' '}
                      {aiResult.mappedFeatures.gender},{' '}
                      Mental status: {aiResult.mappedFeatures.avpuLabel} (GCS {aiResult.mappedFeatures.gcs})
                    </p>
                  )}
                </div>
              )}

              {aiError && !aiLoading && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">{aiError}</p>
                </div>
              )}

              {/* Action buttons */}
              {!showOverride ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleAgree}
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {loading ? 'Confirming...' : 'Agree with Recommendation'}
                  </button>
                  <button
                    onClick={() => setShowOverride(true)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Override
                  </button>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-gray-800">Override AI Recommendation</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Category *</label>
                    <select
                      value={overrideCategory}
                      onChange={(e) => setOverrideCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select...</option>
                      <option value="1">Category 1 — Critical (Red)</option>
                      <option value="2">Category 2 — Semi-Critical (Yellow)</option>
                      <option value="3">Category 3 — Non-Critical (Green)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Override *</label>
                    <textarea
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Explain your clinical reasoning..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleOverride}
                      disabled={loading}
                      className="flex-1 bg-orange-600 text-white py-2 rounded-lg font-semibold hover:bg-orange-700 transition disabled:opacity-50"
                    >
                      {loading ? 'Confirming...' : 'Confirm Override'}
                    </button>
                    <button
                      onClick={() => {
                        setShowOverride(false);
                        setOverrideCategory('');
                        setOverrideReason('');
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
