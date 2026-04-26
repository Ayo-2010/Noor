import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  serverTimestamp,
  updateDoc,
  doc,
  increment
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Reflection {
  id?: string;
  userId: string;
  userName: string;
  userPhoto: string;
  text: string;
  verseKey: string;
  verseText: string;
  verseTranslation: string;
  likesCount: number;
  createdAt: any;
  isPrivate?: boolean;
}

/**
 * Service for managing reflections using the conceptual "Post API" and "User API" (Firestore implementation)
 */
export const reflectionService = {
  /**
   * Save a user reflection (User API / Post API)
   */
  saveReflection: async (reflection: Omit<Reflection, 'id' | 'createdAt' | 'likesCount'>) => {
    try {
      const docRef = await addDoc(collection(db, 'reflections'), {
        ...reflection,
        likesCount: 0,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error saving reflection:', error);
      throw error;
    }
  },

  /**
   * Get user-specific reflections (User API)
   */
  getUserReflections: async (userId: string) => {
    try {
      const q = query(
        collection(db, 'reflections'), 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Reflection[];
    } catch (error) {
      console.error('Error getting user reflections:', error);
      throw error;
    }
  },

  /**
   * Get all community reflections (Post API)
   */
  getCommunityReflections: async () => {
    try {
      const q = query(collection(db, 'reflections'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Reflection[];
    } catch (error) {
      console.error('Error getting community reflections:', error);
      throw error;
    }
  },

  /**
   * Like a reflection (Post API)
   */
  likeReflection: async (id: string) => {
    try {
      const docRef = doc(db, 'reflections', id);
      await updateDoc(docRef, {
        likesCount: increment(1)
      });
    } catch (error) {
      console.error('Error liking reflection:', error);
      throw error;
    }
  }
};
