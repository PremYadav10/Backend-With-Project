import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import { json } from 'express';

const registerUser = asyncHandler(async (req,res)=>{
    //get user datails from frontend (now by postmen)
    //validation - non empty
    //check if user already exist : username or email
    //check for images - check for avatar
    //images upload to cloudnary - check for avatar
    //create user object - create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //retuen res


    const {username,email,fullname,password}=req.body
    // console.log("email :",email);

    if(
        [username,email,fullname,password].some((field)=>
        field?.trim() === "")
    ){
        throw new ApiError(400,"All Field Are Required")
    }

    const existedUser = await User.findOne({
        $or: [{username},{email}]
    })

    if(existedUser){
        throw new ApiError(409,"User with email and username already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;   //console log karke dekho for learning
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar file is required");
    }

    const user = await User.create({
        fullname,
        username:username.toLowerCase(),
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        password,
        email
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"somthing went wrong while register the user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"user registerd succesfully")
    )
})

export {registerUser}