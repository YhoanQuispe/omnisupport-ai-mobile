import React, { useState, useRef, useEffect } from 'react';
import { useSupportStore } from '../store/supportStore';
import { 
  Search, MessageSquare, ShieldCheck, Moon, Sun, 
  Send, Paperclip, FileUp, X, Sparkles, 
  ChevronRight, Phone, ArrowLeft, RefreshCw, AlertCircle, Info, Check, CheckCheck, Loader2, User, Play, LogOut, HelpCircle, CornerDownLeft,
  Menu, Terminal, Activity, ArrowRight, Sliders, Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { Ticket, SubscriptionTier } from '../types';

export default function MobileDevice() {
  const {
    crmProfile,
    tickets,
    kbArticles,
    activeSession,
    theme,
    activeScreen,
    searchQuery,
    isAiTyping,
    isTransferringToAgent,
    liveAgentQueuePosition,
    isUserAuthenticated,
    setTheme,
    setActiveScreen,
    setSearchQuery,
    initSupportSession,
    sendMessage,
    resetSession,
    resolveSession,
    setAuth,
    addTelemetryLog,
    clearTelemetryLogs,
    updateCrmProfile,
    debugPayloads,
    telemetryLogs
  } = useSupportStore();

  const [mobileActiveView, setMobileActiveView] = useState<'chat' | 'crm' | 'telemetry' | 'pii' | 'prompts'>('chat');
  
  const [mProfileName, setMProfileName] = useState(crmProfile?.name || '');
  const [mProfileCompany, setMProfileCompany] = useState(crmProfile?.companyName || '');
  const [mProfileTier, setMProfileTier] = useState<SubscriptionTier>(crmProfile?.subscriptionTier || 'ENTERPRISE_SLA');

  const [mLogService, setMLogService] = useState('KubernetesWorker');
  const [mLogMessage, setMLogMessage] = useState('Manual heartbeat check.');
  const [mLogLevel, setMLogLevel] = useState<'INFO' | 'WARN' | 'ERROR' | 'FATAL'>('INFO');

  useEffect(() => {
    if (crmProfile) {
      setMProfileName(crmProfile.name || '');
      setMProfileCompany(crmProfile.companyName || '');
      setMProfileTier(crmProfile.subscriptionTier || 'ENTERPRISE_SLA');
    }
  }, [crmProfile]);

  // Periodic simulated log stream in background
  useEffect(() => {
    const interval = setInterval(() => {
      const services = ['RedisEU-Node', 'PostgresReplication', 'CoreIngress', 'AuthRouter', 'PaymentGate'];
      const messages = [
        'Routine heartbeat cleared.',
        'Completed read-replica data validation packet sync.',
        'Connection pool capacity at 23%. Normal status.',
        'Ingress request latency: 42ms.',
        'Token verification resolved in cache pool.'
      ];
      const randomIdx = Math.floor(Math.random() * services.length);
      
      addTelemetryLog({
        level: 'INFO',
        service: services[randomIdx],
        message: messages[randomIdx]
      });
    }, 7000);

    return () => clearInterval(interval);
  }, [addTelemetryLog]);


  const handleMProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateCrmProfile({
      name: mProfileName,
      companyName: mProfileCompany,
      subscriptionTier: mProfileTier,
      SLA_ResponseTimeMins: mProfileTier === 'ENTERPRISE_SLA' ? 15 : mProfileTier === 'BUSINESS_DELUXE' ? 60 : 1440
    });
  };

  const handleMLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTelemetryLog({
      level: mLogLevel,
      service: mLogService,
      message: mLogMessage,
      code: mLogLevel === 'ERROR' || mLogLevel === 'FATAL' ? 'SYS_MANUAL_TRIG_01' : undefined
    });
    setMLogMessage('');
  };

  const mInjectFatalCpuCrash = () => {
    addTelemetryLog({
      level: 'ERROR',
      service: 'RedisEU-Node',
      message: 'CRITICAL: Redis volatile shard memory exhausted (100% capacity). Out-of-memory thread segmentation crash.',
      code: 'ERR_OOM_SHARD_CRITICAL'
    });
    addTelemetryLog({
      level: 'FATAL',
      service: 'RedisEU-Subsystem',
      message: 'FATAL UNRECOVERABLE: Primary European Redis Cache Node is OFFLINE.',
      code: 'SYS_ERR_FATAL_STACK'
    });
    if (crmProfile) {
      const updatedDeps = crmProfile.activeDeployments.map(d => 
        d.id === 'DEP-EU-1' ? { ...d, status: 'CRITICAL' as const } : d
      );
      updateCrmProfile({ activeDeployments: updatedDeps });
    }
  };

  const mInjectDatabaseDelay = () => {
    addTelemetryLog({
      level: 'WARN',
      service: 'PostgresReplication',
      message: 'Database lag spike. Master database replication buffer full. Transaction log lock-wait delay: 14,000ms.'
    });
    if (crmProfile) {
      const updatedDeps = crmProfile.activeDeployments.map(d => 
        d.id === 'DEP-WEST-2' ? { ...d, status: 'CRITICAL' as const } : d
      );
      updateCrmProfile({ activeDeployments: updatedDeps });
    }
  };

  const [messageText, setMessageText] = useState('');
  const [selectedKbArticleId, setSelectedKbArticleId] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<Array<{ name: string; type: string; size: string; dataUrl: string }>>([]);
  const [showAttachmentDropdown, setShowAttachmentDropdown] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll chat to bottom on new messages
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeSession?.messages, isAiTyping]);

  // Current system clock
  const [timeStr, setTimeStr] = useState('14:11');
  useEffect(() => {
    const d = new Date();
    const hrs = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    setTimeStr(`${hrs}:${mins}`);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && attachedFiles.length === 0) return;
    sendMessage(messageText, attachedFiles);
    setMessageText('');
    setAttachedFiles([]);
    setShowAttachmentDropdown(false);
  };

  // Simulates choosing standard preset diagnostic screenshots to simplify testing multimodal API uploads
  const injectAttachmentPreset = (type: 'k8s' | 'invoice' | 'blank') => {
    let name = "k8s_dump.png";
    let size = "182 KB";
    let dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="; // Mock base64 image 1x1

    if (type === 'k8s') {
      name = "oom_stack_dump.png";
      size = "240 KB";
      dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    } else if (type === 'invoice') {
      name = "payment_rejection_invoice_99890.png";
      size = "115 KB";
      dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    }

    setAttachedFiles(prev => [...prev, { name, type: "image/png", size, dataUrl }]);
    setShowAttachmentDropdown(false);
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFiles(prev => [...prev, {
        name: file.name,
        type: file.type,
        size: `${Math.round(file.size / 1024)} KB`,
        dataUrl: reader.result as string
      }]);
    };
    reader.readAsDataURL(file);
    setShowAttachmentDropdown(false);
  };

  const removeAttachedFile = (idx: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // KB Filter rules based on keyboard search index matching
  const filteredKb = kbArticles.filter(art => 
    art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    art.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderCrmView = () => {
    return (
      <div className={`flex-1 flex flex-col overflow-hidden font-sans ${theme === 'dark' ? 'bg-[#030616] text-slate-100' : 'bg-white text-slate-900'}`}>
         <div className={`px-4 py-3 border-b flex items-center justify-between shrink-0 ${theme === 'dark' ? 'bg-[#090d2a] border-slate-800/85' : 'bg-slate-50 border-slate-200'}`}>
           <button
             onClick={() => setMobileActiveView('chat')}
             className="text-xs text-purple-500 hover:text-purple-600 flex items-center gap-1.5 font-bold cursor-pointer"
           >
             <ArrowLeft className="w-4 h-4" />
             <span>Back to Support Chat</span>
           </button>
           <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold border ${
             theme === 'dark' 
               ? 'bg-purple-900/40 text-purple-300 border-purple-500/20' 
               : 'bg-purple-50 text-purple-700 border-purple-200'
           }`}>Mock CRM</span>
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-4">
           <div>
             <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>CRM Tenant Context</h4>
             <p className={`text-[11px] leading-normal ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
               Mute or modify active tenant client profiles to test SLA rules.
             </p>
           </div>

           <form onSubmit={handleMProfileUpdate} className={`space-y-3 p-3.5 rounded-2xl border ${theme === 'dark' ? 'bg-[#050c26] border-slate-800/80' : 'bg-slate-50 border-slate-200 shadow-xs'}`}>
             <div>
               <label className={`block text-[10px] font-mono uppercase font-bold mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Contact Name</label>
               <input 
                 type="text" 
                 value={mProfileName}
                 onChange={(e) => setMProfileName(e.target.value)}
                 className={`w-full rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-purple-500 border ${
                   theme === 'dark' 
                     ? 'bg-[#0c1033] border-slate-800 text-slate-100' 
                     : 'bg-white border-slate-300 text-slate-900'
                 }`} 
               />
             </div>
             
             <div>
               <label className={`block text-[10px] font-mono uppercase font-bold mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Organization</label>
               <input 
                 type="text" 
                 value={mProfileCompany}
                 onChange={(e) => setMProfileCompany(e.target.value)}
                 className={`w-full rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-purple-500 border ${
                   theme === 'dark' 
                     ? 'bg-[#0c1033] border-slate-800 text-slate-100' 
                     : 'bg-white border-slate-300 text-slate-900'
                 }`} 
               />
             </div>

             <div>
               <label className={`block text-[10px] font-mono uppercase font-bold mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Contract SLA Tier</label>
               <div className="grid grid-cols-1 gap-1.5 mt-1">
                 {(['ENTERPRISE_SLA', 'BUSINESS_DELUXE', 'STANDARD_FREE'] as SubscriptionTier[]).map((tier) => (
                   <button
                     key={tier}
                     type="button"
                     onClick={() => setMProfileTier(tier)}
                     className={`p-2 rounded-xl border text-left transition text-xs leading-none flex justify-between items-center ${
                       mProfileTier === tier 
                         ? theme === 'dark'
                           ? 'bg-purple-950/40 border-purple-500 text-purple-200 font-bold' 
                           : 'bg-purple-50 border-purple-500 text-purple-900 font-bold'
                         : theme === 'dark'
                           ? 'bg-[#0a0f30] border-slate-800 text-slate-300' 
                           : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                     }`}
                   >
                     <div>
                       <div className={`font-bold text-[11px] ${
                         mProfileTier === tier
                           ? theme === 'dark' ? 'text-purple-200' : 'text-purple-900'
                           : theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                       }`}>{tier.replace('_', ' ')}</div>
                       <div className={`text-[9px] mt-1 ${
                         mProfileTier === tier 
                           ? theme === 'dark' ? 'text-purple-300' : 'text-purple-700'
                           : theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                       }`}>
                         {tier === 'ENTERPRISE_SLA' && '15 Min Target • VIP Priority'}
                         {tier === 'BUSINESS_DELUXE' && '1 Hour Target • Dedicated'}
                         {tier === 'STANDARD_FREE' && '24 Hour Target • Standard'}
                       </div>
                     </div>
                     {mProfileTier === tier && <Check className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />}
                   </button>
                 ))}
               </div>
             </div>

             <button 
               type="submit"
               className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2 rounded-xl transition flex items-center justify-center gap-1.5 mt-1 cursor-pointer"
             >
               <RefreshCw className="w-3.5 h-3.5" />
               Update CRM Profile
             </button>
           </form>

           <div className="space-y-2">
             <h4 className={`text-[10px] font-bold uppercase tracking-wider font-mono ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
               Active Cloud Ingress Deployments
             </h4>
             <div className="space-y-1.5">
               {crmProfile?.activeDeployments.map((dep) => (
                 <div key={dep.id} className={`p-3 rounded-xl flex items-center justify-between text-xs border ${
                   theme === 'dark' 
                     ? 'bg-[#080c2f]/60 border-slate-800/80 text-slate-100' 
                     : 'bg-slate-50 border-slate-200 text-slate-900 shadow-2xs'
                 }`}>
                   <div>
                     <span className={`font-bold block text-[11px] ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{dep.name}</span>
                     <span className={`text-[9px] font-mono ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{dep.region} • {dep.version}</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                     <span className={`w-2 h-2 rounded-full ${
                       dep.status === 'HEALTHY' ? 'bg-emerald-500 animate-pulse' :
                       dep.status === 'WARNING' ? 'bg-amber-500' : 'bg-rose-500 animate-bounce'
                     }`} />
                     <span className={`text-[10px] font-bold font-mono ${
                       dep.status === 'HEALTHY' ? 'text-emerald-500' :
                       dep.status === 'WARNING' ? 'text-amber-500' : 'text-rose-500'
                     }`}>{dep.status}</span>
                   </div>
                 </div>
               ))}
             </div>
           </div>
         </div>
      </div>
    );
  };

  const renderTelemetryView = () => {
    return (
      <div className={`flex-1 flex flex-col overflow-hidden font-sans ${theme === 'dark' ? 'bg-[#030616] text-slate-100' : 'bg-white text-slate-900'}`}>
         <div className={`px-4 py-3 border-b flex items-center justify-between shrink-0 ${theme === 'dark' ? 'bg-[#090d2a] border-slate-800/85' : 'bg-slate-50 border-slate-200'}`}>
           <button
             onClick={() => setMobileActiveView('chat')}
             className="text-xs text-cyan-500 hover:text-cyan-600 flex items-center gap-1.5 font-bold cursor-pointer"
           >
             <ArrowLeft className="w-4 h-4" />
             <span>Back to Support Chat</span>
           </button>
           <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold border ${
             theme === 'dark' 
               ? 'bg-cyan-950/40 text-cyan-300 border-cyan-500/20' 
               : 'bg-cyan-50 text-cyan-700 border-cyan-200'
           }`}>Live Telemetry</span>
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-4">
           <div>
             <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Disaster Injection station</h4>
             <p className={`text-[11px] leading-normal ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
               Force outages in our cloud cluster to let the AI agent diagnose them.
             </p>
           </div>

           <div className="grid grid-cols-2 gap-2">
             <button
               onClick={mInjectFatalCpuCrash}
               className={`p-2.5 rounded-xl text-left text-[11px] border cursor-pointer ${
                 theme === 'dark'
                   ? 'bg-rose-950/20 border-rose-500/20 hover:border-rose-500 hover:bg-rose-950/30 text-rose-300'
                   : 'bg-rose-50 border-rose-200 hover:border-rose-400 hover:bg-rose-100 text-rose-900'
               }`}
             >
               <span className={`font-bold text-[10px] flex items-center gap-1 ${theme === 'dark' ? 'text-rose-300' : 'text-rose-700'}`}>
                 <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                 Trace Redis OOM
               </span>
               <p className={`text-[9px] mt-1 font-sans ${theme === 'dark' ? 'text-slate-400' : 'text-rose-600'}`}>Sets European cache sub-node offline</p>
             </button>

             <button
               onClick={mInjectDatabaseDelay}
               className={`p-2.5 rounded-xl text-left text-[11px] border cursor-pointer ${
                 theme === 'dark'
                   ? 'bg-amber-950/20 border-amber-500/20 hover:border-amber-505 hover:bg-amber-950/30 text-amber-300'
                   : 'bg-amber-50 border-amber-200 hover:border-amber-400 hover:bg-amber-100 text-amber-900'
               }`}
             >
               <span className={`font-bold text-[10px] flex items-center gap-1 ${theme === 'dark' ? 'text-amber-305' : 'text-amber-700'}`}>
                 <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                 Trace Replication
               </span>
               <p className={`text-[9px] mt-1 font-sans ${theme === 'dark' ? 'text-slate-400' : 'text-amber-600'}`}>Spikes master node latency delta</p>
             </button>
           </div>

           <form onSubmit={handleMLogSubmit} className={`space-y-2 p-3 rounded-xl border ${theme === 'dark' ? 'bg-[#050c26] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
             <span className={`text-[10px] uppercase font-bold font-mono tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Custom Log Injector</span>
             <div className="grid grid-cols-2 gap-1.5">
               <input 
                 type="text" 
                 placeholder="Worker service"
                 value={mLogService}
                 onChange={(e) => setMLogService(e.target.value)}
                 className={`border rounded-lg p-1.5 text-xs focus:outline-none ${
                   theme === 'dark' 
                     ? 'bg-[#0c1033] border-slate-800 text-slate-100' 
                     : 'bg-white border-slate-300 text-slate-900'
                 }`}
               />
               <select
                 value={mLogLevel}
                 onChange={(e: any) => setMLogLevel(e.target.value)}
                 className={`border rounded-lg p-1.5 text-xs focus:outline-none ${
                   theme === 'dark' 
                     ? 'bg-[#0c1033] border-slate-800 text-slate-100' 
                     : 'bg-white border-slate-300 text-slate-900'
                 }`}
               >
                 <option value="INFO">INFO</option>
                 <option value="WARN">WARN</option>
                 <option value="ERROR">ERROR</option>
                 <option value="FATAL">FATAL</option>
               </select>
             </div>
             <div className="flex gap-2">
               <input 
                 type="text" 
                 placeholder="Heartbeat check..."
                 value={mLogMessage}
                 onChange={(e) => setMLogMessage(e.target.value)}
                 className={`flex-1 border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none ${
                   theme === 'dark' 
                     ? 'bg-[#0c1033] border-slate-800 text-slate-100' 
                     : 'bg-white border-slate-300 text-slate-900'
                 }`}
               />
               <button type="submit" className="p-1.5 bg-cyan-700 rounded-lg hover:bg-cyan-600 cursor-pointer text-white shrink-0 flex items-center justify-center">
                 <Check className="w-4 h-4 text-white" />
               </button>
             </div>
           </form>

           <div className="space-y-1.5">
             <div className="flex justify-between items-center">
               <span className={`text-[10px] uppercase font-bold font-mono tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>Live Log Console Stream</span>
               <button 
                 onClick={clearTelemetryLogs} 
                 className={`text-[10px] font-bold ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
               >
                 Clear
               </button>
             </div>

             <div className="bg-slate-900 border border-slate-950 p-3 rounded-xl max-h-[180px] overflow-y-auto space-y-1.5 font-mono text-[9px] text-slate-300">
               {telemetryLogs.length === 0 ? (
                 <div className="text-slate-500 italic text-center text-[10px] py-4">Logs stream clean. No incidents.</div>
               ) : (
                 telemetryLogs.map((log, i) => (
                   <div key={i} className="border-b border-white/5 pb-1">
                     <div className="flex justify-between text-[8px] text-slate-500 mb-0.5">
                       <span>{log.timestamp} • {log.service}</span>
                       <span className={`px-1 py-0.2 rounded font-bold ${
                         log.level === 'INFO' ? 'text-slate-300' :
                         log.level === 'WARN' ? 'text-amber-400 bg-amber-500/10' :
                         'text-rose-400 bg-rose-500/10 font-bold animate-pulse'
                       }`}>{log.level}</span>
                     </div>
                     <p className="text-slate-300 leading-normal break-words font-sans">{log.message}</p>
                   </div>
                 ))
               )}
             </div>
           </div>
         </div>
      </div>
    );
  };

  const renderPiiView = () => {
    return (
      <div className={`flex-1 flex flex-col overflow-hidden font-sans ${theme === 'dark' ? 'bg-[#030616] text-slate-100' : 'bg-white text-slate-900'}`}>
         <div className={`px-4 py-3 border-b flex items-center justify-between shrink-0 ${theme === 'dark' ? 'bg-[#090d2a] border-slate-800/85' : 'bg-slate-50 border-slate-200'}`}>
           <button
             onClick={() => setMobileActiveView('chat')}
             className="text-xs text-amber-500 hover:text-amber-600 flex items-center gap-1.5 font-bold cursor-pointer"
           >
             <ArrowLeft className="w-4 h-4" />
             <span>Back to Support Chat</span>
           </button>
           <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold border ${
             theme === 'dark' 
               ? 'bg-amber-950/40 text-amber-300 border-amber-500/20' 
               : 'bg-amber-50 text-amber-700 border-amber-200'
           }`}>PII Sandbox</span>
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-4">
           <div>
             <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>PII Masking & Request capture</h4>
             <p className={`text-[11px] leading-normal ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
               Trace variables redacted on-the-fly inside the client model request.
             </p>
           </div>

           {debugPayloads.length === 0 ? (
             <div className={`text-center py-10 border border-dashed rounded-xl ${theme === 'dark' ? 'border-slate-800 bg-slate-900/10' : 'border-slate-300 bg-slate-50/50'}`}>
               <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
               <p className={`text-[10px] font-sans ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>No API requests recorded yet. Start chat queries to view live logs.</p>
             </div>
           ) : (
             <div className="space-y-4">
               <div className={`space-y-2 p-3 rounded-2xl border ${theme === 'dark' ? 'bg-[#050c26] border-slate-800/80' : 'bg-slate-50 border-slate-200 shadow-xs'}`}>
                 <div className={`flex justify-between items-center border-b pb-1.5 ${theme === 'dark' ? 'border-slate-800/40' : 'border-slate-200'}`}>
                   <span className="text-[10px] font-mono font-bold text-amber-500 flex items-center gap-1">
                     <ShieldCheck className="w-3.5 h-3.5" /> Captured Trace Link
                   </span>
                   <span className={`text-[8px] font-mono ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{debugPayloads[0].timestamp}</span>
                 </div>

                 <div className="space-y-2 text-[10px] font-mono">
                   <div>
                     <span className={`text-[9px] uppercase font-bold font-sans ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>Raw Prompt (Pre-Masking)</span>
                     <div className={`p-2 rounded-lg text-xs break-all select-text mt-0.5 border ${
                       theme === 'dark' 
                         ? 'bg-rose-950/20 border-rose-900/20 text-rose-300' 
                         : 'bg-rose-50 border-rose-100 text-rose-900'
                     }`}>
                       {debugPayloads[0].preMaskedText}
                     </div>
                   </div>

                   <div>
                     <span className={`text-[9px] uppercase font-bold font-sans ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>Redacted Output (Safe for LLM)</span>
                     <div className={`p-2 rounded-lg text-xs font-bold break-all select-text mt-0.5 border ${
                       theme === 'dark' 
                         ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-300' 
                         : 'bg-emerald-50 border-emerald-200 text-emerald-850'
                     }`}>
                       {debugPayloads[0].postMaskedText}
                     </div>
                   </div>
                 </div>
               </div>

               <div className="space-y-1.5">
                 <span className={`text-[10px] uppercase font-bold font-mono tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Masked Entities</span>
                 {debugPayloads[0].piiDetected.length === 0 ? (
                   <div className={`text-[9px] p-2 rounded-xl leading-relaxed border ${
                     theme === 'dark' 
                       ? 'bg-emerald-950/10 border-emerald-950/30 text-emerald-405' 
                       : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                   }`}>
                     Zero customer credentials or trace tokens redacted in prompt text.
                   </div>
                 ) : (
                   <div className="space-y-1.5">
                     {debugPayloads[0].piiDetected.map((item, idx) => (
                       <div key={idx} className={`p-2 rounded-xl flex items-center justify-between text-[11px] font-mono leading-none border ${
                         theme === 'dark' 
                           ? 'bg-[#080c2f] border-slate-800/80 text-slate-100' 
                           : 'bg-slate-50 border-slate-200 text-slate-900 shadow-2xs'
                       }`}>
                         <div className="flex items-center gap-1.5 min-w-[35%]">
                           <span className="px-1 py-0.2 rounded text-[7px] font-bold uppercase bg-amber-500 text-slate-950">{item.type}</span>
                           <span className={`font-bold truncate max-w-[80px] ${theme === 'dark' ? 'text-rose-450' : 'text-rose-700'}`}>"{item.original}"</span>
                         </div>
                         <ArrowRight className="w-3 h-3 text-slate-500 shrink-0 mx-1" />
                         <span className={`font-bold truncate max-w-[100px] text-right ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}`}>"{item.replacement}"</span>
                       </div>
                     ))}
                   </div>
                 )}
               </div>

               <div className="space-y-1.5">
                 <span className={`text-[10px] uppercase font-bold font-mono tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Raw JSON Output</span>
                 <pre className="bg-slate-900 border border-slate-950 p-2.5 rounded-xl text-slate-200 text-[8px] overflow-x-auto whitespace-pre max-h-[140px] select-text">
                   {JSON.stringify(debugPayloads[0].rawResponseReceived, null, 2)}
                 </pre>
               </div>
             </div>
           )}
         </div>
      </div>
    );
  };

  const renderPromptsView = () => {
    return (
      <div className={`flex-1 flex flex-col overflow-hidden font-sans ${theme === 'dark' ? 'bg-[#030616] text-slate-100' : 'bg-white text-slate-900'}`}>
         <div className={`px-4 py-3 border-b flex items-center justify-between shrink-0 ${theme === 'dark' ? 'bg-[#090d2a] border-slate-800/85' : 'bg-slate-50 border-slate-200'}`}>
           <button
             onClick={() => setMobileActiveView('chat')}
             className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1.5 font-bold cursor-pointer"
           >
             <ArrowLeft className="w-4 h-4" />
             <span>Back to Support Chat</span>
           </button>
           <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold border ${
             theme === 'dark' 
               ? 'bg-indigo-950/40 text-indigo-300 border-indigo-500/20' 
               : 'bg-indigo-50 text-indigo-700 border-indigo-200'
           }`}>Prompt Engine</span>
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans">
           <div>
             <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Structured Prompt Rules</h4>
             <p className={`text-[11px] font-sans ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
               The underlying system prompts delivered to the server-side model.
             </p>
           </div>

           <div className="space-y-3">
             <div className={`p-3 rounded-xl space-y-2 border ${
               theme === 'dark' 
                 ? 'bg-[#050c26] border-slate-800' 
                 : 'bg-slate-50 border-slate-200 shadow-3xs'
             }`}>
               <span className={`text-[10px] font-bold uppercase tracking-widest font-mono flex items-center gap-1 p-1.5 rounded border ${
                 theme === 'dark'
                   ? 'bg-indigo-950/30 border-indigo-500/10 text-indigo-400'
                   : 'bg-indigo-50 border-indigo-100 text-indigo-700'
               }`}>
                 <Sparkles className="w-3.5 h-3.5" /> Brand Identity Rules
               </span>
               <p className={`text-[10px] leading-relaxed font-sans mt-0.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                 "You are 'OmniSupport LLM': elite enterprise-grade, warm, and highly professional. Never expose technical jargon such as: Redis, OOM, Shard, Kubernetes, Database."
               </p>
             </div>

             <div className={`p-3 rounded-xl space-y-2 border ${
               theme === 'dark' 
                 ? 'bg-[#050c26] border-slate-800' 
                 : 'bg-slate-50 border-slate-200 shadow-3xs'
             }`}>
               <span className={`text-[10px] font-bold uppercase tracking-widest font-mono flex items-center gap-1 p-1.5 rounded border ${
                 theme === 'dark'
                   ? 'bg-indigo-950/30 border-indigo-500/10 text-indigo-400'
                   : 'bg-indigo-50 border-indigo-100 text-indigo-700'
               }`}>
                 <Sliders className="w-3.5 h-3.5" /> Structured Output Schema
               </span>
               <pre className="bg-[#020412] p-2 rounded-lg text-slate-300 text-[8px] leading-relaxed overflow-x-auto select-text font-mono">
 {`responseSchema: {
   type: Type.OBJECT,
   properties: {
     replyText: { type: Type.STRING },
     suggestedCategory: { type: Type.STRING },
     userSentiment: { type: Type.STRING },
     escalationRequired: { type: Type.BOOLEAN },
     reasonForEscalation: { type: Type.STRING }
   }
 }`}
               </pre>
             </div>
           </div>
         </div>
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-[395px] h-[780px] rounded-[52px] border-[12px] border-slate-900 bg-slate-950 shadow-2xl flex flex-col overflow-hidden ring-1 ring-slate-800/80">
      
      {/* 1. Device Notch & Status bar */}
      <div className="absolute top-0 inset-x-0 h-10 bg-black/90 flex justify-between items-center px-8 z-50 text-[11px] font-mono select-none pointer-events-none">
        <span className="text-white font-semibold font-sans">{timeStr}</span>
        {/* Apple Dynamic Island or Camera Notch */}
        <div className="w-24 h-4 rounded-full bg-black shrink-0 relative mt-1.5 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-[#050505] absolute right-4 shrink-0" />
        </div>
        {/* Signal Indicators */}
        <div className="flex items-center gap-1.5 text-white">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 3c-1.2 0-2.4.2-3.6.7L12 12l3.6-8.3c-1.2-.5-2.4-.7-3.6-.7zM4.5 7.5L12 21l7.5-13.5C17.3 6.3 14.7 5.5 12 5.5s-5.3.8-7.5 2z" />
          </svg>
          <span className="font-bold tracking-tighter">5G</span>
          <div className="w-5 h-2.5 rounded-sm border border-white/60 p-[1px] flex items-center">
            <div className="bg-emerald-400 h-full w-[85%] rounded-[1px]" />
          </div>
        </div>
      </div>

      {/* 2. Authentication Shield wrapper */}
      {!isUserAuthenticated ? (
        <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-6 text-center z-40">
          <div className="w-16 h-16 rounded-3xl bg-purple-900/30 border border-purple-500/20 flex items-center justify-center mb-4 text-purple-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 font-sans">Firebase ID Gateway</h2>
          <p className="text-xs text-slate-400 mt-2 max-w-[260px]">
            Please complete simulated secure OAuth / Google Sign-In authentication session to unlock active cloud support telemetry.
          </p>
          <button
            onClick={() => setAuth(true)}
            className="mt-6 w-full max-w-[240px] bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-3 px-6 rounded-2xl transition shadow-lg tracking-wider"
          >
            Google Sign-In (Firebase Sandbox)
          </button>
        </div>
      ) : (

        // Inner Smartphone Screen App Wrapper (Light/Dark transitions!)
        <div className={`flex-1 flex flex-col pt-10 font-sans relative transition-colors duration-300 ${
          theme === 'dark' ? 'bg-[#030616] text-slate-100' : 'bg-slate-50 text-slate-900'
        }`}>

          {/* Collapsible Mobile Sidebar Drawer (inside phone screen boundaries) */}
          <AnimatePresence>
            {isMobileSidebarOpen && (
              <>
                {/* Backdrop overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="absolute inset-0 z-50 bg-black/65 backdrop-blur-xs rounded-[40px]"
                />
                
                {/* Sliding Menu drawer */}
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className={`absolute top-0 left-0 bottom-0 w-[280px] z-50 border-r flex flex-col shadow-2xl ${
                    theme === 'dark' 
                      ? 'bg-[#040924] border-slate-800/80 text-slate-100' 
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div className={`flex items-center justify-between px-4 py-3.5 border-b ${
                    theme === 'dark' ? 'bg-[#020516] border-slate-800/60' : 'bg-slate-100 border-slate-200/60'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                      <span className="font-bold text-xs uppercase tracking-wide">Control Centre</span>
                    </div>
                    <button
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        theme === 'dark' ? 'hover:bg-slate-900 text-slate-300' : 'hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
                    <p className="px-2 text-[9px] font-mono font-bold uppercase tracking-wider mb-2 text-slate-400">Workspace Control</p>
                    
                    <button
                      onClick={() => {
                        setMobileActiveView('chat');
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full px-3 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-2.5 transition cursor-pointer text-left ${
                        mobileActiveView === 'chat' 
                          ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/20 font-bold' 
                          : theme === 'dark'
                            ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/30'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <span>Support Chat / Hub</span>
                    </button>

                    <button
                      onClick={() => {
                        setMobileActiveView('crm');
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full px-3 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-2.5 transition cursor-pointer text-left ${
                        mobileActiveView === 'crm' 
                          ? 'bg-purple-900/30 text-purple-300 border border-purple-500/20 font-bold' 
                          : theme === 'dark'
                            ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/30'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <User className="w-4 h-4 text-purple-400" />
                      <span>Mock CRM</span>
                    </button>

                    <button
                      onClick={() => {
                        setMobileActiveView('telemetry');
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full px-3 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-2.5 transition cursor-pointer text-left ${
                        mobileActiveView === 'telemetry' 
                          ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-500/20 font-bold' 
                          : theme === 'dark'
                            ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/30'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Activity className="w-4 h-4 text-cyan-400" />
                      <span>Telemetry Log</span>
                    </button>

                    <button
                      onClick={() => {
                        setMobileActiveView('pii');
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full px-3 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-2.5 transition cursor-pointer text-left ${
                        mobileActiveView === 'pii' 
                          ? 'bg-amber-950/30 text-amber-300 border border-amber-500/20 font-bold' 
                          : theme === 'dark'
                            ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/30'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-500" />
                      <span>Masking & Payloads</span>
                    </button>

                    <button
                      onClick={() => {
                        setMobileActiveView('prompts');
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full px-3 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-2.5 transition cursor-pointer text-left ${
                        mobileActiveView === 'prompts' 
                          ? 'bg-indigo-950/30 text-indigo-300 border border-indigo-500/20 font-bold' 
                          : theme === 'dark'
                            ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/30'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Terminal className="w-4 h-4 text-indigo-400" />
                      <span>Prompt Engine</span>
                    </button>
                  </div>

                  <div className={`p-4 border-t ${
                    theme === 'dark' ? 'bg-[#020516] border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="p-2.5 bg-[#03112b] border border-cyan-500/10 rounded-xl text-[10px] font-mono text-cyan-400 flex flex-col gap-1 leading-relaxed">
                      <div className="flex items-center gap-1 font-bold uppercase tracking-wider text-[9px]">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Security Hub</span>
                      </div>
                      <p className="text-slate-400 text-[9px]">
                        Syncs control modules inside your AI workspace dynamically.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* APP HEADER */}
          <header className={`px-4 py-3 border-b shrink-0 flex items-center justify-between ${
            theme === 'dark' ? 'bg-[#050b24] border-slate-900' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  theme === 'dark' ? 'hover:bg-slate-900 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
                }`}
                aria-label="Toggle Navigation Side Menu"
              >
                <Menu className="w-4.5 h-4.5" />
              </button>

              {activeScreen !== 'dashboard' ? (
                <button 
                  onClick={() => {
                    if (selectedKbArticleId) {
                      setSelectedKbArticleId(null);
                    } else {
                      resetSession();
                    }
                  }}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    theme === 'dark' ? 'hover:bg-slate-900 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              ) : null}
              
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-purple-400 tracking-widest leading-none">Support HQ</span>
                <h3 className="text-sm font-bold font-sans flex items-center gap-1">
                  OmniSupport AI
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                </h3>
              </div>
            </div>

            {/* Header Right toggles */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle Theme"
                className={`p-1.5 rounded-xl transition ${
                  theme === 'dark' ? 'text-slate-300 hover:bg-slate-900' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-600" />}
              </button>

              <button 
                onClick={() => setAuth(false)}
                title="Google LogOut" 
                className={`p-1.5 rounded-xl transition-colors ${
                  theme === 'dark' ? 'text-slate-400 hover:bg-slate-900' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <LogOut className="w-4 h-4 text-rose-500" />
              </button>
            </div>
          </header>

          {/* SCREEN COMPONENT ROUTER */}
          <div className="flex-1 overflow-hidden relative flex flex-col">
            
            {mobileActiveView === 'crm' && renderCrmView()}
            {mobileActiveView === 'telemetry' && renderTelemetryView()}
            {mobileActiveView === 'pii' && renderPiiView()}
            {mobileActiveView === 'prompts' && renderPromptsView()}

            {mobileActiveView === 'chat' && (
              <>
                {/* SCREEN 1: CLIENT HOME DASHBOARD */}
                {activeScreen === 'dashboard' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                
                {/* 1. SLA Tenant Priority Status Card */}
                <div className={`p-4 rounded-2xl border text-xs relative overflow-hidden shadow-sm ${
                  theme === 'dark' 
                    ? 'bg-purple-950/20 border-purple-900/40 text-purple-100' 
                    : 'bg-purple-50 border-purple-100 text-purple-900'
                }`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl translate-x-4 -translate-y-4" />
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                    <span className="font-bold tracking-wide text-[10px] uppercase">VIP Active Agreement</span>
                  </div>
                  <h4 className="text-base font-bold tracking-tight">{crmProfile?.companyName}</h4>
                  <div className={`mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono leading-relaxed p-2.5 rounded-xl border ${
                    theme === 'dark' 
                      ? 'bg-black/20 border-white/5' 
                      : 'bg-white/60 border-purple-200/50'
                  }`}>
                    <div>
                      <span className={`block text-[10px] font-sans ${theme === 'dark' ? 'text-slate-400' : 'text-purple-700/80'}`}>Tier Level</span>
                      <strong className="text-purple-600 dark:text-purple-400 font-sans text-xs">{crmProfile?.subscriptionTier.replace('_', ' ')}</strong>
                    </div>
                    <div>
                      <span className={`block text-[10px] font-sans ${theme === 'dark' ? 'text-slate-400' : 'text-purple-700/80'}`}>SLA Commitment</span>
                      <strong className="text-purple-600 dark:text-purple-400 font-sans text-xs">{crmProfile?.SLA_ResponseTimeMins} Min SLA Target</strong>
                    </div>
                  </div>
                </div>

                {/* Real-time deployment Alert Banner */}
                {crmProfile?.activeDeployments.some(d => d.status === 'CRITICAL') && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex gap-2.5 items-start text-xs text-rose-300">
                    <AlertCircle className="w-4.5 h-4.5 shrink-0 animate-ping mt-0.5" />
                    <div>
                      <strong className="font-bold block">Incident Triggered — Node Outage</strong>
                      <span className="text-[11px] leading-snug block mt-0.5 text-rose-300/80">Active unrecoverable Redis pods collapsed in EU, triggering priority support SLAs.</span>
                    </div>
                  </div>
                )}

                {/* 2. Knowledge Base Search & Articles */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Predictive Reference Base</span>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Audit kubernetes, reset keys..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 border ${
                        theme === 'dark' 
                          ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500' 
                          : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
                      }`}
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200"
                      >
                        <X className="w-4.5 h-4.5" />
                      </button>
                    )}
                  </div>

                  {/* KB Search Results list */}
                  <div className="space-y-1.5 max-h-[170px] overflow-y-auto">
                    {filteredKb.length === 0 ? (
                      <div className="text-center py-4 text-slate-500 text-xs font-mono">No relevant document matched.</div>
                    ) : (
                      filteredKb.map(art => (
                        <button
                          key={art.id}
                          onClick={() => {
                            setSelectedKbArticleId(art.id);
                            setActiveScreen('kb');
                          }}
                          className={`w-full p-2.5 rounded-xl border text-left flex justify-between items-center transition ${
                            theme === 'dark' 
                              ? 'bg-slate-900/40 border-slate-800/40 hover:bg-slate-800/30 text-slate-300' 
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs'
                          }`}
                        >
                          <div className="max-w-[85%]">
                            <h5 className={`text-xs font-bold font-sans truncate leading-snug ${theme === 'dark' ? 'text-purple-400' : 'text-purple-700'}`}>{art.title}</h5>
                            <p className={`text-[10px] truncate font-sans mt-0.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{art.summary}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* 3. Categorised Active Company SLA Tickets */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Active Workspace Tickets({tickets.length})</span>
                  <div className="space-y-2">
                    {tickets.map(ticket => (
                      <div
                        key={ticket.id}
                        onClick={() => initSupportSession(ticket)}
                        className={`p-3 rounded-2xl border text-left block w-full outline-none transition cursor-pointer hover:border-purple-500/40 ${
                          theme === 'dark' 
                            ? 'bg-[#050c26]/60 border-slate-800 text-slate-200' 
                            : 'bg-white border-slate-200 text-slate-800 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold font-mono text-slate-500">#{ticket.id}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${
                            ticket.priority === 'P0' 
                              ? theme === 'dark' ? 'bg-rose-950/80 text-rose-400' : 'bg-rose-100 text-rose-800'
                              : theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-150 text-slate-700'
                          }`}>{ticket.priority} OUTAGE</span>
                        </div>
                        <h4 className={`text-xs font-bold leading-normal font-sans mb-1.5 ${
                          theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                        }`}>{ticket.title}</h4>
                        <div className="flex items-center justify-between mt-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ticket.status === 'OPEN' 
                              ? theme === 'dark' ? 'bg-amber-950 text-amber-400' : 'bg-amber-100 text-amber-900 border border-amber-200'
                              : ticket.status === 'IN_PROGRESS' 
                                ? theme === 'dark' ? 'bg-cyan-950 text-cyan-400' : 'bg-cyan-100 text-cyan-900 border border-cyan-200'
                                : theme === 'dark' ? 'bg-emerald-950 text-emerald-400' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          }`}>{ticket.status}</span>
                          <span className={`text-[10px] font-mono tracking-tight ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{ticket.createdAt.split(' ')[0]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Floating trigger FAB replacement (Sleek minimalist style) */}
                <div className="pt-2">
                  <button
                    onClick={() => initSupportSession(null)}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition active:scale-95 group shrink-0"
                  >
                    <MessageSquare className="w-4 h-4 text-white group-hover:scale-110 transition" />
                    <span>Initialize AI Assistant</span>
                  </button>
                </div>

              </div>
            )}

            {/* SCREEN 2: SUPPORT CONVERSATION CHAT PORTAL */}
            {activeScreen === 'chat' && (
              <div className={`flex-1 flex flex-col overflow-hidden ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-100'}`}>
                {/* Active Sub Header bar */}
                <div className={`px-4 py-2 border-b flex items-center justify-between shrink-0 text-[10px] font-mono ${
                  theme === 'dark' ? 'bg-slate-900/80 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                }`}>
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>VIP SLA Active Session</span>
                  </div>
                  <div>SLA turns: <strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}>{activeSession?.turnCount} / 3</strong></div>
                </div>

                {/* Conversation Scroller viewport */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
                  {activeSession?.messages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={`flex flex-col max-w-[85%] ${
                        msg.sender === 'USER' ? 'ml-auto items-end' : 'mr-auto'
                      }`}
                    >
                      {/* Name tag indicator */}
                      <span className={`text-[10px] font-mono mb-1 ${
                        theme === 'dark' ? 'text-slate-500' : 'text-slate-600'
                      }`}>
                        {msg.sender === 'USER' ? 'You' : msg.sender === 'AI' ? 'OmniSupport LLM' : msg.assignedAgentName || 'Marcus (DevOps)'} • {msg.timestamp}
                      </span>

                      {/* Bubble styling */}
                      <div className={`p-3 rounded-2xl text-xs leading-normal font-sans ${
                        msg.sender === 'USER' 
                          ? 'bg-purple-600 text-white rounded-tr-none shadow-xs' 
                          : msg.sender === 'AI'
                            ? theme === 'dark'
                              ? 'bg-[#0b1236]/90 border border-slate-800 text-slate-100 rounded-tl-none'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-xs'
                            : theme === 'dark'
                              ? 'bg-indigo-950 border border-indigo-800/40 text-indigo-100 rounded-tl-none font-sans font-medium'
                              : 'bg-indigo-50 border border-indigo-200 text-indigo-950 rounded-tl-none font-sans font-medium shadow-xs'
                      }`}>
                        
                        {/* Body Renderer with customized inline styles for Markdown */}
                        {msg.sender === 'USER' ? (
                          <div className="break-all whitespace-pre-wrap">{msg.text}</div>
                        ) : (
                          <div className="markdown-body space-y-2 overflow-x-auto select-text break-words">
                            <ReactMarkdown
                              components={{
                                table: ({ children }) => <table className={`w-full text-[10px] border my-2 rounded ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>{children}</table>,
                                th: ({ children }) => <th className={`border-b p-1 font-bold ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-800'}`}>{children}</th>,
                                td: ({ children }) => <td className={`border-b p-1 font-mono text-[9px] ${theme === 'dark' ? 'bg-slate-950 border-slate-900 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>{children}</td>,
                                code: ({ node, className, children, ...props }) => {
                                  return (
                                    <code className={`font-mono text-[9px] px-1 py-0.5 rounded select-text ${theme === 'dark' ? 'bg-slate-900 text-cyan-400' : 'bg-slate-100 text-cyan-700'}`} {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                                pre: ({ children }) => <pre className={`font-mono text-[10px] p-2 rounded border my-1 overflow-x-auto whitespace-pre select-text ${theme === 'dark' ? 'bg-[#020512] text-slate-300 border-slate-900' : 'bg-slate-50 text-slate-800 border-slate-200'}`}>{children}</pre>
                              }}
                            >
                              {msg.text}
                            </ReactMarkdown>
                          </div>
                        )}

                        {/* Rendering attached multimodal images indicators */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-white/10 pt-2">
                            {msg.attachments.map((attach, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 p-1 bg-black/20 rounded-lg text-[9px] font-mono text-slate-300">
                                <Paperclip className="w-3 h-3" />
                                <span className="max-w-[120px] truncate">{attach.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Display masking check comparison indicator strictly on user messages */}
                      {msg.sender === 'USER' && msg.originalText && msg.originalText !== msg.text && (
                        <div className="text-[9px] text-amber-500 font-mono mt-1 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Personally Identifiable Information Redacted</span>
                        </div>
                      )}

                      {/* Msg delivery state indicator */}
                      {msg.sender === 'USER' && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 select-none font-bold">
                          {msg.status === 'SENT' && 'Sent'}
                          {msg.status === 'DELIVERED' && 'Delivered'}
                          {msg.status === 'READ' && <span className="text-purple-400">Read</span>}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Typing bounce bouncing animations */}
                  {isAiTyping && (
                    <div className="flex flex-col max-w-[85%] mr-auto">
                      <span className="text-[10px] font-mono text-slate-500 mb-1">AI Assistant is thinking...</span>
                      <div className="bg-[#0b1236]/90 border border-slate-800 p-3.5 rounded-2xl rounded-tl-none max-w-fit shrink-0 flex items-center justify-center gap-1 shadow-sm font-bold">
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '3000ms' }} />
                      </div>
                    </div>
                  )}

                  {/* Transfer live team animated queue view */}
                  {isTransferringToAgent && liveAgentQueuePosition > 0 && (
                    <div className="p-4 rounded-2xl bg-[#090e24] border border-cyan-500/20 text-center space-y-3 shadow-inner my-2">
                      <div className="mx-auto w-10 h-10 rounded-full bg-cyan-950 flex items-center justify-center text-cyan-400 animate-pulse">
                        <Phone className="w-5 h-5 animate-spin" />
                      </div>
                      <div>
                        <strong className="text-xs text-cyan-300 block">SLA Transfer Protocols Active</strong>
                        <p className="text-[10px] text-slate-400 mt-1">turn limit exceeded or explicit live operator request triggered. Routing to premium human queue.</p>
                      </div>
                      <div className="bg-slate-950 p-2 border border-slate-800/60 rounded-xl flex justify-between items-center text-[11px] font-mono">
                        <span className="text-slate-500">Queue position:</span>
                        <strong className="text-cyan-400">Position 1 (Priority SLA Allocation)</strong>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Multimodal attachment files shelf display */}
                {attachedFiles.length > 0 && (
                  <div className="px-4 py-2 border-t border-slate-800 bg-[#0d122e] flex flex-wrap gap-2 shrink-0">
                    {attachedFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 py-1 px-2.5 bg-slate-900 border border-slate-800 rounded-xl text-[10px] text-slate-300 font-mono">
                        <Paperclip className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="max-w-[130px] truncate">{f.name}</span>
                        <button 
                          onClick={() => removeAttachedFile(i)}
                          className="hover:bg-slate-800 p-0.5 rounded text-rose-400 border-none inline"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer inputs Area */}
                <div className="p-3 bg-[#020516] border-t border-slate-900 shrink-0 select-text">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    {/* Attachment trigger picker dropdown */}
                    <div className="relative shrink-0 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setShowAttachmentDropdown(!showAttachmentDropdown)}
                        className="p-2 bg-slate-900 border border-slate-800 hover:text-slate-100 text-slate-400 rounded-xl shadow transition"
                      >
                        <Paperclip className="w-4 h-4 text-purple-400 rotate-45" />
                      </button>

                      {showAttachmentDropdown && (
                        <div className="absolute bottom-12 left-0 w-[230px] bg-slate-900/95 border border-slate-800 rounded-xl p-2 shadow-2xl z-50 flex flex-col gap-1 text-xs select-none">
                          <button
                            type="button"
                            onClick={() => injectAttachmentPreset('k8s')}
                            className="w-full p-2 hover:bg-slate-800 text-slate-300 rounded-lg text-left text-xs flex items-center gap-1.5"
                          >
                            <FileUp className="w-3.5 h-3.5 text-cyan-400" />
                            Attach Preset: K8s OOM log.png
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => injectAttachmentPreset('invoice')}
                            className="w-full p-2 hover:bg-slate-800 text-slate-300 rounded-lg text-left text-xs flex items-center gap-1.5"
                          >
                            <FileUp className="w-3.5 h-3.5 text-purple-400" />
                            Attach Preset: Invoice rejection.png
                          </button>

                          <div className="border-t border-slate-800/50 my-1 shrink-0" />

                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full p-2 hover:bg-slate-800 text-slate-300 rounded-lg text-left text-xs flex items-center gap-1.5 font-semibold"
                          >
                            <FileUp className="w-3.5 h-3.5 text-white" />
                            Upload custom screenshot...
                          </button>
                        </div>
                      )}
                      
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleCustomFileUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                    </div>

                    <input
                      type="text"
                      placeholder={isTransferringToAgent ? "Ask agent Marcus..." : "Report OOM logs, ask diagnostic steps..."}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-white focus:outline-none placeholder-slate-500"
                    />

                    <button
                      type="submit"
                      className="p-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white shadow-xl transition cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>

                  {/* Resolve session guidelines buttons */}
                  <div className="mt-2.5 flex items-center justify-between text-[11px] border-t border-slate-900 pt-2 shrink-0">
                    <button
                      onClick={resetSession}
                      className="text-slate-500 hover:text-slate-300 flex items-center gap-0.5 border-none outline-none cursor-pointer"
                    >
                      Exit Session
                    </button>
                    <button
                      onClick={resolveSession}
                      className="text-emerald-500 hover:text-emerald-400 font-bold flex items-center gap-0.5 border-none outline-none cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Mark Resolved
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN 3: KNOWLEDGE BASE DOCUMENT VIEW */}
            {activeScreen === 'kb' && selectedKbArticleId && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {(() => {
                  const art = kbArticles.find(k => k.id === selectedKbArticleId);
                  if (!art) return null;
                  return (
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {/* KB Header details */}
                      <span className={`text-[10px] font-mono font-bold uppercase py-0.5 px-2 rounded border ${
                        theme === 'dark'
                          ? 'bg-purple-950/20 text-purple-400 border-purple-900/40'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        Document Guide: {art.id}
                      </span>
                      <h2 className="text-base font-bold leading-snug mt-1 font-sans">{art.title}</h2>
                      <p className={`text-xs font-sans ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{art.summary}</p>
                      
                      <div className={`border-t pt-3 shrink-0 ${theme === 'dark' ? 'border-slate-800/50' : 'border-slate-200'}`} />

                      {/* KB article body text parsed as strict Markdown formatting */}
                      <div className={`markdown-body space-y-3 text-xs leading-relaxed font-sans ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        <ReactMarkdown
                          components={{
                            code: ({ node, className, children, ...props }) => (
                              <code className={`font-mono text-[9px] px-1 py-0.5 rounded select-text ${theme === 'dark' ? 'bg-slate-900 text-cyan-400' : 'bg-slate-150 text-cyan-800'}`} {...props}>{children}</code>
                            ),
                            pre: ({ children }) => <pre className={`font-mono p-2 rounded border my-1 overflow-x-auto select-text ${theme === 'dark' ? 'bg-[#020512] text-slate-300 border-slate-900' : 'bg-slate-50 text-slate-800 border-slate-200'}`}>{children}</pre>
                          }}
                        >
                          {art.content}
                        </ReactMarkdown>
                      </div>

                      {/* Tag descriptors */}
                      <div className="flex flex-wrap gap-1.5 pt-4">
                        {art.tags.map((tag, tIdx) => (
                          <span key={tIdx} className={`px-2 py-0.5 rounded text-[10px] font-mono ${theme === 'dark' ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 border border-slate-200 text-slate-600'}`}>
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Launch direct support from document */}
                      <div className="pt-4 shrink-0">
                        <button
                          onClick={() => {
                            // Automatically launch a ticket support session targeted specifically for this KB issue
                            const mockTicket: Ticket = {
                              id: `TCK-${Math.floor(100000 + Math.random() * 900000)}`,
                              title: `Support query for: ${art.title}`,
                              category: art.category as any,
                              status: 'OPEN',
                              priority: 'P1',
                              createdAt: new Date().toISOString(),
                              lastUpdated: new Date().toISOString(),
                              description: `Linked Reference article: ${art.id}`
                            };
                            initSupportSession(mockTicket);
                          }}
                          className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-center text-xs font-semibold text-white tracking-wider transition cursor-pointer"
                        >
                          Correlate with Live Support Assistant
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
              </>
            )}

          </div>

          {/* APP MOCK HOME INDICATOR BUTTON */}
          <footer className="h-6 shrink-0 bg-transparent flex items-center justify-center relative pointer-events-none">
            <div className="w-32 h-[4px] rounded-full bg-slate-500" />
          </footer>

        </div>
      )}
    </div>
  );
}
