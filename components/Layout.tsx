
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Database, Activity, Factory, 
  Settings as SettingsIcon, Cpu, FlaskConical, Droplets,
  Zap, Timer, ClipboardCheck, ChevronRight, Menu, X, FileText
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    // Default to false (expanded) if no preference is saved
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Production Data', path: '/data', icon: Database },
    { label: 'RFT Report', path: '/rft', icon: ClipboardCheck },
    { label: 'Shift Performance', path: '/shifts', icon: Timer },
    { label: 'Dyeing Program', path: '/dyeing-program', icon: FileText },
    { label: 'Equipment Health', path: '/equipment', icon: Cpu },
    { label: 'Lab Intelligence', path: '/lab', icon: FlaskConical },
    { label: 'Resource Command', path: '/resources', icon: Droplets },
    { label: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className="h-screen flex flex-col md:flex-row bg-app-bg text-app-text transition-colors duration-200 overflow-hidden">
      {/* Sidebar for Desktop / Top Nav for Mobile */}
      <nav className={`w-full md:h-full ${isCollapsed ? 'md:w-20' : 'md:w-64'} bg-app-card border-b md:border-r border-app-border p-4 shrink-0 transition-all duration-300 ease-in-out flex flex-col shadow-sm z-20 relative`}>
        
        {/* COLLAPSE TOGGLE BUTTON (Desktop Only) - Centered Vertically */}
        <button 
          onClick={toggleSidebar}
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-app-accent text-app-accent-contrast rounded-full items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all z-30 ring-2 ring-app-card"
        >
          <ChevronRight size={14} className={`transition-transform duration-500 ${isCollapsed ? '' : 'rotate-180'}`} />
        </button>

        {/* MOBILE HEADER - Branding & Toggle */}
        <div className="flex items-center justify-between md:block">
          <div className={`flex items-center ${isCollapsed ? 'md:justify-center' : 'md:gap-3.5'} px-1 py-1 select-none overflow-hidden`}>
            <Link to="/" className="relative shrink-0">
              {/* Ambient Glow */}
              <div className="absolute inset-0 bg-app-accent blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
              
              {/* Logo Container */}
              <div className="relative p-2.5 bg-gradient-to-br from-app-accent to-app-accent-hover rounded-lg text-app-accent-contrast shadow-[0_8px_16px_-4px_rgba(var(--app-accent-rgb,99,102,241),0.4)] transition-transform duration-300 hover:scale-105 active:scale-95">
                <div className="relative">
                  <Factory size={22} strokeWidth={2.5} />
                  {(!isCollapsed || isMobileMenuOpen) && (
                    <div className="absolute -top-1 -right-1 p-0.5 bg-white rounded-full shadow-sm md:flex hidden">
                      <Zap size={8} className="text-app-accent fill-app-accent" />
                    </div>
                  )}
                </div>
              </div>
            </Link>
            
            <div className={`flex flex-col transition-all duration-300 ${isCollapsed ? 'md:w-0 md:opacity-0 md:pointer-events-none' : 'md:w-auto md:opacity-100'} ml-3 md:ml-0`}>
              <h1 className="font-black text-[17px] leading-none tracking-tighter text-app-text whitespace-nowrap">
                LANTABUR
              </h1>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[9px] font-black text-app-accent uppercase tracking-[0.25em] whitespace-nowrap">IT NODE</span>
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 rounded-sm border border-emerald-500/20">
                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[7px] font-black text-emerald-600 uppercase tracking-tighter">Live</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button 
            onClick={toggleMobileMenu}
            className="md:hidden p-2 text-app-text-muted hover:text-app-accent transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {/* Navigation List - Hidden on mobile unless menu is open */}
        <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col flex-1 mt-4 md:mt-0 overflow-hidden`}>
          <ul className="space-y-1.5 flex-1 overflow-y-auto px-1 pt-4 pb-4 pr-2 custom-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    title={isCollapsed ? item.label : ""}
                    className={`flex items-center ${isCollapsed ? 'md:justify-center' : 'gap-3.5'} px-3.5 py-3 rounded-md text-[13px] font-bold transition-all group ${
                      isActive 
                        ? 'bg-app-accent/10 text-app-accent ring-1 ring-app-accent/30 shadow-sm' 
                        : 'text-app-text-muted hover:bg-app-bg hover:text-app-text'
                    }`}
                  >
                    <Icon size={18} className={`transition-all duration-300 shrink-0 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(var(--app-accent-rgb),0.5)]' : 'group-hover:scale-110'}`} />
                    <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isCollapsed ? 'md:w-0 md:opacity-0' : 'md:w-auto md:opacity-100'}`}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* System Version Indicator */}
          <div className={`mt-auto pt-5 px-1 border-t border-app-border transition-all duration-300 ${isCollapsed ? 'md:flex md:justify-center' : ''}`}>
            {isCollapsed ? (
               <div className="w-8 h-8 rounded-md bg-app-accent/20 items-center justify-center text-[8px] font-bold hidden md:flex">HQ</div>
            ) : (
              <div className="flex items-center justify-between p-2.5 bg-app-bg/50 rounded-lg border border-app-border/40 mb-4 md:mb-0">
                <div>
                  <p className="text-[9px] font-black text-app-text-muted uppercase tracking-[0.15em] opacity-60 whitespace-nowrap">Industrial OS</p>
                  <p className="text-[10px] font-bold text-app-text whitespace-nowrap">Build v3.4.12</p>
                </div>
                <div className="flex -space-x-1.5">
                  <div className="w-6 h-6 rounded-md border-2 border-app-card bg-app-accent/20 flex items-center justify-center text-[8px] font-bold">HQ</div>
                  <div className="w-6 h-6 rounded-md border-2 border-app-card bg-rose-500/20 flex items-center justify-center text-[8px] font-bold">LX</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth bg-app-bg/50 transition-all duration-300">
        <div className="max-w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
