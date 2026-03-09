export enum SceneType {
  COLORS = 'Colors',
  SHAPES = 'Shapes',
  FOOD = 'Food',
  BODY_PARTS = 'Body Parts',
  ANIMALS = 'Animals',
  DAILY_ITEMS = 'Daily Items'
}

export interface Word {
  id: string;
  english: string;
  chinese: string;
  image: string;
  scene: SceneType;
  phonetic?: string;
}

export interface UserProgress {
  stars: number;
  learnedWords: string[]; // IDs of learned words
  badges: string[];
  streak: number;
  lastStudyDate: string | null;
}

export type GameType = 'IMAGE_TO_WORD' | 'AUDIO_TO_IMAGE' | 'MATCHING';
