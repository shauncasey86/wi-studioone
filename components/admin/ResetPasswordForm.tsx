"use client";

import { useActionState } from "react";
import {
  resetSubAdminPassword,
  type TeamActionState,
} from "@/lib/admin/team-actions";

// A per-row disclosure: reveal a single password field to reset one sub-admin's
// password without navigating away.
export default function ResetPasswordForm({
  id,
  label,
}: {
  id: string;
  label: string;
}) {
  const [state, action, pending] = useActionState<TeamActionState, FormData>(
    resetSubAdminPassword,
    {},
  );

  return (
    <details className="admin-reset">
      <summary className="btn ghost">Reset password</summary>
      <form action={action} className="admin-reset-form">
        <input type="hidden" name="id" value={id} />
        <label htmlFor={`reset-${id}`}>New password for {label}</label>
        <input
          id={`reset-${id}`}
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
        />
        {state.error && <p className="err">{state.error}</p>}
        {state.ok && <p className="ok">{state.ok}</p>}
        <div style={{ marginTop: "0.7rem" }}>
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "Saving…" : "Set new password"}
          </button>
        </div>
      </form>
    </details>
  );
}
