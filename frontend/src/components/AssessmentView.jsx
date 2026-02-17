import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, FileText, Key, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';

const AssessmentView = ({ assessmentData }) => {
    const [viewMode, setViewMode] = useState('question'); // 'question' | 'answer'
    const [expandedExplanations, setExpandedExplanations] = useState({});

    if (!assessmentData || !assessmentData.mcqs) {
        return (
            <div className="text-center p-8 text-gray-500">
                No assessment data available.
            </div>
        );
    }

    const toggleExplanation = (index) => {
        setExpandedExplanations(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4 pb-20">
            {/* Header / Toggle */}
            <div className="sticky top-4 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-2 mb-8 flex justify-between items-center">
                <h2 className="text-xl font-bold ml-4 text-gray-800 dark:text-gray-100 hidden sm:block">
                    Assessment Result
                </h2>

                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mx-auto sm:mx-0">
                    <button
                        onClick={() => setViewMode('question')}
                        className={clsx(
                            "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                            viewMode === 'question'
                                ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        )}
                    >
                        <FileText size={16} />
                        <span>Question Paper</span>
                    </button>
                    <button
                        onClick={() => setViewMode('answer')}
                        className={clsx(
                            "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                            viewMode === 'answer'
                                ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        )}
                    >
                        <Key size={16} />
                        <span>Answer Key</span>
                    </button>
                </div>
            </div>

            {/* Questions List */}
            <motion.div
                layout
                className="space-y-6"
            >
                {assessmentData.mcqs.map((mcq, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="card hover:shadow-xl transition-shadow duration-300 border-l-4 border-l-transparent hover:border-l-indigo-500"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                                Question {mcq.question_no || index + 1}
                            </span>
                            {viewMode === 'answer' && (
                                <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-md font-mono">
                                    Correct: {mcq.correct_answer}
                                </span>
                            )}
                        </div>

                        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-6 leading-relaxed">
                            {mcq.question}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {mcq.answer_options.map((option, optIndex) => {
                                // Determine status for styling
                                const isAnswerMode = viewMode === 'answer';

                                // Option string usually "A) content" or just "content". 
                                // Assuming backend might send "A" or the full string as correct answer.
                                // Need to be robust. For now, basic strict match or partial match if needed.
                                // Let's assume strict match or checking if option starts with correct_answer.

                                // Simplified check:
                                const isCorrect = isAnswerMode && (
                                    option === mcq.correct_answer ||
                                    option.startsWith(`${mcq.correct_answer})`) ||
                                    option.startsWith(`${mcq.correct_answer}.`)
                                );

                                return (
                                    <div
                                        key={optIndex}
                                        className={clsx(
                                            "p-3 rounded-lg border text-sm transition-all duration-200 flex items-center",
                                            isCorrect
                                                ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-200 font-medium"
                                                : "bg-gray-50 border-gray-100 text-gray-600 dark:bg-gray-700/50 dark:border-gray-700 dark:text-gray-300"
                                        )}
                                    >
                                        <div className={clsx(
                                            "w-6 h-6 rounded-full flex items-center justify-center mr-3 text-xs border",
                                            isCorrect
                                                ? "bg-emerald-500 border-emerald-500 text-white"
                                                : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500"
                                        )}>
                                            {String.fromCharCode(65 + optIndex)}
                                        </div>
                                        {option}
                                        {isCorrect && <Check className="ml-auto w-4 h-4 text-emerald-600" />}
                                    </div>
                                );
                            })}
                        </div>

                        {viewMode === 'answer' && mcq.explaination && (
                            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={() => toggleExplanation(index)}
                                    className="flex items-center text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline focus:outline-none"
                                >
                                    {expandedExplanations[index] ? (
                                        <>
                                            <ChevronUp className="w-4 h-4 mr-1" /> Hide Explanation
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="w-4 h-4 mr-1" /> Show Explanation
                                        </>
                                    )}
                                </button>

                                <motion.div
                                    initial={false}
                                    animate={{ height: expandedExplanations[index] ? 'auto' : 0, opacity: expandedExplanations[index] ? 1 : 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                >
                                    <div className="pt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-indigo-50/50 dark:bg-indigo-900/10 p-3 rounded-lg mt-2">
                                        <span className="font-semibold text-indigo-700 dark:text-indigo-300">Explanation: </span>
                                        {mcq.explaination}
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
};

export default AssessmentView;
