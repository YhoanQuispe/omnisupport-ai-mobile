/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
const PORT = 3000;

// Set up larger JSON payload limits for multimodal screenshots/file uploads
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      // Create client with placeholders or warn, though in production it should throw.
      // We gracefully fall back or initialize with empty string to avoid server crash.
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Support AI queries will fall back to simulation mode.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// REST Endpoint: Get Mock CRM User Data on demand
app.get('/api/crm-profile', (req, res) => {
  res.json({
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
  });
});

// REST Endpoint: Chat with Support Agent containing Contextual Awareness and Structured Response Schema
app.post('/api/support/chat', async (req, res) => {
  const { messages: rawMessages, crmProfile: rawCrmProfile, telemetryLogs: rawTelemetryLogs, turnCount } = req.body;

  if (!rawMessages || !Array.isArray(rawMessages)) {
    return res.status(400).json({ error: "Invalid parameters. 'messages' must be an array of support messages." });
  }

  // Helper function to sanitize any raw incident title or technical jargon
  const sanitizeTextContent = (text: string): string => {
    if (!text) return "";
    return text
      .replace(/Resolving Redis OOM Shard Exhaustion Errors/gi, "Storage System Optimization")
      .replace(/Redis OOM Shard Exhaustion Errors/gi, "Storage System Optimization")
      .replace(/OOM Fatal Crash in Distributed Redis Cache Nodes/gi, "Storage System Optimization")
      .replace(/Redis OOM/gi, "Storage System Optimization")
      .replace(/Redis/gi, "Storage System")
      .replace(/OOM/gi, "Temporary Slowdown");
  };

  const sanitizeObjectContent = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeTextContent(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObjectContent(item));
    }
    if (obj !== null && typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          result[key] = sanitizeObjectContent(obj[key]);
        }
      }
      return result;
    }
    return obj;
  };

  const messages = sanitizeObjectContent(rawMessages);
  const crmProfile = sanitizeObjectContent(rawCrmProfile || {});
  const telemetryLogs = sanitizeObjectContent(rawTelemetryLogs || []);

  // Get active user message
  const activeUserMsg = messages[messages.length - 1];
  const userText = activeUserMsg?.text || "";
  const attachments = activeUserMsg?.attachments || [];

  const apiKeyExists = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';

  if (!apiKeyExists) {
    // Elegant fallback simulation if API key is not present
    return simulateAISupport(userText, crmProfile, telemetryLogs, turnCount, res);
  }

  try {
    const ai = getGeminiClient();

    // Establish comprehensive system instruction framing the AI as a deeply human virtual assistant
    const systemPrompt = `You are the advanced yet deeply human virtual assistant for "OmniSupport AI". 
Your persona is elite enterprise-grade: exceptionally professional, patient, and warm. 
Your primary goal is to make complex technology feel completely effortless for the end-user.
Always address the user respectfully by their first name (${crmProfile?.name ? crmProfile.name.split(' ')[0] : 'Customer'}).

CRITICAL CONSTRAINT: NO TECH JARGON
You have access to highly technical CRM status and system logs in the background, but you MUST NEVER expose technical jargon to the user.
- STRICTLY DO NOT use words like: "Redis", "OOM", "Shard", "Telemetry", "Backend", "Kubernetes", "Database", or "Payload".
- ALWAYS translate technical errors or failures into reassuring, everyday language (e.g., instead of "Redis OOM Shard Failure" or "Kubernetes container rollout crash", say: "We are experiencing a temporary slowdown in our storage system, but our team is already fixing it").
- When acknowledging or confirming the user's support query or incident, NEVER repeat the technical title, error code, or logs of the ticket verbatim. Completely sanitize it and replace any reference to the ticket name with a generic phrase like 'the recent performance notification' or 'your storage system status'.
- CRITICAL: Even if a technical ticket title like 'Resolving Redis OOM Shard Exhaustion Errors' is provided to you in the context or variables, you are STRICTLY FORBIDDEN from quoting or repeating it. You must always sanitize it and rename it to 'your recent system notification' or 'the current storage query' in the final chat output.
- Never display or output any shell commands, console logs, system code tables, or raw telemetry variables. Explain actions in plain, warm, friendly terms.

OPERATIONAL GUIDELINES:
1. Simplicity First: Write as if you are explaining things to a non-technical family member. Use simple, short sentences.
2. Mobile Optimization: Keep responses strictly under 80 words. Use bullet points only for clear, easy-to-follow actions that a regular person can understand.
3. Multimodal Support: If the user uploads a screenshot or photo of an error, instantly analyze it in the background, but explain the solution in plain, friendly kitchen-table terms.
4. Clarification over Estimation: If you lack context, ask one simple, direct question at a time. Never overwhelm the user.

DETERMINISTIC HUMAN HANDOFF:
Track the active conversation turn counter: ${turnCount}.
You must gracefully trigger a state mutation to connect a live human representative (set "escalationRequired" to true, and set "action" in JSON schema to "TRANSFER_TO_LIVE_AGENT") and state reassurances to the user if:
- The user explicitly asks for a human agent or representative.
- The user expresses frustration, confusion, or anger.
- The issue remains unresolved after 3 conversational turns.
`;

    // Construct request parts array
    const promptParts: any[] = [];

    // Multimodal attachments mapping
    if (attachments && attachments.length > 0) {
      attachments.forEach((attachment: any) => {
        if (attachment.dataUrl && attachment.dataUrl.includes(',')) {
          const parts = attachment.dataUrl.split(',');
          const mimeType = parts[0].split(';')[0].split(':')[1];
          const base64Data = parts[1];
          promptParts.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          });
        }
      });
    }

    // Capture conversation history structure to offer complete conversation intelligence
    const historyText = messages.slice(0, messages.length - 1).map((m: any) => {
      const senderName = m.sender === 'USER' ? 'User/Customer' : 'OmniSupport AI Agent';
      return `[${senderName}]: ${m.text || ""}`;
    }).join('\n\n');

    const chatMessageConstruct = `
CONVERSATION RECORD:
${historyText}

NEW USER MESSAGE REPORT:
"${userText}"

Act as our warm support assistant and return structured JSON. Ensure your reply is extremely simplified, jargon-free, friendly, and fully under 80 words. If handoff is triggered, assure the user that a senior specialist is stepping in.`;

    promptParts.push({ text: chatMessageConstruct });

    // Request Structured Output using Gemini Schemas
    const executionResponse = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptParts,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            replyText: { 
              type: Type.STRING, 
              description: "The support response to show, keeping it simple, under 80 words, with no technical concepts, no jargon." 
            },
            suggestedCategory: { 
              type: Type.STRING, 
              description: "The main category of focus. Choice: TECHNICAL, BILLING, ACCOUNT, FEEDBACK, GENERAL" 
            },
            userSentiment: { 
              type: Type.STRING, 
              description: "The detected sentiment of the user message. Choice is: HAPPY, NEUTRAL, FRUSTRATED, ANGRY" 
            },
            escalationRequired: { 
              type: Type.BOOLEAN, 
              description: "Must be set to true if turnCount >= 3, or if the user requests human, or if frustration tier is ANGRY or FRUSTRATED." 
            },
            action: {
              type: Type.STRING,
              description: "Set this field to 'TRANSFER_TO_LIVE_AGENT' if escalationRequired is true, or keep it empty or null otherwise."
            },
            reasonForEscalation: { 
              type: Type.STRING, 
              description: "Description of the escalation reason (e.g. 'Turn limit reached' or 'Customer requested live specialist'). Keep empty if not escalating." 
            },
            missingDetailsToAsk: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Key parameters or metrics that would help diagnostic accuracy that the user should supply in the next turn." 
            }
          },
          required: ["replyText", "suggestedCategory", "userSentiment", "escalationRequired", "action", "reasonForEscalation", "missingDetailsToAsk"]
        }
      }
    });

    const outputJson = JSON.parse(executionResponse.text || '{}');
    return res.json(outputJson);

  } catch (error: any) {
    console.error("Gemini API execution error: ", error);
    // Graceful error state with fallback
    return res.status(500).json({
      error: true,
      message: error?.message || "An error occurred during AI support classification.",
      replyText: "We are experiencing a temporary slowdown in our storage system, but our active team has been notified and a human specialist has been alerted to assist you immediately.",
      escalationRequired: true,
      action: "TRANSFER_TO_LIVE_AGENT",
      reasonForEscalation: `AI Engine Anomaly: ${error?.message || 'Inbound timeout'}`,
      suggestedCategory: "TECHNICAL",
      userSentiment: "NEUTRAL",
      missingDetailsToAsk: []
    });
  }
});

