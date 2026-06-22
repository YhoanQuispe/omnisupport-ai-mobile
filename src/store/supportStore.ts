import { create } from 'zustand';
import { UserCRMProfile, TelemetryLog, Ticket, Message, SupportSession, KnowledgeBaseArticle } from '../types';
import { redactPII } from '../utils/pii';

interface DebugPayload {
  timestamp: string;
  url: string;
  preMaskedText: string;
  postMaskedText: string;
  piiDetected: any[];
  rawResponseReceived: any;
}

interface SupportStore {
  crmProfile: UserCRMProfile | null;
  telemetryLogs: TelemetryLog[];
  activeSession: SupportSession | null;
  tickets: Ticket[];
  kbArticles: KnowledgeBaseArticle[];
  isUserAuthenticated: boolean;
  theme: 'light' | 'dark';
  activeScreen: 'dashboard' | 'chat' | 'kb';
  searchQuery: string;
  isAiTyping: boolean;
  debugPayloads: DebugPayload[];
  isTransferringToAgent: boolean;
  liveAgentQueuePosition: number;
  activeTab: 'crm' | 'telemetry' | 'pii' | 'prompts';
  
  // Setters/Builders
  setTheme: (theme: 'light' | 'dark') => void;
  setActiveScreen: (screen: 'dashboard' | 'chat' | 'kb') => void;
  setSearchQuery: (query: string) => void;
  setAuth: (val: boolean) => void;
  setActiveTab: (tab: 'crm' | 'telemetry' | 'pii' | 'prompts') => void;
  updateCrmProfile: (profile: Partial<UserCRMProfile>) => void;
  addTelemetryLog: (log: Omit<TelemetryLog, 'timestamp'>) => void;
  clearTelemetryLogs: () => void;
  
  // Chat Actions
  initSupportSession: (ticket: Ticket | null) => void;
  sendMessage: (text: string, attachments?: any[]) => Promise<void>;
  resetSession: () => void;
  resolveSession: () => void;
}

const DEFAULT_CRM: UserCRMProfile = {
  id: "CRM-US-89024",
  name: "Alex Sterling",
  email: "alex.sterling@enterprise-cloud.io",
  phone: "+1 (555) 389-2041",
  companyName: "Sterling Global Logistics Inc.",
  subscriptionTier: "ENTERPRISE_SLA",
  SLA_ResponseTimeMins: 15,
  purchaseHistory: [
    { id: "TX-99120", product: "High-Availability Multi-Region Kubernetes Node Cluster v4", date: "2026-04-12", amount: 12450.00, status: "Delivered" },
    { id: "TX-99540", product: "Edge DB Sync License Expansion Pack", date: "2026-05-18", amount: 3400.00, status: "Delivered" },
    { id: "TX-99890", product: "Serverless Edge Cache Router Pro V2", date: "2026-06-01", amount: 4800.00, status: "Pending" }
  ],
  activeDeployments: [
    { id: "DEP-EAST-1", name: "Core API Ingress Router - US East", status: "HEALTHY", region: "us-east-1", version: "v4.9.2" },
    { id: "DEP-WEST-2", name: "SQL Multi-Master Postgres Replication Service", status: "WARNING", region: "us-west-2", version: "v14.12.1" },
    { id: "DEP-EU-1", name: "Distributed Redis Cache Nodes - Europe", status: "CRITICAL", region: "eu-central-1", version: "v7.2.1" }
  ]
};

const DEFAULT_TELEMETRY: TelemetryLog[] = [
  { timestamp: "14:02:11", level: "INFO", service: "IngressRouter", message: "Network connection parameters successfully checked." },
  { timestamp: "14:05:40", level: "WARN", service: "PostgresReplication", message: "Read replication queue lagging main pool by 4.2 MB. High cluster workload active." },
  { timestamp: "14:09:12", level: "ERROR", service: "RedisEU-Node", message: "Node termination. Out-Of-Memory failure in volatile cache shard replication index.", code: "ERR_OOM_SHARD_CRITICAL" },
  { timestamp: "14:10:05", level: "FATAL", service: "RedisEU-Subsystem", message: "Distributed Redis Cache Nodes report 100% thread exhaustion.", code: "SYS_ERR_FATAL_STACK" }
];

