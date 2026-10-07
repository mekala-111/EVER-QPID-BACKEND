import { Model, Schema, model } from 'mongoose';
import { IMessage } from './message-model';

const messageSchema: Schema = new Schema<IMessage>(
  {
    from: { type: Schema.Types.ObjectId, ref: 'cln_admins', required: true },
    to: { type: Schema.Types.ObjectId, ref: 'cln_user', required: true },
    content: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Define model
const MESSAGE: Model<IMessage> = model<IMessage>('cln_Message', messageSchema);
export default MESSAGE;
