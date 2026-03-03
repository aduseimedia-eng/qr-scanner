import { useState, useEffect, useRef, useCallback } from "react";
import { QrCode, Link, MessageSquare, User, Download, Copy, Check, Upload, X, Lock } from "lucide-react";

const QRCodeGenerator = () => {
  const [activeTab, setActiveTab] = useState("url");
  const [qrData, setQrData] = useState("");
  const [copied, setCopied] = useState(false);
  const [logo, setLogo] = useState(null); // base64 string
  const [logoPreview, setLogoPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const qrContainerRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [urlInput, setUrlInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [contactInfo, setContactInfo] = useState({ firstName: "", lastName: "", phone: "", email: "", organization: "", url: "" });

  const formatUrl = (url) => {
    if (!url.trim()) return "";
    return url.startsWith("http://") || url.startsWith("https://") ? url : "https://" + url;
  };

  const generateVCard = (c) =>
    `BEGIN:VCARD\nVERSION:3.0\nFN:${c.firstName} ${c.lastName}\nN:${c.lastName};${c.firstName};;;\nORG:${c.organization}\nTEL:${c.phone}\nEMAIL:${c.email}\nURL:${c.url}\nEND:VCARD`;

  const drawLogoOnCanvas = useCallback((canvas) => {
    if (!logo || activeTab !== "url") return;
    const ctx = canvas.getContext("2d");
    const size = canvas.width;
    const logoSize = size * 0.32;
    const logoX = (size - logoSize) / 2;
    const logoY = (size - logoSize) / 2;
    const radius = 10;

    const img = new Image();
    img.onload = () => {
      // White rounded background
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(logoX - 6, logoY - 6, logoSize + 12, logoSize + 12, radius + 2);
      ctx.fill();

      // Subtle border
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(logoX - 6, logoY - 6, logoSize + 12, logoSize + 12, radius + 2);
      ctx.stroke();

      // Clip to rounded rect and draw image while maintaining aspect ratio
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(logoX, logoY, logoSize, logoSize, radius);
      ctx.clip();

      // Calculate dimensions to maintain aspect ratio
      const imgAspect = img.width / img.height;
      let drawWidth = logoSize;
      let drawHeight = logoSize;
      let drawX = logoX;
      let drawY = logoY;

      if (imgAspect > 1) {
        // Wider than tall
        drawHeight = logoSize / imgAspect;
        drawY = logoY + (logoSize - drawHeight) / 2;
      } else {
        // Taller than wide
        drawWidth = logoSize * imgAspect;
        drawX = logoX + (logoSize - drawWidth) / 2;
      }

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();
    };
    img.src = logo;
  }, [logo, activeTab]);

  const createQR = useCallback((text) => {
    if (!qrContainerRef.current || !window.QRious) return;
    qrContainerRef.current.innerHTML = "";
    const canvas = document.createElement("canvas");
    canvasRef.current = canvas;
    qrContainerRef.current.appendChild(canvas);

    new window.QRious({
      element: canvas,
      value: text,
      size: 300,
      background: "white",
      foreground: "black",
      level: "H", // High error correction to support logo overlay
    });

    canvas.className = "rounded-xl shadow-lg bg-white";
    canvas.style.maxWidth = "300px";
    canvas.style.width = "100%";
    canvas.style.height = "auto";

    drawLogoOnCanvas(canvas);
  }, [drawLogoOnCanvas]);

  const generateQRCode = useCallback((text) => {
    if (!text.trim()) {
      if (qrContainerRef.current) qrContainerRef.current.innerHTML = "";
      return;
    }
    if (!window.QRious) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js";
      script.onload = () => createQR(text);
      document.head.appendChild(script);
    } else {
      createQR(text);
    }
  }, [createQR]);

  useEffect(() => {
    let data = "";
    if (activeTab === "url") data = formatUrl(urlInput);
    else if (activeTab === "text") data = textInput;
    else if (activeTab === "contact") {
      if (contactInfo.firstName || contactInfo.lastName || contactInfo.phone || contactInfo.email)
        data = generateVCard(contactInfo);
    }
    setQrData(data);
    generateQRCode(data);
  }, [activeTab, urlInput, textInput, contactInfo, generateQRCode]);

  // Re-draw logo when it changes
  useEffect(() => {
    if (canvasRef.current && qrData) drawLogoOnCanvas(canvasRef.current);
  }, [logo, drawLogoOnCanvas, qrData]);

  const handleImageFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogo(e.target.result);
      setLogoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleImageFile(e.dataTransfer.files[0]);
  };

  const removeLogo = () => {
    setLogo(null);
    setLogoPreview(null);
    if (canvasRef.current && qrData) {
      // Redraw QR without logo
      setTimeout(() => createQR(qrData), 0);
    }
  };

  const handleStripePayment = async () => {
    try {
      const response = await fetch("http://localhost:3001/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: "price_premium_logo" }),
      });
      const { sessionId } = await response.json();
      // In production, use Stripe to redirect to checkout
      // For now, simulate premium access
      setIsPremium(true);
      setShowPaymentModal(false);
      alert("✓ Premium features unlocked! You can now add logos to QR codes.");
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment processing error. Please try again.");
    }
  };

  const downloadQRCode = () => {
    const canvas = canvasRef.current;
    if (!canvas || !qrData) return;
    const link = document.createElement("a");
    link.download = "qr-code.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  const copyToClipboard = async () => {
    if (!qrData) return;
    try {
      await navigator.clipboard.writeText(qrData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const resetForm = () => {
    setUrlInput(""); setTextInput("");
    setContactInfo({ firstName: "", lastName: "", phone: "", email: "", organization: "", url: "" });
    setQrData("");
    setLogo(null); setLogoPreview(null);
    if (qrContainerRef.current) qrContainerRef.current.innerHTML = "";
  };

  const tabs = [
    { id: "url", label: "URL", icon: Link },
    { id: "text", label: "Text", icon: MessageSquare },
    { id: "contact", label: "Contact", icon: User },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-950 to-blue-800 rounded-2xl mb-4">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-950 to-blue-800 bg-clip-text text-transparent mb-2">
            QR Code Generator
          </h1>
          <p className="text-gray-600 text-lg">Generate QR codes with your logo embedded</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-200 ${
                    activeTab === id ? "text-blue-800 border-b-2 border-blue-800 bg-blue-50" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}>
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left: Inputs */}
              <div className="space-y-5">
                <h2 className="text-2xl font-semibold text-gray-800">
                  {activeTab === "url" ? "Enter URL" : activeTab === "text" ? "Enter Text" : "Contact Information"}
                </h2>

                {activeTab === "url" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
                      <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                        placeholder="example.com or https://example.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all" />
                      <p className="text-xs text-gray-500 mt-1">https:// will be added automatically if omitted.</p>
                    </div>

                    {/* Logo Upload — only on URL tab */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Logo / Image <span className="text-blue-700 font-normal">(optional, centered on QR)</span>
                        </label>
                      </div>

                      {logoPreview ? (
                        <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50">
                          <img src={logoPreview} alt="Logo preview" className="w-16 h-16 object-contain rounded-lg border border-gray-200 bg-white p-1" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">Logo uploaded</p>
                            <p className="text-xs text-gray-500 mt-0.5">It will appear in the center of your QR code</p>
                          </div>
                          <button onClick={removeLogo}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
                            isDragging ? "border-blue-600 bg-blue-50" : "border-gray-300 hover:border-blue-600 hover:bg-blue-50"
                          }`}>
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-600">Drop your logo here or <span className="text-blue-800">click to browse</span></p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG — square images work best</p>
                          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                            onChange={e => handleImageFile(e.target.files[0])} />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "text" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Text Content</label>
                    <textarea value={textInput} onChange={e => setTextInput(e.target.value)}
                      placeholder="Enter any text to generate QR code..." rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all resize-none" />
                  </div>
                )}

                {activeTab === "contact" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {[["firstName","First Name","John"],["lastName","Last Name","Doe"]].map(([key,label,ph]) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                          <input type="text" value={contactInfo[key]} placeholder={ph}
                            onChange={e => setContactInfo({...contactInfo,[key]:e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all" />
                        </div>
                      ))}
                    </div>
                    {[["phone","Phone Number","tel","+1 (555) 123-4567"],["email","Email Address","email","john@example.com"],["organization","Organization","text","Company Name"],["url","Website","url","https://example.com"]].map(([key,label,type,ph]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                        <input type={type} value={contactInfo[key]} placeholder={ph}
                          onChange={e => setContactInfo({...contactInfo,[key]:e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all" />
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={resetForm}
                  className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium">
                  Clear All Fields
                </button>
              </div>

              {/* Right: QR Preview */}
              <div className="flex flex-col items-center space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800">Generated QR Code</h2>

                <div className="bg-gray-50 rounded-2xl p-8 w-full max-w-sm flex flex-col items-center">
                  {qrData ? (
                    <>
                      <div ref={qrContainerRef} className="flex justify-center" />
                      <p className="text-sm text-gray-500 mt-4 text-center">Scan with your device</p>
                    </>
                  ) : (
                    <div className="text-center py-16">
                      <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-400">Fill in the form to generate your QR code</p>
                    </div>
                  )}
                </div>

                {qrData && (
                  <div className="flex gap-4 w-full max-w-sm">
                    <button onClick={downloadQRCode}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-950 to-blue-800 text-white rounded-xl hover:from-blue-900 hover:to-blue-700 transition-all font-medium shadow-lg">
                      <Download className="w-4 h-4" /> Download
                    </button>
                    <button onClick={copyToClipboard}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium">
                      {copied ? <><Check className="w-4 h-4 text-green-600" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy URL</>}
                    </button>
                  </div>
                )}

                {activeTab === "url" && logo && qrData && (
                  <p className="text-xs text-blue-800 text-center">
                    ✓ Logo embedded · High error-correction ensures scannability
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center space-y-4">
          <p className="text-gray-500 text-xs">
            <span className="font-semibold text-gray-600">Powered by Adusei Media</span> · Created with ❤️ by Adusei Media
          </p>
        </div>
      </div>


    </div>
  );
};

export default QRCodeGenerator;