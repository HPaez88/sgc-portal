import React, { useState, useMemo } from 'react';
import {
  Mail,
  Send,
  Bell,
  AlertTriangle,
  Clock,
  User,
  Building2,
  CheckCircle2,
  Copy,
  ExternalLink,
  X,
  Phone,
  Sparkles,
  History,
  ShieldAlert
} from 'lucide-react';
import ContenedorModal from '../common/ContenedorModal';
import { AREAS_DETALLE_INICIALES } from '../../constants/areas';
import { useToast } from '../common/Toast';
import { useSGC } from '../../SGCContext';

export default function ModalRecordatorioAtrasos({
  isOpen,
  onClose,
  listaIndicadores = [],
  resultados = {},
  reportesCorreccion = [],
  mesActivo = 'Oct',
  ejercicio = 2026,
  usuarioLogueado = null
}) {
  const toast = useToast();
  const { registrarMovimiento } = useSGC();

  const [areaSeleccionada, setAreaSeleccionada] = useState(null);
  const [tipoNotificacion, setTipoNotificacion] = useState('atraso'); // 'atraso' | 'general'
  const [asuntoCustom, setAsuntoCustom] = useState('');
  const [mensajeCustom, setMensajeCustom] = useState('');
  const [copiaSGC, setCopiaSGC] = useState(true);

  // Análisis de atrasos por área
  const atrasosPorArea = useMemo(() => {
    return AREAS_DETALLE_INICIALES.map(areaInfo => {
      // Indicadores pertenecientes a esta área
      const indicadoresArea = listaIndicadores.filter(ind => ind.area === areaInfo.nombre);

      // Cuántos no tienen captura en el mes activo
      const pendientesCaptura = indicadoresArea.filter(ind => {
        const k = `${ind.id}-${mesActivo}-${ejercicio}`;
        const res = resultados[k];
        return res === undefined || res?.valor === null || res?.valor === '';
      });

      // Reportes de corrección abiertos para esta área
      const rcsAbiertos = reportesCorreccion.filter(rc => 
        (rc.area === areaInfo.nombre || rc.area?.toLowerCase().includes(areaInfo.nombre.toLowerCase())) &&
        (rc.estado === 'ABIERTO' || rc.estado === 'EN_ATENCION' || rc.estado === 'ABIERTA')
      );

      const totalAtrasos = pendientesCaptura.length + rcsAbiertos.length;

      return {
        ...areaInfo,
        totalIndicadores: indicadoresArea.length,
        pendientesCaptura,
        rcsAbiertos,
        totalAtrasos,
        tieneAtraso: totalAtrasos > 0
      };
    }).sort((a, b) => b.totalAtrasos - a.totalAtrasos);
  }, [listaIndicadores, resultados, reportesCorreccion, mesActivo, ejercicio]);

  const areasConAtraso = useMemo(() => {
    return atrasosPorArea.filter(a => a.tieneAtraso);
  }, [atrasosPorArea]);

  // Al elegir un área, pre-redactar el correo institucional
  const prepararPlantillaParaArea = (areaItem) => {
    setAreaSeleccionada(areaItem);
    setTipoNotificacion('atraso');

    const listaNombres = areaItem.pendientesCaptura.slice(0, 5).map(i => `• #${i.numero}: ${i.nombre}`).join('\n');
    const extraPendientes = areaItem.pendientesCaptura.length > 5 ? `\n• ... y ${areaItem.pendientesCaptura.length - 5} indicadores más.` : '';

    const textoRcs = areaItem.rcsAbiertos.length > 0 
      ? `\nAsimismo, se tienen ${areaItem.rcsAbiertos.length} Reporte(s) de Corrección (RC) pendientes de solventar o verificar cierre.`
      : '';

    setAsuntoCustom(`[SGC OOMAPASC] Aviso Oficial: Atraso en Captura de Indicadores OOMRSC-05 - ${areaItem.nombre}`);
    setMensajeCustom(
`Estimado(a) ${areaItem.encargado},
Titular del área: ${areaItem.nombre} (${areaItem.direccion})
OOMAPASC de Cajeme

Por medio del presente recordatorio del Sistema de Gestión de Calidad (ISO 9001:2015 § 9.1), le informamos que al corte del período ${mesActivo} de ${ejercicio}, se registran ${areaItem.pendientesCaptura.length} indicador(es) oficial(es) pendientes de captura en el formato OOMRSC-05:

${listaNombres}${extraPendientes}
${textoRcs}

Le recordamos que conforme a la directriz institucional, la captura y ratificación de mediciones debe completarse puntualmente para la integración de la Revisión por la Dirección y Fichas PMD del Ayuntamiento.

Agradecemos ingresar a la brevedad a la plataforma para regularizar su información:
https://sgc-portal-933s.onrender.com/#/indicadores

Atentamente,
Coordinación del Sistema de Gestión de la Calidad
OOMAPASC de Cajeme`
    );
  };

  const handlePrepararMensajeGeneral = () => {
    setAreaSeleccionada(null);
    setTipoNotificacion('general');
    setAsuntoCustom(`[SGC OOMAPASC] Comunicado Importante: Cumplimiento de Metas y Cierre de Indicadores ${ejercicio}`);
    setMensajeCustom(
`Estimados Gerentes, Directores y Encargados de Área de OOMAPASC,

Se les recuerda que estamos en el proceso de consolidación de resultados de indicadores OOMRSC-05 y Fichas Gubernamentales PMD del ejercicio fiscal ${ejercicio}.

Favor de verificar que sus áreas cuenten con:
1. Resultados capturados al 100% en los meses concluidos.
2. Justificaciones y solicitudes de Reporte de Corrección (RC) para aquellos indicadores en semáforo preventivo o crítico.
3. Desglose y cuantificación del ejercicio presupuestario por capítulos.

Para cualquier duda o soporte técnico, el equipo del SGC está a su disposición.

Atentamente,
Lic. Héctor Manuel Páez León / Coordinación SGC
OOMAPASC de Cajeme`
    );
  };

  // Abrir cliente de correo (Outlook, etc.) mediante mailto URI
  const handleAbrirMailto = () => {
    const destinatario = areaSeleccionada ? areaSeleccionada.correo : 'calidad@oomapasc.gob.mx';
    const cc = copiaSGC ? 'calidad@oomapasc.gob.mx,hpaez@oomapasc.gob.mx' : '';
    
    let mailtoUrl = `mailto:${encodeURIComponent(destinatario)}?subject=${encodeURIComponent(asuntoCustom)}&body=${encodeURIComponent(mensajeCustom)}`;
    if (cc) {
      mailtoUrl += `&cc=${encodeURIComponent(cc)}`;
    }

    window.open(mailtoUrl, '_blank');

    registrarMovimiento?.({
      modulo: 'INDICADORES',
      accion: 'ENVIAR_RECORDATORIO_CORREO',
      descripcion: `Envío de correo de recordatorio a ${areaSeleccionada?.encargado || 'Áreas OOMAPASC'} (${areaSeleccionada?.nombre || 'General'})`,
      detalles: `Asunto: ${asuntoCustom} · Destinatario: ${destinatario}`,
      folio: `MAIL-${Date.now().toString().slice(-6)}`
    });

    toast.success('Abriendo cliente de correo institucional con plantilla pre-llenada...');
  };

  // Copiar al portapapeles
  const handleCopiarPortapapeles = () => {
    navigator.clipboard.writeText(`${asuntoCustom}\n\n${mensajeCustom}`);
    toast.success('Texto del correo copiado al portapapeles.');
  };

  if (!isOpen) return null;

  return (
    <ContenedorModal isOpen={isOpen} onClose={onClose} size="6xl" anchoMaximo="max-w-[94vw] xl:max-w-[1550px]">
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 w-full">
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-[#001f42] via-[#0B192C] to-[#1E3E62] text-white p-5 flex items-center justify-between border-b border-sky-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/20 rounded-xl border border-sky-400/30 text-sky-300">
              <Mail size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider">
                  Comunicación & Seguimiento SGC
                </span>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-mono">
                  {mesActivo} {ejercicio}
                </span>
              </div>
              <h3 className="text-lg font-black text-white">
                Centro de Recordatorios y Notificaciones por Correo a Áreas
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido dividido en 2 columnas: Lista de Áreas con Atraso y Redactor de Correo */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 max-h-[78vh] overflow-y-auto">
          {/* Columna Izquierda: Áreas con Atraso Detectado */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle size={15} className="text-amber-500" />
                Áreas con Atraso ({areasConAtraso.length})
              </h4>
              <button
                type="button"
                onClick={handlePrepararMensajeGeneral}
                className="text-[11px] font-bold text-sky-700 hover:text-sky-900 underline cursor-pointer"
              >
                Aviso General
              </button>
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {areasConAtraso.map((area) => {
                const seleccionada = areaSeleccionada?.areaId === area.id;
                return (
                  <div
                    key={area.id}
                    onClick={() => prepararPlantillaParaArea(area)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      seleccionada
                        ? 'bg-sky-50 border-sky-400 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block truncate">
                          {area.direccion}
                        </span>
                        <h5 className="text-xs font-bold text-slate-900 truncate">
                          {area.nombre}
                        </h5>
                        <p className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1">
                          <User size={11} className="text-slate-400" />
                          {area.encargado}
                        </p>
                      </div>

                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 rounded-full font-mono font-extrabold text-[10px] shrink-0">
                        {area.totalAtrasos} pendiente{area.totalAtrasos > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500">
                      <span>{area.pendientesCaptura.length} ind. sin capturar</span>
                      <span>·</span>
                      <span>{area.rcsAbiertos.length} RC abiertos</span>
                    </div>
                  </div>
                );
              })}

              {areasConAtraso.length === 0 && (
                <div className="p-6 text-center bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs">
                  <CheckCircle2 size={24} className="mx-auto text-emerald-600 mb-2" />
                  <strong>¡Excelente desempeño!</strong>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    Todas las áreas operativas se encuentran al corriente en la captura de sus indicadores.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Redactor y Envio de Notificación */}
          <div className="md:col-span-7 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Destinatario</span>
                <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Mail size={13} className="text-sky-600" />
                  {areaSeleccionada ? `${areaSeleccionada.encargado} <${areaSeleccionada.correo}>` : 'Todos los Encargados de Área'}
                </h5>
              </div>

              {areaSeleccionada && (
                <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                  <Phone size={11} /> {areaSeleccionada.telefono}
                </span>
              )}
            </div>

            {/* Asunto */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Asunto del Correo Electrónico
              </label>
              <input
                type="text"
                value={asuntoCustom}
                onChange={(e) => setAsuntoCustom(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            {/* Cuerpo del Mensaje */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contenido del Comunicado Institucional
              </label>
              <textarea
                value={mensajeCustom}
                onChange={(e) => setMensajeCustom(e.target.value)}
                rows={11}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-sky-500 outline-none font-mono leading-relaxed resize-none"
              />
            </div>

            {/* Opciones */}
            <div className="flex items-center justify-between text-xs text-slate-600">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={copiaSGC}
                  onChange={(e) => setCopiaSGC(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span className="font-medium">Enviar con copia a Coordinación SGC</span>
              </label>

              <button
                type="button"
                onClick={handleCopiarPortapapeles}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                <Copy size={12} /> Copiar Texto
              </button>
            </div>

            {/* Botones de Envío */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleAbrirMailto}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send size={14} /> Abrir en Cliente de Correo (Outlook / Webmail)
              </button>
            </div>
          </div>
        </div>

        {/* Pie */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Conforme a ISO 9001:2015 § 7.4 (Comunicación) y POL-TI-01.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </ContenedorModal>
  );
}
