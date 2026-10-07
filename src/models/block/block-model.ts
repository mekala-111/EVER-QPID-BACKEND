import { Document, Types } from 'mongoose';

export enum SelectedReasons {
  InappropriateBehavior = 'Inappropriate behavior',
  OffensiveLanguage = 'Offensive language',
  UnwantedContact = 'Unwanted contact',
  NotWhatIExpected = 'Not what I expected',
  PrivacyConcerns = 'Privacy concerns',
  Other = 'Other',
}

export interface IBlock extends Document {
  _id: Types.ObjectId;
  documentStatus: boolean;
  blockedAccount: Types.ObjectId;
  blockedBy: Types.ObjectId;
  dateBlocked: Date | null;
  selectedReasons: SelectedReasons[];
  createdUser: Types.ObjectId | null;
  createdAt: Date | null;
  updatedUser: Types.ObjectId | null;
  updatedAt: Date | null;
}
