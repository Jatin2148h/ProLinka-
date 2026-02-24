import UserLayout from "@/layout/UserLayout";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import styles from "./style.module.css";
import {
  loginUser,
  registerUser
} from "@/config/redux/action/authAction";

import { emptyMessage } from "@/config/redux/reducer/authSlice";


function LoginPage() {
  const { loggedIn, message, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");

  /* ======================
     REDIRECT IF LOGGED IN
  ====================== */
useEffect(() => {
  if (loggedIn && localStorage.getItem("token")) {
    router.replace("/dashboard"); // replace, not push
  }
}, [loggedIn, router]);


  /* ======================
     CLEAR MESSAGE ON SWITCH
  ====================== */
  useEffect(() => {
    dispatch(emptyMessage());
  }, [isLogin, dispatch]);

  const handleSubmit = () => {
    if (isLogin) {
      dispatch(loginUser({ email, password }));
    } else {
      dispatch(registerUser({ username, name, email, password }));
    }
  };
  

  return (
    <UserLayout hideNavbar>
      <div className={styles.container}>
        <div className={styles.card}>

          {/* ================= LEFT PANEL ================= */}
          <div className={styles.leftPanel}>
            <h2>{isLogin ? "Welcome Back!" : "Hello, Friend!"}</h2>

            <p>
              {isLogin
                ? "Login with your personal details to stay connected with us."
                : "Enter your personal details and start your journey with us."}
            </p>

            <button
              className={styles.switchBtn}
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </div>

          {/* ================= RIGHT PANEL ================= */}
          <div className={styles.rightPanel}>
            <h2>{isLogin ? "Sign In" : "Create Account"}</h2>

            {/* MESSAGE */}
            {message?.message && (
              <p
                className={
                  message.type === "error"
                    ? styles.error
                    : styles.success
                }
              >
                {message.message}
              </p>
            )}

            {/* SIGN UP EXTRA FIELDS */}
            {!isLogin && (
              <>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />

                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </>
            )}

            {/* COMMON FIELDS */}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button onClick={handleSubmit} disabled={loading}>
              {loading
                ? "Please wait..."
                : isLogin
                ? "Sign In"
                : "Sign Up"}
            </button>

            {/* MOBILE TOGGLE */}
            <p
              className={styles.toggle}
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin
                ? "Don't have an account? Sign Up"
                : "Already have an account? Sign In"}
            </p>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}

export default LoginPage;
