import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader2, X, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FileUpload = ({ onFileUpload, externalFile }) => {
    const [dragActive, setDragActive] = useState(false);
    const [internalFile, setInternalFile] = useState(null);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Use externalFile (App-level state) if available, else fall back to internal
    const file = externalFile ?? internalFile;

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    };

    const validateFile = (f) => {
        if (f.type !== 'application/pdf') { setError('Only PDF files are allowed'); return false; }
        setError(null);
        return true;
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) {
            const f = e.dataTransfer.files[0];
            if (validateFile(f)) { setInternalFile(f); handleUpload(f); }
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files?.[0]) {
            const f = e.target.files[0];
            if (validateFile(f)) { setInternalFile(f); handleUpload(f); }
        }
    };

    const handleUpload = async (selectedFile) => {
        setUploading(true);
        try { await onFileUpload(selectedFile); }
        catch { setError('Upload failed. Please try again.'); setInternalFile(null); }
        finally { setUploading(false); }
    };

    const clearFile = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setInternalFile(null);
        setError(null);
    };

    return (
        <form
            className={`relative w-full transition-all duration-300 ease-in-out ${dragActive ? 'scale-[1.01]' : ''}`}
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
                flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed
                transition-all duration-300 min-h-[140px]
                ${error
                    ? 'border-red-500/40 bg-red-500/5 text-red-400'
                    : file
                        ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400'
                        : dragActive
                            ? 'border-violet-500/60 bg-violet-500/10 text-violet-300'
                            : 'border-white/10 bg-white/[0.03] hover:border-violet-500/40 hover:bg-violet-500/5 text-white/40'
                }
            `}>
                <AnimatePresence mode="wait">
                    {uploading ? (
                        <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-2">
                            <Loader2 className="w-10 h-10 animate-spin text-violet-400" />
                            <p className="text-sm font-medium text-white/60">Uploading & processing PDF…</p>
                        </motion.div>
                    ) : file ? (
                        <motion.div key="file" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-2 w-full">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-emerald-400" />
                            </div>
                            <p className="text-sm font-semibold text-emerald-300 truncate max-w-[260px]">{file.name}</p>
                            <p className="text-xs text-white/40">{(file.size / 1024 / 1024).toFixed(2)} MB · PDF Document uploaded</p>
                            <button
                                onClick={clearFile}
                                className="z-20 mt-1 flex items-center gap-1 text-xs text-white/40 hover:text-red-400 transition-colors"
                            >
                                <X className="w-3 h-3" /> Remove
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-2 pointer-events-none">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${error ? 'bg-red-500/20' : 'bg-white/5'}`}>
                                {error ? <AlertCircle className="w-6 h-6 text-red-400" /> : <Upload className="w-6 h-6 text-white/40" />}
                            </div>
                            <p className="text-sm font-medium text-white/60">
                                {error || 'Drag & drop or click to upload'}
                            </p>
                            <p className="text-xs text-white/30">PDF only · Max 10 MB</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {error && <p className="text-xs text-red-400 mt-1.5 ml-1">{error}</p>}
        </form>
    );
};

export default FileUpload;
