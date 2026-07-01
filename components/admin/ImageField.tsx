"use client";

import { useState, useRef } from "react";
import { uploadMedia } from "@/lib/admin/actions";

// Image field: an editable URL plus an uploader. Uploading posts the file to the
// uploadMedia server action and fills the URL on success.
export default function ImageField({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("Uploading…");
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadMedia(fd);
    if (res.url) {
      setUrl(res.url);
      setStatus("Uploaded ✓");
    } else {
      setStatus(res.error || "Upload failed");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function onRemove() {
    setUrl("");
    setStatus(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div>
      <input
        type="text"
        name={name}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://… or upload below"
      />
      <div className="row" style={{ marginTop: "0.4rem" }}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onFile}
          style={{ color: "var(--a-dim)", fontSize: 12 }}
        />
        {url ? (
          <button type="button" className="ghost" onClick={onRemove}>
            Remove
          </button>
        ) : null}
        {status ? <span className="hint">{status}</span> : null}
      </div>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          style={{ marginTop: "0.5rem", maxHeight: 90, borderRadius: 4 }}
        />
      ) : null}
    </div>
  );
}
