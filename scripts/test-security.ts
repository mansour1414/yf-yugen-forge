import assert from 'node:assert/strict';
import { escapeHtml } from '../src/server/utils/html.util';
import { isSafeHttpUrl, isSafeLink } from '../src/server/utils/safe-url.util';
import { localizeHero, localizeProject, localizeService, localizeTestimonial } from '../src/server/utils/i18n.util';
import { UpdateHeroSchema } from '../src/server/types/hero.schema';
import { CreateMessageSchema } from '../src/server/types/message.schema';
import { validatePassword } from '../src/server/utils/password-policy';

// Pure tests: no database, no network, no env vars needed.
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

console.log('🔒 Running security regression tests...\n');

// --- HTML escaping (email templates) -----------------------------------------
check('escapeHtml neutralises markup, quotes and ampersands', () => {
  assert.equal(escapeHtml('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
  assert.equal(escapeHtml('<a href="https://evil.example">x</a>'), '&lt;a href=&quot;https://evil.example&quot;&gt;x&lt;/a&gt;');
  assert.equal(escapeHtml(`it's & that`), 'it&#39;s &amp; that');
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(undefined), '');
});

// --- URL / link safety --------------------------------------------------------
check('isSafeHttpUrl accepts only absolute http(s) URLs', () => {
  assert.equal(isSafeHttpUrl('https://x.com/a'), true);
  assert.equal(isSafeHttpUrl('http://x.com'), true);
  for (const bad of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,<b>', 'vbscript:x', 'file:///etc/passwd', '//evil.com', '/relative', 'not a url', '']) {
    assert.equal(isSafeHttpUrl(bad), false, `should reject ${JSON.stringify(bad)}`);
  }
});

check('isSafeLink allows anchors, paths, http(s), mailto and tel — and rejects javascript:', () => {
  for (const good of ['#contact', '/privacy-policy', 'https://wa.me/966500000000', 'mailto:hi@x.com', 'tel:+966500000000']) {
    assert.equal(isSafeLink(good), true, `should accept ${good}`);
  }
  for (const bad of ['javascript:alert(1)', ' javascript:alert(1)', 'data:text/html,x', '//evil.com/x', 'contact', '']) {
    assert.equal(isSafeLink(bad), false, `should reject ${JSON.stringify(bad)}`);
  }
});

check('hero buttonLink is validated on update', () => {
  assert.equal(UpdateHeroSchema.safeParse({ buttonLink: '#contact' }).success, true);
  assert.equal(UpdateHeroSchema.safeParse({ buttonLink: 'https://example.com' }).success, true);
  assert.equal(UpdateHeroSchema.safeParse({ buttonLink: 'javascript:alert(document.cookie)' }).success, false);
});

// --- Public API allow-lists ---------------------------------------------------
check('public project payload does not expose internal columns', () => {
  const row = {
    id: 'p1', slug: 's', title: 'T', titleAr: 'عنوان', titleEn: 'Title', shortDescription: 'sd', description: 'd', category: 'c', type: 'WEB',
    coverImage: 'https://x/c.jpg', thumbnail: 'https://x/t.jpg', liveUrl: 'https://live.example', featured: true, displayOrder: 1,
    repositoryUrl: 'https://git.example/private', githubUrl: 'https://github.com/private/repo', figmaUrl: 'https://figma.com/private',
    clientId: 'client-1', createdBy: 'user-1', seoTitle: 'x', deletedAt: null, status: 'ACTIVE', createdAt: new Date(),
    media: [{ id: 'm1', name: null, type: 'IMAGE', url: 'https://x/m.jpg', alt: null, displayOrder: 0, projectId: 'p1', createdAt: new Date() }],
  };
  const out = localizeProject(row, 'en')!;
  for (const secret of ['repositoryUrl', 'githubUrl', 'figmaUrl', 'clientId', 'createdBy', 'deletedAt', 'status', 'createdAt', 'seoTitle', 'titleAr']) {
    assert.equal(secret in out, false, `${secret} must not be public`);
  }
  assert.equal(out.title, 'Title');
  assert.equal(out.liveUrl, 'https://live.example');
  assert.deepEqual(Object.keys(out.media[0]).sort(), ['alt', 'displayOrder', 'id', 'name', 'type', 'url']);
});

check('public hero / service / testimonial payloads are allow-listed too', () => {
  const hero = localizeHero({ id: 'h', title: 'a', titleAr: 'ع', titleEn: 'e', subtitle: 's', buttonText: 'b', buttonLink: '#contact', videoUrl: null, background: null, active: true, createdAt: new Date(), updatedAt: new Date() }, 'ar')!;
  assert.deepEqual(Object.keys(hero).sort(), ['active', 'background', 'buttonLink', 'buttonText', 'id', 'subtitle', 'title', 'videoUrl']);
  assert.equal(hero.title, 'ع');

  const service = localizeService({ id: 's', title: 't', description: 'd', icon: 'code', color: '#fff', featured: false, displayOrder: 1, active: true, deletedAt: null, createdAt: new Date() }, 'en')!;
  assert.equal('deletedAt' in service, false);
  assert.equal('active' in service, false);

  const testimonial = localizeTestimonial({ id: 't', name: 'n', company: 'c', position: 'p', avatar: null, rating: 5, content: 'x', featured: true, displayOrder: 1, createdAt: new Date() }, 'en')!;
  assert.deepEqual(Object.keys(testimonial).sort(), ['avatar', 'company', 'content', 'id', 'name', 'position', 'rating']);
});

// --- Public contact form limits -----------------------------------------------
check('contact form fields have upper bounds', () => {
  const ok = { name: 'Ali', email: 'ali@example.com', message: 'Hello there' };
  assert.equal(CreateMessageSchema.safeParse(ok).success, true);
  assert.equal(CreateMessageSchema.safeParse({ ...ok, message: 'x'.repeat(5001) }).success, false);
  assert.equal(CreateMessageSchema.safeParse({ ...ok, name: 'x'.repeat(121) }).success, false);
  assert.equal(CreateMessageSchema.safeParse({ ...ok, subject: 'x'.repeat(201) }).success, false);
  assert.equal(CreateMessageSchema.safeParse({ ...ok, message: 'x'.repeat(5000) }).success, true);
});

// --- Password policy -----------------------------------------------------------
check('password policy: bcrypt 72-byte limit is enforced (in bytes, not characters)', () => {
  assert.equal(validatePassword('Str0ng!Passw0rd').success, true);
  assert.equal(validatePassword('Aa1!' + 'x'.repeat(68)).success, true);   // exactly 72 bytes
  assert.equal(validatePassword('Aa1!' + 'x'.repeat(69)).success, false);  // 73 bytes
  assert.equal(validatePassword('Aa1!' + 'ع'.repeat(35)).success, false);  // 35 Arabic letters = 70 bytes + 4 = 74
  assert.equal(validatePassword('weak').success, false);
});

console.log(`\n🎉 All ${passed} security checks passed.`);
