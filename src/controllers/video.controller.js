import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCoudinary} from "../utils/cloudinary.js";


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    if(!Video.schema.path(sortType)){
        throw new ApiError(400,"The sorting criteria is invalid")
    }

    if(sortBy!== "1" && sortBy !== "-1"){
        throw new ApiError(400,"The sorting order is invalid")
    }

    const skip = (page-1)*limit
    const decodedQuery = decodeURIComponent(query)

    // const videos = await Video.find({title: decodedQuery})
    // .sort({ [sortBy]: sortType })
    // .skip(skip)
    // .limit(limit)

    const videos = await Video.aggregate([
        {
            $match:{
                title: decodedQuery
            }
        },
        {
            $sort: {
                [sortType]: Number(sortBy)
            }
        },
        {
            $skip : skip
        },
        {
            $limit: limit
        }
    ])


    if(!videos){
        throw new ApiError(500,"No videos found for the given search term")
    }

    if(videos.length === 0){
        throw new ApiError(500,"No videos found for the given search term")
    }

    const numberOfVideos = Video.countDocuments()

    return res
    .status(200)
    .json( new ApiResponse(
        200,
        videos,
        "Videos fetched successFully"
    )    
)


})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    const userId = req.params.userId
    // TODO: get video, upload to cloudinary, create video
    if(!title || !description){
        throw new ApiError(400,"The title or description is missing")
    }

    if(!userId){
        throw new ApiError(400,"The userId is required")
    }
    if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new ApiError(400,"The userId is invalid")
    }

    const videoLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
    if(!videoLocalPath){
        throw new ApiError(400,"The Video file is required")
    }
    if(!thumbnailLocalPath){
        throw new ApiError(400,"The Video Thumbnail is required")
    }


    if(req.files?.videoFile[0]?.mimetype !== "video/mp4"){
        throw new ApiError(400,"Invalid File Type")
    }

    const videoFile = await uploadOnCoudinary(videoLocalPath)
    const thumbnailFile = await uploadOnCoudinary(thumbnailLocalPath)
    if(!videoFile){
        throw new ApiError(400,"Something went wrong while uploading to cloudinary")
    }


    const video = await Video.create(
        {
            videoFile: videoFile.url,
            thumbnail: thumbnailFile.url,
            owner: userId,
            title: title,
            description: description,
            duration: videoFile.duration,
            views: 0,
            isPublished: true
        }
    )

    if(!video){
        throw new ApiError(500,"Something went wrong while uploading the video")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "Video uploaded successFully"
        )
    )


})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if(!videoId){
        throw new ApiError(400,"Video ID is required")
    }

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Video ID is invalid")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"Video not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "Video is fetched Successfully"
        )
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Video ID is invalid")
    }

    const {title,description} = req.body
    const thumbnailLocalPath = req.file?.path
    if(!title || !description || !thumbnailLocalPath){
        throw new ApiError(400,"title, description ior thumbnail is missing")
    }
    if(title === "" || description === ""){
        throw new ApiError(400,"Title and description cannot be empty")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"Video not found")
    }

    const thumbnail = await uploadOnCoudinary(thumbnailLocalPath)
    if(!thumbnail.url){
        throw new ApiError(500,"Something went wrong while uploading thumbnail file on Cloudinary")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                title: title,
                description: description,
                thumbnail: thumbnail.url
            }
        },
        {
            new: true
        }
    )  

    return res
    .status(200)
    .json(
        new ApiResponse(200,video,"Video updated successfully")
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId,userId } = req.params
    //TODO: delete video
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Video ID is invalid")
    }
    if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new ApiError(400,"user ID is invalid")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"Video not found")
    }
    if(video.owner.toString() !== userId.toString()){
        throw new ApiError(400,"Unauthorized Request")
    }

    try {
        const video = await Video.findByIdAndDelete(videoId)
    } catch (error) {
        throw new ApiError(500,"Something went wrong while deleting the video")
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Video deleted SuccessFully"
        )
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Video ID is invalid")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"Video not found")
    }

    const isPublished = video.isPublished

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                isPublished: !isPublished
            }
        },
        {
            new: true
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "Published Status is toggeled SuccessFully"
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