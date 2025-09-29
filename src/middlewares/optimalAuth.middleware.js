import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

// This middleware attempts to verify the JWT but PROCEEDS to the next handler
// even if the token is missing or invalid. It sets req.user only if authentication is successful.
export const optionalJWT = asyncHandler(async (req, _, next) => {
    // 1. Attempt to extract the token
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    
    // 2. If NO token is found, skip authentication and PROCEED.
    if (!token) {
        // Set req.user to null explicitly to indicate no user is logged in
        req.user = null; 
        return next();
    }

    // 3. If a token exists, attempt verification
    try {
        const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        // Fetch the user without password/refreshToken fields
        const user = await User.findById(decodeToken?._id).select("-password -refreshToken");
        
        // 4. Set req.user if verification and user lookup were successful
        if (user) {
            req.user = user;
        } else {
            // Token was valid but user not found (deleted account)
            req.user = null;
        }

        // Always proceed to the controller
        next();
    } catch (error) {
        // 5. If verification fails (expired, invalid signature), ignore the error.
        // The user is treated as not logged in for this request.
        req.user = null;
        return next();
    }
});