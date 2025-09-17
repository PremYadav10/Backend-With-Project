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

    const tweets = await Tweet.find({owner:userId});
    if(!tweets){
        throw new ApiError(404,"No tweets found");
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
    const { tweetId} = req.params

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

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}