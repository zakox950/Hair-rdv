interface ConfirmationParams {
  nom:      string;
  coiffeur: string;
  date:     string;
  heure:    string;
  token:    string;
}

interface RecapParams {
  nom:      string;
  coiffeur: string;
  date:     string;
  heure:    string;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
const FROM     = process.env.EMAIL_FROM ?? 'noreply@salon.fr';
const SALON    = process.env.NEXT_PUBLIC_SALON_NAME ?? 'Salon';

/* ── Envoi via Resend HTTP API (pas de SDK requis) ───────────── */
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('[mailer] RESEND_API_KEY absent — email simulé');
    console.log(`  TO: ${to}`);
    console.log(`  SUBJECT: ${subject}`);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('[mailer] Resend error:', err);
  }
}

export async function sendConfirmationEmail(
  to: string,
  p: ConfirmationParams
): Promise<void> {
  const link = `${BASE_URL}/confirmation/${p.token}`;
  await sendEmail(
    to,
    `Confirmez votre RDV — ${SALON}`,
    `<p>Bonjour ${p.nom},</p>
     <p>Votre rendez-vous avec <b>${p.coiffeur}</b> le <b>${p.date}</b> à <b>${p.heure}</b> est en attente de confirmation.</p>
     <p><a href="${link}" style="background:#F59E0B;color:#000;padding:10px 24px;border-radius:999px;text-decoration:none;font-weight:600;">Confirmer mon rendez-vous</a></p>
     <p>Ce lien expire dans 15 minutes.</p>
     <p>${SALON}</p>`
  );
}

export async function sendRecapEmail(
  to: string,
  p: RecapParams
): Promise<void> {
  await sendEmail(
    to,
    `Votre RDV est confirmé — ${SALON}`,
    `<p>Bonjour ${p.nom},</p>
     <p>Votre rendez-vous avec <b>${p.coiffeur}</b> le <b>${p.date}</b> à <b>${p.heure}</b> est <b>confirmé</b>.</p>
     <p>À bientôt, ${SALON}</p>`
  );
}
