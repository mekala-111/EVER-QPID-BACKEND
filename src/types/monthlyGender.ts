export type MonthlyGenderAgg = {
  _id: {
    month: number;
    gender: 'Man' | 'Women' | 'Other';
  };
  count: number;
};
