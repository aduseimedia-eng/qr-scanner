import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  ImageUp,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  RotateCcw,
  Activity,
} from "lucide-react";

const COUNTER_KEY = "adusei_media_qr_scan_count";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const detectorRef = useRef(null);
  const cooldownRef = useRef({ text: "", at: 0 });

  const [mode, setMode] = useState("camera");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scanResult, setScanResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [scanCount, setScanCount] = useState(() => {
    const saved = localStorage.getItem(COUNTER_KEY);
    return saved ? Number(saved) || 0 : 0;
  });

  const hasBarcodeDetector = useMemo(
    () => typeof window !== "undefined" && "BarcodeDetector" in window,
    [],
  );

  useEffect(() => {
    localStorage.setItem(COUNTER_KEY, String(scanCount));
  }, [scanCount]);

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }

    setIsCameraOn(false);
  }, []);

  const onDetect = useCallback((text) => {
    const now = Date.now();
    const withinCooldown =
      cooldownRef.current.text === text && now - cooldownRef.current.at < 2000;

    if (withinCooldown) {
      return;
    }

    cooldownRef.current = { text, at: now };
    setScanResult(text);
    setScanCount((prev) => prev + 1);
  }, []);

  const scanFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const detector = detectorRef.current;

    if (!video || !canvas || !detector || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const codes = await detector.detect(canvas);
      if (codes.length > 0 && codes[0].rawValue) {
        onDetect(codes[0].rawValue);
      }
    } catch {
      // Ignore transient detector errors and continue scanning.
    }

    rafRef.current = requestAnimationFrame(scanFrame);
  }, [onDetect]);

  const startCamera = useCallback(async () => {
    if (!hasBarcodeDetector) {
      setCameraError("This browser does not support live QR detection.");
      return;
    }

    setCameraError("");

    try {
      if (!detectorRef.current) {
        detectorRef.current = new window.BarcodeDetector({
          formats: ["qr_code"],
        });
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraOn(true);
      rafRef.current = requestAnimationFrame(scanFrame);
    } catch {
      setCameraError("Camera access was blocked or unavailable.");
      stopCamera();
    }
  }, [hasBarcodeDetector, scanFrame, stopCamera]);

  useEffect(() => {
    if (mode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [mode, startCamera, stopCamera]);

  const handleImageScan = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      if (!hasBarcodeDetector) {
        setCameraError("This browser does not support QR detection from images.");
        return;
      }

      if (!detectorRef.current) {
        detectorRef.current = new window.BarcodeDetector({ formats: ["qr_code"] });
      }

      setCameraError("");

      try {
        const bitmap = await createImageBitmap(file);
        const codes = await detectorRef.current.detect(bitmap);

        if (codes.length > 0 && codes[0].rawValue) {
          onDetect(codes[0].rawValue);
        } else {
          setCameraError("No QR code was found in that image.");
        }
      } catch {
        setCameraError("Could not process that image.");
      } finally {
        event.target.value = "";
      }
    },
    [hasBarcodeDetector, onDetect],
  );

  const copyResult = useCallback(async () => {
    if (!scanResult) {
      return;
    }

    try {
      await navigator.clipboard.writeText(scanResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCameraError("Clipboard access failed.");
    }
  }, [scanResult]);

  const openResult = useCallback(() => {
    if (!scanResult) {
      return;
    }

    const value = scanResult.trim();
    const looksLikeUrl = /^https?:\/\//i.test(value);
    if (looksLikeUrl) {
      window.open(value, "_blank", "noopener,noreferrer");
      return;
    }

    setCameraError("Scanned content is not a full URL.");
  }, [scanResult]);

  const resetCounter = useCallback(() => {
    setScanCount(0);
    localStorage.setItem(COUNTER_KEY, "0");
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-8 sm:px-8 sm:py-12">
        <header className="rounded-3xl border border-slate-700/40 bg-gradient-to-r from-cyan-500/20 via-emerald-500/10 to-slate-800 p-6 shadow-2xl shadow-cyan-900/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                <QrCode className="h-4 w-4" />
                Adusei Media
              </p>
              <h1 className="text-3xl font-black uppercase tracking-wide text-white sm:text-4xl">
                Free QR Code Scanner
              </h1>
              <p className="mt-2 text-sm text-slate-200 sm:text-base">
                Scan QR codes with your camera or upload an image.
              </p>
            </div>

            <div className="min-w-[180px] rounded-2xl border border-emerald-300/30 bg-emerald-400/10 p-4 text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Total Scans</p>
              <p className="text-3xl font-black text-emerald-100">{scanCount}</p>
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <article className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="mb-4 flex flex-wrap gap-3">
              <button
                onClick={() => setMode("camera")}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  mode === "camera"
                    ? "bg-cyan-500 text-slate-900"
                    : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                }`}
              >
                <Camera className="h-4 w-4" />
                Camera
              </button>
              <button
                onClick={() => setMode("upload")}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  mode === "upload"
                    ? "bg-cyan-500 text-slate-900"
                    : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                }`}
              >
                <ImageUp className="h-4 w-4" />
                Upload Image
              </button>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-black">
              {mode === "camera" ? (
                <video
                  ref={videoRef}
                  className="aspect-video w-full object-cover"
                  muted
                  playsInline
                  autoPlay
                />
              ) : (
                <label className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-3 bg-slate-900 text-center">
                  <ImageUp className="h-10 w-10 text-cyan-300" />
                  <span className="text-sm text-slate-300">Click to upload a QR image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageScan} />
                </label>
              )}

              <div className="pointer-events-none absolute inset-0 m-auto h-48 w-48 rounded-2xl border-2 border-cyan-300/70 shadow-[0_0_0_9999px_rgba(2,6,23,0.35)]" />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {mode === "camera" && !isCameraOn && !cameraError && (
              <p className="mt-3 text-sm text-slate-300">Starting camera...</p>
            )}

            {cameraError && <p className="mt-3 text-sm text-rose-300">{cameraError}</p>}
          </article>

          <aside className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
              <Activity className="h-5 w-5 text-cyan-300" />
              Scan Result
            </h2>

            <div className="min-h-32 rounded-2xl border border-slate-700 bg-slate-950 p-4">
              {scanResult ? (
                <p className="break-all text-sm leading-6 text-slate-200">{scanResult}</p>
              ) : (
                <p className="text-sm text-slate-400">No QR code scanned yet.</p>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={copyResult}
                disabled={!scanResult}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={openResult}
                disabled={!scanResult}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ExternalLink className="h-4 w-4" />
                Open Link
              </button>
              <button
                onClick={resetCounter}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-500/80 px-4 py-2 text-sm font-semibold text-white"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Counter
              </button>
            </div>

            <p className="mt-5 text-xs text-slate-400">
              Counter tracks successful scans on this device and browser.
            </p>
          </aside>
        </div>

        <footer className="mt-6 text-center text-xs uppercase tracking-[0.2em] text-slate-400">
          Attribution: Adusei Media
        </footer>
      </section>
    </main>
  );
}

export default App;