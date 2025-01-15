import { Router } from "express";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
import { addComment, deleteComment, getVideoComments, updateComment } from "../controllers/comment.controller.js";

const router = Router()
router.use(verifyJWT)


router.route("/:videoId").get(getVideoComments)
router.route("/v/:videoId/u/:userId").post(addComment)
router.route("/v/:videoId/u/:userId/c/:commentId").patch(updateComment).delete(deleteComment)


export default router