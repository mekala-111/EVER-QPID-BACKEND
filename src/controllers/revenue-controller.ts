import { NextFunction, Request, Response } from 'express';
import revenueService from '../services/revenue-service';
import ApiResponse from '../utils/api-response';

const getAllTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || 'all';
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : null;
    const toDate = req.query.toDate ? new Date(req.query.toDate as string) : null;

    const transactionsData = await revenueService.getAllTransactions(page, limit, { search, status, fromDate, toDate });

    const apiResponse: ApiResponse<typeof transactionsData> = new ApiResponse();
    apiResponse.message = 'Transactions fetched successfully';
    apiResponse.statusCode = 200;
    apiResponse.data = transactionsData;

    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

const getTransactionDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transactionId = req.params.transactionId;
    const data = await revenueService.getTransactionDetails(transactionId);

    const apiResponse = new ApiResponse();
    apiResponse.statusCode = 200;
    apiResponse.status = true;
    apiResponse.message = 'Transaction details fetched successfully';
    apiResponse.data = data;

    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

const getTransactionStatusChart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fromDate, toDate, gender, location, planName } = req.query;

    const filters = {
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
      gender: gender as string | undefined,
      location: location as string | undefined,
      planName: planName as string | undefined,
    };

    const chartData = await revenueService.getTransactionStatusChart(filters);

    const apiResponse = new ApiResponse();
    apiResponse.statusCode = 200;
    apiResponse.status = true;
    apiResponse.message = 'Transaction status chart fetched successfully';
    apiResponse.data = chartData;

    res.json(apiResponse);
  } catch (error) {
    next(error);
  }
};

const getRevenueSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await revenueService.getRevenueSummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
};

const exportTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = (req.query.status as string) || 'all';
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : null;
    const toDate = req.query.toDate ? new Date(req.query.toDate as string) : null;

    const transactions = await revenueService.getTransactionsForExport({ status, fromDate, toDate });

    res.json({
      status: true,
      statusCode: 200,
      message: 'Transactions fetched successfully for export',
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

export default { getAllTransactions, getTransactionDetail, getTransactionStatusChart, getRevenueSummary, exportTransactions };
