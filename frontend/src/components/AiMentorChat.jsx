import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, BrainCircuit, Bot } from 'lucide-react';

export default function AiMentorChat({ student, assessment }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initial greeting
      const score = assessment?.overallScore || 'N/A';
      setMessages([
        {
          id: 1,
          sender: 'ai',
          text: `Hello ${student?.name || 'there'}! I'm your AI Career Mentor. I see your current holistic score is **${score}/100**. How can I help you improve your profile today?`
        }
      ]);
    }
  }, [isOpen, messages.length, student, assessment]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const simulateAiResponse = (userText) => {
    const text = userText.toLowerCase();
    let reply = "I'm analyzing your profile to find the best opportunities for you. Keep up the good work!";
    
    if (text.includes('improve') || text.includes('leadership')) {
      const leadershipScore = assessment?.dimensionScores?.leadership || 0;
      reply = `I see your leadership score is ${leadershipScore}. To boost this, I recommend taking up a core committee role in a college club or organizing a department event. Our predictive AI shows this could increase your overall score by 4 points!`;
    } else if (text.includes('resume') || text.includes('job') || text.includes('placement')) {
      reply = `Based on your verified activities, your technical skills are strong! You should generate your AI Resume from the Certificates tab. Highlight your recent hackathons and projects when applying.`;
    } else if (text.includes('hi') || text.includes('hello')) {
      reply = `Hi! What specific dimension of your development would you like to discuss? I can analyze your Academic, Technical, or Extracurricular data.`;
    } else if (text.includes('score') || text.includes('marks')) {
      reply = `Your holistic score is calculated across 12 dimensions, giving a much better picture of your character than just GPA alone. You're on a great trajectory!`;
    }

    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Date.now(), sender: 'ai', text: reply }]);
    }, 1500 + Math.random() * 1000); // 1.5 - 2.5s simulated thinking time
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    
    simulateAiResponse(userMsg.text);
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_4px_24px_rgba(99,102,241,0.4)] z-50 transition-transform hover:scale-110 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white' }}
          >
            <Bot className="w-7 h-7 animate-pulse" />
            {/* Notification dot */}
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-slate-900" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-80 sm:w-[350px] h-[500px] max-h-[80vh] flex flex-col rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-50"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', backdropFilter: 'blur(24px)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.1))', borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-500/20 text-indigo-400">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-primary">AI Career Mentor</h3>
                  <p className="text-[10px] text-cyan-400 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Online & Monitoring</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-secondary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-sm' 
                      : 'bg-slate-800/60 border border-slate-700/50 text-slate-200 rounded-tl-sm'
                  }`}>
                    {/* Render bold text simply */}
                    {msg.text.split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className="text-white">{part}</strong> : part)}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl rounded-tl-sm p-3 px-4 flex gap-1.5 items-center">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3" style={{ borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
              <div className="relative">
                <input 
                  type="text" 
                  value={input} 
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask about your development..." 
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="absolute right-1.5 top-1.5 bottom-1.5 w-10 bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-700 rounded-lg flex items-center justify-center text-white transition-colors"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
