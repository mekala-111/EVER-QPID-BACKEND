import Razorpay from 'razorpay';
import crypto from 'crypto';
import config from '../config/config';

class RazorpayService {
  private razorpay = new Razorpay({
    key_id: config.razorpay.key_id as string,
    key_secret: config.razorpay.key_secret as string,
  });

  /**
   * This function creates a new order on razorpay and returns corresponding order details.
   * @param {Number} amount
   * @param {String} currency
   * @param {String} receipt
   * @param {Object} notes
   * @returns { Promise<Object> }
   */
  async createOrder(amount: number, currency: string, receipt: string, notes: any): Promise<object> {
    /* Implement Razorpay order creation logic */
    try {
      const options = {
        amount: Math.round(amount * 100), //amount in lowest currency unit eg: 1.Rs = 100 Paisa
        currency: currency,
        receipt: receipt,
        notes: notes,
      };

      return new Promise((resolve, reject) => {
        this.razorpay.orders.create(options, (err, order) => {
          if (err) {
            reject(err);
          } else {
            Object.assign(order, { key_id: config.razorpay.key_id as string }); //append razorpay key id with order response
            resolve(order);
          }
        });
      });
    } catch (e) {
      console.error('Unexpected error in createOrder:', e);
      throw e;
    }
  }

  /**
   * This function will verify the payement initiated by client
   * @param {String} order_id
   * @param {String} payment_id
   * @param {Number} amount
   * @param {String} currency
   * @param {String} razorpay_signature
   * @returns {Boolean}
   */
  async verifyAndCapturePayment(
    order_id: string,
    payment_id: string,
    amount: number,
    currency: string,
    razorpay_signature: string,
  ): Promise<boolean> {
    try {
      // Implement Razorpay payment capture logic

      // Creating hmac object
      const hmac = crypto.createHmac('sha256', config.razorpay.key_secret as string);

      // Passing the data to be hashed
      hmac.update(order_id + '|' + payment_id);

      // Creating the hmac in the required format
      const generated_signature = hmac.digest('hex');

      if (razorpay_signature === generated_signature) {
        //await this.razorpay.payments.capture(payment_id, amount * 100, currency);
        return true;
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  }
}

export default RazorpayService;
