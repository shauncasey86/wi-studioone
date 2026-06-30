"use client";

import { useActionState } from "react";
import "../admin.css";
import { login } from "@/lib/admin/actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, {});
  return (
    <div className="admin">
      <div className="login-wrap">
        <h1>StudioONE admin</h1>
        <p className="muted">Sign in to manage the site.</p>
        <form action={formAction}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          {state?.error ? (
            <p className="err" style={{ marginTop: "0.8rem" }}>
              {state.error}
            </p>
          ) : null}
          <div style={{ marginTop: "1.2rem" }}>
            <button className="btn" type="submit" disabled={pending}>
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
