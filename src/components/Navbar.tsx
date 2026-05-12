import React from 'react';
import { NavLink } from 'react-router-dom';
import { Languages, Library, LayoutDashboard, Settings, Camera, Users, Mic2, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';
import { DEV_TEST_MODE } from '../constants';

export const Navbar = () => {
  const navItems = [
    { to: '/', icon: Languages, label: 'Practice' },
    { to: '/scan', icon: Camera, label: 'Scan' },
    { to: '/speak', icon: Mic2, label: 'Speak' },
    { to: '/interview', icon: Users, label: 'Match' },
    { to: '/library', icon: Library, label: 'Library' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dash' },
    { to: '/settings', icon: Settings, label: 'Settings' },
    ...(DEV_TEST_MODE ? [{ to: '/performance-test', icon: ShieldAlert, label: 'Lab' }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-800 bg-black md:top-0 md:bottom-auto">
      <div className="mx-auto flex max-w-lg items-center justify-around md:max-w-7xl md:justify-between md:px-8">
        <div className="hidden items-center space-x-3 md:flex">
          <div className="flex h-12 w-12 items-center justify-center bg-white text-black">
            <Languages size={24} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-black tracking-tighter text-white">JP-VI</span>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-neutral-500">Practice v1.0</span>
          </div>
        </div>
        
        <div className="flex w-full items-stretch md:w-auto md:space-x-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center justify-center space-y-1 px-6 py-3 transition-colors md:flex-row md:space-y-0 md:space-x-2 md:py-4',
                  isActive 
                    ? 'bg-white text-black' 
                    : 'text-neutral-500 hover:bg-neutral-900 hover:text-white'
                )
              }
            >
              <Icon size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};
