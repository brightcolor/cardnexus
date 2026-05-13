/**
 * Structured audit logger for admin/privileged actions.
 * Outputs JSON to stdout — visible in Docker logs and parseable by log
 * aggregators. No DB writes: keeps this simple and zero-overhead.
 *
 * Usage:
 *   auditLog("user.delete", actorId, { targetId: userId, targetEmail: "..." });
 */

export type AuditAction =
  | "user.delete"
  | "user.ban"
  | "user.unban"
  | "user.role_change"
  | "user.plan_change"
  | "user.org_change"
  | "card.delete"
  | "card.approve"
  | "card.reject";

export function auditLog(
  action: AuditAction,
  actorId: string,
  data: Record<string, unknown>
) {
  // Use process.stdout.write so it always goes to the container log regardless
  // of NODE_ENV and is never swallowed by a test framework.
  const entry = JSON.stringify({
    level: "AUDIT",
    timestamp: new Date().toISOString(),
    action,
    actorId,
    ...data,
  });
  process.stdout.write(entry + "\n");
}
