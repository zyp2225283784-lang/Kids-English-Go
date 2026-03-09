import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  Trophy, 
  Play, 
  Mic, 
  Volume2, 
  ChevronLeft, 
  CheckCircle2, 
  Home,
  Gamepad2,
  BookOpen,
  Sparkles,
  Headphones
} from 'lucide-react';
import { SceneType, Word, UserProgress, GameType } from './types';
import { WORDS, SCENES } from './constants';

// --- Components ---

const ProgressBar = ({ current, total }: { current: number; total: number }) => (
  <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden border-2 border-slate-300">
    <motion.div 
      className="bg-emerald-400 h-full"
      initial={{ width: 0 }}
      animate={{ width: `${(current / total) * 100}%` }}
    />
  </div>
);

const RewardBadge = ({ icon, label, unlocked }: { icon: React.ReactNode, label: string, unlocked: boolean }) => (
  <div className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${unlocked ? 'bg-white border-amber-300' : 'bg-slate-100 border-slate-200 opacity-50'}`}>
    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${unlocked ? 'bg-amber-100 text-amber-500' : 'bg-slate-200 text-slate-400'}`}>
      {icon}
    </div>
    <span className="text-xs font-bold text-slate-600">{label}</span>
  </div>
);

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'home' | 'learning' | 'game' | 'rewards'>('home');
  const [selectedScene, setSelectedScene] = useState<SceneType | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('kids-english-progress');
    return saved ? JSON.parse(saved) : {
      stars: 0,
      learnedWords: [],
      badges: [],
      streak: 1,
      lastStudyDate: new Date().toISOString().split('T')[0]
    };
  });

  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);

  // Save progress
  useEffect(() => {
    localStorage.setItem('kids-english-progress', JSON.stringify(progress));
  }, [progress]);

  // Clear recording when word changes
  useEffect(() => {
    setRecordedAudioUrl(null);
  }, [currentWordIndex, selectedScene]);

  const filteredWords = useMemo(() => {
    if (!selectedScene) return [];
    return WORDS.filter(w => w.scene === selectedScene);
  }, [selectedScene]);

  const currentWord = filteredWords[currentWordIndex];

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const handleFollowRead = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);
      };

      setIsRecording(true);
      setFeedback(null);
      setRecordedAudioUrl(null);

      mediaRecorder.start();

      // Simulate a 3-second recording period
      setTimeout(() => {
        mediaRecorder.stop();
        setIsRecording(false);
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
        
        const feedbacks = ["Great job! ⭐", "Excellent! 👍", "You're a star! 🎉", "Perfect! 🌈"];
        setFeedback(feedbacks[Math.floor(Math.random() * feedbacks.length)]);
        
        // Add star if not already learned
        if (!progress.learnedWords.includes(currentWord.id)) {
          setProgress(prev => ({
            ...prev,
            stars: prev.stars + 1,
            learnedWords: [...prev.learnedWords, currentWord.id]
          }));
        }

        setTimeout(() => setFeedback(null), 2500);
      }, 3000);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      setFeedback("Microphone error! Please check permissions. 🎙️");
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const playRecording = () => {
    if (recordedAudioUrl) {
      const audio = new Audio(recordedAudioUrl);
      audio.play();
    }
  };

  const nextWord = () => {
    if (currentWordIndex < filteredWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
    } else {
      setView('home');
      setSelectedScene(null);
      setCurrentWordIndex(0);
    }
  };

  const prevWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(prev => prev - 1);
    }
  };

  // --- Views ---

  const renderHome = () => (
    <div className="max-w-4xl mx-auto px-6 py-8 pb-32">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-slate-800 flex items-center gap-2">
            Hi, Explorer! <Sparkles className="text-amber-400" />
          </h1>
          <p className="text-slate-500 font-medium">Ready to learn some English today?</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white px-4 py-2 rounded-full border-2 border-amber-200 flex items-center gap-2 cartoon-shadow">
            <Star className="text-amber-400 fill-amber-400 w-5 h-5" />
            <span className="font-bold text-amber-600">{progress.stars}</span>
          </div>
          <button 
            onClick={() => setView('rewards')}
            className="p-2 bg-white rounded-full border-2 border-slate-200 cartoon-shadow hover:bg-slate-50"
          >
            <Trophy className="text-indigo-500 w-6 h-6" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SCENES.map((scene) => (
          <motion.button
            key={scene.type}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setSelectedScene(scene.type);
              setCurrentWordIndex(0);
              setView('learning');
            }}
            className="bg-white p-6 rounded-[2rem] text-slate-800 flex flex-col items-center gap-4 cartoon-shadow transition-all relative overflow-hidden group border-2 border-slate-100"
          >
            <div className={`w-20 h-20 ${scene.color.replace('bg-', 'bg-opacity-20 bg-')} rounded-full flex items-center justify-center text-5xl`}>
              {scene.icon}
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold">{scene.type}</h3>
              <p className="text-slate-400 text-sm font-medium">
                {WORDS.filter(w => w.scene === scene.type).length} Words
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );

  const renderLearning = () => (
    <div className="min-h-screen flex flex-col pb-32">
      <header className="p-6 flex items-center justify-between">
        <button 
          onClick={() => { setView('home'); setSelectedScene(null); }}
          className="p-3 bg-white rounded-2xl border-2 border-slate-200 cartoon-shadow"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 mx-8">
          <ProgressBar current={currentWordIndex + 1} total={filteredWords.length} />
        </div>
        <div className="text-slate-500 font-bold">
          {currentWordIndex + 1} / {filteredWords.length}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentWord.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -100) {
                nextWord();
              } else if (info.offset.x > 100) {
                prevWord();
              }
            }}
            className="w-full max-w-lg bg-white rounded-[3rem] p-10 border-2 border-slate-100 cartoon-shadow flex flex-col items-center cursor-grab active:cursor-grabbing"
          >
            <div className="text-[10rem] mb-8 animate-bounce-subtle pointer-events-none">
              {currentWord.image}
            </div>
            <h2 className="text-6xl font-bold text-slate-800 mb-2 pointer-events-none">{currentWord.english}</h2>
            <p className="text-2xl text-slate-400 font-medium mb-8 pointer-events-none">{currentWord.chinese}</p>
            
            <div className="flex flex-row gap-3 w-full">
              <button 
                onClick={() => speak(currentWord.english)}
                className="flex-1 bg-amber-400 text-white py-4 px-2 rounded-2xl cartoon-shadow flex items-center justify-center gap-2 hover:bg-amber-500 transition-colors"
              >
                <Volume2 className="w-5 h-5" />
                <span className="font-bold text-base">Listen</span>
              </button>
              <button 
                onClick={handleFollowRead}
                disabled={isRecording}
                className={`flex-1 relative overflow-hidden ${isRecording ? 'bg-red-500' : 'bg-emerald-400'} text-white py-4 px-2 rounded-2xl cartoon-shadow flex items-center justify-center gap-2 hover:opacity-90 transition-all`}
              >
                {isRecording && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute inset-0 bg-white rounded-full"
                  />
                )}
                <Mic className={`w-5 h-5 relative z-10 ${isRecording ? 'animate-pulse' : ''}`} />
                <span className="font-bold text-base relative z-10">{isRecording ? 'Wait' : 'Speak'}</span>
                
                {isRecording && (
                  <div className="flex gap-0.5 ml-1 relative z-10">
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [4, 10, 4] }}
                        transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                        className="w-0.5 bg-white rounded-full"
                      />
                    ))}
                  </div>
                )}
              </button>

              <button
                onClick={playRecording}
                disabled={!recordedAudioUrl || isRecording}
                className={`flex-1 py-4 px-2 rounded-2xl border-2 cartoon-shadow flex items-center justify-center gap-2 transition-all ${
                  recordedAudioUrl && !isRecording
                    ? 'bg-indigo-100 text-indigo-600 border-indigo-200 hover:bg-indigo-200' 
                    : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60 cursor-not-allowed'
                }`}
              >
                <Headphones className="w-5 h-5" />
                <span className="font-bold text-base">Replay</span>
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-4 mt-12">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={prevWord}
            disabled={currentWordIndex === 0}
            className={`px-8 py-5 rounded-3xl font-bold text-xl cartoon-shadow flex items-center gap-2 ${currentWordIndex === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-2 border-slate-200 text-slate-700'}`}
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={nextWord}
            className="bg-slate-800 text-white px-12 py-5 rounded-3xl font-bold text-xl cartoon-shadow flex items-center gap-2"
          >
            {currentWordIndex === filteredWords.length - 1 ? 'Finish!' : 'Next Word'}
            <Play className="fill-white w-5 h-5" />
          </motion.button>
        </div>
      </main>
    </div>
  );

  const renderGame = () => {
    // Simple "Listen and Pick" game for demo
    const gameWords = WORDS.sort(() => 0.5 - Math.random()).slice(0, 3);
    const targetWord = gameWords[Math.floor(Math.random() * gameWords.length)];

    return (
      <div className="min-h-screen flex flex-col bg-indigo-50 pb-32 relative overflow-hidden">
        <header className="p-6 flex items-center justify-center relative">
          <h2 className="text-2xl font-bold text-indigo-900">Listen & Pick!</h2>
          <div className="absolute right-6 bg-white px-4 py-2 rounded-full border-2 border-amber-200 flex items-center gap-2">
            <Star className="text-amber-400 fill-amber-400 w-5 h-5" />
            <span className="font-bold text-amber-600">{progress.stars}</span>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6">
          <button 
            onClick={() => speak(targetWord.english)}
            className="w-32 h-32 bg-white rounded-full border-4 border-indigo-200 flex items-center justify-center cartoon-shadow mb-12 hover:bg-indigo-100 transition-colors"
          >
            <Volume2 className="w-16 h-16 text-indigo-500" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
            {gameWords.map((word) => (
              <motion.button
                key={word.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (word.id === targetWord.id) {
                    setFeedback("Correct! ⭐");
                    setProgress(prev => ({ ...prev, stars: prev.stars + 2 }));
                    // To fix the bug where it exits, we just clear feedback and let it re-render for a new round
                    setTimeout(() => { 
                      setFeedback(null); 
                      // No setView('home') here
                    }, 1500);
                  } else {
                    setFeedback("Try again! 🔄");
                    setTimeout(() => setFeedback(null), 1000);
                  }
                }}
                className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 cartoon-shadow flex flex-col items-center gap-4"
              >
                <span className="text-8xl">{word.image}</span>
                <span className="text-2xl font-bold text-slate-700">{word.english}</span>
              </motion.button>
            ))}
          </div>
        </main>
      </div>
    );
  };

  const renderRewards = () => (
    <div className="max-w-4xl mx-auto px-6 py-8 pb-32">
      <header className="flex items-center justify-center mb-10 relative">
        <h1 className="text-4xl font-bold text-slate-800">My Achievements</h1>
      </header>

      <div className="bg-white rounded-[2.5rem] p-10 border-2 border-slate-100 cartoon-shadow mb-8">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center">
            <Star className="w-12 h-12 text-amber-500 fill-amber-500" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-800">{progress.stars} Stars</h2>
            <p className="text-slate-500 font-medium">Keep learning to earn more!</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <RewardBadge icon={<BookOpen />} label="First Word" unlocked={progress.learnedWords.length >= 1} />
          <RewardBadge icon={<Star />} label="10 Stars" unlocked={progress.stars >= 10} />
          <RewardBadge icon={<Trophy />} label="Scene Master" unlocked={progress.learnedWords.length >= 5} />
          <RewardBadge icon={<Sparkles />} label="7 Day Streak" unlocked={progress.streak >= 7} />
        </div>
      </div>

      <div className="bg-indigo-600 text-white p-10 rounded-[2.5rem] cartoon-shadow relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-2xl font-bold mb-2">Next Milestone</h3>
          <p className="text-indigo-100 mb-6">Learn 10 more words to unlock the "Word Explorer" badge!</p>
          <ProgressBar current={progress.learnedWords.length % 10} total={10} />
        </div>
        <div className="absolute -bottom-10 -right-10 opacity-20">
          <Trophy className="w-64 h-64" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen font-sans selection:bg-amber-200">
      <AnimatePresence>
        {feedback && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[1000] px-10 py-4 rounded-full font-bold text-2xl border-2 cartoon-shadow ${
              feedback.includes('Correct') || feedback.includes('job') || feedback.includes('star') || feedback.includes('Excellent') || feedback.includes('Perfect')
                ? 'bg-emerald-100 text-emerald-600 border-emerald-200' 
                : 'bg-red-100 text-red-600 border-red-200'
            }`}
          >
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {view === 'home' && (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {renderHome()}
          </motion.div>
        )}
        {view === 'learning' && (
          <motion.div key="learning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {renderLearning()}
          </motion.div>
        )}
        {view === 'game' && (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {renderGame()}
          </motion.div>
        )}
        {view === 'rewards' && (
          <motion.div key="rewards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {renderRewards()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation - Persistent across all views except learning */}
      {view !== 'learning' && (
        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md border-2 border-slate-200 rounded-full px-8 py-4 flex gap-12 cartoon-shadow z-50">
          <button 
            onClick={() => { setView('home'); setSelectedScene(null); }}
            className={`flex flex-col items-center gap-1 transition-colors ${view === 'home' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
          </button>
          <button 
            onClick={() => setView('game')}
            className={`flex flex-col items-center gap-1 transition-colors ${view === 'game' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Gamepad2 className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Games</span>
          </button>
          <button 
            onClick={() => setView('rewards')}
            className={`flex flex-col items-center gap-1 transition-colors ${view === 'rewards' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Trophy className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Awards</span>
          </button>
        </nav>
      )}
    </div>
  );
}
