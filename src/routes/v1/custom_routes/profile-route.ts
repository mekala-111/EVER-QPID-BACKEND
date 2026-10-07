import { Router } from 'express';
import profileController from '../../../controllers/profile-controller';
import { verifyUser } from '../../../middlewares/auth/verify-user';
import { verifyAdmin } from '../../../middlewares/auth/verify-admin';

const profileRouter = (router: Router) => {
  // USER
  router.route('/get-profile').get(verifyUser, profileController.getProfile);
  router.route('/update-profile').put(verifyUser, profileController.updateProfile);
  router.route('/users/get-all-profiles').get(verifyUser, profileController.getAllProfilesUsers);
  router.route('/users/upload-profile-image').post(verifyUser, profileController.uploadImages);
  router.route('/online-status-change').put(verifyUser, profileController.changeOnlineStatus);
  //router.route('/users/audio-video/perminute').post(verifyUser, profileController.setAudioVidioPerMinSubscribedUsers);
  router.route('/users/get-all-nearest-profiles').get(verifyUser, profileController.getNearestProfiles);
  router.route('/users/get-other-profile/:profileId').get(verifyUser, profileController.getOtherProfileDetails);
  router.route('/delete-profile-user').post(verifyUser, profileController.deleteProfileUser);
  router.route('/save-recent-pass-users').post(verifyUser, profileController.saveRecentPassUsers);
  router.route('/get-recent-pass-users').get(verifyUser, profileController.listRecentPassUsers);
  router.route('/get-search-filter').get(verifyUser, profileController.getSearchFilter);
  router.route('/add-preference').post(verifyUser, profileController.updateUserPreferenceFilter);
  //router.route('/get-search-filter/:userId').get(verifyUser, profileController.getOtherUserSearchFilter);
  router.route('/reset-preference').post(verifyUser, profileController.resetUserPreferenceFilter);

  //ADMIN
  router.route('/admin/get-all-profiles').get(verifyAdmin, profileController.getAllProfilesAdmin);
  router.route('/admin/get-profiles-details/:userId').get(verifyAdmin, profileController.getProfileDetails);
  router.route('/admin/add-notes').post(verifyAdmin, profileController.addNotes);
  router.route('/admin/notes/:userId').get(verifyAdmin, profileController.getUserNotes);
  router.route('/admin/get-all-female-users').get(verifyAdmin, profileController.getAllFemaleUsers);
  router.route('/admin/get-all-male-users').get(verifyAdmin, profileController.getAllMaleUsers);
  router.route('/admin/photos/:userId').get(verifyAdmin, profileController.getUserPhotos);
  router.route('/admin/matches/:userId').get(verifyAdmin, profileController.getUserMatchesByAdmin);
  router.route('/admin/photos/all/:userId').delete(verifyAdmin, profileController.removeAllUserPhotosByAdmin);
  router.route('/admin/photos/:userId/:photoIndex').delete(verifyAdmin, profileController.removeUserPhotoByAdmin);

  return router;
};
export default profileRouter;
