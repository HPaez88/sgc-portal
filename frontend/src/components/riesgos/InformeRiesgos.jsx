// Informe de riesgos y oportunidades por área, por dirección o del organismo, con comparativo contra
// años anteriores, hallazgos para decidir y descarga en PDF. Las áreas solo ven el informe de su área.
import React, { useMemo, useState } from 'react';
import { FileDown, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import MapaCalor from './MapaCalor';
import { useToast } from '../common/Toast';
import { CLAVE_MATRIZ, ESTADOS_RIESGO, nivelDe, puntaje, estadoRiesgo, idMatriz } from '../../constants/riesgos';
import { resumenRiesgos, desgloseRiesgos, comparativoAnual, hallazgosRiesgos } from '../../constants/riesgosInforme';
import { direccionDeRegistro, normalizarDireccion } from '../../constants/areas';
import { getVencimiento, formatearFecha } from '../../constants/workflow';
import { exportarInformeRiesgosPDF } from '../../services/riesgosExporter';

const sinDir = (d) => String(d || '').replace(/^Dir\.\s*/, '');
const TONO = {
  alerta: ['bg-rose-50 border-rose-200 text-rose-900', AlertTriangle],
  bien: ['bg-emerald-50 border-emerald-200 text-emerald-900', CheckCircle2],
  info: ['bg-slate-50 border-slate-200 text-slate-800', Info],
};

function Seccion({ n, titulo, nota, children }) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 break-inside-avoid">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-2">
        <h4 className="text-sm font-extrabold text-slate-900">{n}. {titulo}</h4>
        {nota && <p className="text-[11px] text-slate-500">{nota}</p>}
      </header>
      {children}
    </section>
  );
}

function Cifra({ valor, etiqueta, nota, tono = 'text-slate-900' }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className={`text-2xl font-black ${tono}`}>{valor ?? '—'}</p>
      <p className="text-xs font-bold text-slate-700">{etiqueta}</p>
      {nota && <p className="text-[11px] text-slate-500">{nota}</p>}
    </div>
  );
}

