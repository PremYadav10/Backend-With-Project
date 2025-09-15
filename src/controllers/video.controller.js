import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
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
    //console.log(req.files)
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
    const { videoId } = req.params
    //TODO: get video by id

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(500,"error while getVideoById , video is not available")
    }

    res.status(200)
    .json(
        new ApiResponse(200,
            video,
            "Video are fatched"
        )
    )
})

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

    const thumbnailLocalPath = await req.files?.thumbnail?.[0]?.path

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