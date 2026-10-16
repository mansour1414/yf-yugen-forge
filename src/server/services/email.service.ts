import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../core/config/env.config';
import { logger } from '../core/logger/pino.logger';
import { escapeHtml } from '../utils/html.util';

let cachedTransporter: Transporter | null | undefined;

function isSmtpConfigured(): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

function getTransporter(): Transporter | null {
  if (cachedTransporter !== undefined) return cachedTransporter;

  if (!isSmtpConfigured()) {
    cachedTransporter = null;
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT || 587,
    secure: Boolean(env.SMTP_SECURE),
    auth: { user: env.SMTP_USER!, pass: env.SMTP_PASS! },
    // sendEmail() is awaited inside request handlers (contact form, client/user creation). With
    // nodemailer's defaults (up to ~2 minutes) a blocked or unreachable SMTP port — e.g. a host that
    // blocks outbound SMTP — would hang the whole API request. Fail fast instead; sendEmail() logs
    // the failure and never throws.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  return cachedTransporter;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Shared low-level sender used by every email template in this file. Never
 * throws — a missing SMTP config or a delivery failure is logged and
 * swallowed, since callers have already completed their primary action
 * (saving a message, creating an account, etc.) regardless of whether the
 * email goes out.
 */
async function sendEmail({ to, subject, html, replyTo }: SendEmailOptions): Promise<void> {
  const transporter = getTransporter();

  if (!transporter) {
    logger.warn(`Email not sent to ${to}: SMTP is not configured (SMTP_HOST/SMTP_USER/SMTP_PASS missing).`);
    return;
  }

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER,
      to,
      ...(replyTo && { replyTo }),
      subject,
      html,
    });
  } catch (error) {
    logger.error({ err: error, to }, 'Failed to send email');
  }
}

