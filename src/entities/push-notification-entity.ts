class PushNotificationsEntity {
  documentStatus: boolean;
  title: string;
  description: string;
  notificationType: string;
  link: string;
  imageUrl: string;
  notificationUrl: string;
  recipients: string[];
  fromDate: Date;
  toDate: Date;
  interval: number;
  time: string;
  paused: boolean;
  createdUser: string | null;
  createdAt: Date | null;
  updatedUser: string | null;
  updatedAt: Date | null;

  constructor(
    documentStatus: boolean,
    title: string,
    description: string,
    notificationType: string,
    link: string,
    imageUrl: string,
    notificationUrl: string,
    recipients: string[],
    fromDate: Date,
    toDate: Date,
    interval: number,
    time: string,
    paused: boolean,
    createdUser: string | null,
    createdAt: Date | null,
    updatedUser: string | null,
    updatedAt: Date | null,
  ) {
    this.documentStatus = documentStatus;
    this.title = title;
    this.description = description;
    this.notificationType = notificationType;
    this.link = link;
    this.imageUrl = imageUrl;
    this.notificationUrl = notificationUrl;
    this.recipients = recipients;
    this.fromDate = fromDate;
    this.toDate = toDate;
    this.interval = interval;
    this.time = time;
    this.paused = paused;
    this.createdUser = createdUser;
    this.createdAt = createdAt;
    this.updatedUser = updatedUser;
    this.updatedAt = updatedAt;
  }
}

export default PushNotificationsEntity;
