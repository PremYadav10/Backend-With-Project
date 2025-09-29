import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// 📌 Get Comments
const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const comments = await Comment.aggregate([
        {
            $match: { video: new mongoose.Types.ObjectId(videoId) }
        },
        {
            $sort: { createdAt: -1 } // newest first
        },
        { $skip: skip },
        { $limit: parseInt(limit) },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        { $unwind: "$owner" },
        {
            $project: {
                content: 1,
                createdAt: 1,
                "owner._id": 1,
                "owner.username": 1,
                "owner.avatar": 1
            }
        }
    ])

    if (comments.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, [], "No comments found for this video")
        )
    }

    res.status(200).json(
        new ApiResponse(200, comments, "Comments fetched successfully")
    )
})

// 📌 Add Comment
const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const { content } = req.body

    if (!content) {
        throw new ApiError(400, "comment content is required")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id
    })    

    if (!comment) {
        throw new ApiError(500, "Error while uploading comment")
    }

    res.status(200).json(
        new ApiResponse(200, comment, "comment uploaded successfully")
    )
})

// 📌 Update Comment
const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { content } = req.body

    if (!content) {
        throw new ApiError(400, "comment content is required")
    }

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "invalid comment ID")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        { content },
        { new: true }
    )

    if (!updatedComment) {
        throw new ApiError(500, "Error while updating the comment")
    }

    res.status(200).json(
        new ApiResponse(200, updatedComment, "comment is updated")
    )
})

// 📌 Delete Comment
const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId)

    if (!deletedComment) {
        throw new ApiError(500, "Error while deleting the comment")
    }

    res.status(200).json(
        new ApiResponse(200, {}, "comment deleted successfully")
    )
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
