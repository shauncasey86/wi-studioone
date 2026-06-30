"use client";

import { useState } from "react";
import { rich } from "@/lib/richtext";

// A textarea for a rich field (*italic* / **bold** / [label](href)) with a live
// preview rendered through the same parser the public site uses.
export default function RichField({
  name,
  defaultValue,
  rows = 2,
}: {
  name: string;
  defaultValue: string;
  rows?: number;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  return (
    <div>
      <textarea
        name={name}
        rows={rows}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="hint">*italic* · **bold** · [label](href)</div>
      <div className="preview">{rich(value)}</div>
    </div>
  );
}
