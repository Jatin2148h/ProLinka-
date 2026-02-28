import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import UserLayout from '@/layout/UserLayout';
import DashboardLayout from '@/layout/DashboardLayout';
import { useDispatch, useSelector } from 'react-redux';
import { acceptConnectionRequest, getMyConnectionRequests } from '@/config/redux/action/authAction';
import { BASE_URL } from '@/config';
import styles from "./index.module.css";
import { toast } from 'react-hot-toast';

// Helper to get image URL - handles both Cloudinary and local (consistent with other pages)
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



function MyConnections() {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  const router = useRouter();
  const [loadingId, setLoadingId] = useState(null);
  const [processedIds, setProcessedIds] = useState(new Set());

  useEffect(() => {
    dispatch(getMyConnectionRequests({ token: localStorage.getItem("token") }));
  }, []);

  // Helper to get unique key for a connection
  const getConnectionKey = (user) => {
    return user._id || user.connectionId?._id || user.userId?._id || Math.random().toString();
  };

  // Helper to get user display info consistently
  const getUserInfo = (user) => {
    return {
      name: user.displayUser?.name || user.connectionId?.name || user.userId?.name || 'Unknown',
      username: user.displayUser?.username || user.connectionId?.username || user.userId?.username || 'unknown',
      profilePicture: user.displayUser?.profilePicture || user.connectionId?.profilePicture || user.userId?.profilePicture || 'default.jpg',
      id: getConnectionKey(user)
    };
  };

  // Handle image error - fallback to default
  const handleImageError = (e) => {
    e.target.src = "/default.jpg";
    e.target.onerror = null; // Prevent infinite loop
  };


  return (
    <UserLayout>
      <DashboardLayout>
        <div>
          {/* Received Connection Requests - Show requests that others sent to me */}
          <h3>Connection Requests Received</h3>
          {authState.connectionRequests?.filter((connection) => 
            connection.status === "pending" && connection.direction === "received"
          ).length === 0 && <p>No pending requests received</p>}
          
          {authState.connectionRequests?.filter((connection) => 
            connection.status === "pending" && connection.direction === "received"
          ).map((user) => {
            const userInfo = getUserInfo(user);
            return (
            <div
              key={userInfo.id}

              onClick={() => {
                router.push(`/view_profile/${userInfo.username}`);
              }}
              className={styles.userCard}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <div className={styles.profilePicture}>
                  <img 
                    src={getImageUrl(userInfo.profilePicture)} 
                    alt={userInfo.name}
                    onError={handleImageError}
                  />
                </div>
                <div className={styles.userInfo}>
                  <h3>{userInfo.name}</h3>
                  <p>{userInfo.username}</p>
                </div>

                <button
                  disabled={loadingId === userInfo.id || processedIds.has(userInfo.id)}
                  onClick={async (e) => {
                    e.stopPropagation();
                    setLoadingId(userInfo.id);
                    const res = await dispatch(
                      acceptConnectionRequest({
                        token: localStorage.getItem("token"),
                        connectionId: userInfo.id,
                        action: "accept",
                      })
                    );
                    if (res.meta.requestStatus === "fulfilled") {
                      toast.success("Connection accepted!");
                      setProcessedIds((prev) => new Set(prev).add(userInfo.id));
                      dispatch(getMyConnectionRequests({ token: localStorage.getItem("token") }));
                    } else {
                      toast.error("Failed to accept connection");
                    }
                    setLoadingId(null);
                  }}
                  style={{
                    marginLeft: "auto",
                    padding: "8px 16px",
                    background: processedIds.has(userInfo.id) ? "#10B981" : "#0077B5",
                    color: "white",
                    border: "none",
                    borderRadius: "20px",
                    cursor: loadingId === userInfo.id ? "not-allowed" : "pointer",
                    opacity: loadingId === userInfo.id ? 0.7 : 1,
                  }}
                >
                  {loadingId === userInfo.id
                    ? "Processing..."
                    : processedIds.has(userInfo.id)
                    ? "Accepted"
                    : "Accept"}
                </button>
              </div>
            </div>
          )})}

          {/* Sent Connection Requests - Show requests I sent to others */}
          <h3 style={{ marginTop: '2rem' }}>Connection Requests Sent</h3>
          {authState.connectionRequests?.filter((connection) => 
            connection.status === "pending" && connection.direction === "sent"
          ).length === 0 && <p>No pending requests sent</p>}
          
          {authState.connectionRequests?.filter((connection) => 
            connection.status === "pending" && connection.direction === "sent"
          ).map((user) => {
            const userInfo = getUserInfo(user);
            return (
            <div
              key={`sent-${userInfo.id}`}

              onClick={() => {
                router.push(`/view_profile/${userInfo.username}`);
              }}
              className={styles.userCard}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <div className={styles.profilePicture}>
                  <img 
                    src={getImageUrl(userInfo.profilePicture)} 
                    alt={userInfo.name}
                    onError={handleImageError}
                  />
                </div>
                <div className={styles.userInfo}>
                  <h3>{userInfo.name}</h3>
                  <p>{userInfo.username}</p>
                </div>

                <span style={{ color: '#F59E0B', fontWeight: 'bold' }}>Pending</span>
              </div>
            </div>
          )})}


          {/* My Network - Show accepted connections */}
          <h4 style={{ marginTop: '2rem' }}>My Network</h4>
          {authState.connectionRequests?.filter((connection) => 
            connection.status === "accepted"
          ).length === 0 && <p>No connections in your network yet</p>}
          
          {authState.connectionRequests?.filter((connection) => 
            connection.status === "accepted"
          ).map((user) => {
            const userInfo = getUserInfo(user);
            return (
            <div
              key={`accepted-${userInfo.id}`}

              onClick={() => {
                router.push(`/view_profile/${userInfo.username}`);
              }}
              className={styles.userCard}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <div className={styles.profilePicture}>
                  <img 
                    src={getImageUrl(userInfo.profilePicture)} 
                    alt={userInfo.name}
                    onError={handleImageError}
                  />
                </div>
                <div className={styles.userInfo}>
                  <h3>{userInfo.name}</h3>
                  <p>{userInfo.username}</p>
                </div>

                <span style={{ color: '#10B981', fontWeight: 'bold' }}>Connected</span>
              </div>
            </div>
          )})}

        </div>
      </DashboardLayout>

    </UserLayout>
  );
}

export default MyConnections;
