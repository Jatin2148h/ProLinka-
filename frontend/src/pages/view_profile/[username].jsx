import { BASE_URL, clientServer } from '@/config';
import UserLayout from '@/layout/UserLayout';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/layout/DashboardLayout';
import styles from "./view_profile.module.css";
import { useDispatch, useSelector } from 'react-redux';
import { getAllPosts } from '@/config/redux/action/postAction';
import { acceptConnectionRequest, getConnectionRequests, getMyConnectionRequests, sendConnectionRequest, getAboutUser } from '@/config/redux/action/authAction';
import { toast } from 'react-hot-toast';

function ViewProfilePage({ userProfile: serverUserProfile, error }) {
  const router = useRouter();
  const dispatch = useDispatch();

  const postReducer = useSelector((state) => state.postReducer || state.post);
  const authState = useSelector((state) => state.auth);

  const [userPosts, setUserPosts] = useState([]);
  const [buttonStatus, setButtonStatus] = useState('connect');
  const [connectLoading, setConnectLoading] = useState(false);
  const [receivedRequest, setReceivedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Local state for profile data (to allow updates)
  const [profileData, setProfileData] = useState(serverUserProfile);

  // Check if viewing own profile
  const isOwnProfile = authState.user && profileData && 
    (authState.user._id === profileData.userId?._id || 
     authState.user.id === profileData.userId?._id);

  // Sync server props to local state and handle loading
  useEffect(() => {
    if (serverUserProfile) {
      setProfileData(serverUserProfile);
    }
    setIsLoading(false);
  }, [serverUserProfile]);

  // Handle case when there's an error from SSR
  useEffect(() => {
    if (error && !serverUserProfile) {
      setIsLoading(false);
    }
  }, [error, serverUserProfile]);


  // Force refresh profile data when auth state changes (to get updated images)
  useEffect(() => {
    if (authState.user && isOwnProfile) {
      const latestProfile = authState.user;
      if (latestProfile.userId) {
        setProfileData(prev => {
          if (!prev) return serverUserProfile;
          return {
            ...prev,
            userId: {
              ...prev.userId,
              profilePicture: latestProfile.userId.profilePicture || prev.userId?.profilePicture,
              coverPicture: latestProfile.userId.coverPicture || prev.userId?.coverPicture,
              name: latestProfile.userId.name || prev.userId?.name,
              headline: latestProfile.userId.headline || prev.userId?.headline,
              location: latestProfile.userId.location || prev.userId?.location
            },
            bio: latestProfile.bio || prev.bio,
            pastWork: latestProfile.pastWork || prev.pastWork,
            education: latestProfile.education || prev.education
          };
        });
      }
    }
  }, [authState.user]);

  // Delete work experience
  const deleteWorkExperience = async (index) => {
    try {
      const newPastWork = [...(profileData.pastWork || [])];
      newPastWork.splice(index, 1);
      
      const response = await clientServer.post("/update_profile_data", {
        token: localStorage.getItem("token"),
        pastWork: newPastWork,
        education: profileData.education || []
      });
      
      if (response.status === 200) {
        setProfileData(prev => ({
          ...prev,
          pastWork: newPastWork
        }));
        toast.success("Work experience deleted!");
        dispatch(getAboutUser({ token: localStorage.getItem("token") }));
      }
    } catch (error) {
      toast.error("Failed to delete work experience");
    }
  };

  // Delete education
  const deleteEducation = async (index) => {
    try {
      const newEducation = [...(profileData.education || [])];
      newEducation.splice(index, 1);
      
      const response = await clientServer.post("/update_profile_data", {
        token: localStorage.getItem("token"),
        pastWork: profileData.pastWork || [],
        education: newEducation
      });
            if (response.status === 200) {
        setProfileData(prev => ({
          ...prev,
          education: newEducation
        }));
        toast.success("Education deleted!");
        dispatch(getAboutUser({ token: localStorage.getItem("token") }));
      }
    } catch (error) {
      toast.error("Failed to delete education");
    }
  };

  const getUserPost = async () => {
    await dispatch(getAllPosts());
    await dispatch(getConnectionRequests({ token: localStorage.getItem("token") }));
    await dispatch(getMyConnectionRequests({token:localStorage.getItem("token")}))
  };

  useEffect(() => {
    const allPosts = postReducer.posts || postReducer.post || [];
    if (allPosts.length > 0 && router.query.username) {
      let filteredPosts = allPosts.filter((post) => {
        return post.userId?.username === router.query.username;
      });
      setUserPosts(filteredPosts);
    }
  }, [postReducer, router.query.username]); 

  useEffect(() => {
    const requests = authState.connectionRequests || [];
    if (requests && profileData) {
      const sentConnection = requests.find(user =>
        user.connectionId?._id === profileData.userId?._id && user.direction === 'sent'
      );
      
      const receivedConnection = requests.find(user =>
        user.userId?._id === profileData.userId?._id && user.direction === 'received'
      );

      if (receivedConnection && receivedConnection.status === 'pending') {
        setReceivedRequest(receivedConnection);
        setButtonStatus('received');
      } else if (sentConnection) {
        if (sentConnection.status === "accepted") {
          setButtonStatus('connected');
        } else if (sentConnection.status === "pending") {
          setButtonStatus('pending');
        } else if (sentConnection.status === "rejected") {
          setButtonStatus('connect');
        }
      } else if (receivedConnection && receivedConnection.status === 'accepted') {
        setButtonStatus('connected');
      } else if (receivedConnection && receivedConnection.status === 'rejected') {
        setButtonStatus('connect');
      } else {
        setButtonStatus('connect');
      }
    }
  }, [authState, profileData]);

  useEffect(() => {
    getUserPost();
  }, []);

  useEffect(() => {
    if (profileData) {
      dispatch(getConnectionRequests({ token: localStorage.getItem("token") }));
    }
  }, [profileData, dispatch]);

  // Loading state while SSR data loads
  if (isLoading) {
    return (
      <UserLayout>
        <DashboardLayout>
          <div className={styles.container}>
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <div className={styles.syncing}>
                <div className={styles.dotPulse}></div>
                <p>Loading profile...</p>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </UserLayout>
    );
  }

  // Error state - user not found
  if (!profileData) {
    return (
      <UserLayout>
        <DashboardLayout>
          <div className={styles.container}>
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <h2>User not found</h2>
              <p style={{ color: '#666', marginTop: '10px' }}>
                {error || "The user you're looking for doesn't exist or has been removed."}
              </p>
              <button 
                onClick={() => router.push('/discover')}
                style={{
                  marginTop: '20px',
                  padding: '10px 20px',
                  background: '#0077B5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer'
                }}
              >
                Go to Discover
              </button>
            </div>
          </div>
        </DashboardLayout>
      </UserLayout>
    );
  }



  // Helper function to get image URL - handles both Cloudinary and local
  const getImageUrl = (path) => {
    if (!path) return '/default.jpg';
    // If it's already a full URL (Cloudinary), use it directly
    if (path.startsWith('http')) return path;
    // If it's already a default image path
    if (path === "default.jpg" || path === "/default.jpg") return '/default.jpg';
    // If it's a local file in uploads folder, construct the URL
    if (path.includes('uploads/')) {
      return `${BASE_URL}/${path}`;
    }
    return `${BASE_URL}/uploads/${path}`;
  };


  // Helper to handle image errors
  const handleImageError = (e) => {
    e.target.src = "/default.jpg";
    e.target.onerror = null; // Prevent infinite loop
  };


  return (
    <UserLayout>
      <DashboardLayout>
        <div className={styles.container}>
          {/* MERGED HEADER CARD - Same as Profile Page */}
          <div className={styles.profileHeaderCard}>
            {/* Cover Photo */}
            <div className={styles.coverWrapper}>
              <img 
                className={styles.coverPhoto} 
                src={getImageUrl(profileData.userId?.coverPicture)} 
                alt="Cover Photo" 
                onError={handleImageError}
              />

            </div>

            {/* Profile Info - Overlapping Cover */}
            <div className={styles.profileInfoWrapper}>
              <div className={styles.avatarBox}>
                <img 
                  className={styles.profileImg} 
                  src={getImageUrl(profileData.userId?.profilePicture)} 
                  alt="Profile Picture" 
                  onError={handleImageError}
                />

              </div>

              <div className={styles.userDetails}>
                <h1 className={styles.nameField}>{profileData.userId?.name}</h1>
                <p className={styles.userHandle}>@{profileData.userId?.username}</p>
                <p className={styles.userHeadline}>{profileData.userId?.headline || 'Professional'}</p>
                <p className={styles.userLocation}>{profileData.userId?.location || 'Location not specified'}</p>
                <p className={styles.bioText}>{profileData.bio || 'No bio added yet'}</p>
              </div>

              <div className={styles.actionBox}>
                {/* Connection Button */}
                {profileData.userId?._id === authState.user?._id ? (
                  <button disabled className={styles.actionBtn}>
                    Your Profile
                  </button>
                ) : !authState.loggedIn ? (
                  <button disabled className={styles.actionBtn}>
                    Login to Connect
                  </button>
                ) : buttonStatus === 'connected' ? (
                  <button disabled className={styles.actionBtn}>
                    Connected
                  </button>
                ) : buttonStatus === 'pending' ? (
                  <button disabled className={styles.actionBtn}>
                    Pending
                  </button>
                ) : buttonStatus === 'received' ? (
                  <div className={styles.requestActions}>
                    <button
                      onClick={async () => {
                        setActionLoading(true);
                        try {
                          await dispatch(acceptConnectionRequest({
                            token: localStorage.getItem("token"),
                            connectionId: receivedRequest._id,
                            action: "accept"
                          })).unwrap();
                          
                          toast.success("Connection accepted!");
                          setButtonStatus('connected');
                          setReceivedRequest(null);
                          await dispatch(getConnectionRequests({ token: localStorage.getItem("token") }));
                          await dispatch(getMyConnectionRequests({ token: localStorage.getItem("token") }));
                        } catch (error) {
                          toast.error(error || "Failed to accept connection");
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                      disabled={actionLoading}
                      className={styles.acceptBtn}
                    >
                      {actionLoading ? 'Accepting...' : 'Accept'}
                    </button>
                    <button
                      onClick={async () => {
                        setActionLoading(true);
                        try {
                          await dispatch(acceptConnectionRequest({
                            token: localStorage.getItem("token"),
                            connectionId: receivedRequest._id,
                            action: "reject"
                          })).unwrap();
                          
                          toast.success("Connection rejected");
                          setButtonStatus('connect');
                          setReceivedRequest(null);
                          await dispatch(getConnectionRequests({ token: localStorage.getItem("token") }));
                          await dispatch(getMyConnectionRequests({ token: localStorage.getItem("token") }));
                        } catch (error) {
                          toast.error(error || "Failed to reject connection");
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                      disabled={actionLoading}
                      className={styles.rejectBtn}
                    >
                      {actionLoading ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      setConnectLoading(true);
                      try {
                        await dispatch(sendConnectionRequest({ 
                          token: localStorage.getItem("token"), 
                          user_id: profileData.userId._id 
                        })).unwrap();
                        
                        toast.success("Connection request sent successfully!");
                        setButtonStatus('pending');
                        await dispatch(getConnectionRequests({ token: localStorage.getItem("token") }));
                        await dispatch(getMyConnectionRequests({ token: localStorage.getItem("token") }));
                      } catch (error) {
                        toast.error(error || "Failed to send connection request");
                      } finally {
                        setConnectLoading(false);
                      }
                     }}
                    disabled={connectLoading}
                    className={styles.connectBtn}
                  >
                    {connectLoading ? 'Sending...' : 'Connect'}
                  </button>
                )}

                {/* Download Resume Button */}
                <button 
                  onClick={async() => {
                    try {
                      // Open directly in new tab - backend serves the file
                      window.open(`${BASE_URL}/api/users/download_resume?id=${profileData.userId._id}`, "_blank");
                    } catch (error) {
                      console.error("Download resume error:", error);
                      toast.error('Failed to download resume');
                    }
                  }} 
                  className={styles.downloadBtn}
                >


                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{width: '20px', height: '20px'}}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Download Resume
                </button>
              </div>
            </div>
          </div>

          {/* INFO CARD - Work & Education */}
          <div className={styles.infoCard}>
            {/* Work Experience */}
            <div className={styles.infoBlock}>
              <h4>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{width: '20px', height: '20px'}}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 0V5.25a2.25 2.25 0 0 0-2.25-2.25h-1.5A2.25 2.25 0 0 0 13.5 5.25v1.5m4.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
                Work Experience
              </h4>
              <div className={styles.infoList}>
                {profileData.pastWork && profileData.pastWork.length > 0 ? (
                  profileData.pastWork.map((work, index) => (
                    <div key={index} className={styles.infoItem}>
                      <p className={styles.itemTitle}>{work.company}</p>
                      <p className={styles.itemSub}>{work.position} • {work.year || work.years}(years)</p>

                      {isOwnProfile && (
                        <button 
                          onClick={() => deleteWorkExperience(index)}
                          style={{ 
                            marginLeft: '10px', 
                            padding: '4px 8px', 
                            background: '#dc3545', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className={styles.emptyMsg}>No work experience added yet</p>
                )}
              </div>
            </div>

            {/* Education */}
            <div className={styles.infoBlock}>
              <h4>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{width: '20px', height: '20px'}}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 0 0-.491 6.347A48.627 48.627 0 0 1 12 20.904a48.627 48.627 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.57 50.57 0 0 0-2.658-.813A59.905 59.905 0 0 1 12 3.493a59.902 59.902 0 0 1 10.499 5.221 69.78 69.78 0 0 0-2.658.814m-15.482 0A50.697 50.697 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                </svg>
                Education
              </h4>
              <div className={styles.infoList}>
                {profileData.education && profileData.education.length > 0 ? (
                  profileData.education.map((edu, index) => (
                    <div key={index} className={styles.infoItem}>
                      <p className={styles.itemTitle}>{edu.school}</p>
                      <p className={styles.itemSub}>{edu.degree} • {edu.year}</p>
                      {isOwnProfile && (
                        <button 
                          onClick={() => deleteEducation(index)}
                          style={{ 
                            marginLeft: '10px', 
                            padding: '4px 8px', 
                            background: '#dc3545', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className={styles.emptyMsg}>No education added yet</p>
                )}
              </div>
            </div>
          </div>

          {/* ACTIVITY CARD - Recent Posts */}
          <div className={styles.activityCard}>
            <h3 className={styles.activityTitle}>Recent Activity</h3>
            <div className={styles.postsList}>
              {userPosts.length > 0 ? (
                userPosts.map((post) => (
                  <div key={post._id || post.id} className={styles.postItem}>
                    <div className={styles.postHeader}>
                      <img 
                        src={getImageUrl(post.userId?.profilePicture)} 
                        alt={post.userId?.name} 
                        className={styles.postAvatar}
                        onError={handleImageError}
                      />

                      <div className={styles.postMeta}>
                        <span className={styles.postAuthor}>{post.userId?.name}</span>
                        <span className={styles.postHandle}>@{post.userId?.username} • {new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className={styles.postContent}>
                      <p className={styles.postText}>{post.body}</p>
                      {post.media && (
                        <div className={styles.postMediaBox}>
                          <img 
                            src={post.media.startsWith('http') ? post.media : `${BASE_URL}/${post.media}`} 
                            alt="Post media" 
                            className={styles.postImg}
                            onError={handleImageError}
                          />
                        </div>
                      )}

                    </div>

                    <div className={styles.postFooter}>
                      <button className={styles.footerBtn}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{width: '18px', height: '18px'}}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V3a.75.75 0 0 1 .75-.75A2.25 2.25 0 0 1 16.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
                        </svg>
                        {post.likes || 0} Likes
                      </button>
                      <button className={styles.footerBtn}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{width: '18px', height: '18px'}}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
                        </svg>
                        Comment
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.noPosts}>
                  <p>No posts yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </UserLayout>
  );
}

export default ViewProfilePage;

export async function getServerSideProps(context) {
  const { res } = context;
  
  try {
    const username = context.params.username;
    
    // Validate username parameter
    if (!username || typeof username !== 'string') {
      return { props: { userProfile: null, error: "Invalid username" } };
    }
    
    // ✅ FIX: Use query param endpoint for username lookup
    // Using /get_profile_base_on_username?username=xxx instead of /:username to avoid route conflicts
    const request = await clientServer.get("/get_profile_base_on_username", {
      params: { username: username },
      timeout: 10000 // 10 second timeout
    });

    
    // Check if the response has valid data
    if (!request.data) {
      return { props: { userProfile: null, error: "No data received" } };
    }
    
    // Check if userId exists
    if (!request.data.userId) {
      return { props: { userProfile: null, error: "User profile not found" } };
    }
    
    return { props: { userProfile: request.data, error: null } };
  } catch (error) {
    // Set cache control headers to prevent stale data
    if (res) {
      res.setHeader('Cache-Control', 'no-store, max-age=0');
    }
    
    const errorMessage = error.response?.data?.message || 
                         error.message || 
                         "Failed to load profile";
    
    return { 
      props: { 
        userProfile: null, 
        error: errorMessage 
      } 
    };
  }
}
