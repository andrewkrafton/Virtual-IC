// Orchestration Engine
// Manages the multi-agent debate flow: parallel Phase 1, sequential Phase 2, etc.

import Anthropic from "@anthropic-ai/sdk";
import { AgentId, AgentMessage, Deal, PhaseId } from "@/types";
import { getSystemPrompt } from "./prompts";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-sonnet-4-20250514";

// Build the user message for an agent based on deal context and phase
function buildUserMessage(deal: Deal, agentId: AgentId, phase: PhaseId, round?: number): string {
  let msg = `## 딜 기본 정보\n`;
  msg += `- 회사명: ${deal.companyName}\n`;
  msg += `- 장르: ${deal.genre}\n`;
  msg += `- 플랫폼: ${deal.platform}\n`;
  msg += `- 투자 라운드: ${deal.round}\n`;
  msg += `- 예상 투자금액: ${deal.estimatedAmount}\n`;
  msg += `- 소재지: ${deal.location}\n`;
  if (deal.additionalContext) {
    msg += `- 추가 컨텍스트: ${deal.additionalContext}\n`;
  }

  // Add parsed file contents
  if (deal.files.length > 0) {
    msg += `\n## 업로드된 자료\n`;
    for (const file of deal.files) {
      if (file.parsedContent) {
        msg += `\n### ${file.name} (${file.category})\n${file.parsedContent}\n`;
      }
    }
  }

  // Phase-specific instructions
  if (phase === 1) {
    msg += `\n## 지시사항\nPhase 1 독립 분석을 수행하세요. 위 자료를 기반으로 당신의 전문 영역에서 1차 분석을 제공해주세요.`;
  } else if (phase === 2) {
    // Include previous discussion history
    const history = deal.messages
      .filter((m) => m.phase <= phase)
      .map((m) => `[${m.agentId}] ${m.content}`)
      .join("\n\n");
    msg += `\n## 이전 토론 내역\n${history}`;
    msg += `\n\n## 지시사항\nPhase 2 라운드 ${round}입니다. 이전 토론 내역을 참고하여 토론에 참여하세요.`;
  } else if (phase === 3) {
    const history = deal.messages
      .map((m) => `[${m.agentId}] ${m.content}`)
      .join("\n\n");
    msg += `\n## 전체 토론 내역\n${history}`;
    msg += `\n\n## 지시사항\nPhase 3입니다. 토론 결과를 바탕으로 Go/No-Go 의견과 확신 등급, 핵심 리스크를 제출하세요.`;
  } else if (phase === 4) {
    const history = deal.messages
      .map((m) => `[${m.agentId}] ${m.content}`)
      .join("\n\n");
    msg += `\n## 전체 토론 내역\n${history}`;
    msg += `\n\n## 지시사항\nPhase 4입니다. 전체 논의를 종합하여 토론 요약과 IC Memo를 생성하세요.`;
  }

  return msg;
}

// Call a single agent
export async function callAgent(
  deal: Deal,
  agentId: AgentId,
  phase: PhaseId,
  round?: number
): Promise<string> {
  const systemPrompt = getSystemPrompt(agentId, phase);
  const userMessage = buildUserMessage(deal, agentId, phase, round);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text || "";
}

// Call a single agent with streaming
export async function callAgentStream(
  deal: Deal,
  agentId: AgentId,
  phase: PhaseId,
  round?: number
): AsyncGenerator<string> {
  const systemPrompt = getSystemPrompt(agentId, phase);
  const userMessage = buildUserMessage(deal, agentId, phase, round);

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  return stream;
}

// Phase 1: Call all analysis agents in parallel (excluding moderator)
export async function runPhase1(deal: Deal): Promise<AgentMessage[]> {
  const analysisAgents: AgentId[] = ["game", "financial", "legal", "devil"];
  
  // Devil's Advocate doesn't do Phase 1 analysis (only listens)
  const phase1Agents: AgentId[] = ["game", "financial", "legal"];

  const results = await Promise.all(
    phase1Agents.map(async (agentId) => {
      const content = await callAgent(deal, agentId, 1);
      return {
        id: crypto.randomUUID(),
        agentId,
        phase: 1 as PhaseId,
        content,
        timestamp: new Date(),
      };
    })
  );

  return results;
}

// Phase 2: Sequential debate rounds
export async function runPhase2Round(
  deal: Deal,
  round: number
): Promise<AgentMessage[]> {
  const debateOrder: AgentId[] = ["game", "financial", "legal", "devil", "moderator"];
  const messages: AgentMessage[] = [];

  for (const agentId of debateOrder) {
    // Update deal with messages from this round so far
    const updatedDeal = { ...deal, messages: [...deal.messages, ...messages] };
    const content = await callAgent(updatedDeal, agentId, 2, round);
    
    messages.push({
      id: crypto.randomUUID(),
      agentId,
      phase: 2,
      round,
      content,
      timestamp: new Date(),
    });
  }

  return messages;
}

// Phase 3: Risk assessment (parallel)
export async function runPhase3(deal: Deal): Promise<AgentMessage[]> {
  const votingAgents: AgentId[] = ["game", "financial", "legal"];

  const results = await Promise.all(
    votingAgents.map(async (agentId) => {
      const content = await callAgent(deal, agentId, 3);
      return {
        id: crypto.randomUUID(),
        agentId,
        phase: 3 as PhaseId,
        content,
        timestamp: new Date(),
      };
    })
  );

  return results;
}

// Phase 4: IC Memo generation (moderator only)
export async function runPhase4(deal: Deal): Promise<AgentMessage> {
  const content = await callAgent(deal, "moderator", 4);
  return {
    id: crypto.randomUUID(),
    agentId: "moderator",
    phase: 4,
    content,
    timestamp: new Date(),
  };
}
