import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCountUp } from '../hooks/useCountUp';
import { getResourceImage } from '../data/resourceImages';
import {
  Building2,
  ShieldCheck,
  ShieldAlert,
  Star,
  MapPin,
  CheckCircle2,
  Package,
  Clock,
  Truck,
  Edit3,
  Phone,
  Mail,
  User,
  AlertCircle,
  Save,
  Check,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

export const ProfileView = () => {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // PAN verification form states
  const [panInput, setPanInput] = useState('');
  const [panLoading, setPanLoading] = useState(false);
  const [panError, setPanError] = useState('');
  const [panSuccess, setPanSuccess] = useState('');

  // Profile Edit modal / states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    business_name: '',
    business_type: '',
    city: 'Thane',
    address: '',
    phone: '',
    contact_person: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState('');

  const countCompleted = useCountUp(profile?.completed_transactions || 0, 450);
  const countTrust = useCountUp(profile?.trust_score || 0, 450);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/profile/me');
      setProfile(data);
      setEditForm({
        business_name: data.business_name || '',
        business_type: data.business_type || '',
        city: data.city || 'Thane',
        address: data.address || '',
        phone: data.phone || '',
        contact_person: data.contact_person || '',
      });
      if (data.pan_number) {
        setPanInput(data.pan_number);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handlePanChange = (e) => {
    const val = e.target.value.toUpperCase();
    if (val.length <= 10) {
      setPanInput(val);
      if (panError) setPanError('');
      if (panSuccess) setPanSuccess('');
    }
  };

  const handleVerifyPan = async (e) => {
    e.preventDefault();
    setPanError('');
    setPanSuccess('');
    setPanLoading(true);

    try {
      const res = await api.post('/profile/verify-pan', { pan_number: panInput });
      setPanSuccess(res.message || 'PAN verified successfully!');
      if (refreshUser) refreshUser();
      await fetchProfile();
    } catch (err) {
      const msg = err.message || 'Failed to verify PAN';
      setPanError(msg.includes('Invalid PAN format') ? 'Invalid PAN format. Must be 5 letters, 4 numbers, 1 letter (e.g. ABCDE1234F).' : msg);
    } finally {
      setPanLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditSuccess('');
    try {
      await api.put('/profile', editForm);
      setEditSuccess('Profile updated successfully!');
      setIsEditing(false);
      if (refreshUser) refreshUser();
      await fetchProfile();
      setTimeout(() => setEditSuccess(''), 4000);
    } catch (err) {
      alert('Error updating profile: ' + err.message);
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-slate-500 text-sm">
        <div className="inline-flex items-center space-x-2 animate-pulse">
          <Layers className="w-5 h-5 text-[#082D46] animate-spin" />
          <span>Loading organization profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-[#FDF2F2] border border-[#F8B4B4] text-[#9B1C1C] px-4 py-3 rounded-2xl text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-[#C81E1E]" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const isProvider = profile.role === 'PROVIDER';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-body">
      {/* Main White Profile Card (No dark banner above it) */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E3DEC3] relative mt-6">
        {/* Edit Profile Button (Moved to top right of the card) */}
        <div className="absolute top-6 right-6">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 px-4 py-2 border border-[#003153] text-[#003153] hover:bg-[#fffdec] rounded-lg text-sm transition font-medium active:scale-[0.98]"
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-6">
          {/* Avatar Square (Reset margins, no longer overlapping anything) */}
          <div className="w-24 h-24 rounded-2xl bg-[#fffdec] border border-[#003153]/10 shadow-sm flex items-center justify-center text-2xl font-bold text-[#003153] flex-shrink-0 font-heading">
            {profile.business_name ? profile.business_name.substring(0, 2).toUpperCase() : 'BIZ'}
          </div>

          {/* Title & Badges Section */}
          <div className="flex-1 pr-0 sm:pr-32">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full uppercase tracking-wider">
                {profile.role} • {profile.business_type}
              </span>

              {profile.is_verified ? (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>PAN Verified</span>
                </span>
              ) : (
                <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold rounded-full flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  <span>PAN Verification Required</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#003153] font-heading">
              {profile.business_name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-2">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span>{profile.location || profile.city}</span>
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span>Contact: {profile.contact_person}</span>
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span>{profile.phone}</span>
              </span>
            </div>
          </div>
        </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#E3DEC3]">
            <div className="p-3 bg-[#FFFDF6] rounded-xl border border-[#E3DEC3] text-center hospix-stat-card animate-fade-in-up stagger-1">
              <div className="flex items-center justify-center space-x-1 text-[#D99B26] font-extrabold text-xl">
                <Star className="w-5 h-5 fill-[#D99B26] text-[#D99B26]" />
                <span>{profile.rating.toFixed(1)}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                Rating ({profile.reviews_count} reviews)
              </div>
            </div>

            <div className="p-3 bg-[#FFFDF6] rounded-xl border border-[#E3DEC3] text-center hospix-stat-card animate-fade-in-up stagger-2">
              <div className="flex items-center justify-center space-x-1 text-[#082D46] font-extrabold text-xl">
                <CheckCircle2 className="w-5 h-5 text-[#082D46]" />
                <span>{countCompleted}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                Completed Transactions
              </div>
            </div>

            <div className="p-3 bg-[#FFFDF6] rounded-xl border border-[#E3DEC3] text-center hospix-stat-card animate-fade-in-up stagger-3">
              <div className="flex items-center justify-center space-x-1 text-[#2F7D4A] font-extrabold text-xl">
                <ShieldCheck className="w-5 h-5 text-[#2F7D4A]" />
                <span>{Math.round(countTrust)}%</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                B2B Trust Index
              </div>
            </div>

            <div className="p-3 bg-[#FFFDF6] rounded-xl border border-[#E3DEC3] text-center hospix-stat-card animate-fade-in-up stagger-4">
              <div className="text-[#082D46] font-extrabold text-xl">
                {profile.city}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                Operating Hub
              </div>
            </div>
          </div>
        </div>

      {editSuccess && (
        <div className="bg-[#E7F4EA] border border-[#C5E5CE] text-[#2F7D4A] px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <Check className="w-4 h-4 text-[#2F7D4A]" />
          <span>{editSuccess}</span>
        </div>
      )}

      {/* Edit Profile Section */}
      {isEditing && (
        <div className="bg-white p-6 rounded-2xl border border-[#E3DEC3] shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center space-x-2 border-b border-[#E3DEC3] pb-3">
            <Edit3 className="w-5 h-5 text-[#082D46]" />
            <h2 className="text-base font-bold text-[#082D46] font-heading">
              Edit Business Details
            </h2>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.business_name}
                  onChange={(e) => setEditForm({ ...editForm, business_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E3DEC3] rounded-xl text-slate-900 focus:outline-hidden focus:border-[#082D46] focus:ring-1 focus:ring-[#082D46]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Business Type
                </label>
                <select
                  value={editForm.business_type}
                  onChange={(e) => setEditForm({ ...editForm, business_type: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E3DEC3] rounded-xl text-slate-900 focus:outline-hidden focus:border-[#082D46] focus:ring-1 focus:ring-[#082D46]"
                >
                  <option value="hotel">Hotel / Venue</option>
                  <option value="caterer">Caterer</option>
                  <option value="rental">Rental / Inventory Business</option>
                  <option value="event_planner">Event Planner / Seeker</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City / Hub
                </label>
                <select
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E3DEC3] rounded-xl text-slate-900 focus:outline-hidden focus:border-[#082D46] focus:ring-1 focus:ring-[#082D46]"
                >
                  <option value="Thane">Thane</option>
                  <option value="Mulund">Mulund</option>
                  <option value="Bhiwandi">Bhiwandi</option>
                  <option value="Navi Mumbai">Navi Mumbai</option>
                  <option value="Mumbai Central">Mumbai Central</option>
                  <option value="Andheri">Andheri</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={editForm.contact_person}
                  onChange={(e) => setEditForm({ ...editForm, contact_person: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E3DEC3] rounded-xl text-slate-900 focus:outline-hidden focus:border-[#082D46] focus:ring-1 focus:ring-[#082D46]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E3DEC3] rounded-xl text-slate-900 focus:outline-hidden focus:border-[#082D46] focus:ring-1 focus:ring-[#082D46]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Physical Address
                </label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E3DEC3] rounded-xl text-slate-900 focus:outline-hidden focus:border-[#082D46] focus:ring-1 focus:ring-[#082D46]"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-[#E3DEC3] rounded-xl text-xs font-semibold text-slate-600 hover:bg-[#F7F4E9] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="px-5 py-2 bg-[#082D46] hover:bg-[#052338] text-white text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5 disabled:opacity-50 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{editLoading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PAN Verification Module */}
      <div className="bg-white p-6 rounded-2xl border border-[#E3DEC3] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E3DEC3] pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className={`w-5 h-5 ${profile.is_verified ? 'text-[#2F7D4A]' : 'text-[#D99B26]'}`} />
            <div>
              <h2 className="text-base font-bold text-[#082D46] font-heading">
                B2B PAN Verification & Compliance
              </h2>
              <p className="text-xs text-slate-500">
                Government Permanent Account Number verification for trusted B2B hospitality exchange.
              </p>
            </div>
          </div>
          {profile.is_verified && (
            <span className="inline-flex items-center space-x-1 text-xs font-bold px-3 py-1 rounded-full bg-[#E7F4EA] text-[#2F7D4A] border border-[#C5E5CE]">
              <Check className="w-3.5 h-3.5 text-[#2F7D4A]" />
              <span>Verified Organization</span>
            </span>
          )}
        </div>

        {profile.is_verified ? (
          <div className="bg-[#E7F4EA]/50 border border-[#C5E5CE] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-[#246139] uppercase tracking-wider mb-1">
                Active Verified PAN
              </div>
              <div className="font-mono text-base font-bold text-[#2F7D4A] tracking-wider">
                {profile.pan_masked || profile.pan_number || 'VERIFIED'}
              </div>
              <div className="text-xs text-[#246139] mt-0.5">
                This business is legally authenticated. All booking requests & listings carry the verified badge.
              </div>
            </div>
            <div>
              <button
                onClick={() => {
                  setPanInput(profile.pan_number || '');
                  setProfile({ ...profile, is_verified: false });
                }}
                className="text-xs text-[#2F7D4A] hover:text-[#246139] underline font-medium"
              >
                Re-verify / Update PAN
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleVerifyPan} className="bg-[#FFFDF6] border border-[#E3DEC3] rounded-xl p-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Enter 10-Character Business PAN Number
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={panInput}
                  onChange={handlePanChange}
                  placeholder="e.g. ABCDE1234F"
                  className={`flex-1 px-3.5 py-2.5 text-sm bg-white border rounded-xl focus:outline-hidden focus:ring-1 tracking-wider font-mono uppercase transition-colors ${
                    panError
                      ? 'border-[#C81E1E] focus:ring-[#C81E1E]'
                      : 'border-[#E3DEC3] focus:border-[#082D46] focus:ring-[#082D46]'
                  }`}
                />
                <button
                  type="submit"
                  disabled={panLoading || panInput.length !== 10}
                  className="hospix-btn-primary px-6 py-2.5 text-xs font-semibold rounded-xl shadow-xs flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{panLoading ? 'Verifying...' : 'Verify & Activate Badge'}</span>
                </button>
              </div>
              {panError && (
                <p className="mt-1.5 text-xs text-[#C81E1E] font-medium font-body flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{panError}</span>
                </p>
              )}
              {panSuccess && (
                <p className="mt-1.5 text-xs text-[#2F7D4A] font-medium font-body flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{panSuccess}</span>
                </p>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Standard format: 5 uppercase letters, 4 numeric digits, 1 uppercase letter (e.g. <code>ABCDE1234F</code>).
            </p>
          </form>
        )}
      </div>

      {/* Role-Specific Content: PROVIDER RESOURCES */}
      {isProvider && (
        <div className="bg-white p-6 rounded-2xl border border-[#E3DEC3] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E3DEC3] pb-3">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-[#082D46]" />
              <div>
                <h2 className="text-base font-bold text-[#082D46] font-heading">
                  Provider Inventory Portfolio ({profile.resources ? profile.resources.length : 0})
                </h2>
                <p className="text-xs text-slate-500">
                  Live inventory available for single-order and multi-provider pooled fulfillment.
                </p>
              </div>
            </div>
          </div>

          {!profile.resources || profile.resources.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No inventory listed. Go to the Inventory tab to add your hospitality items.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.resources.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-[#E3DEC3] hover:border-[#D5CFB3] bg-white hover:shadow-md transition-all flex gap-4 group"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-[#E3DEC3] shrink-0">
                    <img
                      src={getResourceImage(item.name, item.category)}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-[#082D46] text-sm font-heading line-clamp-1">
                          {item.name}
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F7F4E9] text-slate-700 font-medium border border-[#E3DEC3]">
                          {item.category}
                        </span>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-extrabold text-[#082D46]">
                          {item.pricing}
                        </div>
                        <span
                          className={`inline-block mt-0.5 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            item.availability === 'AVAILABLE'
                              ? 'bg-[#E7F4EA] text-[#2F7D4A] border border-[#C5E5CE]'
                              : item.availability === 'PARTIAL'
                              ? 'bg-[#FFF3D4] text-[#8C6214] border border-[#F0D597]'
                              : 'bg-[#FDF2F2] text-[#9B1C1C] border border-[#F8B4B4]'
                          }`}
                        >
                          {item.availability}
                        </span>
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {item.description}
                      </p>
                    )}

                    <div className="pt-2 border-t border-[#E3DEC3] flex items-center justify-between text-xs text-slate-600">
                      <span className="flex items-center space-x-1">
                        <span className="font-medium text-slate-500">Live:</span>
                        <span className="font-bold text-[#2F7D4A]">{item.available_quantity}</span>
                        <span className="text-slate-400">/{item.total_quantity}</span>
                      </span>

                      {item.delivery_available && (
                        <span className="flex items-center space-x-1 text-slate-500">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          <span>₹{item.delivery_charge}</span>
                        </span>
                      )}

                      <span className="text-slate-400 font-medium text-[11px]">
                        {item.condition}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Role-Specific Content: SEEKER REQUIREMENTS */}
      {!isProvider && (
        <div className="bg-white p-6 rounded-2xl border border-[#E3DEC3] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E3DEC3] pb-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-[#082D46]" />
              <div>
                <h2 className="text-base font-bold text-[#082D46] font-heading">
                  Seeker Event Requirements ({profile.total_requirements || 0})
                </h2>
                <p className="text-xs text-slate-500">
                  Requirements posted for single-source or pooled supplier fulfillment.
                </p>
              </div>
            </div>
          </div>

          {!profile.recent_requirements || profile.recent_requirements.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No event requirements posted yet.
            </div>
          ) : (
            <div className="space-y-3">
              {profile.recent_requirements.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl border border-[#E3DEC3] bg-[#FFFDF6] flex items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-3.5">
                    <img
                      src={getResourceImage(req.title, req.category)}
                      alt={req.title}
                      className="w-12 h-12 rounded-xl object-cover border border-[#E3DEC3] shrink-0"
                      loading="lazy"
                    />
                    <div>
                      <div className="font-bold text-[#082D46] text-sm">{req.title}</div>
                      <div className="text-xs text-slate-500 flex items-center space-x-3 mt-0.5">
                        <span className="font-medium text-slate-700">{req.category}</span>
                        <span>•</span>
                        <span>Needed: <strong>{req.quantity}</strong> units</span>
                        <span>•</span>
                        <span>Date: <strong>{req.date}</strong></span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#EBF2F7] text-[#082D46] border border-[#D0E2ED] shrink-0">
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
