import { IUser } from '../models/user/user-model';
import { Types } from 'mongoose';

const isPopulatedUser = (user: Types.ObjectId | IUser): user is IUser => {
  return (user as IUser).fullName !== undefined;
};

export default { isPopulatedUser };
