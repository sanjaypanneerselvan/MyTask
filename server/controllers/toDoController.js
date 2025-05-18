const mongoose = require('mongoose');
const moment = require('moment');
const ToDo = require('../models/toDoList');

exports.createToDo = async (req, res) => {
    try {
        const data = req.body;
        const todo = new ToDo(data);
        const result = await todo.save();

        console.log("Saved Task:", result);

        // ✅ Send back the saved task with ID
        res.status(201).send({ message: "Created New Task!", task: result });
    } catch (err) {
        console.error("Create ToDo Error:", err);
        res.status(500).send({ message: "Failed to create task", error: err.message });
    }
};

exports.getAllToDo = async (req, res) => {
    let { userId } = req.params;
    console.log(userId);

    try {
        const result = await ToDo.find({ createdBy: userId }).sort({ updatedAt: -1 });
        console.log("all task");
        console.log(result);
        res.send(result);
    } catch (err) {
        console.log(err);
        res.status(400).send(err);
    }
}

exports.deleteToDo = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await ToDo.findByIdAndDelete(id);
        console.log(result);
        res.send({ message: "Task Deleted" });
    } catch (err) {
        console.log(err);
        res.status(400).send(err);
    }
}

/*exports.updateToDo = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Fetch the existing task to check its current status
        const existingTask = await ToDo.findById(id);

        if (!existingTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        // Handle completedOn logic properly
        if (data.isCompleted && !existingTask.isCompleted) {
            data.completedOn = new Date(); // Set completedOn when task is newly completed
        } else if (!data.isCompleted && existingTask.isCompleted) {
            data.completedOn = null; // Remove completedOn if task is marked incomplete
        } else {
            delete data.completedOn; // Prevent unnecessary field updates
        }

        const result = await ToDo.findByIdAndUpdate(id, { $set: data }, { new: true })

        console.log("Updated Task:", result);
        res.json({ message: "Task Updated Successfully", updatedTask: result });

    } catch (error) {
        console.error("Update Error:", error);
        res.status(400).json({ error: error.message });
    }
};*/

exports.updateToDo = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Fetch the existing task
        const existingTask = await ToDo.findById(id);
        if (!existingTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        // Optionally validate user ownership
        // const userId = req.user?.id || req.body.userId;
        // if (existingTask.createdBy.toString() !== userId) {
        //     return res.status(403).json({ message: "Unauthorized to update this task" });
        // }

        // Handle completedOn and notified logic
        if (data.isCompleted && !existingTask.isCompleted) {
            data.completedOn = new Date();
        } else if (!data.isCompleted && existingTask.isCompleted) {
            data.completedOn = null;
            data.notified = false; // Allow future notifications again
        } else {
            delete data.completedOn;
        }

        const result = await ToDo.findByIdAndUpdate(id, { $set: data }, { new: true });

        console.log("Updated Task:", result);
        res.json({ message: "Task Updated Successfully", updatedTask: result });

    } catch (error) {
        console.error("Update Error:", error);
        res.status(400).json({ error: error.message });
    }
};


exports.dashBoardToDo = async (req, res) => {
    try {
        const userId = req.user.userId; // Get the user ID from the JWT token
        console.log("Received userId:", userId);

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        // Total Tasks for the specific user
        const totalTasks = await ToDo.countDocuments({ createdBy: userId });
        // console.log("Total Tasks:", totalTasks);

        // Completed Tasks for the specific user
        const completedTasks = await ToDo.countDocuments({ createdBy: userId, isCompleted: true });
        // console.log("Completed Tasks:", completedTasks);

        // Pending Tasks for the specific user
        const pendingTasks = await ToDo.countDocuments({ createdBy: userId, isCompleted: false });
        // console.log("Pending Tasks:", pendingTasks);

        // Get start and end of today
        const startOfDay = moment().startOf("day").toDate();
        const endOfDay = moment().endOf("day").toDate();
        //  console.log("Start of Today:", startOfDay);
        //  console.log("End of Today:", endOfDay);

        // Tasks Completed Today for the specific user
        const tasksCompletedToday = await ToDo.countDocuments({
            createdBy: userId,
            isCompleted: true,
            completedOn: { $gte: startOfDay, $lte: endOfDay } // Check for tasks completed within today
        });
        // console.log("Tasks Completed Today:", tasksCompletedToday);

        // Return dashboard stats
        res.json({
            totalTasks,
            completedTasks,
            pendingTasks,
            tasksCompletedToday,
        });

    } catch (error) {
        console.error("Error in dashBoardToDo:", error);
        res.status(500).json({ error: "Server Error" });
    }
};



