import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Heart, 
  MessageSquare, 
  Bookmark, 
  Share2, 
  Edit3,
  UserCircle,
  Quote
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';
import { quranApi } from '../lib/quranApi';
import { reflectionService, Reflection } from '../services/reflectionService';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function Reflections() {
  const { user, profile } = useAuth();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [newPost, setNewPost] = useState({ text: '', verseKey: '2:286' });
  const [filter, setFilter] = useState<'community' | 'personal'>('community');

  useEffect(() => {
    const fetchReflections = async () => {
      setLoading(true);
      try {
        if (filter === 'personal' && user) {
          const data = await reflectionService.getUserReflections(user.uid);
          setReflections(data);
        } else {
          const data = await reflectionService.getCommunityReflections();
          setReflections(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchReflections();
  }, [filter, user]);

  const handlePost = async () => {
    if (!user) return alert('Please login to share');
    if (!newPost.text.trim()) return;

    try {
      const verse = await quranApi.getVerseText(newPost.verseKey);
      const trans = await quranApi.getVerseTranslation(newPost.verseKey);

      await reflectionService.saveReflection({
        userId: user.uid,
        userName: profile?.displayName || 'Anonymous',
        userPhoto: profile?.photoURL || '',
        text: newPost.text,
        verseKey: newPost.verseKey,
        verseText: verse.text_uthmani,
        verseTranslation: trans?.text?.replace(/<[^>]*>?/gm, '') || 'Translation not available',
      });

      // Record activity
      await addDoc(collection(db, 'activities'), {
        userId: user.uid,
        type: 'post',
        detail: `Shared a reflection on Ayah ${newPost.verseKey}`,
        subDetail: verse.text_uthmani.substring(0, 30) + '...',
        timestamp: serverTimestamp(),
      });

      setNewPost({ text: '', verseKey: '2:286' });
      setIsPosting(false);
      // Refresh
      const data = filter === 'personal' 
        ? await reflectionService.getUserReflections(user.uid)
        : await reflectionService.getCommunityReflections();
      setReflections(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLike = async (id: string) => {
    if (!user) return;
    try {
      await reflectionService.likeReflection(id);
      setReflections(prev => prev.map(p => p.id === id ? { ...p, likesCount: p.likesCount + 1 } : p));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-12 text-white">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="space-y-2">
          <h2 className="text-[13px] font-bold text-white uppercase tracking-[0.2em] flex items-center">
             <span className="dot bg-brand-emerald h-1.5 w-1.5 rounded-full mr-2"></span>
             Community Wisdom
          </h2>
          <p className="text-white/40 text-sm tracking-widest uppercase font-medium">Gather insights from the global circle.</p>
        </div>
        <button 
          onClick={() => setIsPosting(true)}
          className="flex items-center gap-3 bg-brand-emerald text-black px-8 py-3.5 rounded-lg font-bold text-xs uppercase tracking-widest shadow-2xl hover:opacity-90 transition-all active:scale-95"
        >
          <Edit3 size={16} />
          Create Reflection
        </button>
      </header>

      {isPosting && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0E1118] rounded-[24px] p-10 mb-12 border border-brand-emerald/30 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10">
             <Plus size={48} className="text-brand-emerald rotate-45" />
          </div>
          <div className="flex justify-between items-center mb-10 relative z-10">
             <h4 className="text-[11px] font-bold uppercase tracking-[0.25em] text-white">Share your insight</h4>
             <button onClick={() => setIsPosting(false)} className="text-[10px] uppercase font-bold tracking-widest text-white/20 hover:text-white transition-colors">Cancel</button>
          </div>
          <div className="space-y-6 relative z-10">
            <div>
              <label className="text-[10px] font-bold text-brand-emerald uppercase tracking-[0.2em] block mb-3">Scripture Context (e.g. 2:286)</label>
              <input 
                value={newPost.verseKey}
                onChange={(e) => setNewPost({...newPost, verseKey: e.target.value})}
                className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-xl text-white outline-none focus:border-brand-emerald/50 transition-all font-mono"
                placeholder="2:286"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-emerald uppercase tracking-[0.2em] block mb-3">Your Journey</label>
              <textarea 
                value={newPost.text}
                onChange={(e) => setNewPost({...newPost, text: e.target.value})}
                className="w-full bg-white/5 border border-white/10 px-6 py-5 rounded-xl text-white outline-none focus:border-brand-emerald/50 h-32 resize-none transition-all"
                placeholder="What did you learn from this verse?"
              />
            </div>
            <button 
              onClick={handlePost}
              className="w-full bg-brand-emerald text-black py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all"
            >
              Post to community
            </button>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 overflow-x-auto pb-4 mb-12 scrollbar-hide">
        <button 
          onClick={() => setFilter('community')}
          className={cn(
            "px-8 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all",
            filter === 'community' ? "bg-brand-emerald text-black" : "bg-white/5 text-white/40 hover:bg-white/10 border border-white/5"
          )}
        >
          Trending Now
        </button>
        <button 
          onClick={() => setFilter('personal')}
          className={cn(
            "px-8 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all",
            filter === 'personal' ? "bg-brand-emerald text-black" : "bg-white/5 text-white/40 hover:bg-white/10 border border-white/5"
          )}
        >
          My Sacred Journey
        </button>
        <div className="h-6 w-px bg-white/5 mx-2"></div>
        {['Surah Al-Kahf', 'Ash-Sharh', 'Ar-Rahman'].map(tag => (
          <button key={tag} className="bg-white/5 text-white/40 px-8 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest whitespace-nowrap hover:bg-white/10 border border-white/5 transition-all">
            {tag}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {loading ? (
          <div className="space-y-8 animate-pulse">
            <div className="h-64 bg-white/5 rounded-2xl border border-white/5"></div>
            <div className="h-48 grid grid-cols-2 gap-6">
               <div className="bg-white/5 rounded-2xl border border-white/5"></div>
               <div className="bg-white/5 rounded-2xl border border-white/5"></div>
            </div>
          </div>
        ) : (
          reflections.map((post) => (
            <motion.article 
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0E1118] border border-white/5 rounded-[24px] p-10 shadow-2xl hover:border-white/10 transition-all group"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border border-white/10 bg-[#1A1D26] overflow-hidden flex items-center justify-center text-white">
                    {post.userPhoto ? (
                      <img src={post.userPhoto} alt={post.userName} className="h-full w-full object-cover" />
                    ) : (
                      <UserCircle size={28} />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm tracking-wide uppercase">{post.userName}</h4>
                    <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold mt-1">
                      {post.createdAt?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || 'JUST NOW'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                   <span className="text-[10px] font-black text-brand-emerald uppercase tracking-[0.15em] border border-brand-emerald/20 px-3 py-1 rounded-full bg-brand-emerald/5">
                    Surah {post.verseKey}
                  </span>
                </div>
              </div>

              <div className="bg-white/3 p-10 rounded-2xl mb-10 border-l-2 border-brand-emerald relative">
                <div className="absolute top-4 right-6 opacity-10">
                   <Quote size={40} className="text-brand-emerald" />
                </div>
                <p className="font-amiri text-3xl text-white text-right dir-rtl mb-6 opacity-90 leading-relaxed" dir="rtl">
                  {post.verseText}
                </p>
                <div className="h-px w-10 bg-brand-emerald/20 mb-6"></div>
                <p className="text-lg text-white/50 italic leading-relaxed font-serif">
                  "{post.verseTranslation}"
                </p>
              </div>

              <div className="mb-10 px-2">
                <p className="text-xl text-white/90 leading-relaxed font-serif max-w-3xl">
                  {post.text}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-10">
                <div className="flex items-center gap-10">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-3 text-white/20 hover:text-brand-emerald transition-colors group"
                  >
                    <Heart size={18} className="group-hover:fill-current" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{post.likesCount || 0} AGREES</span>
                  </button>
                  <button className="flex items-center gap-3 text-white/20 hover:text-white transition-colors">
                    <MessageSquare size={18} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">ADD INSIGHT</span>
                  </button>
                </div>
                <div className="flex items-center gap-6">
                  <button className="text-white/20 hover:text-brand-emerald transition-colors">
                    <Bookmark size={18} />
                  </button>
                  <button className="text-white/20 hover:text-brand-emerald transition-colors">
                    <Share2 size={18} />
                  </button>
                </div>
              </div>
            </motion.article>
          ))
        )}

        {/* Featured Reflection Card */}
        <article className="relative overflow-hidden bg-[#0A0C12] rounded-[32px] min-h-[420px] flex items-end p-12 group shadow-2xl border border-white/5">
           <div className="absolute inset-0 z-0">
             <img 
               src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxWydaWQtRn7B6xrm-9Z5cyHvJWGJOEa3jtec8UhkGnGDykUjS5GguD5_TjUJzelkWGQy2LyfF4J681kayeHhrSVdMX0GJQ1tXz5esm-dorDbeBPW8DDnirAmJKKmnh3-X4m3D0yVGNu7U5BAFkNBnAFyEajUcpkmPxHxqGyY6Z4sxbnmac0gF8WbO70RAUAg2r-0aiDKZNmRx4Jf2cPkaLMuSyVfo_q1jVVijk5vMjvK6xRVO9jT1VqXkWQdMJJAy2JKWg2TAkAM" 
               alt="Sacred Path" 
               className="h-full w-full object-cover opacity-20 group-hover:scale-105 transition-transform duration-1000" 
             />
             <div className="absolute inset-0 bg-gradient-to-t from-[#0A0C12] via-transparent to-transparent"></div>
           </div>
           <div className="relative z-10 w-full">
             <div className="flex items-center gap-4 mb-6">
               <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden bg-[#1A1D26]">
                 <UserCircle size={40} className="text-white/40" />
               </div>
               <div>
                  <span className="font-bold text-white text-sm tracking-widest uppercase">Sheikh Zayed</span>
                  <p className="text-[10px] text-brand-emerald uppercase font-bold tracking-[0.2em] mt-1">Featured Insight</p>
               </div>
             </div>
             <h3 className="text-4xl font-serif font-bold text-white mb-6 leading-tight max-w-2xl">"Verily, with hardship comes ease."</h3>
             <p className="text-white/60 text-xl font-serif italic max-w-xl mb-10 leading-relaxed">
                The ease isn't just what follows hardship, it's what exists alongside it. Finding the divine grace within the soul even during trials.
             </p>
             <div className="flex gap-6">
               <button className="bg-brand-emerald text-black px-10 py-3 rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-2xl">
                 Read Full Study
               </button>
               <button className="bg-white/5 border border-white/10 text-white px-10 py-3 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
                 Save to Collection
               </button>
             </div>
           </div>
        </article>

        <div className="flex justify-center py-16">
          <button className="bg-white/3 border border-white/5 text-white/40 px-12 py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all">
            Load More Sacred Lessons
          </button>
        </div>
      </div>
    </div>
  );
}
