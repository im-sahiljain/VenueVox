import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Mic, Phone, Settings, Activity, AlertCircle, CheckCircle2, Play, Square, Loader2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Vapi from '@vapi-ai/web';

interface TranscriptEntry {
  role: 'assistant' | 'user';
  text: string;
  timestamp: string;
}

export default function VoiceAITab({ user, orgId }: { user: any; orgId: string }) {
  const [assistant, setAssistant] = useState<any>(null);
  const [industries, setIndustries] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isDeprovisioning, setIsDeprovisioning] = useState(false);
  const [isConnectingCall, setIsConnectingCall] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);

  const vapiRef = useRef<Vapi | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize Vapi SDK
  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!publicKey || publicKey === 'your_vapi_public_key') {
      console.warn('⚠️ NEXT_PUBLIC_VAPI_PUBLIC_KEY not configured. Live calls will not work.');
      return;
    }

    const vapi = new Vapi(publicKey);
    vapiRef.current = vapi;

    vapi.on('call-start', () => {
      setIsCallActive(true);
      setIsConnectingCall(false);
      setTranscript([]);
      toast.success('Call connected! Speak into your microphone.');
    });

    vapi.on('call-end', () => {
      setIsCallActive(false);
      setIsSpeaking(false);
      setIsConnectingCall(false);
      toast.info('Call ended.');
      // Refresh call logs
      loadCalls();
    });

    vapi.on('speech-start', () => {
      setIsSpeaking(true);
    });

    vapi.on('speech-end', () => {
      setIsSpeaking(false);
    });

    vapi.on('message', (msg: any) => {
      if (msg.type === 'transcript' && msg.transcriptType === 'final') {
        setTranscript(prev => [
          ...prev,
          {
            role: msg.role as 'assistant' | 'user',
            text: msg.transcript,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    });

    vapi.on('error', (error: any) => {
      console.error('Vapi Error:', error);
      toast.error('Voice call error occurred.');
      setIsCallActive(false);
      setIsSpeaking(false);
      setIsConnectingCall(false);
    });

    return () => {
      vapi.stop();
    };
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  useEffect(() => {
    loadData();
  }, [orgId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [astRes, indRes, callsRes] = await Promise.all([
        api.voice.getAssistant(orgId),
        api.voice.getIndustries(),
        api.voice.getCalls(orgId)
      ]);
      if (astRes.success) setAssistant(astRes.data);
      if (indRes.success) {
        setIndustries(indRes.data);
        if (indRes.data.length > 0) setSelectedIndustry(indRes.data[0].key);
      }
      if (callsRes.success) setCalls(callsRes.data);
    } catch (e: any) {
      toast.error('Failed to load voice AI data');
    } finally {
      setLoading(false);
    }
  };

  const loadCalls = async () => {
    try {
      const callsRes = await api.voice.getCalls(orgId);
      if (callsRes.success) setCalls(callsRes.data);
    } catch (e) {
      // silent
    }
  };

  const handleProvision = async () => {
    if (!selectedIndustry) return;
    setIsProvisioning(true);
    try {
      const res = await api.voice.provisionAssistant(orgId, selectedIndustry);
      if (res.success) {
        toast.success('AI Receptionist provisioned successfully!');
        setAssistant(res.data);
      } else {
        toast.error(res.message || 'Failed to provision assistant');
      }
    } catch (e: any) {
      toast.error('Failed to provision assistant');
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleDeleteAssistant = async () => {
    if (!confirm('Are you sure you want to delete this AI Assistant? This will delete the assistant configuration and clear all call logs.')) {
      return;
    }
    setIsDeprovisioning(true);
    try {
      const res = await api.voice.deprovisionAssistant(orgId);
      if (res.success) {
        toast.success('AI Receptionist deleted successfully.');
        setAssistant(null);
      } else {
        toast.error(res.message || 'Failed to delete assistant.');
      }
    } catch (e: any) {
      toast.error('Failed to delete assistant.');
    } finally {
      setIsDeprovisioning(false);
    }
  };

  const toggleCall = useCallback(() => {
    if (!assistant?.vapiAssistantId) {
      toast.error('Assistant not fully provisioned yet.');
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!publicKey || publicKey === 'your_vapi_public_key') {
      toast.error('VAPI public key is not configured. Please set NEXT_PUBLIC_VAPI_PUBLIC_KEY in your environment.');
      return;
    }

    if (isCallActive) {
      vapiRef.current?.stop();
    } else {
      setTranscript([]);
      setIsConnectingCall(true);
      vapiRef.current?.start(assistant.vapiAssistantId);
    }
  }, [assistant, isCallActive]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-400 w-8 h-8" /></div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <Mic className="text-indigo-500 w-8 h-8" />
          AI Voice Receptionist
        </h1>
        <p className="text-slate-500 mt-1">
          Deploy an autonomous AI agent to answer calls, check slot availability, and handle bookings for your venues.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Status & Provisioning */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 dark:bg-slate-800 dark:border-slate-700 shadow-sm">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-slate-500" />
              Agent Configuration
            </h2>
            
            {!assistant ? (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 dark:bg-indigo-950/20 dark:border-indigo-900/50">
                <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-2">Initialize your Receptionist</h3>
                <p className="text-sm text-indigo-700/80 dark:text-indigo-400 mb-6">
                  Select your venue type below to provision a pre-trained AI agent that understands your industry's specific terminology and policies.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {industries.map(ind => (
                    <div 
                      key={ind.key}
                      onClick={() => setSelectedIndustry(ind.key)}
                      className={`cursor-pointer border rounded-xl p-4 transition-all ${selectedIndustry === ind.key ? 'border-indigo-500 bg-white ring-2 ring-indigo-200 dark:bg-slate-800 dark:ring-indigo-900' : 'border-slate-200 bg-white/50 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800/50'}`}
                    >
                      <div className="text-2xl mb-2">{ind.icon}</div>
                      <div className="font-semibold">{ind.label}</div>
                      <ul className="text-xs text-slate-500 mt-2 space-y-1">
                        {ind.capabilities.slice(0, 2).map((cap: string, i: number) => (
                          <li key={i} className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> {cap}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={handleProvision} 
                  disabled={isProvisioning || !selectedIndustry}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isProvisioning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Provisioning AI Engine...</> : 'Deploy AI Agent'}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 dark:bg-slate-800/50 dark:border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center dark:bg-indigo-900/50 dark:text-indigo-400">
                      <Mic className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold">{assistant.name}</h3>
                      <p className="text-sm text-slate-500 capitalize">{assistant.industry} Agent</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        {assistant.status === 'active' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${assistant.status === 'active' ? 'bg-emerald-500' : assistant.status === 'failed' ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
                      </span>
                      <span className="font-semibold capitalize">{assistant.status}</span>
                    </div>
                    {assistant.vapiAssistantId && <p className="text-xs text-slate-400 mt-1 font-mono">ID: {assistant.vapiAssistantId.slice(0, 8)}...</p>}
                  </div>
                </div>

                {assistant.status === 'failed' && assistant.errorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 flex items-start gap-2 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{assistant.errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-100 rounded-xl bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Knowledge Base</div>
                    <div className="text-sm font-medium flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Connected to Live Database</div>
                  </div>
                  <div className="p-4 border border-slate-100 rounded-xl bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Capabilities</div>
                    <div className="text-sm font-medium flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Slot Lookup + Booking</div>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  onClick={handleProvision}
                  disabled={isProvisioning}
                  className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                >
                  {isProvisioning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Syncing...</> : 'Sync Latest Calendar Data'}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleDeleteAssistant}
                  disabled={isDeprovisioning || isProvisioning}
                  className="w-full text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 font-bold mt-2 cursor-pointer h-11"
                >
                  {isDeprovisioning ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting Assistant...</>
                  ) : (
                    'Delete Assistant'
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Web Sandbox — Live Call */}
          {assistant && assistant.status === 'active' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Mic className="w-32 h-32" />
              </div>
              <h2 className="text-xl font-bold flex items-center gap-2 mb-2 relative z-10">
                <Phone className="w-5 h-5 text-indigo-400" />
                Live Sandbox Testing
              </h2>
              <p className="text-slate-400 text-sm mb-6 relative z-10">
                Test your AI receptionist right from your browser. Ask about availability or try booking a slot by voice.
              </p>
              
              <div className="flex flex-col items-center justify-center p-8 bg-slate-950 rounded-xl border border-slate-800 mb-4 relative z-10">
                {isCallActive ? (
                  <div className="flex flex-col items-center">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20"></div>
                      <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-colors ${isSpeaking ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
                        <Activity className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    <p className={`font-medium mb-1 animate-pulse ${isSpeaking ? 'text-emerald-300' : 'text-indigo-300'}`}>
                      {isSpeaking ? 'Agent Speaking...' : 'Listening...'}
                    </p>
                    <p className="text-xs text-slate-500">Ask about slot availability or make a booking!</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                      <Mic className="w-10 h-10 text-slate-500" />
                    </div>
                    <p className="text-slate-300 font-medium mb-1">Agent is Ready</p>
                    <p className="text-xs text-slate-500">Click to start conversation</p>
                  </div>
                )}
              </div>

              <div className="flex justify-center relative z-10 mb-4">
                <Button 
                  onClick={toggleCall}
                  disabled={isConnectingCall}
                  className={`px-8 py-6 rounded-full font-bold text-lg transition-all ${
                    isCallActive 
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-[0_0_20px_rgba(225,29,72,0.4)]' 
                      : isConnectingCall
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-[0_0_20px_rgba(217,119,6,0.4)]'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-[0_0_20px_rgba(5,150,105,0.4)]'
                  }`}
                >
                  {isCallActive ? (
                    <><Square className="w-5 h-5 mr-2 fill-current" /> End Call</>
                  ) : isConnectingCall ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Calling...</>
                  ) : (
                    <><Play className="w-5 h-5 mr-2 fill-current" /> Start Call</>
                  )}
                </Button>
              </div>

              {/* Live Transcript */}
              {transcript.length > 0 && (
                <div className="relative z-10 mt-4">
                  <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2 mb-3">
                    <MessageCircle className="w-4 h-4" />
                    Live Transcript
                  </h3>
                  <div className="max-h-64 overflow-y-auto bg-slate-950/50 rounded-lg p-4 space-y-3 border border-slate-800">
                    {transcript.map((entry, idx) => (
                      <div key={idx} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                          entry.role === 'user' 
                            ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-700/50' 
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          <div className="text-[10px] font-semibold uppercase tracking-wider mb-1 opacity-60">
                            {entry.role === 'user' ? '🎤 You' : '🤖 Agent'} · {entry.timestamp}
                          </div>
                          {entry.text}
                        </div>
                      </div>
                    ))}
                    <div ref={transcriptEndRef} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Call Logs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 dark:bg-slate-800 dark:border-slate-700 shadow-sm flex flex-col">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-slate-500" />
            Recent Calls
          </h2>
          
          {calls.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-slate-100 border-dashed dark:bg-slate-800/50 dark:border-slate-700">
              <Phone className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-slate-500 font-medium">No calls yet</p>
              <p className="text-xs text-slate-400 mt-1">Calls handled by your AI agent will appear here with transcripts.</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2">
              {calls.map((call: any, idx: number) => (
                <div key={idx} className="p-3 border border-slate-100 rounded-lg hover:border-indigo-200 transition-colors dark:border-slate-700 dark:hover:border-indigo-800">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold px-2 py-1 bg-slate-100 rounded-md dark:bg-slate-700">
                      {new Date(call.createdAt || call.startedAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs font-medium text-slate-500">{call.duration}s</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                    {call.summary || "No summary available"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