function wrapEmailLayout(bodyHtml: string, isAr: boolean): string {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;direction:${isAr ? 'rtl' : 'ltr'};text-align:${isAr ? 'right' : 'left'};">
      ${bodyHtml}
      <p style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;color:#999;font-size:12px;">YF Digital Studio</p>
    </div>
  `;
}

export interface ContactEmailPayload {
  toEmail: string;
  name: string;
  email: string;
  subject?: string | null;
  budget?: string | null;
  message: string;
  lang: 'ar' | 'en';
}

/** Sends a copy of a contact-form submission to the studio's inbox. */
export async function sendContactEmailCopy(payload: ContactEmailPayload): Promise<void> {
  const isAr = payload.lang === 'ar';
  const subjectLine = isAr
    ? `طلب تواصل جديد من ${payload.name}`
    : `New contact request from ${payload.name}`;

  const rows: Array<[string, string]> = [
    [isAr ? 'الاسم' : 'Name', payload.name],
    [isAr ? 'البريد الإلكتروني' : 'Email', payload.email],
    [isAr ? 'نوع المشروع' : 'Project Type', payload.subject || (isAr ? 'غير محدد' : 'Not specified')],
    [isAr ? 'الميزانية' : 'Budget', payload.budget || (isAr ? 'غير محدد' : 'Not specified')],
  ];

  // Every value below originates from the public contact form, so it is HTML-escaped: otherwise a
  // visitor could inject markup/links into an email that lands in the studio's inbox.
  const htmlRows = rows.map(([label, value]) => `<tr><td style="padding:6px 12px;color:#666;">${escapeHtml(label)}</td><td style="padding:6px 12px;">${escapeHtml(value)}</td></tr>`).join('');
  const html = wrapEmailLayout(`
    <h2 style="color:#7C3AED;">${escapeHtml(subjectLine)}</h2>
    <table style="border-collapse:collapse;width:100%;">${htmlRows}</table>
    <p style="margin-top:20px;color:#666;">${isAr ? 'التفاصيل' : 'Details'}:</p>
    <p style="white-space:pre-wrap;line-height:1.7;">${escapeHtml(payload.message)}</p>
  `, isAr);

  await sendEmail({ to: payload.toEmail, subject: subjectLine, html, replyTo: payload.email });
}

export interface AccountEmailPayload {
  toEmail: string;
  name: string;
  tempPassword: string;
  lang: 'ar' | 'en';
}

/**
 * Sent when the admin creates a new CLIENT account. Confirms the request was
 * approved and provides the initial (must-change) password.
 */
export async function sendClientApprovalEmail(payload: AccountEmailPayload): Promise<void> {
  const isAr = payload.lang === 'ar';
  const loginUrl = `${env.CLIENT_URL}/admin/login`;
  const subjectLine = isAr ? 'تم تفعيل حسابك في YF Digital Studio' : 'Your YF Digital Studio account is ready';

  const html = wrapEmailLayout(`
    <h2 style="color:#7C3AED;">${isAr ? `مرحباً ${escapeHtml(payload.name)}،` : `Hello ${escapeHtml(payload.name)},`}</h2>
    <p style="line-height:1.8;">
      ${isAr
        ? 'يسرّنا إبلاغك بأنه تمت الموافقة على طلبك وتفعيل حسابك في بوابة عملاء YF Digital Studio. يمكنك الآن الدخول ومتابعة مشروعك وعقودك من مكان واحد.'
        : 'We are pleased to let you know that your request has been approved and your account on the YF Digital Studio client portal is now active. You can sign in to follow your project and contracts in one place.'}
    </p>
    <table style="border-collapse:collapse;margin:20px 0;">
      <tr><td style="padding:6px 12px;color:#666;">${isAr ? 'البريد الإلكتروني' : 'Email'}</td><td style="padding:6px 12px;font-weight:600;">${escapeHtml(payload.toEmail)}</td></tr>
      <tr><td style="padding:6px 12px;color:#666;">${isAr ? 'كلمة المرور المؤقتة' : 'Temporary Password'}</td><td style="padding:6px 12px;font-weight:600;font-family:monospace;">${escapeHtml(payload.tempPassword)}</td></tr>
    </table>
    <p style="line-height:1.8;color:#c0392b;">
      ${isAr
        ? 'لأسباب أمنية، سيُطلب منك تغيير كلمة المرور هذه فور تسجيل الدخول لأول مرة.'
        : 'For security reasons, you will be required to change this password immediately after your first sign-in.'}
    </p>
    <p style="margin-top:24px;">
      <a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:#7C3AED;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">${isAr ? 'تسجيل الدخول' : 'Sign In Now'}</a>
    </p>
  `, isAr);

  await sendEmail({ to: payload.toEmail, subject: subjectLine, html });
}

/**
 * Sent when the admin creates a new EMPLOYEE/staff account (any non-Client
 * role). Invites them to the admin CMS with their initial (must-change)
 * password.
 */
export async function sendEmployeeInvitationEmail(payload: AccountEmailPayload): Promise<void> {
  const isAr = payload.lang === 'ar';
  const loginUrl = `${env.CLIENT_URL}/admin/login`;
  const subjectLine = isAr ? 'دعوة للانضمام إلى فريق YF Digital Studio' : 'You\'ve been invited to YF Digital Studio';

  const html = wrapEmailLayout(`
    <h2 style="color:#7C3AED;">${isAr ? `مرحباً ${escapeHtml(payload.name)}،` : `Hello ${escapeHtml(payload.name)},`}</h2>
    <p style="line-height:1.8;">
      ${isAr
        ? 'تم إنشاء حساب لك للانضمام إلى فريق YF Digital Studio على منصة الإدارة. تجد بيانات الدخول أدناه.'
        : 'An account has been created for you to join the YF Digital Studio team on our admin platform. Your sign-in details are below.'}
    </p>
    <table style="border-collapse:collapse;margin:20px 0;">
      <tr><td style="padding:6px 12px;color:#666;">${isAr ? 'البريد الإلكتروني' : 'Email'}</td><td style="padding:6px 12px;font-weight:600;">${escapeHtml(payload.toEmail)}</td></tr>
      <tr><td style="padding:6px 12px;color:#666;">${isAr ? 'كلمة المرور المؤقتة' : 'Temporary Password'}</td><td style="padding:6px 12px;font-weight:600;font-family:monospace;">${escapeHtml(payload.tempPassword)}</td></tr>
    </table>
    <p style="line-height:1.8;color:#c0392b;">
      ${isAr
        ? 'لأسباب أمنية، سيُطلب منك تغيير كلمة المرور هذه فور تسجيل الدخول لأول مرة.'
        : 'For security reasons, you will be required to change this password immediately after your first sign-in.'}
    </p>
    <p style="margin-top:24px;">
      <a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:#7C3AED;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">${isAr ? 'تسجيل الدخول' : 'Sign In Now'}</a>
    </p>
  `, isAr);

  await sendEmail({ to: payload.toEmail, subject: subjectLine, html });
}
