import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPatient } from '../services/api';
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react';

export default function PatientRegistration() {
  const navigate = useNavigate();
  const COUNTRY_CODES = [
    { code: '+60', label: '+60 (Malaysia)' },
    { code: '+65', label: '+65 (Singapore)' },
    { code: '+62', label: '+62 (Indonesia)' },
    { code: '+66', label: '+66 (Thailand)' },
    { code: '+63', label: '+63 (Philippines)' },
    { code: '+673', label: '+673 (Brunei)' },
    { code: '+95', label: '+95 (Myanmar)' },
    { code: '+84', label: '+84 (Vietnam)' },
    { code: '+855', label: '+855 (Cambodia)' },
    { code: '+856', label: '+856 (Laos)' },
    { code: '+91', label: '+91 (India)' },
    { code: '+86', label: '+86 (China)' },
    { code: '+81', label: '+81 (Japan)' },
    { code: '+82', label: '+82 (South Korea)' },
    { code: '+61', label: '+61 (Australia)' },
    { code: '+44', label: '+44 (United Kingdom)' },
    { code: '+1', label: '+1 (USA / Canada)' },
    { code: '+971', label: '+971 (UAE)' },
    { code: '+966', label: '+966 (Saudi Arabia)' },
  ];

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    name: '',
    icNumber: '',
    dateOfBirth: '',
    gender: '',
    countryCode: '+60',
    phoneNumber: '',
    chiefComplaint: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { countryCode, phoneNumber, ...rest } = formData;
      const payload = {
        ...rest,
        contactNumber: `${countryCode} ${phoneNumber}`,
      };
      const response = await createPatient(payload);
      const newPatient = response.data;
      // Navigate to waiting screen with patient data
      navigate(`/waiting/${newPatient._id}`, { state: { patient: newPatient } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full">
              <UserPlus className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Emergency Check-In</h1>
              <p className="text-sm text-gray-500">MediVision Patient Registration</p>
            </div>
          </div>

          <p className="text-gray-600 text-sm mb-6 mt-4">
            Please fill in your details below. You will receive a queue number after registration.
          </p>

          {error && (
            <div
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Ahmad bin Ali"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IC Number / Passport Number *
              </label>
              <input
                type="text"
                name="icNumber"
                required
                value={formData.icNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. 990101-01-1234 or Passport No."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  required
                  max={today}
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  name="gender"
                  required
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <div className="flex gap-2">
                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  {COUNTRY_CODES.map(({ code, label }) => (
                    <option key={code} value={code}>{label}</option>
                  ))}
                </select>
                <input
                  type="tel"
                  name="phoneNumber"
                  required
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. 012-3456789"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chief Complaint *
              </label>
              <textarea
                name="chiefComplaint"
                required
                value={formData.chiefComplaint}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your main reason for visiting the emergency department"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register & Get Queue Number'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
