import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, User } from '../config/db';
import { signupSchema, loginSchema } from '../validations/auth';
import { AuthenticatedRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'nurselink-super-secret-key-change-in-prod';
const NODE_ENV = process.env.NODE_ENV || 'development';

const issueToken = (res: Response, user: User) => {
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const isProd = NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = signupSchema.parse(req.body);

    const existingUser = db.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Account with this email already exists.',
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(validatedData.password, salt);

    const newUser: User = {
      id: `u_${Date.now()}`,
      email: validatedData.email,
      passwordHash,
      fullName: validatedData.fullName,
      role: validatedData.role,
      phone: validatedData.phone,
      hospitalName: validatedData.hospitalName,
      createdAt: new Date().toISOString(),
    };

    db.addUser(newUser);
    issueToken(res, newUser);

    res.status(201).json({
      success: true,
      message: 'Signup successful!',
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        phone: newUser.phone,
        hospitalName: newUser.hospitalName,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const user = db.getUserByEmail(validatedData.email);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = bcrypt.compareSync(validatedData.password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    issueToken(res, user);

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        hospitalName: user.hospitalName,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated.',
      });
    }

    const user = db.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User session not found.',
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        hospitalName: user.hospitalName,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const logout = (req: Request, res: Response) => {
  const isProd = NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  });
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

export const firebaseLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, fullName, uid, role, phone, hospitalName } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone number is required.',
      });
    }

    // Try finding the user by email first, then phone
    let user = email ? db.getUserByEmail(email) : undefined;

    if (!user && phone) {
      user = db.getUsers().find(u => u.phone === phone);
    }

    if (!user) {
      // Automatic sign up for third party if not exists in our registry
      const newUser: User = {
        id: `u_fb_${uid || Date.now()}`,
        email: email || `${phone}@nurselink.phone`,
        passwordHash: 'firebase_authenticated_no_password',
        fullName: fullName || (email ? email.split('@')[0] : 'Clinician Staff'),
        role: role || 'Doctor',
        phone: phone || undefined,
        hospitalName: hospitalName || undefined,
        createdAt: new Date().toISOString(),
      };

      db.addUser(newUser);
      user = newUser;
    }

    issueToken(res, user);

    res.status(200).json({
      success: true,
      message: 'Authentication successful via Firebase!',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        hospitalName: user.hospitalName,
        profileCompleted: user.profileCompleted,
        doctorProfile: user.doctorProfile
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateDoctorProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated.',
      });
    }

    const { doctorProfile } = req.body;

    const updatedUser = db.updateUser(req.user.id, {
      profileCompleted: true,
      doctorProfile: doctorProfile
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Onboarding setup completed successfully!',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        phone: updatedUser.phone,
        hospitalName: updatedUser.hospitalName,
        profileCompleted: updatedUser.profileCompleted,
        doctorProfile: updatedUser.doctorProfile
      }
    });
  } catch (err) {
    next(err);
  }
};

export const updateHospitalProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated.',
      });
    }

    const { hospitalProfile } = req.body;

    const updatedUser = db.updateUser(req.user.id, {
      profileCompleted: true,
      hospitalProfile: hospitalProfile
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hospital onboarding setup completed successfully!',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        phone: updatedUser.phone,
        hospitalName: updatedUser.hospitalName,
        profileCompleted: updatedUser.profileCompleted,
        hospitalProfile: updatedUser.hospitalProfile
      }
    });
  } catch (err) {
    next(err);
  }
};
