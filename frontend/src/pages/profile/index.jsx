import UserLayout from '@/layout/UserLayout'
import React, { useEffect, useState, useRef } from 'react'
import DashboardLayout from '@/layout/DashboardLayout'
import styles from "./style.module.css"
import { getAboutUser, getTopProfiles, getAllUsers } from '@/config/redux/action/authAction'
import { setUser, updateUserInAllUser } from '@/config/redux/reducer/authSlice'


import { useDispatch, useSelector } from 'react-redux'
import { getAllPosts, deletePost } from '@/config/redux/action/postAction'
import { clientServer, BASE_URL } from '@/config'

// Default empty profile
const defaultProfile = {
  user: {
    name: '',
    username: '',
    headline: '',
    location: '',
    profilePicture: '',
    coverPicture: ''
  },
  profile: {
    bio: '',
    currentPost: '',
    pastWork: [],
    education: []
  }
};

// Default images
const DEFAULT_AVATAR = "/default.jpg";
const DEFAULT_COVER = "/default.jpg";

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

// Helper to handle image errors
const handleImageError = (e) => {
  e.target.src = "/default.jpg";
  e.target.onerror = null; // Prevent infinite loop
};


export default function Profile() {
  const authState= useSelector((state)=>state.auth);
  const postReducer= useSelector((state)=>state.post)
  const dispatch=  useDispatch();
  const [userPosts, setUserPosts]= useState([]);
  const [userProfile ,setUserProfile]=useState(defaultProfile)
  const [originalUserProfile, setOriginalUserProfile]= useState(null)
  const [hasChanges, setHasChanges]= useState(false)
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen , setIsModalOpen]=useState(false)
  const [isEducationModalOpen , setIsEducationModalOpen]=useState(false)
  const [workInputData, setWorkInputData]=useState({company:"", position:"",year:""});

  const [educationInputData, setEducationInputData]=useState({school:"", degree:"", year:""});
  
  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    postId: null,
    ownerId: null,
  });
  
  // Refs for file inputs

  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);
     
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
     
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Delete work experience
  const deleteWorkExperience = (index) => {
    const newPastWork = [...(userProfile.profile?.pastWork || [])];
    newPastWork.splice(index, 1);
    setUserProfile({
      ...userProfile,
      profile: {
        ...userProfile.profile,
        pastWork: newPastWork
      }
    });
    showToast('Work experience deleted', 'success');
  };

  // Delete education
  const deleteEducation = (index) => {
    const newEducation = [...(userProfile.profile?.education || [])];
    newEducation.splice(index, 1);
    setUserProfile({
      ...userProfile,
      profile: {
        ...userProfile.profile,
        education: newEducation
      }
    });
    showToast('Education deleted', 'success');
  };

  /* ================= DELETE POST LOGIC (CUSTOM MODAL) ================= */
  const openDeleteModal = (postId, ownerId) => {
    setDeleteModal({ show: true, postId, ownerId });
  };

  const confirmDelete = async () => {
    const res = await dispatch(deletePost(deleteModal.postId));
    if (res.meta?.requestStatus === "fulfilled") {
      showToast("Post deleted permanently", "success");
      // Refresh posts after delete
      dispatch(getAllPosts());
    } else {
      showToast("Could not delete post", "error");
    }
    setDeleteModal({ show: false, postId: null, ownerId: null });
  };


     
  const handleWorkInputChange=(e)=>{
    const {name,value}= e.target;
    setWorkInputData({...workInputData,[name]:value})
  }

  const handleEducationInputChange=(e)=>{
    const {name,value}= e.target;
    setEducationInputData({...educationInputData,[name]:value})
  }

  useEffect(()=>{
    dispatch(getAboutUser({token:localStorage.getItem("token")}))
    dispatch(getAllPosts())
  },[])

  useEffect(()=>{
    if (authState.loading) {
      setIsLoading(true);
    } else if (authState.user) {
      setIsLoading(false);
      let profileData;
      
      if (authState.user.userId && typeof authState.user.userId === 'object') {
        profileData = {
          user: authState.user.userId,
          profile: {
            bio: authState.user.bio || '',
            currentPost: authState.user.currentPost || '',
            pastWork: authState.user.pastWork || [],
            education: authState.user.education || []
          }
        };
      } else if (authState.user.user) {
        profileData = authState.user;
      } else if (authState.user._id || authState.user.id) {
        profileData = { user: authState.user };
      } else {
        profileData = null;
      }
      
      if (profileData) {
        const removeUndefined = (obj) => {
          const cleaned = {};
          for (const key in obj) {
            if (obj[key] !== undefined) {
              cleaned[key] = obj[key];
            }
          }
          return cleaned;
        };
        
        // Set default images if not present
        const userWithDefaults = {
          ...defaultProfile.user,
          ...removeUndefined(profileData.user || {}),
          profilePicture: profileData.user?.profilePicture || DEFAULT_AVATAR,
          coverPicture: profileData.user?.coverPicture || DEFAULT_COVER
        };
        
        const mergedProfile = {
          user: userWithDefaults,
          profile: { ...defaultProfile.profile, ...removeUndefined(profileData.profile || {}) }
        };
        setUserProfile(mergedProfile);
        setOriginalUserProfile(JSON.parse(JSON.stringify(mergedProfile)));
      }

      let post = postReducer.posts ? postReducer.posts.filter((post)=>{
        const postUserId = post.userId;
        const authUser = authState.user.userId || authState.user.user || authState.user;
        return postUserId && postUserId.username === authUser.username
      }) : []
      setUserPosts(post)
    } else {
      setIsLoading(false);
    }
  },[authState.user, authState.loading, postReducer.posts])

  useEffect(()=>{
    if (userProfile && originalUserProfile) {
      const current = JSON.stringify(userProfile);
      const original = JSON.stringify(originalUserProfile);
      setHasChanges(current !== original);
    }
  },[userProfile, originalUserProfile])

  // Handle cover photo click - trigger file input
  const handleCoverClick = () => {
    coverInputRef.current?.click();
  };

  // Handle avatar click - trigger file input
  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  // Auto upload cover when file selected
  const handleCoverFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB', 'error');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }
    
    await updateCoverPicture(file);
  };

  // Auto upload avatar when file selected
  const handleAvatarFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB', 'error');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }
    
    await updateProfilePicture(file);
  };

  const updateProfilePicture=async(file)=>{
    try {
      showToast('Uploading profile picture...', 'success');
      const formData =new FormData();
      formData.append("profile_picture",file)
      formData.append("token",localStorage.getItem("token"));
      const response= await clientServer.post("/upload",formData,{
        headers:{ 'Content-Type':'multipart/form-data' },
      })
      
      if (response.status === 200) {
        showToast('Profile picture updated!', 'success');
        // Force immediate UI update with cache buster
        const timestamp = Date.now();
        const newUrl = response.data?.profilePicture || response.data?.user?.profilePicture || response.data?.url;
        if (newUrl) {
          const urlWithCache = newUrl.includes('?') ? `${newUrl}&t=${timestamp}` : `${newUrl}?t=${timestamp}`;
          setUserProfile(prev => ({
            ...prev,
            user: {
              ...prev.user,
              profilePicture: urlWithCache
            }
          }));
          
          // INSTANT UPDATE: Update localStorage and Redux immediately
          const savedUser = localStorage.getItem("user");
          let userId = null;
          if (savedUser) {
            const userData = JSON.parse(savedUser);
            userData.profilePicture = urlWithCache;
            localStorage.setItem("user", JSON.stringify(userData));
            // Update Redux state instantly
            dispatch(setUser(userData));
            userId = userData._id || userData.id;
          }
          
          // INSTANT SYNC: Update this user in allUser array (for Discover, Connections, etc.)
          if (userId) {
            dispatch(updateUserInAllUser({ 
              userId: userId, 
              profilePicture: urlWithCache 
            }));
          }
          
          // Refresh from server to ensure consistency
          dispatch(getAllUsers());
          dispatch(getTopProfiles());
        }

      }
    } catch (error) {
      showToast('Failed to upload profile picture', 'error');
      console.error("Profile upload error:", error);
    }
  }



  const updateCoverPicture=async(file)=>{
    try {
      showToast('Uploading cover photo...', 'success');
      const formData =new FormData();
      formData.append("cover_picture",file)
      formData.append("token",localStorage.getItem("token"));
      const response= await clientServer.post("/upload_cover",formData,{
        headers:{ 'Content-Type':'multipart/form-data' },
      })
      
      if (response.status === 200) {
        showToast('Cover photo updated!', 'success');
        // Force immediate UI update with cache buster
        const timestamp = Date.now();
        const newUrl = response.data?.coverPicture || response.data?.user?.coverPicture || response.data?.url;
        if (newUrl) {
          const urlWithCache = newUrl.includes('?') ? `${newUrl}&t=${timestamp}` : `${newUrl}?t=${timestamp}`;
          setUserProfile(prev => ({
            ...prev,
            user: {
              ...prev.user,
              coverPicture: urlWithCache
            }
          }));
          
          // INSTANT UPDATE: Update localStorage and Redux immediately
          const savedUser = localStorage.getItem("user");
          let userId = null;
          if (savedUser) {
            const userData = JSON.parse(savedUser);
            userData.coverPicture = urlWithCache;
            localStorage.setItem("user", JSON.stringify(userData));
            // Update Redux state instantly
            dispatch(setUser(userData));
            userId = userData._id || userData.id;
          }
          
          // INSTANT SYNC: Update this user in allUser array (for Discover, Connections, etc.)
          if (userId) {
            dispatch(updateUserInAllUser({ 
              userId: userId, 
              coverPicture: urlWithCache 
            }));
          }
          
          // Refresh from server to ensure consistency
          dispatch(getAllUsers());
          dispatch(getTopProfiles());
        }
        // Refresh from server after a short delay
        setTimeout(() => {
          dispatch(getAboutUser({token:localStorage.getItem("token")}));
        }, 500);
      }
    } catch (error) {
      showToast('Failed to upload cover photo', 'error');
      console.error("Cover upload error:", error);
    }
  }


  const updateProfileData=async()=>{
    try {
      setIsLoading(true);
      const request=await clientServer.post("/user_update",{
        token:localStorage.getItem("token"),
        name:userProfile.user.name,
      });
      const response=await clientServer.post("/update_profile_data",{
        token:localStorage.getItem("token"),
        bio:userProfile.profile?.bio || "",
        currentPost:userProfile.profile?.currentPost || "",
        pastWork:userProfile.profile?.pastWork || [],
        education: userProfile.profile?.education || []
      });
      
      if (request.status === 200 && response.status === 200) {
        showToast('Profile updated successfully!', 'success');
        setOriginalUserProfile(JSON.parse(JSON.stringify(userProfile)));
        await dispatch(getAboutUser({token:localStorage.getItem("token")}));
        setHasChanges(false);
      }
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to update profile', 'error');
      console.error("Update profile error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <UserLayout>
      <DashboardLayout>
        {toast.show && (
          <div className={`${styles.toast} ${styles[toast.type]}`}>
            {toast.message}
          </div>
        )}

        {/* 🔥 DELETE MODAL (YES/CANCEL) */}
        {deleteModal.show && (
          <div className={styles.modalOverlay}>
            <div className={styles.customModal}>
              <div className={styles.modalHeader}>
                <h3>Delete Post?</h3>
              </div>
              <div className={styles.modalBody}>
                <p>
                  Kya aap waqai is post ko delete karna chahte hain?
                </p>
              </div>
              <div className={styles.modalActions}>
                <button
                  className={styles.cancelBtn}
                  onClick={() => setDeleteModal({ show: false })}
                >
                  Cancel
                </button>
                <button className={styles.confirmBtn} onClick={confirmDelete}>
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}
        
        {authState.user && userProfile && userProfile.user && (

          <div className={styles.container}>
            {/* MERGED: Cover + Profile Info in One Block */}
            <div className={styles.profileHeaderCard}>
              {/* Cover Photo - Click to Edit */}
              <div className={styles.coverWrapper} onClick={handleCoverClick}>
                <img 
                  className={styles.coverPhoto} 
                  src={getImageUrl(userProfile.user.coverPicture)} 
                  alt="Cover" 
                  onError={handleImageError}
                />

                <div className={styles.coverEdit}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{width: '16px', height: '16px'}}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                  </svg>
                  Edit Cover
                </div>
                {/* Hidden file input for cover */}
                <input 
                  type="file" 
                  ref={coverInputRef}
                  className={styles.hiddenInput}
                  accept="image/*"
                  onChange={handleCoverFileSelect}
                />
              </div>

              {/* Profile Info - Overlapping Cover */}
              <div className={styles.profileInfoWrapper}>
                {/* Avatar - Click to Edit */}
                <div className={styles.avatarBox} onClick={handleAvatarClick}>
                  <img 
                    className={styles.profileImg} 
                    src={getImageUrl(userProfile.user.profilePicture)} 
                    alt="Profile" 
                    onError={handleImageError}
                  />

                  <div className={styles.avatarEdit}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{width: '18px', height: '18px'}}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                    </svg>
                  </div>
                  {/* Hidden file input for avatar */}
                  <input 
                    type="file" 
                    ref={avatarInputRef}
                    className={styles.hiddenInput}
                    accept="image/*"
                    onChange={handleAvatarFileSelect}
                  />
                </div>

                <div className={styles.userDetails}>
                  <input 
                    className={styles.nameField} 
                    type="text" 
                    value={userProfile.user.name || ''} 
                    onChange={(e) => setUserProfile({...userProfile, user: {...userProfile.user, name: e.target.value}})}
                  />
                  <p className={styles.userHandle}>@{userProfile.user.username || 'username'}</p>
                  <p className={styles.userHeadline}>{userProfile.user.headline || 'Add your headline'}</p>
                  <p className={styles.userLocation}>{userProfile.user.location || 'Add location'}</p>
                  
                  <textarea 
                    className={styles.bioField}
                    value={userProfile.profile?.bio || ''}
                    onChange={(e) => setUserProfile({...userProfile, profile: {...userProfile.profile, bio: e.target.value}})}
                    placeholder="Write something about yourself..."
                    rows={2}
                  />
                </div>

                <div className={styles.downloadBox}>
                  <div onClick={async()=>{
                      const response = await clientServer.get(`/download_resume?id=${userProfile.user._id || userProfile.user.id}`);
                      window.open(`${BASE_URL}/${response.data.message}`,"_blank")
                  }} className={styles.downloadBtn}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{width: '16px', height: '16px'}}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Download Resume
                  </div>
                </div>
              </div>
            </div>

            {/* Work & Education Block */}
            <div className={styles.infoCard}>
              <div className={styles.infoBlock}>
                <h4>Work Experience</h4>
                {userProfile.profile?.pastWork?.length > 0 ? (
                  <div className={styles.infoList}>
                    {userProfile.profile.pastWork.map((work, index) => (
                      <div key={index} className={styles.infoItem}>
                        <p className={styles.itemTitle}>{work.company}</p>
                        <p className={styles.itemSub}>{work.position} • {work.year || work.years} years</p>


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
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyMsg}>No work experience added yet</p>
                )}
                <button className={styles.addButton} onClick={() => setIsModalOpen(true)}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{width: '16px', height: '16px'}}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add Work
                </button>
              </div>

              <div className={styles.infoBlock}>
                <h4>Education</h4>
                {userProfile.profile?.education?.length > 0 ? (
                  <div className={styles.infoList}>
                    {userProfile.profile.education.map((edu, index) => (
                      <div key={index} className={styles.infoItem}>
                        <p className={styles.itemTitle}>{edu.school}</p>
                        <p className={styles.itemSub}>{edu.degree} • {edu.year}</p>
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
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyMsg}>No education added yet</p>
                )}
                <button className={styles.addButton} onClick={() => setIsEducationModalOpen(true)}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{width: '16px', height: '16px'}}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add Education
                </button>
              </div>

              {hasChanges && (
                <button onClick={() => updateProfileData()} className={styles.saveBtn}>
                  Save Changes
                </button>
              )}
            </div>

            {/* Recent Activity - Home Page Style */}
            <div className={styles.activityCard}>
              <h3 className={styles.activityTitle}>Recent Activity</h3>
              <div className={styles.postsList}>
                {userPosts.length > 0 ? (
                  userPosts.map((post) => {
                    const postOwnerId = post.userId?._id || post.userId;
                    const currentLoggedInId = authState.user?.userId?._id || authState.user?._id || authState.user?.id;
                    const isOwner = currentLoggedInId && postOwnerId && currentLoggedInId.toString() === postOwnerId.toString();
                    
                    return (
                    <div key={post._id || post.id} className={styles.postItem}>
                      <div className={styles.postHeader}>
                        <img 
                          className={styles.postAvatar} 
                          src={getImageUrl(userProfile.user.profilePicture)} 
                          alt="Profile" 
                          onError={handleImageError}
                        />

                        <div className={styles.postMeta}>
                          <p className={styles.postAuthor}>{userProfile.user.name}</p>
                          <p className={styles.postHandle}>@{userProfile.user.username} • {new Date(post.createdAt).toLocaleDateString()}</p>
                        </div>
                        
                        {isOwner && (
                          <button
                            className={styles.deleteIconBtn}
                            onClick={() => openDeleteModal(post._id, postOwnerId)}
                            style={{
                              marginLeft: 'auto',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '8px',
                              color: '#666',
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              stroke="currentColor"
                              style={{ width: '20px', height: '20px' }}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                              />
                            </svg>
                          </button>
                        )}
                      </div>

                      
                      <div className={styles.postContent}>
                        <p className={styles.postText}>{post.body}</p>
                        {post.media && post.media !== "" && (
                          <div className={styles.postMediaBox}>
                            <img 
                              src={post.media.startsWith('http') ? post.media : `${BASE_URL}/${post.media}`} 
                              alt="Post" 
                              className={styles.postImg}
                              onError={handleImageError}
                            />
                          </div>
                        )}

                      </div>

                      <div className={styles.postFooter}>
                        <button className={styles.footerBtn}>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{width: '18px', height: '18px'}}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.598-.08 2.38-.238.78-.158 1.515-.414 2.2-.76.684-.347 1.312-.78 1.87-1.296.558-.516 1.04-1.11 1.44-1.77.4-.66.71-1.37.92-2.12.21-.75.32-1.53.32-2.33 0-.3-.02-.6-.06-.9.06.01.12.01.18.01 1.18 0 2.32-.38 3.26-1.08.94-.7 1.62-1.68 1.94-2.8.32-1.12.26-2.32-.18-3.4-.44-1.08-1.22-1.96-2.2-2.52-.98-.56-2.12-.8-3.26-.68-1.14.12-2.2.6-3.02 1.36-.82.76-1.38 1.76-1.6 2.86-.22 1.1-.08 2.24.4 3.26.48 1.02 1.28 1.84 2.28 2.32" />
                          </svg>
                          {post.likes || 0} Likes
                        </button>
                        <button className={styles.footerBtn}>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{width: '18px', height: '18px'}}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                          </svg>
                          Comment
                        </button>
                      </div>
                    </div>
                    )
                  })
                ) : (

                  <div className={styles.noPosts}>
                    <p>No posts yet. Start sharing your thoughts!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        {isModalOpen && (
          <div onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false) }} className={styles.modalOverlay}>
            <div className={styles.modalBox}>
              <h3>Add Work Experience</h3>
              <input onChange={handleWorkInputChange} name="company" className={styles.modalInput} type="text" placeholder="Company Name"/>
              <input onChange={handleWorkInputChange} name="position" className={styles.modalInput} type="text" placeholder="Position"/>
              <input onChange={handleWorkInputChange} name="year" className={styles.modalInput} type="number" placeholder="Year"/>

              <button onClick={() => {
                setUserProfile({...userProfile, profile: {...userProfile.profile, pastWork: [...(userProfile.profile?.pastWork || []), workInputData]}})
                setIsModalOpen(false)
              }} className={styles.modalSave}>
                Add Work
              </button>
            </div>
          </div>
        )}

        {isEducationModalOpen && (
          <div onClick={(e) => { if (e.target === e.currentTarget) setIsEducationModalOpen(false) }} className={styles.modalOverlay}>
            <div className={styles.modalBox}>
              <h3>Add Education</h3>
              <input onChange={handleEducationInputChange} name="school" className={styles.modalInput} type="text" placeholder="School/University"/>
              <input onChange={handleEducationInputChange} name="degree" className={styles.modalInput} type="text" placeholder="Degree"/>
              <input onChange={handleEducationInputChange} name="year" className={styles.modalInput} type="number" placeholder="Year"/>
              <button onClick={() => {
                setUserProfile({...userProfile, profile: {...userProfile.profile, education: [...(userProfile.profile?.education || []), educationInputData]}})
                setIsEducationModalOpen(false)
              }} className={styles.modalSave}>
                Add Education
              </button>
            </div>
          </div>
        )}
      </DashboardLayout>
    </UserLayout>
  )
}
