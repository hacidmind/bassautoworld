"use client";

import { useState } from "react";

export function PasswordField() {
  const [visible, setVisible] = useState(false);

  return (
    <div className="field full">
      <label htmlFor="login-password">Password</label>
      <div style={{ position: "relative" }}>
        <input
          id="login-password"
          type={visible ? "text" : "password"}
          name="password"
          required
          autoComplete="current-password"
          style={{ width: "100%", paddingRight: 76 }}
        />
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-controls="login-password"
          onClick={() => setVisible((value) => !value)}
          style={{ position: "absolute", right: 4, top: 0, bottom: 0, minWidth: 64, background: "transparent" }}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}
