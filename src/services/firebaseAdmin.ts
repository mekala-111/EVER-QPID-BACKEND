import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const serviceAccountPath = path.resolve(__dirname, '../firebase-service-account.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const sendFCMNotification = async (token: string, title: string, body: string, data: Record<string, string> = {}): Promise<string> => {
  const message: admin.messaging.Message = {
    token,
    notification: { title, body },
    data,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('FCM sent successfully:', response);
    return response;
  } catch (err) {
    console.error('Error sending FCM:', err);
    throw err;
  }
};

export default admin;
