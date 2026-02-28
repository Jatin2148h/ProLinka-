import React, { useEffect, useState, useMemo } from "react";
import UserLayout from "@/layout/UserLayout";
import DashboardLayout from "@/layout/DashboardLayout";
import { useDispatch, useSelector } from "react-redux";
import { getAllUsers, sendConnectionRequest } from "@/config/redux/action/authAction";
import { BASE_URL } from "@/config";
import styles from "./index.module.css";
import { useRouter } from "next/router";

// Helper to get image URL - handles both Cloudinary and local
const getImageUrl = (picturePath) => {
  if (!picturePath) return "/default.jpg";
  // If it's already a full URL (Cloudinary), use it directly
  if (picturePath.startsWith('http')) return picturePath;
  // If it's already a default image path
  if (picturePath === "default.jpg" || picturePath === "/default.jpg") return "/default.jpg";
  // If it's a local file in uploads folder, construct the URL
  if (picturePath.includes('uploads/')) {
    return `${BASE_URL}/${picturePath}`;
  }
  return `${BASE_URL}/uploads/${picturePath}`;
};


// Helper to handle image errors
const handleImageError = (e) => {
  e.target.src = "/default.jpg";
  e.target.onerror = null; // Prevent infinite loop
};



/**
 * ======================================================
 * PROLINKA DISCOVER PAGE
 * ======================================================
 */
function DiscoverPage() {
    const dispatch = useDispatch();
    const router = useRouter();

    // Selector with fallback
    const authState = useSelector((state) => state.auth) || {};
    const { allUser = [], loading, all_profile_fetch } = authState;

    const [mounted, setMounted] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        setMounted(true);
    }, []);

    /**
     * Fetch users if not already loaded
     */
    useEffect(() => {
        if (mounted) {
            if (!all_profile_fetch || (Array.isArray(allUser) && allUser.length === 0)) {
                dispatch(getAllUsers());
            }
        }
    }, [mounted, dispatch, all_profile_fetch, allUser.length]);


    const usersToDisplay = useMemo(() => {
        const data = Array.isArray(allUser) ? allUser : [];
        if (data.length === 0) return [];

        return data.filter((profile) => {
            if (!profile || !profile.userId) return false;

            const isObject = typeof profile.userId === 'object';
            const name = isObject ? (profile.userId.name || "User") : "ProLinka Member";

            const search = searchTerm.toLowerCase().trim();
            return name.toLowerCase().includes(search);
        });
    }, [allUser, searchTerm]);



    if (!mounted) return null;

    return (
        <UserLayout>
            <DashboardLayout>
                <div className={styles.discoverWrapper}>
                    {/* Page Header */}
                    <div className={styles.discoverHeader}>
                        <div className={styles.textGroup}>
                            <h1 className={styles.heading}>Discover Professionals</h1>
                            <p className={styles.subHeading}>Connect with talented people in your industry</p>
                        </div>

                        {/* Search Implementation */}
                        <div className={styles.searchContainer}>
                            <input
                                placeholder="Search by name or @username..."
                                className={styles.searchBar}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* User Grid */}
                    <div className={styles.userGrid}>
                        {usersToDisplay.length > 0 ? (
                            usersToDisplay.map((profile) => (
                                <div
                                    key={profile._id}
                                    className={styles.profileCard}
                                    onClick={() => router.push(`/view_profile/${profile.userId?.username || profile.userId}`)}
                                >
                                    <div className={styles.cardHeader}>
                                        <div className={styles.banner}></div>
                                        <img
                                            src={getImageUrl(profile.userId?.profilePicture)}
                                            alt={profile.userId?.name || "User"}
                                            className={styles.avatar}
                                            onError={handleImageError}
                                        />

                                    </div>

                                    <div className={styles.cardBody}>
                                        <h3 className={styles.userName}>
                                            {typeof profile.userId === 'object' ? (profile.userId.name || "User") : "ProLinka Member"}
                                        </h3>
                                        <p className={styles.userHandle}>
                                            @{typeof profile.userId === 'object' ? (profile.userId.username || "username") : "username"}
                                        </p>
                                        <p className={styles.userBio}>
                                            {profile.bio || "Professional Developer at ProLinka"}
                                        </p>
                                        
                                        <div className={styles.cardFooter}>
                                            <button
                                                className={styles.viewProfileBtn}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/view_profile/${profile.userId?.username || profile.userId}`);
                                                }}
                                            >
                                                View Profile
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={styles.statusBox}>
                                {loading ? (
                                    <div className={styles.syncing}>
                                        <div className={styles.dotPulse}></div>
                                        <p>Synchronizing with ProLinka database...</p>
                                    </div>
                                ) : (
                                    <div className={styles.noUsers}>
                                        <p>
                                            {searchTerm 
                                                ? `No users found matching "${searchTerm}"` 
                                                : "The community is quiet... check back soon!"}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </DashboardLayout>
        </UserLayout>
    );
}

export default DiscoverPage;
