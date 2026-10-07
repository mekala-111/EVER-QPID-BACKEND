import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import * as fs from 'fs';
import ERROR from '../web_server/http-error';

const uploadFromDisk = async (filePath: string, folderName: string, fileName: string) => {
  const fileContent = fs.readFileSync(`${filePath}`);
  if (!fs.existsSync(filePath)) {
    console.error(`File does not exist at path: ${filePath}`);
  }
  console.log('File size:', fileContent.length, 'bytes');

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID as string;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY as string;

  const s3 = new S3Client({
    region: process.env.AWS_BUCKET_REGION as string,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
  });

  const bucket = process.env.AWS_BUCKET_NAME as string;

  try {
    let data: any = await new Upload({
      client: s3,
      params: {
        ACL: 'bucket-owner-full-control',
        Bucket: bucket,
        Key: `${folderName}/${fileName}`,
        Body: fileContent,
      },
      tags: [], // optional tags
      queueSize: 4, // optional concurrency configuration
      partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
      leavePartsOnError: false, // optional manually handle dropped parts
    }).done();

    if (data.Location) {
      return data.Location;
    } else {
      throw new ERROR.HttpError('AWS error! Faild to upload file to storage!');
    }
  } catch (err) {
    throw new ERROR.HttpError('AWS error! Faild to upload file to storage!');
  }
};

export default uploadFromDisk;
