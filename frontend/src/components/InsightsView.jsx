import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  BarChart3,
  Layers,
  Calendar,
  ShieldCheck,
  Package,
  RefreshCw,
  Building2,
  Sparkles,
  ArrowUpRight,
  Info,
  CheckCircle2,
  Check,
  Users,
  Clock,
  CircleDot,
  PieChart,
} from 'lucide-react';

export const InsightsView = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/analytics/overview');
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err.message || 'Could not load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // -------------------------------------------------------------
  // SKELETON LOADING STATE
  // -------------------------------------------------------------
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="space-y-3">
          <div className="h-5 w-40 bg-slate-200 rounded-full" />
          <div className="h-8 w-80 bg-slate-200 rounded-xl" />
          <div className="h-4 w-96 bg-slate-200 rounded-lg" />
        </div>

        {/* KPI Skeleton Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-[#E7E5DC] p-5 space-y-3">
              <div className="h-4 w-24 bg-slate-200 rounded" />
              <div className="h-8 w-16 bg-slate-200 rounded" />
              <div className="h-3 w-36 bg-slate-200 rounded" />
            </div>
          ))}
        </div>

        {/* Charts Skeleton Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-80 bg-white rounded-2xl border border-[#E7E5DC] p-6" />
          <div className="lg:col-span-4 h-80 bg-white rounded-2xl border border-[#E7E5DC] p-6" />
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ERROR STATE
  // -------------------------------------------------------------
  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl border border-red-200 p-8 text-center max-w-md mx-auto space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#082D46] font-heading">Unable to Load Insights</h3>
            <p className="text-xs text-slate-500 mt-1">{error || 'An unexpected error occurred.'}</p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="hospix-btn-primary text-xs px-4 py-2 rounded-xl inline-flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  const { role, business_name, city, kpis, bookings_over_time, resource_demand, pooling, auxiliary } = data;
  const isProvider = role === 'PROVIDER';

  // -------------------------------------------------------------
  // SVG LINE CHART HELPER (Bookings Over Time)
  // -------------------------------------------------------------
  const renderLineChart = () => {
    if (!bookings_over_time || bookings_over_time.length === 0) {
      return (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-[#FCFAF3] rounded-xl border border-dashed border-[#E3DEC3]">
          <Calendar className="w-8 h-8 text-slate-300 mb-2" />
          <p className="text-xs font-semibold text-[#082D46]">Not enough booking data yet</p>
          <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
            Confirmed bookings and scheduled event dates will automatically populate this timeline.
          </p>
        </div>
      );
    }

    const svgWidth = 600;
    const svgHeight = 220;
    const padX = 45;
    const padY = 30;

    const counts = bookings_over_time.map((d) => d.count);
    const maxVal = Math.max(...counts, 4);

    const points = bookings_over_time.map((d, idx) => {
      const x = bookings_over_time.length === 1
        ? svgWidth / 2
        : padX + (idx / (bookings_over_time.length - 1)) * (svgWidth - padX * 2);
      const y = svgHeight - padY - (d.count / maxVal) * (svgHeight - padY * 2);
      return { x, y, ...d };
    });

    // Generate SVG path string
    let pathD = '';
    if (points.length === 1) {
      pathD = `M ${points[0].x - 40} ${points[0].y} L ${points[0].x + 40} ${points[0].y}`;
    } else {
      pathD = points.reduce((acc, p, idx) => {
        return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
      }, '');
    }

    const areaD = points.length > 1
      ? `${pathD} L ${points[points.length - 1].x} ${svgHeight - padY} L ${points[0].x} ${svgHeight - padY} Z`
      : '';

    return (
      <div className="relative pt-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-56 overflow-visible select-none"
        >
          <defs>
            <linearGradient id="bookingGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#082D46" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#082D46" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines */}
          {[0, 0.33, 0.66, 1].map((ratio, i) => {
            const y = padY + ratio * (svgHeight - padY * 2);
            const val = Math.round(maxVal * (1 - ratio));
            return (
              <g key={i}>
                <line
                  x1={padX}
                  y1={y}
                  x2={svgWidth - padX}
                  y2={y}
                  stroke="#E7E5DC"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px] fill-slate-400 font-sans"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          {areaD && <path d={areaD} fill="url(#bookingGrad)" />}

          {/* Path Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#082D46"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Data Points */}
          {points.map((p, idx) => {
            const isHovered = activeTooltip?.date === p.date;
            return (
              <g
                key={idx}
                className="cursor-pointer"
                onMouseEnter={() => setActiveTooltip(p)}
                onMouseLeave={() => setActiveTooltip(null)}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 6 : 4}
                  fill={isHovered ? '#F4D98A' : '#FFFFFF'}
                  stroke="#082D46"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150"
                />
                {/* Date Label */}
                <text
                  x={p.x}
                  y={svgHeight - 8}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-500 font-sans font-medium"
                >
                  {p.date.split('-').slice(1).join('/')}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {activeTooltip && (
          <div
            className="absolute top-2 right-4 bg-[#082D46] text-white p-2.5 rounded-xl shadow-lg border border-white/20 text-xs space-y-1 animate-fade-in pointer-events-none"
          >
            <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
              {activeTooltip.date}
            </div>
            <div className="font-bold text-[#F4D98A]">
              {activeTooltip.count} {activeTooltip.count === 1 ? 'Booking' : 'Bookings'}
            </div>
            {activeTooltip.amount > 0 && (
              <div className="text-[11px] text-slate-200">
                Volume: ₹{activeTooltip.amount.toLocaleString()}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* ============================================================
          1. HEADER & INTEL BADGE
      ============================================================ */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E3DEC3] pb-6">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#E8F2F6] text-[#082D46] border border-[#D0E4ED] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#D99B26]" />
            <span>HOSPIX Intelligence Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#082D46] tracking-tight font-heading">
            {isProvider ? 'Provider Business Intelligence' : 'Seeker Marketplace Analytics'}
          </h1>
          <p className="text-xs sm:text-sm text-[#596B76] mt-1">
            Aggregated marketplace metrics for <span className="font-bold text-[#082D46]">{business_name}</span> • {city} Region
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-[11px] text-slate-400 flex items-center space-x-1">
            <CircleDot className="w-3 h-3 text-[#2F7D4A] animate-pulse" />
            <span>Live DB Aggregation</span>
          </span>
          <button
            onClick={fetchAnalytics}
            className="hospix-btn-secondary px-3.5 py-2 text-xs rounded-xl flex items-center space-x-1.5"
            title="Refresh analytics data"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ============================================================
          2. CORE KPI CARDS
      ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Primary Metric */}
        <div className="hospix-card-hover p-5 rounded-2xl bg-white border border-[#E7E5DC] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#596B76] text-xs font-semibold">
            <span>{kpis.primary_metric?.label}</span>
            <Package className="w-4 h-4 text-[#082D46]" />
          </div>
          <div className="text-3xl font-extrabold text-[#082D46] font-heading">
            {kpis.primary_metric?.value}
          </div>
          <p className="text-[11px] text-[#596B76] leading-tight">
            {kpis.primary_metric?.subtext}
          </p>
        </div>

        {/* Card 2: Secondary Metric */}
        <div className="hospix-card-hover p-5 rounded-2xl bg-white border border-[#E7E5DC] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#596B76] text-xs font-semibold">
            <span>{kpis.secondary_metric?.label}</span>
            <Users className="w-4 h-4 text-[#8C6A00]" />
          </div>
          <div className="text-3xl font-extrabold text-[#082D46] font-heading">
            {kpis.secondary_metric?.value}
          </div>
          <p className="text-[11px] text-[#596B76] leading-tight">
            {kpis.secondary_metric?.subtext}
          </p>
        </div>

        {/* Card 3: Confirmed Bookings */}
        <div className="hospix-card-hover p-5 rounded-2xl bg-white border border-[#E7E5DC] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#596B76] text-xs font-semibold">
            <span>{kpis.bookings_metric?.label}</span>
            <ShieldCheck className="w-4 h-4 text-[#2F7D4A]" />
          </div>
          <div className="text-3xl font-extrabold text-[#2F7D4A] font-heading">
            {kpis.bookings_metric?.value}
          </div>
          <p className="text-[11px] text-[#596B76] leading-tight">
            {kpis.bookings_metric?.subtext}
          </p>
        </div>

        {/* Card 4: Signature Pooling Metric */}
        <div className="hospix-card-hover p-5 rounded-2xl bg-[#FFFDF6] border border-[#F4D98A] shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-[#8C6A00] text-xs font-bold uppercase tracking-wider">
            <span>{kpis.pooling_metric?.label}</span>
            <Layers className="w-4 h-4 text-[#8C6A00]" />
          </div>
          <div className="text-3xl font-extrabold text-[#082D46] font-heading flex items-baseline space-x-1.5">
            <span>{kpis.pooling_metric?.value}</span>
            <span className="text-xs font-semibold text-[#8C6A00]">Network Pooled</span>
          </div>
          <p className="text-[11px] text-[#596B76] leading-tight">
            {kpis.pooling_metric?.subtext}
          </p>
        </div>
      </div>

      {/* ============================================================
          3. MIDDLE SECTION: TIMELINE & POOLING BREAKDOWN
      ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Bookings Over Time Line Chart */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E7E5DC] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#082D46] font-heading">
                Confirmed Event Timeline
              </h2>
              <p className="text-xs text-[#596B76] mt-0.5">
                Scheduled bookings grouped by event date from real calendar commitments
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-[#082D46]">
                {kpis.financial_metric?.value}
              </div>
              <div className="text-[10px] text-slate-400">
                {kpis.financial_metric?.label}
              </div>
            </div>
          </div>

          {renderLineChart()}
        </div>

        {/* Right: Signature HOSPIX Pooling Ratio Visual */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E7E5DC] p-6 shadow-xs space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6A00]">
                Signature Intelligence
              </span>
              <span className="text-[11px] font-bold text-[#2F7D4A] bg-[#E7F4EA] px-2 py-0.5 rounded-full border border-[#C5E5CE]">
                {pooling.pooled_percentage}% Pooled
              </span>
            </div>
            <h2 className="text-base font-bold text-[#082D46] font-heading">
              Supply Pooling Ratio
            </h2>
            <p className="text-xs text-[#596B76] mt-1 leading-relaxed">
              Comparison between single-provider orders versus collaborative multi-hub pooling that prevented supply shortfalls.
            </p>
          </div>

          {/* Segmented Distribution Bar */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-[#E7E5DC] rounded-full overflow-hidden flex">
              <div
                style={{ width: `${pooling.single_percentage}%` }}
                className="bg-[#082D46] transition-all duration-500"
                title={`Single Provider: ${pooling.single_percentage}%`}
              />
              <div
                style={{ width: `${pooling.pooled_percentage}%` }}
                className="bg-[#D99B26] transition-all duration-500"
                title={`Multi-Provider Pooled: ${pooling.pooled_percentage}%`}
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#082D46]" />
                <span className="font-semibold text-[#082D46]">Single Provider</span>
                <span className="text-slate-400">({pooling.single_provider_count})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D99B26]" />
                <span className="font-semibold text-[#8C6A00]">Multi-Hub Pooled</span>
                <span className="text-slate-400">({pooling.multi_provider_count})</span>
              </div>
            </div>
          </div>

          {/* Detailed Context Cards */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-[#FCFAF3] border border-[#E7E5DC] space-y-1">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Solo Fulfillment</div>
              <div className="text-lg font-extrabold text-[#082D46]">
                {pooling.single_provider_count} <span className="text-xs font-normal text-slate-500">Orders</span>
              </div>
              <p className="text-[10px] text-slate-500">100% stock supplied by 1 business</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FFFDF6] border border-[#F4D98A] space-y-1">
              <div className="text-[10px] text-[#8C6A00] font-bold uppercase">Pooled Fulfillment</div>
              <div className="text-lg font-extrabold text-[#082D46]">
                {pooling.multi_provider_count} <span className="text-xs font-normal text-slate-500">Orders</span>
              </div>
              <p className="text-[10px] text-slate-500">2-3 hubs combined to cover shortage</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          4. BOTTOM SECTION: RESOURCE DEMAND & UTILIZATION / FUNNEL
      ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Most Demanded Resources Bar Chart */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E7E5DC] p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#082D46] font-heading">
                Most Requested Resources
              </h2>
              <p className="text-xs text-[#596B76] mt-0.5">
                Top items by volume from real event inquiries & booking agreements
              </p>
            </div>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>

          {(!resource_demand || resource_demand.length === 0) ? (
            <div className="h-48 flex items-center justify-center text-center p-6 bg-[#FCFAF3] rounded-xl border border-dashed border-[#E3DEC3]">
              <p className="text-xs text-slate-400">No resource demand data available yet.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {resource_demand.map((item, idx) => {
                const maxQty = Math.max(...resource_demand.map((r) => r.total_quantity), 1);
                const percent = Math.min(Math.round((item.total_quantity / maxQty) * 100), 100);
                const isHovered = hoveredBar === idx;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredBar(idx)}
                    onMouseLeave={() => setHoveredBar(null)}
                    className="space-y-1.5 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 truncate pr-2">
                        <span className="font-bold text-[#082D46] group-hover:text-[#114B70] transition-colors truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-extrabold text-[#082D46]">
                          {item.total_quantity.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1">units</span>
                      </div>
                    </div>

                    {/* Bar visualization */}
                    <div className="h-2.5 w-full bg-[#F0ECE1] rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percent}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          isHovered ? 'bg-[#D99B26]' : 'bg-[#082D46]'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 5th Visual: Role Specific (Utilization for Provider, Funnel for Seeker) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E7E5DC] p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#082D46] font-heading">
                {isProvider ? 'Inventory Utilization Monitor' : 'Event Booking Conversion Funnel'}
              </h2>
              <p className="text-xs text-[#596B76] mt-0.5">
                {isProvider
                  ? 'Real-time available stock vs committed calendar reservations'
                  : 'End-to-end demand progression from requirement to execution'}
              </p>
            </div>
            {isProvider ? (
              <PieChart className="w-4 h-4 text-slate-400" />
            ) : (
              <TrendingUp className="w-4 h-4 text-slate-400" />
            )}
          </div>

          {/* Provider: Inventory Utilization List */}
          {isProvider && auxiliary?.type === 'utilization' && (
            <div className="space-y-3">
              {(!auxiliary.items || auxiliary.items.length === 0) ? (
                <div className="h-48 flex items-center justify-center text-center p-6 bg-[#FCFAF3] rounded-xl border border-dashed border-[#E3DEC3]">
                  <p className="text-xs text-slate-400">No inventory items registered.</p>
                </div>
              ) : (
                auxiliary.items.slice(0, 5).map((res) => (
                  <div key={res.resource_id} className="p-3 rounded-xl bg-[#FCFAF3] border border-[#E7E5DC] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-[#082D46]">{res.name}</span>
                        <span className="text-[10px] text-slate-400 ml-2">({res.category})</span>
                      </div>
                      <span className="font-bold text-[#2F7D4A]">
                        {res.available_quantity} / {res.total_quantity} Ready
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.max(res.utilization_rate, 5)}%` }}
                          className="h-full bg-[#082D46] rounded-full"
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-[#082D46]">
                        {res.booked_quantity > 0 ? `${res.booked_quantity} booked` : '100% available'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Seeker: Activity Conversion Funnel */}
          {!isProvider && auxiliary?.type === 'funnel' && (
            <div className="space-y-3 pt-1">
              {auxiliary.items.map((stage, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#FCFAF3] border border-[#E7E5DC]"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-[#082D46] text-[#F4D98A] flex items-center justify-center font-bold text-xs shrink-0">
                      0{idx + 1}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#082D46] font-heading">
                        {stage.stage}
                      </div>
                      <div className="text-[11px] text-[#596B76]">
                        {stage.description}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-extrabold text-[#082D46] font-heading">
                      {stage.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
