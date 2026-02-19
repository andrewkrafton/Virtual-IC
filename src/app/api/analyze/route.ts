// POST /api/analyze
// Starts the multi-agent analysis for a deal

import { NextRequest, NextResponse } from "next/server";
import { runPhase1, runPhase2Round, runPhase3, runPhase4 } from "@/lib/agents/orchestrator";
import { Deal, PhaseId } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const deal: Deal = await request.json();

    // TODO: In production, save deal to database and run analysis as background job
    // For MVP, run synchronously and return results

    const allMessages = [];

    // Phase 1: Independent Analysis (parallel)
    console.log("[Virtual IC] Starting Phase 1: Independent Analysis");
    const phase1Messages = await runPhase1(deal);
    allMessages.push(...phase1Messages);

    // Update deal with Phase 1 results
    deal.messages = [...deal.messages, ...phase1Messages];
    deal.currentPhase = 2;

    // Phase 2: Structured Debate (sequential, 2 rounds)
    console.log("[Virtual IC] Starting Phase 2: Structured Debate");
    for (let round = 1; round <= 2; round++) {
      console.log(`[Virtual IC] Phase 2 - Round ${round}`);
      const roundMessages = await runPhase2Round(deal, round);
      allMessages.push(...roundMessages);
      deal.messages = [...deal.messages, ...roundMessages];

      // TODO: Check moderator's recommendation to continue or conclude
    }

    deal.currentPhase = 3;

    // Phase 3: Risk Assessment (parallel)
    console.log("[Virtual IC] Starting Phase 3: Risk Assessment");
    const phase3Messages = await runPhase3(deal);
    allMessages.push(...phase3Messages);
    deal.messages = [...deal.messages, ...phase3Messages];
    deal.currentPhase = 4;

    // Phase 4: IC Memo Generation
    console.log("[Virtual IC] Starting Phase 4: IC Memo Generation");
    const phase4Message = await runPhase4(deal);
    allMessages.push(phase4Message);
    deal.messages = [...deal.messages, phase4Message];
    deal.status = "complete";

    console.log("[Virtual IC] Analysis complete");

    return NextResponse.json({
      success: true,
      messages: allMessages,
      deal,
    });
  } catch (error) {
    console.error("[Virtual IC] Analysis error:", error);
    return NextResponse.json(
      { success: false, error: "Analysis failed" },
      { status: 500 }
    );
  }
}
