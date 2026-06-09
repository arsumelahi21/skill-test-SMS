const express = require("express");
const router = express.Router();
const studentController = require("./students-controller");
const { checkApiAccess } = require("../../middlewares");
const { validateRequest } = require("../../utils");
const { AddStudentSchema, UpdateStudentSchema, StudentStatusSchema } = require("./students-schema");

router.get("", checkApiAccess, studentController.handleGetAllStudents);
router.post("", checkApiAccess, validateRequest(AddStudentSchema), studentController.handleAddStudent);
router.get("/:id", checkApiAccess, studentController.handleGetStudentDetail);
router.post("/:id/status", checkApiAccess, validateRequest(StudentStatusSchema), studentController.handleStudentStatus);
router.put("/:id", checkApiAccess, validateRequest(UpdateStudentSchema), studentController.handleUpdateStudent);

module.exports = { studentsRoutes: router };
