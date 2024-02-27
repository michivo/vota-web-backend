import config from 'config';
import sendgrid from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import { MailOptions } from './mailOptions';

async function sendMailSendgrid(subject: string, toEmail: string, content: string, contentHtml: string | undefined) {
    const mailOptions: MailOptions = config.get('email');

    sendgrid.setApiKey(mailOptions.sendGridApiKey!);
    await sendgrid.send({
        from: mailOptions.senderAddress,
        replyTo: mailOptions.replyToAddress,
        subject: subject,
        text: content,
        html: contentHtml,
        to: toEmail,
    });
}

async function sendMailSmtp(subject: string, toEmail: string, content: string, contentHtml: string | undefined) {
    const mailOptions: MailOptions = config.get('email');
    const transporter = nodemailer.createTransport({
        host: mailOptions.smtpHost!,
        port: mailOptions.smtpPort!,
        secure: mailOptions.smtpSecure!,
        auth: {
          user: mailOptions.smtpUser,
          pass: mailOptions.smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: mailOptions.senderAddress,
        to: toEmail,
        subject: subject,
        text: content,
        html: contentHtml,
      });

      console.log(`Message sent: ${info?.messageId ?? 'fail'}`);
}

export async function sendMail(subject: string, toEmail: string, content: string, contentHtml: string | undefined) {
    const mailOptions: MailOptions = config.get('email');
    if(mailOptions.mode === 'SendGrid') {
        await sendMailSendgrid(subject, toEmail, content, contentHtml);
    }
    else {
        await sendMailSmtp(subject, toEmail, content, contentHtml);
    }
}

export async function sendNewUserMail(challenge: string, toAddress: string) {
    const subject = 'Ihr Vota-Konto';
    const mailOptions: MailOptions = config.get('email');
    const link = `${mailOptions.frontendUrl}/reset-password?challenge=${challenge}`;
    const content = `Für Sie wurde ein neues Benutzer*innenkonto bei Vota, dem Wahltool der Grünen, angelegt. Bitte öffnen Sie folgenden Link, um ein Passwort für Ihr Konto festzulegen: ${link}`;
    const contentHtml = '<html><head><title>Vota</title></head><body><p>Für Sie wurde ein neues Benutzer*innenkonto bei Vota, dem Wahltool der Grünen, angelegt. Bitte öffnen Sie folgenden Link, um ein Passwort für Ihr Konto festzulegen: <br>' + 
        `<a href="${link}">${link}</a></p></html>`;
    await sendMail(subject, toAddress, content, contentHtml);
}

export async function sendResetMail(challenge: string, toAddress: string) {
    const subject = 'Ihr Vota-Konto';
    const mailOptions: MailOptions = config.get('email');
    const link = `${mailOptions.frontendUrl}/reset-password?challenge=${challenge}`;
    const content = `Bitte öffnen Sie folgenden Link, um Ihr Passwort zurückzusetzen: ${link}`;
    const contentHtml = '<html><head><title>Vota</title></head><body><p>Bitte öffnen Sie folgenden Link, um Ihr Passwort zurückzusetzen: <br>' + 
        `<a href="${link}">${link}</a></p></html>`;
    console.log(content);
    console.log(contentHtml);
    await sendMail(subject, toAddress, content, contentHtml);
}