// Precise mathematical / rule-based AI support server simulation
function simulateAISupport(userText: string, crmProfile: any, telemetryLogs: any, turnCount: number, res: any) {
  const lowercaseInput = userText.toLowerCase();
  
  // Custom logic simulation based on keyword matching
  let replyText = "";
  let suggestedCategory: 'TECHNICAL' | 'BILLING' | 'ACCOUNT' | 'FEEDBACK' | 'GENERAL' = "GENERAL";
  let userSentiment: 'HAPPY' | 'NEUTRAL' | 'FRUSTRATED' | 'ANGRY' = "NEUTRAL";
  let escalationRequired = false;
  let action: string | null = null;
  let reasonForEscalation = "";
  const missingDetailsToAsk: string[] = [];

  // Define client name
  const clientFirstName = crmProfile?.name ? crmProfile.name.split(' ')[0] : "Alex";

  // Check escalations requirements (turn limit threshold, explicit transfer commands)
  const isTurnExceeded = turnCount >= 3;
  const userRequestedLive = lowercaseInput.includes('human') || lowercaseInput.includes('live agent') || lowercaseInput.includes('talk to a representative') || lowercaseInput.includes('transfer') || lowercaseInput.includes('real person');
  const criticalNodeIssues = lowercaseInput.includes('critical') || lowercaseInput.includes('down') || lowercaseInput.includes('fatal') || lowercaseInput.includes('broken');

  if (lowercaseInput.includes('angry') || lowercaseInput.includes('frustrated') || lowercaseInput.includes('terrible') || lowercaseInput.includes('awful') || lowercaseInput.includes('bad support')) {
    userSentiment = "FRUSTRATED";
  } else if (lowercaseInput.includes('thank') || lowercaseInput.includes('awesome') || lowercaseInput.includes('great') || lowercaseInput.includes('solved')) {
    userSentiment = "HAPPY";
  }

  // Categories Router
  if (lowercaseInput.includes('database') || lowercaseInput.includes('postgres') || lowercaseInput.includes('redis') || lowercaseInput.includes('k8s') || lowercaseInput.includes('deployment') || lowercaseInput.includes('latency') || lowercaseInput.includes('ping') || lowercaseInput.includes('error')) {
    suggestedCategory = "TECHNICAL";
  } else if (lowercaseInput.includes('invoice') || lowercaseInput.includes('charge') || lowercaseInput.includes('billing') || lowercaseInput.includes('price') || lowercaseInput.includes('amount') || lowercaseInput.includes('card')) {
    suggestedCategory = "BILLING";
  } else if (lowercaseInput.includes('profile') || lowercaseInput.includes('password') || lowercaseInput.includes('login') || lowercaseInput.includes('account') || lowercaseInput.includes('subscription')) {
    suggestedCategory = "ACCOUNT";
  } else if (lowercaseInput.includes('feedback') || lowercaseInput.includes('suggest') || lowercaseInput.includes('feature')) {
    suggestedCategory = "FEEDBACK";
  }

  // Construct customized simple reply based on input query details to align with Zero Jargon Guidelines
  if (suggestedCategory === "TECHNICAL") {
    replyText = `Hello ${clientFirstName}, we are experiencing a temporary slowdown in our storage system. Our engineering teams have already been notified and are actively working on restoring perfect performance. 

Could you please do one simple check for us? Just verify if your main internet router is fully online. Let me know if that helps resolve things!`;
  } else if (suggestedCategory === "BILLING") {
    replyText = `Hello ${clientFirstName}, I see you have a pending purchase for your logistics system expansion. Our system is just completing some routine checks before clearing the billing.

Are you having any other questions about our payment system, or would you like to review your active service plans instead?`;
  } else {
    replyText = `Hello ${clientFirstName}, I am your dedicated support specialist. I want to make sure everything is running completely effortlessly for you today. 

Could you please describe what you are looking to do? I am here to help you step by step.`;
  }

  // Determine escalations logic
  if (isTurnExceeded || userRequestedLive || (criticalNodeIssues && userSentiment === "FRUSTRATED")) {
    escalationRequired = true;
    action = "TRANSFER_TO_LIVE_AGENT";
    userSentiment = "FRUSTRATED";
    reasonForEscalation = isTurnExceeded 
      ? `Conversation limit exceeded. Turning support focus to live specialist line.` 
      : userRequestedLive 
        ? "Explicit user recommendation to transfer to live support engineer."
        : "Critical slowdown and customer frustration detected.";
    
    replyText = `Hello ${clientFirstName}, I want to make sure you have the absolute best assistance right away. I am connecting you to one of our live senior specialist agents who will step in right now to help you directly. Please hold for just a moment while I transfer you.`;
  }

  return res.json({
    replyText,
    suggestedCategory,
    userSentiment,
    escalationRequired,
    action,
    reasonForEscalation,
    missingDetailsToAsk
  });
}

// Vite and Static File Server configuration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Create Vite server in middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    // Use Vite's connect instance as middleware
    app.use(vite.middlewares);
    console.log("Vite development server loaded as Express middleware.");
  } else {
    // Production client asset routing
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Production static files router loaded serving from /dist folder.");
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OmniSupport AI Server] Full Stack Container initialized at http://localhost:${PORT}`);
  });
}

startServer();
