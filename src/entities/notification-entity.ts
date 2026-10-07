import { Types } from 'mongoose';

class NotificationEntity {
  _id: Types.ObjectId;
  recipient: Types.ObjectId;
  notificationType: string;
  title: string;
  description: string;
  onTapNavigate: string;
  sentOn: Date;
  sender: Types.ObjectId | null;
  documentStatus: boolean;
  viewStatus: boolean;
  constructor(
    _id: Types.ObjectId,
    recipient: Types.ObjectId,
    notificationType: string,
    title: string,
    description: string,
    onTapNavigate: string,
    sentOn: Date,
    sender: Types.ObjectId | null,
    documentStatus: boolean,
    viewStatus: boolean,
  ) {
    this._id = _id;
    this.recipient = recipient;
    this.notificationType = notificationType;
    this.title = title;
    this.description = description;
    this.onTapNavigate = onTapNavigate;
    this.sentOn = sentOn;
    this.sender = sender;
    this.documentStatus = documentStatus;
    this.viewStatus = viewStatus;
  }
}

export default NotificationEntity;
