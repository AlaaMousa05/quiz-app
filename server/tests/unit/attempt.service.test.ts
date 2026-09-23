import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  computeDeadlineAt,
  isWithinGracePeriod,
  canStartAttempt,
  resolveAttemptOnRead,
  GRACE_PERIOD_MS,
} from "../../src/services/attempt.service.js";
import { Q1, Q2, Q3, answer } from "./scoring.service.fixtures.js";

const { Decimal } = Prisma;

// Pure timing/deadline logic only — no DB, no Express. Every case is driven
// by explicit Date values (an injected clock reading) rather than real
// wall-clock time, per traceability.md's "attempt.spec" names below.

describe("attempt.spec: countdown enforces server-recorded deadline", () => {
  it("deadline = startedAt + timeLimitMinutes when the time limit is the binding constraint", () => {
    const startedAt = new Date("2026-01-10T09:00:00.000Z");
    const closesAt = new Date("2026-01-10T23:59:59.000Z"); // far later than the limit
    const deadline = computeDeadlineAt(startedAt, 20, closesAt);
    expect(deadline).toEqual(new Date("2026-01-10T09:20:00.000Z"));
  });

  it("deadline = closesAt when closesAt is the binding constraint (started late in the window)", () => {
    const startedAt = new Date("2026-01-10T09:55:00.000Z");
    const closesAt = new Date("2026-01-10T10:00:00.000Z"); // 5 min away, less than the 20-min limit
    const deadline = computeDeadlineAt(startedAt, 20, closesAt);
    expect(deadline).toEqual(closesAt);
  });

  it("deadline never exceeds closesAt even when it exactly equals startedAt + limit", () => {
    const startedAt = new Date("2026-01-10T09:00:00.000Z");
    const closesAt = new Date("2026-01-10T09:20:00.000Z");
    const deadline = computeDeadlineAt(startedAt, 20, closesAt);
    expect(deadline).toEqual(closesAt);
  });
});

describe("attempt.spec: submission within 10s grace after deadline is accepted", () => {
  const deadlineAt = new Date("2026-01-10T09:20:00.000Z");

  it("accepts a save/submit arriving exactly at the deadline", () => {
    expect(isWithinGracePeriod(deadlineAt, deadlineAt)).toBe(true);
  });

  it("accepts a save/submit arriving 9s after the deadline", () => {
    const now = new Date(deadlineAt.getTime() + 9_000);
    expect(isWithinGracePeriod(now, deadlineAt)).toBe(true);
  });

  it("accepts a save/submit arriving exactly at the 10s grace boundary", () => {
    const now = new Date(deadlineAt.getTime() + GRACE_PERIOD_MS);
    expect(isWithinGracePeriod(now, deadlineAt)).toBe(true);
  });

  it("rejects a save/submit arriving 11s after the deadline (past the grace window)", () => {
    const now = new Date(deadlineAt.getTime() + 11_000);
    expect(isWithinGracePeriod(now, deadlineAt)).toBe(false);
  });

  it("accepts a save/submit arriving before the deadline at all", () => {
    const now = new Date(deadlineAt.getTime() - 60_000);
    expect(isWithinGracePeriod(now, deadlineAt)).toBe(true);
  });
});

describe("attempt.spec: starting a new attempt after closes_at is blocked even within the grace window", () => {
  const opensAt = new Date("2026-01-10T09:00:00.000Z");
  const closesAt = new Date("2026-01-10T10:00:00.000Z");

  it("rejects a start request before opensAt", () => {
    const now = new Date(opensAt.getTime() - 1_000);
    expect(canStartAttempt(now, opensAt, closesAt)).toBe(false);
  });

  it("allows a start request within [opensAt, closesAt]", () => {
    const now = new Date(opensAt.getTime() + 1_000);
    expect(canStartAttempt(now, opensAt, closesAt)).toBe(true);
  });

  it("rejects a start request after closesAt", () => {
    const now = new Date(closesAt.getTime() + 1_000);
    expect(canStartAttempt(now, opensAt, closesAt)).toBe(false);
  });

  it("still rejects a start request within what would be the 10s grace window after closesAt", () => {
    const now = new Date(closesAt.getTime() + GRACE_PERIOD_MS - 1_000);
    expect(canStartAttempt(now, opensAt, closesAt)).toBe(false);
  });
});

describe("attempt.spec: auto-finalizes at deadline with recorded answers", () => {
  const deadlineAt = new Date("2026-01-10T09:20:00.000Z");
  const questions = [Q1, Q2, Q3];
  const negMarking = { enabled: true, penalty: new Decimal(0.25) };

  it("leaves an IN_PROGRESS attempt untouched while still within the grace window", () => {
    const now = new Date(deadlineAt.getTime() + 5_000);
    const result = resolveAttemptOnRead(
      { status: "IN_PROGRESS", deadlineAt, questions, answers: [answer("q1", "A")], negMarking },
      now,
    );
    expect(result).toEqual({ status: "IN_PROGRESS", score: null });
  });

  it("finalizes an IN_PROGRESS attempt once the grace window has fully elapsed, scoring the saved answers", () => {
    const now = new Date(deadlineAt.getTime() + GRACE_PERIOD_MS + 1_000);
    const answers = [answer("q1", "A"), answer("q2", "D"), answer("q3", null)];
    const result = resolveAttemptOnRead({ status: "IN_PROGRESS", deadlineAt, questions, answers, negMarking }, now);

    // Q1 correct +10, Q2 wrong -(0.25*20)=-5, Q3 unanswered 0 -> 5
    expect(result.status).toBe("AUTO_FINALIZED");
    expect(result.score?.toNumber()).toBe(5);
  });

  it("does not re-score an attempt that is already SUBMITTED", () => {
    const now = new Date(deadlineAt.getTime() + 60_000);
    const result = resolveAttemptOnRead(
      { status: "SUBMITTED", deadlineAt, questions, answers: [answer("q1", "A")], negMarking },
      now,
    );
    expect(result).toEqual({ status: "SUBMITTED", score: null });
  });

  it("does not re-score an attempt that is already AUTO_FINALIZED", () => {
    const now = new Date(deadlineAt.getTime() + 60_000);
    const result = resolveAttemptOnRead(
      { status: "AUTO_FINALIZED", deadlineAt, questions, answers: [answer("q1", "A")], negMarking },
      now,
    );
    expect(result).toEqual({ status: "AUTO_FINALIZED", score: null });
  });
});
