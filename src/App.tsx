import React, { useState, useEffect, useCallback, useRef, ReactNode } from "react";

// ============================================
// CONSTANTS & CONFIG
// ============================================
const QR_SIZE = 1024; // High resolution for scanning
const PREVIEW_SIZE = 256; // Preview display size
const LOGO_SIZE = 288; // Scaled for 1024px QR
const LOGO_CORNER_RADIUS = 40;
const LOGO_PADDING = 16;
const RENDER_DELAY = 120;
const CLIPBOARD_TIMEOUT = 2000;

// Extend CanvasRenderingContext2D with roundRect
declare global {
  interface CanvasRenderingContext2D {
    roundRect(x: number, y: number, w: number, h: number, r: number): CanvasRenderingContext2D;
  }
}

// Polyfill for roundRect (for older browsers)
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x: number, y: number, w: number, h: number, r: number) {
    const maxR = Math.min(w, h) / 2;
    const radius = Math.min(r, maxR);
    
    if (w < 2 * radius) {
      this.moveTo(x, y);
      this.lineTo(x + w, y);
      this.lineTo(x + w, y + h);
      this.lineTo(x, y + h);
    } else {
      this.moveTo(x + radius, y);
      this.arcTo(x + w, y, x + w, y + h, radius);
      this.arcTo(x + w, y + h, x, y + h, radius);
      this.arcTo(x, y + h, x, y, radius);
      this.arcTo(x, y, x + w, y, radius);
    }
    return this;
  };
}

// ============================================
// TYPES
// ============================================
interface TabConfig {
  id: string;
  ico: string;
  lbl: string;
}

interface FeatureConfig {
  ico: string;
  bg: string;
  t: string;
  d: string;
}

interface ColorScheme {
  navy: string;
  blue: string;
  mid: string;
  border: string;
  muted: string;
  lt: string;
  lighter: string;
  grad: string;
  gbtn: string;
}

// ============================================
// COLOR SCHEME
// ============================================
const C: ColorScheme = {
  navy: "#0f2560",
  blue: "#1565c0",
  mid: "#1a3a8f",
  border: "#d0daff",
  muted: "#6b7db3",
  lt: "#e8eeff",
  lighter: "#f0f4ff",
  grad: "linear-gradient(135deg,#0f2560,#1a3a8f,#1565c0)",
  gbtn: "linear-gradient(135deg,#1a3a8f,#1565c0)",
};
const BRAND_LOGO_URL = `${import.meta.env.BASE_URL}logo.png`;

