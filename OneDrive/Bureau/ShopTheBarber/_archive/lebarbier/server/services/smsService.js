import twilio from 'twilio';

// Twilio configuration
const twilioConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  phoneNumber: process.env.TWILIO_PHONE_NUMBER,
};

// Create Twilio client
let twilioClient = null;

const createTwilioClient = () => {
  if (!twilioClient && twilioConfig.accountSid && twilioConfig.authToken) {
    twilioClient = twilio(twilioConfig.accountSid, twilioConfig.authToken);
  }
  return twilioClient;
};

// Send SMS function
export const sendSMS = async (to, message) => {
  try {
    // If no Twilio credentials, log the SMS instead
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.log('📱 SMS would be sent (Twilio not configured):');
      console.log('To:', to);
      console.log('Message:', message);
      return { success: true, message: 'SMS logged (Twilio not configured)' };
    }

    const client = createTwilioClient();
    if (!client) {
      throw new Error('Twilio client not initialized');
    }

    const result = await client.messages.create({
      body: message,
      from: twilioConfig.phoneNumber,
      to: to,
    });

    console.log('📱 SMS sent successfully:', result.sid);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('❌ Error sending SMS:', error);
    return { success: false, error: error.message };
  }
};

// Send OTP SMS
export const sendOTPSMS = async (phone, code, type = 'login') => {
  const message = `Votre code ShopTheBarber: ${code}. Expire dans 10 minutes.`;
  return await sendSMS(phone, message);
};

// Send MFA setup SMS
export const sendMFASetupSMS = async (phone, setupCode) => {
  const message = `Code de configuration MFA ShopTheBarber: ${setupCode}. Expire dans 10 minutes.`;
  return await sendSMS(phone, message);
};

// Send appointment reminder SMS
export const sendAppointmentReminderSMS = async (phone, appointmentData) => {
  const message = `Rappel ShopTheBarber: Rendez-vous demain à ${appointmentData.time} avec ${appointmentData.barberName}.`;
  return await sendSMS(phone, message);
};

// Send appointment confirmation SMS
export const sendAppointmentConfirmationSMS = async (phone, appointmentData) => {
  const message = `Confirmation ShopTheBarber: Rendez-vous confirmé le ${appointmentData.date} à ${appointmentData.time} avec ${appointmentData.barberName}.`;
  return await sendSMS(phone, message);
};

// Validate phone number format
export const validatePhoneNumber = (phone) => {
  // Basic international phone number validation
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

// Format phone number for Twilio
export const formatPhoneNumber = (phone) => {
  // Remove all non-digit characters except +
  let formatted = phone.replace(/[^\d+]/g, '');
  
  // If no country code, assume Morocco (+212)
  if (!formatted.startsWith('+')) {
    if (formatted.startsWith('0')) {
      formatted = '+212' + formatted.substring(1);
    } else {
      formatted = '+212' + formatted;
    }
  }
  
  return formatted;
}; 