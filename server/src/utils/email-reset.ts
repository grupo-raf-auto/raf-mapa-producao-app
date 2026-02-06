/**
 * Serviço de envio de email para recuperação de senha e verificação.
 * Em produção: configure RESEND_API_KEY e EMAIL_FROM.
 */

type SendResetPasswordParams = {
  to: string;
  url: string;
  userName?: string | null;
};

export async function sendResetPasswordEmail({
  to,
  url,
  userName,
}: SendResetPasswordParams): Promise<void> {
  const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  const isDev = process.env.NODE_ENV === 'development';
  const hasResend = !!process.env.RESEND_API_KEY;

  if (hasResend) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from,
        to,
        subject: 'Recuperação de senha',
        html: getResetEmailHtml({ url, userName }),
      });
      if (error) {
        console.error('[email-reset] Resend error:', error);
        if (isDev) console.log('[email-reset] Link (dev fallback):', url);
      }
    } catch (e) {
      console.error('[email-reset] Failed to send:', e);
      if (isDev) console.log('[email-reset] Link (dev fallback):', url);
    }
    return;
  }

  if (isDev) {
    console.log(
      '[email-reset] RESEND_API_KEY não definida. Link de reset (apenas dev):',
      url,
    );
  } else {
    console.warn(
      '[email-reset] RESEND_API_KEY não definida em produção. Link (NÃO enviado):',
      url,
    );
  }
}

function getResetEmailHtml({
  url,
  userName,
}: {
  url: string;
  userName?: string | null;
}): string {
  const cumprimento = userName ? `Olá, ${userName}` : 'Olá';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 480px; margin: 0 auto; padding: 24px;">
  <p>${cumprimento},</p>
  <p>Recebemos um pedido para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha:</p>
  <p style="margin: 24px 0;">
    <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 500;">Redefinir senha</a>
  </p>
  <p style="color: #666; font-size: 14px;">Se não foi você quem solicitou, ignore este email. O link expira em 1 hora.</p>
  <p style="color: #999; font-size: 12px; margin-top: 32px;">Se o botão não funcionar, copie e cole no navegador: ${url}</p>
</body>
</html>
`.trim();
}

type SendVerificationEmailParams = {
  to: string;
  url: string;
  userName?: string | null;
  appName?: string;
};

export async function sendVerificationEmail({
  to,
  url,
  userName,
  appName = 'Mapa Produção',
}: SendVerificationEmailParams): Promise<void> {
  const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  const isDev = process.env.NODE_ENV === 'development';
  const hasResend = !!process.env.RESEND_API_KEY;

  if (hasResend) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from,
        to,
        subject: `Verifique o seu email - ${appName}`,
        html: getVerificationEmailHtml({ url, userName, appName }),
      });
      if (error) {
        console.error('[email-verification] Resend error:', error);
        if (isDev) console.log('[email-verification] Link (dev):', url);
      } else if (isDev && data?.id) {
        console.log('[email-verification] Enviado (id):', data.id);
      }
    } catch (e) {
      console.error('[email-verification] Failed to send:', e);
      if (isDev) console.log('[email-verification] Link (dev fallback):', url);
    }
    return;
  }

  if (isDev) {
    console.log(
      '[email-verification] RESEND_API_KEY não definida. Link (apenas dev):',
      url,
    );
  } else {
    console.warn(
      '[email-verification] RESEND_API_KEY não definida. Link (NÃO enviado):',
      url,
    );
  }
}

function getVerificationEmailHtml({
  url,
  userName,
  appName,
}: {
  url: string;
  userName?: string | null;
  appName: string;
}): string {
  const cumprimento = userName ? `Olá, ${userName}` : 'Olá';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 480px; margin: 0 auto; padding: 24px;">
  <p>${cumprimento},</p>
  <p>Bem-vindo ao ${appName}! Clique no botão abaixo para verificar o seu email:</p>
  <p style="margin: 24px 0;">
    <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 500;">Verificar email</a>
  </p>
  <p style="color: #666; font-size: 14px;">Este link expira em 24 horas.</p>
  <p style="color: #999; font-size: 12px; margin-top: 32px;">Se o botão não funcionar, copie e cole no navegador: ${url}</p>
</body>
</html>
`.trim();
}
