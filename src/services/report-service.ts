import REPORT from '../models/report/report';
import USER from '../models/user/user';
import { reportRepository, userRepository } from '../repositories';
import { Types } from 'mongoose';

const createReport = async ({ reporter, reported, reason }: { reporter: string; reported: string; reason: string }) => {
  if (reporter === reported) {
    throw new Error('You cannot report yourself');
  }

  const [reporterExists, reportedExists] = await Promise.all([USER.findById(reporter), USER.findById(reported)]);
  if (!reporterExists || !reportedExists) {
    throw new Error('Invalid reporter or reported user.');
  }

  const alreadyReported = await REPORT.findOne({ reporter, reported });
  if (alreadyReported) {
    throw new Error('You already reported this user.');
  }

  const reportCount = await REPORT.countDocuments({
    reported,
    documentStatus: true,
    status: { $ne: 'suspended' },
  });

  let warningLevel: 'low' | 'medium' | 'high' = 'low';
  const totalReports = reportCount + 1;
  if (totalReports >= 5) warningLevel = 'high';
  else if (totalReports >= 3) warningLevel = 'medium';

  const report = await REPORT.create({
    reporter,
    reported,
    reason,
    warningLevel,
    attemptsLeft: 3,
    status: 'under_review',
    documentStatus: true,
  });

  return report;
};

interface GetReportsInput {
  pageNumber: number;
  pageSize: number;
  search?: string;
  status?: 'all' | 'under_review' | 'active' | 'final_warning' | 'suspended';
}

const getAllReports = async ({ pageNumber, pageSize, search, status }: GetReportsInput) => {
  return reportRepository.getAllReports({ pageNumber, pageSize, search, status });
};

const getReportedUserDetails = async (reportedId: string) => {
  return reportRepository.getReportedUserDetails(reportedId);
};

const getAllReportsForDownload = async ({ pageNumber, pageSize, search, status }: GetReportsInput) => {
  return reportRepository.getAllReportsDownload({ pageNumber, pageSize, search, status });
};

const resetWarnings = async (userId: string) => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID');
  }

  await REPORT.updateMany(
    { reported: userId, documentStatus: true },
    {
      $set: {
        documentStatus: false,
        warningLevel: 'low',
        attemptsLeft: 3,
      },
    },
  );

  await USER.findByIdAndUpdate(userId, {
    $set: {
      adminReport: false,
      isActive: true,
    },
  });
};

const suspendUser = async (userId: string) => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID');
  }

  await Promise.all([userRepository.suspendUser(userId), reportRepository.suspendUserReports(userId)]);
};

const activateUser = async (userId: string) => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID');
  }

  await Promise.all([userRepository.activateUser(userId), reportRepository.activateUserReports(userId)]);
};

export default { createReport, getAllReports, getReportedUserDetails, getAllReportsForDownload, resetWarnings, suspendUser, activateUser };
