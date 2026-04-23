import {
  createTheme,
  ThemeProvider,
  CssBaseline,
  Snackbar,
  Alert,
} from "@mui/material";
import axios from "axios";
import { useState, useEffect } from "react";

const STYLES = `
  body {
    background: #0f0f0f;
    color: #e5e5e5;
    font-family: system-ui, sans-serif;
  }

  .container {
    max-width: 700px;
    margin: 40px auto;
    padding: 20px;
  }

  h1 {
    font-size: 18px;
    margin-bottom: 20px;
    font-weight: 500;
  }

  textarea {
    width: 100%;
    min-height: 140px;
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    border-radius: 6px;
    padding: 10px;
    color: #eee;
    font-size: 13px;
    margin-bottom: 12px;
    resize: vertical;
  }

  textarea:focus {
    outline: none;
    border-color: #555;
  }

  .tone-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }

  .chip {
    padding: 5px 10px;
    border: 1px solid #333;
    border-radius: 5px;
    background: #1a1a1a;
    font-size: 12px;
    cursor: pointer;
    color: #aaa;
  }

  .chip.active {
    background: #333;
    color: #fff;
  }

  .buttons {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }

  .reset-button {
    background-color: rgb(201, 9, 9);
    border: none;
    transition: all .3s ease;
  }
    
  .reset-button:hover {
      background-color: red;
      transition: all .3s ease;
     }

  button {
    padding: 8px 14px;
    border-radius: 5px;
    border: 1px solid #333;
    background: #1a1a1a;
    color: #ddd;
    font-size: 13px;
    cursor: pointer;
    transition: all .1s ease;
  }

  button:active {
    transform: scale(0.95);
    transition: all .1s ease;
  }

  button:hover {
    background: #2a2a2a;
  }

  .primary {
    background: #2563eb;
    border: none;
    color: white;
  }

  .primary:hover {
    background: #1d4ed8;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TONES = ["None", "Professional", "Casual", "Friendly", "Formal", "Concise"];

export default function App() {

  const [emailContent, setEmailContent] = useState(() => localStorage.getItem("emailContent") || "");
  const [tone, setTone] = useState(() => localStorage.getItem("tone") || "None");
  const [generatedReply, setGeneratedReply] = useState(() => localStorage.getItem("generatedReply") || "");
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", type: "success" });

  useEffect(() => {
    localStorage.setItem("emailContent", emailContent);
    localStorage.setItem("tone", tone);
    localStorage.setItem("generatedReply", generatedReply);
  }, [emailContent, tone, generatedReply]);

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = STYLES;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  const toast = (msg, type = "success") =>
    setSnack({ open: true, msg, type });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8080/api/email/generate", {
        emailContent,
        tone: tone === "None" ? "" : tone,
      });
      setGeneratedReply(res.data);
      toast("Generated");
    } catch {
      toast("Backend not working", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedReply) return toast("Nothing to copy", "error");
    navigator.clipboard.writeText(generatedReply);
    toast("Copied");
  };

  const handleReset = () => {
    setEmailContent("");
    setTone("None");
    setGeneratedReply("");
  };

  return (
    <ThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
      <CssBaseline />

      <div className="container">
        <h1>Email Reply Generator (AI - Powered)</h1>

        <textarea
          placeholder="Paste your email..."
          value={emailContent}
          onChange={(e) => setEmailContent(e.target.value)}
        />

        <div className="tone-row">
          {TONES.map((t) => (
            <div
              key={t}
              className={`chip ${tone === t ? "active" : ""}`}
              onClick={() => setTone(t)}
            >
              {t}
            </div>
          ))}
        </div>

        <textarea
          placeholder="Generated reply..."
          value={generatedReply}
          readOnly
        />

        <div className="buttons">
          <button
            className="primary"
            onClick={handleSubmit}
            disabled={!emailContent || loading}
          >
            {loading ? "Generating..." : "Generate"}
          </button>

          <button onClick={handleCopy}>Copy</button>
          <button onClick={handleReset} className="reset-button">Reset</button>
        </div>
      </div>

      <Snackbar
        open={snack.open}
        autoHideDuration={2000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snack.type}>{snack.msg}</Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
