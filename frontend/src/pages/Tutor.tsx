import React, { useEffect, useState, useRef } from 'react';
import api from '../utils/api';
import { Sparkles, Send, GraduationCap, AlertCircle } from 'lucide-react';

interface ChatMessage {
  id?: number;
  sender: 'user' | 'bot';
  message: string;
  subject?: string;
  created_at?: string;
}

export default function Tutor() {
  const [subject, setSubject] = useState('DSA');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Suggested Prompts based on active subject
  const presetPrompts: Record<string, string[]> = {
    'DSA': [
      'Explain Binary Search Tree vs AVL Tree.',
      'Show a Python code snippet for Merge Sort.',
      'What is the difference between Array and LinkedList?'
    ],
    'DBMS': [
      'Explain database normalization (1NF, 2NF, 3NF).',
      'Write an example query showing PostgreSQL JOINs.',
      'What are ACID transaction properties?'
    ],
    'OOP': [
      'Explain Inheritance vs Composition.',
      'Give an OOP example of Polymorphism in TypeScript.',
      'What is encapsulation and why is it useful?'
    ],
    'Operating Systems': [
      'What is the difference between Process and Thread?',
      'Explain CPU Scheduling Round-Robin algorithm.',
      'What is a Deadlock and what are the 4 conditions?'
    ]
  };

  useEffect(() => {
    fetchHistory();
  }, [subject]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.get(`/tutor/history?subject=${subject}`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load tutor conversation history.');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || sending) return;

    const userMsg: ChatMessage = { sender: 'user', message: textToSend, subject };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setSending(true);
    setErrorMsg('');

    try {
      const res = await api.post('/tutor/chat', {
        message: textToSend,
        subject
      });
      
      const botMsg: ChatMessage = { sender: 'bot', message: res.data.reply, subject };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setErrorMsg('Tutor service encountered an error.');
    } finally {
      setSending(false);
    }
  };

  const handleSelectChip = (promptText: string) => {
    handleSend(promptText);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] space-y-4">
      {/* Header and Controller */}
      <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 border-violet-500/10">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-7 h-7 text-violet-400" />
          <div>
            <h2 className="font-bold text-lg text-white">AI Subject Tutor</h2>
            <p className="text-slate-400 text-xs mt-0.5">Select a category to guide the AI Persona</p>
          </div>
        </div>

        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full md:w-56"
        >
          <option value="DSA">Data Structures & Algorithms</option>
          <option value="DBMS">Database Management (SQL/DBMS)</option>
          <option value="OOP">Object-Oriented Programming</option>
          <option value="Operating Systems">Operating Systems (OS)</option>
        </select>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg flex items-center gap-2 shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Chat Messages Log */}
      <div className="flex-1 glass-panel p-6 rounded-xl overflow-y-auto space-y-4 min-h-0 bg-slate-900/40">
        {loading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs">Loading logs...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 max-w-md mx-auto text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-violet-600/10 flex items-center justify-center text-violet-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <h4 className="font-bold text-slate-300">Start learning {subject}</h4>
            <p className="text-xs leading-relaxed">
              Ask a custom question, or select one of the suggested query chips below to begin your discussion with the AI Tutor.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            return (
              <div 
                key={idx} 
                className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  isUser ? 'bg-slate-700 text-slate-200' : 'bg-violet-600 text-white'
                }`}>
                  {isUser ? 'U' : 'AI'}
                </div>

                {/* Bubble */}
                <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  isUser 
                    ? 'bg-violet-600 text-white rounded-tr-none' 
                    : 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-tl-none'
                }`}>
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        
        {sending && (
          <div className="flex gap-3 max-w-[80%] mr-auto items-center">
            <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-xs shrink-0 animate-pulse">
              AI
            </div>
            <div className="p-3 bg-slate-800 rounded-2xl rounded-tl-none border border-slate-700/60 text-slate-400 text-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested chips panel */}
      {presetPrompts[subject] && messages.length < 4 && (
        <div className="flex flex-wrap gap-2 shrink-0">
          {presetPrompts[subject].map((promptText, i) => (
            <button
              key={i}
              onClick={() => handleSelectChip(promptText)}
              className="text-xs px-3.5 py-1.5 rounded-full bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              {promptText}
            </button>
          ))}
        </div>
      )}

      {/* Input Form Panel */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSend(inputValue); }} 
        className="flex gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={`Ask the AI ${subject} Tutor...`}
          className="flex-1 px-5 py-3.5"
          required
        />
        <button
          type="submit"
          disabled={sending || !inputValue.trim()}
          className="btn-primary px-6 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/10 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
}
