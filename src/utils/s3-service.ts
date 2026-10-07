import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const REGION = process.env.AWS_BUCKET_REGION as string;
const BUCKET = process.env.AWS_BUCKET_NAME as string;
const KEY_ID = process.env.AWS_ACCESS_KEY_ID as string;
const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY as string;

const client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: KEY_ID,
    secretAccessKey: SECRET_KEY,
  },
});

/**
 * Delete a file from S3
 * @param bucketName - Name of the S3 bucket
 * @param fileKey - The key (path) of the file in S3
 */
export const deleteFileFromS3 = async (fileUrl: string): Promise<void> => {
  const fileKey = fileUrl.split('.com/')[1];
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: fileKey,
    });

    await client.send(command);
    console.log(`File deleted successfully: ${fileKey}`);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};
