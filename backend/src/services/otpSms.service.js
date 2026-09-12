import { CONFIG } from '../config/index.js';
import { AppError, ERROR_CODE } from '../utils/appError.js';

function buildSmsText(otp) {
  const template = CONFIG.OTP.SMS_TEXT_TEMPLATE || 'Your G3Q login OTP is {otp}.';
  return String(template).replaceAll('{otp}', String(otp));
}

/**
 * Send OTP SMS via Cogent / gujgov.edu.in API when SETTINGS.otp.sendSms is true.
 * No-op when sendSms is false.
 */
export async function sendOtpSms({ mobile, otp }) {
  if (!CONFIG.OTP.SEND_SMS) {
    return { sent: false, skipped: true };
  }

  const token = CONFIG.OTP.SMS_BEARER_TOKEN;
  if (!token) {
    throw new AppError(
      ERROR_CODE.UNKNOWN,
      'OTP SMS is enabled but OTP_SMS_BEARER_TOKEN is not configured.'
    );
  }

  const url = CONFIG.OTP.SMS_API_URL;
  const body = {
    mobileno: String(mobile),
    text: buildSmsText(otp),
  };

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error('[OTP SMS] network error:', error?.message || error);
    throw new AppError(ERROR_CODE.UNKNOWN, 'OTP SMS could not be sent. Please try again.');
  }

  const raw = await response.text().catch(() => '');
  if (!response.ok) {
    console.error(`[OTP SMS] ${response.status} ${raw.slice(0, 300)}`);
    throw new AppError(ERROR_CODE.UNKNOWN, 'OTP SMS could not be sent. Please try again.');
  }

  console.log(`[OTP SMS] sent to ${String(mobile).replace(/\d(?=\d{4})/g, '•')}`);
  return { sent: true, skipped: false };
}
