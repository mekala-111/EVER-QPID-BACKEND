import AWS from 'aws-sdk';
import axios from 'axios';
import dotenv from 'dotenv';
import ERROR from '../middlewares/web_server/http-error';
import { deleteFileFromS3 } from './s3-service';
dotenv.config();

// Configure AWS Rekognition
const rekognition = new AWS.Rekognition({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_BUCKET_REGION,
});

const normalizeAwsGender = (awsGender: 'Male' | 'Female'): 'Man' | 'Women' => {
  return awsGender === 'Male' ? 'Man' : 'Women';
};

/**
 * Download an image from a URL and return as a Buffer
 * @param {string} imageUrl - The URL of the image
 * @returns {Promise<Buffer | null>}
 */
async function getImageBuffer(imageUrl: string): Promise<Buffer | null> {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    return Buffer.from(response.data, 'binary');
  } catch (error) {
    console.error('Error downloading image:', error);
    return null;
  }
}

/**
 * Detect face attributes (including gender) from an image
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<string | null>} - Returns "Male", "Female", or null
 */
async function detectFaceAttributes(imageBuffer: Buffer): Promise<'Male' | 'Female'> {
  const params: AWS.Rekognition.DetectFacesRequest = {
    Image: { Bytes: imageBuffer },
    Attributes: ['ALL'],
  };

  const response = await rekognition.detectFaces(params).promise();
  const face = response.FaceDetails?.[0];

  if (!face?.Gender?.Value) {
    throw new ERROR.ValidationError('Unable to detect gender from image.');
  }

  return face.Gender.Value as 'Male' | 'Female';
}

const validateFacePresence = async (imageBuffer: Buffer, label: string) => {
  const params: AWS.Rekognition.DetectFacesRequest = {
    Image: { Bytes: imageBuffer },
    Attributes: ['DEFAULT'],
  };

  const response = await rekognition.detectFaces(params).promise();
  if (!response.FaceDetails || response.FaceDetails.length === 0) {
    throw new ERROR.BadRequestError(`No face detected in the ${label} image.`);
  }
};

/**
 * Compare two face images from URLs using AWS Rekognition
 */
export async function compareFacesFromUrls(
  url1: string,
  url2: string,
  expectedGender?: 'Man' | 'Women' | 'Other',
): Promise<{ isFaceMatch: boolean; genderMatches: boolean }> {
  const imageBuffer1 = await getImageBuffer(url1);
  const imageBuffer2 = await getImageBuffer(url2);

  if (!imageBuffer1 || !imageBuffer2) {
    throw new ERROR.BadRequestError('Failed to download one or both images.');
  }

  await validateFacePresence(imageBuffer1, 'profile image');
  await validateFacePresence(imageBuffer2, 'selfie image');

  // 🔹 Face comparison
  const compareResponse = await rekognition
    .compareFaces({
      SourceImage: { Bytes: imageBuffer1 },
      TargetImage: { Bytes: imageBuffer2 },
      SimilarityThreshold: 80,
    })
    .promise();

  const similarity = compareResponse.FaceMatches?.[0]?.Similarity ?? 0;

  if (similarity < 80) {
    await deleteFileFromS3(url2);
    throw new ERROR.ValidationError('The selected image does not match');
  }

  // 🔹 Skip gender check if not required
  if (!expectedGender || expectedGender === 'Other') {
    return { isFaceMatch: true, genderMatches: true };
  }

  // 🔹 Detect gender ONLY from selfie
  const awsGender = await detectFaceAttributes(imageBuffer2);
  const detectedGender = normalizeAwsGender(awsGender);

  if (detectedGender !== expectedGender) {
    await deleteFileFromS3(url2);
    throw new ERROR.ValidationError(`Gender does not match the expected gender: ${expectedGender}`);
  }

  return { isFaceMatch: true, genderMatches: true };
}
