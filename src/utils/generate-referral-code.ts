function generateReferralCode() {
  const prefix = 'VCL';
  const length = 6; // Adjust the length of the random part of the code
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomPart += characters[randomIndex];
  }

  return prefix + randomPart;
}

export default generateReferralCode;
