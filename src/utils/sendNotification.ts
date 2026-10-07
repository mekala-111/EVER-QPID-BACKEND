import admin from '../config/firebase-config';
import USER from '../models/user/user';
import { userRepository } from '../repositories';
import { notificationService } from '../services';
import { Types } from 'mongoose';

export const sendPushNotification = async (tokens: string[], title: string, body: string, data: Record<string, string>) => {
  if (!tokens.length) return;

  await admin.messaging().sendEachForMulticast({
    tokens,
    notification: {
      title,
      body,
    },
    data,
  });
};

export const sendLikeNotification = async (likedUserId: string, likedByUserId: string) => {
  const sender = await USER.findById(likedByUserId).select('fullName');

  await notificationService.createNotification(
    likedUserId,
    'like',
    'Someone liked your profile ❤️',
    `${sender?.fullName} liked your profile`,
    'otherProfile',
    likedByUserId,
  );

  const likedUser = await userRepository.findUserById(new Types.ObjectId(likedUserId));

  const tokens = likedUser?.fcmTokens || [];

  await sendPushNotification(tokens, 'New like ❤️', `${sender?.fullName} liked your profile`, {
    type: 'like',
    senderId: likedByUserId,
    navigateTo: 'otherProfile',
  });
};

export const sendMatchNotification = async (userA: string, userB: string) => {
  const userAData = await USER.findById(userA).select('fullName');
  const userBData = await USER.findById(userB).select('fullName');

  await notificationService.createNotification(
    userA,
    'new_match',
    'It’s a Match 🎉',
    `You matched with ${userBData?.fullName}`,
    'matchScreen',
    userB,
  );

  await notificationService.createNotification(
    userB,
    'new_match',
    'It’s a Match 🎉',
    `You matched with ${userAData?.fullName}`,
    'matchScreen',
    userA,
  );

  // Push both sides
  const [tokensA, tokensB] = await Promise.all([
    userRepository.findUserById(new Types.ObjectId(userA)),
    userRepository.findUserById(new Types.ObjectId(userB)),
  ]);

  await sendPushNotification(tokensA?.fcmTokens || [], 'It’s a Match 🎉', `You matched with ${userBData?.fullName}`, {
    type: 'new_match',
    userId: userB,
  });

  await sendPushNotification(tokensB?.fcmTokens || [], 'It’s a Match 🎉', `You matched with ${userAData?.fullName}`, {
    type: 'new_match',
    userId: userA,
  });
};
