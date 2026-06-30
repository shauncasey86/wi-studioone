"use client";

import { useActionState } from "react";
import "../admin.css";
import { login } from "@/lib/admin/actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, {});
  return (
    <div className="admin admin-login">
      <div className="login-wrap">
        <span className="brand">
          Studio<span className="hr">ONE</span>
        </span>
        <h1 style={{ marginTop: "0.6rem" }}>
          The <em>admin.</em>
        </h1>
        <p className="muted" style={{ marginTop: "0.4rem" }}>
          Sign in to manage the site.
        </p>
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