// ============================================
// STYLES
// ============================================
const INP: React.CSSProperties = {
  width: "100%",
  background: "#f5f8ff",
  border: `1.5px solid ${C.border}`,
  borderRadius: 12,
  padding: "12px 16px",
  color: C.navy,
  fontSize: ".93rem",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const LBL: React.CSSProperties = {
  display: "block",
  fontSize: ".72rem",
  fontWeight: 700,
  color: C.muted,
  textTransform: "uppercase",
  letterSpacing: ".08em",
  marginBottom: 7,
};

// ============================================
// COMPONENTS
// ============================================
interface FldProps {
  label: string;
  children: ReactNode;
}

const Fld = ({ label, children }: FldProps) => (
  <div style={{ marginBottom: 16 }}>
    <label style={LBL}>{label}</label>
    {children}
  </div>
);

interface InpProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Inp = ({ label, ...props }: InpProps) => (
  <Fld label={label}>
    <input style={INP} {...props} />
  </Fld>
);

interface TexProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

const Tex = ({ label, ...props }: TexProps) => (
  <Fld label={label}>
    <textarea style={{ ...INP, resize: "vertical", minHeight: 88 }} {...props} />
  </Fld>
);

// ============================================
// CONSTANTS DATA
// ============================================
const TABS: TabConfig[] = [
  { id: "url", ico: "🔗", lbl: "URL" },
  { id: "text", ico: "💬", lbl: "Text" },
  { id: "contact", ico: "👤", lbl: "vCard" },
  { id: "wifi", ico: "📶", lbl: "Wi-Fi" },
  { id: "email", ico: "✉️", lbl: "Email" },
];

const FEATS: FeatureConfig[] = [
  { ico: "⚡", bg: "#eef2ff", t: "Instant Preview", d: "QR regenerates live with every keystroke." },
  { ico: "🔒", bg: "#e8f4ff", t: "Private & Secure", d: "All processing is local. Nothing is sent anywhere." },
  { ico: "✅", bg: "#e8faf0", t: "100% Free", d: "No sign-up, no watermark, free for everyone." },
  { ico: "🗂️", bg: "#fff8e6", t: "5 QR Formats", d: "URL, text, vCard, Wi-Fi, email, all in one tool." },
  { ico: "⬇️", bg: "#fff0f4", t: "PNG Download", d: "Save a crisp, print-ready PNG anytime." },
  { ico: "📱", bg: "#f3efff", t: "Universal Scanning", d: "Works on every iOS, Android and desktop reader." },
];

// ============================================
// HOOKS
// ============================================
function useQR(text: string, logo: string): string {
  const [dataURL, setDataURL] = useState<string>("");

  useEffect(() => {
    if (!text) {
      setDataURL("");
      return;
    }

    const render = () => {
      try {
        const div = document.createElement("div");
        div.style.cssText = "position:absolute;left:-9999px;top:-9999px;";
        document.body.appendChild(div);

        const QRCode = (window as any).QRCode;
        if (!QRCode) {
          console.error("QRCode library not loaded");
          document.body.removeChild(div);
          return;
        }

        new QRCode(div, {
          text,
          width: QR_SIZE,
          height: QR_SIZE,
          colorDark: "#0f2560",
          colorLight: "#ffffff",
          correctLevel: logo ? 3 : 1,
          margin: 2,
        });

        setTimeout(() => {
          try {
            const qrCanvas = div.querySelector("canvas") as HTMLCanvasElement | null;
            const qrImg = div.querySelector("img") as HTMLImageElement | null;
            const src = qrCanvas ? qrCanvas.toDataURL("image/png") : qrImg ? qrImg.src : null;

            if (div.parentNode) {
              document.body.removeChild(div);
            }

            if (!src) return;

            if (!logo) {
              setDataURL(src);
              return;
            }

            mergeLogoWithQR(src, logo, setDataURL);
          } catch (error) {
            console.error("Error processing QR code:", error);
            if (div.parentNode) {
              document.body.removeChild(div);
            }
          }
        }, RENDER_DELAY);
      } catch (error) {
        console.error("Error rendering QR code:", error);
      }
    };

    const loadQRLibrary = () => {
      if ((window as any).QRCode) {
        render();
        return;
      }

      const existing = document.getElementById("qrcodejs-script");
      if (existing) {
        existing.addEventListener("load", render);
        return;
      }

      const script = document.createElement("script");
      script.id = "qrcodejs-script";
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
      script.async = true;
      script.onload = render;
      script.onerror = () => console.error("Failed to load QR code library");
      document.head.appendChild(script);
    };

    loadQRLibrary();
  }, [text, logo]);

  return dataURL;
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function mergeLogoWithQR(
  qrDataURL: string,
  logoDataURL: string,
  onComplete: (dataURL: string) => void
): void {
  const canvas = document.createElement("canvas");
  canvas.width = QR_SIZE;
  canvas.height = QR_SIZE;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    console.error("Failed to get canvas context");
    return;
  }

  const qrImg = new Image();
  qrImg.crossOrigin = "anonymous";

  qrImg.onload = () => {
    try {
      // Enable high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(qrImg, 0, 0, QR_SIZE, QR_SIZE);

      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";

      logoImg.onload = () => {
        try {
          const size = LOGO_SIZE;
          const x = (QR_SIZE - size) / 2;
          const y = (QR_SIZE - size) / 2;

          ctx.fillStyle = "#ffffff";
          ctx.roundRect(
            x - LOGO_PADDING,
            y - LOGO_PADDING,
            size + LOGO_PADDING * 2,
            size + LOGO_PADDING * 2,
            LOGO_CORNER_RADIUS
          );
          ctx.fill();

          ctx.drawImage(logoImg, x, y, size, size);
          onComplete(canvas.toDataURL("image/png"));
        } catch (error) {
          console.error("Error drawing logo:", error);
        }
      };

      logoImg.onerror = () => {
        console.error("Failed to load logo image");
        onComplete(qrDataURL);
      };

      logoImg.src = logoDataURL;
    } catch (error) {
      console.error("Error processing QR with logo:", error);
    }
  };

  qrImg.onerror = () => {
    console.error("Failed to load QR image");
  };

  qrImg.src = qrDataURL;
}

function validateLogoFile(file: File | null | undefined): boolean {
  if (!file) return false;
  
  const MAX_SIZE = 5 * 1024 * 1024;
  const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];

  return ALLOWED_TYPES.includes(file.type) && file.size <= MAX_SIZE;
}

