import { extractIndianPhoneDigits, normalizeIndianPhoneInputDigits } from "../utils/phone";

export default function IndianPhoneInput({
  value,
  onChange,
  placeholder = "9876543210",
  required = false,
  disabled = false,
  className = "",
  style = {},
  inputStyle = {},
  name,
  id
}) {
  const digits = extractIndianPhoneDigits(value);

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        border: "1px solid #cbd5e1",
        borderRadius: 8,
        background: disabled ? "#f8fafc" : "#fff",
        overflow: "hidden",
        ...style
      }}
    >
      <span
        style={{
          padding: "10px 12px",
          background: "#f8fafc",
          color: "#475569",
          fontWeight: 700,
          borderRight: "1px solid #e2e8f0",
          whiteSpace: "nowrap"
        }}
      >
        +91
      </span>
      <input
        id={id}
        name={name}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        required={required}
        disabled={disabled}
        value={digits}
        maxLength={10}
        placeholder={placeholder}
        onChange={(event) => onChange?.(`+91${normalizeIndianPhoneInputDigits(event.target.value)}`)}
        style={{
          flex: 1,
          border: "none",
          outline: "none",
          padding: "10px 14px",
          fontSize: "0.95rem",
          background: "transparent",
          ...inputStyle
        }}
      />
    </div>
  );
}
