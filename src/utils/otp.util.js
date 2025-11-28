// Generate a random 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Check if OTP has expired
export const isOTPExpired = (expiresAt) => {
  return new Date() > new Date(expiresAt);
};

// Calculate OTP expiry time (default: 10 minutes from now)
export const getOTPExpiry = (minutes = 10) => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + minutes);
  return expiry;
};
