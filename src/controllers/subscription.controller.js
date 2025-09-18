import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import {Subscription} from "../models/subscriptions.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription

    const userId = req.user._id

    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid ChannelId")
    }

    if(channelId.toString() === userId.toString()){
        throw new ApiError(400,"You cannot subscribe to yourself")
    }

    const isSubscribe = await Subscription.findOne({
        channel:channelId,
        subscriber:userId
    })

    if(isSubscribe){
        // unsubscribe
        await Subscription.findByIdAndDelete(isSubscribe._id)
        return res.status(204).json(new ApiResponse(200,{},"Unsubscribed Successfully"))
    }
    else{
        // subscribe
        const newSubscription = await Subscription.create({
            channel:channelId,
            subscriber:userId
        })
        return res.status(201).json(new ApiResponse(200,newSubscription,"Subscribed Successfully"))
    }

    
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"Invalid ChannelId")
    }

    const channelSubscribers = await Subscription.find({channel:channelId})
                                    .populate("subscriber","username avatar")

    if (channelSubscribers.length === 0) {
    throw new ApiError(404, "No Subscriber Found")
    }

    res.status(200).json(
        new ApiResponse(200,
            channelSubscribers,
            "channelSubscribers fetched successfully"
        )
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400,"Invalid subscriberId")
    }

    const subscribedChannel = await Subscription.find({subscriber:subscriberId})
                                    .select("channel")
                                    .populate("channel","username avatar")

    if (subscribedChannel.length === 0) {
    throw new ApiError(404, "No Subscribed Channels Found")
    }

    res.status(200).json(
        new ApiResponse(200,
            subscribedChannel,
            "Subscribed channels fetched successfully"
        )
    )

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}