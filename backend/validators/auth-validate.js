const { z } = require('zod');

const loginSchema = z.object({
    email: z.string({ required_error: "Email is required" })
        .trim()
        .email({ message: "Invalid email address" }),

    password: z.string({ required_error: "Password is required" })
        .trim()
        .min(6, { message: "Password must be at least 6 characters" })
        .max(255, { message: "Password must be at most 255 characters" })
});

const registerSchema = loginSchema.extend({
    name: z.string({ required_error: "Username is required" })
        .trim()
        .min(3, { message: "Username must be at least 3 characters" })
        .max(30, { message: "Username must be at most 30 characters" }),

    phone: z.string({ required_error: "Phone number is required" })
        .trim()
        .length(10, { message: "Phone number must be exactly 10 digits" })
        .regex(/^[6-9]\d{9}$/, { message: "Invalid phone number" }),

    role: z.enum(["admin", "security", "resident"], { required_error: "Role is required" }),

    flat_no: z.string()
        .trim()
        .optional()
}).superRefine((data, ctx) => {
    if (data.role === "resident" && !data.flat_no) {
        ctx.addIssue({
            code: "custom",
            message: "Flat number is required for residents",
        });
    }
});

module.exports = { registerSchema, loginSchema };