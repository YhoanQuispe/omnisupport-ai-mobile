/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SubscriptionTier = 'ENTERPRISE_SLA' | 'BUSINESS_DELUXE' | 'STANDARD_FREE';

export interface UserCRMProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  subscriptionTier: SubscriptionTier;
   SLA_ResponseTimeMins: number;
  purchaseHistory: Array<{
    id: string;
    product: string;
    date: string;
    amount: number;
    status: 'Delivered' | 'Shipped' | 'Pending' | 'Cancelled';
  }>;
  activeDeployments: Array<{
    id: string;
    name: string;
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    region: string;
    version: string;
  }>;
}

export interface TelemetryLog {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  service: string;
  message: string;
  code?: string;
}

export interface Ticket {
  id: string;
  title: string;
  category: 'TECHNICAL' | 'BILLING' | 'ACCOUNT' | 'FEEDBACK' | 'GENERAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  createdAt: string;
  lastUpdated: string;
  description: string;
}

export interface Attachment {
  name: string;
  type: string;
  size: string;
  dataUrl?: string; // base64 representation of attached image/file
}

export interface Message {
  id: string;
  sender: 'USER' | 'AI' | 'AGENT';
  text: string;
  timestamp: string;
  status?: 'SENT' | 'DELIVERED' | 'READ';
  attachments?: Attachment[];
  rawLLMResponse?: any; // To inspect raw structured JSON response
  originalText?: string; // Before PII masking (for debug comparison)
  assignedAgentName?: string; // Dynamic assigned agent
}

export interface SupportSession {
  id: string;
  activeTicket: Ticket | null;
  messages: Message[];
  turnCount: number;
  isEscalated: boolean;
  assignedAgentName?: string;
  createdAt: string;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  tags: string[];
}
