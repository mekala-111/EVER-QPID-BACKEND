import ERROR from '../middlewares/web_server/http-error';

const calculateEndDate = (durationValue: number, durationUnit: string): Date => {
  const endDate = new Date();

  switch (durationUnit) {
    case 'Minutes':
      endDate.setMinutes(endDate.getMinutes() + durationValue);
      break;

    case 'Hours':
      endDate.setHours(endDate.getHours() + durationValue);
      break;

    case 'Days':
      endDate.setDate(endDate.getDate() + durationValue);
      break;

    case 'Weeks':
      endDate.setDate(endDate.getDate() + durationValue * 7);
      break;

    case 'Months':
      endDate.setMonth(endDate.getMonth() + durationValue);
      break;

    default:
      throw new ERROR.BadRequestError('Invalid subscription duration unit');
  }

  return endDate;
};

export default calculateEndDate;
