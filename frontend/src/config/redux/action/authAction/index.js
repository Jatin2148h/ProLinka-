    import { createAsyncThunk } from "@reduxjs/toolkit";
import { clientServer } from "@/config";

/**
 * ==========================================
 * 1. REGISTER USER
 * ==========================================
 */
export const registerUser = createAsyncThunk(
    "auth/register",
    async (user, thunkAPI) => {
        try {
            const res = await clientServer.post("/register", user);
            // After successful registration, refresh top profiles
            thunkAPI.dispatch(getTopProfiles());
            return res.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(
                error.response?.data?.message || "Registration failed"
            );
        }
    }
);

/**
 * ==========================================
 * 2. LOGIN USER
 * ==========================================
 */
export const loginUser = createAsyncThunk(
    "auth/login",
    async (user, thunkAPI) => {
        try {
            const res = await clientServer.post("/login", user);

            if (typeof window !== "undefined") {
                if (res.data?.token) {
                    localStorage.setItem("token", res.data.token);
                    localStorage.setItem("user", JSON.stringify(res.data.user));
                    
                    if (res.data.user?._id) {
                        localStorage.setItem("userId", res.data.user._id);
                    }
                } else {
                    return thunkAPI.rejectWithValue("Token not received from server");
                }
            }

            return res.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(
                error.response?.data?.message || "Invalid credentials. Please try again."
            );
        }
    }
);

/**
 * ==========================================
 * 3. LOGOUT USER
 * ==========================================
 */
export const logoutUser = createAsyncThunk("auth/logout", async () => {
    if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userId");
    }
    return true;
});

/**
 * ==========================================
 * 4. GET LOGGED IN USER + PROFILE
 * ==========================================
 */
export const getAboutUser = createAsyncThunk(
    "user/getAboutUser",
    async (_, thunkAPI) => {
        try {
            if (typeof window === "undefined") return;

            const token = localStorage.getItem("token");
            if (!token) return thunkAPI.rejectWithValue("No token found");

            const response = await clientServer.get(
                "/get_user_and_profile",
                { params: { token } }
            );

            if (response.data?.user?._id) {
                localStorage.setItem("userId", response.data.user._id);
            }

            return response.data;
        } catch (err) {
            return thunkAPI.rejectWithValue("Failed to fetch user session");
        }
    }
);

/**
 * ==========================================
 * 5. GET ALL USERS PROFILE
 * ==========================================
 */
export const getAllUsers = createAsyncThunk(
  "user/getAllUsers",
  async (_, thunkAPI) => {
    try {
      const response = await clientServer.get("/get_all_users_profile");
      // Also refresh top profiles when fetching all users
      thunkAPI.dispatch(getTopProfiles());
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

/**
 * ==========================================
 * 6. CONNECTION REQUEST
 * ==========================================
 */
export const sendConnectionRequest = createAsyncThunk(
    "user/sendConnectionRequest",
    async (user , thunkAPI) => {
        try {
            const res = await clientServer.post("/send_connection_request", {
                token: user.token ,
                connectionId: user.user_id
            });

            thunkAPI.dispatch(getConnectionRequests({token:user.token}))
            return res.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message);
        }
    }
);

export const getConnectionRequests = createAsyncThunk(
    "user/getConnectionRequests",
    async (user, thunkAPI) => {
        try {
            const res = await clientServer.post("/getConnectionRequests", {
                token: user.token
            });
            return res.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message);
        }
    }
);

/**
 * ==========================================
 * 7. GET MY CONNECTION REQUESTS
 * ==========================================
 */
export const getMyConnectionRequests = createAsyncThunk(
    "user/getMyConnectionRequests",
    async (user, thunkAPI) => {
        try {
            const res = await clientServer.post("/getConnectionRequests", {
                token: user.token
            });
            return res.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message);
        }
    }
);

/**
 * ==========================================
 * 8. ACCEPT/REJECT CONNECTION
 * ==========================================
 */
export const acceptConnectionRequest = createAsyncThunk(
    "user/acceptConnectionRequest",
    async (user, thunkAPI) => {
        try {
            const res = await clientServer.post("/accept_connection_request", {
                token:user.token,
                requestId:user.connectionId,
                action_type:user.action
            });

            thunkAPI.dispatch(getConnectionRequests({token:user.token}))
            thunkAPI.dispatch(getMyConnectionRequests({token:user.token}))
            thunkAPI.dispatch(getAllUsers());
            return res.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.message);
        }
    }
);

/**
 * ==========================================
 * 9. GET TOP PROFILES
 * ==========================================
 */
export const getTopProfiles = createAsyncThunk(
    "auth/getTopProfiles",
    async (_, thunkAPI) => {
        try {
            const res = await clientServer.get("/top-profiles");
            return res.data;
        } catch (error) {
            return thunkAPI.rejectWithValue("Failed to load top profiles");
        }
    }
);
