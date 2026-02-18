import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LEVELS = [
  {
    label: 'Remember',
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-300',
    description: 'Recall facts, basic concepts, or information from memory.',
  },
  {
    label: 'Understand',
    color: 'from-cyan-400 to-cyan-500',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-300',
    description: 'Explain ideas or concepts in your own words.',
  },
  {
    label: 'Apply',
    color: 'from-green-500 to-green-600',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-300',
    description: 'Use learned knowledge in new or real-world situations.',
  },
  {
    label: 'Analyze',
    color: 'from-purple-500 to-purple-600',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-300',
    description: 'Draw connections, break down information into parts.',
  },
  {
    label: 'Evaluate',
    color: 'from-orange-500 to-orange-600',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-300',
    description: 'Justify a decision or course of action using evidence.',
  },
  {
    label: 'Create',
    color: 'from-pink-500 to-pink-600',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    text: 'text-pink-300',
    description: 'Produce new or original work by combining ideas.',
  },
];

export default function BloomsGuideModal({ onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="blooms-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Modal card — stop propagation so clicking inside doesn't close */}
        <motion.div
          className="relative w-full max-w-2xl backdrop-blur-2xl bg-white/[0.07] border border-white/20 rounded-3xl p-8 shadow-2xl"
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white/70" />
          </button>

          {/* Header */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-1">Reference Guide</p>
            <h2 className="text-2xl font-bold text-white">Understanding Bloom's Taxonomy</h2>
            <p className="text-sm text-white/40 mt-1">
              A framework for categorising educational goals from lower to higher-order thinking.
            </p>
          </div>

          {/* 2-column grid of level cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LEVELS.map((level, i) => (
              <div
                key={level.label}
                className={`flex items-start gap-3 p-4 rounded-2xl border ${level.bg} ${level.border}`}
              >
                {/* Numbered badge */}
                <div className={`flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br ${level.color} flex items-center justify-center text-white font-bold text-xs shadow-md`}>
                  {i + 1}
                </div>
                <div>
                  <p className={`font-semibold text-sm ${level.text}`}>{level.label}</p>
                  <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{level.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <p className="text-xs text-white/20 text-center mt-6">
            Levels progress from lower-order (Remember) to higher-order (Create) thinking skills.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