function sanitizeInput(input: string): string {
  return input.trim();
}

// ============================================
// MAIN APP COMPONENT
// ============================================
export default function App() {
  const [tab, setTab] = useState<string>("url");
  const [urlV, setUrlV] = useState<string>("");
  const [logo, setLogo] = useState<string>("");
  const [txtV, setTxtV] = useState<string>("");
  const [cFn, setCFn] = useState<string>("");
  const [cLn, setCLn] = useState<string>("");
  const [cPh, setCPh] = useState<string>("");
  const [cEm, setCEm] = useState<string>("");
  const [cOrg, setCOrg] = useState<string>("");
  const [cUrl, setCUrl] = useState<string>("");
  const [wSsid, setWSsid] = useState<string>("");
  const [wPass, setWPass] = useState<string>("");
  const [wSec, setWSec] = useState<string>("WPA");
  const [eTo, setETo] = useState<string>("");
  const [eSub, setESub] = useState<string>("");
  const [eBody, setEBody] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const buildData = useCallback((): string => {
    if (tab === "url") {
      const v = sanitizeInput(urlV);
      if (!v) return "";
      return /^https?:\/\//i.test(v) ? v : "https://" + v;
    }
    if (tab === "text") return sanitizeInput(txtV);
    if (tab === "contact") {
      const fn = sanitizeInput(cFn),
        ln = sanitizeInput(cLn),
        ph = sanitizeInput(cPh),
        em = sanitizeInput(cEm),
        org = sanitizeInput(cOrg),
        cu = sanitizeInput(cUrl);
      if (!fn && !ln && !ph && !em) return "";
      return [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${fn} ${ln}`,
        `N:${ln};${fn};;;`,
        org ? `ORG:${org}` : null,
        ph ? `TEL;TYPE=CELL:${ph}` : null,
        em ? `EMAIL:${em}` : null,
        cu ? `URL:${cu}` : null,
        "END:VCARD",
      ]
        .filter(Boolean)
        .join("\n");
    }
    if (tab === "wifi") {
      const s = sanitizeInput(wSsid);
      if (!s) return "";
      const esc = (v: string) =>
        v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/"/g, '\\"');
      if (wSec === "nopass") return `WIFI:T:nopass;S:${esc(s)};;;`;
      return `WIFI:T:${wSec};S:${esc(s)};P:${esc(wPass)};;`;
    }
    if (tab === "email") {
      const to = sanitizeInput(eTo);
      if (!to) return "";
      const parts: string[] = [];
      if (sanitizeInput(eSub)) parts.push("subject=" + encodeURIComponent(sanitizeInput(eSub)));
      if (sanitizeInput(eBody)) parts.push("body=" + encodeURIComponent(sanitizeInput(eBody)));
      return "mailto:" + to + (parts.length ? "?" + parts.join("&") : "");
    }
    return "";
  }, [tab, urlV, txtV, cFn, cLn, cPh, cEm, cOrg, cUrl, wSsid, wPass, wSec, eTo, eSub, eBody]);

  const data = buildData();
  const qrData = useQR(data, tab === "url" ? logo : "");

  const handleLogo = useCallback((file: File | null) => {
    if (!validateLogoFile(file)) {
      alert("Please upload a valid image (PNG, JPG, SVG) under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        setLogo(result);
      }
    };
    reader.onerror = () => {
      console.error("Failed to read file");
      alert("Failed to read file. Please try again.");
    };
    reader.readAsDataURL(file!);
  }, []);

  const clearAll = useCallback(() => {
    setUrlV("");
    setLogo("");
    setTxtV("");
    setCFn("");
    setCLn("");
    setCPh("");
    setCEm("");
    setCOrg("");
    setCUrl("");
    setWSsid("");
    setWPass("");
    setWSec("WPA");
    setETo("");
    setESub("");
    setEBody("");
  }, []);

  const download = useCallback(() => {
    if (!qrData) return;

    // Create a high-resolution canvas for downloading with frame
    const FRAME_WIDTH = 120; // White border frame width
    const canvasWithFrame = document.createElement("canvas");
    canvasWithFrame.width = QR_SIZE + FRAME_WIDTH * 2;
    canvasWithFrame.height = QR_SIZE + FRAME_WIDTH * 2;
    const frameCtx = canvasWithFrame.getContext("2d");

    if (!frameCtx) {
      console.error("Failed to get canvas context for download");
      return;
    }

    // Draw white background frame
    frameCtx.fillStyle = "#ffffff";
    frameCtx.fillRect(0, 0, canvasWithFrame.width, canvasWithFrame.height);

    // Draw a subtle border inside the frame
    frameCtx.strokeStyle = "#0f2560";
    frameCtx.lineWidth = 3;
    frameCtx.strokeRect(FRAME_WIDTH - 1.5, FRAME_WIDTH - 1.5, QR_SIZE + 3, QR_SIZE + 3);

    const qrImg = new Image();
    qrImg.crossOrigin = "anonymous";

    qrImg.onload = () => {
      // High-quality rendering
      frameCtx.imageSmoothingEnabled = true;
      frameCtx.imageSmoothingQuality = "high";
      frameCtx.drawImage(qrImg, FRAME_WIDTH, FRAME_WIDTH, QR_SIZE, QR_SIZE);

      // Download the framed QR code
      const link = document.createElement("a");
      link.download = "qr-code.png";
      link.href = canvasWithFrame.toDataURL("image/png", 1.0);
      link.click();
    };

    qrImg.onerror = () => {
      console.error("Failed to load QR code for download");
    };

    qrImg.src = qrData;
  }, [qrData]);

  const copyD = useCallback(() => {
    if (!data) return;
    navigator.clipboard
      .writeText(data)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), CLIPBOARD_TIMEOUT);
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        alert("Failed to copy to clipboard");
      });
  }, [data]);

  const scrollTo = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <div style={{ fontFamily: "'Segoe UI',system-ui,sans-serif", background: "#fff", color: C.navy, minHeight: "100vh" }}>
      {/* NAV */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 6%",
          height: 66,
          background: "#fff",
          borderBottom: `1.5px solid ${C.border}`,
          position: "sticky",
          top: 0,
          zIndex: 200,
          boxShadow: "0 2px 18px rgba(21,101,192,.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontWeight: 800, fontSize: "1.1rem" }}>
          <img
            src={BRAND_LOGO_URL}
            alt="Adusei Media Logo"
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              flexShrink: 0,
              objectFit: "contain",
            }}
          />
          My QR Generator
        </div>
        <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
          <a
            href="#how"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("how");
            }}
            style={{ color: C.muted, textDecoration: "none", fontSize: ".9rem", fontWeight: 500, cursor: "pointer" }}
          >
            How it works
          </a>
          <a
            href="#features"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("features");
            }}
            style={{ color: C.muted, textDecoration: "none", fontSize: ".9rem", fontWeight: 500, cursor: "pointer" }}
          >
            Features
          </a>
          <button
            onClick={() => scrollTo("generator")}
            style={{
              background: C.gbtn,
              color: "#fff",
              border: "none",
              padding: "10px 24px",
              borderRadius: 50,
              fontWeight: 700,
              fontSize: ".9rem",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Create QR Code
          </button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ textAlign: "center", padding: "96px 6% 72px", background: "linear-gradient(175deg,#eef2ff 0%,#f8faff 55%,#fff 100%)" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: C.lt,
            border: `1px solid ${C.border}`,
            borderRadius: 50,
            padding: "7px 20px",
            fontSize: ".8rem",
            color: C.mid,
            marginBottom: 28,
            fontWeight: 700,
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.blue, display: "inline-block" }} />
          100% Free · No Sign-up · Instant
        </div>
        <h1
          style={{
            fontSize: "clamp(2.2rem,5.5vw,3.8rem)",
            fontWeight: 900,
            lineHeight: 1.12,
            letterSpacing: "-.03em",
            marginBottom: 22,
            color: C.navy,
          }}
        >
          Create Your QR Code
          <br />
          <span style={{ background: C.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            In Seconds
          </span>
        </h1>
        <p style={{ color: C.muted, fontSize: "1.08rem", maxWidth: 540, margin: "0 auto 40px", lineHeight: 1.75 }}>
          Generate professional QR codes for URLs, contacts, Wi-Fi, and more.
          <br />
          Fully free. Designed by <strong style={{ color: C.blue }}>Adusei Media</strong>.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => scrollTo("generator")}
            style={{
              background: C.gbtn,
              color: "#fff",
              border: "none",
              padding: "15px 36px",
              borderRadius: 50,
              fontWeight: 700,
              fontSize: "1rem",
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 6px 26px rgba(21,101,192,.32)",
            }}
          >
            Create QR Code
          </button>
          <button
            onClick={() => scrollTo("how")}
            style={{
              background: "#fff",
              color: C.navy,
              border: `1.5px solid ${C.border}`,
              padding: "15px 36px",
              borderRadius: 50,
              fontWeight: 600,
              fontSize: "1rem",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            How it works
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 40, marginTop: 52, flexWrap: "wrap" }}>
          {[
            ["5", "QR Types"],
            ["Free", "Always"],
            ["PNG", "Download"],
          ].map(([n, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <span style={{ fontSize: "1.6rem", fontWeight: 900, color: C.blue, display: "block" }}>{n}</span>
              <span style={{ fontSize: ".8rem", color: "#9aaccf" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* GENERATOR */}
      <div id="generator" style={{ padding: "0 6% 90px" }}>
        <div
          style={{
            maxWidth: 1060,
            margin: "0 auto",
            background: "#fff",
            border: `1.5px solid ${C.border}`,
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 16px 70px rgba(21,101,192,.12)",
          }}
        >
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: `1.5px solid ${C.border}`, overflowX: "auto", background: C.lighter }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "15px 22px",
                  fontSize: ".88rem",
                  fontWeight: 600,
                  color: tab === t.id ? C.blue : C.muted,
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  borderBottom: tab === t.id ? `2.5px solid ${C.blue}` : "2.5px solid transparent",
                  whiteSpace: "nowrap",
                  fontFamily: "inherit",
                  transition: "all .2s",
                }}
              >
                {t.ico} {t.lbl}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            {/* LEFT */}
            <div style={{ padding: 38, borderRight: `1.5px solid ${C.border}` }}>
              {tab === "url" && (
                <>
                  <Inp
                    label="Website URL"
                    value={urlV}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrlV(e.target.value)}
                    placeholder="https://adusemedia.com"
                  />
                  <p style={{ color: "#aaa", fontSize: ".74rem", marginTop: -8, marginBottom: 20 }}>
                    https:// added automatically if missing.
                  </p>

                  <Fld label="Company Logo (optional)">
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label="Upload company logo"
                      onClick={() => logoInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          logoInputRef.current?.click();
                        }
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleLogo(e.dataTransfer.files[0] || null);
                      }}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        border: `2px dashed ${C.border}`,
                        borderRadius: 14,
                        padding: "22px 16px",
                        cursor: "pointer",
                        background: C.lighter,
                      }}
                    >
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => handleLogo(e.target.files?.[0] || null)}
                      />
                      {logo ? (
                        <img src={logo} alt="logo" style={{ width: 64, height: 64, objectFit: "contain", borderRadius: 10 }} />
                      ) : (
                        <>
                          <div style={{ fontSize: 28 }}>🖼️</div>
                          <span style={{ fontSize: ".8rem", color: C.muted, textAlign: "center" }}>
                            Click or drag to upload logo
                            <br />
                            <span style={{ fontSize: ".72rem", color: "#bbb" }}>PNG, JPG, SVG supported</span>
                          </span>
                        </>
                      )}
                    </div>
                  </Fld>
                  {logo && (
                    <button
                      onClick={() => setLogo("")}
                      style={{
                        width: "100%",
                        padding: "9px",
                        borderRadius: 10,
                        border: "1.5px solid #fcd",
                        background: "#fff8f8",
                        color: "#c0392b",
                        fontSize: ".82rem",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        marginBottom: 4,
                      }}
                    >
                      Remove Logo
                    </button>
                  )}
                </>
              )}

              {tab === "text" && <Tex label="Text Content" value={txtV} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTxtV(e.target.value)} placeholder="Enter any text to encode" />}

              {tab === "contact" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Inp label="First Name" value={cFn} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCFn(e.target.value)} placeholder="Kwame" />
                    <Inp label="Last Name" value={cLn} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCLn(e.target.value)} placeholder="Adusei" />
                  </div>
                  <Inp label="Phone" value={cPh} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCPh(e.target.value)} placeholder="+233 24 000 0000" />
                  <Inp label="Email Address" value={cEm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCEm(e.target.value)} placeholder="hello@adusemedia.com" />
                  <Inp label="Organisation" value={cOrg} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCOrg(e.target.value)} placeholder="Adusei Media" />
                  <Inp label="Website" value={cUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCUrl(e.target.value)} placeholder="https://adusemedia.com" />
                </>
              )}

              {tab === "wifi" && (
                <>
                  <Inp label="Network Name (SSID)" value={wSsid} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWSsid(e.target.value)} placeholder="MyHomeNetwork" />
                  <Inp label="Password" type="password" value={wPass} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWPass(e.target.value)} placeholder="Wi-Fi password" />
                  <Fld label="Security Type">
                    <select value={wSec} onChange={(e) => setWSec(e.target.value)} style={{ ...INP }}>
                      <option value="WPA">WPA / WPA2</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">None (open network)</option>
                    </select>
                  </Fld>
                  <p style={{ color: "#aaa", fontSize: ".74rem", marginTop: -8 }}>Scan to auto-connect devices to your Wi-Fi.</p>
                </>
              )}

              {tab === "email" && (
                <>
                  <Inp label="Recipient Email" value={eTo} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setETo(e.target.value)} placeholder="hello@example.com" />
                  <Inp label="Subject" value={eSub} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setESub(e.target.value)} placeholder="Hello from Adusei Media" />
                  <Tex label="Message Body" value={eBody} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEBody(e.target.value)} placeholder="Write your message here" />
                </>
              )}

              <button
                onClick={clearAll}
                style={{
                  width: "100%",
                  padding: 11,
                  borderRadius: 12,
                  border: `1.5px solid ${C.border}`,
                  background: C.lighter,
                  color: C.muted,
                  fontSize: ".88rem",
                  cursor: "pointer",
                  fontWeight: 500,
                  marginTop: 6,
                  fontFamily: "inherit",
                }}
              >
                Clear all fields
              </button>
            </div>

            {/* RIGHT */}
            <div
              style={{
                padding: 38,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: `linear-gradient(160deg,${C.lighter},#eef2ff)`,
              }}
            >
              <p style={{ fontSize: ".74rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".09em", marginBottom: 20 }}>
                Your QR Code
              </p>

              <div
                style={{
                  width: 320,
                  height: 320,
                  background: "#fff",
                  borderRadius: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: qrData ? "0 12px 56px rgba(21,101,192,.22)" : "0 8px 44px rgba(21,101,192,.1)",
                  border: `8px solid ${C.blue}`,
                  overflow: "hidden",
                  position: "relative",
                  padding: 20,
                }}
              >
                <div
                  style={{
                    width: PREVIEW_SIZE,
                    height: PREVIEW_SIZE,
                    border: `1px dashed ${C.border}`,
                    borderRadius: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    background: "#fff",
                  }}
                >
                {qrData ? (
                  <img src={qrData} alt="QR Code" style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE, borderRadius: 14, display: "block" }} />
                ) : (
                  <div style={{ textAlign: "center", padding: 24 }}>
                    <div style={{ fontSize: 52, opacity: 0.18, marginBottom: 12 }}>▦</div>
                    <p style={{ fontSize: ".83rem", color: C.muted, maxWidth: 160, lineHeight: 1.55 }}>
                      {data ? "Generating…" : "Fill in the form to generate your QR code"}
                    </p>
                  </div>
                )}
                </div>
              </div>

              {qrData && <p style={{ fontSize: ".78rem", color: C.muted, marginTop: 14, marginBottom: 4 }}>Scan with any QR reader</p>}
              {qrData && (
                <div style={{ display: "flex", gap: 10, width: 320, marginTop: 10 }}>
                  <button
                    onClick={download}
                    style={{
                      flex: 1,
                      padding: "12px 14px",
                      borderRadius: 12,
                      background: C.gbtn,
                      color: "#fff",
                      border: "none",
                      fontWeight: 700,
                      fontSize: ".84rem",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      boxShadow: "0 4px 14px rgba(21,101,192,.28)",
                    }}
                  >
                    Download PNG
                  </button>
                  <button
                    onClick={copyD}
                    style={{
                      flex: 1,
                      padding: "12px 14px",
                      borderRadius: 12,
                      background: "#fff",
                      color: copied ? "#16a34a" : C.blue,
                      border: `1.5px solid ${copied ? "#16a34a" : C.border}`,
                      fontWeight: 600,
                      fontSize: ".84rem",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {copied ? "Copied!" : "Copy Data"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{ padding: "0 6% 80px" }}>
        <div
          style={{
            maxWidth: 1060,
            margin: "0 auto",
            background: C.grad,
            borderRadius: 22,
            padding: "38px 48px",
            display: "flex",
            justifyContent: "space-around",
            flexWrap: "wrap",
            gap: 24,
          }}
        >
          {[
            ["5", "QR Types"],
            ["100%", "Free"],
            ["Instant", "Preview"],
            ["PNG", "Export"],
          ].map(([n, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: 900, color: "#fff" }}>{n}</div>
              <div style={{ color: "rgba(255,255,255,.6)", fontSize: ".82rem", marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div id="how" style={{ padding: "80px 6%", background: C.lighter }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}
>
          <p style={{ color: C.muted, marginBottom: 48, fontSize: ".97rem" }}>No account, no watermark, no hassle. Just enter your content and download.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 22 }}>
            {[
              ["1", "✏️", "Choose your content type", "Pick URL, text, vCard, Wi-Fi, or email. Select the tab that matches what you want to share."],
              ["2", "⚡", "Fill in and preview instantly", "Type into the fields. Your QR code generates live, no button needed."],
              ["3", "⬇️", "Download and share", "Click Download PNG for a crisp, print-ready image. Share it anywhere."],
            ].map(([n, ico, h, p]) => (
              <div
                key={n}
                style={{
                  background: "#fff",
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 18,
                  padding: "30px 26px",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 4px 24px rgba(21,101,192,.07)",
                }}
              >
                <div style={{ position: "absolute", top: 12, right: 18, fontSize: "4.5rem", fontWeight: 900, color: "#edf0ff", lineHeight: 1, pointerEvents: "none" }}>
                  {n}
                </div>
                <div style={{ fontSize: "2rem", marginBottom: 18 }}>{ico}</div>
                <h3 style={{ fontSize: "1.02rem", fontWeight: 700, marginBottom: 9, color: C.navy }}>{h}</h3>
                <p style={{ color: C.muted, fontSize: ".88rem", lineHeight: 1.65 }}>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div id="features" style={{ padding: "80px 6%", background: "#fff" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <p style={{ color: C.muted, marginBottom: 48, fontSize: ".97rem" }}>Built by Adusei Media for professionals and everyday users.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: 22 }}>
            {FEATS.map((f) => (
              <div
                key={f.t}
                style={{
                  background: "#fff",
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 18,
                  padding: "28px 26px",
                  boxShadow: "0 4px 22px rgba(21,101,192,.06)",
                }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 14, background: f.bg, display: "grid", placeItems: "center", fontSize: 22, marginBottom: 18 }}>
                  {f.ico}
                </div>
                <h3 style={{ fontSize: ".98rem", fontWeight: 700, marginBottom: 9, color: C.navy }}>{f.t}</h3>
                <p style={{ color: C.muted, fontSize: ".87rem", lineHeight: 1.65 }}>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "0 6% 80px", background: C.lighter }}>
        <div
          style={{
            maxWidth: 1060,
            margin: "0 auto",
            background: C.grad,
            borderRadius: 26,
            padding: "64px 48px",
            textAlign: "center",
            boxShadow: "0 16px 60px rgba(21,101,192,.25)",
          }}
        >
          <h2 style={{ fontSize: "clamp(1.6rem,3.5vw,2.5rem)", fontWeight: 900, color: "#fff", marginBottom: 14 }}>Ready to create your QR code?</h2>
          <p style={{ color: "rgba(255,255,255,.68)", marginBottom: 36, fontSize: "1.02rem" }}>No account needed. Free forever. Designed by Adusei Media.</p>
          <button
            onClick={() => scrollTo("generator")}
            style={{
              background: "#fff",
              color: C.navy,
              border: "none",
              padding: "15px 38px",
              borderRadius: 50,
              fontWeight: 800,
              fontSize: "1rem",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Create Free QR Code
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ background: "#0d1f52", padding: "32px 6%" }}>
        <div
          style={{
            maxWidth: 1060,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontWeight: 800, fontSize: "1rem", color: "#fff" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <img
                src={BRAND_LOGO_URL}
                alt="Adusei Media Logo"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  objectFit: "contain",
                }}
              />
            </div>
            My QR Generator
            <span style={{ color: "rgba(255,255,255,.4)", fontWeight: 400, fontSize: ".84rem", marginLeft: 4 }}>by Adusei Media</span>
          </div>
          <p style={{ color: "rgba(255,255,255,.35)", fontSize: ".8rem" }}>2025 Adusei Media. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
