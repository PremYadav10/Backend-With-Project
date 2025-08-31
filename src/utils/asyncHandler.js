
const asyncHandler = (requestHandler)=>{
    (res,req,next) => {
        Promise.
        resolve(requestHandler(req,res,next))
        .catch((err)=>next(err))
    }
}



//or
// const asyncHandler = (fn) => async (req,res,next) => {
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         res.status(err.code || 5000).json({
//             succes:false,
//             message:error.message
//         })
//     }
// }

export {asyncHandler};