import { Schema, model, Model } from 'mongoose';
import { IBlacklistedToken } from './blackListedToken-model';

const blacklistedTokenSchema = new Schema<IBlacklistedToken>(
  {
    token: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// TTL index → auto-delete after expiry
blacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const BLACKLISTED_TOKEN: Model<IBlacklistedToken> = model<IBlacklistedToken>('cln_blacklisted_tokens', blacklistedTokenSchema);

export default BLACKLISTED_TOKEN;
