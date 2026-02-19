// Agent definitions and types for Virtual IC

export type AgentId = "game" | "financial" | "legal" | "devil" | "moderator";

export type ConvictionRating =
  | "Strong Positive"
  | "Positive"
  | "Neutral"
  | "Negative"
  | "Strong Negative"
  | "N/A";

export interface Agent {
  id: AgentId;
  name: string;
  nameKr: string;
  icon: string;
  color: string;
  bgLight: string;
  description: string;
  hasVote: boolean; // Devil's Advocate doesn't vote
}

export const AGENTS: Record<AgentId, Agent> = {
  game: {
    id: "game",
    name: "Game Domain Expert",
    nameKr: "게임 도메인 전문가",
    icon: "🎮",
    color: "#6366f1",
    bgLight: "#eef2ff",
    description: "게임 프로덕트 품질, 시장성, 팀 역량 평가",
    hasVote: true,
  },
  financial: {
    id: "financial",
    name: "Financial Analyst",
    nameKr: "재무 분석가",
    icon: "📊",
    color: "#0891b2",
    bgLight: "#ecfeff",
    description: "밸류에이션, 재무 건전성, 딜 구조 분석",
    hasVote: true,
  },
  legal: {
    id: "legal",
    name: "Legal Advisor",
    nameKr: "법률 자문가",
    icon: "⚖️",
    color: "#7c3aed",
    bgLight: "#f5f3ff",
    description: "법적 리스크, 규제, IP, 계약 검토",
    hasVote: true,
  },
  devil: {
    id: "devil",
    name: "Devil's Advocate",
    nameKr: "악마의 대변인",
    icon: "🔥",
    color: "#dc2626",
    bgLight: "#fef2f2",
    description: "반론 제기, 가정 도전, 리스크 발굴",
    hasVote: false,
  },
  moderator: {
    id: "moderator",
    name: "Moderator",
    nameKr: "IC 의장",
    icon: "🎯",
    color: "#0f766e",
    bgLight: "#f0fdfa",
    description: "토론 조율, 종합, IC Memo 생성",
    hasVote: false,
  },
};

// Debate phases
export type PhaseId = 1 | 2 | 3 | 4;

export interface Phase {
  id: PhaseId;
  name: string;
  nameKr: string;
  description: string;
}

export const PHASES: Phase[] = [
  { id: 1, name: "Independent Analysis", nameKr: "독립 분석", description: "각 에이전트가 자기 영역에서 1차 분석 수행" },
  { id: 2, name: "Structured Debate", nameKr: "구조화 토론", description: "에이전트 간 토론 및 Devil's Advocate 반론" },
  { id: 3, name: "Risk Assessment", nameKr: "리스크 평가", description: "Go/No-Go 투표 및 리스크 점수화" },
  { id: 4, name: "IC Memo", nameKr: "IC Memo 생성", description: "최종 투자 검토 보고서 생성" },
];

// Message from an agent
export interface AgentMessage {
  id: string;
  agentId: AgentId;
  phase: PhaseId;
  round?: number;
  content: string;
  timestamp: Date;
  conviction?: ConvictionRating;
}

// Deal data
export interface Deal {
  id: string;
  companyName: string;
  genre: string;
  platform: string;
  round: string;
  estimatedAmount: string;
  location: string;
  additionalContext?: string;
  files: UploadedFile[];
  messages: AgentMessage[];
  status: "draft" | "analyzing" | "debating" | "complete";
  currentPhase: PhaseId;
  votes?: Record<AgentId, ConvictionRating>;
  overallVerdict?: ConvictionRating;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  category: "pitchdeck" | "financials" | "captable" | "screenshot" | "other";
  parsedContent?: string;
}

// Agent output structure (JSON from Claude API)
export interface AgentOutput {
  agent_id: AgentId;
  phase: PhaseId;
  round?: number;
  analysis: string;
  conviction?: ConvictionRating;
  key_risks?: { risk: string; severity: "High" | "Medium" | "Low"; rationale: string }[];
  questions?: string[];
}