export default function InformeRiesgos({ lista, enCaptura = 0, planesMejora, areasDetalle, matrices, anio, puedeTodasAreas, areaUsuario, usuarioLogueado }) {
  const toast = useToast();
  const direcciones = useMemo(() => [...new Set(areasDetalle.map((a) => normalizarDireccion(a.direccion)).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')), [areasDetalle]);
  const areas = useMemo(() => areasDetalle.map((a) => a.nombre).sort((a, b) => a.localeCompare(b, 'es')), [areasDetalle]);
  const [alcance, setAlcance] = useState(puedeTodasAreas ? 'ORG' : `A:${areaUsuario}`);

  const dirDe = (r) => normalizarDireccion(direccionDeRegistro(r, areasDetalle));
  const [tipoAlc, valorAlc] = alcance === 'ORG' ? ['ORG', ''] : [alcance.slice(0, 1), alcance.slice(2)];
  const enAlcance = (r) => tipoAlc === 'ORG' || (tipoAlc === 'D' ? dirDe(r) === valorAlc : r.area === valorAlc);
  const nombreAlcance = tipoAlc === 'ORG' ? 'OOMAPAS de Cajeme (todas las direcciones)' : tipoAlc === 'D' ? valorAlc : `Área: ${valorAlc}`;

  const delAlcance = lista.filter(enAlcance);
  const items = delAlcance.filter((r) => Number(r.anio) === Number(anio));
  const actual = resumenRiesgos(items, planesMejora);
  const aniosConDatos = [...new Set(delAlcance.map((r) => Number(r.anio)))].filter((a) => a < anio && a >= anio - 3);
  const comparativo = comparativoAnual(delAlcance, planesMejora, [...aniosConDatos, anio]);
  const anterior = comparativo.find((c) => c.anio === anio - 1) || null;

  const [porNombre, claveDesglose] = tipoAlc === 'ORG' ? ['Dirección', (r) => sinDir(dirDe(r))] : tipoAlc === 'D' ? ['Área', (r) => r.area] : ['Proceso', (r) => r.proceso];
  const desglose = desgloseRiesgos(items, planesMejora, claveDesglose);

  const areasDelAlcance = tipoAlc === 'A' ? [valorAlc] : areasDetalle.filter((a) => tipoAlc === 'ORG' || normalizarDireccion(a.direccion) === valorAlc).map((a) => a.nombre);
  const cobertura = { total: areasDelAlcance.length, aceptadas: areasDelAlcance.filter((a) => matrices.find((m) => m.id === idMatriz(a, anio))?.estado === 'ACEPTADA').length };
  const hallazgos = hallazgosRiesgos({ actual, anterior, desglose, cobertura, anio });

  const altos = items.filter((r) => r.tipo === 'Riesgo' && nivelDe(r)?.nivel === 'Alto').sort((a, b) => puntaje(b) - puntaje(a)).map((r) => {
    const pm = planesMejora.find((p) => String(p.id) === String(r.pm_id));
    const venc = pm ? getVencimiento(pm) : null;
    return { r, pm, estado: estadoRiesgo(r, planesMejora), venc: venc?.nivel === 'cerrado' ? null : venc };
  });
  const maxAnio = Math.max(1, ...comparativo.map((c) => c.riesgos));

  const descargar = () => {
    try {
      const archivo = exportarInformeRiesgosPDF({ nombreAlcance, anio, actual, comparativo, desglose, porNombre, hallazgos, altos, items, usuario: usuarioLogueado?.nombre });
      toast.success(`Informe descargado: ${archivo}`);
    } catch (e) {
      console.error('Informe de riesgos PDF', e);
      toast.error('No se pudo generar el PDF. Intenta de nuevo.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 p-4">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Informe {CLAVE_MATRIZ} · {anio} · emitido {formatearFecha(new Date().toISOString())}</p>
          <h3 className="text-lg font-extrabold text-slate-900">{nombreAlcance}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {puedeTodasAreas && (
            <select value={alcance} onChange={(e) => setAlcance(e.target.value)} aria-label="Alcance del informe" className="p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold max-w-xs">
              <option value="ORG">Todo el organismo</option>
              <optgroup label="Por dirección">{direcciones.map((d) => <option key={d} value={`D:${d}`}>{d}</option>)}</optgroup>
              <optgroup label="Por área">{areas.map((a) => <option key={a} value={`A:${a}`}>{a}</option>)}</optgroup>
            </select>
          )}
          <button type="button" onClick={descargar} disabled={!items.length} className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-40 inline-flex items-center gap-1"><FileDown size={14} /> Descargar PDF</button>
        </div>
      </div>

      {enCaptura > 0 && <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">El informe solo incluye lo aceptado por el SGC. {enCaptura} registro(s) de {anio} siguen en captura o revisión.</p>}

      <Seccion n={1} titulo="Resumen" nota={`${actual.total} registro(s) en ${anio}`}>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
          <Cifra valor={actual.riesgos} etiqueta="Riesgos" nota={`${actual.oportunidades} oportunidades`} />
          <Cifra valor={actual.altos} etiqueta="Riesgos altos" tono="text-rose-700" nota={anterior ? `${anterior.altos} en ${anio - 1}` : `${actual.medios} medios · ${actual.bajos} bajos`} />
          <Cifra valor={actual.nivelPromedio} etiqueta="Nivel promedio" nota="escala 2 a 50" />
          <Cifra valor={actual.conPM} etiqueta="Con plan de mejora" nota={`${actual.vencidos} vencido(s)`} tono={actual.vencidos ? 'text-amber-700' : 'text-slate-900'} />
          <Cifra valor={actual.porDictaminar} etiqueta="Por dictaminar" tono={actual.porDictaminar ? 'text-violet-700' : 'text-slate-900'} />
          <Cifra valor={actual.eficacia != null ? `${actual.eficacia}%` : null} etiqueta="Eficacia" nota={`${actual.eficaces} de ${actual.dictaminados} dictaminados`} tono="text-emerald-700" />
        </div>
      </Seccion>

      <Seccion n={2} titulo="Hallazgos para la toma de decisiones">
        <ul className="space-y-1.5">
          {hallazgos.map((h, i) => {
            const [cls, Icono] = TONO[h.tono];
            return <li key={i} className={`flex gap-2 items-start text-xs border rounded-lg px-3 py-2 ${cls}`}><Icono size={14} className="shrink-0 mt-0.5" />{h.texto}</li>;
          })}
        </ul>
      </Seccion>

      <Seccion n={3} titulo="Comparativo con años anteriores" nota={comparativo.length < 2 ? 'Aún no hay años anteriores registrados' : `${comparativo[0].anio} a ${anio}`}>
        <div className="space-y-1.5" aria-label="Riesgos por nivel y año">
          {comparativo.map((c) => (
            <div key={c.anio} className="grid grid-cols-[48px_1fr_36px] gap-3 items-center text-xs">
              <span className={`font-bold ${c.anio === anio ? 'text-slate-900' : 'text-slate-500'}`}>{c.anio}</span>
              <div className="flex h-5 rounded-md overflow-hidden bg-slate-100" title={`Alto ${c.altos} · Medio ${c.medios} · Bajo ${c.bajos}`}>
                {[['altos', 'bg-rose-500'], ['medios', 'bg-amber-400'], ['bajos', 'bg-emerald-500']].map(([k, col]) => (
                  c[k] ? <div key={k} className={`${col} text-[10px] font-bold text-white flex items-center justify-center`} style={{ width: `${(c[k] / maxAnio) * 100}%` }}>{c[k]}</div> : null
                ))}
              </div>
              <span className="text-right font-bold text-slate-700">{c.riesgos}</span>
            </div>
          ))}
          <p className="text-[11px] text-slate-500">Riesgos por nivel. Rojo: alto · ámbar: medio · verde: bajo.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <caption className="sr-only">Comparativo anual</caption>
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr><th scope="col" className="p-2 text-left">Año</th><th scope="col" className="p-2 text-center">Riesgos</th><th scope="col" className="p-2 text-center">Altos</th><th scope="col" className="p-2 text-center">Nivel promedio</th><th scope="col" className="p-2 text-center">Oportunidades</th><th scope="col" className="p-2 text-center">Con plan</th><th scope="col" className="p-2 text-center">Eficacia</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparativo.map((c) => (
                <tr key={c.anio} className={c.anio === anio ? 'font-semibold' : ''}>
                  <th scope="row" className="p-2 text-left">{c.anio}</th>
                  <td className="p-2 text-center">{c.riesgos}</td><td className="p-2 text-center text-rose-700">{c.altos}</td>
                  <td className="p-2 text-center">{c.nivelPromedio ?? '—'}</td><td className="p-2 text-center">{c.oportunidades}</td>
                  <td className="p-2 text-center">{c.conPM}</td><td className="p-2 text-center">{c.eficacia != null ? `${c.eficacia}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Seccion>

      <Seccion n={4} titulo="Mapas de calor" nota="Probabilidad × impacto">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          <MapaCalor tipo="Riesgo" items={items.filter((r) => r.tipo === 'Riesgo')} />
          <MapaCalor tipo="Oportunidad" items={items.filter((r) => r.tipo === 'Oportunidad')} />
        </div>
      </Seccion>

      <Seccion n={5} titulo={`Desglose por ${porNombre.toLowerCase()}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr><th scope="col" className="p-2 text-left">{porNombre}</th><th scope="col" className="p-2 text-center">Riesgos</th><th scope="col" className="p-2 text-center">Altos</th><th scope="col" className="p-2 text-center">Medios</th><th scope="col" className="p-2 text-center">Oportunidades</th><th scope="col" className="p-2 text-center">Con plan</th><th scope="col" className="p-2 text-center">Vencidos</th><th scope="col" className="p-2 text-center">Eficacia</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {desglose.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-slate-500">Sin registros en {anio}.</td></tr>}
              {desglose.map((g) => (
                <tr key={g.nombre}>
                  <th scope="row" className="p-2 text-left font-semibold text-slate-900">{g.nombre}</th>
                  <td className="p-2 text-center">{g.riesgos}</td><td className="p-2 text-center font-bold text-rose-700">{g.altos || ''}</td>
                  <td className="p-2 text-center text-amber-700">{g.medios || ''}</td><td className="p-2 text-center">{g.oportunidades}</td>
                  <td className="p-2 text-center">{g.conPM}</td><td className={`p-2 text-center ${g.vencidos ? 'font-bold text-rose-700' : ''}`}>{g.vencidos || ''}</td>
                  <td className="p-2 text-center">{g.eficacia != null ? `${g.eficacia}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Seccion>

      <Seccion n={6} titulo="Riesgos altos y su tratamiento" nota={`${altos.length} riesgo(s)`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr><th scope="col" className="p-2 text-left">Nivel</th><th scope="col" className="p-2 text-left">Riesgo</th><th scope="col" className="p-2 text-left">Área</th><th scope="col" className="p-2 text-left">Tratamiento</th><th scope="col" className="p-2 text-left">Plan de mejora</th><th scope="col" className="p-2 text-left">Estado</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {altos.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-500">Sin riesgos altos en {anio}.</td></tr>}
              {altos.map(({ r, pm, estado, venc }) => (
                <tr key={r.id}>
                  <td className="p-2"><span className={`inline-block w-10 text-center px-1.5 py-0.5 rounded-md font-black border ${nivelDe(r).suave}`}>{puntaje(r)}</span></td>
                  <td className="p-2 max-w-sm text-slate-900">{r.descripcion}{r.proceso && <span className="block text-[11px] text-slate-500">{r.proceso}</span>}</td>
                  <td className="p-2 text-slate-700">{r.area}</td>
                  <td className="p-2 text-slate-700">{r.tratamiento || '—'}</td>
                  <td className="p-2">{pm ? <span className="font-mono font-bold text-sky-700">{pm.folio_codigo}</span> : <span className="text-slate-500">—</span>}{venc && <span className={`block w-fit mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${venc.color}`}>{venc.label}</span>}</td>
                  <td className="p-2"><span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${ESTADOS_RIESGO[estado]?.color || ''}`}>{ESTADOS_RIESGO[estado]?.label || estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Seccion>
    </div>
  );
}
