import React, { useEffect } from "react";
import styles from "./index.module.css";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { setTokenisThere } from "@/config/redux/reducer/authSlice";
import { getAllUsers, getTopProfiles } from "@/config/redux/action/authAction";
import { BASE_URL } from "@/config";

// Helper to get image URL - handles both Cloudinary and local
const getImageUrl = (picturePath) => {
  if (!picturePath) return "/default.jpg";
  // If it's already a full URL (Cloudinary), use it directly
  if (picturePath.startsWith('http')) return picturePath;
  // If it's already a default image path
  if (picturePath === "default.jpg" || picturePath === "/default.jpg") return "/default.jpg";
  // If it's a local file, construct the URL
  return `${BASE_URL}/${picturePath}`;
};

// Image error handler
const handleImageError = (e) => {
  e.target.src = "/default.jpg";
  e.target.onerror = null; // Prevent infinite loop
};


function DashboardLayout({ children }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth) || {};


  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
    } else {
      dispatch(setTokenisThere());
      dispatch(getAllUsers());
      dispatch(getTopProfiles());
    }
  }, [dispatch, router]);


  // Use top_profiles if available, otherwise fall back to allUser
  const profilesToDisplay = (authState.top_profiles && Array.isArray(authState.top_profiles) && authState.top_profiles.length > 0)
    ? authState.top_profiles
    : (authState.allUser && Array.isArray(authState.allUser) ? authState.allUser : []);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Desktop Left Sidebar */}
        <div className={styles.leftBar}>
          <div
            className={styles.sideItem}
            onClick={() => router.push("/dashboard")}
          >
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
</svg>
 <span>Home</span>
          </div>

          <div
            className={styles.sideItem}
            onClick={() => router.push("/discover")}
          ><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
</svg>

            <span>Search</span>
          </div>

          <div
            className={styles.sideItem}
            onClick={() => router.push("/my_connections")}
          ><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
</svg>


            <span>Connections</span>
          </div>
        </div>

        <div className={styles.centerFeed}>
          {children}
        </div>

        {/* Desktop Right Sidebar */}
        <div className={styles.rightBar}>
          <h3><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
</svg>Top Profile</h3>

          {authState.loading ? (
            <p>Loading profiles...</p>
          ) : profilesToDisplay.length > 0 ? (
            profilesToDisplay.slice(0, 5).map((profile) => (
              <div
                key={profile._id}
                className={styles.profileCard}
                onClick={() => router.push(`/view_profile/${profile.userId?.username}`)}
                style={{ cursor: "pointer" }}
              >
                <img
                  src={getImageUrl(profile.userId?.profilePicture)}
                  alt={profile.userId?.name || "User"}
                  onError={handleImageError}
                />

                <p>{profile.userId?.name || "Unknown User"}</p>
              </div>
            ))
          ) : (
            <p>No users found</p>
          )}
        </div>

        {/* Mobile Bottom Navigation - Icons Only */}
        <div className={styles.mobileBottomNav}>
          <div
            className={`${styles.mobileNavItem} ${router.pathname === '/dashboard' ? styles.active : ''}`}
            onClick={() => router.push("/dashboard")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </div>

          <div
            className={`${styles.mobileNavItem} ${router.pathname === '/discover' ? styles.active : ''}`}
            onClick={() => router.push("/discover")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>

          <div
            className={`${styles.mobileNavItem} ${router.pathname === '/top-profiles' ? styles.active : ''}`}
            onClick={() => router.push("/discover")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </div>

          <div
            className={`${styles.mobileNavItem} ${router.pathname === '/my_connections' ? styles.active : ''}`}
            onClick={() => router.push("/my_connections")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
            </svg>
          </div>
        </div>

      </div>
    </div>
  );
}

export default DashboardLayout;
