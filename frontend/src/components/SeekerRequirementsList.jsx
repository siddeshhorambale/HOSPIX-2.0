import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getResourceImage } from '../data/resourceImages';
import {
  ClipboardList,
  Calendar,
  MapPin,
  IndianRupee,
  Layers,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Package
} from 'lucide-react';

export const SeekerRequirementsList = ({ onSelectRequirement, onCreateNew }) => {
  const { user } = useAuth();
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const data = await api.get('/requirements');
      setRequirements(data);
    } catch (err) {
      console.error('Failed to load requirements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to cancel this requirement?')) return;
    try {
      await api.delete(`/requirements/${id}`);
      fetchRequirements();
    } catch (err) {
      alert('Error deleting requirement: ' + err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 font-body">
      {/* Top Welcome Header (Matches Screen 5 in reference) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#082D46] font-heading tracking-tight">
            Good day, {user?.business?.name || user?.full_name || 'Event Seeker'}!
          </h1>
          <p className="text-xs sm:text-sm text-[#596B76] mt-1">
            Here's what's happening with your event resource requirements.
          </p>
        </div>
        <button
          onClick={onCreateNew}
          className="hospix-btn-primary px-5 py-2.5 rounded-xl shadow-xs text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Post Requirement</span>
        </button>
      </div>

      {/* Quick Metrics Bar (Matches Screen 5) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="hospix-stat-card p-4 text-center">
          <div className="text-2xl font-extrabold text-[#082D46] font-heading">
            {requirements.length}
          </div>
          <div className="text-[11px] text-[#596B76] font-medium mt-0.5">
            Active Requirements
          </div>
        </div>
        <div className="hospix-stat-card p-4 text-center">
          <div className="text-2xl font-extrabold text-[#8C6A00] font-heading">
            {requirements.filter(r => r.status === 'OPEN').length}
          </div>
          <div className="text-[11px] text-[#596B76] font-medium mt-0.5">
            Open for Matches
          </div>
        </div>
        <div className="hospix-stat-card p-4 text-center">
          <div className="text-2xl font-extrabold text-[#2F7D4A] font-heading">
            {requirements.filter(r => r.status === 'MATCHED' || r.status === 'FULFILLED').length}
          </div>
          <div className="text-[11px] text-[#596B76] font-medium mt-0.5">
            Matched Solutions
          </div>
        </div>
        <div className="hospix-stat-card p-4 text-center">
          <div className="text-2xl font-extrabold text-[#082D46] font-heading">
            {user?.business?.city || 'Thane Hub'}
          </div>
          <div className="text-[11px] text-[#596B76] font-medium mt-0.5">
            Primary Hub
          </div>
        </div>
      </div>

      {/* Requirements List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#E7E5DC] pb-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#082D46] font-heading">
            Active Event Requirements ({requirements.length})
          </h2>
          <span className="text-xs text-[#596B76]">Click any card to inspect single & pooled matches</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="hospix-card p-4.5 flex items-center space-x-3.5 animate-fade-in">
                <div className="w-14 h-14 rounded-xl hospix-skeleton shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 hospix-skeleton w-1/3 rounded-md"></div>
                  <div className="h-3 hospix-skeleton w-2/3 rounded-md"></div>
                  <div className="h-3 hospix-skeleton w-1/2 rounded-md"></div>
                </div>
              </div>
            ))}
          </div>
        ) : requirements.length === 0 ? (
          <div className="hospix-card p-12 text-center space-y-4 animate-fade-in">
            <ClipboardList className="w-12 h-12 text-[#8A979D] mx-auto" />
            <div>
              <h3 className="text-base font-bold text-[#082D46] font-heading">
                No active event requirements
              </h3>
              <p className="text-xs text-[#596B76] mt-1 max-w-sm mx-auto">
                Describe the items you need for an upcoming wedding, corporate seminar, or private banquet.
              </p>
            </div>
            <button
              onClick={onCreateNew}
              className="hospix-btn-primary px-6 py-2.5 rounded-xl shadow-xs text-xs inline-flex group"
            >
              <Sparkles className="w-4 h-4 text-[#F4D98A]" />
              <span>Create Requirement with AI</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {requirements.map((req, idx) => {
              const firstItem = req.items && req.items[0];
              const thumbImg = getResourceImage(firstItem?.resource_type);
              const staggerClass = idx === 0 ? 'stagger-1' : idx === 1 ? 'stagger-2' : idx === 2 ? 'stagger-3' : 'stagger-4';

              return (
                <div
                  key={req.id}
                  onClick={() => onSelectRequirement(req)}
                  className={`hospix-card-hover p-4.5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-up ${staggerClass} group`}
                >
                  <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                    {/* Item Thumbnail with Tactile Zoom */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-[#E7E5DC] shrink-0 bg-white shadow-2xs hospix-img-container">
                      <img
                        src={thumbImg}
                        alt="Event resource"
                        className="w-full h-full object-cover hospix-resource-img"
                      />
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#E8F2F6] text-[#082D46] border border-[#D0E4ED]">
                          {req.event_type || 'Event'}
                        </span>
                        <span className="text-[10px] font-mono text-[#8A979D]">
                          #{req.id}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E7F4EA] text-[#2F7D4A] border border-[#CDE6D3]">
                          {req.status}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-[#082D46] font-heading truncate">
                        {req.title}
                      </h3>

                      {/* Items Pills */}
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {req.items.map((it) => (
                          <span
                            key={it.id}
                            className="text-[11px] px-2.5 py-0.5 bg-[#FCFAF3] text-[#082D46] rounded-md font-semibold border border-[#E7E5DC] capitalize"
                          >
                            {it.quantity} × {it.resource_type}
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#596B76] pt-1">
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-[#8A979D]" />
                          <span>{req.location_city}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-[#8A979D]" />
                          <span>{req.event_date}</span>
                        </span>
                        <span className="flex items-center space-x-1 font-semibold text-[#082D46]">
                          <IndianRupee className="w-3.5 h-3.5 text-[#8A979D]" />
                          <span>Budget: ₹{req.budget.toLocaleString()}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end space-x-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#E7E5DC]">
                    <button
                      type="button"
                      onClick={(e) => handleDelete(req.id, e)}
                      className="hospix-icon-btn p-2 text-[#8A979D] hover:text-rose-600 hover:bg-rose-50"
                      title="Cancel requirement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="hospix-btn-primary px-4 py-2 text-xs rounded-xl shadow-xs"
                    >
                      <span>View Matches</span>
                      <ArrowRight className="w-3.5 h-3.5 hospix-arrow" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
