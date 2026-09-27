import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { ProviderDashboard } from './components/ProviderDashboard';
import { SeekerRequirementCreator } from './components/SeekerRequirementCreator';
import { SeekerRequirementsList } from './components/SeekerRequirementsList';
import { MatchingResultsView } from './components/MatchingResultsView';
import { BookingsManagementView } from './components/BookingsManagementView';
import { ProfileView } from './components/ProfileView';
import { InsightsView } from './components/InsightsView';
import { WeatherTwinView } from './components/WeatherTwinView';
import { HospixSplashScreen } from './components/HospixSplashScreen';
import hospixLogo from './assets/HOSPIX.png';
import { useInView } from './hooks/useInView';
import { api } from './services/api';
import {
  Layers,
  Sparkles,
  Building2,
  Calendar,
  Shield,
  ArrowRight,
  Truck,
  CheckCircle2,
  X,
  Check,
  Star,
  MapPin,
  Users,
  ChevronRight,
  SlidersHorizontal,
  RefreshCw,
  ShieldCheck,
  Clock,
  Package,
} from 'lucide-react';

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Post Your Requirement',
    badge: 'AI Requirement Parser',
    desc: 'Describe what you need in freeform event notes or itemized counts. Our AI parser extracts dates, items, and quantities instantly.',
    icon: Sparkles,
    color: 'bg-[#FFF2C7] text-[#8C6A00] border-[#F4D98A]/50',
  },
  {
    step: '02',
    title: 'Get Matched & Pooled',
    badge: 'Availability Engine',
    desc: 'Single supplier have enough stock? Great. If not, HOSPIX automatically pools 2-3 trusted nearby providers into a unified order.',
    icon: Layers,
    color: 'bg-[#E8F2F6] text-[#082D46] border-[#D0E4ED]',
  },
  {
    step: '03',
    title: 'Compare & Choose',
    badge: 'Transparent Pricing',
    desc: 'Review verified provider ratings, itemized unit rates, hub distances, and delivery terms before making any commitment.',
    icon: SlidersHorizontal,
    color: 'bg-[#FCFAF3] text-[#082D46] border-[#E7E5DC]',
  },
  {
    step: '04',
    title: 'Confirm & Guarantee',
    badge: 'Zero Double-Booking',
    desc: 'Our availability-aware state machine locks inventory for your specific event date, preventing double-booking and securing fulfillment.',
    icon: ShieldCheck,
    color: 'bg-[#E7F4EA] text-[#2F7D4A] border-[#C5E5CE]',
  },
];

