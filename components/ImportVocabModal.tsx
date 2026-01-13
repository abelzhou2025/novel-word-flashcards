import React, { useState, useRef, useCallback } from 'react';
import { parseImportedFile, ImportResult } from '../services/importService';

interface ImportVocabModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportSuccess: (wordCount: number) => void;
}

const ImportVocabModal: React.FC<ImportVocabModalProps> = ({ isOpen, onClose, onImportSuccess }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(async (file: File) => {
        setIsProcessing(true);
        setResult(null);

        try {
            const content = await file.text();
            const importResult = parseImportedFile(content, file.name);
            setResult(importResult);

            if (importResult.success) {
                setTimeout(() => {
                    onImportSuccess(importResult.wordCount);
                    onClose();
                }, 1500);
            }
        } catch (error) {
            setResult({
                success: false,
                wordCount: 0,
                errors: ['读取文件失败: ' + (error as Error).message],
            });
        } finally {
            setIsProcessing(false);
        }
    }, [onClose, onImportSuccess]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    }, [handleFile]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
        }
    }, [handleFile]);

    const handleClickUpload = () => {
        fileInputRef.current?.click();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                            📥 导入自定义词库
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-2xl leading-none"
                        >
                            ×
                        </button>
                    </div>

                    {/* Drop Zone */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={handleClickUpload}
                        className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
              ${isDragging
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                            }
              ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
            `}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".txt,.csv,.json"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        <div className="text-4xl mb-3">📄</div>

                        {isProcessing ? (
                            <div>
                                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                <p className="text-slate-600 dark:text-slate-400">正在解析...</p>
                            </div>
                        ) : (
                            <>
                                <p className="text-slate-700 dark:text-slate-300 font-medium mb-1">
                                    拖放文件到此处，或点击选择
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    支持 TXT、CSV、JSON 格式
                                </p>
                            </>
                        )}
                    </div>

                    {/* Result */}
                    {result && (
                        <div className={`mt-4 p-4 rounded-lg ${result.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                            {result.success ? (
                                <div className="flex items-center text-green-700 dark:text-green-400">
                                    <span className="text-xl mr-2">✅</span>
                                    <span>成功导入 {result.wordCount} 个单词！</span>
                                </div>
                            ) : (
                                <div className="text-red-700 dark:text-red-400">
                                    <div className="flex items-center mb-2">
                                        <span className="text-xl mr-2">❌</span>
                                        <span>导入失败</span>
                                    </div>
                                    <ul className="text-sm list-disc list-inside">
                                        {result.errors.map((err, i) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Format Help */}
                    <div className="mt-6 text-sm text-slate-500 dark:text-slate-400">
                        <p className="font-medium mb-2">支持的格式：</p>
                        <ul className="space-y-1 text-xs">
                            <li><strong>TXT：</strong>每行一个单词，或 "单词\t翻译" 格式</li>
                            <li><strong>CSV：</strong>word,translation 或 word,pronunciation,translation</li>
                            <li><strong>JSON：</strong>单词数组或 KyleBing 格式</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportVocabModal;
