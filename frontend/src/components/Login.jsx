import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import { Shield, Stethoscope, User, Eye, EyeOff, ArrowRight, ChevronLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import mediVisionLogo from '../assets/MediVision-Logo.jpeg';

const ROLES = [
  { id: 'admin',     label: 'Admin',              sub: 'System administrator access', icon: Shield },
  { id: 'clinician', label: 'Staff (Doctor & Nurse)', sub: 'Clinical staff access',       icon: Stethoscope },
  { id: 'patient',   label: 'Patient',             sub: 'Patient registration & status', icon: User },
];

export default function Login() {
  const [selectedRole, setSelectedRole] = useState('');
  const [step, setStep] = useState('role');
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEnter = () => {
    if (!selectedRole) return;
    if (selectedRole === 'patient') { navigate('/register'); return; }
    setStep('credentials');
    setError('');
  };

  const handleBack = () => {
    setStep('role');
    setError('');
    setCredentials({ username: '', password: '' });
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await login(credentials);
      const { token, user } = response.data;
      const expectedRole = selectedRole === 'admin' ? 'admin' : 'clinician';
      if (user.role !== expectedRole) {
        setError('Invalid credentials for the selected role.');
        setCredentials(prev => ({ ...prev, password: '' }));
        setLoading(false);
        return;
      }
      const safeUser = { username: user.username, role: user.role, name: user.name };
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(safeUser));
      if (user.role === 'admin') navigate('/admin');
      else navigate('/clinician');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      setCredentials(prev => ({ ...prev, password: '' }));
    } finally {
      setLoading(false);
    }
  };

  const selectedRoleObj = ROLES.find(r => r.id === selectedRole);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f0f4f8]">

      {/* ── Left branding panel ── */}
      <div className="flex flex-col items-center justify-center py-12 px-10 md:w-1/2 md:min-h-screen">
        <div className="login-fade-in">
          <img
            src={mediVisionLogo}
            alt="MediVision Logo"
            className="w-52 h-52 md:w-72 md:h-72 rounded-3xl object-cover shadow-2xl mb-10 mx-auto"
          />
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '36px', fontWeight: 600, color: '#1F2937', textAlign: 'center', lineHeight: 1.25 }}>
            Smart Patient Flow Platform
          </p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '18px', fontWeight: 400, color: '#6B7280', textAlign: 'center', marginTop: '14px' }}>
            Real-time insights for smarter emergency care
          </p>
        </div>
      </div>

      {/* ── Right login panel ── */}
      <div className="flex flex-1 items-center justify-center p-6 md:p-12">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.10)' }}>

          {step === 'role' ? (
            <div className="login-slide-in">
              <div className="text-center mb-7">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Welcome to</p>
                <h2 className="text-3xl font-bold tracking-tight">
                  <span style={{ color: '#0F2E6B', fontWeight: 700 }}>MEDI</span><span style={{ color: '#B71C1C', fontWeight: 700 }}>VISION</span>
                </h2>
                <p className="text-xs text-gray-400 mt-2 tracking-wide">Select your role to continue</p>
              </div>

              <div className="space-y-2.5 mb-6">
                {ROLES.map(role => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.id;
                  return (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200"
                      style={{
                        border: isSelected ? '2px solid #1C3D6E' : '2px solid #E5E7EB',
                        background: isSelected ? '#EFF6FF' : '#FAFAFA',
                        transform: isSelected ? 'scale(1.01)' : 'scale(1)',
                        boxShadow: isSelected ? '0 4px 14px rgba(28,61,110,0.12)' : 'none',
                      }}
                    >
                      <span
                        className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
                        style={{ background: isSelected ? '#1C3D6E' : '#F3F4F6' }}
                      >
                        <Icon size={16} color={isSelected ? '#ffffff' : '#6B7280'} />
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-semibold" style={{ color: isSelected ? '#1C3D6E' : '#1F2937' }}>{role.label}</span>
                        <span className="block text-xs mt-0.5" style={{ color: isSelected ? '#3B82F6' : '#9CA3AF' }}>{role.sub}</span>
                      </span>
                      {isSelected && <CheckCircle2 size={18} color="#1C3D6E" className="flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleEnter}
                disabled={!selectedRole}
                className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3.5 rounded-xl transition-all duration-200"
                style={{
                  background: selectedRole ? '#1C3D6E' : '#9CA3AF',
                  cursor: selectedRole ? 'pointer' : 'not-allowed',
                  boxShadow: selectedRole ? '0 4px 14px rgba(28,61,110,0.30)' : 'none',
                }}
              >
                <span>Enter</span>
                <ArrowRight size={17} />
              </button>
            </div>
          ) : (
            <div className="login-slide-in">
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 mb-6 transition-colors duration-150 group"
              >
                <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform duration-150" />
                Back to role selection
              </button>

              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold tracking-tight">
                  <span style={{ color: '#0F2E6B', fontWeight: 700 }}>MEDI</span><span style={{ color: '#B71C1C', fontWeight: 700 }}>VISION</span>
                </h2>
                {/* Role badge */}
                <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: '#EFF6FF', color: '#1C3D6E' }}>
                  {selectedRoleObj && <selectedRoleObj.icon size={12} />}
                  {selectedRole === 'admin' ? 'Admin Login' : 'Staff Login'}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm login-shake">
                    <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Username</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={credentials.username}
                    onChange={e => setCredentials({ ...credentials, username: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 transition-all duration-150 focus:outline-none focus:border-[#1C3D6E] focus:ring-2 focus:ring-blue-100 focus:bg-white"
                    placeholder="Enter your username"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={credentials.password}
                      onChange={e => setCredentials({ ...credentials, password: e.target.value })}
                      className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm bg-gray-50 transition-all duration-150 focus:outline-none focus:border-[#1C3D6E] focus:ring-2 focus:ring-blue-100 focus:bg-white"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 mt-2"
                  style={{
                    background: loading ? '#6B7280' : '#1C3D6E',
                    boxShadow: loading ? 'none' : '0 4px 14px rgba(28,61,110,0.30)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" /> Logging in…</>
                    : <><span>Login</span><ArrowRight size={17} /></>}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}