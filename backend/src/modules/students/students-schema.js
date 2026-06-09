const { z } = require("zod");

// Roll may arrive as a number or a numeric string (the UI sends a string);
// the DB casts it to INTEGER, so reject anything non-numeric early.
const roll = z.union([
    z.number().int("Roll must be a whole number"),
    z.string().regex(/^\d+$/, "Roll must be a number")
]);

const studentBody = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    gender: z.string().min(1, "Gender is required"),
    phone: z.string().min(1, "Phone is required"),
    dob: z.union([z.string(), z.date()]).optional(),
    class: z.string().min(1, "Class is required"),
    section: z.string().optional(),
    roll: roll,
    admissionDate: z.union([z.string(), z.date()]).optional(),
    currentAddress: z.string().optional(),
    permanentAddress: z.string().optional(),
    fatherName: z.string().optional(),
    fatherPhone: z.string().optional(),
    motherName: z.string().optional(),
    motherPhone: z.string().optional(),
    guardianName: z.string().optional(),
    guardianPhone: z.string().optional(),
    relationOfGuardian: z.string().optional(),
    systemAccess: z.boolean().optional()
});

const idParam = z.object({
    id: z.coerce.number({ invalid_type_error: "Invalid student id" }).int().positive("Invalid student id")
});

const AddStudentSchema = z.object({
    body: studentBody
});

const UpdateStudentSchema = z.object({
    body: studentBody,
    params: idParam
});

const StudentStatusSchema = z.object({
    body: z.object({
        status: z.boolean({
            required_error: "Status is required",
            invalid_type_error: "Status must be a boolean"
        })
    }),
    params: idParam
});

module.exports = {
    AddStudentSchema,
    UpdateStudentSchema,
    StudentStatusSchema
};
