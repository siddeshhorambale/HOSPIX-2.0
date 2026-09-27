import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BookingStateTracker } from './BookingStateTracker';
import { BusinessProfileModal } from './BusinessProfileModal';
import { getResourceImage } from '../data/resourceImages';
import {
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  IndianRupee,
  Truck,
  Building2,
  MessageSquare,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  History,
  Package,
  ArrowRight,
  RefreshCw,
  Box,
  TruckIcon,
} from 'lucide-react';

const STATUS_BADGES = {
  PENDING: { label: 'Pending Review', color: 'bg-[#FFF3D4] text-[#8C6214] border-[#F0D597] font-semibold' },
  ACCEPTED: { label: 'Terms Accepted', color: 'bg-[#EBF2F7] text-[#082D46] border-[#D0E2ED] font-semibold' },
  COUNTER_OFFER: { label: 'Counter-Offer Proposed', color: 'bg-[#F2EFFB] text-[#553C9A] border-[#D6BCFA] font-semibold' },
  CONFIRMED: { label: 'Confirmed & Inventory Reserved', color: 'bg-[#E7F4EA] text-[#2F7D4A] border-[#C5E5CE] font-semibold' },
  FULFILMENT: { label: 'Fulfilment & Dispatch Active', color: 'bg-[#EBF2F7] text-[#082D46] border-[#082D46]/20 font-semibold' },
  COMPLETED: { label: 'Order Completed', color: 'bg-[#082D46] text-white border-[#082D46] font-semibold' },
  REJECTED: { label: 'Declined', color: 'bg-[#FDF2F2] text-[#9B1C1C] border-[#F8B4B4] font-semibold' },
  CANCELLED: { label: 'Cancelled', color: 'bg-[#F7F4E9] text-slate-600 border-[#E3DEC3] font-semibold' },
};

