import express from 'express';
import { addProductReview, getProductReviews, checkReviewEligibility } from '../controllers/reviewController.js';
import authUser from '../middleware/auth.js';

const reviewRouter = express.Router();

reviewRouter.post('/add', authUser, addProductReview);
reviewRouter.get('/product/:productId', getProductReviews);
reviewRouter.get('/eligible/:productId', authUser, checkReviewEligibility);

export default reviewRouter;
