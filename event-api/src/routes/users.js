const express = require("express");
const { createUser, getUsers } = require("../controller/userController");

const router = express.Router();

router.post("/", createUser);

router.get("/", getUsers);

module.exports = router;
