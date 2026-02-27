import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import UserLayout from "@/layout/UserLayout";
import DashboardLayout from "@/layout/DashboardLayout";
import styles from "./style.module.css";
import { BASE_URL } from "@/config";
import { incrementPostLike } from "@/config/redux/action/postAction";

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



import {
  createPost,
  deletePost,
  getAllComments,
  getAllPosts,
  postComment,
  deleteComment,
} from "@/config/redux/action/postAction";

import { getAboutUser, getAllUsers } from "@/config/redux/action/authAction";
import { reset } from "@/config/redux/reducer/authSlice";

function Dashboard() {
  const dispatch = useDispatch();

  const authState = useSelector((state) => state.auth);
  const postState = useSelector((state) => state.post);

  const [postContent, setPostContent] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [commentText, setCommentText] = useState("");
  const [likedPosts, setLikedPosts] = useState({});
  const [localLikeCount, setLocalLikeCount] = useState({});

  const [activePostId, setActivePostId] = useState("");

  /* 🔥 REFRESH & UI STATES */
  const [mounted, setMounted] = useState(false);
  const [statusMsg, setStatusMsg] = useState({
    show: false,
    text: "",
    type: "",
  });

  // Custom Center Modal (Yes/Cancel)
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    postId: null,
    ownerId: null,
  });

  // LinkedIn-style toast notification function
  const showNotification = (text, type = "success") => {
    setStatusMsg({ show: true, text, type });
    setTimeout(() => setStatusMsg({ show: false, text: "", type: "" }), 4000);
  };

  /* ================= FETCH DATA & INITIALIZE ================= */
  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");

    // Refresh fix: Fetch user if token exists but state is empty
    if (token && !authState.user) {
      dispatch(getAboutUser());
    }

    dispatch(getAllPosts());

    if (!authState.all_profile_fetch) {
      dispatch(getAllUsers());
    }
  }, [dispatch, authState.user]);

  /* ================= CREATE POST ================= */
  const handleUpload = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      showNotification("Please login to post", "error");
      return;
    }

    if (!postContent && !fileContent) return;

    const formData = new FormData();
    formData.append("token", token);
    formData.append("body", postContent);

    if (fileContent) {
      formData.append("media", fileContent);
    }

    const res = await dispatch(createPost(formData));
    if (res.meta?.requestStatus === "fulfilled") {
      showNotification("Post shared successfully!");
      setPostContent("");
      setFileContent(null);
      // 🔥 REAL-TIME: Refresh posts immediately so new post appears without manual refresh
      dispatch(getAllPosts());
    } else {
      showNotification("Failed to create post", "error");
    }

  };

  /* ================= DELETE LOGIC (CUSTOM MODAL) ================= */
  const openDeleteModal = (postId, ownerId) => {
    setDeleteModal({ show: true, postId, ownerId });
  };

  const confirmDelete = async () => {
    const res = await dispatch(deletePost(deleteModal.postId));
    if (res.meta?.requestStatus === "fulfilled") {
      showNotification("Post deleted permanently", "success");
      // 🔥 REAL-TIME: Refresh posts immediately so deleted post disappears without manual refresh
      dispatch(getAllPosts());
    } else {
      showNotification("Could not delete post", "error");
    }
    setDeleteModal({ show: false, postId: null, ownerId: null });
  };


  /* ================= LOADING & AUTH LOGIC ================= */
  const isInitialLoading = postState.loading && !authState.user;
  const isPostLoading = postState.loading && authState.user;

  if (!mounted) return null;

  // Persistent ID check for hard refresh
  const getPersistentUserId = () => {
    if (typeof window === "undefined") return null;
    return authState.user?._id || localStorage.getItem("userId");
  };

  const currentLoggedInId = getPersistentUserId();
  const hasToken = !!localStorage.getItem("token");

  return (
    <UserLayout>
      <DashboardLayout>
        {/* 🔥 CENTER MODAL (YES/CANCEL) */}
        {deleteModal.show && (
          <div className={styles.modalOverlay}>
            <div className={styles.customModal}>
              <div className={styles.modalHeader}>
                <h3>Delete Post?</h3>
              </div>
              <div className={styles.modalBody}>
                <p>
                  Kya aap waqai is post ko MongoDB se delete karna chahte hain?
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

        {/* 🔥 TOAST MESSAGE */}
        {statusMsg.show && (
          <div
            className={`${styles.toastNotification} ${styles[statusMsg.type]}`}
          >
            {statusMsg.text}
          </div>
        )}

        {isInitialLoading && (
          <div className={styles.fullPageLoader}>
            <div className={styles.spinner}></div>
            <p>Syncing your feed...</p>
          </div>
        )}

        {!isInitialLoading && (
          <div className={styles.dashboardGrid}>
            <div className={styles.feedSection}>
              {/* CREATE POST BOX */}
              <div className={styles.createPostContainer}>
                <img
                  src={getImageUrl(authState.user?.profilePicture)}
                  className={styles.userProfile}
                  alt="User Profile"
                  onError={handleImageError}
                />


                <div className={styles.inputWrapper}>
                  <textarea
                    className={styles.textArea}
                    placeholder="What's on your mind?"
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                  />
                  <div className={styles.actionRow}>
                    <label className={styles.plusIcon}>
                      <label htmlFor="fileUpload" style={{ cursor: "pointer" }}>
                        {fileContent ? "✅" : "+"}
                      </label>
                      <input
                        type="file"
                        hidden
                        id="fileUpload"
                        accept="image/*"
                        onChange={(e) => setFileContent(e.target.files[0])}
                      />
                    </label>
                  </div>
                </div>

                {(postContent || fileContent) && (
                  <div className={styles.postBtnContainer}>
                    <button
                      className={styles.uploadButton}
                      onClick={
                        hasToken
                          ? handleUpload
                          : () => showNotification("Login first!", "error")
                      }
                    >
                      Post
                    </button>
                  </div>
                )}
              </div>

              {/* POSTS LIST */}
              {!postState.loading &&
                postState.posts?.map((post) => {
                  const postOwnerId = post.userId?._id || post.userId;
                  const isOwner =
                    currentLoggedInId &&
                    postOwnerId &&
                    currentLoggedInId.toString() === postOwnerId.toString();

                  return (
                    <div key={post._id} className={styles.singleCard}>
                      <div className={styles.singleCard_profileContainer}>
                        <img
                          className={styles.userProfile}
                          src={getImageUrl(post.userId?.profilePicture)}
                          alt="user"
                          onError={handleImageError}
                        />


                        <div className={styles.postInfo}>
                          <p className={styles.name}>
                            {post.userId?.name || "User"}
                          </p>
                          <p className={styles.handle}>
                            @{post.userId?.username || "username"}
                          </p>
                        </div>

                        {isOwner && (
                          <button
                            className={styles.deleteIconBtn}
                            onClick={() =>
                              openDeleteModal(post._id, postOwnerId)
                            }
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              stroke="currentColor"
                              className={styles.deleteSvgIcon}
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

                      <div className={styles.postBody}>
                        <p>{post.body}</p>
                        {post.media && (
                          <div className={styles.singleCard_image}>
                            <img 
                              src={post.media.startsWith('http') ? post.media : `${BASE_URL}/${post.media}`} 
                              alt="post" 
                              onError={handleImageError}
                            />
                          </div>
                        )}


                      </div>

                      <div className={styles.cardActions}>
                        {/* --- REPAIRED LIKE SECTION --- */}
                        <div
                          className={styles.cardAction1}
                          onClick={async () => {
                            const isLiked = likedPosts[post._id];

                            // 1. UI Toggle logic (Immediate feedback)
                            setLikedPosts((prev) => ({
                              ...prev,
                              [post._id]: !isLiked,
                            }));

                            // 2. Count Logic (Optimistic UI update)
                            setLocalLikeCount((prev) => {
                              const current =
                                prev[post._id] ?? (post.likes || 0);
                              const updated = isLiked
                                ? current - 1
                                : current + 1;
                              return {
                                ...prev,
                                [post._id]: updated < 0 ? 0 : updated,
                              };
                            });

                            // 3. Backend Call (Database Sync)
                            await dispatch(
                              incrementPostLike({ post_id: post._id })
                            );
                          }}
                        >
                          <button
                            type="button"
                            className={`${styles.likeBtn} ${
                              likedPosts[post._id] ? styles.activeLike : ""
                            }`}
                          >
                            {/* 👍 SVG ICON: Fill and color toggle */}
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill={
                                likedPosts[post._id] ? "currentColor" : "none"
                              }
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              stroke="currentColor"
                              className={styles.likeIcon}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z"
                              />
                            </svg>

                            <span>Like</span>

                            {/* 🔹 COUNT DISPLAY: Uses local state for speed, falls back to DB count */}
                            {(localLikeCount[post._id] ?? post.likes) > 0 && (
                              <span className={styles.likeCount}>
                                {localLikeCount[post._id] ?? post.likes}
                              </span>
                            )}
                          </button>
                        </div>

                        {/* --- COMMENT BUTTON REPAIRED --- */}
                        <div
                          className={styles.cardAction2}
                          onClick={async () => {
                            // 1. Local state set karo taaki modal turant khule
                            setActivePostId(post._id);

                            // 2. Backend se comments fetch karo
                            await dispatch(
                              getAllComments({ post_id: post._id })
                            );
                          }}
                        >
                          <button type="button" className={styles.actionBtn}>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              stroke="currentColor"
                              className={styles.likeIcon}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                              />
                            </svg>
                            <span>Comment</span>
                          </button>
                        </div>

                        {/* --- SHARE SECTION --- */}
                        <div
                          className={styles.cardAction3}
                          onClick={() => {
                            const text = encodeURIComponent(post.body);
                            const url = encodeURIComponent("apnacollege.in");
                            const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
                            window.open(twitterUrl, "_blank");
                          }}
                        >
                          <button className={styles.actionBtn}>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              stroke="currentColor"
                              className={styles.likeIcon}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
                              />
                            </svg>
                            <span>Share</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {isPostLoading && (
                <div className={styles.loaderCenter}>
                  <div className={styles.spinner}></div>
                </div>
              )}
            </div>
          </div>
        )}
        {/* --- REPAIRED COMMENT MODAL --- */}
        {activePostId !== "" && (
          <div
            className={styles.commentsOverlay}
            onClick={() => {
              setActivePostId("");
              // Reset postState.comments ko tabhi karein agar aap storage bachana chahte hain
            }}
          >
            <div
              className={styles.commentModalCard}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 1. Header: Total Count with Persistence Check */}
              <div className={styles.commentModalHeader}>
                <h3>Comments ({postState.comments?.length || 0})</h3>
                <button
                  className={styles.closeCommentBtn}
                  onClick={() => setActivePostId("")}
                >
                  ✕
                </button>
              </div>

              {/* 2. Comments List: Har user ko dikhane ke liye Populate logic check */}
              <div className={styles.commentListWrapper}>
                {postState.comments && postState.comments.length > 0 ? (
                  // Remove duplicate comments by _id
                  [...new Map(postState.comments.map(c => [c._id, c])).values()].map((comment, index) => {

                    const userObj = comment.userId;
                    const isCommentOwner =
                      currentLoggedInId?.toString() ===
                      (userObj?._id || userObj)?.toString();

                    return (
                    <div
                      className={styles.singleCommentItem}
                      key={comment._id || `comment-${index}-${Math.random().toString(36).substr(2, 9)}`}
                    >

                        <div className={styles.commentUserHeader}>
                          <img
                            src={getImageUrl(userObj?.profilePicture)}
                            className={styles.commentUserImg}
                            onError={handleImageError}
                            alt="user profile"
                          />



                          <div className={styles.commentUserMeta}>
                            <p className={styles.commentUserName}>
                              {userObj?.name || "ProLink User"}
                            </p>
                            <p className={styles.commentUserHandle}>
                              @{userObj?.username || "username"}
                            </p>
                          </div>

                          {isCommentOwner && (
                            <button
                              className={styles.deleteCommentTiny}
                              onClick={async () => {
                                if (window.confirm("Delete this comment?")) {
                                  await dispatch(
                                    deleteComment({
                                      comment_id: comment._id,
                                      post_id: activePostId,
                                    })
                                  );
                                  // 🔥 REAL-TIME: Refresh comments immediately so deleted comment disappears without manual refresh
                                  dispatch(getAllComments({ post_id: activePostId }));
                                }
                              }}
                            >

                              <svg
                                width="18"
                                height="18"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
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

                        <div className={styles.commentTextBody}>
                          {comment.body}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className={styles.noCommentsPlaceholder}>
                    No comments found for this post.
                  </div>
                )}
              </div>

              {/* 3. Footer: Global Sync Logic */}
              <div className={styles.commentInputFooter}>
                <div className={styles.commentInputRow}>
                  <input
                    type="text"
                    className={styles.commentBar}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    onKeyDown={async (e) => {
                      if (e.key === "Enter" && commentText.trim()) {
                        const res = await dispatch(
                          postComment({
                            post_id: activePostId,
                            body: commentText,
                          })
                        );
                        if (res.meta.requestStatus === "fulfilled") {
                          setCommentText("");
                          // 🔥 Sabse important: Naya comment aate hi poori list re-fetch karo
                          dispatch(getAllComments({ post_id: activePostId }));
                        }
                      }
                    }}
                  />
                  <button
                    className={styles.sendCommentActionButton}
                    disabled={!commentText.trim()}
                    onClick={async () => {
                      const res = await dispatch(
                        postComment({
                          post_id: activePostId,
                          body: commentText,
                        })
                      );
                      if (res.meta.requestStatus === "fulfilled") {
                        setCommentText("");
                        dispatch(getAllComments({ post_id: activePostId }));
                      }
                    }}
                  >
                    Comment
                  </button>
                </div>
              </div>
            </div>
          </div>
          
        )}
      </DashboardLayout>
    </UserLayout>
  );
}

export default Dashboard;
