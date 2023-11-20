import config from 'config';
import sendgrid from '@sendgrid/mail';
import { MailOptions } from './mailOptions';

export async function sendMail(subject: string, toEmail: string, content: string, contentHtml: string | undefined) {
    const mailOptions: MailOptions = config.get('sendgrid');

    sendgrid.setApiKey(mailOptions.apiKey);
    await sendgrid.send({
        from: mailOptions.senderAddress,
        replyTo: mailOptions.replyToAddress,
        subject: subject,
        text: content,
        html: contentHtml,
        to: toEmail,
    });
}

export async function sendResetMail(challenge: string, toAddress: string) {
    const subject = 'Ihr Vota-Konto';
    const mailOptions: MailOptions = config.get('sendgrid');
    const link = `${mailOptions.frontendUrl}/reset-password?challenge=${challenge}`;
    const content = `Für Sie wurde ein neues Benutzer*innenkonto bei Vota, dem Wahltool der Grünen, angelegt. Bitte öffnen Sie folgenden Link, um ein Passwort für Ihr Konto festzulegen: ${  link}`;
    const contentHtml = '<html><head><title>Vota</title></head><body><p>Für Sie wurde ein neues Benutzer*innenkonto bei Vota, dem Wahltool der Grünen, angelegt. Bitte öffnen Sie folgenden Link, um ein Passwort für Ihr Konto festzulegen: <br>' + 
        `<a href="${link}">${link}</a></p></html>`;
    console.log(content);
    console.log(contentHtml);
    await sendMail(subject, toAddress, content, contentHtml);
}
