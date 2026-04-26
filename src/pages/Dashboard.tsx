import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sparkles, Flame, Play, Edit3, Heart, ArrowRight, Award, Send, CheckCircle2, BookOpen } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';
import { quranApi } from '../lib/quranApi';
import { reflectionService } from '../services/reflectionService';

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [dailyVerse, setDailyVerse] = useState<any>(null);
  const [reflectionVerse, setReflectionVerse] = useState<any>(null);
  const [reflectionText, setReflectionText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [isDailyPlaying, setIsDailyPlaying] = useState(false);
  const [isContinuePlaying, setIsContinuePlaying] = useState(false);
  const dailyAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const continueAudioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (dailyAudioRef.current) dailyAudioRef.current.pause();
      if (continueAudioRef.current) continueAudioRef.current.pause();
    };
  }, []);

  const toggleDailyAudio = () => {
    if (!reflectionVerse?.audio?.url) return;
    
    let url = reflectionVerse.audio.url;
    if (url.startsWith('//')) url = `https:${url}`;
    else if (url.startsWith('http:')) url = url.replace('http:', 'https:');
    else if (!url.startsWith('http')) url = `https://audio.quran.com/${url}`;

    if (!dailyAudioRef.current) {
      dailyAudioRef.current = new Audio(url);
      dailyAudioRef.current.onended = () => setIsDailyPlaying(false);
      dailyAudioRef.current.onerror = (e) => {
        console.error("Daily Audio Error:", e);
        setIsDailyPlaying(false);
      };
    } else if (dailyAudioRef.current.src !== url) {
      // Update src if it changed (though reflectionVerse usually stays same)
      dailyAudioRef.current.src = url;
      dailyAudioRef.current.load();
    }

    if (isDailyPlaying) {
      dailyAudioRef.current.pause();
      setIsDailyPlaying(false);
    } else {
      if (continueAudioRef.current) {
        continueAudioRef.current.pause();
        setIsContinuePlaying(false);
      }
      
      const playPromise = dailyAudioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error("Daily Audio Playback Failed:", err, "URL:", url);
          setIsDailyPlaying(false);
          // If it failed because of source error, try to reset it
          if (dailyAudioRef.current) {
            dailyAudioRef.current.src = url;
            dailyAudioRef.current.load();
          }
        });
      }
      setIsDailyPlaying(true);
    }
  };

  const toggleContinueAudio = () => {
    if (!dailyVerse?.audio?.url) return;
    
    let url = dailyVerse.audio.url;
    if (url.startsWith('//')) url = `https:${url}`;
    else if (url.startsWith('http:')) url = url.replace('http:', 'https:');
    else if (!url.startsWith('http')) url = `https://audio.quran.com/${url}`;

    if (!continueAudioRef.current) {
      continueAudioRef.current = new Audio(url);
      continueAudioRef.current.onended = () => setIsContinuePlaying(false);
      continueAudioRef.current.onerror = (e) => {
        console.error("Continue Audio Error:", e);
        setIsContinuePlaying(false);
      };
    } else if (continueAudioRef.current.src !== url) {
      continueAudioRef.current.src = url;
      continueAudioRef.current.load();
    }

    if (isContinuePlaying) {
      continueAudioRef.current.pause();
      setIsContinuePlaying(false);
    } else {
      if (dailyAudioRef.current) {
        dailyAudioRef.current.pause();
        setIsDailyPlaying(false);
      }

      const playPromise = continueAudioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error("Continue Audio Playback Failed:", err, "URL:", url);
          setIsContinuePlaying(false);
          if (continueAudioRef.current) {
            continueAudioRef.current.src = url;
            continueAudioRef.current.load();
          }
        });
      }
      setIsContinuePlaying(true);
    }
  };

  useEffect(() => {
    const fetchDailyVerses = async () => {
      try {
        // Fetch Surah 2 Ayah 185 for "Continue Reading" display with audio
        const [verse, translation, audio] = await Promise.all([
          quranApi.getVerseText('2:185'),
          quranApi.getVerseTranslation('2:185'),
          quranApi.getVerseAudio('2:185')
        ]);
        setDailyVerse({ ...verse, translation: translation?.text || 'Loading revelation...', audio });

        // Fetch a random verse for the Daily Reflection section using date as seed for stability
        const todaySeed = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24));
        const randomVerse = await quranApi.getRandomVerse(todaySeed);
        setReflectionVerse(randomVerse);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    fetchDailyVerses();
  }, []);

  const handlePostReflection = async () => {
    if (!user || !reflectionText.trim() || !reflectionVerse) return;
    setIsPosting(true);
    try {
      await reflectionService.saveReflection({
        userId: user.uid,
        userName: profile?.displayName || 'Anonymous',
        userPhoto: profile?.photoURL || '',
        text: reflectionText,
        verseKey: reflectionVerse.verseKey,
        verseText: reflectionVerse.text,
        verseTranslation: reflectionVerse.translation.replace(/<[^>]*>?/gm, ''),
      });
      setReflectionText('');
      setPosted(true);
      setTimeout(() => setPosted(false), 3000);
    } catch (error) {
      console.error('Failed to post reflection:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const streak = profile?.streak || 0;
  const goalProgress = (profile?.versesReadToday || 5) / (profile?.dailyGoal || 10);
  const circleCircumference = 2 * Math.PI * 70;

  return (
    <div className="max-w-[1280px] mx-auto px-8 py-10 text-white overflow-x-hidden">
      <motion.section 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-12"
      >
        <h3 className="text-4xl font-sans font-black text-white mb-2 tracking-tight uppercase">
          Assalamu Alaikum, {profile?.displayName || 'Ahmed'}
        </h3>
        <p className="text-white/40 text-sm font-sans tracking-[0.3em] uppercase">
          CONTINUE YOUR SPIRITUAL ASCENT • {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
        </p>
      </motion.section>

      <motion.div 
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        className="grid grid-cols-12 gap-6"
      >
        {/* Daily Goal Card */}
        <motion.div 
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          className="col-span-12 lg:col-span-4 bg-brand-primary-container rounded-[24px] p-8 shadow-2xl border border-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-brand-emerald/20 transition-colors"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Sparkles className="text-brand-emerald w-20 h-20" />
          </div>
          <p className="text-[11px] font-bold text-white/40 uppercase tracking-[0.2em] mb-8">Reading Progress</p>
          
          <div className="relative w-44 h-44 mb-8">
            <svg className="w-full h-full transform -rotate-90">
              <circle 
                className="text-white/5" 
                cx="88" cy="88" r="80" 
                fill="transparent" 
                stroke="currentColor" 
                strokeWidth="8" 
              />
              <motion.circle 
                initial={{ strokeDashoffset: circleCircumference }}
                animate={{ strokeDashoffset: circleCircumference * (1 - goalProgress) }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                className="text-brand-emerald" 
                cx="88" cy="88" r="80" 
                fill="transparent" 
                stroke="currentColor" 
                strokeWidth="8" 
                strokeDasharray={circleCircumference}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-sans font-black text-white">
                {profile?.versesReadToday || 5}
              </span>
              <span className="text-[10px] font-bold text-white/40 tracking-[0.2em] uppercase mt-1">OF {profile?.dailyGoal || 10} VERSES</span>
            </div>
          </div>

          <div className="bg-brand-emerald text-black px-5 py-2 rounded-full flex items-center gap-2 shadow-lg shadow-brand-emerald/10">
            <Flame size={14} fill="currentColor" className="animate-bounce" />
            <span className="text-[11px] font-black uppercase tracking-tight">{streak} DAY STREAK</span>
          </div>
        </motion.div>

        {/* Continue Reading Card */}
        <motion.div 
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          className="col-span-12 lg:col-span-8 bg-gradient-to-br from-[#0E1118] to-[#161B24] rounded-[24px] p-8 shadow-2xl border border-white/5 relative overflow-hidden flex flex-col justify-between text-white group hover:border-brand-emerald/10 transition-all"
        >
          <div className="hero-accent absolute top-[-50px] right-[-50px] w-[300px] h-[300px] bg-radial-gradient(circle, rgba(212, 175, 55, 0.05) 0%, transparent 70%) rounded-full pointer-events-none group-hover:scale-110 transition-transform duration-1000"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-emerald animate-pulse"></span>
              <p className="text-[11px] font-bold text-brand-emerald uppercase tracking-[0.2em]">CURRENT FOCUS • {dailyVerse?.chapterName || 'Al-Baqarah'}</p>
            </div>
            <h4 className="text-3xl font-serif italic mb-6 max-w-xl leading-relaxed text-white/90">
              "{dailyVerse?.translation?.replace(/<[^>]*>?/gm, '') || 'Indeed, this Quran guides to that which is most suitable...' }"
            </h4>
            <div className="flex items-center gap-6 text-white/30 mb-8 font-sans">
              <div className="flex items-center gap-2">
                <BookOpen size={14} />
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Verse {dailyVerse?.verseKey || '2:185'}</span>
              </div>
              <div className="h-4 w-px bg-white/10"></div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]">DAILY WISDOM MODULE</p>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between mt-auto">
            <NavLink 
              to="/study" 
              className="bg-brand-emerald text-black px-10 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-emerald/5"
            >
              RESUME STUDY
            </NavLink>
            
            <div className="flex items-center gap-6 group/audio">
               <div className="text-right pointer-events-none opacity-40 group-hover/audio:opacity-100 transition-opacity">
                 <p className="text-[10px] font-black uppercase tracking-widest text-white">Sheikh Mishary</p>
                 <p className="text-[9px] opacity-40 uppercase tracking-[0.3em]">RECITER HUD</p>
               </div>
               <button 
                onClick={toggleContinueAudio}
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all relative",
                  isContinuePlaying ? "bg-brand-emerald text-black border-brand-emerald shadow-lg shadow-brand-emerald/20" : "bg-white/10 text-white border-white/10 hover:bg-white/20"
                )}
               >
                 {isContinuePlaying ? (
                   <div className="flex gap-0.5 items-center">
                     <div className="w-1 h-3 bg-current rounded-full animate-[bounce_0.6s_infinite] delay-100"></div>
                     <div className="w-1 h-5 bg-current rounded-full animate-[bounce_0.6s_infinite] delay-300"></div>
                     <div className="w-1 h-2 bg-current rounded-full animate-[bounce_0.6s_infinite] delay-500"></div>
                   </div>
                 ) : <Play size={20} fill="currentColor" />}
               </button>
            </div>
          </div>
        </motion.div>

        {/* Daily Reflection */}
        <motion.div 
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          className="col-span-12 lg:col-span-8 bg-brand-primary-container rounded-[24px] p-8 shadow-2xl border border-white/5"
        >
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="section-title mb-0 flex items-center">
                 <span className="dot bg-brand-emerald h-2 w-2 rounded-full mr-3"></span>
                 <h4 className="text-[14px] font-black text-white uppercase tracking-[0.2em]">Daily Reflection</h4>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <NavLink to="/reflections" className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] hover:text-brand-emerald transition-colors border-b border-white/5 pb-1">COMMUNITY STREAM</NavLink>
              <span className="text-white/20 text-[11px] font-bold uppercase tracking-[0.2em]">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
          
          <div className="bg-white/3 p-10 rounded-2xl mb-10 border border-white/5 relative group transition-colors hover:border-brand-emerald/10">
            {reflectionVerse ? (
              <>
                <div className="absolute top-8 left-8">
                  <button 
                    onClick={toggleDailyAudio}
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all",
                      isDailyPlaying ? "bg-brand-emerald text-black border-brand-emerald shadow-lg" : "bg-white/5 text-white text-white/40 border-white/5 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {isDailyPlaying ? (
                       <div className="flex gap-0.5 items-center text-black">
                         <div className="w-1 h-3 bg-current rounded-full animate-[bounce_0.6s_infinite] delay-100"></div>
                         <div className="w-1 h-4 bg-current rounded-full animate-[bounce_0.6s_infinite] delay-300"></div>
                         <div className="w-1 h-2 bg-current rounded-full animate-[bounce_0.6s_infinite] delay-500"></div>
                       </div>
                    ) : <Play size={20} fill="currentColor" />}
                  </button>
                </div>
                <p className="text-right font-amiri text-5xl mb-10 text-[#FFFFFF] dir-rtl leading-[2.5]" dir="rtl">
                  {reflectionVerse.text}
                </p>
                <div className="h-px w-20 bg-brand-emerald/20 mx-auto mb-10"></div>
                <div className="max-w-2xl mx-auto">
                  <p className="font-serif italic text-white/70 text-2xl leading-relaxed text-center mb-4">
                    "{reflectionVerse.translation.replace(/<[^>]*>?/gm, '')}" 
                  </p>
                  <p className="text-center text-[11px] font-black uppercase tracking-[0.3em] text-white/30">
                    {reflectionVerse.chapterName} • Verse {reflectionVerse.verseKey}
                  </p>
                </div>
              </>
            ) : (
              <div className="animate-pulse space-y-8 py-10">
                <div className="h-12 bg-white/5 rounded-xl w-3/4 mx-auto"></div>
                <div className="h-6 bg-white/5 rounded-xl w-1/2 mx-auto"></div>
              </div>
            )}
          </div>

          <div className="relative">
            <textarea 
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              className="w-full h-40 bg-white/3 border border-white/5 rounded-2xl p-6 focus:border-brand-emerald/40 transition-all resize-none mb-6 text-white/90 text-lg font-serif placeholder:text-white/10 outline-none italic leading-relaxed" 
              placeholder="Record your spiritual response to this verse..."
              disabled={isPosting}
            ></textarea>
            <div className="flex justify-between items-center px-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                <Edit3 size={12} />
                <span>DRAFT MODE ACTIVE</span>
              </div>
              <div className="flex items-center gap-6">
                {posted && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-brand-emerald flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Synchronized</span>
                  </motion.div>
                )}
                <button 
                  onClick={handlePostReflection}
                  disabled={isPosting || !reflectionText.trim()}
                  className="group flex items-center gap-3 bg-brand-emerald text-black px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale shadow-xl shadow-brand-emerald/10"
                >
                  {isPosting ? 'SYNCING...' : 'SHARE INSIGHT'}
                  <Send size={14} className={cn("transition-transform group-hover:translate-x-1", isPosting && "animate-pulse")} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sidebar Stats */}
        <motion.div 
          variants={{ hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0 } }}
          className="col-span-12 lg:col-span-4 flex flex-col gap-6"
        >
          <div className="bg-brand-primary-container rounded-[24px] p-8 shadow-2xl border border-white/5 group hover:border-brand-emerald/10 transition-colors">
            <h5 className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] mb-12 flex items-center justify-between">
              SPIRITUAL VELOCITY
              <span className="text-brand-emerald">LIVE</span>
            </h5>
            
            <div className="flex items-end justify-between h-36 mb-6 px-1">
              {[40, 65, 35, 90, 55, 75, 20].map((h, i) => (
                <motion.div 
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                  className={cn("w-6 rounded-t-sm transition-all relative cursor-help group/bar", i === 3 ? "bg-brand-emerald shadow-[0_0_15px_-3px_rgba(56,189,248,0.3)]" : "bg-brand-emerald/10 hover:bg-brand-emerald/30")}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[9px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity">
                    {h}%
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="flex justify-between px-1 text-[10px] text-white/20 font-black mb-8 border-t border-white/5 pt-4">
              {['SUN','MON','TUE','WED','THU','FRI','SAT'].map((d, i) => <span key={`${d}-${i}`} className={i === 3 ? "text-brand-emerald" : ""}>{d}</span>)}
            </div>

            <div className="p-4 bg-brand-emerald/5 rounded-xl border border-brand-emerald/10">
              <p className="text-[12px] text-white/60 leading-relaxed font-sans">
                Your activity is <span className="text-brand-emerald font-black uppercase">12% higher</span> than last week. Keep ascending.
              </p>
            </div>
          </div>

          <div className="bg-[#11141D] text-white rounded-[24px] p-8 shadow-2xl border border-white/5 overflow-hidden relative group hover:border-brand-emerald/10 transition-all">
            <div className="absolute -right-12 -bottom-12 opacity-5 group-hover:opacity-10 transition-all duration-1000 rotate-12 group-hover:rotate-0">
              <Award size={240} />
            </div>
            <h6 className="text-[11px] font-black text-white/30 mb-2 uppercase tracking-[0.3em]">Spiritual Rank</h6>
            <p className="text-3xl font-sans font-black mb-6 uppercase tracking-[0.1em] text-white">ASCENDANT {profile?.level || 'IV'}</p>
            
            <div className="space-y-4 relative z-10">
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '75%' }}
                  transition={{ duration: 1.5, delay: 1 }}
                  className="bg-brand-emerald h-full shadow-[0_0_15px_-3px_rgba(16,185,129,0.5)]"
                ></motion.div>
              </div>
              <div className="flex justify-between items-center">
                 <p className="text-[9px] uppercase font-black text-white/40 tracking-[0.2em]">450 XP TO VIRTUE V</p>
                 <div className="flex items-center gap-2">
                   <div className="h-1.5 w-1.5 rounded-full bg-brand-emerald animate-pulse"></div>
                   <span className="text-[9px] font-black text-brand-emerald uppercase tracking-[0.2em]">STREAK MULTIPLIER: 1.2x</span>
                 </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
