import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

// Configuration
cloudinary.config({ 
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath)=> {
    try {
        if(!localFilePath) return null;
        //upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
        resource_type:'auto'
       })
       //file as been uploaded
        //console.log("file is uploaded on cloudinary URL:",response.url);
        fs.unlinkSync(localFilePath);
       return response;
    
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally save temp file as the uploade falied
        return null;
    }
}

const deleteFromCloudinary = async (publicId )=>{
    try {
        if (!publicId) return false;
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error("Error deleting from Cloudinary:", error);
    }
}

export {uploadOnCloudinary,
    deleteFromCloudinary
}