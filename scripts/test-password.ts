import 'dotenv/config';
import { hashPassword, comparePassword } from '../src/server/utils/password';
import { validatePassword } from '../src/server/utils/password-policy';
import { CreateUserSchema } from '../src/server/types/user.schema';

async function runTests() {
  console.log('🧪 Running Password Security & Validation Tests...\n');

  // 1. Weak password test
  console.log('Test 1: Weak password validation');
  const weakResult = validatePassword('weak123');
  console.log('Weak password result:', weakResult);
  if (!weakResult.success && weakResult.errors.length > 0) {
    console.log('✅ Weak password correctly rejected.\n');
  } else {
    console.error('❌ Weak password test failed.\n');
  }

  // 2. Strong password test
  console.log('Test 2: Strong password validation');
  const strongPassword = 'StrongP@ssw0rd!';
  const strongResult = validatePassword(strongPassword);
  console.log('Strong password result:', strongResult);
  if (strongResult.success) {
    console.log('✅ Strong password correctly validated.\n');
  } else {
    console.error('❌ Strong password test failed.\n');
  }

  // 3. Hash generation & comparison
  console.log('Test 3: Hash generation & Password comparison');
  const hash = await hashPassword(strongPassword);
  console.log('Generated hash:', hash.substring(0, 20) + '...');

  const isMatch = await comparePassword(strongPassword, hash);
  console.log('Correct password match:', isMatch);

  const isWrongMatch = await comparePassword('WrongPassword1!', hash);
  console.log('Wrong password match (should be false):', isWrongMatch);

  if (isMatch && !isWrongMatch) {
    console.log('✅ Hash generation and comparison working correctly.\n');
  } else {
    console.error('❌ Hash comparison test failed.\n');
  }

  // 4. Zod Schema Validation test
  console.log('Test 4: Zod CreateUserSchema validation');
  const parseResult = CreateUserSchema.safeParse({
    name: 'Youssef',
    email: 'youssef@example.com',
    password: strongPassword,
    roleId: 'test-role-id',
  });

  if (parseResult.success) {
    console.log('✅ Zod CreateUserSchema passed with strong password.\n');
  } else {
    console.error('❌ Zod CreateUserSchema failed:', parseResult.error.format());
  }

  const failParseResult = CreateUserSchema.safeParse({
    name: 'Youssef',
    email: 'youssef@example.com',
    password: 'weak',
    roleId: 'test-role-id',
  });

  if (!failParseResult.success) {
    console.log('✅ Zod CreateUserSchema correctly rejected weak password.\n');
  } else {
    console.error('❌ Zod CreateUserSchema failed to reject weak password.\n');
  }

  console.log('🎉 All password security tests completed!');
}

runTests().catch(console.error);
