export interface EmailMessage {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
  attachment: { filename: string; bytes: Buffer; mime: string };
}

export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<void>;
}
