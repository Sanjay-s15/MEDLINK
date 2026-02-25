// OTP Utility — in production integrate Twilio, MSG91, or Fast2SMS
export const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const getOTPExpiry = (minutes = 10): Date => {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + minutes);
    return expiry;
};

export const isOTPValid = (otp: string, storedOTP: string, expiry: Date): boolean => {
    if (otp !== storedOTP) return false;
    if (new Date() > expiry) return false;
    return true;
};

// In a real app, this sends via Twilio/SMS gateway
export const sendOTP = async (mobile: string, otp: string, message?: string): Promise<void> => {
    const text = message || `Your MedLink OTP is: ${otp}. Valid for 10 minutes. Do not share.`;
    console.log(`[SMS MOCK] Sending to ${mobile}: ${text}`);
    // TODO: Uncomment and configure for production
    // const client = require('twilio')(ACCOUNT_SID, AUTH_TOKEN);
    // await client.messages.create({ body: text, from: '+1TWILIO_NUM', to: `+91${mobile}` });
};
