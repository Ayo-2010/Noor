import axios from 'axios';

const BASE_URL = 'https://api.quran.com/api/v4';
const API_KEY = import.meta.env.VITE_QURAN_API_KEY;

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: API_KEY ? { 'X-API-Key': API_KEY } : {},
});

export const quranApi = {
  getChapters: async () => {
    const response = await axiosInstance.get('/chapters?language=en');
    return response.data.chapters;
  },
  getChapter: async (id: number | string) => {
    const response = await axiosInstance.get(`/chapters/${id}?language=en`);
    return response.data.chapter;
  },
  getChapterVerses: async (id: number | string, params: { page?: number; per_page?: number; translations?: string; audio?: string | number } = {}) => {
    const response = await axiosInstance.get(`/verses/by_chapter/${id}`, {
      params: {
        language: 'en',
        words: true,
        translations: params.translations || '131', // Sahih International
        audio: params.audio || '7', // Mishary Rashid Alafasy
        ...params,
      },
    });
    return response.data.verses;
  },
  getVerseText: async (verseKey: string) => {
    const response = await axiosInstance.get('/quran/verses/uthmani', {
      params: { verse_key: verseKey },
    });
    return response.data.verses[0];
  },
  getVerseTranslation: async (verseKey: string, translationId: number = 131) => {
    const response = await axiosInstance.get(`/quran/translations/${translationId}`, {
      params: { verse_key: verseKey },
    });
    return response.data.translations?.[0];
  },
  getTafsir: async (tafsirId: number, verseKey: string) => {
    const response = await axiosInstance.get(`/quran/tafsirs/${tafsirId}`, {
      params: { verse_key: verseKey },
    });
    return response.data.tafsirs?.[0];
  },
  getRecitations: async () => {
    const response = await axiosInstance.get('/resources/recitations');
    return response.data.recitations;
  },
  getTafsirs: async (language: string = 'en') => {
    const response = await axiosInstance.get(`/resources/tafsirs?language=${language}`);
    return response.data.tafsirs;
  },
  getVerseAudio: async (verseKey: string, recitationId: number = 7) => {
    const response = await axiosInstance.get(`/recitations/${recitationId}/by_ayah/${verseKey}`);
    return response.data.audio_files?.[0];
  },
  getRandomVerse: async (seed?: number) => {
    // Generate a pseudo-random chapter (1-114) using the seed if provided
    let chapterId: number;
    if (seed !== undefined) {
      chapterId = (seed % 114) + 1;
    } else {
      chapterId = Math.floor(Math.random() * 114) + 1;
    }

    // Fetch chapter info to get verse count
    const chapterResponse = await axiosInstance.get(`/chapters/${chapterId}?language=en`);
    const verseCount = chapterResponse.data.chapter.verses_count;
    
    // Generate a pseudo-random verse in that chapter
    let verseNumber: number;
    if (seed !== undefined) {
      verseNumber = ((seed * 7) % verseCount) + 1;
    } else {
      verseNumber = Math.floor(Math.random() * verseCount) + 1;
    }
    
    const verseKey = `${chapterId}:${verseNumber}`;
    
    // Fetch text, translation and audio
    const [textResponse, transResponse, audioData] = await Promise.all([
      axiosInstance.get('/quran/verses/uthmani', { params: { verse_key: verseKey } }),
      axiosInstance.get('/quran/translations/131', { params: { verse_key: verseKey } }),
      axiosInstance.get(`/recitations/7/by_ayah/${verseKey}`)
    ]);
    
    return {
      verseKey,
      chapterName: chapterResponse.data.chapter.name_simple,
      text: textResponse.data.verses?.[0]?.text_uthmani || 'Text not available',
      translation: transResponse.data.translations?.[0]?.text || 'Translation not available',
      audio: audioData.data.audio_files?.[0],
    };
  },
};
