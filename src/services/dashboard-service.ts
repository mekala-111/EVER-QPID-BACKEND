import dashboardRepository, { MostActiveClanAgg } from '../repositories/dashboard-repository';

type MonthlyGenderAgg = {
  _id: {
    month: number;
    gender: 'Man' | 'Women' | 'Other';
  };
  count: number;
};

interface ChartData {
  months: string[];
  Man: number[];
  Women: number[];
  Other: number[];
}

const getUserGenderChart = async (year: number): Promise<ChartData> => {
  const data: MonthlyGenderAgg[] = await dashboardRepository.getMonthlyGenderStats(year);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const chartData: ChartData = {
    months,
    Man: Array(12).fill(0),
    Women: Array(12).fill(0),
    Other: Array(12).fill(0),
  };

  data.forEach((item) => {
    const monthIndex = item._id.month - 1;
    const gender = item._id.gender as keyof Omit<ChartData, 'months'>;
    chartData[gender][monthIndex] = item.count;
  });

  return chartData;
};

interface PieChartData {
  label: string;
  value: number;
}

const getMostActiveClans = async (): Promise<PieChartData[]> => {
  const data: MostActiveClanAgg[] = await dashboardRepository.getMostActiveClans();

  return data.map((item) => ({
    label: item._id,
    value: item.count,
  }));
};

interface DashboardSummary {
  months: string[];
  totalUsers: number[];
  menUsers: number[];
  womenUsers: number[];
  revenue: number[];
}

const getDashboardSummary = async (year: number): Promise<DashboardSummary> => {
  const data = await dashboardRepository.getMonthlyDashboardSummary(year);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const summary: DashboardSummary = {
    months,
    totalUsers: Array(12).fill(0),
    menUsers: Array(12).fill(0),
    womenUsers: Array(12).fill(0),
    revenue: Array(12).fill(0),
  };

  data.forEach((item) => {
    const monthIndex = item._id.month - 1;
    summary.totalUsers[monthIndex] = item.totalUsers || 0;
    summary.menUsers[monthIndex] = item.menUsers || 0;
    summary.womenUsers[monthIndex] = item.womenUsers || 0;
    summary.revenue[monthIndex] = item.revenue || 0;
  });

  return summary;
};

interface DashboardCSVRow {
  month: string;
  totalUsers: number;
  menUsers: number;
  womenUsers: number;
  otherUsers: number;
  revenue: number;
  topCity?: string;
  cityCount?: number;
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getFullDashboardData = async (year: number): Promise<DashboardCSVRow[]> => {
  const genderStats: MonthlyGenderAgg[] = await dashboardRepository.getMonthlyGenderStats(year);
  const clans: MostActiveClanAgg[] = await dashboardRepository.getMostActiveClans();
  const summary = await dashboardRepository.getMonthlyDashboardSummary(year);

  const genderMap: Record<number, { Man: number; Women: number; Other: number }> = {};
  genderStats.forEach((item) => {
    const month = item._id.month;
    if (!genderMap[month]) genderMap[month] = { Man: 0, Women: 0, Other: 0 };
    genderMap[month][item._id.gender] = item.count;
  });

  const data: DashboardCSVRow[] = months.map((m, idx) => {
    const monthIndex = idx + 1;
    const monthSummary = summary.find((s) => s._id.month === monthIndex);
    const genderData = genderMap[monthIndex] || { Man: 0, Women: 0, Other: 0 };

    const topCityData = clans[0] || { _id: '', count: 0 }; // you can customize logic per month if needed

    return {
      month: m,
      totalUsers: monthSummary?.totalUsers || 0,
      menUsers: genderData.Man,
      womenUsers: genderData.Women,
      otherUsers: genderData.Other,
      revenue: monthSummary?.revenue || 0,
      topCity: topCityData._id,
      cityCount: topCityData.count,
    };
  });

  return data;
};

interface DashboardOverallSummary {
  totalUsers: number;
  menUsers: number;
  womenUsers: number;
  revenue: number;
}

const getDashboardOverallSummary = async (year: number): Promise<DashboardOverallSummary> => {
  const result = await dashboardRepository.getOverallDashboardSummary(year);

  return {
    totalUsers: result.totalUsers || 0,
    menUsers: result.menUsers || 0,
    womenUsers: result.womenUsers || 0,
    revenue: result.revenue || 0,
  };
};

export default { getUserGenderChart, getMostActiveClans, getDashboardSummary, getFullDashboardData, getDashboardOverallSummary };