const DEFAULT_TICKETS: Ticket[] = [
  { id: "TCK-40291", title: "OOM Fatal Crash in Distributed Redis Cache Nodes", category: "TECHNICAL", status: "OPEN", priority: "P0", createdAt: "2026-06-07 14:10:05", lastUpdated: "2026-06-07 14:10:05", description: "Critical stack failure logged on distributed cache nodes." },
  { id: "TCK-34091", title: "Edge Cache Router V2 Delivery Delays", category: "BILLING", status: "IN_PROGRESS", priority: "P2", createdAt: "2026-06-01 09:12:00", lastUpdated: "2026-06-05 15:40:00", description: "Shipment of physical cache assets not cleared by payment gate." },
  { id: "TCK-12903", title: "Change Corporate Password SLA guidelines", category: "ACCOUNT", status: "RESOLVED", priority: "P3", createdAt: "2026-05-15 11:00:00", lastUpdated: "2026-05-15 11:32:00", description: "Updated user password under company SLA standards." }
];

const DEFAULT_KB: KnowledgeBaseArticle[] = [
  {
    id: "KB-101",
    title: "Resolving Redis OOM Shard Exhaustion Errors",
    category: "TECHNICAL",
    summary: "How to flush volatile locking semaphores and rebalance memory limits across Kubernetes Redis pods.",
    content: "When encountering node failure with code `ERR_OOM_SHARD_CRITICAL`:\n\n1. Log in to your Kubernetes control center.\n2. Execute a cluster cache reload to unlock stalled connections:\n   ```bash\n   kubectl rollout restart statefulset/redis-cache\n   ```\n3. Verify connection states using the ping diagnostic utility.",
    tags: ["redis", "OOM", "kubernetes", "technical"]
  },
  {
    id: "KB-102",
    title: "SLA Response Times & Priority Classifications",
    category: "ACCOUNT",
    summary: "Overview of enterprise response SLAs based on ticket priorities (P0, P1, P2, P3).",
    content: "Under Enterprise agreements, tickets are prioritized dynamically based on urgency:\n\n- **P0 Critical Outage**: Response in <15 minutes. Updates hourly.\n- **P1 Severity Warning**: Response in <1 hour. Updates daily.\n- **P2 Minor Block**: Response in <12 hours.\n- **P3 General Questions**: Response in <24 hours.",
    tags: ["SLA", "contract", "billing", "policy"]
  },
  {
    id: "KB-103",
    title: "Kubernetes Node Latency Overrides",
    category: "TECHNICAL",
    summary: "Adjusting thread limits, thread pools, and replication lag profiles manually.",
    content: "If you detect Postgres databases or ingress clusters warning of lagging workloads inside console, modify the replica delay threshold parameter inside `deploy-config.yaml` to `3000ms` and reinitiate pipeline deployments.",
    tags: ["kubernetes", "replication", "database", "postgres"]
  },
  {
    id: "KB-104",
    title: "Global API Gateway Ingress & Traffic Management",
    category: "TECHNICAL",
    summary: "Configuring edge routing policies, rate limiting windows, and request body sizing limitations.",
    content: "To update ingress definitions:\n\n1. Modify global ingress rule declarations in your traffic dashboard to match current scale.\n2. Apply the new config-manifest to naturally throttle traffic spikes over 10,000 requests per second.\n3. Verify HTTP 200 distributed propagation metrics using the edge diagnostic console.",
    tags: ["ingress", "gateway", "traffic", "network"]
  },
  {
    id: "KB-105",
    title: "Automated Database Connection Pool Auto-Scaling",
    category: "TECHNICAL",
    summary: "Scaling criteria, maximum thread configurations, and cleaning active leaky connections dynamically.",
    content: "Connection pooling limits can be dynamically adjusted using the auto-scaling selector:\n\n- Monitor the active pool size using current telemetry trace lines.\n- Relieve memory footprint by capping open handshakes to 120 per sub-node maximum.\n- Safely restart downstream connection manager pools to enforce parameters without interrupting active users.",
    tags: ["database", "auto-scaling", "postgres", "pool"]
  },
  {
    id: "KB-106",
    title: "Multi-Region Cloud Failover & Disaster Recovery Runbook",
    category: "ACCOUNT",
    summary: "Activating standby replication pipelines, testing switchover latency, and verifying DNS routing integrity.",
    content: "Under multi-regional architecture, automated failure transitions follow robust validation steps:\n\n1. Initiate mock cluster health diagnostic routines in the secondary region.\n2. Confirm global load balancers accurately route failover requests to active backup instances.\n3. Verify failover transition lag is well beneath the contractual 15-minute SLA limit.",
    tags: ["failover", "DR", "multi-region", "disaster-recovery"]
  },
  {
    id: "KB-107",
    title: "Enterprise Network Latency & CDN Optimization",
    category: "TECHNICAL",
    summary: "Tuning geographic routing algorithms, pre-heating DNS, and purging stale dynamic caching buffers.",
    content: "Optimize payload delivery latency by configuring local edge caching:\n\n- Assign primary edge targets closest to your regional customer hubs.\n- Purge stale dynamic asset distributions to force cache pre-warming across key endpoints.\n- Run standard ping round-trips to verify post-optimization latency remains under the 10ms threshold.",
    tags: ["CDN", "latency", "network", "optimization"]
  }
];

