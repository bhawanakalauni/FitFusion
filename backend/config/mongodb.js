import mongoose from "mongoose";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";

const seedAdmin = async () => {
    try {
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;

        if (!email || !password) {
            console.log("Admin credentials not specified in environment variables.");
            return;
        }

        // Check if admin already exists in user collection
        const adminExists = await userModel.findOne({ email });
        if (adminExists) {
            console.log("Admin user already exists. Skipping creation.");
            return;
        }

        // Create new admin user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const adminUser = new userModel({
            name: "Admin",
            email: email,
            password: hashedPassword
        });

        await adminUser.save();
        console.log("Admin credentials created successfully in database.");
    } catch (error) {
        console.error("Error creating admin user:", error.message);
    }
};

const connectDB = async () => {

    mongoose.connection.on('connected',() => {
        console.log("DB Connected");
    })

    mongoose.connection.on('error', (err) => {
        console.error("Mongoose connection error: ", err);
    });

    const uri = process.env.MONGODB_URI;
    try {
        try {
            const parsedUrl = new URL(uri);
            if (!parsedUrl.pathname || parsedUrl.pathname === '/') {
                await mongoose.connect(uri, { dbName: 'e-commerce' });
            } else {
                await mongoose.connect(uri);
            }
        } catch (error) {
            await mongoose.connect(`${uri}/e-commerce`);
        }

        // Seed admin credentials after connection is established
        await seedAdmin();
    } catch (err) {
        console.error("Failed to connect to MongoDB: ", err);
        process.exit(1);
    }

}

export default connectDB;