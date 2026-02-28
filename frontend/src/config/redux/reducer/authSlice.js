import { createSlice } from "@reduxjs/toolkit";
import {
  registerUser,
  loginUser,
  logoutUser,
  getAboutUser,
  getAllUsers,
  getTopProfiles,
  sendConnectionRequest,
  getConnectionRequests,
  getMyConnectionRequests,
  acceptConnectionRequest,
} from "../action/authAction";


const initialState = {
  loading: false,
  loggedIn: false,
  token: null,
  isTokenThere: false,
  user: null,

  connections: [],
  connectionRequest: [],

  message: {
    type: "",
    message: "",
  },

  isError: false,

  // 👇 SINGLE SOURCE OF TRUTH
  allUser: [],
  top_profiles: [],

  all_profile_fetch: false,
};


const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    emptyMessage: (state) => {
      state.message = { type: "", message: "" };
      state.isError = false;
    },

    // ✅ ADDED: To set user from local storage on refresh
    setUser: (state, action) => {
      state.user = action.payload;
      state.loggedIn = true;
    },

    setTokenisThere: (state) => {
      state.isTokenThere = true;
    },

    setTokenIsNotThere: (state) => {
      state.isTokenThere = false;
    },

    /* ================= RESET (LOGOUT FIX) ================= */
    reset: () => initialState,

    /* ================= UPDATE USER IN ALL USER ARRAY ================= */
    updateUserInAllUser: (state, action) => {
      const { userId, profilePicture, coverPicture, ...otherUpdates } = action.payload;
      if (!userId) return;
      
      // Update in allUser array
      state.allUser = state.allUser.map(profile => {
        if (profile.userId && (profile.userId._id === userId || profile.userId === userId)) {
          return {
            ...profile,
            userId: {
              ...profile.userId,
              ...(profilePicture && { profilePicture }),
              ...(coverPicture && { coverPicture }),
              ...otherUpdates
            }
          };
        }
        return profile;
      });

      // Also update in top_profiles if exists
      if (state.top_profiles && Array.isArray(state.top_profiles)) {
        state.top_profiles = state.top_profiles.map(profile => {
          if (profile.userId && (profile.userId._id === userId || profile.userId === userId)) {
            return {
              ...profile,
              userId: {
                ...profile.userId,
                ...(profilePicture && { profilePicture }),
                ...(coverPicture && { coverPicture }),
                ...otherUpdates
              }
            };
          }
          return profile;
        });
      }
    },
  },


  extraReducers: (builder) => {
    builder

      /* ================= REGISTER ================= */
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.isError = false;
        state.message = {
          type: "success",
          message: "User registered successfully, Please login",
        };
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.isError = true;
        state.message = {
          type: "error",
          message: action.payload || "Registration failed",
        };
      })

      /* ================= LOGIN ================= */
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.loggedIn = true;
        state.isError = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.loggedIn = false;
        state.isError = true;
        state.message = {
          type: "error",
          message: action.payload || "Login failed",
        };
      })

      /* ================= GET LOGGED USER ================= */
      .addCase(getAboutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAboutUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isError = false;
        state.user = action.payload;
        state.connections = action.payload?.connections || [];
        state.connectionRequests = action.payload?.connectionRequests || [];
      })
      .addCase(getAboutUser.rejected, (state) => {
        state.loading = false;
      })

      /* ================= GET ALL USERS ================= */
      .addCase(getAllUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        // Ensure data is array and filter valid profiles
        const incomingData = Array.isArray(action.payload) ? action.payload : [];
        state.allUser = incomingData.filter(profile => profile && profile.userId);
        state.all_profile_fetch = true;
      })
      .addCase(getAllUsers.rejected, (state) => {
        state.loading = false;
        state.allUser = [];
      })

      /* ================= GET TOP PROFILES ================= */
      .addCase(getTopProfiles.pending, (state) => {
        state.loading = true;
      })
      .addCase(getTopProfiles.fulfilled, (state, action) => {
        state.loading = false;
        // Ensure data is array, filter valid profiles, and remove duplicates
        const incomingData = Array.isArray(action.payload) ? action.payload : [];
        const validProfiles = incomingData.filter(profile => profile && profile.userId);
        
        // Remove duplicates based on userId
        const seen = new Set();
        state.top_profiles = validProfiles.filter(profile => {
          const userId = profile.userId?._id || profile.userId;
          if (seen.has(userId)) return false;
          seen.add(userId);
          return true;
        });
      })
      .addCase(getTopProfiles.rejected, (state) => {
        state.loading = false;
        state.top_profiles = [];
      })



      /* ================= CONNECTION REQUESTS ================= */
      .addCase(sendConnectionRequest.pending, (state) => {
        state.loading = true;
      })
      .addCase(sendConnectionRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.isError = false;
        state.message = {
          type: "success",
          message: "Connection request sent successfully",
        };
      })
      .addCase(sendConnectionRequest.rejected, (state, action) => {
        state.loading = false;
        state.isError = true;
        state.message = {
          type: "error",
          message: action.payload || "Failed to send connection request",
        };
      })

      .addCase(getConnectionRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(getConnectionRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.connectionRequests = action.payload;
      })
      .addCase(getConnectionRequests.rejected, (state) => {
        state.loading = false;
      })

      .addCase(getMyConnectionRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMyConnectionRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.connectionRequests = action.payload;
      })
      .addCase(getMyConnectionRequests.rejected, (state) => {
        state.loading = false;
      })

      .addCase(acceptConnectionRequest.pending, (state) => {
        state.loading = true;
      })
      .addCase(acceptConnectionRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.isError = false;
        state.message = {
          type: "success",
          message: "Connection request updated successfully",
        };
      })
      .addCase(acceptConnectionRequest.rejected, (state, action) => {
        state.loading = false;
        state.isError = true;
        state.message = {
          type: "error",
          message: action.payload || "Failed to update connection request",
        };
      })

      /* ================= LOGOUT ================= */
      .addCase(logoutUser.fulfilled, () => initialState);
  },
});

/* ================= EXPORTS ================= */
export const {
  emptyMessage,
  setTokenisThere,
  setTokenIsNotThere,
  reset,
  setUser, // ✅ Exported setUser
  updateUserInAllUser, // ✅ Exported for profile pic sync across pages
} = authSlice.actions;



export default authSlice.reducer;
