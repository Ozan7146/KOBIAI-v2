import React, { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User } from "lucide-react";

export default function ChatAssistant({ isOpen, onClose }) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content:
        "Merhaba! Ben KOBİ-AI Asistan. Sipariş, stok veya kargolarla ilgili güncel verilere sahibim. Sana nasıl yardımcı olabilirim?",
    },
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error("Sunucu yanıt vermedi");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "ai", content: data.response }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content:
            "Bağlantı hatası oluştu. Lütfen backend sunucusunun (uvicorn) çalıştığından emin olun.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: isMobile ? "85px" : "24px",
        right: isMobile ? "16px" : "24px",
        zIndex: 9999,
        width: isMobile ? "calc(100vw - 32px)" : "380px",
        height: isMobile ? "calc(100vh - 120px)" : "600px",
        maxHeight: "85vh",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "20px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        animation: "fadeIn 0.3s ease",
      }}
    >
      <div
        style={{
          padding: "20px",
          background:
            "linear-gradient(135deg, var(--bg-card) 0%, rgba(245,158,11,0.1) 100%)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "breathe 2s infinite ease-in-out",
            }}
          >
            <Bot size={20} color="#000" />
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "16px",
                color: "var(--text-primary)",
              }}
            >
              Q-AI Asistan
            </h3>
            <span
              style={{
                fontSize: "12px",
                color: "var(--green)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  background: "var(--green)",
                  borderRadius: "50%",
                  display: "inline-block",
                }}
              ></span>
              Çevrimiçi
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="btn btn-ghost btn-sm"
          style={{ padding: "8px", borderRadius: "50%" }}
        >
          <X size={20} />
        </button>
      </div>

      <div
        style={{
          flex: 1,
          padding: "20px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              gap: "12px",
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: msg.role === "user" ? "var(--bg)" : "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {msg.role === "user" ? (
                <User size={14} color="var(--text-primary)" />
              ) : (
                <Bot size={14} color="#000" />
              )}
            </div>
            <div
              style={{
                maxWidth: "75%",
                padding: "12px 16px",
                borderRadius:
                  msg.role === "user" ? "20px 20px 0 20px" : "20px 20px 20px 0",
                background:
                  msg.role === "user" ? "var(--bg)" : "rgba(245, 158, 11, 0.1)",
                border:
                  msg.role === "user"
                    ? "1px solid var(--border)"
                    : "1px solid rgba(245, 158, 11, 0.2)",
                color:
                  msg.role === "user" ? "var(--text-primary)" : "var(--accent)",
                fontSize: "14px",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bot size={14} color="#000" />
            </div>
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "20px 20px 20px 0",
                background: "rgba(245, 158, 11, 0.1)",
                display: "flex",
                gap: "6px",
              }}
            >
              <div
                className="spinner"
                style={{
                  width: "6px",
                  height: "6px",
                  borderTopColor: "var(--accent)",
                }}
              />
              <div
                className="spinner"
                style={{
                  width: "6px",
                  height: "6px",
                  borderTopColor: "var(--accent)",
                }}
              />
              <div
                className="spinner"
                style={{
                  width: "6px",
                  height: "6px",
                  borderTopColor: "var(--accent)",
                }}
              />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div
        style={{
          padding: "16px",
          borderTop: "1px solid var(--border)",
          background: "var(--bg-card)",
          display: "flex",
          gap: "12px",
          flexShrink: 0,
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Asistana bir soru sorun..."
          className="input"
          style={{
            flex: 1,
            borderRadius: "24px",
            paddingLeft: "16px",
            height: "48px",
          }}
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          className="btn btn-primary"
          disabled={isLoading || !input.trim()}
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Send
            size={18}
            color="#000"
            style={{ transform: "translateX(-2px)" }}
          />
        </button>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes breathe {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
