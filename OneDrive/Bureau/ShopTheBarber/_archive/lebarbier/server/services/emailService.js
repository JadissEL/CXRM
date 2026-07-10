import nodemailer from 'nodemailer';

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

// Create transporter
let transporter = null;

const createTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransporter(emailConfig);
  }
  return transporter;
};

// Send email function
export const sendEmail = async (to, subject, html, text = null) => {
  try {
    // If no SMTP credentials, log the email instead
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('📧 Email would be sent (SMTP not configured):');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('HTML:', html);
      return { success: true, message: 'Email logged (SMTP not configured)' };
    }

    const emailTransporter = createTransporter();
    
    const mailOptions = {
      from: `"ShopTheBarber" <${process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('📧 Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send welcome email
export const sendWelcomeEmail = async (email, firstName) => {
  const subject = 'Bienvenue sur ShopTheBarber ! 🎉';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #f59e0b; margin: 0;">ShopTheBarber</h1>
        <p style="color: #666; margin: 10px 0;">Votre plateforme de réservation de barbiers</p>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0;">Bienvenue ${firstName} !</h2>
        <p style="color: #555; line-height: 1.6;">
          Nous sommes ravis de vous accueillir sur ShopTheBarber, votre plateforme de réservation 
          de services de barbier au Maroc.
        </p>
        
        <div style="margin: 30px 0;">
          <h3 style="color: #f59e0b;">Ce que vous pouvez faire :</h3>
          <ul style="color: #555; line-height: 1.8;">
            <li>🔍 Découvrir des barbiers qualifiés près de chez vous</li>
            <li>📅 Réserver des créneaux en ligne</li>
            <li>⭐ Lire et laisser des avis</li>
            <li>💳 Payer en toute sécurité</li>
            <li>📱 Recevoir des notifications de rappel</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:8080'}/dashboard" 
             style="background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Commencer à réserver
          </a>
        </div>
      </div>
      
      <div style="text-align: center; color: #666; font-size: 14px;">
        <p>Si vous avez des questions, contactez-nous à support@shopthebarber.ma</p>
        <p>© 2024 ShopTheBarber. Tous droits réservés.</p>
      </div>
    </div>
  `;
  
  return await sendEmail(email, subject, html);
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetCode) => {
  const subject = 'Réinitialisation de votre mot de passe - ShopTheBarber';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #f59e0b; margin: 0;">ShopTheBarber</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0;">Réinitialisation de mot de passe</h2>
        <p style="color: #555; line-height: 1.6;">
          Vous avez demandé la réinitialisation de votre mot de passe. 
          Utilisez le code suivant pour créer un nouveau mot de passe :
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="background: #f59e0b; color: white; padding: 20px; border-radius: 8px; display: inline-block;">
            <h1 style="margin: 0; font-size: 32px; letter-spacing: 8px;">${resetCode}</h1>
          </div>
        </div>
        
        <p style="color: #555; line-height: 1.6;">
          <strong>Ce code expire dans 10 minutes.</strong><br>
          Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:8080'}/reset-password" 
             style="background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Réinitialiser le mot de passe
          </a>
        </div>
      </div>
      
      <div style="text-align: center; color: #666; font-size: 14px;">
        <p>Pour des raisons de sécurité, ce lien expire dans 10 minutes.</p>
        <p>© 2024 ShopTheBarber. Tous droits réservés.</p>
      </div>
    </div>
  `;
  
  return await sendEmail(email, subject, html);
};

// Send MFA setup email
export const sendMFASetupEmail = async (email, setupCode) => {
  const subject = 'Configuration de l\'authentification à deux facteurs - ShopTheBarber';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #f59e0b; margin: 0;">ShopTheBarber</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0;">Configuration de l'authentification à deux facteurs</h2>
        <p style="color: #555; line-height: 1.6;">
          Vous configurez l'authentification à deux facteurs pour votre compte. 
          Utilisez le code suivant pour finaliser la configuration :
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="background: #f59e0b; color: white; padding: 20px; border-radius: 8px; display: inline-block;">
            <h1 style="margin: 0; font-size: 32px; letter-spacing: 8px;">${setupCode}</h1>
          </div>
        </div>
        
        <p style="color: #555; line-height: 1.6;">
          <strong>Ce code expire dans 10 minutes.</strong><br>
          Si vous n'avez pas demandé cette configuration, ignorez cet email.
        </p>
      </div>
      
      <div style="text-align: center; color: #666; font-size: 14px;">
        <p>© 2024 ShopTheBarber. Tous droits réservés.</p>
      </div>
    </div>
  `;
  
  return await sendEmail(email, subject, html);
};

// Send appointment confirmation email
export const sendAppointmentConfirmation = async (email, appointmentData) => {
  const subject = 'Confirmation de réservation - ShopTheBarber';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #f59e0b; margin: 0;">ShopTheBarber</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0;">Réservation confirmée !</h2>
        <p style="color: #555; line-height: 1.6;">
          Votre réservation a été confirmée avec succès.
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Détails de la réservation :</h3>
          <p><strong>Barbier :</strong> ${appointmentData.barberName}</p>
          <p><strong>Date :</strong> ${appointmentData.date}</p>
          <p><strong>Heure :</strong> ${appointmentData.time}</p>
          <p><strong>Services :</strong> ${appointmentData.services}</p>
          <p><strong>Prix total :</strong> ${appointmentData.totalPrice} MAD</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:8080'}/appointments" 
             style="background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Voir mes réservations
          </a>
        </div>
      </div>
      
      <div style="text-align: center; color: #666; font-size: 14px;">
        <p>© 2024 ShopTheBarber. Tous droits réservés.</p>
      </div>
    </div>
  `;
  
  return await sendEmail(email, subject, html);
};

// Send appointment reminder email
export const sendAppointmentReminder = async (email, appointmentData) => {
  const subject = 'Rappel de réservation - ShopTheBarber';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #f59e0b; margin: 0;">ShopTheBarber</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0;">Rappel de réservation</h2>
        <p style="color: #555; line-height: 1.6;">
          N'oubliez pas votre rendez-vous demain !
        </p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Détails de la réservation :</h3>
          <p><strong>Barbier :</strong> ${appointmentData.barberName}</p>
          <p><strong>Date :</strong> ${appointmentData.date}</p>
          <p><strong>Heure :</strong> ${appointmentData.time}</p>
          <p><strong>Services :</strong> ${appointmentData.services}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:8080'}/appointments" 
             style="background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Voir mes réservations
          </a>
        </div>
      </div>
      
      <div style="text-align: center; color: #666; font-size: 14px;">
        <p>© 2024 ShopTheBarber. Tous droits réservés.</p>
      </div>
    </div>
  `;
  
  return await sendEmail(email, subject, html);
}; 