export async function generateOrderNumber() {
  const prefix = 'afmc';
  const timestamp = Date.now(); // Current timestamp in milliseconds
  const random = Math.floor(Math.random() * 1000); // Random number between 0 and 999
  return `${prefix}_${timestamp}${random}`;
}
