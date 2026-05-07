import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import type { RegistrationDetailResponse } from "@/types/crm";
import {
  buildRegistrantInfoPatchPayload,
  formStateFromRow,
  type RegistrantInfoFormState,
} from "./form-state";

export function useRegistrantInfoEdit(
  reference: string,
  row: RegistrationDetailResponse,
  onReloadRegistration: () => void | Promise<void>,
) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<RegistrantInfoFormState>(() =>
    formStateFromRow(row),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setDraft(formStateFromRow(row));
    }
  }, [row, isEditing]);

  const beginEdit = useCallback(() => {
    setDraft(formStateFromRow(row));
    setIsEditing(true);
  }, [row]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setDraft(formStateFromRow(row));
  }, [row]);

  const saveEdit = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/registrations/${encodeURIComponent(reference)}/registrant-info`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildRegistrantInfoPatchPayload(draft)),
        },
      );
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Save failed");
      }
      toast.success("Registrant information saved.");
      setIsEditing(false);
      await onReloadRegistration();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }, [reference, draft, onReloadRegistration]);

  return {
    isEditing,
    draft,
    setDraft,
    saving,
    beginEdit,
    cancelEdit,
    saveEdit,
  };
}
