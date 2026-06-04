import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters long'),
  fullName: z.string().min(2, 'Name must be at least 2 characters long'),
  role: z.enum(['Admin', 'Doctor', 'Nurse', 'Pharmacist', 'Lab Technician']),
  phone: z.string().optional(),
  hospitalName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
