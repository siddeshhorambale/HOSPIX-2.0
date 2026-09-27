import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { WeatherMap } from './WeatherMap';
import {
  CloudRain,
  Wind,
  Thermometer,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  Radio,
  MapPin,
  Clock,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Cpu,
  CheckCircle2,
  Sliders,
  Info,
} from 'lucide-react';

export const WeatherTwinView = () => {
  // Scenario simulation state
  const [rainfallMm, setRainfallMm] = useState(45);
  const [durationHours, setDurationHours] = useState(2);
  const [temperatureC, setTemperatureC] = useState(27);
  const [selectedReqId, setSelectedReqId] = useState(null);

  // Data states
  const [requirements, setRequirements] = useState([]);
  const [liveWeather, setLiveWeather] = useState(null);
  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState(null);

  // Presets
  const PRESETS = [
    { label: 'Clear Skies', rain: 0, duration: 1, temp: 30 },
    { label: 'Moderate Monsoon', rain: 28, duration: 2, temp: 27 },
    { label: 'Heavy Downpour', rain: 55, duration: 3, temp: 25 },
    { label: 'Extreme Cloudburst', rain: 95, duration: 4, temp: 24 },
  ];

  // Load initial data
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        const [reqsRes, weatherRes] = await Promise.all([
          api.get('/weather-twin/requirements').catch(() => []),
          api.get('/weather-twin/live-weather?city=Thane').catch(() => null),
        ]);

        setRequirements(reqsRes || []);
        if (reqsRes && reqsRes.length > 0) {
          setSelectedReqId(reqsRes[0].id);
        }
        setLiveWeather(weatherRes);

        // Run default baseline simulation
        const initialSim = await api.post('/weather-twin/simulate', {
          requirement_id: reqsRes?.[0]?.id || null,
          rainfall_mm: 45.0,
          duration_hours: 2.0,
          temperature_c: 27.0,
          city: 'Thane',
        });
        setSimResult(initialSim);
      } catch (err) {
        console.error('Failed to initialize Weather Twin:', err);
        setError(err.message || 'Could not initialize Digital Twin');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleRunSimulation = async (overrideRain = null, overrideDur = null, overrideTemp = null) => {
    setSimulating(true);
    setError(null);
    const rain = overrideRain !== null ? overrideRain : rainfallMm;
    const dur = overrideDur !== null ? overrideDur : durationHours;
    const temp = overrideTemp !== null ? overrideTemp : temperatureC;

    try {
      const res = await api.post('/weather-twin/simulate', {
        requirement_id: selectedReqId,
        rainfall_mm: parseFloat(rain),
        duration_hours: parseFloat(dur),
        temperature_c: parseFloat(temp),
        city: 'Thane',
      });
      setSimResult(res);
    } catch (err) {
      console.error('Simulation execution failed:', err);
      setError(err.message || 'Simulation execution failed');
    } finally {
      setSimulating(false);
    }
  };

  const applyPreset = (preset) => {
    setRainfallMm(preset.rain);
    setDurationHours(preset.duration);
    setTemperatureC(preset.temp);
    handleRunSimulation(preset.rain, preset.duration, preset.temp);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse">
        <div className="h-10 w-96 bg-slate-200 rounded-xl" />
        <div className="h-28 bg-white rounded-2xl border border-[#E7E5DC]" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 h-96 bg-white rounded-2xl border border-[#E7E5DC]" />
          <div className="lg:col-span-8 h-96 bg-white rounded-2xl border border-[#E7E5DC]" />
        </div>
      </div>
    );
  }

  const baseline = simResult?.baseline_state;
  const simulated = simResult?.simulated_state;
  const nugen = simResult?.nugen_intelligence;
  const signals = simResult?.social_signals || [];
  const mapEntities = simResult?.map_entities;
  const currentReq = simResult?.requirement;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in font-body">
      {/* ============================================================
          1. HEADER & LIVE WEATHER TELEMETRY STRIP
      ============================================================ */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E3DEC3] pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#082D46] text-[#F4D98A]">
              <Sparkles className="w-3.5 h-3.5 text-[#F4D98A]" />
              <span>Digital Twin Engine</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E8F2F6] text-[#082D46] border border-[#D0E4ED]">
              <Cpu className="w-3 h-3 text-[#082D46]" />
              <span>Nugen Domain Intelligence Aligned</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#082D46] tracking-tight font-heading">
            Weather-Driven Digital Twin & Impact Simulation
          </h1>
          <p className="text-xs sm:text-sm text-[#596B76] mt-1 max-w-2xl">
            Simulate meteorological disruptions across Mumbai & Thane logistics corridors, predict supply chain delays, and trigger collaborative multi-hub pooling.
          </p>
        </div>

        {/* Live Weather Indicator */}
        {liveWeather && (
          <div className="bg-white p-3.5 rounded-2xl border border-[#E7E5DC] shadow-xs flex items-center space-x-4 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-[#E8F2F6] text-[#082D46] flex items-center justify-center font-bold">
              <CloudRain className="w-5 h-5 text-[#082D46]" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#2F7D4A] animate-pulse" />
                <span>Live Station Telemetry ({liveWeather.location_name})</span>
              </div>
              <div className="text-sm font-extrabold text-[#082D46] flex items-center space-x-2 mt-0.5">
                <span>{liveWeather.temperature_c}°C</span>
                <span className="text-slate-300">•</span>
                <span>{liveWeather.precipitation_mm} mm rain</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-[#2F7D4A] font-semibold">{liveWeather.condition}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Production Database Security Guarantee Banner */}
      <div className="p-3 bg-[#FCFAF3] rounded-xl border border-[#E3DEC3] flex items-center justify-between text-xs text-[#596B76]">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-[#2F7D4A] shrink-0" />
          <span>
            <strong className="text-[#082D46]">Production Safety Guarantee:</strong> All simulations execute in transient in-memory twin states. Live bookings, inventory, and supplier agreements remain 100% unaltered.
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#2F7D4A] bg-[#E7F4EA] px-2 py-0.5 rounded-md border border-[#C5E5CE]">
          Read-Only Simulation
        </span>
      </div>

      {/* ============================================================
          2. SIMULATION CONTROLS & GEOSPATIAL MAP (2 COLUMNS)
      ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: What-If Controls */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#E7E5DC] shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-3">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-[#082D46]" />
              <h2 className="text-sm font-bold text-[#082D46] font-heading">
                What-If Scenario Controls
              </h2>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">Counterfactual Twin</span>
          </div>

          {/* Target Requirement Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#082D46]">
              Target Event Requirement
            </label>
            <select
              value={selectedReqId || ''}
              onChange={(e) => setSelectedReqId(Number(e.target.value))}
              className="w-full text-xs p-2.5 bg-[#FCFAF3] rounded-xl border border-[#E7E5DC] text-[#082D46] font-medium focus:outline-none focus:ring-2 focus:ring-[#082D46]"
            >
              {requirements.map((r) => (
                <option key={r.id} value={r.id}>
                  #{r.id} {r.title} ({r.city})
                </option>
              ))}
            </select>
            {currentReq && (
              <p className="text-[11px] text-[#596B76]">
                Items: {currentReq.items?.map((it) => `${it.quantity}x ${it.resource_type}`).join(', ')}
              </p>
            )}
          </div>

          {/* Quick Scenario Presets */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Quick Scenarios
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  className={`p-2 rounded-xl text-xs font-semibold text-left border transition-all ${
                    rainfallMm === p.rain
                      ? 'bg-[#082D46] text-[#F4D98A] border-[#082D46]'
                      : 'bg-[#FCFAF3] text-[#596B76] border-[#E7E5DC] hover:border-[#082D46]'
                  }`}
                >
                  <div className="font-bold">{p.label}</div>
                  <div className="text-[10px] opacity-80">{p.rain} mm/hr • {p.duration}h</div>
                </button>
              ))}
            </div>
          </div>

          {/* Slider 1: Rainfall Intensity */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center space-x-1.5 text-[#082D46]">
                <CloudRain className="w-3.5 h-3.5 text-[#082D46]" />
                <span>Rainfall Intensity</span>
              </span>
              <span className="text-[#8C6A00] font-extrabold text-sm">{rainfallMm} mm/hr</span>
            </div>
            <input
              type="range"
              min="0"
              max="120"
              step="5"
              value={rainfallMm}
              onChange={(e) => setRainfallMm(Number(e.target.value))}
              className="w-full accent-[#082D46] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0mm (Dry)</span>
              <span>35mm (Moderate)</span>
              <span>75mm (Severe)</span>
              <span>120mm (Cloudburst)</span>
            </div>
          </div>

          {/* Slider 2: Storm Duration */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center space-x-1.5 text-[#082D46]">
                <Clock className="w-3.5 h-3.5 text-[#082D46]" />
                <span>Storm Duration</span>
              </span>
              <span className="text-[#082D46] font-extrabold text-sm">{durationHours} Hours</span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              step="0.5"
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
              className="w-full accent-[#082D46] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>1 Hour</span>
              <span>4 Hours</span>
              <span>8 Hours</span>
            </div>
          </div>

          {/* Slider 3: Temperature */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center space-x-1.5 text-[#082D46]">
                <Thermometer className="w-3.5 h-3.5 text-[#082D46]" />
                <span>Ambient Temperature</span>
              </span>
              <span className="text-[#082D46] font-extrabold text-sm">{temperatureC}°C</span>
            </div>
            <input
              type="range"
              min="20"
              max="42"
              step="1"
              value={temperatureC}
              onChange={(e) => setTemperatureC(Number(e.target.value))}
              className="w-full accent-[#082D46] cursor-pointer"
            />
          </div>

          {/* Run Action Button */}
          <button
            onClick={() => handleRunSimulation()}
            disabled={simulating}
            className="w-full hospix-btn-primary py-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-sm"
          >
            {simulating ? (
              <span>Running Digital Twin & Nugen Inference...</span>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Run Digital Twin Simulation</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Geospatial Leaflet Map */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#082D46] font-heading">
                Geospatial Logistics & Weather Radar Map
              </h2>
              <p className="text-xs text-[#596B76]">
                Simulated weather impact circles, candidate supplier hubs, and transit corridors across Mumbai-Thane
              </p>
            </div>
          </div>

          <WeatherMap
            eventLocation={mapEntities?.event_location}
            providers={simulated?.affected_providers || mapEntities?.providers}
            impactRadiusKm={mapEntities?.impact_radius_km || 3.5}
            rainfallMm={rainfallMm}
          />
        </div>
      </div>

      {/* ============================================================
          3. REAL-WORLD SOCIAL & PUBLIC SIGNALS FEED
      ============================================================ */}
      <div className="bg-white p-6 rounded-2xl border border-[#E7E5DC] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-3">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-[#D99B26] animate-pulse" />
            <h2 className="text-sm font-bold text-[#082D46] font-heading">
              Real-World Social & Public Signals
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">IMD Alerts • Traffic Police Broadcasts • Commuter Feeds</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {signals.map((sig) => {
            const isCrit = sig.severity === 'CRITICAL';
            const isWarn = sig.severity === 'WARNING';
            const badgeBg = isCrit ? 'bg-red-50 text-red-700 border-red-200' : (isWarn ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200');

            return (
              <div key={sig.id} className="p-4 rounded-xl bg-[#FCFAF3] border border-[#E7E5DC] space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="font-bold text-slate-500 uppercase">{sig.source}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold border ${badgeBg}`}>
                      {sig.severity}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-[#082D46] line-clamp-1">{sig.title}</h3>
                  <p className="text-[11px] text-[#596B76] mt-1 leading-relaxed">{sig.summary}</p>
                </div>
                <div className="pt-2 border-t border-[#E7E5DC] text-[10px] text-[#8C6A00] font-semibold flex items-center space-x-1">
                  <Info className="w-3 h-3 text-[#8C6A00]" />
                  <span className="truncate">{sig.operational_impact}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================
          4. BASELINE VS. SIMULATED IMPACT COMPARISON
      ============================================================ */}
      <div className="bg-white p-6 rounded-2xl border border-[#E7E5DC] shadow-xs space-y-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6A00]">
            Digital Twin Impact Propagation
          </span>
          <h2 className="text-base font-bold text-[#082D46] font-heading mt-0.5">
            Baseline vs. Simulated Counterfactual State
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Metric 1: Delivery Risk */}
          <div className="p-4 rounded-xl bg-[#FCFAF3] border border-[#E7E5DC] space-y-2">
            <span className="text-[11px] text-slate-500 font-semibold">Delivery Risk Score</span>
            <div className="flex items-baseline space-x-3">
              <div>
                <div className="text-[10px] text-slate-400">Baseline</div>
                <div className="text-lg font-bold text-[#2F7D4A]">{baseline?.delivery_risk_percent}%</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300" />
              <div>
                <div className="text-[10px] text-slate-400">Simulated</div>
                <div className={`text-xl font-extrabold ${simulated?.delivery_risk_percent >= 60 ? 'text-red-600' : (simulated?.delivery_risk_percent >= 35 ? 'text-amber-600' : 'text-[#2F7D4A]')}`}>
                  {simulated?.delivery_risk_percent}%
                </div>
              </div>
            </div>
          </div>

          {/* Metric 2: Expected Delay */}
          <div className="p-4 rounded-xl bg-[#FCFAF3] border border-[#E7E5DC] space-y-2">
            <span className="text-[11px] text-slate-500 font-semibold">Expected Transit Delay</span>
            <div className="flex items-baseline space-x-3">
              <div>
                <div className="text-[10px] text-slate-400">Baseline</div>
                <div className="text-lg font-bold text-[#082D46]">+{baseline?.expected_delay_mins}m</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300" />
              <div>
                <div className="text-[10px] text-slate-400">Simulated</div>
                <div className="text-xl font-extrabold text-red-600">
                  +{simulated?.expected_delay_mins} mins
                </div>
              </div>
            </div>
          </div>

          {/* Metric 3: Resource Vulnerability */}
          <div className="p-4 rounded-xl bg-[#FCFAF3] border border-[#E7E5DC] space-y-1">
            <span className="text-[11px] text-slate-500 font-semibold">Resource Vulnerability</span>
            <div className="text-sm font-extrabold text-[#082D46] pt-1">
              {rainfallMm >= 25 ? 'High Water Damage Risk' : 'Low / Sheltered'}
            </div>
            <p className="text-[10px] text-slate-500">
              {rainfallMm >= 25 ? 'Shrink-wrap mandatory for banquet fabric' : 'Standard flatbed transport ok'}
            </p>
          </div>

          {/* Metric 4: Corridor Status */}
          <div className="p-4 rounded-xl bg-[#FCFAF3] border border-[#E7E5DC] space-y-1">
            <span className="text-[11px] text-slate-500 font-semibold">Transport Corridor</span>
            <div className="text-sm font-extrabold text-[#082D46] pt-1">
              {simulated?.status?.replace('_', ' ')}
            </div>
            <p className="text-[10px] text-slate-500">
              Ghodbunder & EEH transit routes
            </p>
          </div>
        </div>

        {/* Affected Providers Grid */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-[#082D46] uppercase tracking-wider">
            Simulated Provider Disruption Risk
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {simulated?.affected_providers?.map((prov) => {
              const isDis = prov.status === 'SEVERELY_DISRUPTED';
              const isWarn = prov.status === 'AT_RISK';
              const badgeStyle = isDis ? 'bg-red-50 text-red-700 border-red-200' : (isWarn ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200');

              return (
                <div key={prov.provider_id} className="p-3.5 rounded-xl bg-[#FCFAF3] border border-[#E7E5DC] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#082D46]">{prov.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                      {prov.disruption_risk_percent}% Risk
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>{prov.city} ({prov.distance_km} km)</span>
                    <span className="text-[10px] text-[#8C6A00] font-semibold">{prov.recommended_routing}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================
          5. NUGEN DOMAIN-ALIGNED REASONING PANEL
      ============================================================ */}
      <div className="bg-[#082D46] text-white p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-lg space-y-6">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/15 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#F4D98A] text-[#082D46] flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-[#082D46]" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#F4D98A] uppercase tracking-wider flex items-center space-x-1.5">
                <span>Nugen Intelligence Reasoning</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-300 font-normal">Aligned Domain Inference</span>
              </div>
              <h2 className="text-lg font-bold font-heading">
                Operational Impact & Cascading Analysis
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-white/10 text-slate-300 border border-white/15 font-mono text-[11px]">
              Engine: {nugen?.engine || 'Nugen (gpt-oss-120b)'}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#2F7D4A] text-white font-bold text-[11px]">
              {nugen?.confidence || 94}% Confidence
            </span>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div>
              <div className="text-xs font-bold text-[#F4D98A] uppercase tracking-wider mb-1">
                Operational Impact Assessment
              </div>
              <p className="text-slate-200 text-sm leading-relaxed">
                {nugen?.operational_impact}
              </p>
            </div>

            <div>
              <div className="text-xs font-bold text-[#F4D98A] uppercase tracking-wider mb-1">
                Cascading Logistics Effects
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                {nugen?.cascading_effects}
              </p>
            </div>
          </div>

          {/* Signature Multi-Hub Collaborative Pooling Solution */}
          <div className="lg:col-span-5 bg-white/10 rounded-2xl p-5 border border-white/20 space-y-3">
            <div className="flex items-center space-x-2 text-[#F4D98A]">
              <Layers className="w-4 h-4 text-[#F4D98A]" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                HOSPIX Multi-Hub Pooling Solution
              </h3>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {nugen?.pooling_recommendation}
            </p>

            {simulated?.pooling_solution?.is_recommended && (
              <div className="pt-2 border-t border-white/15 space-y-2">
                <span className="text-[10px] text-[#F4D98A] font-bold uppercase">
                  Co-Supplying Partner Hubs Activated:
                </span>
                <div className="space-y-1.5">
                  {simulated.pooling_solution.allocated_hubs.map((hub, i) => (
                    <div key={i} className="text-[11px] bg-white/10 p-2 rounded-lg flex items-center justify-between">
                      <span className="font-semibold text-white">{hub.provider}</span>
                      <span className="text-slate-300 text-[10px]">{hub.portion}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-[#2F7D4A] bg-white px-2 py-1 rounded-md font-bold text-center mt-2">
                  ✓ Recovers ~{simulated.pooling_solution.delay_savings_mins} mins delay via sub-3km dry corridor routing
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nugen Customization Credentials Footer */}
        <div className="relative z-10 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <div>
            <span>Alignment ID: </span>
            <code className="text-slate-200 font-mono">alignment_01m3fw6jtv7gc7ed</code>
          </div>
          <div>
            <span>Training Corpus: </span>
            <code className="text-slate-200 font-mono">document_01m3fw4fmgg15jnz</code>
          </div>
          <div>
            <span>Domain: </span>
            <span className="text-slate-200">Hospitality Resource Logistics & Weather Reasoning</span>
          </div>
        </div>
      </div>
    </div>
  );
};
