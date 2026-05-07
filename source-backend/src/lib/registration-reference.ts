/** Public registration id in emails / bank refs — must match web `ackReferenceFromDraftId`. */
export function ackReferenceFromDraftId(draftId: string): string {
  return `ACK-${draftId.slice(0, 8).toUpperCase()}`;
}
