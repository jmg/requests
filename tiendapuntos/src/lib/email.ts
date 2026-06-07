// Envío de emails. En este demo no hay proveedor configurado, así que se
// loguea el contenido por consola. Para producción, conectá Resend / SMTP /
// SendGrid reemplazando la implementación de sendEmail.

type EmailInput = {
  to: string;
  subject: string;
  text: string;
};

export async function sendEmail({ to, subject, text }: EmailInput): Promise<void> {
  // TODO: integrar un proveedor real, p. ej.:
  //   const resend = new Resend(process.env.RESEND_API_KEY);
  //   await resend.emails.send({ from, to, subject, html });
  console.log(`\n📧 [email simulado]\n  Para: ${to}\n  Asunto: ${subject}\n  ${text}\n`);
}

export function inviteEmail(businessName: string, link: string): { subject: string; text: string } {
  return {
    subject: `Te invitaron a ${businessName} en TiendaPuntos`,
    text: `Fuiste invitado/a a sumarte al equipo de ${businessName}. Aceptá la invitación acá: ${link}`,
  };
}
