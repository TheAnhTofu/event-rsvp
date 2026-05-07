import type { PipelineFilter } from "@/lib/admin/registrant-list/types";

/** Third menu item — opens Update Status panel (bulk confirm uses `/api/admin/registrations/confirm`). */
export function getThirdRowActionLabel(_stage: PipelineFilter): string {
  return "Update Status";
}
