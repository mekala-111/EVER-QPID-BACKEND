// import { Request, Response, NextFunction } from 'express';
// import ERROR from '../web_server/http-error';
// import admin from '../../frameworks/firebase/firebaseConfig';

// /**
//  * @function verifyAuthToken //verify header token and extract user ID compare user id extracted with uid in request body
//  * @param req
//  * @param res
//  * @param next
//  */
// export const verifyAuthToken = (req: Request, res: Response, next: NextFunction) => {

//     const idToken: any = req.headers['id-token'];

//     if (!idToken) throw new ERROR.BadRequestError('Authorization Error: Id Token missing!');

//     admin.auth().verifyIdToken(idToken).then((decodedToken) => {
//         if (decodedToken && decodedToken.uid) {
//             const uidExtracted = decodedToken.uid;
//             req.body.userIdFb = uidExtracted;
//             next();
//         } else {
//             throw new ERROR.HttpError('Authorization Error: Id token verification failed!');
//         }

//     }).catch((error) => {
//         next(error);
//     });

// };
