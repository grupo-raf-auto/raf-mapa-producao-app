import { NextResponse } from 'next/server';

/**
 * Returns the allowed email domain for registration, if restricted.
 * When empty, any email domain is allowed (e.g. for development).
 */
export async function GET() {
  const domain = process.env.ALLOWED_EMAIL_DOMAIN || null;
  return NextResponse.json({ allowedEmailDomain: domain });
}
