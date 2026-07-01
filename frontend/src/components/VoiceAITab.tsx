import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Mic, Phone, Settings, Activity, AlertCircle, CheckCircle2, Play, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VoiceAITab({ user }: { user: any }) {
  const [assistant, setAssistant] = useState<any>(null);
  const [industries, setIndustries] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [isCallActive, setIsCallActive] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [astRes, indRes, callsRes] = await Promise.all([
        api.voice.getAssistant(user.id),
        api.voice.getIndustries(),
        api.voice.getCalls(user.id)
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

  const handleProvision = async () => {
    if (!selectedIndustry) return;
    setIsProvisioning(true);
    try {
      const res = await api.voice.provisionAssistant(user.id, selectedIndustry);
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

  // Very basic sandbox toggle since we don't have full Vapi Web SDK implemented in this snippet
  const toggleCall = () => {
    if (!assistant?.vapiAssistantId) {
      toast.error('Assistant not fully provisioned yet.');
      return;
    }
    
    // In a real implementation we would use @vapi-ai/web
    if (isCallActive) {
      setIsCallActive(false);
      toast.info('Call ended');
    } else {
      setIsCallActive(true);
      toast.success('Call started! Speak into your microphone.');
      // Simulate auto-end after 10s
      setTimeout(() => {
        setIsCallActive(false);
        toast.info('Sandbox call simulated completion.');
      }, 10000);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-400 w-8 h-8" /></div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <Mic className="text-indigo-500 w-8 h-8" />
          AI Voice Receptionist
        </h1>
        <p className="text-slate-500 mt-1">
          Deploy an autonomous AI agent to answer calls, handle basic inquiries, and check slot availability for your venues.
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
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${assistant.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      </span>
                      <span className="font-semibold capitalize">{assistant.status}</span>
                    </div>
                    {assistant.vapiAssistantId && <p className="text-xs text-slate-400 mt-1 font-mono">ID: {assistant.vapiAssistantId.slice(0, 8)}...</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-100 rounded-xl bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Knowledge Base</div>
                    <div className="text-sm font-medium flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Connected to StageHub Calendar</div>
                  </div>
                  <div className="p-4 border border-slate-100 rounded-xl bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Voice Profile</div>
                    <div className="text-sm font-medium">Elliot (Professional Female)</div>
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
              </div>
            )}
          </div>

          {/* Web Sandbox */}
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
                Test your AI receptionist right from your browser. It has real-time access to your currently listed calendar slots.
              </p>
              
              <div className="flex flex-col items-center justify-center p-8 bg-slate-950 rounded-xl border border-slate-800 mb-4 relative z-10">
                {isCallActive ? (
                  <div className="flex flex-col items-center">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20"></div>
                      <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.5)]">
                        <Activity className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    <p className="text-indigo-300 font-medium mb-1 animate-pulse">Listening & Processing...</p>
                    <p className="text-xs text-slate-500">Ask about slot availability!</p>
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

              <div className="flex justify-center relative z-10">
                <Button 
                  onClick={toggleCall}
                  className={`px-8 py-6 rounded-full font-bold text-lg transition-all ${isCallActive ? 'bg-rose-600 hover:bg-rose-700 shadow-[0_0_20px_rgba(225,29,72,0.4)]' : 'bg-emerald-600 hover:bg-emerald-700 shadow-[0_0_20px_rgba(5,150,105,0.4)]'}`}
                >
                  {isCallActive ? <><Square className="w-5 h-5 mr-2 fill-current" /> End Call</> : <><Play className="w-5 h-5 mr-2 fill-current" /> Start Call</>}
                </Button>
              </div>
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
                      {new Date(call.createdAt).toLocaleDateString()}
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
