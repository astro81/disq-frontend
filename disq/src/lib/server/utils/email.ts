import { env } from '$env/dynamic/private';
// import { Resend } from 'resend';
import { SendKit } from '@sendkitdev/sdk';


// export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
//     console.log('DEBUG: sendEmail calling resend for:', to);
//     const resend = new Resend(RESEND_EMAIL_KEY);

//     try {
//         const result = await resend.emails.send({
//             from: RESEND_EMAIL,
//             to,
//             subject,
//             html
//         });
//         console.log('DEBUG: Resend success:', result);
//     } catch (error) {
//         console.error('DEBUG: Resend error:', error);
//         throw error;
//     }

// }

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {

    const sendkit = new SendKit(env.SENDKIT_API_KEY);

    const { data, error } = await sendkit.emails.send({
      from: 'Disq App <notifications@no-reply.disq.com>',
      to,
      subject,
      html,
    });

    if (error) {
      console.error(error);
    } else {
      console.log('Email sent:', data.id);
    }

}
