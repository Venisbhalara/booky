"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import pagesHtml from "@/data/aardvark/pages-html.json";

type Mode = "login" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function switchMode(m: Mode) {
    setMode(m);
    setError("");
    setName("");
    setEmail("");
    setPassword("");
    setShowPw(false);
  }

  async function handleSubmit() {
    setError("");
    if (mode === "signup" && name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const body =
        mode === "login"
          ? { email: email.trim().toLowerCase(), password }
          : { name: name.trim(), email: email.trim().toLowerCase(), password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <main className="main">
      {/* ─── Exact Aardvark Hero-XS with Animated Wave SVG & Mascot Pop-up ─── */}
      <section data-hero-faq="" className="hero-xs is--bg-pale-pink">
        <div className="hero-xs__container u-container">
          <div className="hero-xs__inner is--all-books">
            <div className="hero-xs__content is--all-books">
              <h1 data-hero-faq-title="" className="hero-xs__title u-heading-xxl">
                Member Access
              </h1>
              <p
                data-hero-faq-paragraph=""
                className="hero-xs__paragraph u-paragraph-large"
              >
                Sign in or join the club to borrow, lend, and collect fresh fiction every month.
              </p>

              <div
                data-hero-faq-easter-egg=""
                className="hero-xs__easter-egg"
                style={{ top: "-2.75em", right: "1.5em" }}
              >
                <div data-pop-up="" data-wf--logo-pop-up--variant="left" className="pop-up">
                  <button
                    type="button"
                    data-pop-up-button=""
                    aria-label="Club Member Perks"
                    className="pop-up__button"
                  >
                    <span className="pop-up__button-inner">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 80 80"
                        width="100%"
                        className="pop-up__button-svg"
                      >
                        <path
                          fill="currentColor"
                          d="m53.332 55.909-9.81-22.05c1.253-3.071 4.434-12.573 1.132-24.425a.845.845 0 0 0-.602-.6.82.82 0 0 0-.82.24c-.096.12-2.651 2.711-4.507 6.19-2.58 4.799-2.531 8.854.12 11.78 2.917 3.192 3.062 5.423 2.893 6.431l-.555.048c-.988-2.111-4.29-8.062-12.51-13.82a.734.734 0 0 0-.698-.072c-.242.096-.386.336-.41.576-.314 3.839.723 11.3 6.893 12.212 3.881.576 5.183 1.68 5.593 2.136-.121.816-.41 1.871-.989 3.239l-7.28 16.651h-.023a1.456 1.456 0 0 1-.12.288l-.097.192c-1.157 2.471-5.327 6.766-6.99 8.446-.41.431-.7.72-.796.84-.096.12-.385.575.169 1.175.771.84 3.182 1.895 4.315 1.104.337-.24.53-.48.747-.768.627-.816 4.001-4.559 9.424-9.261 0 0 1.76-2.184 4.435-2.52h1.616c1.205 0 2.169.288 2.723 1.512l.892 2.04c.844 1.943.844 2.998-2 3.454v1.296h11.642v-1.248c-2.363-.432-2.869-1.727-4.387-5.086Zm-13.233-7.27a2.284 2.284 0 0 1-2.29-2.28 2.284 2.284 0 0 1 2.29-2.279 2.284 2.284 0 0 1 2.29 2.28c0 1.247-1.037 2.279-2.29 2.279Z"
                        />
                        <path
                          fill="currentColor"
                          fillRule="evenodd"
                          d="M40.922 0C63.522 0 80 18.401 80 41.1 80 63.8 63.522 80 40.922 80S0 63.8 0 41.1C0 18.402 18.321 0 40.922 0Zm22.857 15.697c-13.817-13.474-36.234-13.754-49.77 0C.473 29.45 2.035 50.379 15.852 63.853 29.67 77.327 52.823 79.81 66.36 66.055c13.537-13.754 11.237-36.884-2.58-50.358Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </button>
                  <div className="pop-up__overlay">
                    <div className="pop-up__overlay-inner">
                      <div className="pop-up__overlay-bg-wrap">
                        <div className="pop-up__overlay-ears">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 44 45"
                            width="100%"
                            className="pop-up__overlay-left-ear"
                          >
                            <path
                              fill="currentColor"
                              d="M1.335.198c.671-.316 1.5-.254 2.186.187C27.678 16.847 39.839 36.953 44 45h-6.048c-2.382-1.604-6.964-3.674-15.652-4.814C2.999 37.666-.665 14.174.09 2.04.152 1.28.589.515 1.335.198Z"
                            />
                          </svg>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 29 80"
                            width="100%"
                            className="pop-up__overlay-right-ear"
                          >
                            <path
                              fill="currentColor"
                              d="M19.388.879c.667-.771 1.647-1.018 2.559-.807.912.21 1.682.956 1.926 1.861C34.595 38.09 25.79 69.237 21.823 80h-4.188c-.17-4.22-2.739-13.318-10.975-22.064-8.493-9.099-8.88-21.913-1.063-37.23C11.221 9.603 19.091 1.266 19.388.879Z"
                            />
                          </svg>
                        </div>
                        <div className="pop-up__overlay-bg"></div>
                      </div>
                      <div className="pop-up__overlay-content">
                        <h3 className="pop-up__overlay-title u-heading-xs">
                          Explore the Catalog!
                        </h3>
                        <div className="pop-up__overlay-content-action">
                          <a
                            data-button-alt=""
                            data-wf--button-alt--variant="small"
                            href="/allbooks"
                            className="button-alt w-inline-block w-variant-b39d24c2-c660-7d7a-12b0-b72aa9a9f575"
                          >
                            <span className="button-alt__text-wrap">
                              <span className="button-alt__bg"></span>
                              <span className="button-alt__text-outer">
                                <span data-button-alt-text="" className="button-alt__text">
                                  All Books
                                </span>
                              </span>
                            </span>
                            <span className="button-alt__icon-wrap">
                              <span className="button-alt__bg"></span>
                              <span className="button-alt__icon-outer">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="100%"
                                  viewBox="0 0 14 13"
                                  fill="none"
                                  aria-hidden="true"
                                  className="button-alt__icon"
                                >
                                  <path
                                    d="M13.58 5.66v.845l-5.994 5.66-1.71-2.063a61.427 61.427 0 0 1 4.265-2.988l-.02-.078c-1.828.196-4.107.294-6.387.294H0V4.835h3.734c2.28 0 4.56.098 6.387.294l.02-.059a67.638 67.638 0 0 1-4.265-3.006L7.586 0l5.994 5.66Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                            </span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div data-hero-faq-bg="" data-load-reset="" className="hero-xs__bg is--all-books">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 1920 741"
            data-background-animation=""
            data-background-animation-small=""
            className="hero-xs__bg-svg is--desktop"
          >
            <path
              d="M1049.63-17.97c36.93-23.347 66.53-10.406 80.64 30.618 2.19 6.392 4.26 13.013 5.07 19.688 3.14 26.09 6.14 52.202 8.43 78.361 3.77 42.942 6.84 85.927 25.3 125.923 18.88 40.91 49.05 68.502 95.04 70.881 29.05 1.497 59.3-.302 87.52-6.943 49.32-11.622 97.55-27.869 146.1-42.647 32.63-9.929 65.49-17.944 99.89-18.599 55.29-1.073 93.5 33.788 92.01 89.047-.77 28.123-6.6 56.708-14.28 83.918-15.28 54.047-35.57 106.72-49.49 161.064-7.39 28.838-9.66 60.251-7.46 90.019 4.6 62.533 45.3 98.353 100.43 119.932 46.04 18.031 94.69 24.895 143.53 28.453 66.87 4.869 134.06 5.653 200.75 11.915 38.47 3.624 77.5 10.844 114.03 23.145 5.27 1.777 10.19 3.851 14.75 6.195h-683.12c-16.66-27.763-23.84-59.396-23.43-92.685.64-51.494 6.11-102.944 10.51-154.333 3.49-40.763 6.1-81.199-3.97-121.586-14.54-58.354-70.4-108.208-138.8-97.446-35.03 5.512-66.32 20.468-98.15 35.08-30.29 13.905-61.38 27.92-93.63 35.331-47.61 10.932-88.26-4.47-118.08-45.226-23.75-32.468-33.9-69.747-41.16-108.32-5.857-31.117-9.36-62.913-24.702-91.462-13.245-24.651-32.561-31.968-59.106-23.846-19.65 6.02-34.623 17.968-45.849 34.42-12.75 18.701-24.527 38.072-36.321 57.403-36.201 59.286-88.611 85.591-157.374 74.881-30.769-4.789-60.894-13.839-91.224-21.317-45.747-11.284-91.192-24.69-139.2-19.738-31.065 3.208-61.766 9.443-85.444 31.169-41.003 37.622-38.965 94.104 11.312 118.065 26.827 12.782 54.983 23.668 83.585 31.636 63.7 17.751 128.605 31.291 192.032 49.922 93.339 27.427 171.429 77.189 222.018 163.593 26.548 45.358 44.07 92.748 44.656 144.459H711.717c1.765-27.787-4.208-56.32-18.854-85.698-18.172-36.456-45.857-65.011-77.214-90.08-50.413-40.293-108.544-66.98-166.79-93.439-57.74-26.221-116.373-50.687-168.967-86.985-47.597-32.845-88.406-71.062-104.747-129.135-8.643-30.688-5.748-60.193 10.542-87.872 24.71-41.971 63.847-64.979 108.586-78.806 46.229-14.277 94.19-18.879 142.432-17.631 68.371 1.758 136.721 6.839 205.071 6.806 74.895-.052 147.682-13.865 211.046-56.732 37.79-25.558 72.668-55.42 108.761-83.47 29.284-22.76 56.857-48.199 88.047-67.927"
              fill="#F2BDCD"
              stroke="#F2BDCD"
            />
            <path
              d="M862.23 421.023c15.187-10.163 38.571-8.943 54.332 5.334 14.036 12.711 26.774 27.035 38.815 41.698 34.388 41.903 78.023 65.791 132.293 68.316 40.26 1.875 80.69.722 120.86 3.52 25.98 1.82 52.1 6.503 77.3 13.133 43.76 11.508 66.61 43.17 70.38 86.757 2.88 33.246 1.62 66.916.99 100.383-.77 40.597 5.04 78.662 20.99 112.836h-83.58c-21.73-30.895-44.26-61.25-67.31-91.114-15.94-20.664-37.6-38.253-59.68-52.544-29.1-18.821-51.71-7.969-56.87 26.391-2.96 19.693-3.45 41.6 2.17 60.352 5.72 19.067 11.81 38.035 18.18 56.915h-95.93c-9-48.716-24.49-95.981-45.359-142.125-26.931-59.538-64.041-112.467-103.719-163.878-17.501-22.689-33.777-46.135-41.084-74.478-5.787-22.434.141-40.068 17.222-51.496"
              fill="#F2BDCD"
              stroke="#F2BDCD"
            />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 402 448"
            className="hero-xs__bg-svg is--mobile"
          >
            <path
              d="M307.046 125.469c22.723-2.21 39.43 7.302 51.275 26.209 10.657 17.017 13.474 36.421 16.842 55.698 3.597 20.597 7.031 41.265 11.795 61.606 3.527 15.057 11.805 27.884 23.708 38.158 4.825 4.164 9.919 7.321 15.334 9.395v62.619c-2.484.173-4.97.402-7.459.665-15.534 1.65-31.059 3.755-46.642 4.402-8.916.368-18.165-.846-26.859-2.986-13.764-3.391-21.278-13.487-24.609-26.951-3.254-13.163-1.685-26.335-.329-39.535.826-8.045 1.435-16.113 2.005-24.177.148-2.066-.096-4.188-.391-6.251-1.884-13.22-10.078-18.853-22.596-13.941-10.576 4.151-20.388 10.239-30.563 15.418-12.537 6.381-24.816 13.377-37.724 18.911-21.644 9.28-44.45 9.226-67.094 4.885-20.667-3.961-41.03-9.469-61.595-13.973-14.511-3.181-29.276-4.576-44.08-2.946-14.328 1.58-27.495 6.26-37.403 17.516-6.529 7.42-9.118 16.17-8.293 25.95 1.565 18.505 11.679 32.425 24.16 45.123 13.79 14.033 30.092 24.832 46.023 36.114 16.073 11.381 32.095 22.827 44.989 37.937 4.972 5.827 9.44 11.976 12.922 18.685H32.2c-8.792-8.776-18.882-16.07-29.18-23.2-5.992-4.149-12.015-8.26-18.02-12.397V235.434c6.832-2.029 14.071-3.458 21.723-4.265 20.082-2.119 39.421 2.196 58.388 8.401 17.757 5.811 35.37 12.087 53.246 17.498 26.176 7.923 48.783.877 66.789-19.067 12.115-13.422 23.01-27.988 33.918-42.444 13.713-18.173 27.206-36.5 45.05-50.971 12.568-10.196 26.47-17.512 42.932-19.117"
              fill="#F2BDCD"
              stroke="#F2BDCD"
            />
          </svg>
        </div>
      </section>

      {/* ─── Auth Card Section with Aardvark Rounded Bottom Curve ─── */}
      <section data-faq-content="" className="terms">
        <div
          className="u-container"
          style={{ paddingTop: "3em", paddingBottom: "4em" }}
        >
          <div
            style={{
              maxWidth: "38em",
              marginLeft: "auto",
              marginRight: "auto",
              position: "relative",
            }}
          >
            {/* Signature Aardvark Ears on Top of the Card */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-end",
                gap: "0.35em",
                marginBottom: "-0.3em",
                color: "var(--pale-yellow, #faed8f)",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 44 45"
                style={{ width: "2.5em", height: "auto" }}
              >
                <path
                  fill="currentColor"
                  d="M1.335.198c.671-.316 1.5-.254 2.186.187C27.678 16.847 39.839 36.953 44 45h-6.048c-2.382-1.604-6.964-3.674-15.652-4.814C2.999 37.666-.665 14.174.09 2.04.152 1.28.589.515 1.335.198Z"
                />
              </svg>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 29 80"
                style={{ width: "1.75em", height: "auto" }}
              >
                <path
                  fill="currentColor"
                  d="M19.388.879c.667-.771 1.647-1.018 2.559-.807.912.21 1.682.956 1.926 1.861C34.595 38.09 25.79 69.237 21.823 80h-4.188c-.17-4.22-2.739-13.318-10.975-22.064-8.493-9.099-8.88-21.913-1.063-37.23C11.221 9.603 19.091 1.266 19.388.879Z"
                />
              </svg>
            </div>

            <div
              style={{
                backgroundColor: "var(--pale-yellow, #faed8f)",
                borderRadius: "3em",
                padding: "2.75em 2.5em",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.06)",
              }}
            >
              <div style={{ textAlign: "center", marginBottom: "1.75em" }}>
                <span
                  className="u-handwritten-regular"
                  style={{
                    display: "inline-block",
                    color: "var(--magenta, #ff008c)",
                    transform: "rotate(-2deg)",
                    marginBottom: "0.4em",
                  }}
                >
                  {mode === "login" ? "Welcome back, bookworm!" : "Fresh fiction awaits!"}
                </span>
                <h2
                  className="u-heading-s"
                  style={{ color: "var(--black)", lineHeight: 0.95 }}
                >
                  {mode === "login" ? "Sign in to your account" : "Create your club account"}
                </h2>
              </div>

              {/* Mode Toggle Tabs with Aardvark styling */}
              <div
                role="tablist"
                style={{
                  backgroundColor: "var(--white)",
                  borderRadius: "999px",
                  padding: "0.35em",
                  marginBottom: "2em",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.5em",
                }}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "login"}
                  onClick={() => switchMode("login")}
                  style={{
                    backgroundColor:
                      mode === "login" ? "var(--magenta, #ff008c)" : "transparent",
                    color: mode === "login" ? "var(--white)" : "var(--black)",
                    borderRadius: "999px",
                    padding: "0.85em 1.25em",
                    fontSize: "1.125em",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                  className="transition-colors"
                >
                  Log in
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "signup"}
                  onClick={() => switchMode("signup")}
                  style={{
                    backgroundColor:
                      mode === "signup" ? "var(--magenta, #ff008c)" : "transparent",
                    color: mode === "signup" ? "var(--white)" : "var(--black)",
                    borderRadius: "999px",
                    padding: "0.85em 1.25em",
                    fontSize: "1.125em",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                  className="transition-colors"
                >
                  Sign up
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.25em" }}>
                {mode === "signup" && (
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5em",
                        fontSize: "0.95em",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: "rgba(0,0,0,0.7)",
                      }}
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Rebecca Birrell"
                      autoComplete="name"
                      onKeyDown={(e) => e.key === "Enter" && !busy && handleSubmit()}
                      style={{
                        width: "100%",
                        borderRadius: "1.25em",
                        border: "2px solid rgba(0,0,0,0.14)",
                        backgroundColor: "var(--white)",
                        padding: "0.95em 1.25em",
                        fontSize: "1.125em",
                        fontWeight: 600,
                        color: "var(--black)",
                        outline: "none",
                      }}
                    />
                  </div>
                )}

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5em",
                      fontSize: "0.95em",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      color: "rgba(0,0,0,0.7)",
                    }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="priya@example.com"
                    autoComplete="email"
                    onKeyDown={(e) => e.key === "Enter" && !busy && handleSubmit()}
                    style={{
                      width: "100%",
                      borderRadius: "1.25em",
                      border: "2px solid rgba(0,0,0,0.14)",
                      backgroundColor: "var(--white)",
                      padding: "0.95em 1.25em",
                      fontSize: "1.125em",
                      fontWeight: 600,
                      color: "var(--black)",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5em",
                      fontSize: "0.95em",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      color: "rgba(0,0,0,0.7)",
                    }}
                  >
                    {mode === "signup" ? "Password (min. 6 characters)" : "Password"}
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                      onKeyDown={(e) => e.key === "Enter" && !busy && handleSubmit()}
                      style={{
                        width: "100%",
                        borderRadius: "1.25em",
                        border: "2px solid rgba(0,0,0,0.14)",
                        backgroundColor: "var(--white)",
                        padding: "0.95em 3.25em 0.95em 1.25em",
                        fontSize: "1.125em",
                        fontWeight: 600,
                        color: "var(--black)",
                        outline: "none",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      aria-label={showPw ? "Hide password" : "Show password"}
                      style={{
                        position: "absolute",
                        right: "1em",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "transparent",
                        border: "none",
                        color: "rgba(0,0,0,0.55)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    style={{
                      backgroundColor: "var(--wine, #670a2e)",
                      color: "var(--white)",
                      borderRadius: "1.25em",
                      padding: "0.875em 1.25em",
                      fontSize: "0.95em",
                      fontWeight: 700,
                    }}
                  >
                    {error}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "0.75em",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={busy}
                    className="button-alt"
                    style={{
                      cursor: busy ? "wait" : "pointer",
                      opacity: busy ? 0.7 : 1,
                    }}
                  >
                    <span className="button-alt__text-wrap">
                      <span className="button-alt__bg"></span>
                      <span className="button-alt__text-outer">
                        <span className="button-alt__text">
                          {busy
                            ? "Signing in..."
                            : mode === "login"
                              ? "Sign in to the Club"
                              : "Create Club Account"}
                        </span>
                      </span>
                    </span>
                    <span className="button-alt__icon-wrap">
                      <span className="button-alt__bg"></span>
                      <span className="button-alt__icon-outer">
                        {busy ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="100%"
                            viewBox="0 0 14 13"
                            fill="none"
                            aria-hidden="true"
                            className="button-alt__icon"
                          >
                            <path
                              d="M13.58 5.66v.845l-5.994 5.66-1.71-2.063a61.427 61.427 0 0 1 4.265-2.988l-.02-.078c-1.828.196-4.107.294-6.387.294H0V4.835h3.734c2.28 0 4.56.098 6.387.294l.02-.059a67.638 67.638 0 0 1-4.265-3.006L7.586 0l5.994 5.66Z"
                              fill="currentColor"
                            />
                          </svg>
                        )}
                      </span>
                    </span>
                  </button>
                </div>

                <div
                  style={{
                    marginTop: "0.75em",
                    borderRadius: "1.25em",
                    backgroundColor: "rgba(255,255,255,0.75)",
                    padding: "1em 1.25em",
                    textAlign: "center",
                    fontSize: "0.95em",
                    fontWeight: 600,
                    color: "rgba(0,0,0,0.8)",
                  }}
                >
                  Demo Credentials: <strong>priya@example.com</strong> /{" "}
                  <strong>password123</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: pagesHtml.chrome.taglineCurve }}
        />
      </section>
    </main>
  );
}
