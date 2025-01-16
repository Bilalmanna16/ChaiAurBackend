import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const videoId = req.params.videoId;
  const { page = 1, limit = 10 } = req.query;
  

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Incoming data is not an valid ObjectId");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const comments = await Comment.aggregate([
    {
      $match: {
        video: videoId,
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullname: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      $addFields: {
        username: {
          $arrayElemAt: ["$owner.username", 0],
        },
      },
    },
  ]);

  if (!comments) {
    throw new ApiError(500, "No comments found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched SuccessFully"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const commentText = req.body;

  const videoId = mongoose.Types.ObjectId(req.params.videoId);
  const userId = mongoose.Types.ObjectId(req.params.userId);

  if (!commentText || !videoId || !userId) {
    throw new ApiError(400, "Missing required info");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const comment = await Comment.insertOne({
    content: commentText,
    video: videoId,
    owner: userId,
  });

  const addedComment = await Comment.find({
    $and: [{ video: videoId }, { owner: userId }],
  });

  if (!addedComment) {
    throw new ApiError(500, "Something went wrong while adding comment.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, addedComment, "New Comment added SuccessFully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const videoId = mongoose.Types.ObjectId(req.params.videoId);
  const userId = mongoose.Types.ObjectId(req.params.userId);
  const commentId = mongoose.Types.ObjectId(req.params.commentId);
  const { updatedContent } = req.body;

  if (!videoId || !commentId || !userId) {
    throw new ApiError(400, "All details are required");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const comment = await Video.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "comment not found");
  }

  if (req.user?._id !== userId) {
    throw new ApiError(400, "User is not Authorized to update.");
  }

  const commentUpdated = await Comment.findByIdAndUpdate(commentId, {
    $set: {
      content: updatedContent,
    },
  });

  if (!commentUpdated) {
    throw new ApiError(500, "Something went wrong while updating the comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, commentUpdated, "Comment updated successFully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const videoId = mongoose.Types.ObjectId(req.params.videoId);
  const userId = mongoose.Types.ObjectId(req.params.userId);
  const commentId = mongoose.Types.ObjectId(req.params.commentId);

  if (!videoId || !commentId || !userId) {
    throw new ApiError(400, "All details are required");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (req.user?._id !== userId) {
    throw new ApiError(400, "User is not Authorized to delete the comment.");
  }

  const comment = Comment.findByIdAndDelete(commentId);

  if (!comment) {
    throw new ApiError(500, "Something went wrong while deleting the comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
