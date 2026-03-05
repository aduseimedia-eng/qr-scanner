export default function App() {
  return (
    <div style={{
      padding: "40px",
      textAlign: "center",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      background: "linear-gradient(175deg, #eef2ff 0%, #f8faff 55%, #fff 100%)",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <h1 style={{ color: "#0f2560", marginBottom: "20px", fontSize: "3rem" }}>
        QR Code Generator
      </h1>
      <p style={{ color: "#666", marginBottom: "30px", fontSize: "18px", maxWidth: "500px" }}>
        The application is loading... If you see this message, React is working correctly!
      </p>
      <div style={{
        display: "inline-block",
        padding: "20px 40px",
        background: "linear-gradient(135deg, #1a3a8f, #1565c0)",
        color: "white",
        borderRadius: "8px",
        fontWeight: "600",
        fontSize: "16px"
      }}>
        ✓ React is mounted and working
      </div>
    </div>
  );
}