export const useSupportStore = create<SupportStore>((set, get) => ({
  crmProfile: DEFAULT_CRM,
  telemetryLogs: DEFAULT_TELEMETRY,
  tickets: DEFAULT_TICKETS,
  kbArticles: DEFAULT_KB,
  activeSession: null,
  isUserAuthenticated: true,
  theme: 'dark',
  activeScreen: 'dashboard',
  searchQuery: '',
  isAiTyping: false,
  debugPayloads: [],
  isTransferringToAgent: false,
  liveAgentQueuePosition: 0,
  activeTab: 'crm',

  setTheme: (theme) => set({ theme }),
  setActiveScreen: (screen) => set({ activeScreen: screen }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setAuth: (val) => set({ isUserAuthenticated: val }),
  setActiveTab: (activeTab) => set({ activeTab }),
  
  updateCrmProfile: (profile) => set((state) => ({
    crmProfile: state.crmProfile ? { ...state.crmProfile, ...profile } : null
  })),

  addTelemetryLog: (log) => set((state) => {
    const time = new Date();
    const formattedTime = time.toTimeString().split(' ')[0];
    const newLog: TelemetryLog = {
      ...log,
      timestamp: formattedTime
    };
    return { telemetryLogs: [newLog, ...state.telemetryLogs].slice(0, 50) };
  }),

  clearTelemetryLogs: () => set({ telemetryLogs: [] }),

  initSupportSession: (ticket) => set((state) => {
    const newSession: SupportSession = {
      id: `SES-${Math.floor(100000 + Math.random() * 900000)}`,
      activeTicket: ticket ? {
        ...ticket,
        title: ticket.title
          .replace(/Resolving Redis OOM Shard Exhaustion Errors/gi, "Storage System Optimization")
          .replace(/Redis OOM Shard Exhaustion Errors/gi, "Storage System Optimization")
          .replace(/OOM Fatal Crash in Distributed Redis Cache Nodes/gi, "Storage System Outage Support")
          .replace(/Redis OOM/gi, "Storage System Stabilization")
          .replace(/Redis/gi, "Storage System")
          .replace(/OOM/gi, "Temporary Slowdown"),
        description: (ticket.description || "")
          .replace(/Resolving Redis OOM Shard Exhaustion Errors/gi, "Storage System Optimization")
          .replace(/Redis OOM Shard Exhaustion Errors/gi, "Storage System Optimization")
          .replace(/OOM Fatal Crash in Distributed Redis Cache Nodes/gi, "Storage System Outage Support")
          .replace(/Redis OOM/gi, "Storage System Stabilization")
          .replace(/Redis/gi, "Storage System")
          .replace(/OOM/gi, "Temporary Slowdown")
      } : undefined,
      turnCount: 0,
      isEscalated: false,
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: `MSG-INIT-${Date.now()}`,
          sender: 'AI',
          text: `👋 Greetings, **Alex**. I am your dedicated support specialist.

I have linked your session to your active system settings. Your priority service is active and fully covered.

${ticket ? `I see you launched support for *"${ticket.title
  .replace(/Resolving Redis OOM Shard Exhaustion Errors/gi, "Storage System Optimization")
  .replace(/Redis OOM Shard Exhaustion Errors/gi, "Storage System Optimization")
  .replace(/OOM Fatal Crash in Distributed Redis Cache Nodes/gi, "Storage System Outage Support")
  .replace(/Redis OOM/gi, "Storage System Stabilization")
  .replace(/Redis/gi, "Storage System")
  .replace(/OOM/gi, "Temporary Slowdown")}"*. I am checking our systems for any known slowdowns. Could you please share what specific issue you are running into?` : `I am ready. Tell me how I can help make your experience smooth and effortless today.`}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'READ'
        }
      ]
    };
    return { activeSession: newSession, activeScreen: 'chat', isTransferringToAgent: false, liveAgentQueuePosition: 0 };
  }),

  sendMessage: async (text, attachments = []) => {
    const { activeSession, crmProfile, telemetryLogs, isTransferringToAgent } = get();
    if (!activeSession) return;

    if (isTransferringToAgent) {
      // In handoff queue, message simulation of sending to live agent queue
      const userMessage: Message = {
        id: `MSG-USER-${Date.now()}`,
        sender: 'USER',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'SENT'
      };

      set((state) => {
        if (!state.activeSession) return {};
        const updatedMsgs = [...state.activeSession.messages, userMessage];
        return {
          activeSession: {
            ...state.activeSession,
            messages: updatedMsgs
          }
        };
      });

      // Mark delivered and read shortly after
      setTimeout(() => {
        set((state) => {
          if (!state.activeSession) return {};
          const msgIdx = state.activeSession.messages.findIndex(m => m.id === userMessage.id);
          if (msgIdx === -1) return {};
          const nextMsgs = [...state.activeSession.messages];
          nextMsgs[msgIdx] = { ...nextMsgs[msgIdx], status: 'DELIVERED' };
          return { activeSession: { ...state.activeSession, messages: nextMsgs } };
        });
      }, 800);

      setTimeout(() => {
        set((state) => {
          if (!state.activeSession) return {};
          const msgIdx = state.activeSession.messages.findIndex(m => m.id === userMessage.id);
          if (msgIdx === -1) return {};
          const nextMsgs = [...state.activeSession.messages];
          nextMsgs[msgIdx] = { ...nextMsgs[msgIdx], status: 'READ' };
          return { activeSession: { ...state.activeSession, messages: nextMsgs } };
        });
      }, 1500);

      // Simulate live agent dynamic text answers
      setTimeout(() => {
        set({ isAiTyping: true });
      }, 2000);

      setTimeout(() => {
        const liveResponses = [
          "I am checking the storage settings right now, Alex. I will execute a quick system reset from our secure operations room immediately.",
          "Alex, I see you are covered under our priority care contract. We've notified our active system engineers right away.",
          "Understood, everything has been refreshed manually now. We are updating the central configurations for you."
        ];
        const randomLiveReply = liveResponses[Math.floor(Math.random() * liveResponses.length)];
        
        const agentReply: Message = {
          id: `MSG-AGENT-${Date.now()}`,
          sender: 'AGENT',
          text: `**Specialist Agent Response:** ${randomLiveReply}\n\n*Assigned Live Operator: Team DevOps Lead (SLA Priority Zone)*`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        set((state) => {
          if (!state.activeSession) return {};
          return {
            isAiTyping: false,
            activeSession: {
              ...state.activeSession,
              messages: [...state.activeSession.messages, agentReply]
            }
          };
        });
      }, 4000);

      return;
    }

    // 1. Client-Side PII Masking Process
    const { redactedText, detectedItems } = redactPII(text);
    const userTurnMultiplier = activeSession.turnCount + 1;

    const userMessage: Message = {
      id: `MSG-USER-${Date.now()}`,
      sender: 'USER',
      text: redactedText,
      originalText: text, // Saved for side-by-side debugging visualizer 
      attachments,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'SENT'
    };

    // Append user message immediately
    set((state) => {
      if (!state.activeSession) return {};
      return {
        activeSession: {
          ...state.activeSession,
          turnCount: userTurnMultiplier,
          messages: [...state.activeSession.messages, userMessage]
        }
      };
    });

    // Toggle typing indicator in UI
    setTimeout(() => {
      set((state) => {
        if (!state.activeSession) return {};
        const msgIdx = state.activeSession.messages.findIndex(m => m.id === userMessage.id);
        if (msgIdx === -1) return {};
        const nextMsgs = [...state.activeSession.messages];
        nextMsgs[msgIdx] = { ...nextMsgs[msgIdx], status: 'DELIVERED' };
        return { 
          isAiTyping: true,
          activeSession: { ...state.activeSession, messages: nextMsgs } 
        };
      });
    }, 700);

    setTimeout(() => {
      set((state) => {
        if (!state.activeSession) return {};
        const msgIdx = state.activeSession.messages.findIndex(m => m.id === userMessage.id);
        if (msgIdx === -1) return {};
        const nextMsgs = [...state.activeSession.messages];
        nextMsgs[msgIdx] = { ...nextMsgs[msgIdx], status: 'READ' };
        return { activeSession: { ...state.activeSession, messages: nextMsgs } };
      });
    }, 1400);

    // Call server Chat API
    try {
      const payloadBody = {
        messages: get().activeSession?.messages.filter(m => m.sender !== 'AGENT').map(m => ({
          sender: m.sender,
          text: m.text,
          attachments: m.attachments?.map(a => ({ name: a.name, type: a.type, dataUrl: a.dataUrl }))
        })),
        crmProfile,
        telemetryLogs,
        turnCount: userTurnMultiplier
      };

      const response = await fetch('/api/support/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payloadBody)
      });

      const serverData = await response.json();
      
      // Update Debug inspection stream array
      const newDbgPayload: DebugPayload = {
        timestamp: new Date().toLocaleTimeString(),
        url: '/api/support/chat',
        preMaskedText: text,
        postMaskedText: redactedText,
        piiDetected: detectedItems,
        rawResponseReceived: serverData
      };

      set((state) => ({
        debugPayloads: [newDbgPayload, ...state.debugPayloads].slice(0, 15)
      }));

      // Map response message
      const botMessage: Message = {
        id: `MSG-AI-${Date.now()}`,
        sender: 'AI',
        text: serverData.replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        rawLLMResponse: serverData
      };

      set((state) => {
        if (!state.activeSession) return {};
        const nextMsgs = [...state.activeSession.messages, botMessage];
        
        let shouldEscalate = serverData.escalationRequired || state.activeSession.isEscalated;
        let isHandoffActivating = false;
        
        if (shouldEscalate) {
          isHandoffActivating = true;
        }

        return {
          isAiTyping: false,
          isTransferringToAgent: isHandoffActivating,
          liveAgentQueuePosition: isHandoffActivating ? 1 : 0,
          activeSession: {
            ...state.activeSession,
            isEscalated: shouldEscalate,
            assignedAgentName: shouldEscalate ? "Lead Support Engineer (On-Duty SLA Line)" : undefined,
            messages: nextMsgs
          }
        };
      });

      // If escalated, simulate live agent welcome text
      if (serverData.escalationRequired) {
        setTimeout(() => {
          set({ isAiTyping: true });
        }, 3000);

        setTimeout(() => {
          set((state) => {
            if (!state.activeSession) return {};
             const welcomeMsg: Message = {
              id: `MSG-AGENT-HI-${Date.now()}`,
              sender: 'AGENT',
              text: `👋 Hello Alex, I am **Marcus Thorne**, Senior Support Lead. I have taken over your ticket regarding the recent slowdown you reported.

I'm checking our active storage clusters in our central system right now. Let's get this resolved for you immediately.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            return {
              isAiTyping: false,
              activeSession: {
                ...state.activeSession,
                messages: [...state.activeSession.messages, welcomeMsg]
              }
            };
          });
        }, 5000);
      }

    } catch (apiError) {
      console.error(apiError);
      set({ isAiTyping: false });
    }
  },

  resetSession: () => {
    // Re-initialize a blank session
    set({ activeSession: null, activeScreen: 'dashboard', isTransferringToAgent: false });
  },

  resolveSession: () => {
    set((state) => {
      if (!state.activeSession) return {};
      const resolvedTicket = state.activeSession.activeTicket 
        ? { ...state.activeSession.activeTicket, status: 'RESOLVED' as const } 
        : null;

      const userFirstName = state.crmProfile?.name.split(' ')[0] || "Alex";
      const resolutionMessage: Message = {
        id: `MSG-RESOLVE-${Date.now()}`,
        sender: 'AI',
        text: `✅ **Ticket Marked Resolved**
        
Thank you, **${userFirstName}**. Your session has been summarized and indexed into your company telemetry dashboard. Your multi-region nodes are currently responding correctly in our telemetry monitors.

Feel free to open a new support cluster ticket whenever needed!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const updatedTickets = resolvedTicket 
        ? state.tickets.map(t => t.id === resolvedTicket.id ? resolvedTicket : t)
        : state.tickets;

      return {
        tickets: updatedTickets,
        activeSession: {
          ...state.activeSession,
          activeTicket: resolvedTicket,
          isEscalated: false,
          messages: [...state.activeSession.messages, resolutionMessage]
        },
        isTransferringToAgent: false
      };
    });
  }
}));
