import reportService from '../services/report-service';
import ApiResponse from '../utils/api-response';
import { NextFunction, Request, Response } from 'express';

const reportUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reporter, reported, reason } = req.body;

    const report = await reportService.createReport({ reporter, reported, reason });

    const apiResponse = new ApiResponse();
    apiResponse.message = 'Report submitted successfully.';
    apiResponse.statusCode = 200;
    apiResponse.data = report;

    res.json(apiResponse);
  } catch (err) {
    next(err);
  }
};

const getReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pageNumber = parseInt(req.query.pageNumber as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const search = req.query.search as string;
    const status = (req.query.status as string) || 'all';

    const { reports, totalCount, hasNext, stats } = await reportService.getAllReports({
      pageNumber,
      pageSize,
      search,
      status: status as 'all' | 'under_review' | 'active' | 'final_warning' | 'suspended',
    });

    const apiResponse = new ApiResponse();
    apiResponse.statusCode = 200;
    apiResponse.message = 'Reports fetched successfully';
    apiResponse.data = { reports, totalCount, hasNext, stats };

    res.json(apiResponse);
  } catch (err) {
    next(err);
  }
};

const getReportedUserDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reportedId = req.params.reportedId;

    const reports = await reportService.getReportedUserDetails(reportedId);

    const apiResponse = new ApiResponse();
    apiResponse.statusCode = 200;
    apiResponse.message = 'Reported user details fetched successfully';
    apiResponse.data = reports;

    res.json(apiResponse);
  } catch (err) {
    next(err);
  }
};

const downloadReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = (req.query.status as 'all' | 'under_review' | 'active' | 'final_warning' | 'suspended') || 'all';

    const { reports } = await reportService.getAllReportsForDownload({
      pageNumber: 1,
      pageSize: Number.MAX_SAFE_INTEGER,
      search: '',
      status,
    });

    const apiResponse = new ApiResponse();
    apiResponse.statusCode = 200;
    apiResponse.message = 'Reports fetched successfully for download';
    apiResponse.data = reports;

    res.json(apiResponse);
  } catch (err) {
    next(err);
  }
};

const resetWarnings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      throw new Error('User ID is required');
    }

    await reportService.resetWarnings(userId);

    const apiResponse = new ApiResponse();
    apiResponse.statusCode = 200;
    apiResponse.message = 'User warnings reset successfully';

    res.json(apiResponse);
  } catch (err) {
    next(err);
  }
};

const suspendUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      throw new Error('User ID is required');
    }

    await reportService.suspendUser(userId);

    const apiResponse = new ApiResponse();
    apiResponse.statusCode = 200;
    apiResponse.message = 'User suspended successfully';
    res.json(apiResponse);
  } catch (err) {
    next(err);
  }
};

const activateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      throw new Error('User ID is required');
    }

    await reportService.activateUser(userId);

    const apiResponse = new ApiResponse();
    apiResponse.statusCode = 200;
    apiResponse.message = 'User activated successfully';

    res.json(apiResponse);
  } catch (err) {
    next(err);
  }
};

export default { reportUser, getReports, getReportedUserDetails, downloadReports, resetWarnings, suspendUser, activateUser };
