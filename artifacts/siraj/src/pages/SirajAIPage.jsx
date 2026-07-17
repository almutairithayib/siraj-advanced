import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Sparkles, History, X, Plus, Loader2, Check, Coins, Trash2, AlertTriangle } from 'lucide-react';
import useSavings from '../hooks/useSavings';
import apiClient from '../api/client';
import logo from '../assets/LOGO-SIRAJ.png';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const quickChips = [
  'وش وضعي المالي هذا الشهر؟',
  'افتح لي حصالة جديدة',
  'اقترح خطة ادخار',
  'كم باقي على هدف السفر؟',
];

const watermarkPhrases = [
  'سراج.. ينير دربك المالي',
  'مستشارك الذكي بين يديك',
  'تخطيط ذكي لمستقبل آمن',
  'قراراتك مدعومة بالذكاء الاصطناعي',
  'خطط، ادخر، واستثمر بذكاء'
];

function Typewriter({ text, speed = 80 }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.substring(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return <span dir="rtl" style={{ unicodeBidi: 'plaintext' }}>{displayedText}</span>;
}

const welcomeMessage = {
  id: 'welcome-msg',
  role: 'assistant',
  text: 'أهلًا! أنا سراج، مستشارك المالي الذكي. اسألني عن وضعك المالي أو اطلب مني تنفيذ عملية.',
};

function CoinsForm({ onConfirm, onCancel }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [months, setMonths] = useState('');

  return (
    <div className="siraj-pending-card">
      <div className="siraj-pending-header">
        <Coins size={16} />
        <span>إنشاء حصالة جديدة</span>
      </div>
      <div className="siraj-pending-form">
        <input
          className="siraj-pending-input"
          placeholder="اسم الحصالة (مثال: رحلة السفر)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="siraj-pending-input"
          type="number"
          placeholder="مبلغ الإيداع الشهري (ر.س)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          className="siraj-pending-input"
          type="number"
          placeholder="المدة (بالأشهر)"
          value={months}
          onChange={(e) => setMonths(e.target.value)}
        />
      </div>
      <div className="siraj-pending-actions">
        <button
          className="siraj-pending-confirm"
          disabled={!name || !amount || !months}
          onClick={() => onConfirm(name, amount, months)}
        >
          <Check size={14} /> تأكيد
        </button>
        <button className="siraj-pending-cancel" onClick={onCancel}>
          <X size={14} /> إلغاء
        </button>
      </div>
    </div>
  );
}

export default function SirajAIPage() {
  const { addPlan } = useSavings();
  const location = useLocation();
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [input, setInput] = useState('');
  const [toolStatus, setToolStatus] = useState(null);
  const [typing, setTyping] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const endRef = useRef(null);
  const hasSentInitialPrompt = useRef(false);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const messages = activeSession?.messages || [];

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % watermarkPhrases.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Init sessions on mount
  useEffect(() => {
    const initChat = async () => {
      try {
        const res = await apiClient.get('/chat/sessions');
        if (res.data && res.data.length > 0) {
          const sessList = res.data.map(s => ({
            id: s.id,
            title: s.title,
            date: new Date(s.created_at).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' }),
            messages: [welcomeMessage],
          }));
          setSessions(sessList);
          setActiveSessionId(sessList[0].id);
        } else {
          // Create initial session
          const createRes = await apiClient.post('/chat/sessions', { title: 'مستشار سراج' });
          const newSess = {
            id: createRes.data.id,
            title: createRes.data.title,
            date: 'الآن',
            messages: [welcomeMessage],
          };
          setSessions([newSess]);
          setActiveSessionId(createRes.data.id);
        }
      } catch (err) {
        console.error('Failed to init chat sessions:', err);
        const savedSessions = JSON.parse(localStorage.getItem('siraj_chat_sessions'));
        if (savedSessions && savedSessions.length > 0) {
          setSessions(savedSessions);
          setActiveSessionId(savedSessions[0].id);
        } else {
          const fallbackSession = {
            id: 'local-session-' + Date.now(),
            title: 'مستشار سراج',
            date: 'الآن',
            messages: [welcomeMessage]
          };
          setSessions([fallbackSession]);
          setActiveSessionId(fallbackSession.id);
        }
      }
    };
    initChat();
  }, []);

  // Fetch messages for active session when it changes
  useEffect(() => {
    if (!activeSessionId) return;
    const fetchMessages = async () => {
      try {
        const res = await apiClient.get(`/chat/sessions/${activeSessionId}/messages`);
        const mappedMsgs = res.data.map(m => ({
          id: m.id,
          role: m.role,
          text: m.content,
        }));
        
        setSessions(prev => prev.map(s => 
          s.id === activeSessionId 
            ? { ...s, messages: mappedMsgs.length > 0 ? mappedMsgs : [welcomeMessage] } 
            : s
        ));
      } catch (err) {
        console.error('Failed to load messages for session:', err);
      }
    };
    fetchMessages();
  }, [activeSessionId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, toolStatus, typing, pendingAction]);

  // Sync sessions to localStorage for offline hackathon demo
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('siraj_chat_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  useEffect(() => {
    if (location.state?.initialPrompt && !hasSentInitialPrompt.current && sessions.length > 0) {
      hasSentInitialPrompt.current = true;
      const initialPromptText = location.state.initialPrompt;
      
      // If we have an active session, send it, otherwise create one
      let sessionId = activeSessionId;
      if (!sessionId && sessions.length > 0) {
        sessionId = sessions[0].id;
      }
      
      if (sessionId) {
        setTimeout(() => {
          send(initialPromptText, sessionId);
        }, 300);
      }
      window.history.replaceState({}, document.title);
    }
  }, [sessions]);

  const addMessage = (msg, targetSessionId) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === targetSessionId ? { ...s, messages: [...s.messages, msg] } : s))
    );
  };

  const updateMessageText = (tempId, newText, targetSessionId) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== targetSessionId) return s;
        const updatedMsgs = s.messages.map((m) =>
          m.id === tempId ? { ...m, text: newText } : m
        );
        return { ...s, messages: updatedMsgs };
      })
    );
  };

  const send = async (text, targetSessionId = activeSessionId) => {
    if (!text.trim()) return;

    addMessage({ id: Date.now().toString(), role: 'user', text }, targetSessionId);
    setInput('');
    setPendingAction(null);

    // Special case: creating a piggy bank requires confirmation
    if (text.includes('حصالة')) {
      setToolStatus('جاري تجهيز طلبك...');
      setTimeout(() => {
        setToolStatus(null);
        addMessage(
          { id: Date.now().toString(), role: 'assistant', text: 'تمام، عبّي التفاصيل التالية عشان أنشئ لك الحصالة 👇' },
          targetSessionId
        );
        setPendingAction({ type: 'create_piggybank', sessionId: targetSessionId });
      }, 1000);
      return;
    }

    setTyping(true);

    try {
      const token = localStorage.getItem('siraj_token');
      const response = await fetch(`${API_BASE_URL}/chat/sessions/${targetSessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: text }),
      });

      if (!response.ok) {
        throw new Error('Failed to stream assistant reply');
      }

      setTyping(false);
      const assistantMessageId = Date.now().toString();
      addMessage({ id: assistantMessageId, role: 'assistant', text: '' }, targetSessionId);

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let accumulatedText = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunkStr = decoder.decode(value, { stream: true });
          const lines = chunkStr.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.substring(6).trim();
              if (dataStr) {
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.content) {
                    accumulatedText += parsed.content;
                    updateMessageText(assistantMessageId, accumulatedText, targetSessionId);
                  }
                } catch (e) {
                  // Ignore parsing metadata or partial JSON lines
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setTyping(false);
      addMessage(
        { id: Date.now().toString(), role: 'assistant', text: 'عذراً، خدمة المساعد الذكي غير متوفرة مؤقتاً بسبب ضغط على الخوادم. يرجى المحاولة مرة أخرى بعد لحظات. بياناتك المالية آمنة ويمكنك تصفح لوحة التحكم بشكل طبيعي.' },
        targetSessionId
      );
    }
  };

  const confirmCoins = async (name, amount, months) => {
    const sessionId = pendingAction.sessionId;
    setPendingAction(null);
    setToolStatus('جاري إنشاء الحصالة...');
    
    const res = await addPlan(name, amount, parseInt(months) || 12);
    setToolStatus(null);
    if (res.success) {
      addMessage(
        {
          id: Date.now().toString(),
          role: 'assistant',
          text: `تم إنشاء حصالة "${name}" بنجاح ✅ بإيداع شهري ${Number(amount).toLocaleString()} ر.س. تقدر تتابعها من صفحة الادخار.`,
        },
        sessionId
      );
    } else {
      addMessage(
        {
          id: Date.now().toString(),
          role: 'assistant',
          text: `فشل إنشاء الحصالة: ${res.error}`,
        },
        sessionId
      );
    }
  };

  const cancelCoins = () => {
    const sessionId = pendingAction.sessionId;
    setPendingAction(null);
    addMessage({ id: Date.now().toString(), role: 'assistant', text: 'تمام، ألغيت العملية. أي شي ثاني أقدر أساعدك فيه؟' }, sessionId);
  };

  const startNewChat = async () => {
    try {
      const createRes = await apiClient.post('/chat/sessions', { title: 'محادثة استشارية' });
      const newSess = {
        id: createRes.data.id,
        title: createRes.data.title,
        date: 'الآن',
        messages: [welcomeMessage],
      };
      setSessions((prev) => [newSess, ...prev]);
      setActiveSessionId(newSess.id);
      setShowSessions(false);
    } catch (err) {
      console.error('Failed to create new session:', err);
      // Fallback
      const newSess = {
        id: 'local-session-' + Date.now(),
        title: 'محادثة استشارية',
        date: 'الآن',
        messages: [welcomeMessage],
      };
      setSessions((prev) => [newSess, ...prev]);
      setActiveSessionId(newSess.id);
      setShowSessions(false);
    }
  };

  const switchSession = (id) => {
    setActiveSessionId(id);
    setShowSessions(false);
  };

  const deleteSession = async (id) => {
    try {
      await apiClient.delete(`/chat/sessions/${id}`);
    } catch (e) {
      console.error('Failed to delete session on server', e);
    }
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (activeSessionId === id) {
      if (newSessions.length > 0) {
        setActiveSessionId(newSessions[0].id);
      } else {
        startNewChat();
      }
    }
  };

  const confirmDeleteAll = async () => {
    try {
      await apiClient.delete('/chat/sessions');
    } catch (e) {
      console.error('Failed to delete all sessions on server', e);
    }
    localStorage.removeItem('siraj_chat_sessions');
    setSessions([]);
    setActiveSessionId(null);
    setShowDeleteConfirm(false);
    startNewChat();
  };

  return (
    <div className="siraj-chat-wrapper">
      {/* Header */}
      <div className="siraj-chat-header">
        <div className="siraj-chat-header-info">
          <div className="siraj-avatar">
            <Sparkles size={17} />
          </div>
          <div>
            <p className="siraj-chat-name">سراج</p>
            <p className="siraj-chat-status">متصل الآن</p>
          </div>
        </div>
        <button className="siraj-history-btn" onClick={() => setShowSessions(true)}>
          <History size={19} />
        </button>
      </div>

      {/* Messages */}
      <div className="siraj-chat-messages" style={{ position: 'relative' }}>
        {/* Watermark Logo */}
        <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src={logo} alt="" className="watermark-img" style={{ width: '280px', height: '280px', filter: 'brightness(0) invert(1)' }} />
          <p className="watermark-text" style={{ minHeight: '30px', marginTop: '25px' }}>
            <Typewriter text={watermarkPhrases[phraseIndex]} />
            <span className="cursor-blink">|</span>
          </p>
        </div>

        {messages.map((m, i) => (
          <div key={m.id || i} className={`siraj-msg-row ${m.role === 'user' ? 'user' : 'assistant'}`} style={{ position: 'relative', zIndex: 1 }}>
            <div className={`siraj-msg-bubble ${m.role === 'user' ? 'user' : 'assistant'}`} style={{ whiteSpace: 'pre-wrap' }}>
              {m.text}
            </div>
          </div>
        ))}

        {toolStatus && (
          <div className="siraj-msg-row assistant">
            <div className="siraj-tool-indicator">
              <Loader2 size={14} className="siraj-spin" />
              <span>{toolStatus}</span>
            </div>
          </div>
        )}

        {typing && (
          <div className="siraj-msg-row assistant">
            <div className="siraj-msg-bubble assistant siraj-typing">
              <span className="siraj-dot" />
              <span className="siraj-dot" />
              <span className="siraj-dot" />
            </div>
          </div>
        )}

        {pendingAction?.type === 'create_piggybank' && (
          <CoinsForm onConfirm={confirmCoins} onCancel={cancelCoins} />
        )}

        <div ref={endRef} />
      </div>

      {/* Quick Chips */}
      <div className="siraj-chips-row">
        {quickChips.map((chip) => (
          <button key={chip} className="siraj-chip" onClick={() => send(chip)}>
            {chip}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="siraj-input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
          placeholder="اكتب رسالتك..."
          className="siraj-input-field"
        />
        <button className="siraj-send-btn" onClick={() => send(input)}>
          <Send size={16} style={{ transform: 'rotate(-90deg)' }} />
        </button>
      </div>

      {/* Sessions Drawer */}
      {showSessions && (
        <div className="drawer-overlay" onClick={() => { setShowSessions(false); setShowDeleteConfirm(false); }}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-handle"></div>
              <h3 className="drawer-title">سجل المحادثات</h3>
            </div>
            
            {showDeleteConfirm ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                 <AlertTriangle size={32} color="#dc2626" style={{ marginBottom: '10px' }} />
                 <p style={{ color: 'var(--text-primary)', marginBottom: '20px', fontSize: '14px' }}>
                    هل أنت متأكد من حذف جميع المحادثات؟ لا يمكن التراجع عن هذا الإجراء.
                 </p>
                 <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowDeleteConfirm(false)}>إلغاء</button>
                    <button className="btn btn-primary" style={{ flex: 1, backgroundColor: '#dc2626' }} onClick={confirmDeleteAll}>تأكيد الحذف</button>
                 </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '10px', padding: '0 20px', marginBottom: '15px' }}>
                  <button className="siraj-new-chat-btn" style={{ flex: 1, margin: 0 }} onClick={startNewChat}>
                    <Plus size={16} /> محادثة جديدة
                  </button>
                  {sessions.length > 0 && (
                    <button 
                      className="siraj-new-chat-btn" 
                      style={{ flex: 0.2, margin: 0, backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#dc2626', border: 'none', display: 'flex', justifyContent: 'center' }} 
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                <div className="siraj-sessions-list">
                  {sessions.map((s) => (
                    <div 
                      key={s.id} 
                      className={`siraj-session-item ${s.id === activeSessionId ? 'active' : ''}`}
                      style={{ display: 'flex', cursor: 'pointer', marginBottom: '8px' }}
                      onClick={() => switchSession(s.id)}
                    >
                      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="siraj-session-title">{s.title}</span>
                        <span className="siraj-session-date" style={{ color: s.id === activeSessionId ? '#fff' : 'var(--text-secondary)' }}>{s.date}</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                        style={{ background: 'transparent', border: 'none', color: s.id === activeSessionId ? '#fff' : '#9ca3af', marginRight: '10px', padding: '0' }}
                      >
                         <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}