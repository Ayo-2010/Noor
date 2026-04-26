import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Quote, 
  LineChart, 
  LogOut,
  UserCircle 
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';

export default function Sidebar() {
  const { profile, user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Study', icon: BookOpen, path: '/study' },
    { name: 'Reflections', icon: Quote, path: '/reflections' },
    { name: 'My Journey', icon: LineChart, path: '/journey' },
  ];

  return (
    <aside className="w-72 bg-[#0A0C12] h-screen sticky top-0 border-r border-white/5 flex flex-col py-10 z-50">
      <div className="px-8 mb-8">
        <h1 className="text-3xl font-black font-serif text-brand-emerald tracking-widest uppercase">Noor</h1>
        <p className="text-emerald-700 font-serif text-xs tracking-[0.2em] uppercase">Spiritual Path</p>
      </div>

      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-4 px-8 py-3 transition-all duration-300 border-l-4",
              isActive 
                ? "bg-brand-emerald/10 text-brand-emerald border-brand-emerald font-semibold" 
                : "text-white/40 border-transparent hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon size={18} />
            <span className="font-sans text-sm tracking-widest uppercase font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-6">
        {user ? (
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full border border-white/10 overflow-hidden flex items-center justify-center text-white bg-[#1A1D26]">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt={profile.displayName} className="h-full w-full object-cover" />
                ) : (
                  <UserCircle size={24} />
                )}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-sm text-white truncate">{profile?.displayName}</p>
                <p className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold">{profile?.level ? `Level ${profile.level}` : 'Member'}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-xs text-white/40 hover:text-white transition-colors"
            >
              <LogOut size={14} />
              <span className="uppercase tracking-widest">Logout</span>
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-brand-emerald text-black text-center font-bold text-xs uppercase tracking-widest">
            <p>Spiritual Journey</p>
          </div>
        )}
      </div>
    </aside>
  );
}
