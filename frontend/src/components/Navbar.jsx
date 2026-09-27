import React, { useState, useEffect } from 'react';
import { Building2, User, LogOut, Sparkles, RefreshCw, PlusCircle, Search, ClipboardList, ShieldCheck, Menu, X, BarChart3, CloudRain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { HospixLogoAnimated } from './HospixLogoAnimated';

export const Navbar = ({ activeTab, setActiveTab, onSeedDatabase, seeding }) => {
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className={`sticky top-0 z-40 transition-all duration-200 ${
      isScrolled
        ? 'bg-white/98 shadow-sm border-b border-[#E3DEC3]'
        : 'bg-white/90 backdrop-blur-md border-b border-[#E7E5DC]'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Platform Branding */}
          <HospixLogoAnimated
            mode="interactive"
            onClick={() => handleNavClick('home')}
          />

          {/* Navigation Links based on role */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1">
              <button
                onClick={() => setActiveTab('home')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
                  activeTab === 'home'
                    ? 'text-[#082D46] bg-[#F7F4E9] font-bold shadow-xs'
                    : 'text-[#596B76] hover:text-[#082D46] hover:bg-[#F7F4E9]'
                }`}
              >
                Home
              </button>

              {user.role === 'PROVIDER' ? (
                <>
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
                      activeTab === 'inventory'
                        ? 'text-[#082D46] bg-[#F7F4E9] font-bold shadow-xs'
                        : 'text-[#596B76] hover:text-[#082D46] hover:bg-[#F7F4E9]'
                    }`}
                  >
                    Inventory & Resources
                  </button>
                  <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
                      activeTab === 'requests'
                        ? 'text-[#082D46] bg-[#F7F4E9] font-bold shadow-xs'
                        : 'text-[#596B76] hover:text-[#082D46] hover:bg-[#F7F4E9]'
                    }`}
                  >
                    Booking Requests
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setActiveTab('seeker_new')}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-[0.98] flex items-center space-x-1.5 ${
                      activeTab === 'seeker_new'
                        ? 'bg-[#082D46] text-white shadow-xs'
                        : 'text-[#082D46] bg-[#F4D98A]/30 hover:bg-[#F4D98A]/50 border border-[#F4D98A]/60'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-[#082D46]" />
                    <span>Post Requirement</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('requirements')}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
                      activeTab === 'requirements'
                        ? 'text-[#082D46] bg-[#F7F4E9] font-bold shadow-xs'
                        : 'text-[#596B76] hover:text-[#082D46] hover:bg-[#F7F4E9]'
                    }`}
                  >
                    My Requirements
                  </button>
                  <button
                    onClick={() => setActiveTab('seeker_bookings')}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
                      activeTab === 'seeker_bookings'
                        ? 'text-[#082D46] bg-[#F7F4E9] font-bold shadow-xs'
                        : 'text-[#596B76] hover:text-[#082D46] hover:bg-[#F7F4E9]'
                    }`}
                  >
                    Bookings
                  </button>
                </>
              )}

              <button
                onClick={() => setActiveTab('insights')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-[0.98] flex items-center space-x-1.5 ${
                  activeTab === 'insights'
                    ? 'text-[#082D46] bg-[#F7F4E9] font-bold shadow-xs'
                    : 'text-[#596B76] hover:text-[#082D46] hover:bg-[#F7F4E9]'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Insights</span>
              </button>

              <button
                onClick={() => setActiveTab('weathertwin')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-[0.98] flex items-center space-x-1.5 ${
                  activeTab === 'weathertwin'
                    ? 'text-[#082D46] bg-[#F7F4E9] font-bold shadow-xs'
                    : 'text-[#596B76] hover:text-[#082D46] hover:bg-[#F7F4E9]'
                }`}
              >
                <CloudRain className="w-3.5 h-3.5 text-blue-600" />
                <span>Weather Twin</span>
              </button>
            </nav>
          )}

          {/* Right action area */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <div
                  onClick={() => setActiveTab('profile')}
                  className="text-right hidden sm:block cursor-pointer hover:opacity-85 transition-opacity duration-140"
                  title="View Organization Profile"
                >
                  <div className="text-xs font-bold text-[#082D46] leading-tight flex items-center justify-end space-x-1">
                    <span>{user.business?.name || user.full_name}</span>
                    {user.business?.is_verified && (
                      <span title="PAN Verified Business" className="inline-flex items-center text-[#2F7D4A]">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#2F7D4A]" />
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#596B76] flex items-center justify-end space-x-1">
                    <span>{user.role === 'PROVIDER' ? 'Provider' : 'Seeker'}</span>
                    {user.business?.is_verified && (
                      <span className="text-[10px] text-[#2F7D4A] font-bold uppercase">• Verified</span>
                    )}
                  </div>
                </div>
                
                {/* Circular User Profile Avatar */}
                <div
                  onClick={() => setActiveTab('profile')}
                  title="View Organization Profile"
                  className="w-8.5 h-8.5 rounded-full bg-[#082D46] text-[#FCFAF3] font-bold text-xs flex items-center justify-center cursor-pointer hover:scale-[1.04] active:scale-[0.96] transition-transform duration-140 relative shadow-2xs"
                >
                  {getInitials(user.business?.name || user.full_name)}
                  {user.business?.is_verified && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#2F7D4A] border-2 border-white rounded-full"></span>
                  )}
                </div>

                <button
                  onClick={logout}
                  title="Sign out"
                  className="hospix-icon-btn p-1.5 text-[#8A979D] hover:text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleNavClick('login')}
                  className="text-xs font-bold text-[#082D46] px-4 py-2 rounded-xl hover:bg-[#F7F4E9] active:scale-[0.98] transition-all duration-140"
                >
                  Login
                </button>
                <button
                  onClick={() => handleNavClick('register')}
                  className="hospix-btn-primary text-xs font-bold px-4.5 py-2 rounded-xl"
                >
                  <span>Get Started</span>
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden hospix-icon-btn p-2 text-[#082D46] hover:bg-[#F7F4E9] rounded-xl"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E7E5DC] bg-white/98 backdrop-blur-md px-4 pt-3 pb-5 space-y-1.5 animate-fade-in-down shadow-lg">
          <button
            onClick={() => handleNavClick('home')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'home'
                ? 'text-[#082D46] bg-[#F7F4E9]'
                : 'text-[#596B76] hover:bg-[#F7F4E9]'
            }`}
          >
            Home
          </button>

          {user && user.role === 'PROVIDER' && (
            <>
              <button
                onClick={() => handleNavClick('inventory')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  activeTab === 'inventory' ? 'text-[#082D46] bg-[#F7F4E9]' : 'text-[#596B76] hover:bg-[#F7F4E9]'
                }`}
              >
                Inventory & Resources
              </button>
              <button
                onClick={() => handleNavClick('requests')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  activeTab === 'requests' ? 'text-[#082D46] bg-[#F7F4E9]' : 'text-[#596B76] hover:bg-[#F7F4E9]'
                }`}
              >
                Booking Requests
              </button>
            </>
          )}

          {user && user.role === 'SEEKER' && (
            <>
              <button
                onClick={() => handleNavClick('seeker_new')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#082D46] bg-[#F4D98A]/40 flex items-center space-x-1.5"
              >
                <PlusCircle className="w-4 h-4 text-[#082D46]" />
                <span>Post Requirement</span>
              </button>
              <button
                onClick={() => handleNavClick('requirements')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  activeTab === 'requirements' ? 'text-[#082D46] bg-[#F7F4E9]' : 'text-[#596B76] hover:bg-[#F7F4E9]'
                }`}
              >
                My Requirements
              </button>
              <button
                onClick={() => handleNavClick('seeker_bookings')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  activeTab === 'seeker_bookings' ? 'text-[#082D46] bg-[#F7F4E9]' : 'text-[#596B76] hover:bg-[#F7F4E9]'
                }`}
              >
                Bookings
              </button>
            </>
          )}

          {user && (
            <>
              <button
                onClick={() => handleNavClick('insights')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 ${
                  activeTab === 'insights' ? 'text-[#082D46] bg-[#F7F4E9]' : 'text-[#596B76] hover:bg-[#F7F4E9]'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Business Insights</span>
              </button>
              <button
                onClick={() => handleNavClick('weathertwin')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 ${
                  activeTab === 'weathertwin' ? 'text-[#082D46] bg-[#F7F4E9]' : 'text-[#596B76] hover:bg-[#F7F4E9]'
                }`}
              >
                <CloudRain className="w-4 h-4 text-blue-600" />
                <span>Weather Twin</span>
              </button>
              <button
                onClick={() => handleNavClick('profile')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  activeTab === 'profile' ? 'text-[#082D46] bg-[#F7F4E9]' : 'text-[#596B76] hover:bg-[#F7F4E9]'
                }`}
              >
                Organization Profile
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
};
