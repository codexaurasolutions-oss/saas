import { useRef, useState } from "react";
import { Upload, X, Image } from "lucide-react";
import { api } from "../api/client";

export default function ImageUploader({ label, value, onChange, hint, uploadEndpoint = "/owner/branding/logo", deleteEndpoint, style = {} }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5MB."); return; }
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await api.post(uploadEndpoint, fd, { headers: { "Content-Type": "multipart/form-data" } });
      onChange(res.data.url);
    } catch (err) {
      setError(err?.response?.data?.message || "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleRemove = async () => {
    if (deleteEndpoint && value) {
      try { await api.delete(deleteEndpoint); } catch {}
    }
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div style={{ marginBottom: 16, ...style }}>
      {label && <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: 6 }}>{label}</label>}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !value && inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? "#6366f1" : "#e2e8f0"}`,
          borderRadius: 12,
          padding: value ? 8 : 24,
          background: dragOver ? "#f5f3ff" : "#f8fafc",
          cursor: value ? "default" : "pointer",
          textAlign: "center",
          transition: "all 0.2s",
          position: "relative"
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {value ? (
          <div style={{ position: "relative", display: "inline-block" }}>
            <img
              src={value}
              alt="Preview"
              style={{ maxWidth: 160, maxHeight: 120, borderRadius: 8, objectFit: "cover", display: "block" }}
            />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleRemove(); }}
              style={{
                position: "absolute", top: -6, right: -6,
                width: 22, height: 22, borderRadius: "50%",
                background: "#ef4444", color: "#fff",
                border: "2px solid #fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: 10
              }}
            >
              <X size={12} />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              style={{
                display: "block", marginTop: 8, fontSize: "0.75rem",
                color: "#6366f1", fontWeight: 600, background: "none", border: "none", cursor: "pointer"
              }}
            >
              Change image
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            {uploading ? (
              <div style={{ fontSize: "0.8rem", color: "#6366f1", fontWeight: 600 }}>Uploading...</div>
            ) : (
              <>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Upload size={20} color="#6366f1" />
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Drag & drop or <span style={{ color: "#6366f1", fontWeight: 600 }}>click to browse</span>
                </div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>PNG, JPG, WebP up to 5MB</div>
              </>
            )}
          </div>
        )}
      </div>
      {error && <div style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: 4 }}>{error}</div>}
      {hint && !value && <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}
