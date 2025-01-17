import { Router } from "express";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
import { getChannelStats, getChannelVideos } from "../controllers/dashboard.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/channel-stats/u/:userId").get(getChannelStats)
router.route("/channel-videos/u/:userId").get(getChannelVideos)

export default router;