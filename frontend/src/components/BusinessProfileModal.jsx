import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getResourceImage } from '../data/resourceImages';
import {
  X,
  Building2,
  ShieldCheck,
  Star,
  MapPin,
  CheckCircle2,
  Package,
  Clock,
  Truck,
  AlertCircle,
  Tag
} from 'lucide-react';

export const BusinessProfileModal = ({ businessId, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!businessId) return;
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/profile/business/${businessId}`);
        setProfile(res);
      } catch (err) {
        setError(err.message || 'Failed to load business profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [businessId]);

  if (!businessId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto hospix-modal-backdrop flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E7E5DC] w-full max-w-2xl overflow-hidden hospix-modal-dialog">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#052338] via-[#082D46] to-[#0A395A] text-white p-6 relative">
          <button
            onClick={onClose}
            className="hospix-icon-btn absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>

          {loading ? (
            <div className="py-8 text-center text-slate-300 animate-pulse text-sm">
              Loading business profile...
            </div>
          ) : error ? (
            <div className="py-6 text-center text-red-300 text-sm flex items-center justify-center space-x-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/15 text-white border border-white/20">
                  {profile.business_type}
                </span>

                {profile.is_verified ? (
                  <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E7F4EA]/25 text-[#E7F4EA] border border-[#E7F4EA]/40">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#E7F4EA]" />
                    <span>PAN Verified Business</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-white/10 text-white/80">
                    <span>Unverified Profile</span>
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-bold tracking-tight font-heading text-white">
                {profile.business_name}
              </h2>

              <div className="flex items-center text-xs text-slate-300 mt-1 space-x-4">
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{profile.location}</span>
                </span>
                {profile.contact_person && (
                  <span className="hidden sm:inline text-slate-400">
                    Contact: {profile.contact_person}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content Body */}
        {!loading && profile && (
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 bg-[#FCFAF3] p-4 rounded-xl border border-[#E7E5DC]">
              <div className="text-center hospix-stat-card p-2 rounded-lg">
                <div className="flex items-center justify-center space-x-1 text-[#D99B26] font-bold text-lg">
                  <Star className="w-4 h-4 fill-[#D99B26] text-[#D99B26]" />
                  <span>{profile.rating.toFixed(1)}</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Rating ({profile.reviews_count} reviews)
                </div>
              </div>

              <div className="text-center border-x border-[#E7E5DC] hospix-stat-card p-2 rounded-lg">
                <div className="flex items-center justify-center space-x-1 text-[#082D46] font-bold text-lg">
                  <CheckCircle2 className="w-4 h-4 text-[#082D46]" />
                  <span>{profile.completed_transactions}</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Completed Transactions
                </div>
              </div>

              <div className="text-center hospix-stat-card p-2 rounded-lg">
                <div className="flex items-center justify-center space-x-1 text-[#2F7D4A] font-bold text-lg">
                  <ShieldCheck className="w-4 h-4 text-[#2F7D4A]" />
                  <span>{profile.trust_score.toFixed(0)}%</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Trust Score
                </div>
              </div>
            </div>

            {/* Resources Section (For Providers) */}
            {profile.is_provider && profile.resources && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-[#082D46]" />
                    <h3 className="text-sm font-bold text-[#082D46] uppercase tracking-wider font-heading">
                      Available Resources & Pricing ({profile.resources.length})
                    </h3>
                  </div>
                </div>

                {profile.resources.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-3 text-center bg-[#FCFAF3] rounded-xl border border-[#E7E5DC]">
                    No active resources listed currently.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {profile.resources.map((res) => (
                      <div
                        key={res.id}
                        className="p-3.5 rounded-2xl border border-[#E7E5DC] bg-white hover:border-[#D0E4ED] hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs group"
                      >
                        <div className="flex items-center space-x-3.5 flex-1 min-w-0">
                          <div className="w-14 h-14 rounded-xl overflow-hidden border border-[#E7E5DC] shrink-0">
                            <img
                              src={getResourceImage(res.name, res.category)}
                              alt={res.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-bold text-[#082D46] text-sm">
                                {res.name}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8F2F6] text-[#082D46] font-semibold">
                                {res.category}
                              </span>
                            </div>
                            {res.description && (
                              <p className="text-xs text-slate-500 line-clamp-1 mb-1.5">
                                {res.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                              <span className="flex items-center space-x-1">
                                <span className="font-semibold text-slate-700">Stock:</span>
                                <span className="text-[#2F7D4A] font-bold">{res.available_quantity}</span>
                                <span className="text-slate-400">/ {res.total_quantity} units</span>
                              </span>
                              {res.delivery_available && (
                                <span className="flex items-center space-x-1 text-slate-500">
                                  <Truck className="w-3 h-3 text-slate-400" />
                                  <span>₹{res.delivery_charge} delivery</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Pricing & Availability Column */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-[#E7E5DC]">
                          <div className="text-right">
                            <div className="text-sm font-extrabold text-[#082D46]">
                              {res.pricing}
                            </div>
                          </div>
                          <span
                            className={`mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              res.availability === 'AVAILABLE'
                                ? 'bg-[#E7F4EA] text-[#2F7D4A] border border-[#C5E5CE]'
                                : res.availability === 'PARTIAL'
                                ? 'bg-[#FFF3D4] text-[#8C6214] border border-[#F0D597]'
                                : 'bg-[#FDF2F2] text-[#9B1C1C] border border-[#F8B4B4]'
                            }`}
                          >
                            {res.availability}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* If Seeker profile */}
            {!profile.is_provider && (
              <div className="bg-[#FCFAF3] p-4 rounded-xl border border-[#E7E5DC] space-y-2">
                <h4 className="text-xs font-bold text-[#082D46] uppercase tracking-wider font-heading">
                  Seeker Credentials
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Verified event organization active on HOSPIX platform with verified PAN authentication, authorized for bulk resource bookings and multi-provider pooling requests.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="bg-[#FCFAF3] px-6 py-3.5 border-t border-[#E7E5DC] flex justify-end">
          <button
            onClick={onClose}
            className="hospix-btn-primary px-5 py-2 text-xs font-semibold rounded-xl shadow-xs active:scale-[0.98]"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};

