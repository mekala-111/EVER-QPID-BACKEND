import { Model, Schema, model } from 'mongoose';
import { IToken } from './token-model';
import config from '../../config/config';

const tokenSchema: Schema = new Schema<IToken>(
  {
    documentStatus: { type: Boolean, required: true, default: true },
    token: { type: String, required: true, index: true },
    user: { type: Schema.Types.ObjectId, required: true, ref: 'cln_users' },
    type: { type: String, enum: [config.tokenTypes.REFRESH], required: true },
    expires: { type: Date, required: true },
    blacklisted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

const TOKEN: Model<IToken> = model<IToken>('cln_tokens', tokenSchema);

export default TOKEN;
