
import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


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

    if (!isValidObjectId(userId)) {
        throw new ApiError(400,"Ivalide user id")
    }

    //TODO: get user playlists
    const playlists = await Playlist.find(
        {owner:userId}
    )

    if(!playlists.length){
        return new ApiResponse(204,{},"No playlists exist")
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

// const getPlaylistById = asyncHandler(async (req, res) => {
//     const { playlistId } = req.params;

//     if (!isValidObjectId(playlistId)) {
//         throw new ApiError(400, "Invalid Playlist Id");
//     }

//     const playlist = await Playlist.aggregate([
//         {
//             $match: { _id: new mongoose.Types.ObjectId(playlistId) }
//         },
//         {
//             $lookup: {
//                 from: "videos", // video collection
//                 localField: "videos",
//                 foreignField: "_id",
//                 as: "videoDetails"
//             }
//         },
//         {
//             $unwind: {
//                 path: "$videoDetails",
//                 preserveNullAndEmptyArrays: true
//             }
//         },
//         {
//             $lookup: {
//                 from: "users", // user collection
//                 localField: "videoDetails.owner",
//                 foreignField: "_id",
//                 as: "videoOwner"
//             }
//         },
//         {
//             $unwind: {
//                 path: "$videoOwner",
//                 preserveNullAndEmptyArrays: true
//             }
//         },
//         {
//             $project: {
//                 _id: 1,
//                 name: 1,
//                 description: 1,
//                 createdAt: 1,
//                 updatedAt: 1,
//                 "videoDetails._id": 1,
//                 "videoDetails.title": 1,
//                 "videoDetails.description": 1,
//                 "videoDetails.thumbnail": 1,
//                 "videoDetails.duration": 1,
//                 "videoDetails.views": 1,
//                 "videoDetails.createdAt": 1,
//                 owner: {
//                     _id: "$videoOwner._id",
//                     username: "$videoOwner.username",
//                     avatar: "$videoOwner.avatar"
//                 }
//             }
//         },
//         {
//             $group: {
//                 _id: "$_id",
//                 name: { $first: "$name" },
//                 description: { $first: "$description" },
//                 createdAt: { $first: "$createdAt" },
//                 updatedAt: { $first: "$updatedAt" },
//                 videos: {
//                     $push: {
//                         _id: "$videoDetails._id",
//                         title: "$videoDetails.title",
//                         description: "$videoDetails.description",
//                         thumbnail: "$videoDetails.thumbnail",
//                         duration: "$videoDetails.duration",
//                         views: "$videoDetails.views",
//                         createdAt: "$videoDetails.createdAt",
//                         owner: "$owner"
//                     }
//                 }
//             }
//         }
//     ]);

//     if (!playlist || playlist.length === 0) {
//         throw new ApiError(404, "No Playlist found or error fetching playlist");
//     }

//     res.status(200).json(
//         new ApiResponse(200, playlist[0], "Playlist fetched successfully")
//     );
// });


const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist Id");
    }

    const playlistResult = await Playlist.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(playlistId) }
        },
        // --- 1. Get Video Details ---
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        // --- 2. Unwind Videos (Crucial: Keep the playlist document even if videos array is empty) ---
        {
            $unwind: {
                path: "$videoDetails",
                preserveNullAndEmptyArrays: true // This is required to keep the playlist metadata
            }
        },
        // --- 3. Lookup Video Owner ---
        {
            $lookup: {
                from: "users",
                localField: "videoDetails.owner",
                foreignField: "_id",
                as: "videoOwner"
            }
        },
        {
            $unwind: {
                path: "$videoOwner",
                preserveNullAndEmptyArrays: true
            }
        },
        // --- 4. Project Final Fields & Create a single Video Object ---
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                // Create a clean video object, but ONLY if videoDetails exists.
                // This prevents partial/empty documents from causing issues in $group.
                video: {
                    $cond: {
                        // Check if the videoDetails field is null (which happens when the videos array was empty)
                        if: { $ne: ["$videoDetails", null] }, 
                        then: {
                            _id: "$videoDetails._id",
                            title: "$videoDetails.title",
                            description: "$videoDetails.description",
                            thumbnail: "$videoDetails.thumbnail",
                            duration: "$videoDetails.duration",
                            views: "$videoDetails.views",
                            createdAt: "$videoDetails.createdAt",
                            owner: {
                                _id: "$videoOwner._id",
                                username: "$videoOwner.username",
                                avatar: "$videoOwner.avatar"
                            }
                        },
                        else: "$$REMOVE" // Remove the entire 'video' field if videoDetails is null
                    }
                }
            }
        },
        // --- 5. Group back and Push Valid Videos ---
        {
            $group: {
                _id: "$_id",
                name: { $first: "$name" },
                description: { $first: "$description" },
                createdAt: { $first: "$createdAt" },
                updatedAt: { $first: "$updatedAt" },
                // Push only the VALID 'video' objects created in the $project stage.
                // When 'video' is removed by the $cond, it won't be pushed.
                videos: { $push: "$video" }
            }
        },
        // --- 6. Final cleanup of the 'videos' array ---
        {
             $project: {
                _id: 1,
                name: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                // Use $filter to remove any residual null/empty objects if they exist
                videos: {
                    $filter: {
                        input: "$videos",
                        as: "video",
                        cond: { $ne: ["$$video", {}] } // Check that the video object is not empty
                    }
                }
            }
        }
    ]);

    const playlist = playlistResult[0]; // Get the single playlist object

    if (!playlist) { // Check if no playlist was found by ID
        throw new ApiError(404, "No Playlist found");
    }

    // Ensure the videos array is not empty if the original playlist was empty (should be handled by aggregation now)
    if (!playlist.videos || playlist.videos.length === 0) {
        playlist.videos = [];
    }

    res.status(200).json(
        new ApiResponse(200, playlist, "Playlist fetched successfully")
    );
});


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


const getWatchLaterPlaylistId = asyncHandler(async (req, res) => {
    const userId = req.user._id; 

    if (!userId) { // 👈 ADD THIS CHECK
        throw new ApiError(401, "User not authenticated for this playlist fetch.");
    }

    const watchLaterPlaylist = await Playlist.findOne({
        owner: userId,
        name: "Watch Later" // The unique name we set during registration
    }).select("_id"); // Only select the ID

    if (!watchLaterPlaylist) {
        // This shouldn't happen after registration, but it's a safety check
        return res.status(404).json(new ApiResponse(404, null, "Watch Later playlist not found"));
    }

    // Return just the ID
    return res.status(200).json(
        new ApiResponse(200, watchLaterPlaylist._id, "Watch Later ID fetched successfully")
    );
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
    getWatchLaterPlaylistId
}
