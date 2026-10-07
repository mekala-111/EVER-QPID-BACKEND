function generateOTP() {
  const length = 5; // Adjust the length of the random part of the code
  const characters = '0123456789';
  let randomPart = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomPart += characters[randomIndex];
  }

  return randomPart;
}

export { generateOTP };
