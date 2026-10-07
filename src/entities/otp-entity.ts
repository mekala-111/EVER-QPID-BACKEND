export class OTPEntity {
  email: string;
  otp: string;

  constructor(email: string, otp: string) {
    this.email = email;
    this.otp = otp;
  }
}
