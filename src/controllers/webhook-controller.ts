import { Request, Response } from 'express';
import crypto from 'crypto';
import { subscriptionPurchaseRepository } from '../repositories';
import { PurchaseStatus, PlanStatus } from '../types/common';

const handleRazorpayWebhook = async (req: Request, res: Response): Promise<Response> => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    const signature = req.headers['x-razorpay-signature'] as string;

    //Verify signature
    const bodyString = req.body.toString('utf-8');
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(bodyString);
    const digest = hmac.digest('hex');

    if (digest !== signature) {
      return res.status(400).json({ status: 'invalid signature' });
    }

    const webhookBody = JSON.parse(bodyString);
    const event = webhookBody.event;
    const payment = webhookBody.payload.payment?.entity;
    const orderId = payment?.order_id;

    if (!orderId) return res.status(400).json({ status: 'orderId missing' });

    const purchase = await subscriptionPurchaseRepository.getPurchaseHistoryByOrderId(orderId);
    if (!purchase) return res.status(404).json({ status: 'order not found' });

    //Idempotency check
    if (purchase.purchaseStatus === PurchaseStatus.Completed) {
      return res.status(200).json({ status: 'already processed' });
    }

    //Update purchase based on event
    if (event === 'payment.captured') {
      await subscriptionPurchaseRepository.updatePurchaseHistory(orderId, {
        purchaseStatus: PurchaseStatus.Completed,
        planStatus: PlanStatus.Active,
        paymentId: payment.id,
        purchasedDate: new Date(),
        updatedAt: new Date(),
      });
      console.log(`Subscription for order ${orderId} activated via webhook.`);
    }

    if (event === 'payment.failed') {
      await subscriptionPurchaseRepository.updatePurchaseHistory(orderId, {
        purchaseStatus: PurchaseStatus.Failed,
        updatedAt: new Date(),
      });
      console.log(`Payment failed for order ${orderId}`);
    }

    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ status: 'error' });
  }
};

export default { handleRazorpayWebhook };
