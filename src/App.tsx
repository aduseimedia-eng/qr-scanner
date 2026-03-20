import { useState, useEffect } from "react";
import logoImg from "../public/logo.png";

// ============================================
// CONSTANTS & CONFIG
// ============================================
const QR_SIZE = 256;
const LOGO_SIZE = 72;
const LOGO_CORNER_RADIUS = 10;
const LOGO_PADDING = 4;
const RENDER_DELAY = 120;

// Polyfill for roundRect (for older browsers)
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x: any, y: any, w: any, h: any, r: any) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

// ============================================
// TYPES
// ============================================
// Types defined inline where needed

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

        // Use highest ECC level (H=3) when logo is present so ~30% can be covered
        (window as any).QRCode && new (window as any).QRCode(div, {
          text,
          width: QR_SIZE,
          height: QR_SIZE,
          colorDark: "#0f2560",
          colorLight: "#ffffff",
          correctLevel: logo ? 3 : 1, // H=3 with logo, M=1 without
        });

        setTimeout(() => {
          try {
            const qrCanvas = div.querySelector("canvas") as HTMLCanvasElement | null;
            const qrImg = div.querySelector("img") as HTMLImageElement | null;
            const src = qrCanvas
              ? qrCanvas.toDataURL("image/png")
              : qrImg
              ? qrImg.src
              : null;

            document.body.removeChild(div);

            if (!src) return;
            if (!logo) {
              setDataURL(src);
              return;
            }

            // Merge logo onto QR canvas
            mergeLogoWithQR(src, logo, setDataURL);
          } catch (error) {
            console.error("Error processing QR code:", error);
            document.body.removeChild(div);
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
      ctx.drawImage(qrImg, 0, 0, QR_SIZE, QR_SIZE);

      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";

      logoImg.onload = () => {
        try {
          const size = LOGO_SIZE;
          const x = (QR_SIZE - size) / 2;
          const y = (QR_SIZE - size) / 2;

          // White backing with rounded corners
          ctx.fillStyle = "#ffffff";
          ctx.roundRect(
            x - LOGO_PADDING,
            y - LOGO_PADDING,
            size + LOGO_PADDING * 2,
            size + LOGO_PADDING * 2,
            LOGO_CORNER_RADIUS
          );
          ctx.fill();

          // Draw logo
          ctx.drawImage(logoImg, x, y, size, size);
          onComplete(canvas.toDataURL("image/png"));
        } catch (error) {
          console.error("Error drawing logo:", error);
        }
      };

      logoImg.onerror = () => {
        console.error("Failed to load logo image");
        onComplete(qrDataURL); // fallback to QR without logo
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

// Removed unused validateLogoFile - not needed

// function sanitizeInput(input: string): string {
//   return input.trim();
// }

const C = {
  navy: "#0f2560", blue: "#1565c0", mid: "#1a3a8f",
  border: "#d0daff", muted: "#6b7db3", lt: "#e8eeff", lighter: "#f0f4ff",
  grad: "linear-gradient(135deg,#0f2560,#1a3a8f,#1565c0)",
  gbtn: "linear-gradient(135deg,#1a3a8f,#1565c0)",
};
const INP = { width:"100%", background:"#f5f8ff", border:`1.5px solid ${C.border}`, borderRadius:12, padding:"12px 16px", color:C.navy, fontSize:".93rem", outline:"none", fontFamily:"inherit", boxSizing:"border-box" as any };
const LBL = { display:"block", fontSize:".72rem", fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".08em", marginBottom:7 };

const Fld = ({ label, children }: any) => <div style={{ marginBottom:16 }}><label style={LBL}>{label}</label>{children}</div>;
const Inp = ({ label, ...p }: any) => <Fld label={label}><input style={INP} {...p} /></Fld>;
const Tex = ({ label, ...p }: any) => <Fld label={label}><textarea style={{ ...INP, resize:"vertical", minHeight:88 }} {...p} /></Fld>;

const TABS = [
  { id:"url",     ico:"🔗", lbl:"URL" },
  { id:"text",    ico:"💬", lbl:"Text" },
  { id:"contact", ico:"👤", lbl:"vCard" },
  { id:"wifi",    ico:"📶", lbl:"Wi-Fi" },
  { id:"email",   ico:"✉️", lbl:"Email" },
];

// Frame designs - Professional myqrcode.com style
const FRAMES = [
  { id:"none", name:"No Frame", icon:"◯" },
  { id:"elegant-border", name:"Elegant Border", icon:"⬜" },
  { id:"corner-accent", name:"Corner Accent", icon:"🎨" },
  { id:"gradient-frame", name:"Gradient Frame", icon:"🌈" },
  { id:"thick-bold", name:"Thick Bold", icon:"⬛" },
  { id:"neon-glow", name:"Neon Glow", icon:"✨" },
  { id:"wave-border", name:"Wave Border", icon:"〰️" },
  { id:"double-frame", name:"Double Frame", icon:"▦" },
];

// Patterns for future enhancement
// const PATTERNS = [
//   { id:"none", name:"Solid", icon:"▮" },
//   { id:"dots", name:"Dots", icon:"⚫" },
//   { id:"lines", name:"Lines", icon:"▬" },
//   { id:"gradient", name:"Gradient", icon:"⛅" },
// ];

function drawFrame(ctx: any, frameType: string, size: number = 290, frameColor: string = "#1a3a8f", qrSize: number = 220) {
  if (frameType === "none") return;
  
  const w = size, h = size;
  const margin = (size - qrSize) / 2; // Margin around QR code
  const pad = margin - 3;
  
  // Elegant Border - thin sleek frame
  if (frameType === "elegant-border") {
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(pad, pad, w - pad*2, h - pad*2);
  }
  
  // Corner Accent - L-shaped decorative corners
  else if (frameType === "corner-accent") {
    const cornerSize = 16;
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = 2.5;
    
    // Top-left
    ctx.beginPath();
    ctx.moveTo(pad, pad + cornerSize);
    ctx.lineTo(pad, pad);
    ctx.lineTo(pad + cornerSize, pad);
    ctx.stroke();
    
    // Top-right
    ctx.beginPath();
    ctx.moveTo(w - pad - cornerSize, pad);
    ctx.lineTo(w - pad, pad);
    ctx.lineTo(w - pad, pad + cornerSize);
    ctx.stroke();
    
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(w - pad, h - pad - cornerSize);
    ctx.lineTo(w - pad, h - pad);
    ctx.lineTo(w - pad - cornerSize, h - pad);
    ctx.stroke();
    
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(pad + cornerSize, h - pad);
    ctx.lineTo(pad, h - pad);
    ctx.lineTo(pad, h - pad - cornerSize);
    ctx.stroke();
  }
  
  // Gradient Frame - smooth color gradient borders
  else if (frameType === "gradient-frame") {
    const gradient = ctx.createLinearGradient(pad, pad, w-pad, h-pad);
    gradient.addColorStop(0, frameColor);
    gradient.addColorStop(0.5, adjustColor(frameColor, 20));
    gradient.addColorStop(1, frameColor);
    
    ctx.fillStyle = gradient;
    // Top border
    ctx.fillRect(pad, pad, w - pad*2, 5);
    // Bottom border
    ctx.fillRect(pad, h - pad - 5, w - pad*2, 5);
    // Left border
    ctx.fillRect(pad, pad, 5, h - pad*2);
    // Right border
    ctx.fillRect(w - pad - 5, pad, 5, h - pad*2);
  }
  
  // Thick Bold - strong professional frame
  else if (frameType === "thick-bold") {
    ctx.fillStyle = frameColor;
    const thickness = 7;
    // Top
    ctx.fillRect(pad, pad, w - pad*2, thickness);
    // Bottom
    ctx.fillRect(pad, h - pad - thickness, w - pad*2, thickness);
    // Left
    ctx.fillRect(pad, pad, thickness, h - pad*2);
    // Right
    ctx.fillRect(w - pad - thickness, pad, thickness, h - pad*2);
  }
  
  // Neon Glow - glowing border effect
  else if (frameType === "neon-glow") {
    ctx.shadowColor = frameColor;
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(pad, pad, w - pad*2, h - pad*2);
    
    // Inner bright line
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = adjustColor(frameColor, 40);
    ctx.lineWidth = 1;
    ctx.strokeRect(pad + 3, pad + 3, w - pad*2 - 6, h - pad*2 - 6);
  }
  
  // Wave Border - wavy edge frame
  else if (frameType === "wave-border") {
    const waveHeight = 2;
    const waveWidth = 5;
    
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Top
    for (let x = pad; x < w - pad; x += waveWidth) {
      ctx.lineTo(x, pad + Math.sin(x / waveWidth) * waveHeight);
    }
    // Right
    for (let y = pad; y < h - pad; y += waveWidth) {
      ctx.lineTo(w - pad + Math.sin(y / waveWidth) * waveHeight, y);
    }
    // Bottom
    for (let x = w - pad; x > pad; x -= waveWidth) {
      ctx.lineTo(x, h - pad + Math.sin(x / waveWidth) * waveHeight);
    }
    // Left
    for (let y = h - pad; y > pad; y -= waveWidth) {
      ctx.lineTo(pad + Math.sin(y / waveWidth) * waveHeight, y);
    }
    
    ctx.closePath();
    ctx.stroke();
  }
  
  // Double Frame - nested elegant borders
  else if (frameType === "double-frame") {
    // Outer frame
    ctx.strokeStyle = frameColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(pad, pad, w - pad*2, h - pad*2);
    
    // Inner frame
    ctx.strokeStyle = adjustColor(frameColor, -15);
    ctx.lineWidth = 1;
    ctx.strokeRect(pad + 5, pad + 5, w - pad*2 - 10, h - pad*2 - 10);
  }
}

function adjustColor(color: string, percent: number): string {
  const num = parseInt(color.replace("#",""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return "#" + (R << 16 | G << 8 | B).toString(16).padStart(6, '0');
}

const FEATS = [
  { ico:"⚡", bg:"#eef2ff", t:"Instant Preview",   d:"QR regenerates live with every keystroke." },
  { ico:"🔒", bg:"#e8f4ff", t:"Private & Secure",  d:"All processing is local. Nothing is sent anywhere." },
  { ico:"✅", bg:"#e8faf0", t:"100% Free",          d:"No sign-up, no watermark, free for everyone." },
  { ico:"🗂️", bg:"#fff8e6", t:"5 QR Formats",       d:"URL, text, vCard, Wi-Fi, email, all in one tool." },
  { ico:"⬇️", bg:"#fff0f4", t:"PNG Download",        d:"Save a crisp, print-ready PNG anytime." },
  { ico:"📱", bg:"#f3efff", t:"Universal Scanning", d:"Works on every iOS, Android and desktop reader." },
];

// Tag component removed (unused in this version)

const PreviewCanvas = ({ qrData, frame, data, frameColor, qrColor, bgColor }: any) => {
  useEffect(() => {
    if (!qrData) return;
    const canvas = document.querySelector("[data-preview-canvas]") as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Determine canvas and QR size based on frame
    const hasFrame = frame && frame !== "none";
    const canvasSize = hasFrame ? 290 : 256;
    const qrSize = hasFrame ? 220 : 256;
    const qrOffset = hasFrame ? 35 : 0;
    
    // Update canvas size
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    
    // Parse hex color to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0];
    };
    
    const qrImg = new Image();
    qrImg.src = qrData;
    qrImg.onload = () => {
      // Draw background color
      ctx.fillStyle = bgColor || "#fff";
      ctx.fillRect(0, 0, canvasSize, canvasSize);
      
      // Draw and recolor QR code FIRST
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = qrSize;
      tempCanvas.height = qrSize;
      const tempCtx = tempCanvas.getContext("2d");
      if (tempCtx) {
        tempCtx.drawImage(qrImg, 0, 0, qrSize, qrSize);
        const imageData = tempCtx.getImageData(0, 0, qrSize, qrSize);
        const pixelData = imageData.data;
        
        // Get RGB values for custom QR color
        const [qrR, qrG, qrB] = hexToRgb(qrColor);
        
        // Recolor dark pixels to custom QR color
        for (let i = 0; i < pixelData.length; i += 4) {
          const r = pixelData[i];
          const g = pixelData[i + 1];
          const b = pixelData[i + 2];
          const brightness = (r + g + b) / 3;
          
          // If pixel is dark (part of QR pattern), recolor it
          if (brightness < 128) {
            pixelData[i] = qrR;
            pixelData[i + 1] = qrG;
            pixelData[i + 2] = qrB;
          }
        }
        
        tempCtx.putImageData(imageData, 0, 0);
        ctx.drawImage(tempCanvas, qrOffset, qrOffset, qrSize, qrSize);
      } else {
        ctx.drawImage(qrImg, qrOffset, qrOffset, qrSize, qrSize);
      }
      
      // Draw frame on TOP after QR code
      if (hasFrame) {
        drawFrame(ctx, frame, canvasSize, frameColor, qrSize);
      }
    };
  }, [qrData, frame, frameColor, qrColor, bgColor]);
  
  const hasFrame = frame && frame !== "none";
  const displaySize = hasFrame ? 290 : 256;
  const containerSize = hasFrame ? 320 : 280;
  
  return (
    <div style={{ width:containerSize, height:containerSize, background:"#f5f8ff", borderRadius:22, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:qrData?"0 12px 56px rgba(21,101,192,.22)":"0 8px 44px rgba(21,101,192,.1)", border:`1.5px solid ${C.border}`, overflow:"hidden", position:"relative" }}>
      {qrData ? (
        <canvas 
          data-preview-canvas 
          width={displaySize} 
          height={displaySize} 
          style={{ width:displaySize, height:displaySize, borderRadius:14, display:"block" }} 
        />
      ) : (
        <div style={{ textAlign:"center", padding:24 }}>
          <div style={{ fontSize:52, opacity:.18, marginBottom:12 }}>▦</div>
          <p style={{ fontSize:".83rem", color:C.muted, maxWidth:160, lineHeight:1.55 }}>
            {data ? "Generating…" : "Fill in the form to generate your QR code"}
          </p>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [tab, setTab] = useState("url");
  const [urlV,  setUrlV]  = useState("");
  const [logo,  setLogo]  = useState("");
  const [frame, setFrame]  = useState("none");
  const [frameColor, setFrameColor] = useState("#1a3a8f");
  const [qrColor, setQrColor] = useState("#0f2560");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [txtV,  setTxtV]  = useState("");
  const [cFn,   setCFn]   = useState(""); const [cLn,  setCLn]  = useState("");
  const [cPh,   setCPh]   = useState(""); const [cEm,  setCEm]  = useState("");
  const [cOrg,  setCOrg]  = useState(""); const [cUrl, setCUrl] = useState("");
  const [wSsid, setWSsid] = useState(""); const [wPass,setWPass]= useState(""); const [wSec, setWSec] = useState("WPA");
  const [eTo,   setETo]   = useState(""); const [eSub, setESub] = useState(""); const [eBody,setEBody]= useState("");
  const [copied, setCopied] = useState(false);

  function buildData() {
    if (tab === "url") {
      const v = urlV.trim(); if (!v) return "";
      return /^https?:\/\//i.test(v) ? v : "https://" + v;
    }
    if (tab === "text") return txtV.trim();
    if (tab === "contact") {
      const fn=cFn.trim(),ln=cLn.trim(),ph=cPh.trim(),em=cEm.trim(),org=cOrg.trim(),cu=cUrl.trim();
      if (!fn && !ln && !ph && !em) return "";
      return ["BEGIN:VCARD","VERSION:3.0",`FN:${fn} ${ln}`,`N:${ln};${fn};;;`,
        org?`ORG:${org}`:null, ph?`TEL;TYPE=CELL:${ph}`:null,
        em?`EMAIL:${em}`:null, cu?`URL:${cu}`:null, "END:VCARD"
      ].filter(Boolean).join("\n");
    }
    if (tab === "wifi") {
      const s=wSsid.trim(); if (!s) return "";
      const esc=(v: any)=>v.replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/"/g,'\\"');
      if (wSec==="nopass") return `WIFI:T:nopass;S:${esc(s)};;;`;
      return `WIFI:T:${wSec};S:${esc(s)};P:${esc(wPass)};;`;
    }
    if (tab === "email") {
      const to=eTo.trim(); if (!to) return "";
      const parts=[];
      if (eSub.trim())  parts.push("subject="+encodeURIComponent(eSub.trim()));
      if (eBody.trim()) parts.push("body="+encodeURIComponent(eBody.trim()));
      return "mailto:"+to+(parts.length?"?"+parts.join("&"):"");
    }
    return "";
  }

  const data   = buildData();
  const qrData = useQR(data, tab === "url" ? logo : "");

  function handleLogo(file: any) {
    if (!file || !file.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = (x: any) => setLogo(x.target.result);
    r.readAsDataURL(file);
  }

  function clearAll() {
    setUrlV(""); setLogo(""); setTxtV("");
    setCFn(""); setCLn(""); setCPh(""); setCEm(""); setCOrg(""); setCUrl("");
    setWSsid(""); setWPass(""); setWSec("WPA");
    setETo(""); setESub(""); setEBody("");
  }

  function download() {
    if (!qrData) return;
    
    // Determine canvas and QR size based on frame
    const hasFrame = tab === "url" && frame && frame !== "none";
    const canvasSize = hasFrame ? 290 : 256;
    const qrSize = hasFrame ? 220 : 256;
    const qrOffset = hasFrame ? 35 : 0;
    
    const canvas = document.createElement("canvas"); 
    canvas.width = canvasSize; 
    canvas.height = canvasSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Parse hex color to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0];
    };
    
    const qrImg = new Image(); 
    qrImg.src = qrData;
    qrImg.onload = () => {
      // Step 1: Draw background color
      ctx.fillStyle = bgColor || "#fff";
      ctx.fillRect(0, 0, canvasSize, canvasSize);
      
      // Step 2: Draw and recolor QR code FIRST
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = qrSize;
      tempCanvas.height = qrSize;
      const tempCtx = tempCanvas.getContext("2d");
      if (tempCtx) {
        tempCtx.drawImage(qrImg, 0, 0, qrSize, qrSize);
        const imageData = tempCtx.getImageData(0, 0, qrSize, qrSize);
        const data = imageData.data;
        
        // Get RGB values for custom QR color
        const [qrR, qrG, qrB] = hexToRgb(qrColor);
        
        // Recolor dark pixels to custom QR color
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r + g + b) / 3;
          
          // If pixel is dark (part of QR pattern), recolor it
          if (brightness < 128) {
            data[i] = qrR;
            data[i + 1] = qrG;
            data[i + 2] = qrB;
          }
        }
        
        tempCtx.putImageData(imageData, 0, 0);
        ctx.drawImage(tempCanvas, qrOffset, qrOffset, qrSize, qrSize);
      } else {
        ctx.drawImage(qrImg, qrOffset, qrOffset, qrSize, qrSize);
      }
      
      // Step 3A: Reserve and clear logo area before drawing frame
      let logoArea = null;
      if (logo && tab === "url") {
        const lx = canvasSize/2 - 24, ly = canvasSize/2 - 24;
        logoArea = { x: lx - 4, y: ly - 4, w: 56, h: 56, cx: canvasSize/2, cy: canvasSize/2, r: 32 };
      }
      
      // Step 3B: Draw frame on TOP after QR code (with clipping to avoid logo area)
      if (hasFrame && logoArea) {
        // Save canvas state
        ctx.save();
        
        // Create clipping path that excludes the circular logo area
        // Draw outer rect, then the inner circle (which will be excluded due to evenodd rule)
        const path = new Path2D();
        path.rect(0, 0, canvasSize, canvasSize);
        path.arc(logoArea.cx, logoArea.cy, logoArea.r, 0, Math.PI * 2);
        ctx.clip(path, "evenodd");
        
        // Now draw frame - it won't go in the logo area due to clipping
        drawFrame(ctx, frame, canvasSize, frameColor, qrSize);
        
        // Restore canvas state
        ctx.restore();
      } else if (hasFrame) {
        // No logo, draw frame normally
        drawFrame(ctx, frame, canvasSize, frameColor, qrSize);
      }
      
      // Step 3C: Redraw white background over logo area to cover any frame elements
      if (logoArea) {
        ctx.fillStyle = "#fff";
        ctx.roundRect(logoArea.x, logoArea.y, logoArea.w, logoArea.h, 8);
        ctx.fill();
      }
      
      // Step 4: Draw logo if present - rendered LAST, on top of everything
      if (logo && tab === "url") {
        const logoImg = new Image(); 
        logoImg.src = logo;
        logoImg.onload = () => {
          // Logo is always centered with white background
          const lx = canvasSize/2 - 24, ly = canvasSize/2 - 24;
          // Draw logo image - pure render, no color effects
          ctx.drawImage(logoImg, lx, ly, 48, 48);
          triggerDownload(canvas);
        };
      } else {
        triggerDownload(canvas);
      }
    };
  }
  
  function triggerDownload(canvas: HTMLCanvasElement) {
    const a = document.createElement("a");
    a.download = "adusei-media-qr.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  }

  function copyD() {
    if (!data) return;
    navigator.clipboard.writeText(data).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),2000); });
  }

  const sc = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior:"smooth" });

  // Detect mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{ fontFamily:"'Segoe UI',system-ui,sans-serif", background:"#fff", color:C.navy, minHeight:"100vh", WebkitTouchCallout:"none" }}>

      {/* NAV */}
      <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:`0 ${isMobile?3:6}%`, height:"auto", background:"#fff", borderBottom:`1.5px solid ${C.border}`, position:"sticky", top:0, zIndex:200, boxShadow:"0 2px 18px rgba(21,101,192,.08)", flexWrap:isMobile?"wrap":"nowrap", gap:isMobile?8:22 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, fontWeight:800, fontSize:"1.1rem" }}>
          <img src={logoImg} alt="Logo" style={{ width:100, height:100, borderRadius:10, flexShrink:0, objectFit:"contain" }} />
          My QR Generator
        </div>
        <div style={{ display:"flex", gap:22, alignItems:"center" }}>
          <a href="#how"      style={{ color:C.muted, textDecoration:"none", fontSize:".9rem", fontWeight:500 }}>How it works</a>
          <a href="#features" style={{ color:C.muted, textDecoration:"none", fontSize:".9rem", fontWeight:500 }}>Features</a>
          <button onClick={()=>sc("generator")} style={{ background:C.gbtn, color:"#fff", border:"none", padding:"10px 24px", borderRadius:50, fontWeight:700, fontSize:".9rem", cursor:"pointer", fontFamily:"inherit" }}>Create QR Code</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ textAlign:"center", padding:`${isMobile ? 36 : 96}px ${isMobile?3:6}% ${isMobile ? 48 : 72}px`, background:"linear-gradient(175deg,#eef2ff 0%,#f8faff 55%,#fff 100%)" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:C.lt, border:`1px solid ${C.border}`, borderRadius:50, padding:"7px 20px", fontSize:".8rem", color:C.mid, marginBottom:28, fontWeight:700 }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:C.blue, display:"inline-block" }} />
          100% Free · No Sign-up · Instant
        </div>
        <h1 style={{ fontSize:"clamp(2.2rem,5.5vw,3.8rem)", fontWeight:900, lineHeight:1.12, letterSpacing:"-.03em", marginBottom:22, color:C.navy }}>
          Create Your QR Code<br/>
          <span style={{ background:C.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>In Seconds</span>
        </h1>
        <p style={{ color:C.muted, fontSize:"1.08rem", maxWidth:540, margin:"0 auto 40px", lineHeight:1.75 }}>
          Generate professional QR codes for URLs, contacts, Wi-Fi, and more.<br/>
          Fully free. Designed by <strong style={{ color:C.blue }}>Adusei Media</strong>.
        </p>
        <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
          <button onClick={()=>sc("generator")} style={{ background:C.gbtn, color:"#fff", border:"none", padding:"15px 36px", borderRadius:50, fontWeight:700, fontSize:"1rem", cursor:"pointer", fontFamily:"inherit", boxShadow:"0 6px 26px rgba(21,101,192,.32)" }}>Create QR Code</button>
          <button onClick={()=>sc("how")} style={{ background:"#fff", color:C.navy, border:`1.5px solid ${C.border}`, padding:"15px 36px", borderRadius:50, fontWeight:600, fontSize:"1rem", cursor:"pointer", fontFamily:"inherit" }}>How it works</button>
        </div>
        <div style={{ display:"flex", justifyContent:"center", gap:40, marginTop:52, flexWrap:"wrap" }}>
          {[["5","QR Types"],["Free","Always"],["PNG","Download"]].map(([n,l])=>(
            <div key={l} style={{ textAlign:"center" }}>
              <span style={{ fontSize:"1.6rem", fontWeight:900, color:C.blue, display:"block" }}>{n}</span>
              <span style={{ fontSize:".8rem", color:"#9aaccf" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* GENERATOR */}
      <div id="generator" style={{ padding:`0 ${isMobile?3:6}% ${isMobile ? 54 : 90}px` }}>
        <div style={{ maxWidth:1060, margin:"0 auto", background:"#fff", border:`1.5px solid ${C.border}`, borderRadius:24, overflow:"hidden", boxShadow:"0 16px 70px rgba(21,101,192,.12)" }}>

          {/* Tabs */}
          <div style={{ display:"flex", borderBottom:`1.5px solid ${C.border}`, overflowX:"auto", background:C.lighter, WebkitOverflowScrolling:"touch" }}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)}
                style={{ display:"flex", alignItems:"center", gap:7, padding:`${isMobile?"10px 12px":"15px 22px"}`, fontSize:isMobile?".75rem":".88rem", fontWeight:600, color:tab===t.id?C.blue:C.muted, cursor:"pointer", background:"none", border:"none", borderBottom:tab===t.id?`2.5px solid ${C.blue}`:"2.5px solid transparent", whiteSpace:"nowrap", fontFamily:"inherit", transition:"all .2s", flexShrink:0 }}>
                {t.ico} {t.lbl}
              </button>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:0 }}>

            {/* LEFT */}
            <div style={{ padding:isMobile?20:38, borderRight:isMobile?"none":`1.5px solid ${C.border}` }}>

              {tab==="url" && <>
                <Inp label="Website URL" value={urlV} onChange={(e: any)=>setUrlV(e.target.value)} placeholder="https://adusemedia.com"/>
                <p style={{ color:"#aaa", fontSize:".74rem", marginTop:-8, marginBottom:20 }}>https:// added automatically if missing.</p>

                <Fld label="Company Logo (optional)">
                  <label
                    onDragOver={(e: any)=>e.preventDefault()}
                    onDrop={(e: any)=>{ e.preventDefault(); handleLogo(e.dataTransfer.files[0]); }}
                    style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, border:`2px dashed ${C.border}`, borderRadius:14, padding:"22px 16px", cursor:"pointer", background:C.lighter }}>
                    <input type="file" accept="image/*" style={{ display:"none" }} onChange={(e: any)=>handleLogo(e.target.files[0])}/>
                    {logo
                      ? <img src={logo} alt="logo" style={{ width:64, height:64, objectFit:"contain", borderRadius:10 }}/>
                      : <>
                          <div style={{ fontSize:28 }}>🖼️</div>
                          <span style={{ fontSize:".8rem", color:C.muted, textAlign:"center" }}>
                            Click or drag to upload logo<br/>
                            <span style={{ fontSize:".72rem", color:"#bbb" }}>PNG, JPG, SVG supported</span>
                          </span>
                        </>
                    }
                  </label>
                </Fld>
                {logo && (
                  <button onClick={()=>setLogo("")} style={{ width:"100%", padding:"9px", borderRadius:10, border:"1.5px solid #fcd", background:"#fff8f8", color:"#c0392b", fontSize:".82rem", cursor:"pointer", fontFamily:"inherit", marginBottom:4 }}>
                    Remove Logo
                  </button>
                )}

                <Fld label="QR Frame Design">
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    {FRAMES.map(f=>(
                      <button key={f.id} onClick={()=>setFrame(f.id)} style={{
                        padding:"12px 10px", borderRadius:10, border:`2px solid ${frame===f.id?C.blue:C.border}`,
                        background:frame===f.id?C.lighter:"#fff", color:C.navy, cursor:"pointer", fontFamily:"inherit",
                        fontSize:".78rem", fontWeight:frame===f.id?700:500, transition:"all .2s"
                      }}>
                        <div style={{ fontSize:"1.4rem", marginBottom:4 }}>{f.icon}</div>
                        {f.name}
                      </button>
                    ))}
                  </div>
                </Fld>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <Fld label="Frame Color">
                    <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                      <input type="color" value={frameColor} onChange={(e: any)=>setFrameColor(e.target.value)} style={{ width:"100%", height:44, border:`1.5px solid ${C.border}`, borderRadius:10, cursor:"pointer" }} />
                    </div>
                  </Fld>
                  
                  <Fld label="QR Code Color">
                    <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                      <input type="color" value={qrColor} onChange={(e: any)=>setQrColor(e.target.value)} style={{ width:"100%", height:44, border:`1.5px solid ${C.border}`, borderRadius:10, cursor:"pointer" }} />
                    </div>
                  </Fld>
                </div>

                <Fld label="Background Color">
                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <input type="color" value={bgColor} onChange={(e: any)=>setBgColor(e.target.value)} style={{ width:"100%", height:44, border:`1.5px solid ${C.border}`, borderRadius:10, cursor:"pointer" }} />
                  </div>
                </Fld>
              </>}

              {tab==="text" &&
                <Tex label="Text Content" value={txtV} onChange={(e: any)=>setTxtV(e.target.value)} placeholder="Enter any text to encode"/>
              }

              {tab==="contact" && <>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <Inp label="First Name"  value={cFn}  onChange={(e: any)=>setCFn(e.target.value)}  placeholder="Kwame"/>
                  <Inp label="Last Name"   value={cLn}  onChange={(e: any)=>setCLn(e.target.value)}  placeholder="Adusei"/>
                </div>
                <Inp label="Phone"         value={cPh}  onChange={(e: any)=>setCPh(e.target.value)}  placeholder="+233 24 000 0000"/>
                <Inp label="Email Address" value={cEm}  onChange={(e: any)=>setCEm(e.target.value)}  placeholder="hello@adusemedia.com"/>
                <Inp label="Organisation"  value={cOrg} onChange={(e: any)=>setCOrg(e.target.value)} placeholder="Adusei Media"/>
                <Inp label="Website"       value={cUrl} onChange={(e: any)=>setCUrl(e.target.value)} placeholder="https://adusemedia.com"/>
              </>}

              {tab==="wifi" && <>
                <Inp label="Network Name (SSID)" value={wSsid} onChange={(e: any)=>setWSsid(e.target.value)} placeholder="MyHomeNetwork"/>
                <Inp label="Password" type="password" value={wPass} onChange={(e: any)=>setWPass(e.target.value)} placeholder="Wi-Fi password"/>
                <Fld label="Security Type">
                  <select value={wSec} onChange={(e: any)=>setWSec(e.target.value)} style={{ ...INP }}>
                    <option value="WPA">WPA / WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">None (open network)</option>
                  </select>
                </Fld>
                <p style={{ color:"#aaa", fontSize:".74rem", marginTop:-8 }}>Scan to auto-connect devices to your Wi-Fi.</p>
              </>}

              {tab==="email" && <>
                <Inp label="Recipient Email" value={eTo}   onChange={(e: any)=>setETo(e.target.value)}   placeholder="hello@example.com"/>
                <Inp label="Subject"         value={eSub}  onChange={(e: any)=>setESub(e.target.value)}  placeholder="Hello from Adusei Media"/>
                <Tex label="Message Body"    value={eBody} onChange={(e: any)=>setEBody(e.target.value)} placeholder="Write your message here"/>
              </>}

              <button onClick={clearAll} style={{ width:"100%", padding:11, borderRadius:12, border:`1.5px solid ${C.border}`, background:C.lighter, color:C.muted, fontSize:".88rem", cursor:"pointer", fontWeight:500, marginTop:6, fontFamily:"inherit" }}>
                Clear all fields
              </button>
            </div>

            {/* RIGHT */}
            <div style={{ padding:isMobile?20:38, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:`linear-gradient(160deg,${C.lighter},#eef2ff)`, borderTop:isMobile?`1.5px solid ${C.border}`:"none" }}>
              <p style={{ fontSize:".74rem", fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".09em", marginBottom:20 }}>Your QR Code</p>

              <PreviewCanvas qrData={qrData} frame={tab==="url"?frame:"none"} data={data} frameColor={frameColor} qrColor={qrColor} bgColor={bgColor} />

              {qrData && <p style={{ fontSize:".78rem", color:C.muted, marginTop:14, marginBottom:4 }}>Scan with any QR reader</p>}
              {qrData && (
                <div style={{ display:"flex", gap:10, width:280, marginTop:10 }}>
                  <button onClick={download} style={{ flex:1, padding:"12px 14px", borderRadius:12, background:C.gbtn, color:"#fff", border:"none", fontWeight:700, fontSize:".84rem", cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 14px rgba(21,101,192,.28)" }}>
                    Download PNG
                  </button>
                  <button onClick={copyD} style={{ flex:1, padding:"12px 14px", borderRadius:12, background:"#fff", color:copied?"#16a34a":C.blue, border:`1.5px solid ${copied?"#16a34a":C.border}`, fontWeight:600, fontSize:".84rem", cursor:"pointer", fontFamily:"inherit" }}>
                    {copied ? "Copied!" : "Copy Data"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{ padding:`0 ${isMobile?3:6}% ${isMobile?48:80}px` }}>
        <div style={{ maxWidth:1060, margin:"0 auto", background:C.grad, borderRadius:22, padding:isMobile?"24px 20px":"38px 48px", display:"flex", justifyContent:"space-around", flexWrap:"wrap", gap:isMobile?12:24 }}>
          {[["5","QR Types"],["100%","Free"],["Instant","Preview"],["PNG","Export"]].map(([n,l])=>(
            <div key={l} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"2rem", fontWeight:900, color:"#fff" }}>{n}</div>
              <div style={{ color:"rgba(255,255,255,.6)", fontSize:".82rem", marginTop:3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div id="how" style={{ padding:`${isMobile?48:80}px ${isMobile?3:6}%`, background:C.lighter }}>
        <div style={{ maxWidth:1060, margin:"0 auto" }}>
          <p style={{ color:C.muted, marginBottom:isMobile?24:48, fontSize:isMobile?".9rem":".97rem" }}>No account, no watermark, no hassle. Just enter your content and download.</p>
          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"repeat(auto-fit,minmax(240px,1fr))", gap:isMobile?12:22 }}>
            {[
              ["1","✏️","Choose your content type","Pick URL, text, vCard, Wi-Fi, or email. Select the tab that matches what you want to share."],
              ["2","⚡","Fill in and preview instantly","Type into the fields. Your QR code generates live, no button needed."],
              ["3","⬇️","Download and share","Click Download PNG for a crisp, print-ready image. Share it anywhere."],
            ].map(([n,ico,h,p])=>(
              <div key={n} style={{ background:"#fff", border:`1.5px solid ${C.border}`, borderRadius:18, padding:"30px 26px", position:"relative", overflow:"hidden", boxShadow:"0 4px 24px rgba(21,101,192,.07)" }}>
                <div style={{ position:"absolute", top:12, right:18, fontSize:"4.5rem", fontWeight:900, color:"#edf0ff", lineHeight:1, pointerEvents:"none" }}>{n}</div>
                <div style={{ fontSize:"2rem", marginBottom:18 }}>{ico}</div>
                <h3 style={{ fontSize:"1.02rem", fontWeight:700, marginBottom:9, color:C.navy }}>{h}</h3>
                <p style={{ color:C.muted, fontSize:".88rem", lineHeight:1.65 }}>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div id="features" style={{ padding:`${isMobile?48:80}px ${isMobile?3:6}%`, background:"#fff" }}>
        <div style={{ maxWidth:1060, margin:"0 auto" }}>
          <p style={{ color:C.muted, marginBottom:isMobile?24:48, fontSize:isMobile?".9rem":".97rem" }}>Built by Adusei Media for professionals and everyday users.</p>
          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"repeat(auto-fit,minmax(290px,1fr))", gap:isMobile?12:22 }}>
            {FEATS.map(f=>(
              <div key={f.t} style={{ background:"#fff", border:`1.5px solid ${C.border}`, borderRadius:18, padding:"28px 26px", boxShadow:"0 4px 22px rgba(21,101,192,.06)" }}>
                <div style={{ width:48, height:48, borderRadius:14, background:f.bg, display:"grid", placeItems:"center", fontSize:22, marginBottom:18 }}>{f.ico}</div>
                <h3 style={{ fontSize:".98rem", fontWeight:700, marginBottom:9, color:C.navy }}>{f.t}</h3>
                <p style={{ color:C.muted, fontSize:".87rem", lineHeight:1.65 }}>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding:`0 ${isMobile?3:6}% ${isMobile?48:80}px`, background:C.lighter }}>
        <div style={{ maxWidth:1060, margin:"0 auto", background:C.grad, borderRadius:26, padding:isMobile?"32px 16px":"64px 48px", textAlign:"center", boxShadow:"0 16px 60px rgba(21,101,192,.25)" }}>
          <h2 style={{ fontSize:isMobile?"clamp(1.3rem,3vw,1.8rem)":"clamp(1.6rem,3.5vw,2.5rem)", fontWeight:900, color:"#fff", marginBottom:isMobile?10:14 }}>Ready to create your QR code?</h2>
          <p style={{ color:"rgba(255,255,255,.68)", marginBottom:isMobile?20:36, fontSize:isMobile?".95rem":"1.02rem" }}>No account needed. Free forever. Designed by Adusei Media.</p>
          <button onClick={()=>sc("generator")} style={{ background:"#fff", color:C.navy, border:"none", padding:isMobile?"12px 28px":"15px 38px", borderRadius:50, fontWeight:800, fontSize:isMobile?".9rem":"1rem", cursor:"pointer", fontFamily:"inherit" }}>
            Create Free QR Code
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ background:"#0d1f52", padding:`${isMobile?16:32}px ${isMobile?3:6}%` }}>
        <div style={{ maxWidth:1060, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:isMobile?8:16, flexDirection:isMobile?"column":"row", textAlign:isMobile?"center":"left" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, fontWeight:800, fontSize:isMobile?".9rem":"1rem", color:"#fff", flexDirection:isMobile?"column":"row" }}>
            <img src={logoImg} alt="Logo" style={{ width:isMobile?64:100, height:isMobile?64:100, borderRadius:9, flexShrink:0, objectFit:"contain" }} />
            <div>
              My QR Generator
              <span style={{ color:"rgba(255,255,255,.4)", fontWeight:400, fontSize:isMobile?".7rem":".84rem", marginLeft:isMobile?0:4, display:isMobile?"block":"inline" }}>{isMobile?"by Adusei":"by Adusei Media"}</span>
            </div>
          </div>
          <p style={{ color:"rgba(255,255,255,.35)", fontSize:isMobile?".7rem":".8rem" }}>2025 Adusei Media. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// Built: 2026-03-05 10:38:24
