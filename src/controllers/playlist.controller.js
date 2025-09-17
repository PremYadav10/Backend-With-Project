
import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { json } from "express"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    //TODO: create playlist
    const userId = req.user._id

    if(!(name && description) ){
        throw new ApiError(400,"name and description are required to create playlist")
    }

    const playlist = await Playlist.create(
        {  
            name:name,
            description:description,
            owner:userId
        }
    )

    if(!playlist){
        throw new ApiError(500,"Error while creating the playlist")
    }

    res.status(200)
        .json(
            new ApiResponse(200,
                playlist,
                "Playlist created successfully"
            )
        )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    const playlists = await Playlist.find(
        {owner:userId}
    )

    if(!playlists.length){
        throw new ApiError(404,"No playlists exist")
    }

    res.status(200)
        .json(
            new ApiResponse(
                200,
                playlists,
                "user playlists fatched successfully"
            )
        )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid Playlist Id")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404,"No Playlist Find || Error while fetching the playlist")
    }

    res.status(200)
        .json(
            new ApiResponse(200,
                playlist,
                "playlist fatched successfully"
            )
        )

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid Playlist Id")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid videoId ")
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $addToSet: { videos: videoId } }, // also use $push to add video but addToSet insure duplication
        {
            new:true
        }
    )

    if(!playlist){
        throw new ApiError(500,"error while add video to the playlist")
    }

    res.status(200)
        .json(
            new ApiResponse(200,
                playlist,
                "Video added to the playlist successfully"
            )
        )

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid Playlist Id")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid videoId ")
    }

    const playlist = await Playlist.findByIdAndUpdate(
                playlistId,
                { $pull: { videos: videoId } },  // remove matching videoId from videos array
                { new: true }
    )

    if(!playlist){
        throw new ApiError(500,"error while deleting video of the playlist")
    }

    res.status(200)
        .json(
            new ApiResponse(200,
                playlist,
                "Video deleted to the playlist successfully"
            )
        )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid Playlist id")
    }

    const playlist = await Playlist.findByIdAndDelete(playlistId)

    if(!playlist){
        throw new ApiError(500,"Error while deleting the playlist")
    }

    res.status(200)
        .json(
            new ApiResponse(200,
                playlist,
                "Playlist Deleted Successfully"
            )
        )

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid Playlist Id")
    }

    if(!(name && description) ){
        throw new ApiError(400,"name and description are required to updating playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            name:name,
            description:description
        },
        {
            new:true
        }
    )

    if(!updatedPlaylist){
        throw new ApiError(500,"Error while Updating the playlist")
    }

    res.status(200)
        .json(
            new ApiResponse(200,
                updatedPlaylist,
                "Playlist Updated successfully"
            )
        )

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
