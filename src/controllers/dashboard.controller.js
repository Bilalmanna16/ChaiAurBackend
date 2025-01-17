import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.params.userId
    if(!userId){
        throw new ApiError(400,"User Id is required")
    }

    if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new ApiError(400,"User Id is Invalid")
    }

    const video_count = await Video.find({owner: userId})

    const videos = Video.aggregate([
        {
            $match:{
                owner: userId
            }
        },
        {
            $group:{
                _id: null,
                totalViews: {$sum: "$views"},
                totalLikes: {$sum: "$likes"}
            }
        }
        
    ])

    const totalViews = videos[0]?.totalViews || 0;
    const totalLikes = videos[0]?.totalLikes || 0;
    const totalVideos =  video_count.length
    let totalSubs = 0

    const subs = Subscription.find({channel: userId})
    if(!subs){
        totalSubs = 0
    }else{
        totalSubs = (await subs).length
    }



    if(!videos || videos.length === 0){
        throw new ApiError(400,"User has not uploaded any videos")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                totalVideos: totalVideos,
                totalLikes: totalLikes,
                totalViews: totalViews,
                totalSubs: totalSubs
            },
            "required data fetched successFully"
        )
    )

    
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.params.userId
    if(!userId){
        throw new ApiError(400,"User Id is required")
    }

    if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new ApiError(400,"User Id is Invalid")
    }

    const videos = await Video.find({owner: userId})
    if(!videos || videos.length === 0){
        throw new ApiError(400,"User has not uploaded any videos")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            videos,
            "required data fetched successFully"
        )
    )
})

export {
    getChannelStats, 
    getChannelVideos
    }