const MainApp = () => {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [seedNotice, setSeedNotice] = useState('');
  const [scrollY, setScrollY] = useState(0);

  // Workflow interactive step selection
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);

  // Brand Moment Simulation toggle: 'single' vs 'pooled'
  const [simulationMode, setSimulationMode] = useState('pooled');

  // Hero pointer parallax state (restricted to gentle 3-6px bounds)
  const [heroMouse, setHeroMouse] = useState({ x: 0, y: 0 });

  // Scroll storytelling intersection observers
  const [featuresRef, featuresInView] = useInView({ threshold: 0.12 });
  const [brandMomentRef, brandMomentInView] = useInView({ threshold: 0.12 });
  const [ctaRef, ctaInView] = useInView({ threshold: 0.12 });

  // Subtle hero parallax listener
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
        setScrollY(Math.min(window.scrollY * 0.04, 12));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleHeroMouseMove = (e) => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setHeroMouse({ x, y });
  };

  const handleHeroMouseLeave = () => {
    setHeroMouse({ x: 0, y: 0 });
  };

  const handleSeedDatabase = async () => {
    setSeeding(true);
    try {
      const res = await api.post('/seed');
      setSeedNotice(res.message || 'Mumbai & Thane seed data loaded successfully!');
      setTimeout(() => setSeedNotice(''), 5000);
      window.location.reload();
    } catch (err) {
      alert('Error seeding database: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const handleLaunchWorkflow = (mode = 'login') => {
    if (user) {
      setActiveTab(user.role === 'PROVIDER' ? 'inventory' : 'seeker_new');
    } else {
      setAuthModalMode(mode);
      setShowAuthModal(true);
    }
  };

  if (loading || showSplash) {
    return <HospixSplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4E9] text-slate-900 font-body">
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'login') {
            setAuthModalMode('login');
            setShowAuthModal(true);
          } else if (tab === 'register') {
            setAuthModalMode('register');
            setShowAuthModal(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onSeedDatabase={handleSeedDatabase}
        seeding={seeding}
      />

      {/* Temporary Seed Notice */}
      {seedNotice && (
        <div className="bg-[#2F7D4A] text-white text-xs text-center py-2.5 px-4 font-semibold flex items-center justify-center space-x-2 shadow-xs animate-fade-in-down">
          <CheckCircle2 className="w-4 h-4" />
          <span>{seedNotice}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Landing / Welcome Screen when not signed in or activeTab === 'home' */}
        {(!user || activeTab === 'home') && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-8 sm:space-y-12">
            
            {/* ============================================================
                1. HERO SECTION — IMMERSIVE & ALIVE
            ============================================================ */}
            <div 
              onMouseMove={handleHeroMouseMove}
              onMouseLeave={handleHeroMouseLeave}
              className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center pt-2 sm:pt-6"
            >
              {/* Left Column: Editorial Headline & Actions */}
              <div className="lg:col-span-7 space-y-6">
                <span className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#E8F2F6] text-[#082D46] border border-[#D0E4ED] animate-fade-in-up">
                  <Sparkles className="w-3.5 h-3.5 text-[#D99B26]" />
                  <span>Intelligent B2B Hospitality Resource Exchange</span>
                </span>

                {/* Editorial Line-by-Line Reveal */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#082D46] tracking-tight leading-[1.12] font-heading">
                  <span className="block animate-fade-in-up stagger-1">Find What Your Event Needs.</span>
                  <span className="block animate-fade-in-up stagger-2 text-[#082D46]">Connect with the Right People.</span>
                  <span className="block animate-fade-in-up stagger-3 text-[#D99B26]">Make It Happen.</span>
                </h1>

                <p className="text-base sm:text-lg text-[#596B76] max-w-xl font-normal leading-relaxed animate-fade-in-up stagger-3">
                  Connect with trusted local providers for banquet seating, fine diningware, sound rigs, and catering supplies across Mumbai & Thane hubs. Guaranteed availability without double-booking.
                </p>

                {/* Primary & Secondary Hero CTAs */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-fade-in-up stagger-4">
                  <button
                    onClick={() => handleLaunchWorkflow('login')}
                    className="hospix-btn-primary px-7 py-3.5 text-sm rounded-xl shadow-md group relative overflow-hidden active:scale-[0.98] transition-all duration-200"
                  >
                    <span className="font-bold">
                      {user ? (user.role === 'PROVIDER' ? 'Go to Inventory' : 'Post a Requirement') : 'Sign In with Demo Account'}
                    </span>
                    <ArrowRight className="w-4 h-4 ml-1 hospix-arrow transition-transform duration-200 group-hover:translate-x-1" />
                  </button>

                  <button
                    onClick={handleSeedDatabase}
                    disabled={seeding}
                    className="hospix-btn-secondary px-5 py-3.5 text-sm rounded-xl transition-all duration-200 active:scale-[0.98]"
                  >
                    <RefreshCw className={`w-4 h-4 text-[#596B76] ${seeding ? 'animate-spin' : ''}`} />
                    <span>{seeding ? 'Seeding...' : 'Seed Mumbai/Thane Demo Hubs'}</span>
                  </button>
                </div>

                {/* Social Proof / Trust Badge */}
                <div className="pt-2 flex items-center space-x-3.5 animate-fade-in-up stagger-4">
                  <div className="flex -space-x-2 overflow-hidden">
                    <img
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                      alt="Verified Seeker"
                    />
                    <img
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
                      alt="Verified Provider"
                    />
                    <img
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80"
                      alt="Verified Event Planner"
                    />
                  </div>
                  <div className="text-xs text-[#596B76]">
                    <span className="font-bold text-[#082D46]">Trusted by 500+ hospitality businesses</span>
                    <div className="flex items-center space-x-1.5 text-[#8C6A00] font-bold">
                      <Star className="w-3.5 h-3.5 fill-[#8C6A00] text-[#8C6A00]" />
                      <span>4.9 / 5 Rating</span>
                      <span className="text-[#8A979D] font-normal">• Mumbai & Thane Region</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Showcase with Pointer Parallax */}
              <div className="lg:col-span-5 relative animate-fade-in-up stagger-2">
                <div 
                  className="relative rounded-3xl overflow-hidden shadow-xl border border-[#E7E5DC] bg-white group hospix-resource-card transition-all duration-300 ease-out"
                  style={{
                    transform: `perspective(1000px) rotateY(${heroMouse.x * 2.5}deg) rotateX(${-heroMouse.y * 2.5}deg) translate3d(${heroMouse.x * 4}px, ${heroMouse.y * 4 + scrollY}px, 0)`,
                  }}
                >
                  <div className="hospix-img-container overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1000&q=80"
                      alt="Luxury hospitality banquet setup"
                      className="w-full h-80 sm:h-96 lg:h-[430px] object-cover hospix-resource-img transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#082D46]/70 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Floating Depth Card Badge */}
                  <div 
                    className="absolute bottom-5 left-5 right-5 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-lg flex items-center justify-between transition-transform duration-200"
                    style={{
                      transform: `translate3d(${-heroMouse.x * 5}px, ${-heroMouse.y * 5}px, 0)`,
                    }}
                  >
                    <div>
                      <div className="text-xs font-bold text-[#082D46] font-heading">Grand Banquet & Gala Inventory</div>
                      <div className="text-[11px] text-[#596B76] flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#082D46]" />
                        <span>Thane Hub • 400 Seater Capacity Ready</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#E7F4EA] text-[#2F7D4A] border border-[#C5E5CE]">
                      Live Inventory
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================
                2. HOSPIX BRAND MOMENT — DEMAND COORDINATION ENGINE
            ============================================================ */}
            <div ref={brandMomentRef} className="space-y-4 pt-1 animate-fade-in-up">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FFF2C7] text-[#8C6A00] border border-[#F4D98A]/60">
                  <Layers className="w-3.5 h-3.5 text-[#8C6A00]" />
                  <span>The HOSPIX Difference</span>
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#082D46] tracking-tight font-heading">
                  Never Turn Down an Event Due to Supply Shortage.
                </h2>
                <p className="text-xs sm:text-sm text-[#596B76] leading-relaxed">
                  When a single provider doesn't have enough chairs or tables, HOSPIX coordinates 2–3 nearby suppliers into a single, seamless delivery.
                </p>

                {/* Interactive Simulator Mode Switcher */}
                <div className="inline-flex p-1 bg-white border border-[#E3DEC3] rounded-xl shadow-2xs mt-3">
                  <button
                    onClick={() => setSimulationMode('single')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      simulationMode === 'single'
                        ? 'bg-[#082D46] text-[#F4D98A] shadow-xs'
                        : 'text-[#596B76] hover:text-[#082D46]'
                    }`}
                  >
                    Single Provider Match
                  </button>
                  <button
                    onClick={() => setSimulationMode('pooled')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      simulationMode === 'pooled'
                        ? 'bg-[#082D46] text-[#F4D98A] shadow-xs'
                        : 'text-[#596B76] hover:text-[#082D46]'
                    }`}
                  >
                    Multi-Provider Pooled Network
                  </button>
                </div>
              </div>

              {/* Interactive Coordination Demonstration Card */}
              <div className="bg-white rounded-3xl border border-[#E3DEC3] p-6 sm:p-8 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  
                  {/* Left: Event Demand Specification */}
                  <div className="lg:col-span-4 p-5 rounded-2xl bg-[#FCFAF3] border border-[#E7E5DC] space-y-3">
                    <div className="text-[11px] font-bold text-[#8C6A00] uppercase tracking-wider flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#8C6A00]" />
                      <span>Event Demand Profile</span>
                    </div>
                    <div className="text-base font-bold text-[#082D46] font-heading">
                      Grand Reception Banquet
                    </div>
                    <div className="text-xs text-[#596B76] flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>Location: Thane West Hub</span>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-[#E3DEC3]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">Banquet Chairs:</span>
                        <span className="font-bold text-[#082D46]">200 Units</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">Round Dining Tables:</span>
                        <span className="font-bold text-[#082D46]">15 Units</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">Chafing Warmers:</span>
                        <span className="font-bold text-[#082D46]">4 Units</span>
                      </div>
                    </div>
                  </div>

                  {/* Center & Right: Simulation Engine Output */}
                  <div className="lg:col-span-8 space-y-4">
                    {simulationMode === 'single' ? (
                      <div className="p-5 rounded-2xl bg-[#FFFDF6] border border-[#D0E2ED] space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E8F2F6] text-[#082D46] border border-[#D0E4ED]">
                            Single Provider Match (Individual)
                          </span>
                          <span className="text-xs font-bold text-[#2F7D4A] flex items-center space-x-1">
                            <CheckCircle2 className="w-4 h-4 text-[#2F7D4A]" />
                            <span>100% Demand Met</span>
                          </span>
                        </div>
                        <div className="text-sm font-bold text-[#082D46]">
                          Greenfield Rentals & Banquets
                        </div>
                        <p className="text-xs text-[#596B76] leading-relaxed">
                          Directly supplies all 200 chairs, 15 tables, and 4 chafing dishes from a single operating hub in Thane.
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-2 border-t border-[#F0ECE1]">
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-[#082D46]" />
                            <span>3.2 km distance</span>
                          </span>
                          <span className="flex items-center space-x-1 text-[#8C6A00] font-semibold">
                            <Star className="w-3.5 h-3.5 fill-[#8C6A00] text-[#8C6A00]" />
                            <span>4.9 Rating (42 reviews)</span>
                          </span>
                          <span className="flex items-center space-x-1 text-[#2F7D4A] font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#2F7D4A]" />
                            <span>PAN Verified Business</span>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 rounded-2xl bg-[#FCFAF3] border border-[#F4D98A]/70 space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#082D46] text-[#F4D98A]">
                            POOLED NETWORK SOLUTION (2 Providers Coordinated)
                          </span>
                          <span className="text-xs font-bold text-[#2F7D4A] flex items-center space-x-1">
                            <ShieldCheck className="w-4 h-4 text-[#2F7D4A]" />
                            <span>100% Demand Coordinated</span>
                          </span>
                        </div>
                        
                        {/* Coordinated Providers Breakdown */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div className="p-3 bg-white rounded-xl border border-[#E3DEC3] space-y-1">
                            <div className="text-xs font-bold text-[#082D46]">Provider A: Thane Events Hub</div>
                            <div className="text-[11px] text-[#596B76]">120 Chairs • 8 Tables • 2 Chafing Dishes</div>
                            <div className="text-[10px] text-[#8C6A00] font-semibold flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-[#082D46]" />
                              <span>2.8 km away • 4.8</span>
                              <Star className="w-2.5 h-2.5 fill-[#8C6A00] text-[#8C6A00]" />
                            </div>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-[#E3DEC3] space-y-1">
                            <div className="text-xs font-bold text-[#082D46]">Provider B: Mulund Banquets Hub</div>
                            <div className="text-[11px] text-[#596B76]">80 Chairs • 7 Tables • 2 Chafing Dishes</div>
                            <div className="text-[10px] text-[#8C6A00] font-semibold flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-[#082D46]" />
                              <span>4.1 km away • 4.9</span>
                              <Star className="w-2.5 h-2.5 fill-[#8C6A00] text-[#8C6A00]" />
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-[#596B76] leading-relaxed pt-1">
                          HOSPIX aggregates availability into a single booking agreement with synchronized delivery times.
                        </p>
                      </div>
                    )}

                    {/* Interactive Button */}
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={handleLaunchWorkflow}
                        className="hospix-btn-primary text-xs px-5 py-2.5 rounded-xl font-bold"
                      >
                        <span>Test Matching with Your Event</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* ============================================================
                4. "HOW HOSPIX WORKS" — INTERACTIVE STORYTELLING
            ============================================================ */}
            <div ref={featuresRef} className="space-y-4 pt-1 animate-fade-in-up">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8C6A00] font-heading">
                  Transaction Lifecycle
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#082D46] tracking-tight font-heading">
                  How HOSPIX Works
                </h2>
                <p className="text-xs sm:text-sm text-[#596B76]">
                  A transparent, time-bound protocol built specifically for hospitality resource logistics.
                </p>
              </div>

              {/* 4-Step Interactive Story Sequence */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {WORKFLOW_STEPS.map((wf, idx) => {
                  const Icon = wf.icon;
                  const isActive = activeWorkflowStep === idx;
                  return (
                    <div
                      key={wf.step}
                      onClick={() => setActiveWorkflowStep(idx)}
                      className={`hospix-card-hover p-5 rounded-2xl bg-white border group cursor-pointer transition-all duration-200 ${
                        isActive
                          ? 'border-[#082D46] ring-2 ring-[#082D46] shadow-md bg-[#FFFDF6]'
                          : 'border-[#E7E5DC] hover:border-[#082D46]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3.5">
                        <div className={`w-10 h-10 rounded-xl ${wf.color} border flex items-center justify-center font-bold transition-transform duration-180 group-hover:scale-105`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-extrabold text-slate-300 group-hover:text-[#082D46] transition-colors font-heading">
                          {wf.step}
                        </span>
                      </div>

                      <div className="text-[10px] font-bold text-[#8C6A00] uppercase tracking-wider mb-1">
                        {wf.badge}
                      </div>

                      <h3 className="text-sm font-bold text-[#082D46] mb-1.5 font-heading">
                        {wf.title}
                      </h3>

                      <p className="text-xs text-[#596B76] leading-relaxed">
                        {wf.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ============================================================
                5. FINAL DESTINATION CTA SECTION
            ============================================================ */}
            <div 
              ref={ctaRef} 
              className="rounded-3xl bg-[#082D46] p-8 sm:p-12 text-white text-center relative overflow-hidden animate-fade-in-up"
            >
              {/* Subtle Ambient Radial Halos */}
              <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#F4D98A]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#2F7D4A]/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-[#F4D98A] border border-white/15">
                  <Sparkles className="w-3.5 h-3.5 text-[#F4D98A]" />
                  <span>Hospitality Exchange Protocol</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading text-white leading-tight">
                  Coordinate Resources for Your Next Event with Total Confidence.
                </h2>

                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Whether you need 20 Chiavari chairs or a 500-guest ballroom setup, HOSPIX connects you directly with verified hospitality providers across Mumbai & Thane.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => handleLaunchWorkflow('register')}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#F4D98A] text-[#082D46] font-bold text-sm hover:bg-[#F6E29E] transition-all duration-150 active:scale-[0.98] shadow-md flex items-center justify-center space-x-2"
                  >
                    <span>{user ? (user.role === 'PROVIDER' ? 'Manage Inventory' : 'Post a Requirement') : 'Get Started with Demo Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleSeedDatabase}
                    disabled={seeding}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm transition-all duration-150 border border-white/20 active:scale-[0.98] flex items-center justify-center space-x-2"
                  >
                    <RefreshCw className={`w-4 h-4 text-slate-300 ${seeding ? 'animate-spin' : ''}`} />
                    <span>{seeding ? 'Seeding...' : 'Seed Mumbai/Thane Demo Hubs'}</span>
                  </button>
                </div>

                {/* Trust Guarantees Bar */}
                <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400">
                  <span className="flex items-center space-x-1.5">
                    <Check className="w-3.5 h-3.5 text-[#F4D98A]" />
                    <span>Zero Double-Booking Guarantee</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <Check className="w-3.5 h-3.5 text-[#F4D98A]" />
                    <span>PAN Verified B2B Businesses</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <Check className="w-3.5 h-3.5 text-[#F4D98A]" />
                    <span>Mumbai & Thane Local Hubs</span>
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Logged in views with smooth view transition container */}
        {user && activeTab !== 'home' && (
          <div key={activeTab} className="hospix-page-enter">
            {/* Common Views */}
            {activeTab === 'profile' && <ProfileView />}
            {activeTab === 'insights' && <InsightsView />}
            {activeTab === 'weathertwin' && <WeatherTwinView />}

            {/* Provider Views */}
            {user.role === 'PROVIDER' && (
              <>
                {activeTab === 'inventory' && <ProviderDashboard />}
                {activeTab === 'requests' && <BookingsManagementView />}
              </>
            )}

            {/* Seeker Views */}
            {user.role === 'SEEKER' && (
              <>
                {activeTab === 'seeker_new' && (
                  <SeekerRequirementCreator
                    onRequirementCreated={(created) => {
                      setSelectedRequirement(created);
                      setActiveTab('matches');
                    }}
                  />
                )}
                {activeTab === 'requirements' && (
                  <SeekerRequirementsList
                    onSelectRequirement={(req) => {
                      setSelectedRequirement(req);
                      setActiveTab('matches');
                    }}
                    onCreateNew={() => setActiveTab('seeker_new')}
                  />
                )}
                {activeTab === 'matches' && selectedRequirement && (
                  <MatchingResultsView
                    requirement={selectedRequirement}
                    onProceedToBooking={() => setActiveTab('seeker_bookings')}
                  />
                )}
                {activeTab === 'seeker_bookings' && <BookingsManagementView />}
              </>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E3DEC3] py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <img src={hospixLogo} alt="HOSPIX" className="w-5 h-5 aspect-square object-contain shrink-0" />
            <div>
              <span className="font-bold text-[#082D46] font-heading">HOSPIX</span> • Intelligent B2B Hospitality Resource Exchange Platform
            </div>
          </div>
          <div className="text-slate-500">Mumbai & Thane Region Hubs • Strict Multi-Provider Coordination Layer</div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          initialMode={authModalMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(loggedInUser) => {
            setShowAuthModal(false);
            const userRole = loggedInUser?.role || user?.role;
            setActiveTab(userRole === 'PROVIDER' ? 'inventory' : 'seeker_new');
          }}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
