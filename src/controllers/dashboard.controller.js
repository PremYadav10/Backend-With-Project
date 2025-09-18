import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscriptions.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const getChannelStats = asyncHandler(async (req, res) => {
// TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const channelId = req.user._id;

    // 1️⃣ Total Subscribers
    const totalSubscribersResult = await Subscription.aggregate([
        { $match: { channel: new mongoose.Types.ObjectId(channelId) } },
        { $count: "totalSubscribers" }
    ]);
    const totalSubscribers = totalSubscribersResult[0]?.totalSubscribers || 0;

    // 2️⃣ Total Videos & Total Views
    const totalVideosAndViewsResult = await Video.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(channelId) } },
        { $group: { _id: null, totalVideos: { $sum: 1 }, totalViews: { $sum: "$views" } } }
    ]);
    const totalVideos = totalVideosAndViewsResult[0]?.totalVideos || 0;
    const totalViews = totalVideosAndViewsResult[0]?.totalViews || 0;

    // 3️⃣ Total Likes using $lookup + $unwind + $count
    const totalLikesResult = await Video.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(channelId) } },
        { $lookup: {
            from: "likes",               // Like collection
            localField: "_id",           // Video _id
            foreignField: "video",       // Like.video field
            as: "videoLikes"
        }},
        { $unwind: "$videoLikes" },      // Flatten likes array
        { $count: "totalLikes" }         // Count total likes
    ]);
    const totalLikes = totalLikesResult[0]?.totalLikes || 0;

    // 4️⃣ Return stats
    res.status(200).json(
        new ApiResponse(200, {
            totalSubscribers,
            totalVideos,
            totalViews,
            totalLikes
        }, "Channel stats fetched successfully")
    );
});


const getChannelVideos = asyncHandler(async (req, res) => {
    // Get all the videos uploaded by the channel
    const channelId = req.user._id;

    // Using .find() is simpler than .aggregate() since we only filter by owner
    const channelVideos = await Video.find({ owner: channelId })
                                     .sort({ createdAt: -1 }); // optional: most recent first

    if (!channelVideos.length) {
        return res.status(204).json(
            new ApiResponse(200, [], "No videos found for this channel")
        );
    }

    res.status(200).json(
        new ApiResponse(200, channelVideos, "Videos Fetched Successfully")
    );
});


export {
    getChannelStats, 
    getChannelVideos
    }