import { generarPlanMejoraInfalible } from '../../services/aiClient';

export const generarPlanMejoraIA = async (descripcion, area, proceso) => {
  return await generarPlanMejoraInfalible(descripcion, area, proceso);
};
