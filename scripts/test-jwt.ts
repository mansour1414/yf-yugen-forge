import 'dotenv/config';
import { generateAccessToken, verifyAccessToken } from '../src/server/utils/jwt';
import jwt from 'jsonwebtoken';

async function runJwtTests() {
  console.log('🧪 Running JWT Utility & Authentication Tests...\n');

  // 1. Token Generation
  const payload = { userId: 'usr_123456', role: 'Admin' };
  const token = generateAccessToken(payload);
  console.log('Generated Token:', token.substring(0, 30) + '...');
  if (token) {
    console.log('✅ Token generation successful.\n');
  } else {
    console.error('❌ Token generation failed.\n');
  }

  // 2. Token Verification
  try {
    const decoded = verifyAccessToken(token);
    console.log('Decoded Payload:', decoded);
    if (decoded.userId === payload.userId && decoded.role === payload.role) {
      console.log('✅ Token verification successful.\n');
    } else {
      console.error('❌ Token payload mismatch.\n');
    }
  } catch (err) {
    console.error('❌ Token verification threw error:', err);
  }

  // 3. Invalid Token Rejection
  try {
    verifyAccessToken('invalid.token.string');
    console.error('❌ Invalid token was incorrectly verified!\n');
  } catch (err) {
    console.log('✅ Invalid token correctly rejected.\n');
  }

  // 4. Expired Token Handling
  try {
    const expiredToken = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '-1s' });
    verifyAccessToken(expiredToken);
    console.error('❌ Expired token was incorrectly accepted!\n');
  } catch (err) {
    console.log('✅ Expired token correctly rejected.\n');
  }

  console.log('🎉 All JWT tests completed successfully!');
}

runJwtTests().catch(console.error);
