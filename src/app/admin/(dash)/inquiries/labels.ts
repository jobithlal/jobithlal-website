export const statusLabels = {
  NEW: "New",
  CONTACTED: "Contacted",
  IN_DISCUSSION: "In discussion",
  PROPOSAL_SENT: "Proposal sent",
  WON: "Won",
  CLOSED: "Closed",
} as const;

export const statusTone = {
  NEW: "accent",
  CONTACTED: "neutral",
  IN_DISCUSSION: "neutral",
  PROPOSAL_SENT: "warn",
  WON: "accent",
  CLOSED: "muted",
} as const;

export const emailStatusLabels = {
  PENDING: "Sending…",
  SENT: "Emailed",
  FAILED: "Email failed",
  NOT_CONFIGURED: "Email not set up",
  SKIPPED: "Not sent",
} as const;
