import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    const userId = req.user.id
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid videoId")
    }

    const like = await Like.findOne({
        video : videoId,
        likedBy : userId
    })

    if(like){        
        await Like.findByIdAndDelete(like._id)
    }
    else{
        await Like.create({
            video:videoId,
            likedBy:userId
        })
    }

    res.status(200)
    .json(
        new ApiResponse(200,{},"toggle like in video successfully")
    )

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    const userId = req.user.id

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid commentId")
    }

    const like = await Like.findOne({
        comment:commentId,
        likedBy:userId
    })

    if(like){
        await Like.findByIdAndDelete(like._id)
    }else{
        await Like.create({
            comment:commentId,
            likedBy:userId
        })
    }

    res.status(200).json(new ApiResponse(200, {}, "Like toggled in comment successfully"))
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

    const userId = req.user.id
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid tweetId")
    }

    const like = await Like.findOne({
        tweet:tweetId,
        likedBy:userId
    })

    if(like){
        await Like.findByIdAndDelete(like._id)
    }else{
        await Like.create({
            tweet:tweetId,
            likedBy:userId
        })
    }

    res.status(200).json(new ApiResponse(200, {}, "Like toggled in tweet successfully"))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user.id

     const likedVideos = await Like.find({
        likedBy: userId,
        video: { $exists: true }   // only get video likes, not comment likes
    })
    .populate("video", "title thumbnail description") // get video details

    if (likedVideos.length === 0) {
        return new ApiResponse(204, [] , "No liked videos found")
    }

    res.status(200).json(
        new ApiResponse(
            200,
            likedVideos,
            "Liked videos fetched successfully"
        )
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
