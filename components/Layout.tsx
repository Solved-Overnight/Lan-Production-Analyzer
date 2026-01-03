
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Database, Activity, Factory, 
  Settings as SettingsIcon, Cpu, FlaskConical, Droplets,
  Zap, Timer, ClipboardCheck
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Production Data', path: '/data', icon: Database },
    { label: 'RFT Report', path: '/rft', icon: ClipboardCheck },
    { label: 'Shift Performance', path: '/shifts', icon: Timer },
    { label: 'Equipment Health', path: '/equipment', icon: Cpu },
    { label: 'Lab Intelligence', path: '/lab', icon: FlaskConical },
    { label: 'Resource Command', path: '/resources', icon: Droplets },
    { label: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="h-screen flex flex-col md:flex-row bg-app-bg text-app-text transition-colors duration-200 overflow-hidden">
      {/* Sidebar for Desktop / Top Nav for Mobile */}
      <nav className="w-full md:w-64 bg-app-card border-b md:border-r border-app-border p-4 shrink-0 transition-colors duration-200 flex flex-col shadow-sm z-20">
        
        {/* BRANDING SECTION */}
        <Link to="/" className="group flex items-center gap-3.5 mb-6 px-1 py-1 select-none">
          <div className="relative">
            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-app-accent blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            
            {/* Logo Container */}
            <div className="relative p-2.5 bg-gradient-to-br from-app-accent to-app-accent-hover rounded-lg text-app-accent-contrast shadow-[0_8px_16px_-4px_rgba(var(--app-accent-rgb,99,102,241),0.4)] transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
              <div className="relative">
                <Factory size={22} strokeWidth={2.5} />
                <div className="absolute -top-1 -right-1 p-0.5 bg-white rounded-full shadow-sm">
                  <Zap size={8} className="text-app-accent fill-app-accent" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col">
            <h1 className="font-black text-[17px] leading-none tracking-tighter text-app-text group-hover:text-app-accent transition-colors">
              LANTABUR
            </h1>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[9px] font-black text-app-accent uppercase tracking-[0.25em]">IT NODE</span>
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 rounded-sm border border-emerald-500/20">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[7px] font-black text-emerald-600 uppercase tracking-tighter">Live</span>
              </div>
            </div>
          </div>
        </Link>
        
        <ul className="space-y-1.5 flex-1 overflow-y-auto px-1 pt-4 pb-4 pr-2 custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3.5 px-3.5 py-3 rounded-md text-[13px] font-bold transition-all group ${
                    isActive 
                      ? 'bg-app-accent/10 text-app-accent ring-1 ring-app-accent/30 shadow-sm' 
                      : 'text-app-text-muted hover:bg-app-bg hover:text-app-text'
                  }`}
                >
                  <Icon size={18} className={`transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(var(--app-accent-rgb),0.5)]' : 'group-hover:scale-110'}`} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* System Version Indicator */}
        <div className="mt-auto pt-5 px-1 border-t border-app-border">
          <div className="flex items-center justify-between p-2.5 bg-app-bg/50 rounded-lg border border-app-border/40">
            <div>
              <p className="text-[9px] font-black text-app-text-muted uppercase tracking-[0.15em] opacity-60">Industrial OS</p>
              <p className="text-[10px] font-bold text-app-text">Build v3.4.12</p>
            </div>
            <div className="flex -space-x-1.5">
              <div className="w-6 h-6 rounded-md border-2 border-app-card bg-app-accent/20 flex items-center justify-center text-[8px] font-bold">HQ</div>
              <div className="w-6 h-6 rounded-md border-2 border-app-card bg-rose-500/20 flex items-center justify-center text-[8px] font-bold">LX</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth bg-app-bg/50">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
