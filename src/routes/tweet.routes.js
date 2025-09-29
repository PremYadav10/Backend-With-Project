import { Router } from 'express';
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
    getAllTweets
} from "../controllers/tweet.controller.js"
import {varifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

//public
router.route("/").get(getAllTweets);

router.use(varifyJWT); // Apply verifyJWT middleware to all routes below in this file

router.route("/").post(createTweet).get(getAllTweets);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router
