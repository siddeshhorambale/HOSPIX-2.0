import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MapView } from './MapView';
import { BusinessProfileModal } from './BusinessProfileModal';
import { getResourceImage } from '../data/resourceImages';
import {
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Truck,
  Building2,
  MapPin,
  Calendar,
  IndianRupee,
  Shield,
  ArrowRight,
  Sliders,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
  Star,
  Check
} from 'lucide-react';

export const MatchingResultsView = ({ requirement, onProceedToBooking }) => {
  const [singleMatches, setSingleMatches] = useState([]);
  const [pooledSolutions, setPooledSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, POOLED, SINGLE
  const [expandedMatchId, setExpandedMatchId] = useState(null);
  const [requesting, setRequesting] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState(null);

  useEffect(() => {
    if (!requirement?.id) return;
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const res = await api.post('/matching/search', { requirement_id: requirement.id });
        setSingleMatches(res.single_matches || []);
        setPooledSolutions(res.pooled_solutions || []);
        if (res.pooled_solutions?.length > 0) {
          setExpandedMatchId('pool-0');
        } else if (res.single_matches?.length > 0) {
          setExpandedMatchId('single-0');
        }
      } catch (err) {
        setError(err.message || 'Failed to search matches');
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [requirement?.id]);

  const handleCreateRequests = async (match) => {
    try {
      setRequesting(true);
      const isPooled = match.match_type === 'POOLED' || (match.provider_names && match.provider_names.length > 1);
      const batchPayload = {
        requirement_id: requirement.id,
        items: match.items.map((item) => ({
          requirement_id: requirement.id,
          resource_id: item.resource_id,
          requested_quantity: item.offered_quantity,
          booking_date: requirement.event_date,
          start_time: requirement.start_time || '10:00',
          end_time: requirement.end_time || '22:00',
          unit_price: item.unit_price,
          delivery_required: requirement.delivery_required !== undefined ? requirement.delivery_required : true,
          delivery_charge: item.delivery_charge || 0.0,
          notes: `HOSPIX ${isPooled ? 'pooled' : 'single'} request for ${requirement.event_type || 'event'}`,
        })),
      };
      await api.post('/bookings/requests', batchPayload);
      if (onProceedToBooking) {
        onProceedToBooking();
      }
    } catch (err) {
      alert('Error creating booking request: ' + (err.message || 'Unknown error'));
    } finally {
      setRequesting(false);
    }
  };

  const renderCard = (match, uniqueKey, isPooled, cardIndex = 0) => {
    const isExpanded = expandedMatchId === uniqueKey;
    const withinBudget = match.total_cost <= requirement.budget;
    const providerCount = Math.max(match.provider_names?.length || 2, 2);
    const staggerClass = `stagger-${Math.min((cardIndex % 6) + 1, 6)}`;

    return (
      <div
        key={uniqueKey}
        className={`rounded-2xl border transition-all duration-200 overflow-hidden animate-fade-in-up ${staggerClass} ${
          isPooled
            ? 'bg-[#FFFDF7] border-[#F4D98A]/80 shadow-xs hover:shadow-md'
            : 'bg-white border-[#E7E5DC] shadow-xs hover:shadow-md'
        } ${isExpanded ? 'ring-2 ring-[#082D46]/10 shadow-md' : 'hover:border-[#D9D8CF]'}`}
      >
        {/* Match Card Header */}
        <div
          onClick={() => setExpandedMatchId(isExpanded ? null : uniqueKey)}
          className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-colors duration-150 select-none ${
            isPooled ? 'bg-[#FFF9E6]/50 hover:bg-[#FFF9E6]/80' : 'bg-[#FCFAF3]/60 hover:bg-[#FCFAF3]'
          }`}
        >
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {isPooled ? (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-[#082D46] text-[#F4D98A] shadow-2xs">
                  POOLED SOLUTION ({providerCount} PROVIDERS)
                </span>
              ) : (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-[#E8F2F6] text-[#082D46] border border-[#D0E4ED]">
                  Single Provider
                </span>
              )}

              {match.is_full_coverage ? (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#E7F4EA] text-[#2F7D4A] border border-[#CDE6D3] font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-[#2F7D4A]" />
                  <span>100% Quantity Covered</span>
                </span>
              ) : (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FFF2C7] text-[#8C6A00] border border-[#F6E29E] font-medium">
                  Partial Quantity ({match.quantity_score}%)
                </span>
              )}

              {isPooled && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F2F6] text-[#082D46]">
                  Recommended Bundle
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-[#082D46] font-heading">
              {isPooled
                ? `Combined Network: ${match.provider_names.join(' + ')}`
                : match.provider_names[0]}
            </h3>

            <p className="text-xs text-[#596B76] truncate">
              {match.items
                .map((it) => `${it.offered_quantity} ${it.resource_name} (${it.provider_name})`)
                .join(' • ')}
            </p>
          </div>

          <div className="flex items-center space-x-5 shrink-0">
            <div className="text-right">
              <div className="text-lg font-extrabold text-[#082D46]">
                ₹{match.total_cost.toLocaleString()}
              </div>
              <div
                className={`text-[11px] font-bold flex justify-end ${
                  withinBudget ? 'text-[#2F7D4A]' : 'text-rose-600'
                }`}
              >
                {withinBudget ? 'Within budget ✓' : 'Exceeds target budget'}
              </div>
            </div>

            <div className="text-center px-3 py-1.5 bg-white border border-[#E7E5DC] rounded-xl shadow-2xs">
              <div className="text-base font-extrabold text-[#082D46] font-heading">{match.overall_score}</div>
              <div className="text-[9px] text-[#596B76] font-bold uppercase tracking-wider">Score</div>
            </div>

            <div className="hospix-icon-btn p-1.5 text-[#8A979D]">
              <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[#082D46]' : ''}`} />
            </div>
          </div>
        </div>

        {/* Visual Combination Flow For Pooled Solutions (Matches Screen 8 in Reference) */}
        {isPooled && (
          <div className="px-5 py-3.5 bg-white border-y border-[#F4D98A]/50">
            <div className="text-[11px] font-bold text-[#596B76] uppercase tracking-wider mb-2">
              Combined Supplier Allocation:
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {match.items.map((it, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && (
                    <span className="text-base font-extrabold text-[#8A979D] px-1">+</span>
                  )}
                  <div className="p-2.5 rounded-xl border border-[#E7E5DC] bg-[#FCFAF3] hover:border-[#D0E4ED] transition-colors flex items-center space-x-2.5 shadow-2xs group">
                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-[#E7E5DC]">
                      <img
                        src={getResourceImage(it.resource_name)}
                        alt={it.resource_name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="text-left text-xs">
                      <div className="font-bold text-[#082D46] leading-tight">
                        {it.provider_name}
                      </div>
                      <div className="text-[10px] text-[#596B76]">
                        {it.offered_quantity} × {it.resource_name} • ₹{it.subtotal.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Match Card Expanded Body */}
        {isExpanded && (
          <div className="p-5 sm:p-6 border-t border-[#E7E5DC] space-y-6 bg-white">
            {/* Why this match? Explanation Box */}
            <div className="p-4 bg-[#E7F4EA]/60 rounded-xl border border-[#CDE6D3]">
              <div className="text-xs font-bold text-[#2F7D4A] uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-[#2F7D4A]" />
                <span>Engine Matching Intelligence</span>
              </div>
              <ul className="space-y-1.5">
                {match.explanation.map((exp, expIdx) => (
                  <li key={expIdx} className="text-xs text-[#092C43] flex items-start space-x-2">
                    <span className="text-[#2F7D4A] font-bold text-sm leading-none mt-0.5">✓</span>
                    <span>{exp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Algorithmic Scoring Weights Bar */}
            <div>
              <div className="text-xs font-bold text-[#082D46] uppercase tracking-wider mb-2">
                Multi-Factor Algorithmic Score Breakdown:
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                <div className="bg-[#FCFAF3] p-2.5 rounded-xl border border-[#E7E5DC]">
                  <span className="block text-[10px] text-[#596B76] uppercase">Availability (30%)</span>
                  <span className="font-bold text-[#082D46]">{match.availability_score}%</span>
                </div>
                <div className="bg-[#FCFAF3] p-2.5 rounded-xl border border-[#E7E5DC]">
                  <span className="block text-[10px] text-[#596B76] uppercase">Quantity (25%)</span>
                  <span className="font-bold text-[#082D46]">{match.quantity_score}%</span>
                </div>
                <div className="bg-[#FCFAF3] p-2.5 rounded-xl border border-[#E7E5DC]">
                  <span className="block text-[10px] text-[#596B76] uppercase">Distance (15%)</span>
                  <span className="font-bold text-[#082D46]">{match.distance_score}%</span>
                </div>
                <div className="bg-[#FCFAF3] p-2.5 rounded-xl border border-[#E7E5DC]">
                  <span className="block text-[10px] text-[#596B76] uppercase">Price (15%)</span>
                  <span className="font-bold text-[#082D46]">{match.price_score}%</span>
                </div>
                <div className="bg-[#FCFAF3] p-2.5 rounded-xl border border-[#E7E5DC]">
                  <span className="block text-[10px] text-[#596B76] uppercase">Quality (15%)</span>
                  <span className="font-bold text-[#082D46]">{match.compatibility_score}%</span>
                </div>
                <div className="bg-[#FCFAF3] p-2.5 rounded-xl border border-[#E7E5DC]">
                  <span className="block text-[10px] text-[#596B76] uppercase">Trust (5%)</span>
                  <span className="font-bold text-[#082D46]">{match.trust_score}%</span>
                </div>
              </div>
            </div>

            {/* Itemized Provider Breakdown */}
            <div>
              <div className="text-xs font-bold text-[#082D46] uppercase tracking-wider mb-2">
                Resource & Fulfillment Breakdown:
              </div>
              <div className="divide-y divide-[#E7E5DC] border border-[#E7E5DC] rounded-xl overflow-hidden">
                {match.items.map((item, itIdx) => {
                  const reqItem = requirement.items.find(
                    (ri) => ri.resource_type.toLowerCase() === item.resource_name.toLowerCase()
                  ) || { quantity: item.offered_quantity };
                  const itemThumbnail = getResourceImage(item.resource_name);

                  return (
                    <div
                      key={itIdx}
                      className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3 hover:bg-[#FCFAF3]/50 transition-colors group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-[#E7E5DC]">
                          <img
                            src={itemThumbnail}
                            alt={item.resource_name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-[#082D46] capitalize font-heading text-sm">
                            {item.resource_name}
                          </div>
                          <div className="text-[#596B76] mt-0.5 flex items-center flex-wrap gap-1 text-[11px]">
                            <span>Provider:</span>
                            <span className="font-semibold text-[#082D46]">{item.provider_name}</span>
                            <span>({item.provider_city})</span>
                            {item.provider_id && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBusinessId(item.provider_id);
                                }}
                                className="text-[11px] text-[#082D46] hover:underline font-bold ml-1 cursor-pointer transition-colors"
                              >
                                View Profile →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#FCFAF3] px-3 py-1.5 rounded-lg border border-[#E7E5DC] flex items-center space-x-3 text-[11px]">
                        <span className="text-[#596B76]">
                          Required: <strong className="text-[#082D46]">{reqItem.quantity}</strong>
                        </span>
                        <span className="text-[#D9D8CF]">|</span>
                        <span className="text-[#2F7D4A] font-bold">
                          Covered: {item.offered_quantity}
                        </span>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-[#082D46]">@ ₹{item.unit_price}/day</div>
                        <div className="text-[#596B76] mt-0.5 text-[11px]">
                          Subtotal: ₹{item.subtotal.toLocaleString()}
                          {item.delivery_charge > 0 && ` + ₹${item.delivery_charge} delivery`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-[#E7E5DC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-[#596B76]">
                Guaranteed inventory reservation. Only confirmed status locks physical items.
              </div>
              <button
                onClick={() => handleCreateRequests(match)}
                disabled={requesting}
                className="hospix-btn-primary px-6 py-2.5 rounded-xl text-xs font-bold shadow-xs active:scale-[0.98] transition-all"
              >
                <span>{requesting ? 'Issuing Requests...' : isPooled ? 'Request Pooled Solution' : 'Request Resource'}</span>
                <ArrowRight className="w-4 h-4 hospix-arrow" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const visibleMatches =
    filterType === 'SINGLE'
      ? singleMatches
      : filterType === 'POOLED'
      ? pooledSolutions
      : [...singleMatches, ...pooledSolutions];

  const totalSolutionsCount = singleMatches.length + pooledSolutions.length;
  const singleMatchesCount = singleMatches.length;
  const pooledMatchesCount = pooledSolutions.length;
  const hasVisibleMatches = visibleMatches.length > 0;
  const hasFullSingleMatch = singleMatches.some((m) => m.is_full_coverage);

  const showSingle = filterType === 'ALL' || filterType === 'SINGLE';
  const showPooled = filterType === 'ALL' || filterType === 'POOLED';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-body">
      {/* Top Header Card */}
      <div className="hospix-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] px-2.5 py-0.5 rounded-md font-bold uppercase bg-[#E8F2F6] text-[#082D46] border border-[#D0E4ED]">
                Requirement #{requirement.id}
              </span>
              <span className="text-xs text-[#8A979D]">•</span>
              <span className="text-xs font-semibold text-[#596B76] capitalize">
                {requirement.event_type} in {requirement.location_city}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#082D46] font-heading tracking-tight">
              {requirement.title}
            </h1>
          </div>

          <div className="flex items-center space-x-5 text-xs text-[#596B76]">
            <div>
              <span className="text-[#8A979D] block text-[10px] uppercase font-bold">Event Date</span>
              <span className="font-bold text-[#082D46]">{requirement.event_date}</span>
            </div>
            <div>
              <span className="text-[#8A979D] block text-[10px] uppercase font-bold">Budget</span>
              <span className="font-bold text-[#082D46]">₹{requirement.budget.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Informational Guidance */}
        {!hasFullSingleMatch && pooledMatchesCount > 0 && (
          <div className="p-3.5 bg-[#FFF9E6] border border-[#F4D98A]/80 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Info className="w-5 h-5 text-[#8C6A00] shrink-0" />
              <div className="text-xs text-[#082D46] font-bold font-heading">
                No single provider has all inventory. HOSPIX generated a coordinated pooled solution using multiple suppliers.
              </div>
            </div>
            <button
              onClick={() => setFilterType('POOLED')}
              className="text-xs font-bold text-[#082D46] hover:underline flex items-center space-x-1 ml-4 shrink-0"
            >
              <span>View Pooled Solutions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Signature HOSPIX Moment: What You Need -> What HOSPIX Found Convergence */}
      {!loading && hasVisibleMatches && (
        <div className="p-4 bg-white rounded-2xl border border-[#E7E5DC] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center space-x-3">
            <div className="flex items-center -space-x-2 overflow-visible">
              {requirement.items.map((it, i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-xl border-2 border-white shadow-xs overflow-hidden bg-[#FCFAF3]"
                  style={{
                    animation: `${i % 2 === 0 ? 'signatureConvergeLeft' : 'signatureConvergeRight'} 450ms ${i * 70}ms var(--ease-emphasized) both`
                  }}
                  title={`${it.quantity} ${it.resource_type}`}
                >
                  <img
                    src={getResourceImage(it.resource_type)}
                    alt={it.resource_type}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <div>
              <div className="text-xs font-bold text-[#082D46] font-heading flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#2F7D4A]" />
                <span>Coordinated Regional Inventory Found</span>
              </div>
              <div className="text-[11px] text-[#596B76]">
                {singleMatchesCount} single-source matches • {pooledMatchesCount} coordinated pooled bundles
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-bold text-[#2F7D4A] bg-[#E7F4EA] px-3 py-1.5 rounded-xl border border-[#CDE6D3] shrink-0 self-start md:self-auto">
            <CheckCircle2 className="w-4 h-4 text-[#2F7D4A]" />
            <span>100% Demand Coordinated</span>
          </div>
        </div>
      )}

      {/* Solutions Navigation & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 bg-[#FCFAF3] p-1.5 rounded-xl border border-[#E7E5DC]">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all active:scale-[0.97] ${
              filterType === 'ALL'
                ? 'bg-[#082D46] text-white shadow-xs'
                : 'text-[#596B76] hover:text-[#082D46]'
            }`}
          >
            All Solutions ({totalSolutionsCount})
          </button>
          <button
            onClick={() => setFilterType('SINGLE')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all active:scale-[0.97] ${
              filterType === 'SINGLE'
                ? 'bg-[#082D46] text-white shadow-xs'
                : 'text-[#596B76] hover:text-[#082D46]'
            }`}
          >
            Single Provider ({singleMatchesCount})
          </button>
          <button
            onClick={() => setFilterType('POOLED')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-all active:scale-[0.97] ${
              filterType === 'POOLED'
                ? 'bg-[#082D46] text-[#F4D98A] shadow-xs'
                : 'text-[#596B76] hover:text-[#082D46]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pooled Network ({pooledMatchesCount})</span>
          </button>
        </div>

        <div className="text-[11px] text-[#596B76] font-medium">
          Weighted: Coverage 25% • Availability 30% • Distance 15% • Price 15%
        </div>
      </div>

      {/* Matches Content */}
      {loading ? (
        <div className="space-y-4">
          <div className="p-4 bg-[#FFF9E6] border border-[#F4D98A]/60 rounded-xl flex items-center space-x-3 text-xs text-[#082D46] font-medium animate-pulse">
            <Sparkles className="w-4 h-4 text-[#8C6A00] shrink-0 animate-spin" />
            <span>Evaluating multi-provider inventory combinations and road transit logistics...</span>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="hospix-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-40 hospix-skeleton" />
                    <div className="h-3 w-64 hospix-skeleton" />
                  </div>
                  <div className="h-6 w-20 hospix-skeleton" />
                </div>
                <div className="h-12 w-full hospix-skeleton rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ) : !hasVisibleMatches ? (
        <div className="hospix-card p-12 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-[#8A979D] mx-auto" />
          <h3 className="text-base font-bold text-[#082D46] font-heading">No matching solutions in this view</h3>
          <p className="text-xs text-[#596B76] max-w-sm mx-auto">
            Try switching filter views or adjusting your required quantity and date.
          </p>
          <button
            onClick={() => setFilterType('ALL')}
            className="hospix-btn-secondary px-4 py-2 text-xs rounded-xl"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Map View Integration */}
          <div className="hospix-card p-4 space-y-3 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-[#082D46]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#082D46] font-heading">
                  Geographic Supplier Distribution (Thane & Mumbai Hubs)
                </h3>
              </div>
              <span className="text-[11px] text-[#596B76]">Interactive Distance Radar</span>
            </div>
            <div className="rounded-xl overflow-hidden border border-[#E7E5DC]">
              <MapView
                venueCity={requirement?.location_city || 'Thane'}
                providers={visibleMatches.flatMap((m) => m.items || [])}
              />
            </div>
          </div>

          {/* 1. Single Matches Section */}
          {showSingle && singleMatches.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#E7E5DC] pb-2">
                <h2 className="text-base font-bold text-[#082D46] font-heading flex items-center space-x-2">
                  <Building2 className="w-4.5 h-4.5 text-[#082D46]" />
                  <span>Single Provider Matches</span>
                  <span className="text-xs bg-[#E8F2F6] text-[#082D46] px-2.5 py-0.5 rounded-full font-bold">
                    {singleMatches.length}
                  </span>
                </h2>
                <span className="text-xs text-[#596B76]">Independent single-supplier fulfillment</span>
              </div>

              <div className="space-y-3">
                {singleMatches.map((match, idx) => renderCard(match, `single-${idx}`, false, idx))}
              </div>
            </div>
          )}

          {/* 2. Pooled Solutions Section */}
          {showPooled && pooledSolutions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#E7E5DC] pb-2">
                <h2 className="text-base font-bold text-[#082D46] font-heading flex items-center space-x-2">
                  <Layers className="w-4.5 h-4.5 text-[#8C6A00]" />
                  <span>Coordinated Multi-Provider Pooled Bundles</span>
                  <span className="text-xs bg-[#FFF2C7] text-[#8C6A00] px-2.5 py-0.5 rounded-full font-bold">
                    {pooledSolutions.length} Generated
                  </span>
                </h2>
                <span className="text-xs text-[#596B76]">Combined inventory across multiple verified vendors</span>
              </div>

              <div className="space-y-3">
                {pooledSolutions.map((match, idx) => renderCard(match, `pool-${idx}`, true, idx))}
              </div>
            </div>
          )}
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
