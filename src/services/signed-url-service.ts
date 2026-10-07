import ERROR from '../middlewares/web_server/http-error';
import crypto from 'crypto';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const generateSignedUrl = async (obj: any) => {
  const fileName = obj.fileName;
  const fieldName = obj.fieldName;
  if (!fileName) throw new ERROR.InvalidInputError('Failed to generate url. file name required!');
  if (!fieldName) throw new ERROR.InvalidInputError('Failed to generate url. field name required!');

  let extension = '';
  const extArr = fileName.split('.');
  if (extArr.length > 1) {
    extension = extArr[extArr.length - 1].toUpperCase();
  } else {
    throw new ERROR.InvalidInputError('Failed to generate url. invalid file name!');
  }

  const fileId = crypto.randomBytes(16).toString('hex');

  const REGION = process.env.AWS_BUCKET_REGION as string;
  const BUCKET = process.env.AWS_BUCKET_NAME as string;
  const KEY = fieldName + '/' + fileId + '.' + extension;
  const KEY_ID = process.env.AWS_ACCESS_KEY_ID as string;
  const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY as string;
  const URL_EXPIRE_TIME = 5 * 60;

  const params = {
    Bucket: BUCKET,
    Key: KEY,
  };

  const client = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: KEY_ID,
      secretAccessKey: SECRET_KEY,
    },
  });
  const command = new PutObjectCommand(params);

  const presignedUrl = await getSignedUrl(client, command, { expiresIn: URL_EXPIRE_TIME });
  return presignedUrl;
};

const generateGetSignedUrl = async (key: string) => {
  const REGION = process.env.AWS_BUCKET_REGION as string;
  const BUCKET = process.env.AWS_BUCKET_NAME as string;

  const client = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });

  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  const presignedUrl = await getSignedUrl(client, command, { expiresIn: 300 });

  return presignedUrl;
};

export default {
  generateSignedUrl,
  generateGetSignedUrl,
};
