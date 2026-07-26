import fs from 'fs/promises';
import path from 'path';

const emailTemplatePath = path.join(
  process.cwd(),
  'src',
  'modules',
  'email',
  'templates',
  'email.template.html',
);

const loadTemplate = async (replacements = {}) => {
  let html = await fs.readFile(emailTemplatePath, 'utf-8');

  Object.keys(replacements).forEach((key) => {
    if (key) {
      html = html.replace(
        new RegExp(`{{${key}}}`, 'g'),
        String(replacements[key] ?? ''),
      );
    }
  });
  return html;
};

const sendEmail = async (options) => {
  const { name, email, subject, otp } = options;

  const html = await loadTemplate({
    templateTitle: subject,
    name,
    otp,
    year: new Date().getFullYear(),
  });

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: 'Studify', email: process.env.EMAIL_USER },
      to: [{ email }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Brevo API error (${response.status}): ${errorBody}`);
  }

  return await response.json();
};

export default sendEmail;