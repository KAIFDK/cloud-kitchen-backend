import { Request, Response } from "express";
import {
  signUp,
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
} from "../services/auth.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { prisma } from "../lib/prisma";

export async function signUpController(
  req: Request,
  res: Response
) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const user = await signUp({
      name,
      email,
      password,
    });

    return res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    console.error(error);

    if (error instanceof Error && error.message === "Email already registered") {
      return res.status(409).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
}

export async function loginController(
  req: Request,
  res: Response
) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const result = await login(email, password);

    // Store refresh token in an HttpOnly cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    console.error(error);

    if (
      error instanceof Error &&
      error.message === "Invalid email or password"
    ) {
      return res.status(401).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
}

export async function refreshTokenController(
  req: Request,
  res: Response
) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token is required",
      });
    }

    const accessToken = await refreshAccessToken(refreshToken);

    return res.status(200).json({
      accessToken,
    });
  } catch (error) {
    console.error(error);

    if (
      error instanceof Error &&
      (
        error.message === "Invalid refresh token" ||
        error.message === "Refresh token not found" ||
        error.message === "Refresh token expired"
      )
    ) {
      return res.status(401).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
}

export async function logoutController(
  req: Request,
  res: Response
) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await logout(refreshToken);
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
}

export async function forgotPasswordController(
  req: Request,
  res: Response
) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    await forgotPassword(email);

    // Same response whether the email exists or not
    return res.status(200).json({
      message:
        "If an account exists with this email, a password reset link has been generated.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
}

export async function resetPasswordController(
  req: Request,
  res: Response
) {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        message: "Reset token and new password are required",
      });
    }

    await resetPassword(resetToken, newPassword);

    return res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error(error);

    if (
      error instanceof Error &&
      error.message === "Invalid or expired reset token"
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
}



export async function getMeController(
  req: AuthRequest,
  res: Response
) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
}