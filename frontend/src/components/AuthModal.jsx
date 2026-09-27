import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import hospixLogo from '../assets/HOSPIX.png';
import { Building2, User, Lock, Mail, ArrowRight, X, Eye, EyeOff } from 'lucide-react';

export const AuthModal = ({ onClose, onSuccess, initialMode = 'login' }) => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  const [role, setRole] = useState('PROVIDER');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('rental');
  const [city, setCity] = useState('Thane');
  const [address, setAddress] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [panError, setPanError] = useState('');

  const handlePanChange = (e) => {
    const val = e.target.value.toUpperCase();
    if (val.length <= 10) {
      setPanNumber(val);
      if (panError) setPanError('');
    }
  };

  const handleDemoLogin = async (demoEmail, demoPassword) => {
    setError('');
    setPanError('');
    setLoading(true);
    try {
      const loggedUser = await login(demoEmail, demoPassword);
      if (onSuccess) onSuccess(loggedUser);
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPanError('');
    setLoading(true);

    try {
      let authUser;
      if (isRegister) {
        authUser = await register({
          email,
          password,
          full_name: fullName,
          role,
          phone,
          business_name: businessName,
          business_type: businessType,
          city,
          address,
          pan_number: panNumber,
        });
      } else {
        authUser = await login(email, password);
      }
      if (onSuccess) onSuccess(authUser);
      if (onClose) onClose();
    } catch (err) {
      const msg = err.message || 'Authentication error';
      if (msg.includes('Invalid PAN format') || msg.toLowerCase().includes('pan')) {
        setPanError('Invalid PAN format. Must be 5 letters, 4 numbers, 1 letter (e.g. ABCDE1234F).');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto hospix-modal-backdrop flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl hospix-modal-dialog border border-[#E7E5DC] w-full max-w-lg max-h-[calc(100vh-2.5rem)] flex flex-col overflow-hidden shadow-xl">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#E7E5DC] bg-[#FCFAF3] shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <img
                src={hospixLogo}
                alt="HOSPIX"
                className="w-9 h-9 aspect-square object-contain shrink-0"
              />
              <div>
                <h2 className="text-lg font-bold text-[#082D46] font-heading">
                  {isRegister ? 'Create Your Account' : 'Welcome to HOSPIX'}
                </h2>
                <p className="text-[11px] text-[#596B76]">
                  B2B Hospitality Resource Exchange Platform
                </p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="hospix-icon-btn text-[#8A979D] hover:text-[#082D46]"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#FBEAEA] border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
              <span className="font-bold">Error:</span>
              <span>{error}</span>
            </div>
          )}

          {/* Role Selection: Clear Provider / Seeker Option */}
          <div>
            <label className="block text-xs font-bold text-[#082D46] mb-2 uppercase tracking-wider">
              {isRegister ? 'Register As:' : 'Account Role:'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('PROVIDER')}
                className={`p-3 text-xs rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                  role === 'PROVIDER'
                    ? 'border-[#082D46] bg-[#E8F2F6] text-[#082D46] font-bold shadow-xs'
                    : 'border-[#E7E5DC] bg-white text-[#596B76] hover:bg-[#FCFAF3] hover:border-[#D9D8CF]'
                }`}
              >
                <Building2 className="w-4 h-4 text-[#082D46]" />
                <span className="font-bold">Resource Provider</span>
                <span className="text-[10px] text-[#8A979D] font-normal">List inventory & supply</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('SEEKER')}
                className={`p-3 text-xs rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                  role === 'SEEKER'
                    ? 'border-[#082D46] bg-[#FFF9E6] text-[#082D46] font-bold shadow-xs'
                    : 'border-[#E7E5DC] bg-white text-[#596B76] hover:bg-[#FCFAF3] hover:border-[#D9D8CF]'
                }`}
              >
                <User className="w-4 h-4 text-[#082D46]" />
                <span className="font-bold">Resource Seeker</span>
                <span className="text-[10px] text-[#8A979D] font-normal">Find & pool resources</span>
              </button>
            </div>
          </div>

          {/* Quick Demo Logins Bar (Login mode only) */}
          {!isRegister && (
            <div className="p-3.5 bg-[#FFF9E6] rounded-2xl border border-[#F4D98A]/60">
              <div className="text-[11px] font-bold text-[#082D46] uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Instant One-Click Demo Accounts</span>
                <span className="text-[10px] font-normal text-[#8C6A00]">Mumbai & Thane Hubs</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setRole('PROVIDER');
                    handleDemoLogin('provider1@royalbanquets.com', 'Password123!');
                  }}
                  className={`text-left p-2.5 bg-white hover:bg-[#FCFAF3] text-[#082D46] rounded-xl border transition-all duration-140 active:scale-[0.98] shadow-2xs group cursor-pointer ${
                    role === 'PROVIDER' ? 'border-[#082D46] ring-1 ring-[#082D46]' : 'border-[#E7E5DC] hover:border-[#082D46]/40'
                  }`}
                >
                  <div className="font-bold text-xs group-hover:text-[#082D46]">Royal Banquets</div>
                  <span className="block text-[10px] text-[#596B76]">Provider • Thane Hub</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRole('SEEKER');
                    handleDemoLogin('seeker@apexevents.com', 'Password123!');
                  }}
                  className={`text-left p-2.5 bg-white hover:bg-[#FCFAF3] text-[#082D46] rounded-xl border transition-all duration-140 active:scale-[0.98] shadow-2xs group cursor-pointer ${
                    role === 'SEEKER' ? 'border-[#082D46] ring-1 ring-[#082D46]' : 'border-[#E7E5DC] hover:border-[#082D46]/40'
                  }`}
                >
                  <div className="font-bold text-xs group-hover:text-[#082D46]">Apex Events</div>
                  <span className="block text-[10px] text-[#596B76]">Seeker • Event Planners</span>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#082D46] mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8A979D] absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@business.com"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#D9D8CF] rounded-xl focus:outline-hidden focus:border-[#082D46] focus:ring-2 focus:ring-[#082D46]/15 transition-all text-[#092C43]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#082D46] mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8A979D] absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 text-sm bg-white border border-[#D9D8CF] rounded-xl focus:outline-hidden focus:border-[#082D46] focus:ring-2 focus:ring-[#082D46]/15 transition-all text-[#092C43]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#8A979D] hover:text-[#082D46] transition-colors p-0.5"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isRegister && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#082D46] mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ramesh Patel"
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D9D8CF] rounded-xl focus:outline-hidden focus:border-[#082D46] focus:ring-2 focus:ring-[#082D46]/15 text-[#092C43]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#082D46] mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98200..."
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D9D8CF] rounded-xl focus:outline-hidden focus:border-[#082D46] focus:ring-2 focus:ring-[#082D46]/15 text-[#092C43]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#082D46] mb-1">Business Name</label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Royal Banquets"
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D9D8CF] rounded-xl focus:outline-hidden focus:border-[#082D46] focus:ring-2 focus:ring-[#082D46]/15 text-[#092C43]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#082D46] mb-1">City / Hub</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D9D8CF] rounded-xl focus:outline-hidden focus:border-[#082D46] focus:ring-2 focus:ring-[#082D46]/15 text-[#092C43]"
                    >
                      <option value="Thane">Thane</option>
                      <option value="Mulund">Mulund</option>
                      <option value="Bhiwandi">Bhiwandi</option>
                      <option value="Navi Mumbai">Navi Mumbai</option>
                      <option value="Mumbai Central">Mumbai Central</option>
                      <option value="Andheri">Andheri</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#082D46] mb-1">
                    Business PAN Number
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={panNumber}
                    onChange={handlePanChange}
                    placeholder="e.g. ABCDE1234F"
                    className={`w-full px-3 py-2 text-sm bg-white border rounded-xl focus:outline-hidden focus:ring-2 tracking-wider uppercase font-mono transition-colors ${
                      panError
                        ? 'border-[#ef4444] focus:ring-[#ef4444] text-[#092C43]'
                        : 'border-[#D9D8CF] focus:border-[#082D46] focus:ring-[#082D46]/15 text-[#092C43]'
                    }`}
                  />
                  {panError && (
                    <p className="mt-1 text-xs text-[#ef4444] font-medium">
                      {panError}
                    </p>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="hospix-btn-primary w-full py-3 rounded-xl shadow-xs text-sm mt-2 group"
            >
              <span>{loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4 hospix-arrow" />
            </button>
          </form>

          {/* Toggle between register and login */}
          <div className="pt-3 border-t border-[#E7E5DC] text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
                setPanError('');
              }}
              className="text-xs text-[#082D46] hover:underline font-semibold transition-opacity duration-140 active:opacity-75"
            >
              {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register your business"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
