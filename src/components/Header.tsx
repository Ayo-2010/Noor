import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, UserCircle, LogIn } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function Header() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Check if it's a verse key like 2:255
    if (/^\d+:\d+$/.test(searchQuery)) {
      navigate(`/study?verse=${searchQuery}`);
    } else {
      // Just go to study with general query (Study page can handle it or just load default)
      navigate('/study');
    }
    setSearchQuery('');
  };

  return (
    <header className="bg-brand-sage/80 backdrop-blur-md sticky top-0 z-40 border-b border-white/5 px-8 py-4 flex justify-between items-center text-white">
      <div className="flex items-center gap-4">
        {/* Title or breadcrumbs */}
      </div>

      <div className="flex items-center gap-6">
        <form onSubmit={handleSearch} className="relative group hidden md:block">
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-full px-6 py-2 w-64 focus:ring-1 focus:ring-brand-emerald transition-all text-xs placeholder:text-white/20 uppercase tracking-widest outline-none" 
            placeholder="Search Scriptures..." 
            type="text" 
          />
          <button type="submit">
            <Search size={14} className="absolute right-3 top-2.5 text-white/20 hover:text-brand-emerald transition-colors" />
          </button>
        </form>

        <div className="flex items-center gap-4">
          <button className="p-2 text-white/40 hover:text-brand-emerald transition-colors">
            <Bell size={20} />
          </button>
          
          {user ? (
            <button className="p-1 text-white/40 hover:text-brand-emerald transition-colors">
              <UserCircle size={28} />
            </button>
          ) : (
            <button 
              onClick={login}
              className="flex items-center gap-2 bg-brand-emerald text-black px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              <LogIn size={14} />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
