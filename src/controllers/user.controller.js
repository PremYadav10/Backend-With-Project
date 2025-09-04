import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import cookieParser from 'cookie-parser';


const generateAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeCheck:false })

        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"somthing went wrong while genrating refresh and access token")
    }
}



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
    
    const avatarLocalPath = await req.files?.avatar[0]?.path;   //console log karke dekho for learning
    //console.log("avatarLocalPath",req.files);
    
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    
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

const loginUser = asyncHandler(async (req,res)=>{

    //req body  - data
    const {username,password,email} = req.body()

    //username or email check
    if(!username || !email){
        throw new ApiError(400,"username or email required")
    }

    //find the user
    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"user dosn't exist")
    }

    //password check
   const isPasswordValid = await user.isPasswordCorrect(password);

   if(!isPasswordValid){
    throw new ApiError(401,"password is incorrect") 
   }

    //access and refresh token genrate 
    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    //send token || cookie
    const options = {
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,
            {
            user:loggedInUser ,accessToken , refreshToken
            },
            "User LoggedIn Succesfully"
    )
    )

})

const logoutUser = asyncHandler(async(req,res)=>{
    
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },{
            new:true
        }
    )

    const options = {
        httpOnly:true,
        secure:true
    }

    return res
    .status(200) 
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Logged Out"))
})

export {
    registerUser,
    loginUser,
    logoutUser
}

