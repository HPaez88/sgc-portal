import { generarPropuestaACInfalible } from '../../services/aiClient';

export const generarPropuestaIA = async (form, equipo) => {
  return await generarPropuestaACInfalible(form, equipo);
};
