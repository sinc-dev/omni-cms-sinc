import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import type { CloudflareBindings } from '../../types';
import { getDb, type DbClient } from '../../db/client';
import { users } from '../../db/schema';
import { Errors, successResponse } from '../../lib/api/hono-response';
import {
  generateOTP,
  hashOTP,
  storeOTP,
  verifyOTP,
  checkRateLimit,
  deleteOTP,
} from '../../lib/auth/otp-store';
import { sendOTPEmail } from '../../lib/email/otp-email';
import { createSession } from '../../lib/auth/session';
import { nanoid } from 'nanoid';

const app = new Hono<{ Bindings: CloudflareBindings }>();

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * POST /api/public/auth/otp/request
 * Request an OTP code to be sent to an email
 */
app.post('/request', async (c) => {
  try {
    const db: DbClient = getDb(c.env.DB);
    const body = await c.req.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return c.json(Errors.badRequest('Email is required'), 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!isValidEmail(normalizedEmail)) {
      return c.json(Errors.badRequest('Invalid email format'), 400);
    }

    // Check rate limit (max 3 requests per email per 15 minutes)
    const withinRateLimit = await checkRateLimit(db, normalizedEmail, 3, 15 * 60 * 1000);
    if (!withinRateLimit) {
      return c.json(
        Errors.badRequest('Too many requests. Please try again in 15 minutes.'),
        429
      );
    }

    // Generate OTP code
    const code = generateOTP();
    const hashedCode = await hashOTP(code);

    // Store OTP (expires in 10 minutes)
    await storeOTP(db, normalizedEmail, hashedCode, 10 * 60 * 1000);

    // Send email
    try {
      // Extract email configuration from environment
      // Use bracket notation to access optional properties that may not be recognized by TypeScript
      const env = c.env as unknown as Record<string, unknown>;
      const emailEnv = {
        RESEND_API_KEY: (env['RESEND_API_KEY'] as string | undefined),
        EMAIL_FROM: (env['EMAIL_FROM'] as string | undefined),
        EMAIL_FROM_NAME: (env['EMAIL_FROM_NAME'] as string | undefined),
      };
      await sendOTPEmail(normalizedEmail, code, emailEnv);
    } catch (error) {
      // If email sending fails, delete the OTP and return error
      await deleteOTP(db, normalizedEmail);
      console.error('Failed to send OTP email:', error);
      return c.json(
        Errors.serverError('Failed to send email. Please try again later.'),
        500
      );
    }

    // Return success (don't expose the code)
    return c.json(
      successResponse({
        message: 'OTP code sent to your email',
      }),
      200
    );
  } catch (error) {
    console.error('Error in OTP request:', error);
    return c.json(Errors.serverError('An error occurred'), 500);
  }
});

/**
 * POST /api/public/auth/otp/verify
 * Verify OTP code and authenticate user
 */
app.post('/verify', async (c) => {
  try {
    const db: DbClient = getDb(c.env.DB);
    const body = await c.req.json();
    const { email, code } = body;

    // Validate inputs
    if (!email || typeof email !== 'string') {
      return c.json(Errors.badRequest('Email is required'), 400);
    }

    if (!code || typeof code !== 'string') {
      return c.json(Errors.badRequest('OTP code is required'), 400);
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return c.json(Errors.badRequest('Invalid OTP code format'), 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!isValidEmail(normalizedEmail)) {
      return c.json(Errors.badRequest('Invalid email format'), 400);
    }

    // Verify OTP code
    const isValid = await verifyOTP(db, normalizedEmail, code, 3);

    if (!isValid) {
      return c.json(
        Errors.badRequest('Invalid or expired OTP code'),
        400
      );
    }

    // Get or create user (auto-provisioning)
    let user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (!user) {
      // Auto-provision user on first login
      const newUser = await db
        .insert(users)
        .values({
          id: nanoid(),
          email: normalizedEmail,
          name: normalizedEmail.split('@')[0],
          isSuperAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      user = newUser[0];
    }

    // Create session
    const session = await createSession(db, user);

    // Return session token and user info
    return c.json(
      successResponse({
        token: session.token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isSuperAdmin: user.isSuperAdmin,
        },
      }),
      200
    );
  } catch (error) {
    console.error('Error in OTP verify:', error);
    return c.json(Errors.serverError('An error occurred'), 500);
  }
});

export default app;

