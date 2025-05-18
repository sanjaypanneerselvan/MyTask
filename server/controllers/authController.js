const User = require("../models/User");
const ToDo = require('../models/toDoList');
const Notification = require("../models/Notification");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
require("dotenv").config();

const secretKey = process.env.JWT_SECRET || "test-secret-key";

async function registerUser(req, res) {

    let { firstName, lastName, userName, password } = req.body;

    try {
        const duplicate = await User.find({ userName });
        if (duplicate && duplicate.length > 0) {
            return res.status(400).send({ message: 'User already Registered with this UserNmae' });
        }
        let user = new User({ firstName, lastName, userName, password });
        const result = await user.save();
        console.log(result);
        res.status(201).send({ message: 'User Registered Successfully' });
    }
    catch (err) {
        console.log(err);
        res.status(400).send(err);
    }
}

async function loginUser(req, res) {

    try {
        const { userName, password } = req.body;
        const user = await User.findOne({ userName });

        if (!user) {
            return res.status(404).send({ message: "User Not Found" });
        }

        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(400).send({ message: "Wrong password" });
        }

        let token = jwt.sign({ userId: user?._id }, secretKey, { expiresIn: '1h' });

        let finalData = {
            userId: user?._id,
            userName: user?.userName,
            firstName: user?.firstName,
            lastName: user?.lastName,
            token
        }
        res.send(finalData);
    }
    catch (err) {
        console.log(err);
        res.status(400).send(err);
    }
}


async function deleteAccount(req, res) {
    try {
        const userId = req.user.userId;
        console.log("User ID for delete:", userId);

        if (!userId) {
            return res.status(400).json({ message: "Invalid token or user ID missing" });
        }

        const userObjectId = new ObjectId(userId);

        // 1. Find all tasks for this user
        const userTasks = await ToDo.find({ userId: userObjectId }, '_id');
        const taskIds = userTasks.map(task => task._id);

        // 2. Delete all tasks
        const deletedTasks = await ToDo.deleteMany({ userId: userObjectId });
        console.log("Tasks deleted:", deletedTasks.deletedCount);

        // 3. Delete all related notifications
        const deletedNotifications = await Notification.deleteMany({
            $or: [
                { userId: userObjectId },
                { taskId: { $in: taskIds } }
            ]
        });
        console.log("Notifications deleted:", deletedNotifications.deletedCount);

        // 4. Delete user account
        const user = await User.findByIdAndDelete(userObjectId);
        console.log("User deleted:", user);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "Account deleted successfully" });

    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ message: "Server Error" });
    }
}



const AuthController = {
    registerUser,
    loginUser,
    deleteAccount
}

module.exports = AuthController;