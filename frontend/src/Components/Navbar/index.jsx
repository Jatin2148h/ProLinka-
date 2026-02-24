import React, { useEffect, useState, useRef } from "react";
import styles from "./styles.module.css";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
// ✅ Reducer imports
import { reset, setUser } from "@/config/redux/reducer/authSlice";

function NavbarComponent() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const [mounted, setMounted] = useState(false);
  
  // ✅ 1. PRO LOOP KILLER: Isse loop kabhi nahi chalega
  const isInitialSyncDone = useRef(false);

  const authState = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();

  // Initial Hydration Fix
  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ 2. FIXED SYNC LOGIC: LocalStorage se data load karna (NO LOOP)
  useEffect(() => {
    if (mounted && !isInitialSyncDone.current) {
      const savedUser = localStorage.getItem("user");
      
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          
          // Agar Redux state empty hai, toh set karein
          if (!authState.user?.name) {
            dispatch(setUser(userData));
          }
          
          // ✅ Loop ko hamesha ke liye lock kar diya
          isInitialSyncDone.current = true; 
          console.log("Console loop stopped. Name permanently set:", userData.name);
        } catch (err) {
          console.error("User data sync error", err);
        }
      }
    }
    // ❌ Dependency se authState.user bilkul hata diya loop rokne ke liye
  }, [mounted, dispatch]); 

  // 3. Theme Persistence
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

  const isLoggedIn = mounted && localStorage.getItem("token");

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

        <div className={styles.rightBox}>
          <span>Support</span>

          {isLoggedIn ? (
            <div onClick={()=>{
                router.push("/profile")
              }} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <span>
                {/* ✅ DISPLAY FALLBACK: Jab tak data settle na ho storage se dikhao */}
                Hi, {authState.user?.name || (mounted && JSON.parse(localStorage.getItem("user") || "{}")?.name) || "..."}
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
              <Link href="/login" className={styles.loginBtn}>Login</Link>
              <button
                className={styles.registerBtn}
                onClick={() => router.push("/register")}
              >
                Register
              </button>
            </div>
          )}

          <span className={styles.themeIcon} onClick={toggleTheme}>
            {theme === "light" ? "🌙" : "☀️"}
          </span>
        </div>

        <div className={styles.menuButton} onClick={() => setOpen(!open)}>
          {open ? "✕" : "☰"}
        </div>
      </nav>

      {/* MOBILE DROPDOWN */}
      {open && (
        <div className={styles.dropBox}>
          <div onClick={toggleTheme} className={styles.navLink_Mobile}>
            {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
          </div>
          <span className={styles.navLink_Mobile}>Support</span>
          {isLoggedIn && (
            <>
              <span onClick={()=>{
                router.push("/profile")
              }} className={styles.navLink_Mobile}>
                Hi, {authState.user?.name || (mounted && JSON.parse(localStorage.getItem("user") || "{}")?.name) || "..."}
              </span>
              <span 
                onClick={handleLogout} 
                className={styles.navLink_Mobile}
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