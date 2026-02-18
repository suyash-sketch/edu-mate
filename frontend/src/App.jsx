import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import AssessmentView from './components/AssessmentView';
import { uploadFile, pollChunkingStatus, generateAssessment, pollJobStatus } from './api';
import { Loader2, Sparkles, BookOpen, AlertTriangle, ArrowRight, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BLOOMS_LEVELS = [
  { key: 'remember',   label: 'Remember',   color: 'from-blue-500 to-blue-600',     badge: 'bg-blue-400',   ring: 'ring-blue-400' },
  { key: 'understand', label: 'Understand', color: 'from-cyan-400 to-cyan-500',      badge: 'bg-cyan-300',   ring: 'ring-cyan-400' },
  { key: 'apply',      label: 'Apply',      color: 'from-green-500 to-green-600',    badge: 'bg-green-400',  ring: 'ring-green-400' },
  { key: 'analyze',    label: 'Analyze',    color: 'from-purple-500 to-purple-600',  badge: 'bg-purple-400', ring: 'ring-purple-400' },
  { key: 'evaluate',   label: 'Evaluate',   color: 'from-orange-500 to-orange-600',  badge: 'bg-orange-400', ring: 'ring-orange-400' },
  { key: 'create',     label: 'Create',     color: 'from-pink-500 to-pink-600',      badge: 'bg-pink-400',   ring: 'ring-pink-400' },
];

const DEFAULT_BLOOMS = { remember: 5, understand: 3, apply: 4, analyze: 3, evaluate: 2, create: 3 };

function App() {
  const [appState, setAppState] = useState('SETUP'); // SETUP, GENERATING, RESULTS, ERROR
  const [collectionName, setCollectionName] = useState(null);
  const [chapterName, setChapterName] = useState('');
  const [bloomsLevels, setBloomsLevels] = useState(DEFAULT_BLOOMS);
  const [assessmentData, setAssessmentData] = useState(null);
  const [error, setError] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const totalQuestions = Object.values(bloomsLevels).reduce((a, b) => a + b, 0);

  const adjustLevel = (key, delta) => {
    setBloomsLevels(prev => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta),
    }));
  };

  const buildBloomsRequirements = () =>
    BLOOMS_LEVELS
      .filter(l => bloomsLevels[l.key] > 0)
      .map(l => `${bloomsLevels[l.key]} ${l.key}`)
      .join(', ');

  const handleFileUpload = async (file) => {
    try {
      setIsProcessingFile(true);
      // We don't block the UI anymore, just show loading in the button/status
      const response = await uploadFile(file);

      if (response.status === 'queued') {
        setCollectionName(response.collection_name);
        pollChunking(response.job_id);
      } else {
        throw new Error('Upload failed to queue.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to upload file.');
      setIsProcessingFile(false);
    }
  };

  const pollChunking = async (jobId) => {
    const interval = setInterval(async () => {
      try {
        const status = await pollChunkingStatus(jobId);
        if (status.status === 'chunked') {
          clearInterval(interval);
          setIsProcessingFile(false);
          // Optional: Notify user success
        } else if (status.status === 'failed') {
          clearInterval(interval);
          setError(`Processing failed: ${status.error}`);
          setIsProcessingFile(false);
        }
      } catch (err) {
        clearInterval(interval);
        setError('Network error while polling status.');
        setIsProcessingFile(false);
      }
    }, 2000);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!chapterName.trim() || !collectionName || isProcessingFile || totalQuestions === 0) return;

    try {
      setAppState('GENERATING');
      setLoadingMessage('Crafting your assessment with AI...');
      const bloomsRequirements = buildBloomsRequirements();
      const query = chapterName.trim();
      const response = await generateAssessment(query, collectionName, bloomsRequirements);

      if (response.status === 'queued') {
        pollGeneration(response.job_id);
      } else {
        throw new Error('Generation failed to queue.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to start generation.');
      setAppState('ERROR');
    }
  };

  const pollGeneration = async (jobId) => {
    const interval = setInterval(async () => {
      try {
        const status = await pollJobStatus(jobId);
        if (status.status === 'finished') {
          clearInterval(interval);
          if (status.result) {
            setAssessmentData(status.result);
            setAppState('RESULTS');
          } else {
            setError('Generation finished but returned no data.');
            setAppState('ERROR');
          }
        } else if (status.status === 'failed') {
          clearInterval(interval);
          setError(`Generation failed: ${status.error}`);
          setAppState('ERROR');
        }
      } catch (err) {
        clearInterval(interval);
        setError('Network error while polling generation status.');
        setAppState('ERROR');
      }
    }, 2000);
  };

  const resetApp = () => {
    setAppState('SETUP');
    setCollectionName(null);
    setChapterName('');
    setBloomsLevels(DEFAULT_BLOOMS);
    setAssessmentData(null);
    setError(null);
    setIsProcessingFile(false);
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans transition-colors duration-300">

      {/* Navbar / Header */}
      <nav className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 fixed top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={resetApp}>
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                <BookOpen className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                EduMate
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[calc(100vh-6rem)] flex flex-col items-center justify-center">

        <AnimatePresence mode="wait">

          {/* SETUP STATE (Combined Upload + Input) */}
          {appState === 'SETUP' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-3xl"
            >
              <div className="text-center mb-10">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
                  Design Your <span className="text-indigo-600 dark:text-indigo-400">Perfect Assessment</span>
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Upload your material and specify your requirements to generate a professional assessment in seconds.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">

                <div className="mb-8">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                    Step 1: Upload Material
                  </label>
                  <FileUpload onFileUpload={handleFileUpload} compact={true} />
                  {isProcessingFile && (
                    <p className="text-xs text-indigo-500 mt-2 animate-pulse">
                      Analyzing document structure...
                    </p>
                  )}
                  {collectionName && !isProcessingFile && (
                    <p className="text-xs text-emerald-500 mt-2 flex items-center">
                      <Sparkles className="w-3 h-3 mr-1" /> Document ready for AI generation
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      Step 2: Bloom's Taxonomy Factors
                    </label>
                    <span className="text-xs font-medium text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-full">
                      Total: {totalQuestions} questions
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {BLOOMS_LEVELS.map(level => (
                      <div
                        key={level.key}
                        className={`flex items-center gap-0 rounded-xl bg-gradient-to-r ${level.color} shadow-md overflow-hidden`}
                      >
                        <button
                          type="button"
                          onClick={() => adjustLevel(level.key, -1)}
                          className="px-2 py-2.5 text-white/80 hover:text-white hover:bg-black/20 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-white font-semibold text-sm px-1 select-none">
                          {level.label}
                        </span>
                        <div className="mx-2 min-w-[28px] h-7 bg-white/25 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{bloomsLevels[level.key]}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => adjustLevel(level.key, 1)}
                          className="px-2 py-2.5 text-white/80 hover:text-white hover:bg-black/20 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                    Step 3: Chapter / Module Name
                  </label>
                  <input
                    type="text"
                    value={chapterName}
                    onChange={(e) => setChapterName(e.target.value)}
                    placeholder="E.g., Asynchronous Node.js"
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-base"
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={!chapterName.trim() || !collectionName || isProcessingFile || totalQuestions === 0}
                  className="w-full btn-primary py-4 text-lg font-semibold shadow-lg shadow-indigo-500/30 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.99] transition-all"
                >
                  {appState === 'GENERATING' ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  <span>
                    {isProcessingFile
                      ? "Waiting for file processing..."
                      : !collectionName
                        ? "Upload a file to start"
                        : totalQuestions === 0
                          ? "Set at least 1 question"
                          : "Generate AI Assessment"
                    }
                  </span>
                </button>

              </div>
            </motion.div>
          )}

          {/* GENERATING STATE - Optional: Could overlay on SETUP or be separate. Keeping separate for focus. */}
          {appState === 'GENERATING' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center text-center"
            >
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-t-4 border-indigo-500 border-solid rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-purple-500 animate-pulse" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">
                Generating Assessment
              </h3>
              <p className="text-gray-500 dark:text-gray-400 animate-pulse">
                {loadingMessage}
              </p>
            </motion.div>
          )}

          {/* RESULTS STATE */}
          {appState === 'RESULTS' && assessmentData && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full"
            >
              <AssessmentView assessmentData={assessmentData} />

              <div className="flex justify-center mt-12 pb-12">
                <button
                  onClick={resetApp}
                  className="btn-primary bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white flex items-center space-x-2 px-6 py-3 rounded-full"
                >
                  <ArrowRight size={18} className="rotate-180" />
                  <span>Start New Assessment</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ERROR STATE */}
          {appState === 'ERROR' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-red-100 dark:border-red-900/30"
            >
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h3>
              <p className="text-gray-500 mb-6">{error || 'An unexpected error occurred.'}</p>
              <button
                onClick={resetApp}
                className="btn-primary w-full bg-red-600 hover:bg-red-700 border-transparent"
              >
                Try Again
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
