import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";
import Post from "../models/post.model.js";
import Comment from "../models/comments.model.js";
import Connection from "../models/connections.model.js";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import fs from "fs";
import axios from "axios";


/* ======================================================
   ✅ ADD (CRITICAL FIX – DO NOT REMOVE)
   Alias so old code using ConnectionRequest still works
====================================================== */
const ConnectionRequest = Connection;

/* ================= PDF HELPER (CLOUDINARY UPDATED) ================= */
const convertUserDataToPDF = async (userData) => {
  const doc = new PDFDocument();
  const outputPath = crypto.randomBytes(32).toString("hex") + ".pdf";
  const stream = fs.createWriteStream(`uploads/${outputPath}`);
  doc.pipe(stream);

  // Handle Cloudinary URL or local file for profile picture
  if (userData?.userId?.profilePicture) {
    try {
      const profilePic = userData.userId.profilePicture;
      
      // If it's a Cloudinary URL (starts with http)
      if (profilePic.startsWith('http')) {
        const response = await axios.get(profilePic, { 
          responseType: 'arraybuffer',
          timeout: 5000 
        });
        const imageBuffer = Buffer.from(response.data, 'binary');
        doc.image(imageBuffer, {
          align: "center",
          width: 100,
        });
      } 
      // If it's a local file
      else if (fs.existsSync(`uploads/${profilePic}`)) {
        doc.image(`uploads/${profilePic}`, {
          align: "center",
          width: 100,
        });
      }
    } catch (error) {
      console.log("Error loading profile picture for PDF:", error.message);
      // Continue without image if failed
    }
  }


  doc.fontSize(14).text(`Name: ${userData.userId.name}`);
  doc.fontSize(14).text(`Username: ${userData.userId.username}`);
  doc.fontSize(14).text(`Email: ${userData.userId.email}`);
  doc.fontSize(14).text(`Bio: ${userData.bio || ""}`);
  doc.fontSize(14).text(`Current Position: ${userData.currentPost || ""}`);
  doc.fontSize(14).text(`Experience: ${userData.experience || ""}`);
  doc.fontSize(14).text(`Education: ${userData.education || ""}`);
  doc.fontSize(14).text("Past Work:");

  if (Array.isArray(userData.pastWork)) {
    userData.pastWork.forEach((work) => {
      doc.fontSize(12).text(`Company Name: ${work.company}`);
      doc.fontSize(12).text(`Position: ${work.Position}`);
      doc.fontSize(12).text(`Years: ${work.years}`);
    });
  }

  doc.end();
  return outputPath;
};

/* ================= REGISTER ================= */
export const register = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      username,
      email,
      password: hashedPassword,
      profilePicture: "default.jpg",
      coverPicture: "default.jpg"
    });

    await newUser.save();

    // Create a complete Profile document for the new user
    const newProfile = new Profile({
      userId: newUser._id,
      bio: "Hey there! I'm new to ProLinka. Excited to connect with professionals!",
      location: "Not specified",
      currentPost: "New Member at ProLinka",
      pastWork: [],
      education: []
    });
    await newProfile.save();


    console.log(`New user registered: ${username} with profile created`);

    return res.status(201).json({ 
      message: "User registered successfully",
      user: {
        _id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email
      }
    });

  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: error.message });
  }
};

