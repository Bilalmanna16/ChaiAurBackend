import { Router } from "express";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controller.js";
import {upload} from "../middlewares/multer.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/get-all-videos").get(getAllVideos);
router.route("/publish-video/u/:userId").post(
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishAVideo
);
router.route("/get-video/v/:videoId").get(getVideoById);
router.route("/update-video/v/:videoId").patch(upload.single("thumbnail"),updateVideo);
router.route("/delete-video/v/:videoId/u/:userId").delete(deleteVideo);
router.route("/toggle/v/:videoId").patch(togglePublishStatus);

export default router;
