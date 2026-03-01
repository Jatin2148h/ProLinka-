import Head from "next/head";
import { Inter } from "next/font/google";
import styles from "../styles/Home.module.css";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import UserLayout from "@/layout/UserLayout";
import { BASE_URL } from "@/config";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const router = useRouter();

  // Auto-ping backend to keep it awake (prevents Render sleep)
  useEffect(() => {
    const pingBackend = async () => {
      try {
        await fetch(`${BASE_URL}/health`, { 
          method: 'GET',
          mode: 'no-cors' // Don't wait for response
        });
        console.log("🔄 Backend pinged to stay awake");
      } catch (error) {
        // Silent fail - don't bother user
        console.log("Backend ping failed (normal if sleeping)");
      }
    };

    // Ping on mount and every 4 minutes
    pingBackend();
    const interval = setInterval(pingBackend, 4 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <UserLayout>
      <div className={styles.container}>
        <div className={styles.mainContainer}>
          <div className={styles.mainContainer_left}>
            <p>Connect with freinds without Exaggeration</p>
            <p>A true social media plateform, with stories no blufs !</p>

            <div
              onClick={() => router.push("/login")}
              className={styles.buttonJoin}
            >
              <p>Join Now</p>
            </div>
          </div>

          <div className={styles.mainContainer_right}>
            <img src="/images/logo.jpg" alt="Logo" />
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
