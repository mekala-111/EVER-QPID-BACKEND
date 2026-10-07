import { Request, Response, NextFunction } from 'express';
import ApiResponse from '../utils/api-response';
import hideContactService from '../services/contact-hide-service';

const importContacts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const loginUserId = req.body.loginUserId;
    const contacts = req.body.contacts;

    const data = await hideContactService.importContacts(loginUserId, contacts);

    const response = new ApiResponse();
    response.status = true;
    response.statusCode = 200;
    response.message = 'Contacts Imported & Hidden';
    response.data = data;

    res.json(response);
  } catch (err) {
    next(err);
  }
};

const getHiddenContacts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    //const loginUserId = req.user.id;
    const { userId } = req.body;

    const data = await hideContactService.getHiddenContacts(userId);

    const response = new ApiResponse();
    response.status = true;
    response.statusCode = 200;
    response.message = 'Hidden contacts fetched';
    response.data = data;

    res.json(response);
  } catch (err) {
    next(err);
  }
};

interface RemoveHiddenContactsBody {
  loginUserId: string;
  contacts: string[];
}

const removeHiddenContact = async (req: Request<{}, {}, RemoveHiddenContactsBody>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { loginUserId, contacts } = req.body;

    if (!loginUserId || !contacts || !Array.isArray(contacts) || contacts.length === 0) {
      res.status(400).json({
        status: false,
        statusCode: 400,
        message: 'loginUserId and contacts array are required',
      });
      return;
    }

    const data = await hideContactService.removeHiddenContact(loginUserId, contacts);

    res.json({
      status: true,
      statusCode: 200,
      message: 'Contacts removed from hidden',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export default {
  importContacts,
  getHiddenContacts,
  removeHiddenContact,
};
