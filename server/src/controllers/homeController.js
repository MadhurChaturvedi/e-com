import { homeService } from '../services/homeService.js';
import { successResponse } from '../utils/apiResponse.js';

export const getHomeData = async (req, res, next) => {
  try {
    const data = await homeService.getHomePayload();
    return successResponse(res, data, 'Home sections data retrieved.');
  } catch (error) {
    next(error);
  }
};
