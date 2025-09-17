import mongoose, { Aggregate, isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { getVideoById } from "./video.controller.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const comments = await Comment.find({video:videoId})
        .skip(skip)
        .limit(limit)
        .populate("owner", "username avatar")

    if (comments.length === 0) {
    throw new ApiError(404, "No comments found for this video")
    }

    res.status(200)
        .json(
            new ApiResponse(200,
                comments,
                "Comments Fetched Successfully"
            )
        )   
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const videoId = req.params
    const userId = req.user.id

    const commentContent = req.body

    if(!commentContent){
        throw new ApiError(400,
            "comment content is required"
        )
    }

    const comment = await Comment.create({
        content:commentContent.content,
        video:videoId,
        owner:userId
    })
    
    if(!comment){
        throw new ApiError(500,"Error while uploding comment")
    }

    res
        .status(200)
        .json(
            new ApiResponse(200,
                comment,
                "comment uploaded successfully"
            )
        )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const commentId = req.params
    const newContent = req.body

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"invalid comment ID")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            content : newContent.content
        },
        {
            new:true
        }
    )

    if(!updateComment){
        throw new ApiError(500,"Error while updating the comment ", 
            Error.message
        )
    }

    res.status(200)
        .json(
            new ApiResponse(200,
                updateComment,
                "comment is updated"
            )
        )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const commentId = req.params

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid comment id")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId)

    if(!deleteComment){
        throw new ApiError(500,"Error while deleting the comment")
    }

    res.status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "comment deleted successfully"
            )
        )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
}