import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoSanitize from 'express-mongo-sanitize';
import { webhookController } from './controllers';

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use((req, res, next) => {
  if (req.originalUrl === '/api/v1/webhook/razorpay') {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use('/download', express.static('download'));
app.post('/api/v1/webhook/razorpay', bodyParser.raw({ type: 'application/json' }), webhookController.handleRazorpayWebhook);

export default app;
