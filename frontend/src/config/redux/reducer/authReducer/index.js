import { createSlice } from "@reduxjs/toolkit";
import {
    getAllUsers,
    loginUser,
    getAboutUser,
    logoutUser,
    sendConnectionRequest,
    getConnectionRequests,
    getMyConnectionRequests,
    acceptConnectionRequest,
    getTopProfiles
} from "../../action/authAction";

const initialState = {
    loggedIn: false,
    user: null,
    allUser: [],
    all_profile_fetch: false,
    top_profiles: [],
    connectionRequests: [],
    loading: false,
    error: null
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            /* ================= 1. GET ALL USERS ================= */
            .addCase(getAllUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllUsers.fulfilled, (state, action) => {
                state.loading = false;
                
                // Ensure data is array
                const incomingData = Array.isArray(action.payload) ? action.payload : [];
                
                // Filter valid profiles only
                state.allUser = incomingData.filter(profile => profile && profile.userId);
                state.all_profile_fetch = true;
            })
            .addCase(getAllUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.allUser = [];
            })

            /* ================= 2. LOGIN ================= */
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.loggedIn = true;
                state.user = action.payload.user;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            /* ================= 3. SESSION ================= */
            .addCase(getAboutUser.fulfilled, (state, action) => {
                state.loggedIn = true;
                state.user = action.payload.user;
            })
            .addCase(getAboutUser.rejected, (state) => {
                state.loggedIn = false;
                state.user = null;
            })
            
            /* ================= 4. CONNECTIONS ================= */
            .addCase(sendConnectionRequest.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(getMyConnectionRequests.fulfilled, (state, action) => {
                state.connectionRequests = action.payload;
            })
            .addCase(getMyConnectionRequests.rejected, (state, action) => {
                state.connectionRequests = [];
            })

            /* ================= 5. TOP PROFILES ================= */
            .addCase(getTopProfiles.fulfilled, (state, action) => {
                state.top_profiles = action.payload;
            })

            /* ================= 6. LOGOUT ================= */
            .addCase(logoutUser.fulfilled, (state) => {
                return initialState;
            })
            .addCase(getConnectionRequests.fulfilled, (state, action) => {
                state.connectionRequests = action.payload;
            })
            .addCase(getConnectionRequests.rejected, (state, action) => {
                state.error = action.payload;
            });
    },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
