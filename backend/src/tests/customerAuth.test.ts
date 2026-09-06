import { describe, it, expect } from 'vitest';
import * as bcrypt from 'bcryptjs';
import {
  CustomerRegisterSchema,
  CustomerLoginSchema,
  CustomerVerifyOtpSchema,
  CustomerResetPasswordSchema
} from '../schemas/zodSchemas';

describe('Customer Authentication Unit & Validation Tests', () => {
  it('should validate valid customer registration payload', () => {
    const validData = {
      firstName: 'David',
      lastName: 'Adekunle',
      email: 'david@argyrworldwide.com',
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
      phone: '+2348012345678',
      marketingOptIn: true
    };

    const parsed = CustomerRegisterSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
  });

  it('should reject registration if password and confirmPassword mismatch', () => {
    const invalidData = {
      firstName: 'David',
      lastName: 'Adekunle',
      email: 'david@argyrworldwide.com',
      password: 'SecurePassword123!',
      confirmPassword: 'DifferentPassword456!',
      phone: '+2348012345678'
    };

    const parsed = CustomerRegisterSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.errors[0].message).toBe("Passwords do not match");
    }
  });

  it('should reject registration if password is under 8 characters', () => {
    const shortPasswordData = {
      firstName: 'David',
      lastName: 'Adekunle',
      email: 'david@argyrworldwide.com',
      password: 'short',
      confirmPassword: 'short'
    };

    const parsed = CustomerRegisterSchema.safeParse(shortPasswordData);
    expect(parsed.success).toBe(false);
  });

  it('should validate 6-digit OTP verification code correctly', () => {
    const validOtp = {
      email: 'david@argyrworldwide.com',
      otp: '654321'
    };

    const parsed = CustomerVerifyOtpSchema.safeParse(validOtp);
    expect(parsed.success).toBe(true);

    const invalidOtp = {
      email: 'david@argyrworldwide.com',
      otp: '123' // too short
    };

    const parsedInvalid = CustomerVerifyOtpSchema.safeParse(invalidOtp);
    expect(parsedInvalid.success).toBe(false);
  });

  it('should securely hash and verify passwords using bcrypt', async () => {
    const plainText = 'MyArgyrLuxuryPass2026';
    const hash = await bcrypt.hash(plainText, 10);

    expect(hash).not.toBe(plainText);
    const isMatch = await bcrypt.compare(plainText, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await bcrypt.compare('WrongPassword', hash);
    expect(isWrongMatch).toBe(false);
  });

  it('should properly validate password reset schema', () => {
    const validReset = {
      email: 'customer@argyr.com',
      token: 'crypto-secure-token-1234567890',
      password: 'NewStrongPassword123',
      confirmPassword: 'NewStrongPassword123'
    };

    expect(CustomerResetPasswordSchema.safeParse(validReset).success).toBe(true);
  });
});
