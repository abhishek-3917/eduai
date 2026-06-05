import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { FileText, Upload, AlertCircle, RefreshCw, Layers, Sparkles, BookOpen } from 'lucide-react';

interface Flashcard {
  question: string;
  answer: string;
}

interface DocumentItem {
  id: number;
  file_name: string;
  summary: string;
  flashcards: Flashcard[] | string;
  created_at: string;
}

export default function Notes() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);
  
  // Input states
  const [rawText, setRawText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Flashcards state
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.get('/notes');
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load uploaded notes catalog.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setRawText(''); // clear text if file is uploaded
    }
  };

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim() && !file) return;

    try {
      setUploading(true);
      setErrorMsg('');
      
      let payload: Record<string, string> = {};

      if (file) {
        // Read file as Base64
        const reader = new FileReader();
        
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const resultStr = reader.result as string;
            const base64Data = resultStr.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = (err) => reject(err);
        });

        reader.readAsDataURL(file);
        const base64String = await base64Promise;
        
        payload = {
          fileName: file.name,
          fileBase64: base64String
        };
      } else {
        payload = {
          fileName: 'Pasted_Note.txt',
          rawText
        };
      }

      const res = await api.post('/notes/upload', payload);
      const newDoc: DocumentItem = res.data.document;
      
      // Update lists
      setDocuments([newDoc, ...documents]);
      setActiveDoc(newDoc);
      setCurrentCardIdx(0);
      setIsFlipped(false);
      setFile(null);
      setRawText('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to process and summarize note.');
    } finally {
      setUploading(false);
    }
  };

  const selectDocument = (doc: DocumentItem) => {
    setActiveDoc(doc);
    setCurrentCardIdx(0);
    setIsFlipped(false);
  };

  const closeDocumentDetails = () => {
    setActiveDoc(null);
    fetchDocuments();
  };

  // Parse flashcards
  let flashcards: Flashcard[] = [];
  if (activeDoc) {
    try {
      flashcards = typeof activeDoc.flashcards === 'string'
        ? JSON.parse(activeDoc.flashcards)
        : activeDoc.flashcards;
    } catch (e) {
      console.error(e);
    }
  }

  if (loading && documents.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border-violet-500/10">
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <FileText className="w-8 h-8 text-violet-400" /> AI Notes & Flashcards
        </h2>
        <p className="text-slate-400 mt-2">
          Upload PDF lecture notes or paste syllabus texts. The AI extracts key bullet summaries and compiles dynamic flashcard decks.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {activeDoc ? (
        // --- DISPLAY ACTIVE DOCUMENT DETAILS (Summary & Flashcards) ---
        <div className="space-y-8 max-w-4xl mx-auto animate-fade-in">
          <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div>
              <p className="text-xs text-violet-400 font-semibold uppercase">Currently Reviewing</p>
              <h3 className="text-lg font-bold text-slate-100">{activeDoc.file_name}</h3>
            </div>
            <button onClick={closeDocumentDetails} className="btn-secondary text-xs py-2 px-4 hover:bg-slate-850">
              Close Study Panel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Summary */}
            <div className="glass-panel p-6 rounded-xl space-y-4">
              <h4 className="font-bold text-base text-white border-b border-slate-850 pb-3">
                📖 Study Note Summary
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{activeDoc.summary}</p>
            </div>

            {/* Interactive Flashcards Flip Box */}
            <div className="glass-panel p-6 rounded-xl flex flex-col justify-between min-h-[350px]">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-6">
                <h4 className="font-bold text-base text-white flex items-center gap-2">
                  <Layers className="w-4.5 h-4.5 text-violet-400" /> Interactive Flashcards
                </h4>
                {flashcards.length > 0 && (
                  <span className="text-xs text-slate-400 font-medium">
                    Card {currentCardIdx + 1} of {flashcards.length}
                  </span>
                )}
              </div>

              {flashcards.length > 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                  {/* Flip Card Container */}
                  <div 
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="w-full h-44 cursor-pointer relative"
                    style={{ perspective: '1000px' }}
                  >
                    <div 
                      className="w-full h-full rounded-xl transition-all duration-500 transform relative"
                      style={{ 
                        transformStyle: 'preserve-3d',
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                      }}
                    >
                      {/* FRONT OF THE CARD */}
                      <div 
                        className="absolute inset-0 bg-slate-800 border border-slate-700/80 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-lg"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wider mb-2">Question</span>
                        <p className="text-sm font-bold text-slate-100">{flashcards[currentCardIdx].question}</p>
                        <span className="text-[10px] text-slate-500 mt-4 font-semibold italic">Click to Flip</span>
                      </div>

                      {/* BACK OF THE CARD */}
                      <div 
                        className="absolute inset-0 bg-violet-950/70 border border-violet-800/80 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-lg transform"
                        style={{ 
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)'
                        }}
                      >
                        <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wider mb-2">Answer</span>
                        <p className="text-sm font-semibold text-slate-200">{flashcards[currentCardIdx].answer}</p>
                        <span className="text-[10px] text-slate-500 mt-4 font-semibold italic">Click to Flip</span>
                      </div>
                    </div>
                  </div>

                  {/* Navigation buttons */}
                  <div className="flex gap-4 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFlipped(false);
                        setCurrentCardIdx((prev) => Math.max(0, prev - 1));
                      }}
                      disabled={currentCardIdx === 0}
                      className="btn-secondary py-1.5 px-4 text-xs disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFlipped(false);
                        setCurrentCardIdx((prev) => Math.min(flashcards.length - 1, prev + 1));
                      }}
                      disabled={currentCardIdx === flashcards.length - 1}
                      className="btn-primary py-1.5 px-4 text-xs disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                  No flashcards generated for this note.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // --- DISPLAY NOTES UPLOADER & HISTORY LIST ---
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Uploader Form */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-xl space-y-6">
            <h3 className="font-bold text-lg text-white border-b border-slate-850 pb-4">
              Upload New Study Note
            </h3>

            <form onSubmit={handleSubmitNote} className="space-y-6">
              {/* File input */}
              <div>
                <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-2">
                  Upload PDF Document
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-800/40 hover:bg-slate-800/80 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-slate-500 mb-2 animate-bounce" />
                      <p className="text-xs text-slate-400">
                        {file ? <span className="text-violet-400 font-semibold">{file.name}</span> : 'Click to upload PDF note'}
                      </p>
                    </div>
                    <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              </div>

              <div className="text-center text-xs text-slate-500 font-semibold uppercase">Or</div>

              {/* Text Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-2">
                  Paste Raw Lecture Text
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value);
                    setFile(null); // clear file if text is typed
                  }}
                  className="w-full h-32 text-sm"
                  placeholder="Paste concepts here..."
                />
              </div>

              <button
                type="submit"
                disabled={uploading || (!rawText.trim() && !file)}
                className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 font-semibold text-sm shadow-lg shadow-violet-500/10"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Extracting & Summarizing Study Note...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Summarize & Generate Flashcards
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Past Notes History Sidebar */}
          <div className="glass-panel p-6 rounded-xl space-y-6">
            <h3 className="font-bold text-lg text-white border-b border-slate-850 pb-4">
              Your Study Library
            </h3>
            
            {documents.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => selectDocument(doc)}
                    className="w-full text-left p-3.5 bg-slate-900/60 hover:bg-slate-900 rounded-lg border border-slate-850 hover:border-slate-750 transition-all flex items-center gap-3 cursor-pointer group"
                  >
                    <BookOpen className="w-5 h-5 text-violet-400 shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-xs text-slate-205 truncate">{doc.file_name}</h4>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500 text-xs">
                No study notes in your library yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
