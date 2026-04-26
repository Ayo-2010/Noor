import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  PlayCircle, 
  Bookmark, 
  Edit3, 
  BookOpen, 
  Settings2,
  ChevronDown,
  Sparkles,
  Play,
  Pause,
  Volume2,
  Gauge,
  X,
  Volume1
} from 'lucide-react';
import { quranApi } from '../lib/quranApi';
import { cn } from '../lib/utils';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { generateTts, playPcmBase64 } from '../lib/geminiTts';

export default function Study() {
  const location = useLocation();
  const { user } = useAuth();
  const [chapters, setChapters] = useState<any[]>([]);
  const [tafsirs, setTafsirs] = useState<any[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  const [verses, setVerses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTafsir, setActiveTafsir] = useState<any>(null);
  const [selectedVerseKey, setSelectedVerseKey] = useState<string | null>(null);
  const [selectedTafsirId, setSelectedTafsirId] = useState<number>(169); // Default to Ibn Kathir

  const [activeTab, setActiveTab] = useState<'tafsir' | 'notes'>('tafsir');
  const [noteText, setNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteId, setNoteId] = useState<string | null>(null);

  const [showChapters, setShowChapters] = useState(false);
  const [showTafsirSelect, setShowTafsirSelect] = useState(false);

  // Audio State
  const [playingVerseKey, setPlayingVerseKey] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Tafsir TTS State
  const [isTafsirPlaying, setIsTafsirPlaying] = useState(false);
  const [isTafsirLoading, setIsTafsirLoading] = useState(false);
  const tafsirAudioCtxRef = React.useRef<{ source: AudioBufferSourceNode, audioCtx: AudioContext } | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    
    const handleEnded = () => {
      setIsPlaying(false);
      setPlayingVerseKey(null);
    };

    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      if (tafsirAudioCtxRef.current) {
        tafsirAudioCtxRef.current.source.stop();
        tafsirAudioCtxRef.current.audioCtx.close();
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const togglePlay = (verse: any) => {
    if (!audioRef.current) return;

    if (tafsirAudioCtxRef.current) {
      tafsirAudioCtxRef.current.source.stop();
      tafsirAudioCtxRef.current.audioCtx.close();
      tafsirAudioCtxRef.current = null;
      setIsTafsirPlaying(false);
    }

    if (playingVerseKey === verse.verse_key) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(err => console.error("Audio Playback Error:", err));
        setIsPlaying(true);
      }
    } else {
      let audioUrl = verse.audio?.url;
      if (!audioUrl) {
        console.warn("No audio URL found for verse:", verse.verse_key);
        return;
      }

      // Handle common URL patterns
      if (audioUrl.startsWith('//')) {
        audioUrl = `https:${audioUrl}`;
      } else if (audioUrl.startsWith('http:')) {
        audioUrl = audioUrl.replace('http:', 'https:');
      } else if (!audioUrl.startsWith('http')) {
        audioUrl = `https://audio.quran.com/${audioUrl}`;
      }

      audioRef.current.src = audioUrl;
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.volume = volume;
      
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error("Audio Load/Play Error:", err, "URL:", audioUrl);
          setIsPlaying(false);
          setPlayingVerseKey(null);
        });
      }
      
      setPlayingVerseKey(verse.verse_key);
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [caps, tafs] = await Promise.all([
          quranApi.getChapters(),
          quranApi.getTafsirs('en')
        ]);
        setChapters(caps);
        setTafsirs(tafs);
        
        // Parse Query Params
        const params = new URLSearchParams(location.search);
        const urlChapterId = params.get('chapter');
        const urlVerseKey = params.get('verse');
        
        // Restore last session from localStorage
        const savedChapterId = localStorage.getItem('last_chapter_id');
        const savedVerseKey = localStorage.getItem('last_verse_key');
        
        let initialChapterId = urlChapterId ? parseInt(urlChapterId) : (savedChapterId ? parseInt(savedChapterId) : 18);
        let initialVerseKey = urlVerseKey || savedVerseKey;
        
        const initialChapter = caps.find((c: any) => c.id === initialChapterId) || caps.find((c: any) => c.id === 18);
        
        setSelectedChapter(initialChapter);
        await loadVerses(initialChapter.id);
        
        if (initialVerseKey && initialVerseKey.startsWith(`${initialChapter.id}:`)) {
          setSelectedVerseKey(initialVerseKey);
          // Scroll to verse
          setTimeout(() => {
            const el = document.getElementById(`verse-${initialVerseKey}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 500);
        }
      } catch (error) {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedVerseKey) {
      fetchTafsir(selectedVerseKey);
      fetchNote(selectedVerseKey);
    }
  }, [selectedVerseKey]);

  useEffect(() => {
    if (selectedVerseKey) {
      fetchTafsir(selectedVerseKey);
    }
  }, [selectedTafsirId]);

  const handleChapterSelect = async (chapter: any) => {
    setSelectedChapter(chapter);
    setShowChapters(false);
    localStorage.setItem('last_chapter_id', chapter.id.toString());
    if (tafsirAudioCtxRef.current) {
      tafsirAudioCtxRef.current.source.stop();
      tafsirAudioCtxRef.current.audioCtx.close();
      tafsirAudioCtxRef.current = null;
      setIsTafsirPlaying(false);
    }
    await loadVerses(chapter.id);
  };

  const toggleTafsirAudio = async () => {
    if (!activeTafsir || !activeTafsir.text) return;

    if (isTafsirPlaying) {
      if (tafsirAudioCtxRef.current) {
        tafsirAudioCtxRef.current.source.stop();
        tafsirAudioCtxRef.current.audioCtx.close();
        tafsirAudioCtxRef.current = null;
      }
      setIsTafsirPlaying(false);
      return;
    }

    // Stop verse audio if playing
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    setIsTafsirLoading(true);
    try {
      const base64 = await generateTts(activeTafsir.text);
      if (base64) {
        const ctx = playPcmBase64(base64);
        tafsirAudioCtxRef.current = ctx;
        setIsTafsirPlaying(true);
        
        ctx.source.onended = () => {
          setIsTafsirPlaying(false);
          tafsirAudioCtxRef.current = null;
        };
      }
    } catch (error) {
      console.error('Error playing tafsir audio:', error);
    } finally {
      setIsTafsirLoading(false);
    }
  };

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const loadVerses = async (chapterId: number, append = false) => {
    if (!append) {
      setLoading(true);
      setPage(1);
    } else {
      setIsFetchingMore(true);
    }

    try {
      const v = await quranApi.getChapterVerses(chapterId, { 
        per_page: 20, 
        page: append ? page + 1 : 1 
      });
      
      if (v.length < 20) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (append) {
        setVerses(prev => [...prev, ...v]);
        setPage(prev => prev + 1);
      } else {
        setVerses(v);
        if (v.length > 0) {
          setSelectedVerseKey(v[0].verse_key);
          fetchTafsir(v[0].verse_key);
          fetchNote(v[0].verse_key);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      if (!append) setLoading(false);
      else setIsFetchingMore(false);
    }
  };

  const handleNextPage = () => {
    if (selectedChapter && hasMore && !isFetchingMore) {
      loadVerses(selectedChapter.id, true);
    }
  };

  const fetchTafsir = async (verseKey: string) => {
    try {
      const t = await quranApi.getTafsir(selectedTafsirId, verseKey);
      setActiveTafsir(t);
    } catch (error) {
      console.error('Error fetching tafsir:', error);
      setActiveTafsir(null);
    }
  };

  const fetchNote = async (verseKey: string) => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'notes'),
        where('userId', '==', user.uid),
        where('verseKey', '==', verseKey)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const noteDoc = snapshot.docs[0];
        setNoteId(noteDoc.id);
        setNoteText(noteDoc.data().text);
      } else {
        setNoteId(null);
        setNoteText('');
      }
    } catch (error) {
      console.error('Error fetching note:', error);
    }
  };

  const handleSaveNote = async () => {
    if (!user || !selectedVerseKey || isSavingNote) return;
    setIsSavingNote(true);
    try {
      if (noteId) {
        await updateDoc(doc(db, 'notes', noteId), {
          text: noteText,
          updatedAt: serverTimestamp(),
        });
      } else {
        const docRef = await addDoc(collection(db, 'notes'), {
          userId: user.uid,
          verseKey: selectedVerseKey,
          text: noteText,
          updatedAt: serverTimestamp(),
        });
        setNoteId(docRef.id);
      }
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleBookmark = async (verseKey: string) => {
    if (!user) return alert('Please login to bookmark');
    try {
      await addDoc(collection(db, 'bookmarks'), {
        userId: user.uid,
        verseKey,
        surahName: selectedChapter.name_simple,
        createdAt: serverTimestamp(),
      });

      // Record activity
      await addDoc(collection(db, 'activities'), {
        userId: user.uid,
        type: 'bookmark',
        detail: `Saved Ayah ${verseKey} to Gems`,
        subDetail: `Surah ${selectedChapter.name_simple}`,
        timestamp: serverTimestamp(),
      });

      alert('Gem Saved to your Treasury!');
    } catch (error) {
      console.error('Error bookmarking:', error);
    }
  };

  const handleVerseRead = async (verseKey: string) => {
    if (!user) return;
    try {
      // Logic for reading progress could go here
      // For now just record activity
      await addDoc(collection(db, 'activities'), {
        userId: user.uid,
        type: 'read',
        detail: `Studied Ayah ${verseKey}`,
        subDetail: `In Surah ${selectedChapter.name_simple}`,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
       console.error('Error recording read activity:', error);
    }
  };

  return (
    <div className="flex h-[calc(100vh-72px)] overflow-hidden text-white">
      {/* Main Reading Area */}
      <div className="flex-1 overflow-y-auto bg-brand-sage flex flex-col items-center py-12 px-8">
        <header className="max-w-3xl w-full flex justify-between items-center mb-12 relative">
          <div 
            onClick={() => setShowChapters(!showChapters)}
            className="flex items-center gap-4 bg-white/5 border border-white/5 px-6 py-2 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
          >
            <span className="text-[11px] font-bold text-brand-emerald uppercase tracking-[0.2em]">{selectedChapter?.name_simple || 'Loading...'}</span>
            <ChevronDown size={14} className={cn("text-white/40 transition-transform", showChapters && "rotate-180")} />
          </div>

          {showChapters && (
            <div className="absolute top-14 left-0 w-64 max-h-96 bg-[#0E1118] border border-white/5 rounded-xl shadow-2xl z-50 overflow-y-auto p-2 scrollbar-hide animate-in fade-in slide-in-from-top-2">
              {chapters.map(c => (
                <button 
                  key={c.id}
                  onClick={() => handleChapterSelect(c)}
                  className="w-full text-left px-4 py-3 hover:bg-white/5 rounded-lg transition-colors flex items-center justify-between group"
                >
                  <span className="text-xs font-bold text-white/60 group-hover:text-white uppercase tracking-wider">{c.name_simple}</span>
                  <span className="text-[10px] text-brand-emerald opacity-40 group-hover:opacity-100">{c.id}</span>
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-6">
            <NavLink to="/dashboard" className="p-2 text-white/20 hover:text-brand-emerald transition-colors flex items-center gap-2 group">
              <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform"/>
              <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Dashboard</span>
            </NavLink>
            <div className="h-4 w-px bg-white/10 mx-2"></div>
            <button className="p-2 text-white/40 hover:text-white transition-colors"><ChevronLeft size={20}/></button>
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/60">Ayah 1-10</span>
            <button className="p-2 text-white/40 hover:text-white transition-colors"><ChevronRight size={20}/></button>
          </div>
        </header>

        <div className="max-w-3xl w-full space-y-16 pb-24">
          <div className="text-center mb-20">
            <p className="font-amiri text-4xl text-white mb-6 tracking-widest opacity-90">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
            <div className="h-px w-16 bg-brand-emerald/20 mx-auto"></div>
          </div>

          {loading ? (
            <div className="space-y-12 animate-pulse pb-20">
               {[1, 2, 3].map(i => (
                 <div key={i} className="bg-[#0E1118] rounded-[24px] p-10 border border-white/5">
                   <div className="flex justify-between items-center mb-10">
                     <div className="h-6 w-24 bg-white/5 rounded-full"></div>
                     <div className="flex gap-4">
                       <div className="h-8 w-8 bg-white/5 rounded-full"></div>
                       <div className="h-8 w-8 bg-white/5 rounded-full"></div>
                     </div>
                   </div>
                   <div className="flex justify-end mb-10">
                     <div className="h-16 w-3/4 bg-white/5 rounded-xl"></div>
                   </div>
                   <div className="h-6 w-1/2 bg-white/5 rounded-lg"></div>
                 </div>
               ))}
            </div>
          ) : (
            verses.map((verse) => (
              <motion.section 
                key={verse.id}
                id={`verse-${verse.verse_key}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => {
                  setSelectedVerseKey(verse.verse_key);
                  fetchTafsir(verse.verse_key);
                  handleVerseRead(verse.verse_key);
                  localStorage.setItem('last_verse_key', verse.verse_key);
                }}
                className={cn(
                  "group bg-[#0E1118] rounded-[24px] p-10 border transition-all cursor-pointer relative",
                  selectedVerseKey === verse.verse_key ? "border-brand-emerald/40 shadow-2xl" : "border-white/5 hover:border-white/10"
                )}
              >
                <div className="flex justify-between items-center mb-10">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-brand-emerald uppercase tracking-widest bg-brand-emerald/10 px-3 py-1 rounded-full border border-brand-emerald/20">
                      Ayah {verse.verse_number}
                    </span>
                  </div>
                  <div className="flex gap-4 opacity-20 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); togglePlay(verse); }}
                      className={cn(
                        "p-2 hover:text-brand-emerald transition-colors relative",
                        playingVerseKey === verse.verse_key && "text-brand-emerald opacity-100"
                      )}
                    >
                      {playingVerseKey === verse.verse_key && isPlaying ? <Pause size={18} /> : <PlayCircle size={18} />}
                      {playingVerseKey === verse.verse_key && isPlaying && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-emerald opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-emerald"></span>
                        </span>
                      )}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleBookmark(verse.verse_key); }}
                      className="p-2 hover:text-brand-emerald transition-colors"
                    >
                      <Bookmark size={18} />
                    </button>
                    <button className="p-2 hover:text-brand-emerald transition-colors"><Edit3 size={18} /></button>
                  </div>
                </div>
                <div className="text-right mb-12">
                  <p className="font-amiri text-4xl leading-[2.8] text-white dir-rtl" dir="rtl">
                    {verse.text_uthmani}
                  </p>
                </div>
                <div>
                  <p className="font-serif text-xl text-white/70 italic leading-relaxed max-w-2xl border-l border-brand-emerald/20 pl-6">
                    {verse.translations?.[0]?.text?.replace(/<[^>]*>?/gm, '') || 'Translation not available'}
                  </p>
                </div>
              </motion.section>
            ))
          )}

          {hasMore && !loading && (
            <div className="flex justify-center pt-8">
              <button 
                onClick={handleNextPage}
                disabled={isFetchingMore}
                className="group flex items-center gap-3 bg-white/5 border border-white/5 text-white/40 px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
              >
                {isFetchingMore ? (
                  <div className="h-3 w-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : <Sparkles size={14} className="text-brand-emerald" />}
                {isFetchingMore ? 'Retrieving Divine Words...' : 'Load Next Verses'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tafsir Sidebar (Right) */}
      <aside className="w-[400px] bg-[#0A0C12] border-l border-white/5 flex flex-col relative z-20">
        <div className="p-10 border-b border-white/5">
          <h2 className="text-[13px] font-bold text-white uppercase tracking-[0.2em] mb-8 flex items-center">
             <span className="dot bg-brand-emerald h-1.5 w-1.5 rounded-full mr-2"></span>
             Knowledge Hub
          </h2>
          <div className="flex bg-white/5 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('tafsir')}
              className={cn(
                "flex-1 py-2 text-[10px] font-bold rounded-md tracking-widest uppercase transition-all",
                activeTab === 'tafsir' ? "bg-white/10 text-white" : "text-white/30 hover:text-white"
              )}
            >
              Tafsir
            </button>
            <button 
              onClick={() => setActiveTab('notes')}
              className={cn(
                "flex-1 py-2 text-[10px] font-bold rounded-md tracking-widest uppercase transition-all",
                activeTab === 'notes' ? "bg-white/10 text-white" : "text-white/30 hover:text-white"
              )}
            >
              Personal Notes
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-10">
          {activeTab === 'tafsir' ? (
            <>
              <div className="relative">
                <button 
                  onClick={() => setShowTafsirSelect(!showTafsirSelect)}
                  className="w-full flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-brand-emerald/40 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-brand-emerald/10 flex items-center justify-center text-brand-emerald">
                      <BookOpen size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Selected Commentary</p>
                      <p className="text-sm font-bold text-white tracking-wide truncate max-w-[200px]">
                        {tafsirs.find(t => t.id === selectedTafsirId)?.author_name || 'Select Tafsir'}
                      </p>
                    </div>
                  </div>
                  <ChevronDown size={14} className={cn("text-white/20 group-hover:text-white transition-transform", showTafsirSelect && "rotate-180")} />
                </button>

                {showTafsirSelect && (
                  <div className="absolute top-20 left-0 w-full bg-[#0E1118] border border-white/5 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto p-2 scrollbar-hide animate-in fade-in slide-in-from-top-2">
                    {tafsirs.filter(t => t.language_name === 'english').map(t => (
                      <button 
                        key={t.id}
                        onClick={() => {
                          setSelectedTafsirId(t.id);
                          setShowTafsirSelect(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between group",
                          selectedTafsirId === t.id ? "bg-brand-emerald/10 text-brand-emerald" : "hover:bg-white/5 text-white/40 hover:text-white"
                        )}
                      >
                        <span className="text-xs font-bold uppercase tracking-wider">{t.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {activeTafsir ? (
                <div className="space-y-8">
                  <div className="section-title mb-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="dot bg-brand-emerald/40 h-1 w-1 rounded-full mr-2"></span>
                      <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-[0.15em]">Ayah {selectedVerseKey} Insights</h4>
                    </div>
                    <button 
                      onClick={toggleTafsirAudio}
                      disabled={isTafsirLoading}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[10px] font-bold uppercase tracking-widest",
                        isTafsirPlaying 
                          ? "bg-brand-emerald text-black border-brand-emerald" 
                          : "bg-white/5 text-white/40 border-white/5 hover:border-white/20 hover:text-white"
                      )}
                    >
                      {isTafsirLoading ? (
                        <span className="animate-pulse">Loading AI Voice...</span>
                      ) : (
                        <>
                          {isTafsirPlaying ? <Pause size={12} fill="currentColor" /> : <Volume1 size={12} />}
                          {isTafsirPlaying ? "Stop Listening" : "Listen to Tafsir"}
                        </>
                      )}
                    </button>
                  </div>

                  <div className="prose prose-invert prose-sm max-w-none">
                    <p className="font-serif text-white/80 text-lg leading-relaxed italic" 
                      dangerouslySetInnerHTML={{ __html: activeTafsir.text }}>
                    </p>
                  </div>

                  <div className="p-8 bg-brand-emerald/5 rounded-2xl border border-brand-emerald/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Sparkles size={24} className="text-brand-emerald" />
                    </div>
                    <p className="text-[10px] font-bold text-brand-emerald uppercase tracking-[0.15em] mb-4">Semantic Note</p>
                    <p className="text-sm italic text-white/60 leading-relaxed font-serif">
                      The classical Arabic root conveys a depth that modern translations often struggle to capture fully.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-white/10">
                  <BookOpen size={48} className="mb-6 opacity-20" />
                  <p className="text-xs uppercase tracking-[0.2em] font-bold">Select an Ayah to begin</p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-8 h-full flex flex-col">
              <div className="section-title mb-4 flex items-center">
                <span className="dot bg-brand-emerald h-1 w-1 rounded-full mr-2"></span>
                <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-[0.15em]">Ayah {selectedVerseKey} Personal Notes</h4>
              </div>

              <div className="flex-1 min-h-[300px] flex flex-col bg-white/3 rounded-2xl border border-white/5 overflow-hidden group focus-within:border-brand-emerald/40 transition-all">
                <textarea 
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Record your thoughts, lessons, or feelings about this verse..."
                  className="flex-1 w-full p-6 bg-transparent text-white/80 font-serif text-lg leading-relaxed italic border-none focus:ring-0 placeholder:text-white/10 resize-none"
                />
                <div className="p-4 bg-white/2 border-t border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest transition-colors",
                      isSavingNote ? "text-brand-emerald animate-pulse" : "text-white/20"
                    )}>
                      {isSavingNote ? 'Syncing...' : noteId ? 'Synced to Cloud' : 'Offline Draft'}
                    </span>
                  </div>
                  <button 
                    onClick={handleSaveNote}
                    disabled={isSavingNote}
                    className="flex items-center gap-2 px-6 py-2 bg-brand-emerald text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-brand-emerald/10"
                  >
                    {isSavingNote ? (
                      <div className="h-3 w-3 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                    ) : null}
                    {isSavingNote ? 'Propagating...' : 'Sync Note'}
                  </button>
                </div>
              </div>

              <div className="p-8 bg-white/3 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
                    <Sparkles size={16} />
                  </div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Reflection Tip</p>
                </div>
                <p className="text-xs italic text-white/40 leading-relaxed font-serif">
                  "Reflect on how this verse applies to your current life situation. What is Allah telling you today?"
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-white/5 bg-[#0A0C12]">
          <button className="w-full flex items-center justify-center gap-3 bg-brand-emerald text-black py-4 rounded-lg font-bold text-xs uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-2xl">
            <Edit3 size={16} />
            Post Reflection
          </button>
        </div>
      </aside>

      {/* Floating Tools Toggle */}
      <button className="fixed bottom-10 right-[440px] w-14 h-14 bg-[#1A1D26] text-white rounded-full shadow-2xl border border-white/10 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-30">
        <Settings2 size={24} />
      </button>

      {/* Advanced Audio Controls Player */}
      {playingVerseKey && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#1A1D26]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 flex items-center gap-8 z-40"
        >
          <div className="flex items-center gap-3 pr-8 border-r border-white/10">
            <div className="w-10 h-10 rounded-lg bg-brand-emerald/10 flex items-center justify-center text-brand-emerald">
              <Play size={18} fill="currentColor" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Now Playing</p>
              <p className="text-xs font-bold text-white">Ayah {playingVerseKey}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => {
                if (audioRef.current) {
                  if (isPlaying) audioRef.current.pause();
                  else audioRef.current.play();
                  setIsPlaying(!isPlaying);
                }
              }}
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>

            <div className="flex flex-col gap-2 min-w-[120px]">
              <div className="flex justify-between items-center text-[10px] font-bold text-white/40 uppercase tracking-widest">
                <div className="flex items-center gap-1"><Volume2 size={12} /> Volume</div>
                <span>{Math.round(volume * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={volume} 
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full accent-brand-emerald h-1 bg-white/5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-2 min-w-[120px]">
              <div className="flex justify-between items-center text-[10px] font-bold text-white/40 uppercase tracking-widest">
                <div className="flex items-center gap-1"><Gauge size={12} /> Speed</div>
                <span>{playbackSpeed}x</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="2" 
                step="0.1" 
                value={playbackSpeed} 
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                className="w-full accent-brand-emerald h-1 bg-white/5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <button 
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.pause();
                  setIsPlaying(false);
                  setPlayingVerseKey(null);
                }
              }}
              className="p-2 text-white/20 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