/* ================= LOGIN ================= */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = crypto.randomBytes(32).toString("hex");

    // ✅ ADD (TOKEN + EXPIRY)
    user.token = token;
    user.tokenExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    await user.save();

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* ================= UPLOAD PROFILE PIC (CLOUDINARY) ================= */
export const uploadProfilePicture = async (req, res) => {
  const { token } = req.body;
  try {
    const user = await User.findOne({ token });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!req.file)
      return res.status(400).json({ message: "No file uploaded" });

    // ✅ CLOUDINARY: req.file.path contains the full Cloudinary URL
    user.profilePicture = req.file.path;
    await user.save();
    return res.status(200).json({ 
      message: "Profile picture uploaded successfully",
      profilePicture: req.file.path // Return the Cloudinary URL
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


/* ================= UPLOAD COVER PIC (CLOUDINARY) ================= */
export const uploadCoverPicture = async (req, res) => {
  const { token } = req.body;
  try {
    const user = await User.findOne({ token });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!req.file)
      return res.status(400).json({ message: "No file uploaded" });

    // ✅ CLOUDINARY: req.file.path contains the full Cloudinary URL
    user.coverPicture = req.file.path;
    await user.save();
    return res.status(200).json({ 
      message: "Cover picture uploaded successfully",
      coverPicture: req.file.path // Return the Cloudinary URL
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


/* ================= UPDATE USER ================= */
export const updateUserProfile = async (req, res) => {
  try {
    const { token, ...newUserData } = req.body;
    const user = await User.findOne({ token });
    if (!user) return res.status(404).json({ message: "User not found" });

    /* ===== ADD (BUG FIX – variables undefined earlier) ===== */
    const { username, email } = newUserData;

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
      _id: { $ne: user._id },
    });

    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Username or email already in use" });
    }

    Object.assign(user, newUserData);
    await user.save();
    return res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* ================= GET USER + PROFILE ================= */
export const getUserAndProfile = async (req, res) => {
  try {
    const { token } = req.query;
    const user = await User.findOne({ token });
    if (!user) return res.status(404).json({ message: "User not found" });

    let userProfile = await Profile.findOne({ userId: user._id }).populate(
      "userId",
      "name username email profilePicture"
    );

    // If profile doesn't exist, create one
    if (!userProfile) {
      userProfile = new Profile({
        userId: user._id,
        bio: "",
        currentPost: "",
        pastWork: [],
        education: "",
      });
      await userProfile.save();
      // Populate again after saving
      userProfile = await Profile.findOne({ userId: user._id }).populate(
        "userId",
        "name username email profilePicture"
      );
    }

    return res.status(200).json(userProfile);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* ================= UPDATE PROFILE DATA ================= */
export const updateProfileData = async (req, res) => {
  try {
    const { token, ...newProfileData } = req.body;
    const user = await User.findOne({ token });
    if (!user) return res.status(404).json({ message: "User not found" });

    let profile_to_update = await Profile.findOne({ userId: user._id });
    
    // If profile doesn't exist, create one
    if (!profile_to_update) {
      profile_to_update = new Profile({
        userId: user._id,
        bio: "",
        currentPost: "",
        pastWork: [],
        education: []
      });
    }

    // Update fields with default values if not provided
    profile_to_update.bio = newProfileData.bio !== undefined ? newProfileData.bio : (profile_to_update.bio || "");
    profile_to_update.currentPost = newProfileData.currentPost !== undefined ? newProfileData.currentPost : (profile_to_update.currentPost || "");
    
    // Handle pastWork - ensure it's always an array
    if (newProfileData.pastWork !== undefined) {
      profile_to_update.pastWork = Array.isArray(newProfileData.pastWork) ? newProfileData.pastWork : [];
    }
    
    // Handle education - ensure it's always an array
    if (newProfileData.education !== undefined) {
      profile_to_update.education = Array.isArray(newProfileData.education) ? newProfileData.education : [];
    }

    await profile_to_update.save();

    return res
      .status(200)
      .json({ 
        message: "Profile data updated successfully",
        profile: profile_to_update
      });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* ================= GET ALL USERS (ORIGINAL) ================= */
export const getAllUsersPrfoile = async (req, res) => {
  try {
    // Original populate - simple and working
    const usersProfiles = await Profile.find().populate(
      "userId",
      "name username email profilePicture"
    );
    
    // Simple null check only
    const validProfiles = usersProfiles.filter(p => p.userId !== null);
    
    return res.status(200).json(validProfiles);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* ================= DOWNLOAD PROFILE ================= */
export const downloadProfile = async (req, res) => {
  const user_id = req.query.id;
  const userProfile = await Profile.findOne({ userId: user_id }).populate(
    "userId",
    "name username email profilePicture"
  );
  const outputPath = await convertUserDataToPDF(userProfile);
  return res.status(200).json({ message: outputPath });
};

/* ================= CONNECTION REQUEST ================= */
export const sendConnectionRequest = async (req, res) => {
  const { token, connectionId } = req.body;
  try {
    const user = await User.findOne({ token });
    if (!user) return res.status(404).json({ message: "User not found" });

    const existing = await ConnectionRequest.findOne({
      userId: user._id,
      connectionId,
    });
    if (existing)
      return res
        .status(409)
        .json({ message: "Connection request already sent" });

    const request = new ConnectionRequest({
      userId: user._id,
      connectionId,
      status: "pending",
      requestedAt: new Date(),
    });

    await request.save();
    return res
      .status(200)
      .json({ message: "Connection request sent successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* ================= GET MY CONNECTION REQUESTS ================= */
// FIXED: Fetch both sent AND received requests with deduplication
export const getMyConnectionRequests = async (req, res) => {
  const { token } = req.body;
  try {
    const user = await User.findOne({ token });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch requests SENT BY the user (userId = current user)
    const sentRequests = await ConnectionRequest.find({ userId: user._id })
      .populate("connectionId", "name username email profilePicture");

    // Fetch requests RECEIVED BY the user (connectionId = current user)
    const receivedRequests = await ConnectionRequest.find({ connectionId: user._id })
      .populate("userId", "name username email profilePicture");

    // Mark them appropriately so frontend knows the direction
    const sentWithDirection = sentRequests.map(req => ({
      ...req.toObject(),
      direction: 'sent', // We sent this request
      displayUser: req.connectionId // For rendering
    }));

    const receivedWithDirection = receivedRequests.map(req => ({
      ...req.toObject(),
      direction: 'received', // We received this request
      displayUser: req.userId // The person who sent the request
    }));

    // Combine both
    const allConnections = [...sentWithDirection, ...receivedWithDirection];

    // Deduplicate accepted connections - keep only one per unique user pair
    const seenUserIds = new Set();
    const uniqueConnections = allConnections.filter((connection) => {
      // Only deduplicate accepted connections
      if (connection.status !== "accepted") {
        return true; // Keep all pending/rejected requests as-is
      }
      
      // Determine the "other" user in this connection
      const otherUserId = connection.userId._id.toString() === user._id.toString()
        ? connection.connectionId._id.toString()
        : connection.userId._id.toString();
      
      // Skip if we've already seen this user
      if (seenUserIds.has(otherUserId)) {
        return false;
      }
      
      // Mark this user as seen
      seenUserIds.add(otherUserId);
      return true;
    });

    return res.status(200).json(uniqueConnections);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


/* ================= MY CONNECTIONS ================= */
export const whatAreMyConnection = async (req, res) => {
  const { token } = req.query;
  try {
    const user = await User.findOne({ token });
    if (!user) return res.status(404).json({ message: "User not found" });

    const connections = await ConnectionRequest.find({
      $or: [
        { userId: user._id, status: "accepted" },
        { connectionId: user._id, status: "accepted" },
      ],
    })
      .populate("connectionId", "name username email profilePicture")
      .populate("userId", "name username email profilePicture");

    // Deduplicate connections - keep only one record per unique user pair
    const seenUserIds = new Set();
    const uniqueConnections = connections.filter((connection) => {
      // Determine the "other" user in this connection
      const otherUserId = connection.userId._id.toString() === user._id.toString()
        ? connection.connectionId._id.toString()
        : connection.userId._id.toString();
      
      // Skip if we've already seen this user
      if (seenUserIds.has(otherUserId)) {
        return false;
      }
      
      // Mark this user as seen
      seenUserIds.add(otherUserId);
      return true;
    });

    return res.status(200).json(uniqueConnections);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


/* ================= ACCEPT CONNECTION ================= */
export const acceptConnectionRequest = async (req, res) => {
  const { token, requestId, action_type } = req.body;
  try {
    const user = await User.findOne({ token });
    if (!user) return res.status(404).json({ message: "User not found" });

    const connectionRequest = await ConnectionRequest.findById(requestId);
    if (!connectionRequest)
      return res
        .status(404)
        .json({ message: "Connection request not found" });

    // Check if user is authorized to accept/reject this request
    if (connectionRequest.connectionId.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to handle this request" });
    }

    if (action_type === "accept") {
      // Update the original request status to accepted
      connectionRequest.status = "accepted";
      await connectionRequest.save();

      // Create bidirectional connection - check if reverse connection already exists
      const existingReverse = await ConnectionRequest.findOne({
        userId: connectionRequest.connectionId,
        connectionId: connectionRequest.userId
      });

      if (!existingReverse) {
        // Create the reverse connection
        const reverseConnection = new ConnectionRequest({
          userId: connectionRequest.connectionId,
          connectionId: connectionRequest.userId,
          status: "accepted",
          requestedAt: new Date()
        });
        await reverseConnection.save();
      } else {
        // Update existing reverse connection to accepted
        existingReverse.status = "accepted";
        await existingReverse.save();
      }

      return res.json({ message: "Connection request accepted and bidirectional connection created" });
    } else {
      // Reject the request
      connectionRequest.status = "rejected";
      await connectionRequest.save();
      return res.json({ message: "Connection request rejected" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ================= TOP PROFILES =================
export const getTopProfiles = async (req, res) => {
  try {
    // Get all profiles with user data (including user's createdAt for sorting)
    const profiles = await Profile.find()
      .populate("userId", "name username profilePicture createdAt")
      .lean(); // Convert to plain JS objects for easier manipulation
    
    // Filter out profiles where userId is null
    let validProfiles = profiles.filter(p => p.userId !== null);
    
    // Sort by profile createdAt if available, otherwise use user's createdAt
    validProfiles.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : (a.userId?.createdAt ? new Date(a.userId.createdAt) : new Date(0));
      const dateB = b.createdAt ? new Date(b.createdAt) : (b.userId?.createdAt ? new Date(b.userId.createdAt) : new Date(0));
      return dateB - dateA; // Newest first
    });
    
    console.log(`Returning ${validProfiles.length} profiles sorted by newest`);
    
    return res.status(200).json(validProfiles);
  } catch (error) {
    console.error("Error in getTopProfiles:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getUserProfileAndUserBashedOnUsername = async (req, res) => {
  const { username } = req.query;
  try {

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    let userProfile = await Profile.findOne({ userId: user._id }).populate(
      "userId",
      "name username email profilePicture"
    );
    
    // If profile doesn't exist, create one (for existing users before fix)
    if (!userProfile) {
      userProfile = new Profile({
        userId: user._id,
        bio: "",
        currentPost: "",
        pastWork: [],
        education: []
      });
      await userProfile.save();
      // Populate again after saving
      userProfile = await Profile.findOne({ userId: user._id }).populate(
        "userId",
        "name username email profilePicture"
      );
    }
    
    return res.status(200).json(userProfile);
  }
  catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
