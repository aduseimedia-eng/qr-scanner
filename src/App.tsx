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
        👋 QR Code Generator
      </h1>
      <p style={{ color: "#666", marginBottom: "30px", fontSize: "18px", maxWidth: "500px" }}>
        Hello! This is a React application displaying correctly from Vite and GitHub Pages.
      </p>
      <button onClick={() => alert('Button works!')} style={{
        padding: "12px 24px",
        background: "linear-gradient(135deg, #1a3a8f, #1565c0)",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontWeight: "600",
        fontSize: "16px",
        cursor: "pointer"
      }}>
        Click Me - If you see this, React is working!
      </button>
    </div>
  );
}
