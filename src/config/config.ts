export default {
  port: process.env.PORT || 3002,
  mongo: {
    uri: process.env.MONGO_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpirationMinutes: process.env.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: process.env.JWT_REFRESH_EXPIRATION_DAYS,
  },
  tokenTypes: {
    ACCESS: 'access',
    REFRESH: 'refresh',
  },
  razorpay: {
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  },
  currency: 'INR',
  currencySymbol: '₹',
  mail: {
    sender_id: process.env.MAIL_SENDER_ID,
    sender_password: process.env.MAIL_SENDER_PASSWORD,
  },
  chat: {
    freeMessageLimit: Number(process.env.FREE_CHAT_MESSAGE_LIMIT || 9),
  },
  likes: {
    freeLimitPerDay: Number(process.env.DEFAULT_FREE_LIKE_COUNT || 25),
  },
  superLikes: {
    freeSuperLikelimitPerDay: Number(process.env.SUPER_LIKES_PER_DAY || 3),
  },
};
