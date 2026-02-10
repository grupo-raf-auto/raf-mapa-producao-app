/**
 * Envio de email ao admin quando um utilizador reporta um bug (ticket).
 * Usa Resend. Configure RESEND_API_KEY e ADMIN_EMAIL (ou EMAIL_ADMIN) para produção.
 */

export type SendBugReportParams = {
  reportId: string;
  title: string;
  description: string;
  reporterName?: string;
  reporterEmail: string;
};

function getBugReportHtml(params: SendBugReportParams): string {
  const { reportId, title, description, reporterName, reporterEmail } = params;
  const fromLabel = reporterName
    ? `${reporterName} (${reporterEmail})`
    : reporterEmail;
  const descEscaped = description
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #1e293b; margin-bottom: 8px;">Novo reporte de bug / ticket</h2>
  <p style="color: #64748b; font-size: 14px;">ID: ${reportId}</p>
  <p><strong>Reportado por:</strong> ${fromLabel}</p>
  <p><strong>Assunto:</strong> ${title}</p>
  <div style="margin: 16px 0; padding: 16px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #dc2626;">
    <strong>Descrição:</strong><br>
    <div style="margin-top: 8px;">${descEscaped}</div>
  </div>
  <p style="color: #64748b; font-size: 12px;">Aceda ao painel Admin → Tickets para responder e gerir.</p>
</body>
</html>
`.trim();
}

export async function sendBugReportEmail(
  params: SendBugReportParams,
): Promise<void> {
  const adminEmail =
    process.env.ADMIN_EMAIL ||
    process.env.EMAIL_ADMIN ||
    process.env.EMAIL_FROM;
  if (!adminEmail) {
    console.warn(
      '[email-bug] ADMIN_EMAIL / EMAIL_ADMIN não definido. Email de bug não enviado.',
    );
    return;
  }

  const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  const hasResend = !!process.env.RESEND_API_KEY;

  if (hasResend) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from,
        to: adminEmail,
        subject: `[Mapa Produção] Bug reportado: ${params.title.slice(0, 60)}`,
        html: getBugReportHtml(params),
      });
      if (error) {
        console.error('[email-bug] Resend error:', error);
      }
    } catch (e) {
      console.error('[email-bug] Failed to send:', e);
    }
    return;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(
      '[email-bug] RESEND_API_KEY não definida. Bug (dev):',
      params.reportId,
      params.title,
    );
  }
}
