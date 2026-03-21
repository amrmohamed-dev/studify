import fs from 'fs/promises';
import path from 'path';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

  const mailOptions = {
    from: `Studify <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html,
  };

  return await transporter.sendMail(mailOptions);
};

export default sendEmail;
