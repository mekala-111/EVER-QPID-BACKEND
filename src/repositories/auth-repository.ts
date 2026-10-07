import adminRepository from './admin-repository';
import employeeRepository from './employee-repository';

const findUserByEmail = async (email: string) => {
  const admin = await adminRepository.findByEmail(email);
  if (admin) {
    return { user: admin, userType: 'admin' as const };
  }

  const employee = await employeeRepository.getByEmail(email);
  if (employee) {
    return { user: employee, userType: 'employee' as const };
  }

  return null;
};

export default { findUserByEmail };
