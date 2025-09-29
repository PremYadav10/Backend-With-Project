import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const  tweetContent  = req.body
    const userId = req.user.id

    if (!tweetContent) {
        throw new ApiError(400, "Content is required")
    }

    const tweet = await Tweet.create({
        content:tweetContent.content,
        owner:userId
    })

    if(!tweet){
        throw new ApiError(500,"Error while uplodong the tweet")
    }

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweet,
            "Tweet are Uploaded Successfully"
        )
    )

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const userId = req.user.id

    const tweets = await Tweet.aggregate([

        {$match:{owner: new mongoose.Types.ObjectId(userId)}},
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        { $unwind: "$owner" },

        // Join with likes
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes"
            }
        },

        // Project the fields
        {
            $project: {
                _id:1,
                content: 1,
                createdAt: 1,
                updatedAt: 1,

                owner: {
                    _id: "$owner._id",
                    name: "$owner.name",
                    avatar: "$owner.avatar"
                },

                // likes: list of user ids who liked
                "likes.userIds": "$likes.likedBy",

                // likes count
                likesCount: { $size: "$likes" }
            }
        },

        // Sort newest first
        { $sort: { createdAt: -1 } }
    ]);

    if (!tweets || tweets.length === 0) {
        throw new ApiError(404, "No tweets found");
    }



    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweets,
            "Tweets are fetched successfully"
        )
    )

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId} = req.params
    const tweetContent  = req.body

    if(!tweetContent){
        throw new ApiError(400,"Content is required")
    }

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid tweet id")
    }

    //const tweet = await Tweet.findById(tweetId)

    // if(!tweet){
    //     throw new ApiError(404,"No tweet found")
    // }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            content:tweetContent.content
        },
        {
            new:true
        }
    )

    if(!updatedTweet){
        throw new ApiError(500,"Unable to update the tweet")
    }

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedTweet,
            "Tweet are updated successfully"
        )
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params
console.log("tweet id :",tweetId);
    if(!isValidObjectId(tweetId)){
        
        
        throw new ApiError(400,"Invalid tweet id")
    }

    const deleteTweet = await Tweet.findByIdAndDelete(tweetId)

    if(!deleteTweet){
        throw new ApiError(500,"Error while deleting the tweet")
    }

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            deleteTweet,
            "tweet deleted successfully"
        )
    )
    
})

const getAllTweets = asyncHandler(async (req, res) => {
    const tweets = await Tweet.aggregate([
        // Join with users (owner)
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        { $unwind: "$owner" },

        // Join with likes
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes"
            }
        },

        // Project the fields
        {
            $project: {
                _id:1,
                content: 1,
                createdAt: 1,
                updatedAt: 1,

                owner: {
                    _id: "$owner._id",
                    name: "$owner.name",
                    avatar: "$owner.avatar"
                },

                // likes: list of user ids who liked
                "likes.userIds": "$likes.likedBy",

                // likes count
                likesCount: { $size: "$likes" }
            }
        },

        // Sort newest first
        { $sort: { createdAt: -1 } }
    ]);

    if (!tweets || tweets.length === 0) {
        throw new ApiError(404, "No tweets found");
    }

    res.status(200).json(
        new ApiResponse(
            200,
            tweets,
            "Tweets fetched successfully"
        )
    );
});


export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
    getAllTweets
}