export const BookingsManagementView = () => {
  const { user } = useAuth();
  const isProvider = user?.role === 'PROVIDER';

  const [requests, setRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Availability Conflict Error State (Graceful Error Component)
  const [conflictError, setConflictError] = useState(null);

  // Counter-offer modal for provider
  const [counterModalOpen, setCounterModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [counterQty, setCounterQty] = useState(0);
  const [counterPrice, setCounterPrice] = useState(0);
  const [counterDate, setCounterDate] = useState('');
  const [counterDelivery, setCounterDelivery] = useState(0);
  const [counterNotes, setCounterNotes] = useState('');
  const [selectedBusinessId, setSelectedBusinessId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const reqEndpoint = isProvider ? '/bookings/requests/incoming' : '/bookings/requests/outgoing';
      const [reqData, bookData] = await Promise.all([
        api.get(reqEndpoint),
        api.get('/bookings'),
      ]);
      setRequests(reqData);
      setBookings(bookData);
    } catch (err) {
      console.error('Failed to load bookings data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isProvider]);

  // Provider actions
  const handleAcceptRequest = async (id) => {
    setActionLoading(id);
    try {
      await api.post(`/bookings/requests/${id}/accept`);
      await fetchData();
    } catch (err) {
      alert('Error accepting request: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (id) => {
    if (!window.confirm('Are you sure you want to decline this request?')) return;
    setActionLoading(id);
    try {
      await api.post(`/bookings/requests/${id}/reject`);
      await fetchData();
    } catch (err) {
      alert('Error rejecting request: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const openCounterModal = (req) => {
    setSelectedRequest(req);
    setCounterQty(req.requested_quantity);
    setCounterPrice(req.unit_price);
    setCounterDate(req.booking_date || '');
    setCounterDelivery(req.delivery_charge);
    setCounterNotes('Updated terms for requested date/time inventory availability');
    setCounterModalOpen(true);
  };

  const handleSubmitCounterOffer = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/bookings/requests/${selectedRequest.id}/counter-offer`, {
        counter_quantity: Number(counterQty),
        counter_price: Number(counterPrice),
        counter_date: counterDate || undefined,
        counter_delivery_charge: Number(counterDelivery),
        notes: counterNotes,
      });
      setCounterModalOpen(false);
      await fetchData();
    } catch (err) {
      alert('Error submitting counter-offer: ' + err.message);
    }
  };

  // Seeker actions
  const handleAcceptCounterOffer = async (reqId, counterId) => {
    setActionLoading(reqId);
    try {
      await api.post(`/bookings/requests/${reqId}/counter/${counterId}/accept`);
      await fetchData();
    } catch (err) {
      alert('Error accepting counter offer: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Transactional Confirmation with Conflict Catching
  const handleConfirmBooking = async (reqId) => {
    setActionLoading(reqId);
    setConflictError(null);
    try {
      await api.post(`/bookings/requests/${reqId}/confirm`);
      await fetchData();
    } catch (err) {
      const errMsg = err.message || '';
      if (
        errMsg.includes('no longer available') ||
        errMsg.includes('Insufficient inventory') ||
        errMsg.includes('409')
      ) {
        setConflictError(
          'This resource is no longer available for the selected time. Refreshing available options...'
        );
        // Refresh data to reflect state
        setTimeout(() => {
          fetchData();
        }, 1500);
      } else {
        alert('Booking confirmation failed: ' + errMsg);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateBookingState = async (bookingId, newState) => {
    setActionLoading(bookingId);
    try {
      await api.put(`/bookings/${bookingId}/state?target_status=${newState}`);
      await fetchData();
    } catch (err) {
      alert('Failed to update booking status: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Cancel this confirmed booking? Reserved inventory will be returned.')) return;
    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      await fetchData();
    } catch (err) {
      alert('Error cancelling booking: ' + err.message);
    }
  };

  // Segregate booking lifecycle states to eliminate overlap:
  // 1. Pending & Negotiation Requests: What Needs Action / Decision
  const pendingRequests = requests.filter((r) =>
    ['PENDING', 'COUNTER_OFFER', 'ACCEPTED'].includes(r.status)
  );

  // 2. Active Bookings: What is Already Active & Confirmed (Fulfillment Operations)
  const activeBookings = bookings.filter((b) =>
    ['CONFIRMED', 'FULFILMENT'].includes(b.status)
  );

  // 3. Past Records: Historical archive
  const pastBookings = bookings.filter((b) =>
    ['COMPLETED', 'CANCELLED'].includes(b.status)
  );
  const pastRequests = requests.filter((r) =>
    ['REJECTED', 'CANCELLED'].includes(r.status)
  );
  const totalHistoryCount = pastBookings.length + pastRequests.length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 font-body">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-[#082D46] font-heading tracking-tight">
          {isProvider ? 'Incoming Booking Requests' : 'Booking Management & Tracker'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Transactional State Machine: <span className="font-semibold text-[#082D46]">REQUEST</span> ✓ → <span className="font-semibold text-[#082D46]">COUNTER-OFFER</span> ✓ → <span className="font-semibold text-[#2F7D4A]">CONFIRMED</span> ✓ → <span className="font-semibold text-[#082D46]">FULFILMENT</span> → <span className="font-semibold text-[#082D46]">COMPLETED</span>
        </p>
      </div>

      {/* Graceful Error State: Inventory Conflict Notice */}
      {conflictError && (
        <div className="mb-6 p-4 rounded-2xl bg-[#FDF2F2] border border-[#F8B4B4] text-[#9B1C1C] shadow-xs flex items-start justify-between gap-3 animate-fade-in">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-[#C81E1E] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-[#771D1D] font-heading">
                Availability Conflict
              </h4>
              <p className="text-xs font-semibold text-[#9B1C1C] mt-0.5">
                {conflictError}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setConflictError(null);
              fetchData();
            }}
            className="px-3 py-1.5 text-xs font-bold text-[#771D1D] bg-[#FDE8E8] hover:bg-[#FBD5D5] rounded-xl flex items-center space-x-1 transition-colors shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Options</span>
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="p-4 bg-[#FCFAF3] rounded-2xl border border-[#E7E5DC] flex items-center space-x-3 text-xs text-[#082D46] font-medium animate-pulse">
            <RefreshCw className="w-4 h-4 text-[#082D46] shrink-0 animate-spin" />
            <span>Checking transactional inventory and reservation states...</span>
          </div>
          <div className="space-y-3">
            {[1, 2].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-[#E7E5DC] p-6 space-y-4">
                <div className="h-6 w-48 hospix-skeleton" />
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 hospix-skeleton rounded-xl shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-3/4 hospix-skeleton" />
                    <div className="h-3 w-1/2 hospix-skeleton" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : requests.length === 0 && bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E7E5DC] p-12 text-center shadow-xs">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#082D46] font-heading">No active booking requests</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {isProvider
              ? 'When seekers match with your inventory, booking requests will appear here.'
              : 'Match a requirement first to send coordinated booking requests to suppliers.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Real Metrics KPI Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white p-4.5 rounded-2xl border border-[#E7E5DC] shadow-xs hospix-stat-card animate-fade-in-up stagger-1">
              <div className="text-[10px] font-bold text-[#596B76] uppercase tracking-wider">
                {isProvider ? 'Needs Review' : 'Pending Requests'}
              </div>
              <div className="text-2xl font-extrabold text-[#D99B26] font-heading mt-1">
                {isProvider
                  ? pendingRequests.filter((r) => r.status === 'PENDING').length
                  : pendingRequests.filter((r) => r.status === 'COUNTER_OFFER' || r.status === 'ACCEPTED').length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {isProvider ? 'Awaiting your action' : 'Action needed from you'}
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-[#E7E5DC] shadow-xs hospix-stat-card animate-fade-in-up stagger-2">
              <div className="text-[10px] font-bold text-[#596B76] uppercase tracking-wider">
                In Negotiation
              </div>
              <div className="text-2xl font-extrabold text-[#553C9A] font-heading mt-1">
                {pendingRequests.filter((r) => r.status === 'COUNTER_OFFER').length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {isProvider ? 'Awaiting seeker reply' : 'Review terms'}
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-[#E7E5DC] shadow-xs hospix-stat-card animate-fade-in-up stagger-3">
              <div className="text-[10px] font-bold text-[#596B76] uppercase tracking-wider">
                Active Bookings
              </div>
              <div className="text-2xl font-extrabold text-[#2F7D4A] font-heading mt-1">
                {activeBookings.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Confirmed & Dispatch</div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-[#E7E5DC] shadow-xs hospix-stat-card animate-fade-in-up stagger-4">
              <div className="text-[10px] font-bold text-[#596B76] uppercase tracking-wider">
                Total Orders
              </div>
              <div className="text-2xl font-extrabold text-[#082D46] font-heading mt-1">
                {bookings.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {bookings.filter((b) => b.status === 'COMPLETED').length} Completed
              </div>
            </div>
          </div>

          {/* ============================================================
              SECTION 1: BOOKING REQUESTS & NEGOTIATIONS (ACTION REQUIRED)
          ============================================================ */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-[#082D46] font-heading flex items-center space-x-2">
                <Clock className="w-4 h-4 text-[#D99B26]" />
                <span>
                  {isProvider ? 'Incoming Requests Requiring Action' : 'Pending Requests & Negotiations'} ({pendingRequests.length})
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Requests currently awaiting review, counter-offer terms, or initial confirmation.
              </p>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E7E5DC] p-8 text-center shadow-xs">
                <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-[#082D46] font-heading">
                  No requests requiring action
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 max-w-sm mx-auto">
                  {isProvider
                    ? 'All incoming booking requests have been handled. New requests will appear here.'
                    : 'No pending requests. Active confirmed orders are tracked below.'}
                </p>
              </div>
            ) : (
              pendingRequests.map((req, reqIdx) => {
                const statusConfig = STATUS_BADGES[req.status] || {
                  label: req.status,
                  color: 'bg-[#F7F4E9] text-slate-700 border-[#E3DEC3]',
                };
                const latestCounter = req.counter_offers?.[req.counter_offers.length - 1];
                const staggerClass = `stagger-${Math.min((reqIdx % 6) + 1, 6)}`;

                return (
                  <div
                    key={req.id}
                    className={`bg-white rounded-2xl border border-[#E7E5DC] shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md hover:border-[#D5CFB3] animate-fade-in-up ${staggerClass} group`}
                  >
                    {/* Visual State Progression Tracker */}
                    <div className="px-6 pt-5 pb-3 bg-[#FFFDF6] border-b border-[#E7E5DC]">
                      <BookingStateTracker
                        currentStatus={req.status}
                        hasCounterOffer={req.counter_offers && req.counter_offers.length > 0}
                      />
                    </div>

                    {/* Request Header with Thumbnail */}
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FCFAF3]/60 border-b border-[#E7E5DC]">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-[#E7E5DC] shrink-0">
                          <img
                            src={getResourceImage(req.resource_name)}
                            alt={req.resource_name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className={`text-[11px] px-2.5 py-0.5 rounded-full uppercase border ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                            <span className="text-xs text-slate-400 font-semibold">Request #{req.id}</span>
                          </div>

                          <h3 className="text-lg font-bold text-[#082D46] font-heading">{req.resource_name}</h3>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                            <span className="font-semibold text-slate-800 flex items-center space-x-1">
                              <span>{isProvider ? `Seeker: ${req.seeker_name}` : `Provider: ${req.provider_name}`}</span>
                              <button
                                type="button"
                                onClick={() => setSelectedBusinessId(isProvider ? req.seeker_id : req.provider_id)}
                                className="text-[11px] text-[#082D46] hover:underline font-bold ml-1 cursor-pointer transition-colors"
                              >
                                (Profile)
                              </button>
                            </span>
                            <span>•</span>
                            <span>Event Date: <strong className="text-slate-800">{req.booking_date}</strong></span>
                            <span>•</span>
                            <span>Time: {req.start_time} - {req.end_time}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right sm:self-center shrink-0">
                        <div className="text-xl font-bold text-[#082D46] font-heading">
                          ₹{req.total_price.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500">
                          {req.requested_quantity} units @ ₹{req.unit_price}/day
                          {req.delivery_charge > 0 && ` + ₹${req.delivery_charge} delivery`}
                        </div>
                      </div>
                    </div>

                    {/* Counter Offer Box (Side-by-Side Comparison) */}
                    {req.status === 'COUNTER_OFFER' && latestCounter && (
                      <div className="p-5 bg-[#FAF7FD] border-b border-[#D6BCFA] space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="p-1.5 rounded-lg bg-[#E9D8FD] text-[#553C9A]">
                              <RotateCcw className="w-4 h-4 text-[#553C9A]" />
                            </span>
                            <div>
                              <h4 className="text-xs font-bold text-[#44337A] font-heading uppercase tracking-wide">
                                {isProvider ? 'Your Proposed Counter-Offer' : 'Counter-Offer Proposed by Provider'}
                              </h4>
                              <p className="text-[11px] text-slate-500">
                                {isProvider
                                  ? `You proposed revised terms to ${req.seeker_name}. Awaiting seeker decision.`
                                  : `${req.provider_name} proposed adjusted terms for your review.`}
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#E9D8FD] text-[#553C9A] border border-[#D6BCFA] self-start sm:self-auto">
                            {isProvider ? 'Awaiting Seeker Response' : 'Action Required from You'}
                          </span>
                        </div>

                        {/* Side-by-Side Terms Comparison Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                          <div className="p-2.5 bg-white rounded-xl border border-[#E9D8FD]">
                            <div className="text-[10px] uppercase font-bold text-slate-400">Quantity</div>
                            <div className="flex items-center space-x-1.5 mt-0.5 text-xs">
                              <span className="text-slate-400 line-through">{req.requested_quantity}</span>
                              <ArrowRight className="w-3 h-3 text-[#553C9A]" />
                              <span className="font-bold text-[#44337A]">{latestCounter.counter_quantity} units</span>
                            </div>
                          </div>
                          <div className="p-2.5 bg-white rounded-xl border border-[#E9D8FD]">
                            <div className="text-[10px] uppercase font-bold text-slate-400">Daily Rate</div>
                            <div className="flex items-center space-x-1.5 mt-0.5 text-xs">
                              <span className="text-slate-400 line-through">₹{req.unit_price}</span>
                              <ArrowRight className="w-3 h-3 text-[#553C9A]" />
                              <span className="font-bold text-[#44337A]">₹{latestCounter.counter_price}</span>
                            </div>
                          </div>
                          <div className="p-2.5 bg-white rounded-xl border border-[#E9D8FD]">
                            <div className="text-[10px] uppercase font-bold text-slate-400">Event Date</div>
                            <div className="flex items-center space-x-1.5 mt-0.5 text-xs">
                              {latestCounter.counter_date && latestCounter.counter_date !== req.booking_date ? (
                                <>
                                  <span className="text-slate-400 line-through">{req.booking_date}</span>
                                  <ArrowRight className="w-3 h-3 text-[#553C9A]" />
                                  <span className="font-bold text-[#44337A]">{latestCounter.counter_date}</span>
                                </>
                              ) : (
                                <span className="font-bold text-slate-700">{req.booking_date}</span>
                              )}
                            </div>
                          </div>
                          <div className="p-2.5 bg-white rounded-xl border border-[#E9D8FD]">
                            <div className="text-[10px] uppercase font-bold text-slate-400">Delivery</div>
                            <div className="flex items-center space-x-1.5 mt-0.5 text-xs">
                              {latestCounter.counter_delivery_charge !== req.delivery_charge ? (
                                <>
                                  <span className="text-slate-400 line-through">₹{req.delivery_charge}</span>
                                  <ArrowRight className="w-3 h-3 text-[#553C9A]" />
                                  <span className="font-bold text-[#44337A]">₹{latestCounter.counter_delivery_charge}</span>
                                </>
                              ) : (
                                <span className="font-bold text-slate-700">₹{req.delivery_charge}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {latestCounter.notes && (
                          <div className="text-xs bg-white/80 p-2.5 rounded-xl border border-[#E9D8FD] text-[#553C9A] flex items-start space-x-2">
                            <MessageSquare className="w-3.5 h-3.5 text-[#553C9A] shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-[#44337A]">Provider's Note: </span>
                              <span className="italic text-slate-700">"{latestCounter.notes}"</span>
                            </div>
                          </div>
                        )}

                        {/* Seeker Actions on Counter Offer */}
                        {!isProvider && (
                          <div className="flex items-center justify-end space-x-2 pt-1">
                            <button
                              onClick={() => handleRejectRequest(req.id)}
                              disabled={actionLoading === req.id}
                              className="px-3.5 py-1.5 text-xs font-semibold text-[#9B1C1C] bg-white border border-[#F8B4B4] hover:bg-[#FDF2F2] rounded-xl transition-colors active:scale-[0.98]"
                            >
                              Decline Counter-Offer
                            </button>
                            <button
                              onClick={() => handleAcceptCounterOffer(req.id, latestCounter.id)}
                              disabled={actionLoading === req.id}
                              className="px-4 py-1.5 text-xs font-bold text-white bg-[#553C9A] hover:bg-[#44337A] rounded-xl transition-colors shadow-xs active:scale-[0.98]"
                            >
                              Accept Counter-Offer Terms
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Request Actions Bar */}
                    <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-white">
                      <div className="text-slate-500">
                        {req.status === 'ACCEPTED' ? (
                          <span className="text-[#082D46] font-medium">
                            Terms agreed! Confirm booking now to lock the inventory in the database.
                          </span>
                        ) : req.status === 'COUNTER_OFFER' ? (
                          <span className="text-[#553C9A] font-medium">
                            {isProvider
                              ? `Counter-offer submitted. Awaiting decision from ${req.seeker_name}.`
                              : 'Counter-offer pending your review. Accept to proceed or decline.'}
                          </span>
                        ) : (
                          <span>{isProvider ? 'Awaiting your response or counter-offer proposal.' : 'Awaiting provider response or counter-offer negotiation.'}</span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 justify-end">
                        {/* Provider Actions */}
                        {isProvider && req.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => openCounterModal(req)}
                              className="px-3.5 py-1.5 font-semibold text-[#082D46] bg-[#E8F2F6] hover:bg-[#D0E4ED] border border-[#D0E4ED] rounded-xl transition-all active:scale-[0.98]"
                            >
                              Counter-Offer
                            </button>
                            <button
                              onClick={() => handleRejectRequest(req.id)}
                              className="px-3.5 py-1.5 font-semibold text-[#9B1C1C] bg-[#FDF2F2] hover:bg-[#FDE8E8] border border-[#F8B4B4] rounded-xl transition-all active:scale-[0.98]"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => handleAcceptRequest(req.id)}
                              disabled={actionLoading === req.id}
                              className="hospix-btn-primary px-4 py-1.5 font-bold text-xs rounded-xl shadow-xs"
                            >
                              Accept Request
                            </button>
                          </>
                        )}

                        {/* Final Confirmation Button */}
                        {(req.status === 'ACCEPTED' || (!isProvider && req.status === 'PENDING')) && (
                          <button
                            onClick={() => handleConfirmBooking(req.id)}
                            disabled={actionLoading === req.id}
                            className="inline-flex items-center space-x-1.5 px-4 py-2 font-bold text-white bg-[#2F7D4A] hover:bg-[#246139] rounded-xl shadow-xs transition-all active:scale-[0.98]"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Confirm & Lock Inventory</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ============================================================
              SECTION 2: CONFIRMED & ACTIVE BOOKINGS (FULFILMENT OPERATIONS)
          ============================================================ */}
          <div className="mt-8 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-[#082D46] font-heading flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-[#2F7D4A]" />
                <span>Confirmed & Active Bookings ({activeBookings.length})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Guaranteed reservations with inventory locked transactionally. Manage logistics dispatch and fulfilment.
              </p>
            </div>

            {activeBookings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E7E5DC] p-8 text-center shadow-xs">
                <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-[#082D46] font-heading">
                  No active bookings in fulfilment
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 max-w-sm mx-auto">
                  Confirmed bookings ready for delivery dispatch or pickup will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeBookings.map((b, bIdx) => {
                  const statusConfig = STATUS_BADGES[b.status] || {
                    label: b.status,
                    color: 'bg-[#F7F4E9] text-slate-700 border-[#E3DEC3]',
                  };
                  const staggerClass = `stagger-${Math.min((bIdx % 6) + 1, 6)}`;

                  return (
                    <div
                      key={b.id}
                      className={`bg-white rounded-2xl border border-[#E7E5DC] shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md animate-fade-in-up ${staggerClass}`}
                    >
                      {/* Booking Tracker for this booking */}
                      <div className="px-6 pt-5 pb-3 bg-[#FFFDF6] border-b border-[#E7E5DC]">
                        <BookingStateTracker currentStatus={b.status} hasCounterOffer={true} />
                      </div>

                      <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-[11px] px-2.5 py-0.5 rounded-full uppercase border ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                            <span className="text-xs text-slate-400 font-bold">Booking #{b.id}</span>
                          </div>

                          <div className="text-sm font-bold text-[#082D46] mt-1 font-heading">
                            {b.seeker_name} ↔ {b.provider_name}
                          </div>

                          <div className="text-xs text-slate-500 mt-0.5">
                            Event Date: <strong className="text-slate-800">{b.booking_date}</strong> • Slot: {b.start_time} - {b.end_time}
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-lg font-bold text-[#2F7D4A] font-heading">
                              ₹{b.total_amount.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Confirmed at {new Date(b.confirmed_at || b.created_at).toLocaleDateString()}
                            </div>
                          </div>

                          {/* State Transition Actions */}
                          <div className="flex items-center space-x-2">
                            {b.status === 'CONFIRMED' && (
                              <>
                                <button
                                  onClick={() => handleUpdateBookingState(b.id, 'FULFILMENT')}
                                  disabled={actionLoading === b.id}
                                  className="hospix-btn-primary px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center space-x-1"
                                >
                                  <TruckIcon className="w-3.5 h-3.5" />
                                  <span>Start Fulfilment</span>
                                </button>
                                <button
                                  onClick={() => handleCancelBooking(b.id)}
                                  className="px-2.5 py-1.5 text-xs text-[#9B1C1C] hover:text-[#771D1D] font-semibold underline active:opacity-75 transition-opacity"
                                >
                                  Cancel
                                </button>
                              </>
                            )}

                            {b.status === 'FULFILMENT' && (
                              <button
                                onClick={() => handleUpdateBookingState(b.id, 'COMPLETED')}
                                disabled={actionLoading === b.id}
                                className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#2F7D4A] hover:bg-[#246139] active:scale-[0.98] rounded-xl transition-all flex items-center space-x-1 shadow-xs"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Mark Completed</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ============================================================
              SECTION 3: ORDER HISTORY & PAST RECORDS (COLLAPSIBLE ARCHIVE)
          ============================================================ */}
          {totalHistoryCount > 0 && (
            <div className="mt-8 pt-6 border-t border-[#E7E5DC]">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-[#FCFAF3] rounded-2xl border border-[#E7E5DC] transition-colors text-left shadow-2xs cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-[#F7F4E9] text-[#082D46]">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#082D46] font-heading">
                      Order History & Past Records ({totalHistoryCount})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Completed orders, declined requests, and past cancellations
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-xs font-semibold text-[#082D46]">
                  <span>{showHistory ? 'Hide History' : 'Show History'}</span>
                  {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {showHistory && (
                <div className="mt-4 space-y-3 animate-fade-in">
                  {pastBookings.map((b) => {
                    const statusConfig = STATUS_BADGES[b.status] || {
                      label: b.status,
                      color: 'bg-[#F7F4E9] text-slate-700 border-[#E3DEC3]',
                    };
                    return (
                      <div
                        key={`past-b-${b.id}`}
                        className="p-4 bg-white rounded-xl border border-[#E7E5DC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs opacity-85 hover:opacity-100 transition-opacity"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase border font-semibold ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                            <span className="text-slate-400 font-bold">Booking #{b.id}</span>
                          </div>
                          <div className="font-bold text-[#082D46]">
                            {b.seeker_name} ↔ {b.provider_name}
                          </div>
                          <div className="text-slate-500">
                            Event Date: <strong>{b.booking_date}</strong> • Slot: {b.start_time} - {b.end_time}
                          </div>
                        </div>
                        <div className="text-right sm:self-center shrink-0">
                          <div className="text-base font-bold text-slate-700 font-heading">
                            ₹{b.total_amount?.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {b.status === 'COMPLETED' ? 'Order Fulfilled & Closed' : 'Cancelled'}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {pastRequests.map((req) => {
                    const statusConfig = STATUS_BADGES[req.status] || {
                      label: req.status,
                      color: 'bg-[#F7F4E9] text-slate-700 border-[#E3DEC3]',
                    };
                    return (
                      <div
                        key={`past-r-${req.id}`}
                        className="p-4 bg-white rounded-xl border border-[#E7E5DC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs opacity-75 hover:opacity-100 transition-opacity"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase border font-semibold ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                            <span className="text-slate-400 font-bold">Request #{req.id}</span>
                          </div>
                          <div className="font-bold text-[#082D46]">
                            {req.resource_name} ({isProvider ? `Seeker: ${req.seeker_name}` : `Provider: ${req.provider_name}`})
                          </div>
                          <div className="text-slate-500">
                            Event Date: {req.booking_date} • {req.requested_quantity} units
                          </div>
                        </div>
                        <div className="text-right sm:self-center shrink-0">
                          <div className="text-base font-bold text-slate-500 font-heading">
                            ₹{req.total_price?.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {req.status === 'REJECTED' ? 'Declined' : 'Cancelled'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Counter-Offer Modal (Provider) */}
      {counterModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 hospix-modal-backdrop flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E7E5DC] w-full max-w-md overflow-hidden hospix-modal-dialog">
            <div className="px-6 py-4 border-b border-[#E7E5DC] flex justify-between items-center bg-[#FCFAF3]">
              <div>
                <h3 className="text-base font-bold text-[#082D46] font-heading">Propose Counter-Offer</h3>
                <p className="text-xs text-slate-500">Alter quantity, price, date, or delivery before confirmation</p>
              </div>
              <button
                onClick={() => setCounterModalOpen(false)}
                className="hospix-icon-btn text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCounterOffer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Offered Quantity (units)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={counterQty}
                  onChange={(e) => setCounterQty(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D9D8CF] rounded-xl text-slate-900 focus:outline-hidden focus:border-[#082D46] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adjusted Daily Rate (₹)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D9D8CF] rounded-xl text-slate-900 focus:outline-hidden focus:border-[#082D46] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adjusted Date (Optional)
                </label>
                <input
                  type="date"
                  value={counterDate}
                  onChange={(e) => setCounterDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D9D8CF] rounded-xl text-slate-900 focus:outline-hidden focus:border-[#082D46] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Charge (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={counterDelivery}
                  onChange={(e) => setCounterDelivery(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D9D8CF] rounded-xl text-slate-900 focus:outline-hidden focus:border-[#082D46] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes for Seeker</label>
                <textarea
                  rows={2}
                  value={counterNotes}
                  onChange={(e) => setCounterNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D9D8CF] rounded-xl text-slate-900 focus:outline-hidden focus:border-[#082D46] transition-colors"
                />
              </div>

              <div className="pt-3 border-t border-[#E7E5DC] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setCounterModalOpen(false)}
                  className="hospix-btn-secondary px-4 py-2 text-xs rounded-xl active:scale-[0.98] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="hospix-btn-primary px-5 py-2 text-xs rounded-xl shadow-xs active:scale-[0.98] transition-all"
                >
                  Send Counter-Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedBusinessId && (
        <BusinessProfileModal
          businessId={selectedBusinessId}
          onClose={() => setSelectedBusinessId(null)}
        />
      )}
    </div>
  );
};
