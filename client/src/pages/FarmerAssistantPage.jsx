import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FiMessageSquare, FiSend, FiUser, FiCpu,
  FiHelpCircle, FiFileText, FiDownload
} from 'react-icons/fi';
import expansionApi from '../services/expansionApi';
import notify from '../utils/toast';
import { PageContainer, PageHeader } from '../components/ui';
import AIResponseCard from '../components/AIResponseCard';
import { generateFarmReportPDF } from '../utils/pdfGenerator';

const FALLBACK_QUESTIONS = [
  'What fertilizer should I apply for Nitrogen deficit?',
  'How much water does Rice require during tillering?',
  'What should I do if my crop leaves have brown spots?',
  'How can I calculate my net profit per hectare?'
];

const FarmerAssistantPage = () => {
  const [messages, setMessages] = useState([
    {
      _id: 'welcome',
      sender: 'assistant',
      text: JSON.stringify({
        summary: 'Welcome to Enterprise AI Crop Specialist Copilot',
        explanation: 'I am your intelligent agronomic copilot powered by real-time soil telemetry, leaf pathology models, and weather data.',
        whyExplanation: 'Connected to live soil telemetry, Open-Meteo weather API, and ResNet50 pathology diagnostic layer.',
        recommendations: [
          'Ask about fertilizer N-P-K dosage for your field area.',
          'Inquire about disease treatment protocols or weather-aware irrigation schedules.'
        ],
        precautions: ['Always test soil pH before applying heavy synthetic fertilizers.'],
        confidence: 'Active (100%)',
        sources: ['Weather API', 'Soil Analysis', 'Prediction History', 'Groq AI'],
        nextSteps: ['Type your query or click a suggested prompt on the left.']
      })
    }
  ]);
  const [suggestedPrompts, setSuggestedPrompts] = useState(FALLBACK_QUESTIONS);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const chatEndRef = useRef(null);
  const userLocation = useRef(null);

  // Detect browser geolocation once on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          userLocation.current = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        },
        () => {
          // Permission denied or unavailable — location stays null, backend uses cascade
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    }
  }, []);

  const fetchChatHistory = useCallback(async () => {
    try {
      const res = await expansionApi.getChatHistory();
      if (res.data.data && res.data.data.length > 0) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error('[Chat History Error]', err);
    }
  }, []);

  const fetchSuggestedPrompts = useCallback(async () => {
    try {
      const res = await expansionApi.getSuggestedPrompts();
      if (res.data.data && res.data.data.length > 0) {
        setSuggestedPrompts(res.data.data);
      }
    } catch (err) {
      console.error('[Suggested Prompts Error]', err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
      if (mounted) {
        fetchChatHistory();
        fetchSuggestedPrompts();
      }
    }, 0);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [fetchChatHistory, fetchSuggestedPrompts]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || sending) return;

    const tempUserMsg = {
      _id: `temp-${messages.length}`,
      sender: 'user',
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempUserMsg]);
    if (!textToSend) setInput('');
    setSending(true);

    try {
      const res = await expansionApi.sendMessage(text, userLocation.current);
      setMessages(prev => [...prev, res.data.data]);
    } catch (err) {
      console.error('[Send Message Error]', err);
      notify.error('Failed to receive response from AI Assistant');
    } finally {
      setSending(false);
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await expansionApi.getFarmReportData();
      generateFarmReportPDF(res.data.data);
      notify.success('AI Farm Report PDF generated successfully!');
    } catch (err) {
      console.error('[Report Generation Error]', err);
      notify.error('Failed to generate AI Farm Report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const renderMessageContent = (msg) => {
    if (msg.sender === 'user') {
      return <span>{msg.text}</span>;
    }

    try {
      const structured = JSON.parse(msg.text);
      if (structured.summary) {
        return <AIResponseCard structuredData={structured} />;
      }
    } catch {
      // Fallback text rendering
    }

    return <span className="whitespace-pre-wrap">{msg.text}</span>;
  };

  return (
    <PageContainer>
      <PageHeader
        title="Enterprise AI Crop Specialist Copilot"
        subtitle="Context-aware AI advisor integrating soil telemetry, leaf pathology diagnostic models, weather forecasts, and persistent session memory."
        icon={FiMessageSquare}
        statusBadge="● Groq Copilot Engine Active"
        action={
          <button
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className="btn-primary px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 shadow-glow"
          >
            {generatingReport ? (
              <span className="animate-pulse">Generating Report...</span>
            ) : (
              <>
                <FiFileText className="w-4 h-4" />
                <span>Generate AI Farm Report</span>
                <FiDownload className="w-3.5 h-3.5 opacity-80" />
              </>
            )}
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[720px]">
        
        {/* Suggested Prompts Sidebar */}
        <div className="glass-card p-5 border-white/10 flex flex-col justify-between hidden lg:flex">
          <div>
            <div className="flex items-center gap-2 mb-4 text-xs font-mono font-bold text-gray-300 uppercase tracking-wider">
              <FiHelpCircle className="text-primary-400" /> Suggested Prompts
            </div>
            <div className="space-y-2.5">
              {suggestedPrompts.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="w-full text-left p-3 rounded-xl glass-card border-white/5 hover:border-primary-500/30 text-xs text-gray-300 hover:text-white transition-all font-mono"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 text-[11px] text-gray-400 font-mono space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Session Memory Active
            </div>
            <p className="text-[10px] text-gray-400">Contextually bound to soil & weather</p>
          </div>
        </div>

        {/* Chat Conversation Console */}
        <div className="lg:col-span-3 glass-card border-white/10 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-white/5 bg-surface-900/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
                <FiCpu className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-mono">Enterprise AI Agronomist Copilot</h4>
                <p className="text-[10px] text-emerald-400 font-mono">Groq Llama-3.3 Architecture Connected</p>
              </div>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar bg-surface-950/40">
            {messages.map((msg, idx) => (
              <div
                key={msg._id || `msg-${idx}`}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender !== 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 shrink-0 self-start mt-1">
                    <FiCpu className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl p-4 rounded-2xl text-xs font-mono leading-relaxed shadow-lg ${
                    msg.sender === 'user'
                      ? 'bg-primary-500 text-slate-950 font-semibold rounded-br-none'
                      : 'bg-surface-800/90 text-gray-200 border border-white/10 rounded-bl-none'
                  }`}
                >
                  {renderMessageContent(msg)}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-secondary-500/10 border border-secondary-500/20 flex items-center justify-center text-secondary-400 shrink-0 self-start mt-1">
                    <FiUser className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-4 border-t border-white/5 bg-surface-900/60 flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about fertilizer NPK, irrigation, disease treatment, or crop planning..."
              className="flex-1 bg-surface-800 border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono focus:border-primary-500 outline-none"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="btn-primary p-3 rounded-xl flex items-center justify-center disabled:opacity-50"
            >
              <FiSend className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </PageContainer>
  );
};

export default FarmerAssistantPage;
