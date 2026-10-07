import { Request, Response, NextFunction } from 'express';
import dashboardService from '../services/dashboard-service';
import ERROR from '../middlewares/web_server/http-error';
import { AuthRequest } from '../middlewares/auth/verify-admin';

const getUserGenderChart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const chartData = await dashboardService.getUserGenderChart(year);

    res.status(200).json({
      success: true,
      data: chartData,
    });
  } catch (error) {
    next(error);
  }
};

const getMostActiveClans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await dashboardService.getMostActiveClans();

    res.status(200).json({
      status: true,
      statusCode: 200,
      message: 'Most active clans fetched successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getDashboardSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();

    const data = await dashboardService.getDashboardSummary(year);

    res.status(200).json({
      status: true,
      statusCode: 200,
      message: 'Dashboard summary fetched successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getDashboardCSVData = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new ERROR.AuthorizationError('Admin not authenticated');
    }
    const year = Number(req.query.year) || new Date().getFullYear();
    const data = await dashboardService.getFullDashboardData(year);

    res.status(200).json({
      status: true,
      statusCode: 200,
      message: 'Dashboard data fetched successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getDashboardOverallSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new ERROR.AuthorizationError('Admin not authenticated');
    }

    const year = Number(req.query.year) || new Date().getFullYear();

    const data = await dashboardService.getDashboardOverallSummary(year);

    res.status(200).json({
      status: true,
      statusCode: 200,
      message: 'Dashboard overall summary fetched successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export default { getUserGenderChart, getMostActiveClans, getDashboardSummary, getDashboardCSVData, getDashboardOverallSummary };
