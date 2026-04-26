export interface Dua {
  id: string;
  title: string;
  arabic: string;
  translation: string;
  reference: string;
  verseKey?: string;
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  image: string;
  gemsCount: number;
  verses: string[]; // verse keys
}

export const propheticSupplications: Dua[] = [
  {
    id: '1',
    title: 'For Growth & Knowledge',
    arabic: 'رَّبِّ زِدْنِي عِلْمًا',
    translation: 'My Lord, increase me in knowledge.',
    reference: 'Quran 20:114',
    verseKey: '20:114'
  },
  {
    id: '2',
    title: 'For Ease in Affairs',
    arabic: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي',
    translation: 'My Lord, expand for me my breast and ease for me my task.',
    reference: 'Quran 20:25-26',
    verseKey: '20:25'
  },
  {
    id: '3',
    title: 'For Firmness in Faith',
    arabic: 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا',
    translation: 'Our Lord, let not our hearts deviate after You have guided us.',
    reference: 'Quran 3:8',
    verseKey: '3:8'
  },
  {
    id: '4',
    title: 'For Forgiveness & Mercy',
    arabic: 'رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ',
    translation: 'Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy upon us, we will surely be among the losers.',
    reference: 'Quran 7:23',
    verseKey: '7:23'
  }
];

export const sacredCollections: Collection[] = [
  {
    id: 'divine-solace',
    title: 'Divine Solace',
    description: 'Compiled to center the heart through the lens of Ar-Rahman.',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800',
    gemsCount: 12,
    verses: ['55:1', '55:2', '55:3', '55:4', '2:153', '2:155']
  },
  {
    id: 'ramadan-path',
    title: 'Ramadan Path',
    description: 'The enduring echoes of tadabbur from the sacred month.',
    image: 'https://images.unsplash.com/photo-1564769625905-50e9ad631a0b?auto=format&fit=crop&q=80&w=800',
    gemsCount: 8,
    verses: ['2:183', '2:184', '2:185', '97:1']
  },
  {
    id: 'patience-prayer',
    title: 'Patience & Prayer',
    description: 'Verses calling to the ultimate tools of the believer.',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=800',
    gemsCount: 15,
    verses: ['2:45', '2:153', '103:3']
  }
];
