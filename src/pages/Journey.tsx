import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Edit3, 
  Flame, 
  ArrowRight, 
  FolderOpen, 
  ExternalLink,
  Plus,
  Bookmark,
  X,
  Volume2,
  Play,
  Quote
} from 'lucide-react';

import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { propheticSupplications, sacredCollections, Dua, Collection as SacredCollection } from '../lib/curatedContent';

export default function Journey() {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState({ verses: 0, lessons: 0 });
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  
  const [selectedDua, setSelectedDua] = useState<Dua | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<SacredCollection | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Bookmarks
      const bq = query(collection(db, 'bookmarks'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(5));
      const bSnap = await getDocs(bq);
      setBookmarks(bSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Reflections count
      const rq = query(collection(db, 'reflections'), where('userId', '==', user.uid));
      const rSnap = await getDocs(rq);
      setStats(prev => ({ ...prev, lessons: rSnap.size }));

      // Activities
      const aq = query(collection(db, 'activities'), where('userId', '==', user.uid), orderBy('timestamp', 'desc'), limit(5));
      const aSnap = await getDocs(aq);
      setActivities(aSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchData();
  }, [user]);

  return (
    <div className="max-w-[1280px] mx-auto px-8 py-12 flex flex-col gap-16 text-white overflow-x-hidden">
      <header>
        <h2 className="text-[13px] font-bold text-white uppercase tracking-[0.2em] flex items-center mb-2">
           <span className="dot bg-brand-emerald h-1.5 w-1.5 rounded-full mr-2"></span>
           Spiritual Progression
        </h2>
        <p className="text-white/40 text-sm tracking-widest uppercase font-medium">Measuring your path through the divine word.</p>
      </header>

      {/* Stats Summary */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-[#0E1118] p-10 rounded-[24px] border border-white/5 shadow-2xl flex flex-col gap-6 group hover:border-brand-emerald/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Divine Verses</span>
            <BookOpen className="text-brand-emerald/20" size={20} />
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-5xl font-sans font-black text-white">{profile?.versesReadToday || 1284}</span>
            <span className="text-brand-emerald font-bold text-[10px] uppercase tracking-wider">+12% WEEKLY</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
            <div className="bg-brand-emerald h-full transition-all duration-1000" style={{ width: '72%' }}></div>
          </div>
        </div>

        <div className="bg-[#0E1118] p-10 rounded-[24px] border border-white/5 shadow-2xl flex flex-col gap-6 group hover:border-brand-emerald/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Sacred Insights</span>
            <Edit3 className="text-brand-emerald/20" size={20} />
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-5xl font-sans font-black text-white">{stats.lessons || 42}</span>
            <span className="text-brand-emerald font-bold text-[10px] uppercase tracking-wider">MILESTONE HIT</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
            <div className="bg-brand-emerald h-full transition-all duration-1000" style={{ width: '45%' }}></div>
          </div>
        </div>

        <div className="bg-[#0E1118] p-10 rounded-[24px] border border-white/5 shadow-2xl flex flex-col gap-6 relative overflow-hidden group hover:border-brand-emerald/20 transition-all">
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Active Flame</span>
            <Flame className="text-brand-emerald" size={20} fill="currentColor" />
          </div>
          <div className="flex items-baseline gap-4 relative z-10">
            <span className="text-5xl font-sans font-black text-white">{profile?.streak || 14} <span className="text-xl opacity-40">Days</span></span>
          </div>
          <div className="flex gap-2 relative z-10">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-all duration-500", i <= (profile?.streak % 7 || 4) ? "bg-brand-emerald" : "bg-white/5")}></div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Journey Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Collections */}
        <section className="lg:col-span-8 flex flex-col gap-10">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.2em] flex items-center">
               <span className="dot bg-brand-emerald/40 h-1 w-1 rounded-full mr-2"></span>
               Sacred Collections
            </h3>
            <button className="text-brand-emerald text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:underline group">
              Browse All <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {sacredCollections.slice(0, 2).map((col) => (
              <div 
                key={col.id}
                onClick={() => setSelectedCollection(col)}
                className="group relative overflow-hidden rounded-[24px] border border-white/5 shadow-2xl bg-[#0E1118] aspect-video md:aspect-[4/3] flex flex-col transition-all hover:border-brand-emerald/20 cursor-pointer"
              >
                <div className="absolute inset-0 z-0 opacity-40 group-hover:opacity-60 transition-opacity">
                  <img 
                    src={col.image}
                    alt={col.title} 
                    className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#05070A] via-transparent to-transparent"></div>
                </div>
                <div className="relative z-10 mt-auto p-10 text-white">
                  <span className="text-[10px] font-black text-brand-emerald uppercase tracking-[0.15em] border border-brand-emerald/20 px-3 py-1 rounded-full bg-brand-emerald/5 mb-6 inline-block">{col.gemsCount} GEMS</span>
                  <h4 className="text-2xl font-serif font-bold mb-3 tracking-wide">{col.title}</h4>
                  <p className="text-sm text-white/50 font-serif line-clamp-2 leading-relaxed italic">{col.description}</p>
                </div>
              </div>
            ))}

            <div className="bg-[#1A1D26] md:col-span-2 rounded-[24px] border border-white/5 p-10 overflow-hidden relative">
               <div className="relative z-10">
                 <div className="flex items-center justify-between mb-8">
                   <h4 className="text-2xl font-serif font-bold tracking-wide">Prophetic Supplications</h4>
                   <div className="w-12 h-12 rounded-full bg-brand-emerald/10 flex items-center justify-center text-brand-emerald">
                     <FolderOpen size={20} />
                   </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {propheticSupplications.map((dua) => (
                     <div 
                      key={dua.id}
                      onClick={() => setSelectedDua(dua)}
                      className="p-4 bg-white/3 rounded-xl border border-white/5 hover:border-brand-emerald/40 transition-all cursor-pointer group"
                    >
                      <p className="font-amiri text-lg text-right mb-2 text-white/80" dir="rtl">{dua.arabic}</p>
                      <h5 className="text-[10px] font-black text-brand-emerald uppercase tracking-widest">{dua.title}</h5>
                    </div>
                   ))}
                 </div>
               </div>
            </div>
          </div>
        </section>

        {/* Right Column: Activity & Bookmarks */}
        <div className="lg:col-span-4 flex flex-col gap-16">
          <section>
             <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.2em] mb-10 flex items-center">
                <span className="dot bg-brand-emerald h-1.5 w-1.5 rounded-full mr-2"></span>
                Recent Path
             </h3>
             <div className="border-l border-white/5 ml-2 pl-8 space-y-12">
                {activities.length > 0 ? activities.map((act) => (
                   <div key={act.id} className="relative">
                      <div className="absolute -left-[36.5px] top-1.5 w-4 h-4 rounded-full bg-brand-emerald border-4 border-[#05070A] shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
                      <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.25em] mb-2 font-mono">
                        {act.timestamp?.toDate().toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) || 'JUST NOW'}
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                         {act.type === 'read' && <BookOpen size={12} className="text-brand-emerald/60" />}
                         {act.type === 'bookmark' && <Bookmark size={12} className="text-brand-emerald/60" />}
                         {act.type === 'post' && <Quote size={12} className="text-brand-emerald/60" />}
                         <p className="text-sm font-bold text-white uppercase tracking-wide">{act.detail}</p>
                      </div>
                      <p className="text-xs text-white/40 font-serif italic">{act.subDetail}</p>
                   </div>
                )) : (
                  <>
                    <div className="relative">
                      <div className="absolute -left-[36.5px] top-1.5 w-4 h-4 rounded-full bg-brand-emerald border-4 border-[#05070A]"></div>
                      <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.25em] mb-2">TODAY, 2:15 PM</p>
                      <p className="text-sm font-bold text-white mb-2 uppercase tracking-wide">Read Surah Maryam</p>
                      <p className="text-xs text-white/40 font-serif italic leading-relaxed">Completed the sacred narrative of faith in 12 minutes.</p>
                    </div>
                  </>
                )}
             </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.2em] flex items-center">
                <span className="dot bg-brand-emerald h-1.5 w-1.5 rounded-full mr-2"></span>
                Gems Saved
              </h3>
              <NavLink to="/study" className="p-2 bg-white/5 rounded-lg text-brand-emerald border border-white/5 hover:bg-white/10 transition-all"><Plus size={14} /></NavLink>
            </div>
            <div className="bg-[#0E1118] rounded-[24px] border border-white/5 overflow-hidden shadow-2xl">
              {bookmarks.length > 0 ? (
                bookmarks.map((bm) => (
                  <NavLink 
                    to={`/study?chapter=${bm.verseKey.split(':')[0]}&verse=${bm.verseKey}`}
                    key={bm.id} 
                    className="p-6 border-b last:border-0 border-white/5 flex items-center justify-between hover:bg-white/3 transition-colors cursor-pointer group"
                  >
                    <div>
                      <p className="text-xs font-bold text-white uppercase tracking-wider mb-1">Surah {bm.surahName}</p>
                      <p className="text-[10px] text-brand-emerald font-bold uppercase tracking-widest opacity-60">Ayah {bm.verseKey}</p>
                    </div>
                    <ExternalLink size={14} className="text-white/20 group-hover:text-white transition-colors" />
                  </NavLink>
                ))
              ) : (
                <div className="p-10 text-center text-white/10 italic font-serif">Your treasury of divine wisdom awaits.</div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Dua Modal */}
      <AnimatePresence>
        {selectedDua && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 sm:p-20">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDua(null)}
              className="absolute inset-0 bg-[#05070A]/90 backdrop-blur-md"
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0E1118] rounded-[32px] border border-white/10 overflow-hidden shadow-2xl p-12"
            >
              <button 
                onClick={() => setSelectedDua(null)}
                className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <div className="flex items-center gap-3 mb-10">
                <span className="dot bg-brand-emerald h-1.5 w-1.5 rounded-full"></span>
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40">Sustenance of the Soul</p>
              </div>
              <h3 className="text-3xl font-serif font-bold text-white mb-12 tracking-wide text-center">{selectedDua.title}</h3>
              <p className="text-right font-amiri text-5xl leading-[2.5] text-white mb-12 dir-rtl" dir="rtl">{selectedDua.arabic}</p>
              <div className="h-px w-20 bg-brand-emerald/20 mx-auto mb-12"></div>
              <p className="text-xl text-center italic text-white/70 font-serif leading-relaxed mb-12">"{selectedDua.translation}"</p>
              <div className="flex items-center justify-between mt-auto pt-8 border-t border-white/5">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{selectedDua.reference}</span>
                <NavLink 
                  to={`/study?chapter=${selectedDua.verseKey?.split(':')[0]}&verse=${selectedDua.verseKey}`}
                  className="flex items-center gap-2 text-brand-emerald text-[10px] font-black uppercase tracking-widest hover:underline"
                >
                  Visit in Quran <ArrowRight size={14} />
                </NavLink>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Collection Modal */}
      <AnimatePresence>
        {selectedCollection && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 sm:p-20">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCollection(null)}
              className="absolute inset-0 bg-[#05070A]/90 backdrop-blur-md"
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="relative w-full max-w-4xl h-[80vh] bg-[#0E1118] rounded-[32px] border border-white/10 shadow-2xl flex overflow-hidden lg:flex-row flex-col"
            >
              <div className="lg:w-1/3 relative h-full">
                <img src={selectedCollection.image} className="h-full w-full object-cover opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E1118] via-transparent to-transparent"></div>
                <div className="absolute bottom-10 left-10 p-2">
                  <h3 className="text-4xl font-serif font-black text-white mb-4">{selectedCollection.title}</h3>
                  <p className="text-sm font-serif italic text-white/60 leading-relaxed">{selectedCollection.description}</p>
                </div>
              </div>
              <div className="flex-1 p-12 overflow-y-auto">
                <button 
                  onClick={() => setSelectedCollection(null)}
                  className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors z-20"
                >
                  <X size={24} />
                </button>
                <h4 className="text-[11px] font-black text-brand-emerald uppercase tracking-[0.3em] mb-12">COLLECTED GEMS ({selectedCollection.verses.length})</h4>
                <div className="space-y-6">
                  {selectedCollection.verses.map((vkey) => (
                    <NavLink 
                      key={vkey}
                      to={`/study?verse=${vkey}`}
                      className="block p-6 bg-white/3 rounded-2xl border border-white/5 hover:border-brand-emerald/40 transition-all group"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white uppercase tracking-widest">Verse {vkey}</span>
                        <Play size={14} className="text-brand-emerald opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[10px] text-white/20 mt-2 uppercase font-black tracking-widest">OPEN IN STUDY ROOM</p>
                    </NavLink>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="py-16 mt-16 border-t border-white/5 text-center">
        <p className="font-serif text-brand-emerald/20 text-lg italic tracking-widest">"Verily, with hardship comes ease." (94:6)</p>
      </footer>
    </div>
  );
}
