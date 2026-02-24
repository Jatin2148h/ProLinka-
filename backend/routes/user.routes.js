import { Router } from "express";
import {
  register,
  login,
  uploadProfilePicture,
  uploadCoverPicture,
  updateUserProfile,
  updateProfileData,
  getUserAndProfile,
  getAllUsersPrfoile,
  downloadProfile,
  sendConnectionRequest,
  getMyConnectionRequests,
  whatAreMyConnection,
  acceptConnectionRequest,
  getTopProfiles ,
  getUserProfileAndUserBashedOnUsername 
} from "../controllers/user.controllers.js";



const router = Router();

/* ================= CLOUDINARY UPLOAD ================= */
import { uploadProfile, uploadCover } from "../config/cloudinary.js";


/* ================= ROUTES ================= */

// ✅ ADD: health / active check (debug safe)
router.get("/", (req, res) => {
  return res.status(200).json({ message: "USER ROUTES RUNNING" });
});

// Upload profile picture to Cloudinary - using factory function
router.post("/upload", (req, res, next) => uploadProfile.single("profile_picture")(req, res, next), uploadProfilePicture);

// Upload cover picture to Cloudinary - using factory function
router.post("/upload_cover", (req, res, next) => uploadCover.single("cover_picture")(req, res, next), uploadCoverPicture);




// Auth
router.post("/register", register);
router.post("/login", login);

// Update user
router.post("/user_update", updateUserProfile);
router.post("/update_profile_data", updateProfileData);


// ❌ original routes kept (NO REMOVE)
router.get("/user/get_user_and_profile", getUserAndProfile);
router.get("/user/get_all_users_profile", getAllUsersPrfoile);

// ✅ ADD: frontend-friendly aliases (404 bug fix)
router.get("/get_user_and_profile", getUserAndProfile);
router.get("/get_all_users_profile", getAllUsersPrfoile);

// Download resume
router.get("/user/download_resume", downloadProfile);

// ✅ ADD: frontend-friendly alias (404 bug fix)
router.get("/download_resume", downloadProfile);


// Connections
router.post("/user/send_connection_request", sendConnectionRequest);
router.post("/user/getConnectionRequests", getMyConnectionRequests);
router.get("/user/user_connection_request", whatAreMyConnection);
router.post("/user/accept_connection_request", acceptConnectionRequest);
router.get("/top-profiles", getTopProfiles);
router.get("/user/get_profile_base_on_username", getUserProfileAndUserBashedOnUsername);

// ✅ ADD: frontend-friendly aliases (404 bug fix)
router.post("/send_connection_request", sendConnectionRequest);
router.post("/getConnectionRequests", getMyConnectionRequests);
router.get("/user_connection_request", whatAreMyConnection);
router.post("/accept_connection_request", acceptConnectionRequest);
router.get("/get_profile_base_on_username", getUserProfileAndUserBashedOnUsername);

export default router;
