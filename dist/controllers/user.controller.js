"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeUser = exports.updateExistingUser = exports.createNewUser = exports.getUser = exports.getUsers = void 0;
const user_service_1 = require("../services/user.service");
const getUsers = async (req, res) => {
    try {
        const users = await (0, user_service_1.getAllUsers)();
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getUsers = getUsers;
const getUser = async (req, res) => {
    try {
        const user = await (0, user_service_1.getUserById)(String(req.params.id));
        res.json(user);
    }
    catch (error) {
        res.status(404).json({ message: error.message });
    }
};
exports.getUser = getUser;
const createNewUser = async (req, res) => {
    try {
        const { email, password, firstName, lastName, role } = req.body;
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ message: "Required fields missing" });
        }
        const user = await (0, user_service_1.createUser)({ email, password, firstName, lastName, role });
        res.status(201).json(user);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.createNewUser = createNewUser;
const updateExistingUser = async (req, res) => {
    try {
        const user = await (0, user_service_1.updateUser)(String(req.params.id), req.body);
        res.json(user);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updateExistingUser = updateExistingUser;
const removeUser = async (req, res) => {
    try {
        const result = await (0, user_service_1.deleteUser)(String(req.params.id));
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.removeUser = removeUser;
