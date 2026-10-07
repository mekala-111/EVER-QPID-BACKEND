import { Document, Types } from 'mongoose';

export interface IUserSearchFilter extends Document {
  userId: Types.ObjectId;
  locationString: string;

  lat: number;
  lng: number;
  distance: number;

  minAge: number;
  maxAge: number;
  minHeight: number;
  maxHeight: number;

  looking: string[];
  otherLanguages: string[];

  education: string;
  profession: string;
  religion: string;
  maritalStatus: string;
  //family: string;
  //vax: string;
  //personality: string;
  //loveStyle: string;
  //pets: string;
  //drink: string;
  //smoke: string;
  //workout: string;
  //diet: string;
  //social: string;
  //sleep: string;

  interestedIn: string;
  //openTo: string;

  //minPhotos: number;

  allowOutOfDistance: boolean;
  allowOutOfAgeRange: boolean;
}
