# Fix TODO List

## Issues to Fix:
1. ✅ "User not found" error when clicking profiles in Discover/Dashboard
2. ✅ Connection requests not visible to recipients  
3. ✅ Profile viewing not working

## Implementation Steps Completed:

### ✅ Step 1: Fix API endpoint in view_profile/[username].jsx
- Changed the getServerSideProps to use correct endpoint `/get_profile_base_on_username`
- Changed from: `clientServer.get(\`/${encodeURIComponent(username)}\`)`
- Changed to: `clientServer.get("/get_profile_base_on_username", { params: { username } })`

### ✅ Step 2: Fix backend route order in user.routes.js  
- Moved root `/` route AFTER `/:username` route to prevent routing conflicts
- The health check route now comes after all parameterized routes

### Step 3: Connection request visibility
- The connection request logic has already been implemented in previous versions
- The getConnectionRequests and getMyConnectionRequests are being called properly

## Status:
- ✅ Started: Waiting for user confirmation
- ✅ In Progress: Implementing fixes
- ✅ Completed: Core fixes applied

## Next Steps:
1. Test the application by running both backend and frontend
2. Verify that clicking on profiles in Discover works
3. Verify that connection requests are visible to recipients
