"use client";

import { useActionState, useEffect, useRef } from "react";
import { createSubAdmin, type TeamActionState } from "@/lib/admin/team-actions";

export default function CreateSubAdminForm() {
  const [state, action, pending] = useActionState<TeamActionState, FormData>(
    createSubAdmin,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the fields once a sub-admin has been added.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form action={action} ref={formRef}>
      <fieldset>
        <legend>Add a sub-admin</legend>
        <div className="admin-grid">
          <div>
            <label htmlFor="sa-name">Name (optional)</label>
            <input id="sa-name" name="name" type="text" autoComplete="name" />
          </div>
          <div>
            <label htmlFor="sa-email">Email</label>
            <input
              id="sa-email"
              name="email"
              type="email"
              autoComplete="off"
              required
            />
          </div>
        </div>
        <label htmlFor="sa-password">Temporary password</label>
        <input
          id="sa-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
        />
        <p className="hint">
          At least 10 characters. Share it with them securely; they can&apos;t
          change it themselves, so use Reset password when they need a new one.
        </p>

        {state.error && (
          <p className="err" style={{ marginTop: "0.8rem" }}>
            {state.error}
          </p>
        )}
        {state.ok && (
          <p className="ok" style={{ marginTop: "0.8rem" }}>
            {state.ok}
          </p>
        )}

        <div style={{ marginTop: "1rem" }}>
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "Adding…" : "Add sub-admin"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
