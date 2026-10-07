import { Types } from 'mongoose';

class MessageEntity {
  _id: Types.ObjectId;
  from: Types.ObjectId; // admin id
  to: Types.ObjectId; // user id
  content: string;
  read: boolean;
  sentOn: Date;

  constructor(_id: Types.ObjectId, from: Types.ObjectId, to: Types.ObjectId, content: string, read: boolean, sentOn: Date) {
    this._id = _id;
    this.from = from;
    this.to = to;
    this.content = content;
    this.read = read;
    this.sentOn = sentOn;
  }
}

export default MessageEntity;
