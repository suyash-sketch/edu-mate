import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FileUpload = ({ onFileUpload, compact = false }) => {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const validateFile = (file) => {
        if (file.type !== 'application/pdf') {
            setError('Only PDF files are allowed');
            return false;
        }
        setError(null);
        return true;
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (validateFile(droppedFile)) {
                setFile(droppedFile);
                handleUpload(droppedFile);
            }
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (validateFile(selectedFile)) {
                setFile(selectedFile);
                handleUpload(selectedFile);
            }
        }
    };

    const handleUpload = async (selectedFile) => {
        setUploading(true);
        try {
            await onFileUpload(selectedFile);
        } catch (err) {
            setError('Upload failed. Please try again.');
            setFile(null);
        } finally {
            setUploading(false);
        }
    };

    const clearFile = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setFile(null);
        setError(null);
        // We might want a callback to clear parent state too, but for now this clears the local UI.
        // In a real app, we'd pass a onClear prop.
    };

    // Compact View (Button style)
    if (compact) {
        return (
            <div className="w-full">
                <form
                    className={`relative w-full transition-all duration-300 ease-in-out
                    ${dragActive ? 'scale-[1.02]' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={handleChange}
                        accept=".pdf"
                        disabled={uploading}
                    />

                    <div className={`
                        flex items-center justify-between p-4 rounded-xl border-2 border-dashed
                        ${error
                            ? 'border-red-300 bg-red-50 text-red-600'
                            : file
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                : 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-400 text-indigo-700'
                        }
                        transition-colors
                    `}>
                        <div className="flex items-center space-x-3 overflow-hidden">
                            {uploading ? (
                                <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                            ) : file ? (
                                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            ) : (
                                <Upload className="w-5 h-5 flex-shrink-0" />
                            )}

                            <span className="font-medium truncate text-sm">
                                {uploading
                                    ? "Uploading..."
                                    : file
                                        ? file.name
                                        : "Upload PDF Material"
                                }
                            </span>
                        </div>

                        {!uploading && !file && (
                            <span className="text-xs opacity-60 ml-2 hidden sm:inline-block">Drag & drop or Click</span>
                        )}

                        {file && !uploading && (
                            <button
                                onClick={clearFile}
                                className="z-20 p-1 hover:bg-black/10 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </form>
                {error && <p className="text-xs text-red-500 mt-1 ml-1">{error}</p>}
            </div>
        )
    }

    // Default Large View
    return (
        <div className="w-full max-w-xl mx-auto p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 mb-2">
                    Upload Material
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                    Upload your PDF to generate an assessment
                </p>
            </motion.div>

            <form
                className={`relative w-full h-64 border-2 border-dashed rounded-2xl transition-all duration-300 ease-in-out flex flex-col items-center justify-center p-6
          ${dragActive
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-[1.02]'
                        : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-indigo-400'
                    }
          ${error ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : ''}
        `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    id="file-upload"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={handleChange}
                    accept=".pdf"
                    disabled={uploading}
                />

                <AnimatePresence mode="wait">
                    {uploading ? (
                        <motion.div
                            key="uploading"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex flex-col items-center"
                        >
                            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                            <p className="text-lg font-medium text-gray-700 dark:text-gray-200">Processing PDF...</p>
                            <p className="text-sm text-gray-500">This might take a moment (Chunking & Indexing)</p>
                        </motion.div>
                    ) : file ? (
                        <motion.div
                            key="file-selected"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex flex-col items-center"
                        >
                            <CheckCircle className="w-16 h-16 text-emerald-500 mb-4" />
                            <p className="text-lg font-medium text-gray-800 dark:text-white truncate max-w-xs">{file.name}</p>
                            <p className="text-sm text-emerald-600 mt-1">Ready for assessment generation</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center pointer-events-none"
                        >
                            <div className={`p-4 rounded-full mb-4 ${error ? 'bg-red-100 text-red-500' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30'}`}>
                                {error ? <AlertCircle className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                            </div>
                            <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
                                {error ? error : "Click to upload or drag and drop"}
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                PDF (MAX. 10MB)
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>
        </div>
    );
};

export default FileUpload;
