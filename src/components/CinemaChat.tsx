import { useEffect, useMemo, useState, useRef } from "react";
import { sendToN8n, type UiResponse } from "../api/chatbot";
import { useAuth } from "../contexts/AuthContext";
import Markdown from "react-markdown";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "../app/store";
import { fetchMovies } from "../features/movieSlice";
import { fetchPromotions } from "../features/promotionSlice";
import type { Movie } from "../types/movie";
import type { Promotion } from "../types/promotion";

type Msg = {
  role: "user" | "bot";
  text: string;
  relatedMovies?: Movie[];
  relatedPromotions?: Promotion[];
};

function getSessionId() {
  const key = "cinema_session_id";
  const old = localStorage.getItem(key);
  if (old) return old;

  const id = `sess_${Math.random().toString(16).slice(2)}_${Date.now()}`;
  localStorage.setItem(key, id);
  return id;
}

export default function CinemaChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId] = useState(getSessionId);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [ui, setUi] = useState<UiResponse | null>(null);
  const [backendState, setBackendState] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Đang suy nghĩ...");
  const [error, setError] = useState<string>("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { movies } = useSelector((state: RootState) => state.movies);
  const { promotions } = useSelector((state: RootState) => state.promotions);

  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (movies.length === 0) dispatch(fetchMovies());
    if (promotions.length === 0) dispatch(fetchPromotions());
  }, [dispatch, movies.length, promotions.length]);

  const disabled = loading || ui?.isFinal;
  const canSend = useMemo(
    () => !disabled && input.trim().length > 0,
    [disabled, input]
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, loadingText]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (loading) {
      const texts = [
        "Đang suy nghĩ...",
        "Đang tìm kiếm thông tin...",
        "Đợi xíu nha...",
        "Đang soạn câu trả lời...",
        "Sắp xong rồi...",
      ];
      let i = 0;
      setLoadingText(texts[0]);
      interval = setInterval(() => {
        i = (i + 1) % texts.length;
        setLoadingText(texts[i]);
      }, 2500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  async function send(chatInput: string) {
    const text = chatInput.trim();
    if (!text || disabled) return;

    setError("");
    setLoading(true);

    // user message
    setMessages((prev) => [...prev, { role: "user", text }]);

    try {
      const res = await sendToN8n({
        sessionId,
        chatInput: text,
        state: backendState,
        user: user
          ? {
              id: user.id,
              name: user.name ?? `${user.firstName} ${user.lastName}`.trim(),
            }
          : null,
      });

      setUi(res.ui);
      setBackendState(res.state);

      // Analyze text to find related movies/promotions
      const lowerText = res.ui.message.toLowerCase();

      const relatedMovies = movies.filter((m) =>
        lowerText.includes(m.title.toLowerCase())
      );

      const relatedPromotions = promotions.filter((p) =>
        lowerText.includes(p.title.toLowerCase())
      );

      // bot message
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: res.ui.message,
          relatedMovies: relatedMovies.length > 0 ? relatedMovies : undefined,
          relatedPromotions:
            relatedPromotions.length > 0 ? relatedPromotions : undefined,
        },
      ]);
    } catch (e: unknown) {
      console.error(e);
      setError("Hệ thống đang bận, vui lòng thử lại sau.");
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: `Error Details: ${errorMessage}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Auto start on first open or load
  useEffect(() => {
    if (messages.length !== 0) return;

    if (!isAuthenticated) {
      setMessages([
        {
          role: "bot",
          text: "Để mình tư vấn phim, suất chiếu, ghế và ưu đãi đúng theo bạn, bạn vui lòng đăng nhập giúp mình nhé.",
        },
      ]);
      setUi({
        message:
          "Để mình tư vấn phim, suất chiếu, ghế và ưu đãi đúng theo bạn, bạn vui lòng đăng nhập giúp mình nhé.",
        options: ["Đăng nhập"],
        step: "NEED_LOGIN",
        isFinal: true,
      });
      return;
    }

    send("/start");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          display: isMobile && isOpen ? "none" : "flex",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #E50914, #B00710)", // Cinema Red Gradient
          color: "white",
          border: "none",
          boxShadow: "0 4px 15px rgba(229, 9, 20, 0.4)",
          cursor: "pointer",
          zIndex: 9999,
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          transition: "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          transform: isOpen ? "rotate(90deg)" : "scale(1)",
        }}
        onMouseOver={(e) =>
          (e.currentTarget.style.transform = isOpen
            ? "rotate(90deg) scale(1.1)"
            : "scale(1.1)")
        }
        onMouseOut={(e) =>
          (e.currentTarget.style.transform = isOpen
            ? "rotate(90deg)"
            : "scale(1)")
        }
      >
        {isOpen ? (
          <i className="bi bi-x-lg"></i>
        ) : (
          <i className="bi bi-chat-dots-fill"></i>
        )}
      </button>

      {/* Chat Window */}
      <div
        style={{
          position: "fixed",
          bottom: isMobile ? "0" : "90px",
          right: isMobile ? "0" : "20px",
          width: isMobile ? "100%" : "380px",
          maxWidth: isMobile ? "100%" : "calc(100vw - 40px)",
          height: isOpen ? (isMobile ? "100vh" : "550px") : "0px", // Animating height
          maxHeight: isMobile ? "none" : "80vh",
          borderRadius: isMobile ? "0" : "16px",
          background: "rgba(18, 18, 18, 0.95)", // Glass dark
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          zIndex: 9999,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            background: "linear-gradient(90deg, #E50914, #B00710)",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontWeight: "600",
            fontSize: "1.1rem",
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#2ecc71",
              boxShadow: "0 0 5px #2ecc71",
            }}
          ></div>
          <span>Trợ lý ảo Cinema</span>
          <div style={{ flex: 1 }}></div>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: "transparent",
              border: "none",
              color: "white",
              fontSize: "1.2rem",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Messages Area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            scrollbarWidth: "thin",
            scrollbarColor: "#444 transparent",
          }}
        >
          {messages.length === 0 && loading && (
            <div
              style={{ textAlign: "center", color: "#888", marginTop: "20px" }}
            >
              Đang khởi tạo...
            </div>
          )}

          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                padding: "12px 16px",
                borderRadius:
                  m.role === "user" ? "16px 16px 0 16px" : "16px 16px 16px 0",
                background:
                  m.role === "user"
                    ? "linear-gradient(135deg, #E50914, #ff4b5c)"
                    : "#2a2a2a",
                color: "white",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                lineHeight: "1.5",
                fontSize: "0.95rem",
                animation: "fadeIn 0.3s ease",
              }}
            >
              <Markdown
                components={{
                  p: ({ children }) => (
                    <span style={{ margin: 0 }}>{children}</span>
                  ),
                }}
              >
                {m.text}
              </Markdown>

              {/* Related Movies */}
              {m.relatedMovies && m.relatedMovies.length > 0 && (
                <div
                  style={{
                    marginTop: "12px",
                    display: "flex",
                    gap: "10px",
                    overflowX: "auto",
                    paddingBottom: "4px",
                  }}
                >
                  {m.relatedMovies.map((movie) => (
                    <div
                      key={movie.id}
                      // Fix movie navigation path
                      onClick={() => navigate(`/home/movie/${movie.id}`)}
                      title={movie.title}
                      style={{
                        width: "100px",
                        cursor: "pointer",
                        borderRadius: "8px",
                        overflow: "hidden",
                        flexShrink: 0,
                        background: "#000",
                        border: "1px solid #444",
                        transition: "transform 0.2s",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.transform = "scale(1.05)")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
                    >
                      <img
                        src={movie.image}
                        alt={movie.title}
                        style={{
                          width: "100%",
                          height: "140px",
                          objectFit: "cover",
                        }}
                      />
                      <div
                        style={{
                          padding: "6px",
                          fontSize: "0.75rem",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          textAlign: "center",
                          color: "white",
                          background:
                            "linear-gradient(to top, rgba(0,0,0,0.9), transparent)",
                        }}
                      >
                        {movie.title}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Related Promotions */}
              {m.relatedPromotions && m.relatedPromotions.length > 0 && (
                <div
                  style={{
                    marginTop: "12px",
                    display: "flex",
                    gap: "10px",
                    overflowX: "auto",
                    paddingBottom: "4px",
                  }}
                >
                  {m.relatedPromotions.map((promo) => (
                    <div
                      key={promo.id}
                      onClick={() => navigate(`/home/promotions/${promo.id}`)}
                      title={promo.title}
                      style={{
                        width: "140px",
                        cursor: "pointer",
                        borderRadius: "8px",
                        overflow: "hidden",
                        flexShrink: 0,
                        background: "#000",
                        border: "1px solid #444",
                        transition: "transform 0.2s",
                        position: "relative",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.transform = "scale(1.05)")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
                    >
                      <img
                        src={promo.img[0] || "https://via.placeholder.com/150"}
                        alt={promo.title}
                        style={{
                          width: "100%",
                          height: "80px",
                          objectFit: "cover",
                        }}
                      />
                      <div
                        style={{
                          padding: "6px",
                          fontSize: "0.75rem",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          textAlign: "center",
                          color: "white",
                        }}
                      >
                        {promo.title}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && messages.length > 0 && (
            <div
              style={{
                alignSelf: "flex-start",
                background: "#2a2a2a",
                padding: "12px 16px",
                borderRadius: "16px 16px 16px 0",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "#aaa",
                  fontStyle: "italic",
                  animation: "fadeIn 0.5s ease",
                }}
              >
                {loadingText}
              </span>
            </div>
          )}

          {error && (
            <div
              style={{
                textAlign: "center",
                color: "#ff6b6b",
                fontSize: "0.85rem",
              }}
            >
              {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        {!!ui?.options?.length && !ui.isFinal && (
          <div
            style={{
              padding: "10px 20px",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              gap: "8px",
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            {ui.options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  if (opt === "Đăng nhập") {
                    window.dispatchEvent(new CustomEvent("open-login-modal"));
                    return;
                  }
                  send(opt);
                }}
                disabled={loading}
                style={{
                  padding: "6px 12px",
                  borderRadius: "20px",
                  border: "1px solid rgba(229, 9, 20, 0.5)",
                  background: "rgba(229, 9, 20, 0.1)",
                  color: "#ff4b5c",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#E50914";
                  e.currentTarget.style.color = "white";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "rgba(229, 9, 20, 0.1)";
                  e.currentTarget.style.color = "#ff4b5c";
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div
          style={{
            padding: "16px",
            paddingBottom: "max(16px, env(safe-area-inset-bottom))",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            background: "#121212",
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disabled}
            placeholder={
              ui?.isFinal ? "Cuộc trò chuyện đã kết thúc" : "Nhập tin nhắn..."
            }
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "12px",
              border: "1px solid #333",
              background: "#1e1e1e",
              color: "white",
              outline: "none",
              fontSize: "0.95rem",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#E50914")}
            onBlur={(e) => (e.target.style.borderColor = "#333")}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSend) {
                send(input);
                setInput("");
              }
            }}
          />
          <button
            onClick={() => {
              send(input);
              setInput("");
            }}
            disabled={!canSend}
            style={{
              width: "45px",
              height: "45px",
              borderRadius: "12px",
              border: "none",
              background: canSend
                ? "linear-gradient(135deg, #E50914, #B00710)"
                : "#333",
              color: "white",
              cursor: canSend ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.1s",
            }}
            onMouseDown={(e) =>
              canSend && (e.currentTarget.style.transform = "scale(0.95)")
            }
            onMouseUp={(e) =>
              canSend && (e.currentTarget.style.transform = "scale(1)")
            }
          >
            <i className="bi bi-send-fill"></i>
          </button>
        </div>
      </div>

      {/* Styles for typing indicator */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .typing-indicator {
          display: flex;
          gap: 4px;
        }
        .typing-indicator span {
          width: 6px;
          height: 6px;
          background: #888;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </>
  );
}
