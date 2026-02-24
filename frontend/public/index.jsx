import React, { useEffect, useState } from "react";
import styles from "./styles.module.css";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { reset } from "@/config/redux/reducer/authSlice";

function NavbarComponent() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState("light");

  // ✅ ADD (MOST IMPORTANT – hydration fix)
  const [mounted, setMounted] = useState(false);

  const authState = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();

  // ✅ client-only render
  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ theme load (client only)
  useEffect(() => {
    if (!mounted) return;
    const saved = localStorage.getItem("theme") || "light";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, [mounted]);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    dispatch(reset());
    router.push("/login");
  };

  // ✅ hydration safe auth check
  const isLoggedIn = mounted && localStorage.getItem("token");

  // 🔥 MOST IMPORTANT LINE (NO HYDRATION ERROR)
  if (!mounted) return null;

  return (
    <div className={styles.container}>
      <nav className={styles.navBar}>
        <div
          className={styles.navBar_leftContainer}
          onClick={() => router.push("/")}
          style={{ cursor: "pointer" }}
        >
          PROLINKA
        </div>

        {/* ================= RIGHT DESKTOP ================= */}
        <div className={styles.rightBox}>
          <span>Support</span>

          {isLoggedIn ? (
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <span>
                Hi, {authState.user?.userId?.name || "User"}
              </span>

              <span
                style={{ fontWeight: "600", cursor: "pointer" }}
                onClick={handleLogout}
              >
                Logout
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "1rem" }}>
              <Link href="/login" className={styles.loginBtn}>
                Login
              </Link>
              <button
                className={styles.registerBtn}
                onClick={() => router.push("/register")}
              >
                Register
              </button>
            </div>
          )}

          {/* ✅ theme icon client-only */}
          <span className={styles.themeIcon} onClick={toggleTheme}>
            {theme === "light" ? "🌙" : "☀️"}
          </span>
        </div>

        {/* ================= MOBILE MENU ICON ================= */}
        <div className={styles.menuButton} onClick={() => setOpen(!open)}>
          {open ? "✕" : "☰"}
        </div>
      </nav>

      {/* ================= MOBILE DROPDOWN ================= */}
      {open && (
        <div className={styles.dropBox}>
          <div onClick={toggleTheme}>
            {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
          </div>

          <span>Support</span>

          {!isLoggedIn && <Link href="/login">Login</Link>}

          {!isLoggedIn && (
            <button
              className={styles.registerBtn}
              onClick={() => router.push("/register")}
            >
              Register
            </button>
          )}

          {isLoggedIn && (
            <>
              <span>
                Hi, {authState.user?.userId?.name || "User"}
              </span>
              <span
                onClick={handleLogout}
                style={{ cursor: "pointer", fontWeight: "600" }}
              >
                Logout
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default NavbarComponent;
