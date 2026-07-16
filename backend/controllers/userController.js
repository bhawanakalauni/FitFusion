import validator from "validator";
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'
import userModel from "../models/userModel.js";


const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET)
}

// Route for user login
const loginUser = async (req, res) => {
    try {

        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase();

        const user = await userModel.findOne({ email: normalizedEmail });

        if (!user) {
            return res.json({ success: false, message: "User doesn't exists" })
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {

            const token = createToken(user._id)
            res.json({ success: true, token })

        }
        else {
            res.json({ success: false, message: 'Invalid credentials' })
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Route for user register
const registerUser = async (req, res) => {
    try {

        const { name, email, password } = req.body;
        const normalizedEmail = email.toLowerCase();

        // checking user already exists or not
        const exists = await userModel.findOne({ email: normalizedEmail });
        if (exists) {
            return res.json({ success: false, message: "User already exists" })
        }

        // validating email format & strong password
        if (!validator.isEmail(normalizedEmail)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new userModel({
            name,
            email: normalizedEmail,
            password: hashedPassword
        })

        const user = await newUser.save()

        const token = createToken(user._id)

        res.json({ success: true, token })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Route for admin login
const adminLogin = async (req, res) => {
    try {
        
        const {email,password} = req.body
        const normalizedEmail = email.toLowerCase();

        if (normalizedEmail === process.env.ADMIN_EMAIL.toLowerCase() && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign({ email: normalizedEmail, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
            res.json({success:true,token})
        } else {
            res.json({success:false,message:"Invalid credentials"})
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Get user profile details
const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await userModel.findById(userId).select("-password -cartData");
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }
        res.json({ success: true, user });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Update user profile details
const updateUserProfile = async (req, res) => {
    try {
        const { userId, name, email, password } = req.body;
        
        // Validation
        if (!name || name.trim() === '') {
            return res.json({ success: false, message: "Name is required" });
        }
        if (!email || !validator.isEmail(email)) {
            return res.json({ success: false, message: "A valid email is required" });
        }

        const normalizedEmail = email.toLowerCase();

        // Check if email is already taken by another user
        const emailExists = await userModel.findOne({ email: normalizedEmail, _id: { $ne: userId } });
        if (emailExists) {
            return res.json({ success: false, message: "Email is already in use by another account" });
        }

        const updateData = { name, email: normalizedEmail };

        // If user wants to change password
        if (password && password.trim() !== '') {
            if (password.length < 8) {
                return res.json({ success: false, message: "Password must be at least 8 characters" });
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            updateData.password = hashedPassword;
        }

        const updatedUser = await userModel.findByIdAndUpdate(userId, updateData, { new: true }).select("-password -cartData");
        res.json({ success: true, message: "Profile updated successfully", user: updatedUser });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}


export { loginUser, registerUser, adminLogin, getUserProfile, updateUserProfile }