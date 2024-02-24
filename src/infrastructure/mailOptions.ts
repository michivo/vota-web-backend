export interface MailOptions {
    sendGridApiKey?: string;
    senderAddress: string;
    replyToAddress: string;
    frontendUrl: string;
    mode: 'SendGrid' | 'SMTP';
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    smtpSecure?: boolean;
}
