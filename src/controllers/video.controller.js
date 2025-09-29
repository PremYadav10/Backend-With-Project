import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
        //TODO: get all videos based on query, sort, pagination

    const filter = {}
    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ]
    }

    if (userId) {
        filter.owner = new mongoose.Types.ObjectId(userId)
    }

    const sort = {}
    if (sortBy) {
        sort[sortBy] = sortType === "asc" ? 1 : -1
    } else {
        sort.createdAt = -1
    }

    const videos = await Video.aggregate([
        { $match: filter },

        // populate owner (like populate in mongoose)
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        { $unwind: "$owner" },  // flatten owner array
        {
            $project: {
                title: 1,
                description: 1,
                views: 1,
                thumbnail: 1,
                createdAt: 1,
                duration: 1,
                "owner._id": 1,
                "owner.username": 1,
                "owner.avatar": 1
            }
        },

        { $sort: sort },
        { $skip: (page - 1) * parseInt(limit) },
        { $limit: parseInt(limit) }
    ])

    //Alternative using mongoose populate
    // const videos = await Video.find(filter)
    //     .populate("owner", "username avatar")
    //     .sort(sort)
    //     .skip((page - 1) * parseInt(limit))
    //     .limit(parseInt(limit))

    // count total documents (separate because pagination)
    const totalVideos = await Video.countDocuments(filter)
    const totalPages = Math.ceil(totalVideos / parseInt(limit))

    res.status(200).json(
        new ApiResponse(
            200,
            {
                videos,
                totalVideos,
                totalPages,
                currentPage: parseInt(page)
            },
            "Videos are fetched successfully !!"
        )
    )
})

const publishAVideo = asyncHandler(async (req, res) => {

    // TODO: get video, upload to cloudinary, create video

    const { title, description} = req.body

    if (!( title && description )) {
         throw new ApiError(401,
            "title and description are required !!",
        )
    }
    

    const videoFileLocalPath = await req.files?.videoFile[0]?.path
    
    const thumbnailLocalPath = await req.files?.thumbnail[0]?.path


    if(!(videoFileLocalPath && thumbnailLocalPath)){
        throw new ApiError(401,
            "Video file and thumbnail are required !!",
        )
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)    
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)


    if(!(videoFile && thumbnail)){
        throw new ApiError(500,
            " Error while uploding the thumbnail or videoFile ",
        )
    }

    const video = await Video.create({
        videoFile:videoFile.url,
        thumbnail:thumbnail.url,
        title,
        description,
        duration:videoFile.duration,
        owner:req.user?._id
    })

    if(!video){
        throw new ApiError(501,
            "Error while uploading/save a video on database"
        )
    }

    res.status(200)
        .json(
            new ApiResponse(200,
                video,
                "video is uploaded/save in a database successfully"
            )
        )


    
})



const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    // --- 1. Increment Views and Update History (Non-Blocking) ---
    // Update the video views count for everyone (logged in or not)
    await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });

    // Check if the user is logged in (req.user is set by optionalJWT)
    if (req.user?._id) {
        const userId = req.user._id;

        // A. PULL: Remove the videoId if it exists in the history (ensures no duplicates)
        await User.findByIdAndUpdate(
            userId,
            {
                $pull: { watchHistory: videoId } 
            }
        );

        // B. PUSH: Add the videoId back to the front of the array (sets it as most recent)
        await User.findByIdAndUpdate(
            userId,
            {
                $push: {
                    watchHistory: {
                        $each: [videoId],
                        $position: 0 
                    }
                }
            }
        );
    }
    
    // --- 2. Fetch Video Details (Your existing aggregation) ---
    // The aggregation logic remains the same, but it now runs after the history update.
    const video = await Video.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(videoId) } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            avatar: 1,
                            // Note: If you want the actual subscriber count, 
                            // you need a $lookup on the subscriptions collection here.
                            // The current 'subscribers: 1' might just pull a field if it exists.
                        },
                    },
                ],
            },
        },
        { $unwind: "$channel" },
        {
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                views: 1, // Note: This views count is the value *before* the increment finished.
                thumbnail: 1,
                videoFile: 1,
                duration: 1,
                createdAt: 1,
                channel: 1,
            },
        },
    ]);

    if (!video || video.length === 0) {
        throw new ApiError(404, "Video not found");
    }

    res.status(200).json(
        new ApiResponse(200, video[0], "Video fetched successfully")
    );
});


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body

    if(!(title && description)){
        throw new ApiError(400,"title and description are required")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404,"Video not found")
    }

    if(video.owner.toString()!==req.user?._id.toString()){
      throw new ApiError(403,"You are not authorized to update this video")
    }

    
    const thumbnailLocalPath = await req.file?.path
    

    if(!thumbnailLocalPath){
        throw new ApiError(400,"thumbnail is required")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if(!thumbnail){
        throw new ApiError(500,"Error while uploading thumbnail on cloudinary")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            title,
            description,
            thumbnail:thumbnail.url
        },
        {new:true}
    )

    if(!updatedVideo){
        throw new ApiError(500,"Error while updating the video")
    }

    res.status(200)
    .json(
        new ApiResponse(200,
            updatedVideo,
            "Video is updated successfully"
        )
    )



})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404,"Video not found")
    }

    if(video.owner.toString()!==req.user?._id.toString()){
      throw new ApiError(403,"You are not authorized to delete this video")
    }


    const deletedVideo = await Video.findByIdAndDelete(videoId)

    if(!deletedVideo){
        throw new ApiError(500,"Error while deleting the video or video is not available")
    }

    // delete videofile and tumbnail from cloudinary
    

    res.status(200)
    .json(
        new ApiResponse(200,
            deletedVideo,
            "Video is deleted successfully"
        )
    )

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404,"Video not found")
    }

    if(video.owner.toString()!==req.user?._id.toString()){
      throw new ApiError(403,"You are not authorized to update this video")
    }

    // video.isPublished = !video.isPublished
    // await video.save(
    //     {
    //         validateBeforeSave: false
    //     },
    //     {
    //         new: true
    //     }
    // )

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { isPublished: !video.isPublished },
        { new: true }
    )

    if(!updatedVideo){
        throw new ApiError(500,"Error while toggling publish status")
    }

    res.status(200)
    .json(
        new ApiResponse(200,
            updatedVideo,
            "Video publish status toggled successfully"
        )
    )

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}