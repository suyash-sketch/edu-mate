import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import AssessmentView from './components/AssessmentView';
import { uploadFile, pollChunkingStatus, generateAssessment, pollJobStatus } from './api';
import {
  Loader2, Sparkles, BookOpen, AlertTriangle, ArrowLeft,
  Plus, Minus, LayoutDashboard, Database, History,
  Settings, ChevronRight, FileText, Calendar, Hash,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Bloom's config ───────────────────────────────────────────────────────────
const BLOOMS_LEVELS = [
  { key: 'remember',   label: 'Remember'   },
  { key: 'understand', label: 'Understand' },
  { key: 'apply',      label: 'Apply'      },
  { key: 'analyze',    label: 'Analyze'    },
  { key: 'evaluate',   label: 'Evaluate'   },
  { key: 'create',     label: 'Create'     },
];
const DEFAULT_BLOOMS = { remember: 5, understand: 3, apply: 4, analyze: 3, evaluate: 2, create: 3 };

// ─── Mock history data ────────────────────────────────────────────────────────
const MOCK_HISTORY = [
  { name: 'Asynchronous Node.js',   date: 'Feb 17, 2026', questions: 20, status: 'Completed' },
  { name: 'React Hooks Deep Dive',  date: 'Feb 15, 2026', questions: 15, status: 'Completed' },
  { name: 'Database Normalization', date: 'Feb 12, 2026', questions: 10, status: 'Completed' },
  { name: 'REST API Design',        date: 'Feb 10, 2026', questions: 12, status: 'Completed' },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ activeNav, setActiveNav, onReset }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard',     icon: LayoutDashboard },
    { id: 'bank',      label: 'Question Bank', icon: Database },
    { id: 'history',   label: 'History',       icon: History },
    { id: 'settings',  label: 'Settings',      icon: Settings },
  ];

  return (
    <aside className="glass fixed left-0 top-0 h-screen w-[250px] flex flex-col z-40 rounded-none border-r border-white/10 border-l-0 border-t-0 border-b-0">
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 py-6 cursor-pointer select-none"
        onClick={onReset}
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/50">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-bold text-lg tracking-tight">EduMate</span>
      </div>

      {/* Nav links */}
      <nav className="px-3 space-y-1 mt-2">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveNav(id)}
            className={`nav-link w-full ${activeNav === id ? 'active' : ''}`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
            {activeNav === id && (
              <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/40" />
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
}

// ─── Page: Dashboard ──────────────────────────────────────────────────────────
function DashboardPage({
  appState, collectionName, uploadedFile, chapterName, setChapterName,
  bloomsLevels, totalQuestions, adjustLevel,
  isProcessingFile, handleFileUpload, handleGenerate,
  assessmentData, resetApp, error, loadingMessage,
}) {
  return (
    <AnimatePresence mode="wait">

      {/* SETUP */}
      {appState === 'SETUP' && (
        <motion.div
          key="setup"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="mb-8">
            <p className="text-white/40 text-sm font-medium mb-1">Dashboard</p>
            <h1 className="text-3xl font-bold text-white">
              Welcome back, <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Professor</span>
            </h1>
          </div>

          {/* Create New Assessment card */}
          <div className="glass p-7">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-white">Create New Assessment</h2>
            </div>

            {/* Step 1 — Upload */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">
                Step 1 · Upload Material
              </label>
              <FileUpload onFileUpload={handleFileUpload} externalFile={uploadedFile} />
              {isProcessingFile && (
                <p className="text-xs text-violet-400 mt-2 animate-pulse flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Analyzing document structure…
                </p>
              )}
              {collectionName && !isProcessingFile && (
                <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Document ready for AI generation
                </p>
              )}
            </div>

            {/* Step 2 — Bloom's */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">
                Step 2 · Bloom's Taxonomy Factors
              </label>

              {/* Total questions box — compact */}
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xs text-white/40">Total Questions:</span>
                <div className="glass-inner px-3 py-1 rounded-lg flex items-center justify-center min-w-[40px]">
                  <span className="text-white font-bold text-base">{totalQuestions}</span>
                </div>
              </div>

              {/* Bloom's pills — seamless single unit */}
              <div className="flex flex-wrap gap-2">
                {BLOOMS_LEVELS.map(level => (
                  <div
                    key={level.key}
                    className="inline-flex items-stretch rounded-lg overflow-hidden border border-violet-500/30 shadow-md"
                  >
                    {/* Label */}
                    <span className="text-white/80 font-semibold text-sm px-3 flex items-center whitespace-nowrap select-none bg-violet-600/20">
                      {level.label}
                    </span>

                    {/* Minus */}
                    <button
                      type="button"
                      onClick={() => adjustLevel(level.key, -1)}
                      className="px-2.5 flex items-center justify-center bg-violet-500/25 hover:bg-violet-500/50 text-white/70 hover:text-white transition-colors border-l border-violet-500/30"
                    >
                      <Minus className="w-3 h-3" />
                    </button>

                    {/* Counter */}
                    <span className="text-white font-bold text-sm px-3 py-2 flex items-center justify-center bg-violet-500/35 min-w-[34px] select-none">
                      {bloomsLevels[level.key]}
                    </span>

                    {/* Plus */}
                    <button
                      type="button"
                      onClick={() => adjustLevel(level.key, 1)}
                      className="px-2.5 flex items-center justify-center bg-violet-500/25 hover:bg-violet-500/50 text-white/70 hover:text-white transition-colors border-l border-violet-500/30"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3 — Chapter name */}
            <div className="mb-7">
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">
                Step 3 · Chapter / Module Name
              </label>
              <input
                type="text"
                value={chapterName}
                onChange={e => setChapterName(e.target.value)}
                placeholder="E.g., Asynchronous Node.js"
                className="glass-input"
              />
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={!chapterName.trim() || !collectionName || isProcessingFile || totalQuestions === 0}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600
                         hover:from-violet-500 hover:to-indigo-500
                         text-white font-semibold text-base
                         flex items-center justify-center gap-2
                         shadow-xl shadow-violet-900/40
                         transition-all duration-200
                         disabled:opacity-40 disabled:cursor-not-allowed
                         active:scale-[0.99]"
            >
              <Sparkles className="w-5 h-5" />
              {isProcessingFile
                ? 'Waiting for file processing…'
                : !collectionName
                  ? 'Upload a file to start'
                  : totalQuestions === 0
                    ? 'Set at least 1 question'
                    : 'Generate AI Assessment'}
            </button>
          </div>
        </motion.div>
      )}

      {/* GENERATING */}
      {appState === 'GENERATING' && (
        <motion.div
          key="generating"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center min-h-[60vh] text-center"
        >
          <div className="relative w-24 h-24 mb-8">
            <div className="absolute inset-0 rounded-full border-t-2 border-violet-500 animate-spin" />
            <div className="absolute inset-3 rounded-full border-t-2 border-indigo-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-violet-400 animate-pulse" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Generating Assessment</h3>
          <p className="text-white/40 animate-pulse">{loadingMessage}</p>
        </motion.div>
      )}

      {/* RESULTS */}
      {appState === 'RESULTS' && assessmentData && (
        <motion.div
          key="results"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full"
        >
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={resetApp}
              className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> New Assessment
            </button>
          </div>
          <AssessmentView assessmentData={assessmentData} />
        </motion.div>
      )}

      {/* ERROR */}
      {appState === 'ERROR' && (
        <motion.div
          key="error"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center min-h-[60vh]"
        >
          <div className="glass p-10 max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Something went wrong</h3>
            <p className="text-white/40 mb-7 text-sm">{error || 'An unexpected error occurred.'}</p>
            <button onClick={resetApp} className="btn-primary w-full py-3">
              Try Again
            </button>
          </div>
        </motion.div>
      )}

    </AnimatePresence>
  );
}

// ─── Page: History ────────────────────────────────────────────────────────────
function HistoryPage() {
  return (
    <motion.div
      key="history"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8">
        <p className="text-white/40 text-sm font-medium mb-1">History</p>
        <h1 className="text-3xl font-bold text-white">Recent Assessments</h1>
      </div>

      <div className="glass overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.08]">
              <th className="text-left px-6 py-4 text-xs font-semibold text-white/30 uppercase tracking-widest">
                <span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Assessment Name</span>
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-white/30 uppercase tracking-widest">
                <span className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Date</span>
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-white/30 uppercase tracking-widest">
                <span className="flex items-center gap-2"><Hash className="w-3.5 h-3.5" /> Questions</span>
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-white/30 uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_HISTORY.map((row, i) => (
              <tr
                key={i}
                className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors cursor-pointer"
              >
                <td className="px-6 py-4 font-medium text-white/80">{row.name}</td>
                <td className="px-6 py-4 text-white/40">{row.date}</td>
                <td className="px-6 py-4 text-white/40">{row.questions}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// ─── Page: Question Bank ──────────────────────────────────────────────────────
function QuestionBankPage() {
  return (
    <motion.div
      key="bank"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8">
        <p className="text-white/40 text-sm font-medium mb-1">Question Bank</p>
        <h1 className="text-3xl font-bold text-white">Question Bank</h1>
      </div>
      <div className="glass p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
        <Database className="w-12 h-12 text-white/10 mb-4" />
        <p className="text-white/30 text-sm">Question Bank coming soon.</p>
      </div>
    </motion.div>
  );
}

// ─── Page: Settings ───────────────────────────────────────────────────────────
function SettingsPage() {
  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8">
        <p className="text-white/40 text-sm font-medium mb-1">Settings</p>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
      </div>
      <div className="glass p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
        <Settings className="w-12 h-12 text-white/10 mb-4" />
        <p className="text-white/30 text-sm">Settings panel coming soon.</p>
      </div>
    </motion.div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function App() {
  const [appState, setAppState]             = useState('SETUP');
  const [collectionName, setCollectionName] = useState(null);
  const [uploadedFile, setUploadedFile]     = useState(null);
  const [chapterName, setChapterName]       = useState('');
  const [bloomsLevels, setBloomsLevels]     = useState(DEFAULT_BLOOMS);
  const [assessmentData, setAssessmentData] = useState(null);
  const [error, setError]                   = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [activeNav, setActiveNav]           = useState('dashboard');

  const totalQuestions = Object.values(bloomsLevels).reduce((a, b) => a + b, 0);

  const adjustLevel = (key, delta) =>
    setBloomsLevels(prev => ({ ...prev, [key]: Math.max(0, prev[key] + delta) }));

  const buildBloomsRequirements = () =>
    BLOOMS_LEVELS.filter(l => bloomsLevels[l.key] > 0)
      .map(l => `${bloomsLevels[l.key]} ${l.key}`)
      .join(', ');

  const handleFileUpload = async (file) => {
    try {
      setIsProcessingFile(true);
      setUploadedFile(file);
      const response = await uploadFile(file);
      if (response.status === 'queued') {
        setCollectionName(response.collection_name);
        pollChunking(response.job_id);
      } else throw new Error('Upload failed to queue.');
    } catch (err) {
      setError(err.message || 'Failed to upload file.');
      setUploadedFile(null);
      setIsProcessingFile(false);
    }
  };

  const pollChunking = (jobId) => {
    const iv = setInterval(async () => {
      try {
        const s = await pollChunkingStatus(jobId);
        if (s.status === 'chunked') { clearInterval(iv); setIsProcessingFile(false); }
        else if (s.status === 'failed') { clearInterval(iv); setError(`Processing failed: ${s.error}`); setIsProcessingFile(false); }
      } catch { clearInterval(iv); setError('Network error while polling status.'); setIsProcessingFile(false); }
    }, 2000);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!chapterName.trim() || !collectionName || isProcessingFile || totalQuestions === 0) return;
    try {
      setAppState('GENERATING');
      setLoadingMessage('Crafting your assessment with AI…');
      const response = await generateAssessment(chapterName.trim(), collectionName, buildBloomsRequirements());
      if (response.status === 'queued') pollGeneration(response.job_id);
      else throw new Error('Generation failed to queue.');
    } catch (err) {
      setError(err.message || 'Failed to start generation.');
      setAppState('ERROR');
    }
  };

  const pollGeneration = (jobId) => {
    const iv = setInterval(async () => {
      try {
        const s = await pollJobStatus(jobId);
        if (s.status === 'finished') {
          clearInterval(iv);
          if (s.result) { setAssessmentData(s.result); setAppState('RESULTS'); }
          else { setError('Generation finished but returned no data.'); setAppState('ERROR'); }
        } else if (s.status === 'failed') {
          clearInterval(iv); setError(`Generation failed: ${s.error}`); setAppState('ERROR');
        }
      } catch { clearInterval(iv); setError('Network error while polling.'); setAppState('ERROR'); }
    }, 2000);
  };

  const resetApp = () => {
    setAppState('SETUP');
    setCollectionName(null);
    setUploadedFile(null);
    setChapterName('');
    setBloomsLevels(DEFAULT_BLOOMS);
    setAssessmentData(null);
    setError(null);
    setIsProcessingFile(false);
    setActiveNav('dashboard');
  };

  return (
    <div className="min-h-screen w-full bg-black text-white font-sans flex">

      {/* ── Sidebar ── */}
      <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} onReset={resetApp} />

      {/* ── Main content ── */}
      <main className="ml-[250px] flex-1 min-h-screen overflow-y-auto">

        {/* Ambient glow blobs */}
        <div className="fixed top-0 left-[250px] right-0 h-screen pointer-events-none overflow-hidden -z-0">
          <div className="absolute top-[-20%] right-[10%] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[5%] w-[400px] h-[400px] rounded-full bg-indigo-600/[0.08] blur-[100px]" />
        </div>

        <div className="relative z-10 px-8 py-8 max-w-5xl mx-auto">
          <AnimatePresence mode="wait">

            {activeNav === 'dashboard' && (
              <DashboardPage
                key="dashboard-page"
                appState={appState}
                collectionName={collectionName}
                uploadedFile={uploadedFile}
                chapterName={chapterName}
                setChapterName={setChapterName}
                bloomsLevels={bloomsLevels}
                totalQuestions={totalQuestions}
                adjustLevel={adjustLevel}
                isProcessingFile={isProcessingFile}
                handleFileUpload={handleFileUpload}
                handleGenerate={handleGenerate}
                assessmentData={assessmentData}
                resetApp={resetApp}
                error={error}
                loadingMessage={loadingMessage}
              />
            )}

            {activeNav === 'history' && (
              <HistoryPage key="history-page" />
            )}

            {activeNav === 'bank' && (
              <QuestionBankPage key="bank-page" />
            )}

            {activeNav === 'settings' && (
              <SettingsPage key="settings-page" />
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default App;
