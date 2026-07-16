import reviewModel from "../models/reviewModel.js";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

// Add a review for a product
// Endpoint: POST /api/review/add
// Middleware: authUser
const addProductReview = async (req, res) => {
    try {
        const { userId, productId, rating, comment } = req.body;

        // Validation
        if (!productId) {
            return res.json({ success: false, message: "Product ID is required" });
        }
        if (!rating || rating < 1 || rating > 5) {
            return res.json({ success: false, message: "Rating must be between 1 and 5" });
        }
        if (!comment || comment.trim() === '') {
            return res.json({ success: false, message: "Comment cannot be empty" });
        }

        // Verify purchase history and delivery
        const hasPurchased = await orderModel.findOne({
            userId,
            "items._id": productId,
            status: "Delivered",
            $or: [
                { payment: true },
                { paymentMethod: "COD" }
            ]
        });

        if (!hasPurchased) {
            return res.json({ success: false, message: "Only verified buyers who have received their delivery can leave a review." });
        }

        // Check if user has already reviewed this product
        const existingReview = await reviewModel.findOne({ userId, productId });
        if (existingReview) {
            return res.json({ success: false, message: "You have already reviewed this product." });
        }

        // Fetch user's name
        const user = await userModel.findById(userId);
        const userName = user ? user.name : "Anonymous";

        // Save review
        const newReview = new reviewModel({
            productId,
            userId,
            userName,
            rating: Number(rating),
            comment: comment.trim(),
            date: Date.now()
        });

        await newReview.save();
        res.json({ success: true, message: "Review added successfully", review: newReview });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Get all reviews for a product
// Endpoint: GET /api/review/product/:productId
const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!productId) {
            return res.json({ success: false, message: "Product ID is required" });
        }

        const reviews = await reviewModel.find({ productId }).sort({ date: -1 });

        // Calculate average rating
        let averageRating = 0;
        if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            averageRating = (totalRating / reviews.length).toFixed(1);
        }

        res.json({ success: true, reviews, averageRating: Number(averageRating) });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Check if user is eligible to leave a review
// Endpoint: GET /api/review/eligible/:productId
// Middleware: authUser
const checkReviewEligibility = async (req, res) => {
    try {
        const { userId } = req.body;
        const { productId } = req.params;

        if (!productId) {
            return res.json({ success: false, message: "Product ID is required" });
        }

        // Verify purchase history and delivery
        const hasPurchased = await orderModel.findOne({
            userId,
            "items._id": productId,
            status: "Delivered",
            $or: [
                { payment: true },
                { paymentMethod: "COD" }
            ]
        });

        if (!hasPurchased) {
            return res.json({ success: true, eligible: false, message: "Only verified buyers who have received their delivery can leave a review." });
        }

        // Check if already reviewed
        const existingReview = await reviewModel.findOne({ userId, productId });
        if (existingReview) {
            return res.json({ success: true, eligible: false, message: "You have already reviewed this product." });
        }

        res.json({ success: true, eligible: true });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export { addProductReview, getProductReviews, checkReviewEligibility };
