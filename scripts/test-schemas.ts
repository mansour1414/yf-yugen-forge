import assert from 'node:assert/strict';
import { BulkUpdateSettingsSchema } from '../src/server/types/setting.schema';
import { CreateProjectSchema, UpdateProjectSchema } from '../src/server/types/project.schema';
import { CreateServiceSchema, UpdateServiceSchema } from '../src/server/types/service.schema';
import { UpdateTestimonialSchema } from '../src/server/types/testimonial.schema';
import { UpdatePricingPlanSchema } from '../src/server/types/pricing.schema';
import { UpdateContractSchema } from '../src/server/types/contract.schema';
import { UpdateMediaSchema } from '../src/server/types/media.schema';
import { UpdateUserSchema } from '../src/server/types/user.schema';

// Pure schema tests: no database, no network, no env vars needed.
let passed = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    passed += 1;
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}`);
    throw error;
  }
}

console.log('🧪 Running schema regression tests...\n');

// --- Bulk settings ---------------------------------------------------------
check('bulk settings: wrapped { settings: [...] } is unwrapped into an array', () => {
  const result = BulkUpdateSettingsSchema.parse({
    settings: [{ key: 'contact_email', value: 'hello@example.com', group: 'CONTACT', isPublic: true }],
  });
  assert.ok(Array.isArray(result), 'expected an array, not a { settings } object');
  assert.deepEqual(result, [{ key: 'contact_email', value: 'hello@example.com', group: 'CONTACT', isPublic: true }]);
});

check('bulk settings: plain { key: value } map is still accepted', () => {
  assert.deepEqual(BulkUpdateSettingsSchema.parse({ contact_email: 'x' }), { contact_email: 'x' });
});

check('bulk settings: malformed wrapped payload is rejected instead of saved as a "settings" key', () => {
  assert.equal(BulkUpdateSettingsSchema.safeParse({ settings: [{ key: '', value: 1 }] }).success, false);
  assert.equal(BulkUpdateSettingsSchema.safeParse({ settings: 'nope' }).success, false);
});

// --- Update schemas must not inject create-time defaults --------------------
const updateCases: Array<[string, { parse: (input: unknown) => Record<string, unknown> }, Record<string, unknown>]> = [
  ['UpdateProjectSchema', UpdateProjectSchema, { title: 'New title' }],
  ['UpdateServiceSchema', UpdateServiceSchema, { title: 'New title' }],
  ['UpdateTestimonialSchema', UpdateTestimonialSchema, { name: 'New name' }],
  ['UpdatePricingPlanSchema', UpdatePricingPlanSchema, { tierEn: 'New tier' }],
  ['UpdateContractSchema', UpdateContractSchema, { title: 'New title' }],
  ['UpdateMediaSchema', UpdateMediaSchema, { name: 'New name' }],
  ['UpdateUserSchema', UpdateUserSchema, { name: 'New name' }],
];

for (const [name, schema, input] of updateCases) {
  check(`${name}: a partial update keeps omitted fields omitted`, () => {
    assert.deepEqual(schema.parse(input), input);
  });
}

check('UpdateUserSchema: renaming a user cannot re-enable a disabled account', () => {
  const parsed = UpdateUserSchema.parse({ name: 'Someone' });
  assert.equal('status' in parsed, false);
  assert.equal(UpdateUserSchema.parse({ status: 'DISABLED' }).status, 'DISABLED');
});

check('update schemas still accept explicit values for the formerly-defaulted fields', () => {
  assert.equal(UpdateProjectSchema.parse({ status: 'ACTIVE', featured: true, displayOrder: 3 }).status, 'ACTIVE');
  assert.equal(UpdateServiceSchema.parse({ active: false }).active, false);
  assert.equal(UpdateTestimonialSchema.parse({ rating: '4' }).rating, 4);
  assert.deepEqual(UpdatePricingPlanSchema.parse({ featuresEn: ['A'] }).featuresEn, ['A']);
  assert.equal(UpdateContractSchema.parse({ currency: 'SAR' }).currency, 'SAR');
  assert.equal(UpdateMediaSchema.parse({ isPublic: false }).isPublic, false);
});

check('"at least one field must be updated" is enforced again', () => {
  assert.equal(UpdateServiceSchema.safeParse({}).success, false);
  assert.equal(UpdateTestimonialSchema.safeParse({}).success, false);
  assert.equal(UpdatePricingPlanSchema.safeParse({}).success, false);
  assert.equal(UpdateUserSchema.safeParse({}).success, false);
});

// --- Create schemas keep their defaults --------------------------------------
check('create schemas still apply their defaults', () => {
  const service = CreateServiceSchema.parse({ title: 'Web', description: 'Websites', icon: 'code', color: '#7C3AED' });
  assert.equal(service.featured, false);
  assert.equal(service.active, true);

  const project = CreateProjectSchema.parse({
    title: 'Project',
    slug: 'project',
    shortDescription: 'Short one',
    description: 'A long enough description',
    category: 'Web',
    type: 'WEB',
    coverImage: 'https://example.com/cover.jpg',
    thumbnail: 'https://example.com/thumb.jpg',
  });
  assert.equal(project.status, 'DRAFT');
  assert.equal(project.featured, false);
  assert.equal(project.displayOrder, 0);
});

console.log(`\n🎉 All ${passed} schema checks passed.`);
