import React from 'react';
import { motion } from 'framer-motion';
import {
  Rocket, Cpu, User, Zap, Database, Brain, Globe, Code2,
  GraduationCap, Star, ArrowRight,
} from 'lucide-react';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

const TECH_STACK = [
  {
    icon: Globe,
    label: 'Frontend',
    value: 'React + Tailwind CSS',
    desc: 'Glassmorphism design system, fully responsive.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
  },
  {
    icon: Zap,
    label: 'Backend',
    value: 'FastAPI + Redis + RQ',
    desc: 'Async background workers — UI stays lightning-fast.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
  },
  {
    icon: Database,
    label: 'Vector Store',
    value: 'Qdrant + Ollama Embeddings',
    desc: 'PDF chunks stored for high-speed RAG retrieval.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    icon: Brain,
    label: 'Generative Core',
    value: 'Google Gemini 2.5 Flash Lite',
    desc: 'Synthesises context into taxonomy-structured questions.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
  },
];

const SKILLS = [
  { label: 'Machine Learning', icon: Brain },
  { label: 'Data Structures (C++)', icon: Code2 },
  { label: 'Full-Stack Web Dev', icon: Globe },
  { label: 'Applied AI / RAG', icon: Cpu },
];

export default function AboutPage() {
  return (
    <motion.div
      key="about"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
    >
      {/* Page header */}
      <div className="mb-10">
        <p className="text-white/40 text-sm font-medium mb-1">About</p>
        <h1 className="text-3xl font-bold text-white">
          About{' '}
          <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            EduMate
          </span>
        </h1>
        <p className="text-white/40 text-sm mt-2 max-w-xl">
          AI-powered assessment generation fused with Bloom's Taxonomy — built for educators who refuse to compromise on quality.
        </p>
      </div>

      {/* ── Mission ── */}
      <motion.div {...fadeUp(0.05)} className="glass p-7 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-lg">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest">01</p>
            <h2 className="text-lg font-bold text-white">The Mission</h2>
          </div>
        </div>
        <p className="text-sm font-semibold text-white/80 mb-2">
          Bridging the Gap Between AI and Proven Pedagogy
        </p>
        <p className="text-sm text-white/50 leading-relaxed">
          Teachers spend countless hours manually crafting assessments that often miss the mark on cognitive depth.
          EduMate was built to automate this tedious process without sacrificing educational quality. By fusing
          advanced AI with Bloom's Taxonomy, EduMate transforms static textbooks into dynamic, curriculum-aligned
          evaluations in seconds — ensuring students are tested on critical thinking, not just basic recall.
        </p>
        <div className="mt-5 flex items-center gap-2 text-xs text-violet-400 font-semibold">
          <ArrowRight className="w-3.5 h-3.5" />
          <span>Upload a PDF → Set cognitive levels → Generate in seconds</span>
        </div>
      </motion.div>

      {/* ── Architecture ── */}
      <motion.div {...fadeUp(0.1)} className="glass p-7 mb-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest">02</p>
            <h2 className="text-lg font-bold text-white">Under the Hood</h2>
          </div>
        </div>
        <p className="text-sm text-white/50 mb-5 leading-relaxed">
          EduMate isn't just a wrapper — it's a fully asynchronous, RAG-powered application designed for scale.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TECH_STACK.map(({ icon: Icon, label, value, desc, color, bg, border }) => (
            <div key={label} className={`flex items-start gap-3 p-4 rounded-2xl border ${bg} ${border}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${bg} border ${border} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-white/30 uppercase tracking-widest font-semibold">{label}</p>
                <p className={`text-sm font-bold ${color} mt-0.5`}>{value}</p>
                <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* RAG pipeline visual */}
        <div className="mt-5 flex items-center gap-2 flex-wrap">
          {['PDF Upload', '→', 'Chunking', '→', 'Qdrant Embeddings', '→', 'RAG Retrieval', '→', 'Gemini Generation', '→', 'Assessment'].map((step, i) => (
            step === '→'
              ? <span key={i} className="text-white/20 text-sm">→</span>
              : <span key={i} className="text-xs font-semibold text-white/60 bg-white/[0.05] border border-white/10 px-2.5 py-1 rounded-lg">{step}</span>
          ))}
        </div>
      </motion.div>

      {/* ── Builder ── */}
      <motion.div {...fadeUp(0.15)} className="glass p-7">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest">03</p>
            <h2 className="text-lg font-bold text-white">Meet the Builder</h2>
          </div>
        </div>

        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-white font-bold text-base">Software Engineering Student</p>
              <span className="text-xs font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">Class of 2027</span>
            </div>
            <p className="text-sm text-white/50 leading-relaxed mb-4">
              Driven by a mindset of relentless improvement — scaling from ground zero to enterprise-grade architecture.
              This project reflects a deep commitment to engineering excellence. With upcoming industry experience in
              applied ML, the ultimate goal is to build highly optimised, user-centric products that meet the rigorous
              standards of top-tier tech environments.
            </p>

            {/* Skills */}
            <div className="flex flex-wrap gap-2">
              {SKILLS.map(({ label, icon: Icon }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs font-semibold text-white/60 bg-white/[0.05] border border-white/10 px-3 py-1.5 rounded-lg">
                  <Icon className="w-3 h-3 text-violet-400" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quote */}
        <div className="mt-6 pt-5 border-t border-white/[0.08]">
          <p className="text-sm text-white/30 italic text-center">
            "The best engineers don't just write code — they engineer solutions that outlast the problem."
          </p>
          <div className="flex items-center justify-center gap-1 mt-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
