import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPatient } from '../services/api';
import { AlertCircle, Loader2 } from 'lucide-react';
import mediVisionLogo from '../assets/MediVision-Logo.jpeg';

export default function PatientRegistration() {
  const navigate = useNavigate();
  const COUNTRY_CODES = [
    { code: '+60', label: '🇲🇾 +60 (Malaysia)' },
    { code: '+65', label: '🇸🇬 +65 (Singapore)' },
    { code: '+62', label: '🇮🇩 +62 (Indonesia)' },
    { code: '+66', label: '🇹🇭 +66 (Thailand)' },
    { code: '+63', label: '🇵🇭 +63 (Philippines)' },
    { code: '+673', label: '🇧🇳 +673 (Brunei)' },
    { code: '+95', label: '🇲🇲 +95 (Myanmar)' },
    { code: '+84', label: '🇻🇳 +84 (Vietnam)' },
    { code: '+855', label: '🇰🇭 +855 (Cambodia)' },
    { code: '+856', label: '🇱🇦 +856 (Laos)' },
    { code: '+91', label: '🇮🇳 +91 (India)' },
    { code: '+86', label: '🇨🇳 +86 (China)' },
    { code: '+81', label: '🇯🇵 +81 (Japan)' },
    { code: '+82', label: '🇰🇷 +82 (South Korea)' },
    { code: '+61', label: '🇦🇺 +61 (Australia)' },
    { code: '+44', label: '🇬🇧 +44 (United Kingdom)' },
    { code: '+1', label: '🇺🇸 +1 (USA / Canada)' },
    { code: '+971', label: '🇦🇪 +971 (UAE)' },
    { code: '+966', label: '🇸🇦 +966 (Saudi Arabia)' },
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
    <div className="min-h-screen bg-[#1C3D6E]">

      {/* ── Header — matches PatientWaitingScreen ── */}
      <header className="px-6 py-5">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-1">
          <img src={mediVisionLogo} alt="MediVision Logo" className="w-16 h-16 rounded-2xl object-cover shadow-lg" />
          <h1 className="text-xl font-bold text-white tracking-wide mt-1">Emergency Check-in</h1>
          <p className="text-white/60 text-sm">MediVision · Patient Self-Registration</p>
        </div>
      </header>

      {/* ── Form card ── */}
      <div className="max-w-2xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl shadow-xl p-6 overflow-hidden">

          <p className="text-gray-500 text-sm mb-6">
            Please fill in your details below. You will receive a queue number after registration.
          </p>

          {error && (
            <div
              className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Full Name *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#1C3D6E] focus:bg-white transition"
                placeholder="e.g. Ahmad bin Ali"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">IC Number / Passport Number *</label>
              <input
                type="text"
                name="icNumber"
                required
                value={formData.icNumber}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#1C3D6E] focus:bg-white transition"
                placeholder="e.g. 990101-01-1234 or Passport No."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Date of Birth *</label>
              <input
                type="date"
                name="dateOfBirth"
                required
                max={today}
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full max-w-full box-border appearance-none px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#1C3D6E] focus:bg-white transition"
                style={{ WebkitAppearance: 'none', display: 'block', width: '100%', boxSizing: 'border-box', minHeight: '44px', lineHeight: '1.5' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Sex *</label>
              <select
                name="gender"
                required
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#1C3D6E] focus:bg-white transition"
              >
                <option value="">Select sex</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phone Number *</label>
              <div className="flex flex-col gap-2">
                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#1C3D6E] focus:bg-white transition"
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
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#1C3D6E] focus:bg-white transition"
                  placeholder="e.g. 012-3456789"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Chief Complaint *</label>
              <textarea
                name="chiefComplaint"
                required
                value={formData.chiefComplaint}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#1C3D6E] focus:bg-white transition resize-none"
                placeholder="Describe your main reason for visiting the emergency department"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3.5 rounded-xl transition-all duration-200"
              style={{
                background: loading ? '#6B7280' : '#1C3D6E',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(28,61,110,0.30)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Registering…</>
                : 'Register & Get Queue Number'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
