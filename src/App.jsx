import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard, User, ClipboardList, TrendingUp, FileText, Users, LogOut,
  Search, Bell, ChevronLeft, Wrench, CheckCircle2, AlertCircle,
  Mail, FileDown, Camera, Trash2, Cpu, Database, Upload, Download,
  FileSpreadsheet, X, CheckCircle, AlertTriangle, Plus, Pencil,
  Lock, Eye, EyeOff, ShieldAlert, Settings, MoreVertical
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from './supabaseClient';

// --- CONSTANTES ---
const APP_NAME = "Sentauris ERP";

const MOCK_USER = {
  id: 'u1', name: 'Arquitecto Senior', email: 'admin@sentauris.cl',
  role: 'Superadmin', position: 'Director de Operaciones',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
};

const EQUIPOS_CONFIG = {
  "CAMAS MULTIMARCA": {
    marca: ["Hill-Rom", "Stryker", "Linet"],
    protocolo: [
      { section: "Sistemas mecánicos", items: ["Límites de cabeza", "Límites de pies", "Límites Hi-Low", "Movimiento Trendelenburg", "Movimiento Trendelenburg inverso", "Movimiento manual respaldo", "Movimiento manual piernas", "Movimiento manual Hi-Low", "Puntos pivotantes", "Tornillo sin fin"] },
      { section: "Sistemas de control", items: ["Switch de bloqueo de cama", "Control remoto (baranda)", "Control remoto (pies)", "Controles de baranda", "Tarjeta electrónica de mando", "Otras tarjetas electrónicas", "Diodos LED indicadores"] },
      { section: "Sistemas eléctricos", items: ["Cable de poder", "Baterías", "Motores eléctricos", "Conectores eléctricos"] },
      { section: "Sistemas de seguridad", items: ["Sistema CPR", "Sistema de freno", "Sistema de dirección", "Sistema steer / quinta rueda", "Pedal freno / steer"] },
      { section: "Hidráulicos y Gas", items: ["Sistemas hidráulicos", "Cilindros hidráulicos", "Gas Spring respaldo", "Gas Spring pies", "Gas Spring Hi-Low", "Gas Spring barandas"] },
      { section: "Estructura", items: ["Estructura de baranda", "Respaldos pies y cabeza", "Apariencia estructural", "Bumper laterales", "Cubiertas superiores", "Cubiertas acrílicas", "Pintura", "Instalación de cubiertas"] }
    ]
  },
  "LÁMPARAS QUIRÚRGICAS": {
    marca: ["Steris", "Maquet", "Dräger"],
    protocolo: [
      { section: "Óptica y Estructura", items: ["Estado estructural", "Limpieza", "Domo y óptica", "Encendido/apagado", "Intensidad luminosa", "Color luz", "LEDs/bombillas"] },
      { section: "Movimiento", items: ["Movimiento completo", "Articulaciones", "Brazos", "Resortes/tensión"] },
      { section: "Electrónica", items: ["Conexiones", "Lubricación", "Cableado", "Sistema emergencia", "UPS/batería", "Tierra eléctrica"] }
    ]
  },
  "MONITORES MULTIPARÁMETROS": {
    marca: ["Mindray", "Philips", "GE Healthcare"],
    protocolo: [
      { section: "Físico", items: ["Integridad física", "Accesorios", "Batería", "Encendido", "Panel táctil", "Alarmas"] },
      { section: "Parámetros", items: ["ECG", "PNI", "SpO2", "PI", "Temperatura", "Configuración"] }
    ]
  }
};

const PREVENTIVE_PROTOCOLS = {
  camas: {
    title: 'Protocolo de Mantenimiento Preventivo Generico - Camas Multimarca',
    sections: [
      { section: 'Movimientos y limites', items: ['Limites de cabeza', 'Limites de pies', 'Limites de Hi-Low (bloque)', 'Limites de Trendelenburg e inverso', 'Movimiento manual respaldo', 'Movimiento manual piernas', 'Movimiento manual Hi-Low'] },
      { section: 'Control y seguridad', items: ['Switch de bloqueo de cama', 'Sistema de freno y direccion (steer)', 'Sistema de steer quinta rueda', 'Controles de baranda', 'Control remoto con cable de baranda', 'Control remoto con cable sector pies', 'Sistema accionamiento CPR', 'Pedal frenos / steer'] },
      { section: 'Sistema electrico', items: ['Cable de poder', 'Balanza de cama', 'Tarjeta electronica de mando control', 'Otras tarjetas (baranda, columna, control remoto)', 'Baterias', 'Motores, conectores', 'Diodos LED indicadores', 'Luz nocturna'] },
      { section: 'Mecanica e hidraulica', items: ['Ruedas y pivote', 'Puntos pivotantes estructura', 'Sistema hidraulicos', 'Gas spring respaldo', 'Gas spring pies', 'Gas spring Hi-Low', 'Gas spring baranda', 'Cilindros hidraulicos movimiento Hi-Low', 'Tornillo sin fin'] },
      { section: 'Estructura y terminaciones', items: ['Estructura de baranda', 'Respaldos pies y cabeza', 'Apariencia estructural', 'Bumper laterales y esquineros', 'Estado de colchonetas', 'Cubiertas superiores', 'Pintado', 'Instalacion cubiertas acrilicas', 'Ruedas', 'KIT mantenimiento'] },
    ],
  },
  lamparas: {
    title: 'Protocolo de Mantenimiento Preventivo Lamparas Quirurgicas',
    sections: [
      { section: 'Inspeccion fisica y limpieza', items: ['Verificar estado de la estructura externa: grietas, rayones o deformaciones', 'Comprobar limpieza de superficies: polvo, manchas o residuos', 'Revisar cubierta del domo y lentes opticos por danos o suciedad', 'Limpiar todas las superficies con productos compatibles con el equipo medico', 'Aplicar protector para evitar corrosion si es necesario'] },
      { section: 'Iluminacion y operacion', items: ['Confirmar funcionamiento de luces: encender y apagar cada modulo', 'Comprobar intensidad luminosa en diferentes niveles de ajuste', 'Revisar color de luz: uniforme y sin parpadeos', 'Inspeccionar bombillas o LEDs por desgaste o fallas', 'Verificar interruptor de encendido/apagado'] },
      { section: 'Movimiento y soporte', items: ['Comprobar suavidad de movimiento: ajuste vertical, horizontal y rotacion', 'Verificar estado de articulaciones y frenos', 'Revisar cables de tension o resortes: sin holgura ni desgaste', 'Inspeccionar brazo de soporte por fisuras, desgaste o deterioro', 'Confirmar uniones y conexiones bien aseguradas', 'Aplicar lubricante a partes moviles segun fabricante'] },
      { section: 'Sistema electrico y seguridad', items: ['Inspeccionar conexiones electricas: sin cables expuestos o sueltos', 'Verificar estado del cable de alimentacion y enchufe', 'Comprobar sistema de emergencia si aplica', 'Probar sistema de alimentacion secundaria (bateria o UPS)', 'Inspeccionar ventilacion o disipacion de calor', 'Limpiar filtros o rejillas para evitar obstrucciones', 'Verificar toma de tierra electrica y medir continuidad', 'Confirmar que no haya fuga de corriente en componentes metalicos', 'Revisar indicadores de fallas si estan presentes'] },
    ],
  },
  columnas: {
    title: 'Protocolo de Mantenimiento Preventivo Columnas de Gases',
    sections: [
      { section: 'Inspeccion fisica y funciones', items: ['Verificar estado de estructura externa: grietas, rayones o deformaciones', 'Comprobar limpieza de superficies', 'Realizar limpieza general de la columna', 'Verificar interruptor de encendido/apagado', 'Verificar funcionamiento de funciones de la columna', 'Revisar color de luz uniforme y sin parpadeos'] },
      { section: 'Conectores, gases y frenos', items: ['Verificar funcionamiento de conectores VGA, HDMI, red, enchufe basico y grado medico', 'Verificar funcionamiento de tomas de gases clinicos', 'Verificar funcionamiento de botones de destrabe de frenos', 'Verificar estado de articulaciones y frenos', 'Verificar sistema electrico de columna', 'Verificar sistema de frenos de columna', 'Verificar sistema de gases de columna', 'Aplicar lubricante a partes moviles segun fabricante'] },
      { section: 'Electrico, filtros y vastago', items: ['Inspeccionar conexiones electricas: sin cables expuestos o sueltos', 'Verificar sistema de filtros de columna', 'Verificar y/o ajustar frenos de vastago', 'Verificar todos los seguros de vastago', 'Verificar conexion de brazos', 'Verificar alineamiento vertical del vastago', 'Confirmar que no haya fuga de corriente en componentes metalicos'] },
      { section: 'Flange y anclajes', items: ['Verificar embellecedor (flange)', 'Verificar estabilidad de pernos de anclaje (flange)', 'Verificar tuercas de nivelacion (flange)', 'Verificar tuercas de aislacion (flange)', 'Verificar golillas de aislacion (flange)', 'Verificar voltaje de fuente de poder (flange)', 'Verificar conexiones de gases: existencia de fuga de gases (flange)'] },
    ],
  },
  monitores: {
    title: 'Protocolo de Mantenimiento Preventivo Monitores de Signos Vitales',
    sections: [
      { section: 'Inspeccion fisica y accesorios', items: ['Verificacion de la integridad fisica', 'Inspeccion de accesorios', 'Estado de la bateria', 'Prueba de encendido y auto-diagnostico', 'Pantalla tactil y/o funcionalidad del panel fisico', 'Sonido de alarma'] },
      { section: 'Pruebas funcionales', items: ['Pruebas funcionales de mediciones ECG', 'Pruebas funcionales de mediciones PNI: test de fuga 250-240 mmHg', 'Pruebas funcionales de mediciones SpO2', 'Pruebas funcionales de mediciones PI', 'Pruebas funcionales de mediciones temperatura 25 C +/- 0,1 C - 45 C +/- 0,1 C', 'Verificacion de configuraciones y parametros'] },
      { section: 'Calibraciones y registros', items: ['Calibracion del ECG', 'Calibracion de PNI', 'Calibracion de SpO2', 'Test de registros', 'Test de keypad', 'Test de tendencias', 'Calibracion del touch o panel tactil fisico', 'Test de funcionamiento'] },
      { section: 'Seguridad, conectores y soporte', items: ['Luz nocturna', 'Cambio de kit anual de gases', 'Calibracion de modulo de gases', 'Verificacion de espirometro', 'Medicion de seguridad electrica norma 60601-1 Clase I Tipo', 'Cable de poder', 'Conectores ECG y/o PNI y/o PI', 'Conectores Temp y/o PIC y/o SpO2', 'Asa de desplazamiento', 'Puntos de anclaje columna/carro/plataforma'] },
    ],
  },
  ventilador: {
    title: 'Protocolo de Mantenimiento Preventivo Ventilador Mecanico',
    sections: [
      { section: 'Inspeccion estado estructural', items: ['Panel frontal', 'Pilotos e indicadores LED de bateria', 'Carcasa frontal y trasera', 'Tarjeta de memoria', 'Cable de red', 'Teclas y mando de control', 'Bateria de respaldo'] },
      { section: 'Acciones y alarmas', items: ['LED de encendido', 'Estado de pantalla', 'Alarmas visuales', 'Limpieza de filtros', 'Alarmas acusticas', 'Horometro', 'Actualizacion del software'] },
      { section: 'Verificacion general del ventilador', items: ['Verificacion sistema de presion', 'Verificacion presion de entrada O2', 'Verificacion de volumen', 'Verificacion de presion', 'FIO2 (21%-100%)', 'Verificacion sistema electrico', 'Verificacion de frecuencia', 'Verificacion de fugas', 'Verificacion de flujo'] },
      { section: 'Pruebas, calibraciones y otros', items: ['Test FIO2', 'Calibracion de sensor de flujo', 'Calibracion de sensor de O2', 'Calibracion de pantalla touchscreen', 'Limpieza interna', 'Pruebas OVT', 'Limpieza externa', 'Pruebas VVT'] },
      { section: 'Analisis', items: ['Analizador de seguridad electrica Fluke 612', 'Analizador de flujo de gases Fluke VT650'] },
    ],
  },
};

const GENERIC_PREVENTIVE_PROTOCOL = {
  title: 'Protocolo de Mantenimiento Preventivo Generico',
  sections: [
    { section: 'Inspeccion general', items: ['Verificar estado de la estructura externa', 'Comprobar limpieza de superficies', 'Verificar funcionamiento general del equipo', 'Inspeccionar conexiones electricas', 'Verificar cable de alimentacion y enchufe', 'Confirmar que no haya fuga de corriente en componentes metalicos'] },
  ],
};

const getPreventiveProtocol = (tipoEquipo = '') => {
  const key = normalizeKey(tipoEquipo);
  if (key.includes('ventilador')) return PREVENTIVE_PROTOCOLS.ventilador;
  if (key.includes('monitor') || key.includes('multiparametro') || key.includes('signosvitales')) return PREVENTIVE_PROTOCOLS.monitores;
  if (key.includes('columna') || key.includes('gases') || key.includes('flange') || key.includes('vastago')) return PREVENTIVE_PROTOCOLS.columnas;
  if (key.includes('lampara') || key.includes('quirurgica')) return PREVENTIVE_PROTOCOLS.lamparas;
  if (key.includes('cama') || key.includes('camilla') || key.includes('mubi')) return PREVENTIVE_PROTOCOLS.camas;
  return GENERIC_PREVENTIVE_PROTOCOL;
};

const looksLikeEmail = (value) => String(value || '').includes('@');
const looksLikeTimestamp = (value) => /^\d{4}-\d{2}-\d{2}/.test(String(value || ''));
const normalizeKey = (value) => String(value || '').toLowerCase().replace(/[\s.]/g, '').trim();
const isNetworkFetchError = (err) => /failed to fetch|fetch failed|networkerror|econn|etimedout/i.test(String(err?.message || err || ''));
const isMissingTableError = (err, table) => {
  const message = String(err?.message || err || '').toLowerCase();
  return message.includes(`table 'public.${table}'`) || message.includes(`relation "public.${table}" does not exist`);
};
const friendlyError = (err) => {
  const message = String(err?.message || err || 'Error desconocido');
  if (isNetworkFetchError(err)) return 'No se pudo conectar con Supabase. Revisa tu conexión, espera unos segundos y vuelve a intentar.';
  return message;
};

const supabaseRequest = async (factory, retries = 2) => {
  let result;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      result = await factory();
    } catch (err) {
      result = { data: null, error: err };
    }

    if (!result?.error || !isNetworkFetchError(result.error) || attempt === retries) return result;
    await new Promise(resolve => setTimeout(resolve, 600 * (attempt + 1)));
  }
  return result;
};

const normalizeCliente = (cliente) => cliente ? ({
  ...cliente,
  id: cliente.id ?? cliente.id_RUT,
  rut: cliente.rut ?? cliente.RUT ?? cliente.Email ?? '',
  email: cliente.email ?? cliente.email_institucional ?? cliente.Email_Institucional ?? (looksLikeEmail(cliente.Email) ? cliente.Email : ''),
  encargado_contrato: cliente.encargado_contrato ?? cliente.Encargado_Contrato ?? '',
  email_contacto: cliente.email_contacto ?? (looksLikeTimestamp(cliente.Email_contacto) ? '' : cliente.Email_contacto ?? ''),
}) : cliente;

const clienteBasePayload = (data) => ({
  name: data.name,
  Email: data.rut,
});

const clienteFullPayload = (data) => ({
  ...clienteBasePayload(data),
  Encargado_Contrato: data.encargado_contrato || null,
  Email_contacto:     data.email_contacto     || data.email || null,
});

const clienteExtendedPayload = (data) => ({
  ...clienteFullPayload(data),
  email_institucional: data.email || null,
});

const createEmptyFormData = () => ({
  ordenId: '', folio: '', clienteId: '', clienteNombre: '', rut: '',
  fecha: new Date().toISOString().split('T')[0],
  licitacionId: '', licitacionNombre: '', tipoEquipo: '', marca: '',
  modelo: '', numeroSerie: '', numeroInventario: '',
  ubicacionArea: '', solicitadoPor: '', tipoMantencion: '',
  preventivaChecklist: {}, preventivaObservaciones: '',
  preventivaEstadoEquipo: '', preventivaFirma: '',
  correctivaCondicionInicial: '', correctivaDiagnostico: '',
  correctivaConclusion: '', correctivaCondicionFinal: '',
  correctivaFotos: [], correctivaFirma: '', correctivaRepuestos: []
});

const PREVENTIVA_OBS_PREFIX = '__PREVENTIVA_JSON__';
const CORRECTIVA_OBS_PREFIX = '__CORRECTIVA_JSON__';
const DEFAULT_CONDICION_FINAL_CORRECTIVA = 'Tras la ejecución de las pruebas funcionales pertinentes, se constató que el equipo opera conforme a lo especificado, lo que confirma su operatividad.';

const buildPreventivaObservaciones = ({ observaciones, checklist, firma }) =>
  `${PREVENTIVA_OBS_PREFIX}${JSON.stringify({
    observaciones: observaciones || '',
    checklist: checklist || {},
    firma: firma || ''
  })}`;

const parsePreventivaObservaciones = (value = '') => {
  const text = String(value || '');
  if (text.startsWith(PREVENTIVA_OBS_PREFIX)) {
    try {
      const parsed = JSON.parse(text.slice(PREVENTIVA_OBS_PREFIX.length));
      return {
        observaciones: parsed.observaciones || '',
        checklist: parsed.checklist && typeof parsed.checklist === 'object' ? parsed.checklist : {},
        firma: parsed.firma || ''
      };
    } catch {
      return { observaciones: text, checklist: {}, firma: '' };
    }
  }
  return { observaciones: text, checklist: {}, firma: '' };
};

const buildCorrectivaObservaciones = ({ condicionInicial, diagnostico, conclusion, condicionFinal, fotos, firma }) =>
  `${CORRECTIVA_OBS_PREFIX}${JSON.stringify({
    condicionInicial: condicionInicial || '',
    diagnostico: diagnostico || '',
    conclusion: conclusion || '',
    condicionFinal: condicionFinal || '',
    fotos: Array.isArray(fotos) ? fotos : [],
    firma: firma || ''
  })}`;

const parseCorrectivaObservaciones = (value = '') => {
  const text = String(value || '');
  if (text.startsWith(CORRECTIVA_OBS_PREFIX)) {
    try {
      const parsed = JSON.parse(text.slice(CORRECTIVA_OBS_PREFIX.length));
      return {
        condicionInicial: parsed.condicionInicial || '',
        diagnostico: parsed.diagnostico || '',
        conclusion: parsed.conclusion || '',
        condicionFinal: parsed.condicionFinal || DEFAULT_CONDICION_FINAL_CORRECTIVA,
        fotos: Array.isArray(parsed.fotos) ? parsed.fotos : [],
        firma: parsed.firma || ''
      };
    } catch {
      return { condicionInicial: '', diagnostico: text, conclusion: '', condicionFinal: DEFAULT_CONDICION_FINAL_CORRECTIVA, fotos: [], firma: '' };
    }
  }
  const [condicionInicial = '', diagnostico = '', conclusion = ''] = text.split(/\n{2,}/);
  return { condicionInicial, diagnostico, conclusion, condicionFinal: DEFAULT_CONDICION_FINAL_CORRECTIVA, fotos: [], firma: '' };
};

const correctivaText = (data) =>
  [data.condicionInicial, data.diagnostico, data.conclusion, data.condicionFinal].filter(Boolean).join('\n\n');

const htmlText = (value = '') =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');

const readLocalObj = (key, fallback = null) => {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
};

const readLocalList = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
};

const cotizacionLineTotal = (item) => {
  if (item.tipo === 'info') return 0;
  const subtotal = (Number(item.cantidad) || 0) * (Number(item.precio) || 0);
  return Math.max(0, subtotal - (Number(item.dcto) || 0));
};

const cotizacionTotals = (items = []) => {
  const neto = items.reduce((sum, item) => sum + cotizacionLineTotal(item), 0);
  const iva = Math.round(neto * 0.19);
  return { neto, iva, total: neto + iva };
};

const buildCotizacionHtml = (draft) => {
  const docTitle = draft.masiva ? 'Cotizacion Masiva' : 'Cotizacion';
  const detailsHtml = htmlText(draft.detalles || '');
  const { neto, iva, total } = cotizacionTotals(draft.items || []);
  let printableItem = 0;
  return `
    <html><head><title>Cotizacion ${draft.numero || ''}</title><style>
    body{font-family:Arial,sans-serif;padding:28px;color:#111827}.top{display:flex;justify-content:space-between;border-bottom:3px solid #111827;padding-bottom:12px}.brand{font-weight:800;font-size:20px}
    .doc-title{text-align:right;text-transform:uppercase;letter-spacing:.06em}.badge{display:inline-block;margin-top:6px;border:1px solid #111827;padding:3px 8px;font-size:10px;font-weight:700}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;margin:18px 0;font-size:12px}.intro{font-size:12px;margin:10px 0 4px}
    table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #cbd5e1;padding:7px;font-size:11px;vertical-align:top}th{background:#e5e7eb;text-transform:uppercase;font-size:10px}.info-row td{background:#f8fafc;color:#334155;font-size:10px;font-weight:700}.totals{margin-left:auto;width:260px;margin-top:12px}.obs{margin-top:16px;font-size:12px;line-height:1.45}.details{border:1px solid #cbd5e1;padding:10px;background:#f8fafc}
    .footer{margin-top:28px;border-top:1px solid #cbd5e1;padding-top:10px;font-size:10px;color:#475569}@media print{button{display:none}body{padding:12px}}
    </style></head><body>
    <div class="top"><div><div class="brand">VAICMEDICAL SPA</div><div>RUT: 77573229-6<br/>Compania 1068, Oficina 806, Santiago<br/>Telefono: 997021037</div></div><div class="doc-title"><h2>${docTitle}<br/>N ${draft.numero || ''}</h2>${draft.masiva ? '<span class="badge">Consolidado de informes</span>' : ''}</div></div>
    <h3>Informacion del cliente</h3><div class="grid"><div><b>Sres.:</b> ${draft.cliente || ''}</div><div><b>Fecha Documento:</b> ${draft.fecha || ''}</div><div><b>Rut:</b> ${draft.rut || ''}</div><div><b>Vendedor:</b> ${draft.vendedor || ''}</div><div><b>Direccion:</b> ${draft.direccion || ''}</div><div><b>Comuna:</b> ${draft.comuna || ''}</div><div><b>Telefono:</b> ${draft.telefono || ''}</div><div><b>Solicitado por:</b> ${draft.solicitadoPor || ''}</div></div>
    <p class="intro">Tenemos el agrado de cotizar a usted lo siguiente:</p>
    <table><thead><tr><th>Item</th><th>Codigo</th><th>N de Parte</th><th>Descripcion</th><th>Unidad</th><th>Cantidad</th><th>Precio Unit.</th><th>Dcto</th><th>Total</th></tr></thead><tbody>
    ${(draft.items || []).map((item) => item.tipo === 'info'
      ? `<tr class="info-row"><td colspan="9">${htmlText(item.descripcion || '')}</td></tr>`
      : `<tr><td>${++printableItem}</td><td>${item.codigo || ''}</td><td>${item.parte || ''}</td><td>${item.descripcion || ''}</td><td>${item.unidad || ''}</td><td>${item.cantidad || 0}</td><td>$${Number(item.precio || 0).toLocaleString('es-CL')}</td><td>${item.dcto || 0}</td><td>$${cotizacionLineTotal(item).toLocaleString('es-CL')}</td></tr>`).join('')}
    </tbody></table>${detailsHtml ? `<div class="obs details"><b>Informes asociados</b><br/>${detailsHtml}</div>` : ''}
    <table class="totals"><tbody><tr><th>Neto</th><td>$${neto.toLocaleString('es-CL')}</td></tr><tr><th>Monto Exento</th><td>$0</td></tr><tr><th>I.V.A. (19%)</th><td>$${iva.toLocaleString('es-CL')}</td></tr><tr><th>Total</th><td>$${total.toLocaleString('es-CL')}</td></tr></tbody></table>
    <div class="obs"><b>Observaciones</b><br/>Glosa: ${draft.glosa || ''}<br/>Referencia: ${draft.referencia || ''}</div><div class="footer">Cotizacion emitida por VAICMEDICAL SPA. Valores netos afectos a IVA, salvo indicacion contraria.</div><button onclick="window.print()">Imprimir / Guardar PDF</button></body></html>`;
};

const openHtmlDocument = (html) => {
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.focus();
  return win;
};

// --- CONTEXTO GLOBAL ---
const ERPContext = createContext();

const ERPProvider = ({ children }) => {
  const BYPASS_LOGIN = false;
  const [loggedInUser, setLoggedInUser] = useState(() => {
    if (BYPASS_LOGIN) return { isSuperadmin: true, usuario: 'admin', nombre: 'Administrador', cargo: 'Superadmin', accesos: [] };
    try { return JSON.parse(localStorage.getItem('sentauris_session')); } catch { return null; }
  });
  const currentUser = loggedInUser
    ? (loggedInUser.isSuperadmin
        ? MOCK_USER
        : { ...MOCK_USER, name: loggedInUser.nombre, position: loggedInUser.cargo })
    : MOCK_USER;
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [clientes, setClientes] = useState(() => readLocalList('sentauris_clientes'));
  const [licitaciones, setLicitaciones] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [cotizacionDraft, setCotizacionDraft] = useState(null);
  const [cotizacionesHistorial, setCotizacionesHistorial] = useState(() => readLocalList('sentauris_cotizaciones_historial'));
  const [ocRecibidas, setOcRecibidas] = useState(() => readLocalList('sentauris_oc_recibidas'));
  const [rendiciones, setRendiciones] = useState(() => readLocalList('sentauris_rendiciones'));
  const [comprobantes, setComprobantes] = useState(() => readLocalList('sentauris_comprobantes'));
  const [registroCompras, setRegistroCompras] = useState(() => readLocalList('sentauris_registro_compras'));
  const [usuarios, setUsuarios] = useState(() => readLocalList('sentauris_usuarios'));
  const [empresas, setEmpresas] = useState(() => readLocalList('sentauris_empresas'));
  const [activeEmpresaId, setActiveEmpresaId] = useState(() => localStorage.getItem('sentauris_active_empresa') || '');
  const [planCuentas, setPlanCuentas] = useState(() => readLocalList('sentauris_plan_cuentas'));
  const [tipoDocumentos, setTipoDocumentos] = useState(() => readLocalList('sentauris_tipo_docs'));
  const [parametros, setParametros] = useState(() => readLocalObj('sentauris_parametros'));
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState('connecting'); // 'connecting' | 'ok' | 'error'

  const [formData, setFormData] = useState(createEmptyFormData);

  // --- CARGA DE DATOS DESDE SUPABASE ---
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [{ data: clientesData, error: e1 },
               { data: licitData, error: e2 },
               { data: repData, error: e3 },
               { data: equiposData, error: e4 },
               { data: usuariosData, error: e5 }] = await Promise.all([
          supabase.from('clientes').select('*').order('name'),
          supabase.from('licitaciones').select('*').order('name'),
          supabase.from('repuestos').select('*'),
          supabase.from('equipos').select('*'),
          supabase.from('usuarios').select('*'),
        ]);

        if (e1 || e2 || e3 || e4) {
          console.error('Error Supabase:', e1 || e2 || e3 || e4);
          setDbStatus('error');
        } else {
          setClientes(prev => {
            const local = Array.isArray(prev) ? prev : [];
            const remote = (clientesData || []).map(normalizeCliente);
            const seen = new Set(remote.map(c => c.id || normalizeKey(c.rut)));
            return [...remote, ...local.filter(c => !seen.has(c.id || normalizeKey(c.rut)))];
          });
          setLicitaciones(licitData || []);
          setRepuestos(repData || []);
          setEquipos(equiposData || []);
          if (!e5 && usuariosData) {
            setUsuarios(usuariosData.map(u => ({
              ...u,
              accesos: u.accesos || [],
              permisosEmpresas: u.permisos_empresas || {},
            })));
          }
          setDbStatus('ok');
        }
      } catch (err) {
        console.error('Error de conexión:', err);
        setDbStatus('error');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('sentauris_cotizaciones_historial', JSON.stringify(cotizacionesHistorial));
  }, [cotizacionesHistorial]);

  useEffect(() => {
    localStorage.setItem('sentauris_oc_recibidas', JSON.stringify(ocRecibidas));
  }, [ocRecibidas]);

  useEffect(() => {
    localStorage.setItem('sentauris_rendiciones', JSON.stringify(rendiciones));
  }, [rendiciones]);

  useEffect(() => {
    localStorage.setItem('sentauris_clientes', JSON.stringify(clientes));
  }, [clientes]);

  useEffect(() => {
    localStorage.setItem('sentauris_comprobantes', JSON.stringify(comprobantes));
  }, [comprobantes]);

  useEffect(() => {
    localStorage.setItem('sentauris_registro_compras', JSON.stringify(registroCompras));
  }, [registroCompras]);

  // usuarios se persisten en Supabase, no en localStorage

  useEffect(() => {
    localStorage.setItem('sentauris_empresas', JSON.stringify(empresas));
  }, [empresas]);

  useEffect(() => {
    localStorage.setItem('sentauris_plan_cuentas', JSON.stringify(planCuentas));
  }, [planCuentas]);

  useEffect(() => {
    localStorage.setItem('sentauris_tipo_docs', JSON.stringify(tipoDocumentos));
  }, [tipoDocumentos]);

  useEffect(() => {
    if (parametros) localStorage.setItem('sentauris_parametros', JSON.stringify(parametros));
  }, [parametros]);

  const getAccessibleEmpresaIds = (user = loggedInUser) => {
    if (!user) return [];
    if (user.isSuperadmin) return empresas.map(e => e.id);
    const permisos = user.permisosEmpresas || {};
    const ids = Object.keys(permisos).filter(id => (permisos[id] || []).length > 0);
    return ids.length > 0 ? ids : empresas.map(e => e.id);
  };

  useEffect(() => {
    if (!loggedInUser || empresas.length === 0) return;
    const allowed = getAccessibleEmpresaIds(loggedInUser);
    if (allowed.length === 0) return;
    if (activeEmpresaId && !allowed.includes(activeEmpresaId)) setActiveEmpresaId('');
  }, [loggedInUser, empresas, activeEmpresaId]);

  useEffect(() => {
    if (activeEmpresaId) localStorage.setItem('sentauris_active_empresa', activeEmpresaId);
  }, [activeEmpresaId]);

  const logout = () => {
    setLoggedInUser(null);
    localStorage.removeItem('sentauris_session');
    localStorage.removeItem('sentauris_active_empresa');
  };

  const generateFolio = () => {
    const year = new Date().getFullYear();
    const correlative = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `VAIC${year}${correlative}`;
  };
  const resetRegistrationForm = () => setFormData(createEmptyFormData());

  // Guardar orden en Supabase
  const saveOrden = async (extraData = {}) => {
    const isDuplicateFolioError = (err) => {
      const message = String(err?.message || err || '').toLowerCase();
      return message.includes('ordenes_trabajo_folio_key') || (message.includes('duplicate key') && message.includes('folio'));
    };
    const payload = {
      folio: formData.folio,
      cliente_id: formData.clienteId,
      licitacion_id: formData.licitacionId,
      fecha: formData.fecha,
      tipo_equipo: formData.tipoEquipo,
      marca: formData.marca,
      modelo: formData.modelo,
      numero_serie: formData.numeroSerie,
      numero_inventario: formData.numeroInventario,
      ubicacion_area: formData.ubicacionArea,
      solicitado_por: formData.solicitadoPor,
      tipo_mantencion: formData.tipoMantencion,
      ...extraData
    };

    if (formData.ordenId) {
      const { data, error } = await supabase.from('ordenes_trabajo').update(payload).eq('id', formData.ordenId).select().single();
      if (error) throw error;
      return data;
    }

    const { data: inserted, error: insertError } = await supabase.from('ordenes_trabajo').insert([payload]).select().single();
    if (!insertError) return inserted;

    if (!isDuplicateFolioError(insertError) || !formData.folio) throw insertError;

    const { data, error } = await supabase.from('ordenes_trabajo').update(payload).eq('folio', formData.folio).select().single();
    if (error) throw error;
    return data;
  };

  return (
    <ERPContext.Provider value={{
      currentUser, loggedInUser, setLoggedInUser, logout,
      activeModule, setActiveModule, sidebarOpen, setSidebarOpen,
      formData, setFormData, generateFolio, saveOrden, resetRegistrationForm,
      clientes, setClientes, licitaciones, setLicitaciones, equipos, setEquipos,
      repuestos, setRepuestos, cotizacionDraft, setCotizacionDraft,
      cotizacionesHistorial, setCotizacionesHistorial, ocRecibidas, setOcRecibidas,
      rendiciones, setRendiciones,
      comprobantes, setComprobantes,
      registroCompras, setRegistroCompras,
      usuarios, setUsuarios,
      empresas, setEmpresas, activeEmpresaId, setActiveEmpresaId,
      currentEmpresa: empresas.find(e => e.id === activeEmpresaId) || null,
      getAccessibleEmpresaIds,
      planCuentas, setPlanCuentas,
      tipoDocumentos, setTipoDocumentos,
      parametros, setParametros,
      loading, dbStatus
    }}>
      {children}
    </ERPContext.Provider>
  );
};

// --- COMPONENTES UI ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-100 p-6 ${className}`}>{children}</div>
);

const Button = ({ children, onClick, variant = "primary", className = "", icon: Icon, disabled }) => {
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    secondary: "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50",
    accent: "bg-blue-600 text-white hover:bg-blue-700",
    danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100"
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}>
      {Icon && <Icon size={18} />}{children}
    </button>
  );
};

const Input = ({ label, type = "text", value, onChange, disabled, placeholder }) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
    <input type={type} value={value} onChange={onChange} disabled={disabled} placeholder={placeholder}
      className="px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400 transition-all text-sm" />
  </div>
);

const Select = ({ label, options, value, onChange, disabled, placeholder }) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
    <select value={value} onChange={onChange} disabled={disabled}
      className="px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400 transition-all text-sm"
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em 1em', appearance: 'none' }}>
      <option value="">{placeholder || "Seleccionar..."}</option>
      {options.map(opt => <option key={opt.id || opt} value={opt.id || opt}>{opt.name || opt}</option>)}
    </select>
  </div>
);

const ComboInput = ({ label, value, onChange, options = [], disabled, placeholder, listId }) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
    <input type="text" value={value} onChange={onChange} disabled={disabled} placeholder={placeholder} list={listId}
      className="px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400 transition-all text-sm" />
    <datalist id={listId}>
      {options.map(opt => <option key={opt} value={opt} />)}
    </datalist>
  </div>
);

const SignaturePad = ({ signerName, onChange, initialValue = '' }) => {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const initialDrawnRef = useRef(false);

  const getPoint = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const source = event.touches?.[0] || event;
    return { x: source.clientX - rect.left, y: source.clientY - rect.top };
  };

  const drawImageOnCanvas = (src) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!src || src === 'data:,') return;
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
    img.src = src;
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL();
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
    drawImageOnCanvas(data);
  };

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  useEffect(() => {
    if (!initialValue || initialDrawnRef.current) return;
    initialDrawnRef.current = true;
    drawImageOnCanvas(initialValue);
  }, [initialValue]);

  const beginDraw = (event) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const point = getPoint(event);
    drawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const draw = (event) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const point = getPoint(event);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    onChange?.(canvasRef.current.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    onChange?.('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-bold text-slate-700">Firma del tecnico</label>
        <button type="button" onClick={clear} className="text-xs font-bold text-blue-600 hover:text-blue-800">
          Redibujar firma
        </button>
      </div>
      <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-3">
        <canvas
          ref={canvasRef}
          className="h-36 w-full touch-none rounded-lg bg-white"
          onMouseDown={beginDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={beginDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        <p className="mt-2 text-center text-[10px] font-bold uppercase text-slate-400">{signerName}</p>
      </div>
    </div>
  );
};

// Badge de estado de conexión DB
const DbStatusBadge = () => {
  const { dbStatus } = useContext(ERPContext);
  const map = {
    connecting: { color: 'bg-yellow-100 text-yellow-700', label: 'Conectando BD...' },
    ok:         { color: 'bg-green-100 text-green-700',  label: '● Supabase OK' },
    error:      { color: 'bg-red-100 text-red-700',      label: '✕ Error BD' }
  };
  const s = map[dbStatus];
  return <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${s.color}`}>{s.label}</span>;
};

// --- DASHBOARD ---
const Dashboard = () => {
  const { currentUser, clientes, licitaciones, dbStatus } = useContext(ERPContext);
  const [ordenes, setOrdenes] = useState([]);

  useEffect(() => {
    supabase.from('ordenes_trabajo').select('*').order('created_at', { ascending: false }).limit(4)
      .then(({ data }) => setOrdenes(data || []));
  }, []);

  const kpis = [
    { label: "Clientes Activos", value: clientes.length, trend: "+0", icon: Users },
    { label: "Licitaciones", value: licitaciones.length, trend: "+0", icon: FileText },
    { label: "Órdenes Totales", value: ordenes.length, trend: "+0", icon: ClipboardList },
    { label: "SLA Cumplido", value: "98.5%", trend: "+1.2%", icon: CheckCircle2 }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bienvenido, {currentUser.name}</h1>
          <p className="text-slate-500">Panel de control global de {APP_NAME}</p>
        </div>
        <DbStatusBadge />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <Card key={i} className="hover:border-blue-200 transition-colors cursor-pointer group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                <kpi.icon size={20} className="text-slate-600 group-hover:text-blue-600" />
              </div>
              <span className="text-xs font-bold text-green-600">{kpi.trend}</span>
            </div>
            <p className="text-slate-500 text-sm font-medium">{kpi.label}</p>
            <p className="text-2xl font-bold mt-1 text-slate-900">{kpi.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="font-bold text-slate-800 mb-4">Clientes registrados en Supabase</h3>
          {clientes.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-slate-400 italic text-sm">
              {dbStatus === 'ok' ? 'No hay clientes aún. Agrega uno desde Nuevo Registro.' : 'Cargando...'}
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {clientes.map(c => (
                <div key={c.id} className="flex justify-between items-center py-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.rut} • {c.email}</p>
                  </div>
                  <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-1 rounded-full">Activo</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="font-bold text-slate-800 mb-4">Últimas Órdenes</h3>
          <div className="space-y-3">
            {ordenes.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Sin órdenes registradas</p>
            ) : ordenes.map(o => (
              <div key={o.id} className="flex gap-3 pb-3 border-b border-slate-50 last:border-0">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <FileText size={14} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{o.folio}</p>
                  <p className="text-[10px] text-slate-500">{o.tipo_mantencion} • {o.tipo_equipo}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// --- NUEVO REGISTRO ---
const NuevoRegistro = () => {
  const { formData, setFormData, setActiveModule, generateFolio, clientes, licitaciones, equipos, activeEmpresaId } = useContext(ERPContext);
  const clientesEmpresa = activeEmpresaId ? clientes.filter(c => c.empresaId === activeEmpresaId) : clientes;
  const availableLicitations = licitaciones.filter(l => l.cliente_id === formData.clienteId);
  const availableEquipos = equipos.filter(e => e.licitacion_id === formData.licitacionId);
  const unique = (values) => Array.from(new Set(values.filter(Boolean).map(v => String(v).trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const tipoEquipoOptions = unique(availableEquipos.map(e => e.tipo_equipo));
  const marcaOptions = unique(availableEquipos
    .filter(e => !formData.tipoEquipo || e.tipo_equipo === formData.tipoEquipo)
    .map(e => e.marca));
  const modeloOptions = unique(availableEquipos
    .filter(e =>
      (!formData.tipoEquipo || e.tipo_equipo === formData.tipoEquipo) &&
      (!formData.marca || e.marca === formData.marca)
    )
    .map(e => e.modelo));
  const serieOptions = unique(availableEquipos
    .filter(e =>
      (!formData.tipoEquipo || e.tipo_equipo === formData.tipoEquipo) &&
      (!formData.marca || e.marca === formData.marca) &&
      (!formData.modelo || e.modelo === formData.modelo)
    )
    .map(e => e.numero_serie));
  const inventarioOptions = unique(availableEquipos
    .filter(e =>
      (!formData.tipoEquipo || e.tipo_equipo === formData.tipoEquipo) &&
      (!formData.marca || e.marca === formData.marca) &&
      (!formData.modelo || e.modelo === formData.modelo)
    )
    .map(e => e.numero_inventario));

  // Estado para nuevo cliente inline
  const [showNewCliente, setShowNewCliente] = useState(false);
  const [newCliente, setNewCliente] = useState({ name: '', rut: '', email: '' });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    if (field === 'clienteId') {
      const client = clientesEmpresa.find(c => c.id === value);
      newData.rut = client?.rut || '';
      newData.clienteNombre = client?.name || '';
      newData.licitacionId = '';
      newData.licitacionNombre = '';
      newData.tipoEquipo = '';
      newData.marca = '';
      newData.modelo = '';
      newData.numeroSerie = '';
      newData.numeroInventario = '';
    }
    if (field === 'licitacionId') {
      const lic = licitaciones.find(l => l.id === value);
      newData.licitacionNombre = lic ? `${lic.id_licitacion ? `${lic.id_licitacion} - ` : ''}${lic.name}` : '';
      newData.tipoEquipo = '';
      newData.marca = '';
      newData.modelo = '';
      newData.numeroSerie = '';
      newData.numeroInventario = '';
    }
    if (field === 'tipoEquipo') {
      newData.marca = '';
      newData.modelo = '';
      newData.numeroSerie = '';
      newData.numeroInventario = '';
    }
    if (field === 'marca') {
      newData.modelo = '';
      newData.numeroSerie = '';
      newData.numeroInventario = '';
    }
    if (field === 'modelo') {
      const match = availableEquipos.find(e =>
        e.tipo_equipo === newData.tipoEquipo &&
        e.marca === newData.marca &&
        e.modelo === value
      );
      newData.numeroSerie = match?.numero_serie || '';
      newData.numeroInventario = match?.numero_inventario || '';
    }
    if (field === 'numeroSerie') {
      const match = availableEquipos.find(e =>
        e.tipo_equipo === newData.tipoEquipo &&
        e.marca === newData.marca &&
        (!newData.modelo || e.modelo === newData.modelo) &&
        e.numero_serie === value
      );
      if (match) {
        newData.modelo = match.modelo || newData.modelo;
        newData.numeroInventario = match.numero_inventario || newData.numeroInventario;
      }
    }
    if (field === 'numeroInventario') {
      const match = availableEquipos.find(e =>
        e.tipo_equipo === newData.tipoEquipo &&
        e.marca === newData.marca &&
        (!newData.modelo || e.modelo === newData.modelo) &&
        e.numero_inventario === value
      );
      if (match) {
        newData.modelo = match.modelo || newData.modelo;
        newData.numeroSerie = match.numero_serie || newData.numeroSerie;
      }
    }
    setFormData(newData);
  };

  const handleSaveCliente = async () => {
    if (!newCliente.name || !newCliente.rut) return;
    setSaving(true);

    const rutExists = clientesEmpresa.some(c => c.rut?.toLowerCase().replace(/[\s.]/g, '') === newCliente.rut.toLowerCase().replace(/[\s.]/g, ''));
    if (rutExists) {
      alert(`Error: El RUT ${newCliente.rut} ya se encuentra registrado.`);
      setSaving(false);
      return;
    }

    let { data, error } = await supabase.from('clientes').insert([clienteFullPayload(newCliente)]).select().single();
    if (error && error.message && (error.message.includes('schema cache') || error.message.includes('column'))) {
      ({ data, error } = await supabase.from('clientes').insert([clienteBasePayload(newCliente)]).select().single());
    }
    if (!error && data) data = normalizeCliente(data);
    if (!error && data) {
      clientes.push(data); // actualización local inmediata
      handleChange('clienteId', normalizeCliente(data).id);
      setShowNewCliente(false);
      setNewCliente({ name: '', rut: '', email: '' });
    }
    setSaving(false);
  };

  const isFormValid = formData.clienteId && formData.licitacionId && formData.tipoEquipo &&
    formData.marca && formData.ubicacionArea && formData.solicitadoPor;

  const handleNext = (tipo) => {
    if (!isFormValid) return;
    setFormData(prev => ({ ...prev, tipoMantencion: tipo, folio: prev.folio || generateFolio() }));
    setActiveModule(tipo === 'preventiva' ? 'operaciones-preventiva' : 'operaciones-correctiva');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4">
      <div className="flex items-center gap-4 mb-2">
        <Button variant="secondary" onClick={() => setActiveModule('dashboard')} icon={ChevronLeft}>Volver</Button>
        <h2 className="text-xl font-bold text-slate-900">Módulo Operaciones: Nuevo Registro</h2>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Select label="Cliente" options={clientesEmpresa} value={formData.clienteId} onChange={(e) => handleChange('clienteId', e.target.value)} />
            <button onClick={() => setShowNewCliente(!showNewCliente)} className="text-xs text-blue-600 hover:underline font-medium">
              {showNewCliente ? '— Cancelar nuevo cliente' : '+ Agregar nuevo cliente'}
            </button>
            {showNewCliente && (
              <div className="bg-blue-50 p-4 rounded-lg space-y-3 border border-blue-100">
                <Input label="Nombre" value={newCliente.name} onChange={e => setNewCliente({...newCliente, name: e.target.value})} placeholder="Clínica / Hospital" />
                <Input label="RUT" value={newCliente.rut} onChange={e => setNewCliente({...newCliente, rut: e.target.value})} placeholder="76.123.456-K" />
                <Input label="Email" value={newCliente.email} onChange={e => setNewCliente({...newCliente, email: e.target.value})} placeholder="contacto@clinica.cl" />
                <Button variant="accent" onClick={handleSaveCliente} disabled={saving} className="w-full text-sm">
                  {saving ? 'Guardando...' : 'Guardar cliente en Supabase'}
                </Button>
              </div>
            )}
          </div>

          <Input label="RUT" value={formData.rut} disabled />
          <Input label="Fecha" type="date" value={formData.fecha} onChange={(e) => handleChange('fecha', e.target.value)} />
          <Select
            label="Licitacion"
            options={availableLicitations.map(l => ({ id: l.id, name: `${l.id_licitacion ? `${l.id_licitacion} - ` : ''}${l.name}` }))}
            value={formData.licitacionId}
            disabled={!formData.clienteId}
            onChange={(e) => handleChange('licitacionId', e.target.value)}
          />

          <hr className="md:col-span-2 border-slate-100 my-2" />

          <Select
            label="Tipo de Equipo"
            options={tipoEquipoOptions.map(name => ({ id: name, name }))}
            value={formData.tipoEquipo}
            disabled={!formData.licitacionId}
            onChange={(e) => handleChange('tipoEquipo', e.target.value)}
            placeholder={availableEquipos.length > 0 ? "Seleccionar tipo de equipo..." : "No hay equipos para esta licitacion"}
          />
          <ComboInput
            label="Marca"
            value={formData.marca}
            onChange={(e) => handleChange('marca', e.target.value)}
            options={marcaOptions}
            disabled={!formData.tipoEquipo}
            placeholder="Seleccione o ingrese marca"
            listId="nuevo-registro-marcas"
          />
          <ComboInput
            label="Modelo"
            value={formData.modelo}
            onChange={(e) => handleChange('modelo', e.target.value)}
            options={modeloOptions}
            disabled={!formData.marca}
            placeholder="Seleccione o ingrese modelo"
            listId="nuevo-registro-modelos"
          />
          <ComboInput
            label="Nro de Serie"
            value={formData.numeroSerie}
            onChange={(e) => handleChange('numeroSerie', e.target.value)}
            options={serieOptions}
            disabled={!formData.marca}
            placeholder="Seleccione o ingrese serie"
            listId="nuevo-registro-series"
          />
          <ComboInput
            label="Nro de Inventario"
            value={formData.numeroInventario}
            onChange={(e) => handleChange('numeroInventario', e.target.value)}
            options={inventarioOptions}
            disabled={!formData.marca}
            placeholder="Seleccione o ingrese inventario"
            listId="nuevo-registro-inventarios"
          />
          <Input label="Area / Servicio" value={formData.ubicacionArea} onChange={(e) => handleChange('ubicacionArea', e.target.value)} placeholder="Ej: UCI, Pabellon, Urgencia" />
          <Input label="Solicitado por" value={formData.solicitadoPor} onChange={(e) => handleChange('solicitadoPor', e.target.value)} placeholder="Nombre del solicitante" />
        </div>

        <div className="mt-10 flex flex-col md:flex-row gap-4 pt-6 border-t border-slate-100">
          <Button variant={isFormValid ? "accent" : "secondary"} className="flex-1" onClick={() => handleNext('preventiva')} disabled={!isFormValid} icon={ClipboardList}>Iniciar Mantención Preventiva</Button>
          <Button variant={isFormValid ? "primary" : "secondary"} className="flex-1" onClick={() => handleNext('correctiva')} disabled={!isFormValid} icon={Wrench}>Iniciar Mantención Correctiva</Button>
        </div>
      </Card>
    </div>
  );
};

// --- MANTENCIÓN PREVENTIVA ---
const MantencionPreventiva = () => {
  const { formData, setActiveModule, currentUser, saveOrden, resetRegistrationForm } = useContext(ERPContext);
  const [checklist, setChecklist] = useState(formData.preventivaChecklist || {});
  const [observaciones, setObservaciones] = useState(formData.preventivaObservaciones || '');
  const [estadoEquipo, setEstadoEquipo] = useState(formData.preventivaEstadoEquipo || 'Operativo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureData, setSignatureData] = useState(formData.preventivaFirma || '');
  const protocolo = getPreventiveProtocol(formData.tipoEquipo);
  const statusOptions = ['Si', 'No', 'N/A', 'Falla'];

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const orden = await saveOrden({
        estado_equipo: estadoEquipo,
        observaciones: buildPreventivaObservaciones({ observaciones, checklist, firma: signatureData }),
        estado: 'Completado'
      });

      // Guardar checklist
      const checkItems = Object.entries(checklist).map(([item, estado]) => ({
        orden_id: orden.id, item, estado
      }));
      if (checkItems.length > 0) {
        await supabase.from('orden_checklist').delete().eq('orden_id', orden.id);
        await supabase.from('orden_checklist').insert(checkItems);
      }

      alert(`✅ Informe ${formData.folio} guardado en Supabase`);
      resetRegistrationForm();
      setActiveModule('operaciones-historial-preventivo');
    } catch (err) {
      alert('❌ Error al guardar: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in zoom-in-95">
      <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-xl shadow-lg">
        <div>
          <p className="text-blue-400 text-xs font-bold tracking-widest uppercase">{protocolo.title}</p>
          <h2 className="text-2xl font-black">{formData.folio}</h2>
        </div>
        <div className="text-right text-xs opacity-80 font-mono">
          <p>{formData.clienteNombre}</p>
          <p>{formData.tipoEquipo} • {formData.marca}</p>
        </div>
      </div>

      <Card className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 border-slate-200">
        <div><p className="text-[10px] uppercase font-bold text-slate-400">Técnico</p><p className="text-sm font-bold text-slate-700">{currentUser.name}</p></div>
        <div><p className="text-[10px] uppercase font-bold text-slate-400">Licitación</p><p className="text-sm font-bold text-slate-700 truncate">{formData.licitacionNombre}</p></div>
        <div><p className="text-[10px] uppercase font-bold text-slate-400">S/N</p><p className="text-sm font-bold text-slate-700">{formData.numeroSerie || '—'}</p></div>
        <div><p className="text-[10px] uppercase font-bold text-slate-400">Ubicación</p><p className="text-sm font-bold text-slate-700">{formData.ubicacionArea}</p></div>
      </Card>

      <div className="space-y-6">
        {protocolo.sections.map((section, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-600 uppercase tracking-tight">{section.section}</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {section.items.map((item, i) => {
                const itemKey = `${section.section} - ${item}`;
                return (
                  <div key={i} className="flex flex-col gap-3 px-6 py-3 hover:bg-slate-50 transition-colors md:flex-row md:items-center md:justify-between">
                    <span className="text-sm text-slate-700 font-medium">{item}</span>
                    <div className="grid grid-cols-4 gap-2 md:flex">
                      {statusOptions.map(status => (
                        <button key={status} onClick={() => setChecklist(prev => ({ ...prev, [itemKey]: status }))}
                          className={`px-3 py-1 rounded text-[10px] font-bold border transition-all ${
                            checklist[itemKey] === status
                              ? status === 'Si' ? 'bg-green-600 border-green-600 text-white' : status === 'No' || status === 'Falla' ? 'bg-red-600 border-red-600 text-white' : 'bg-slate-500 border-slate-500 text-white'
                              : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                          }`}>{status}</button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Card className="space-y-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-slate-700">Observaciones y Recomendaciones</label>
          <textarea className="w-full h-32 p-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none resize-none"
            placeholder="Ingrese hallazgos técnicos..." value={observaciones} onChange={(e) => setObservaciones(e.target.value)}></textarea>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700">Estado Final del Equipo</label>
            <div className="flex gap-2">
              {['Operativo', 'No Operativo', 'Operativo con Obs.'].map(s => (
                <button key={s} onClick={() => setEstadoEquipo(s)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${estadoEquipo === s ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}>{s}</button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <SignaturePad signerName={currentUser.name} initialValue={signatureData} onChange={setSignatureData} />
            <p className={`text-[10px] font-bold uppercase ${signatureData ? 'text-green-600' : 'text-slate-400'}`}>
              {signatureData ? 'Firma capturada' : 'Firma pendiente'}
            </p>
          </div>
        </div>
      </Card>

      <div className="flex gap-4 pb-12">
        <Button variant="secondary" className="flex-1" onClick={() => setActiveModule('operaciones-registro')} icon={ChevronLeft}>Atrás</Button>
        <Button variant="accent" className="flex-[2] py-4" onClick={handleFinish} disabled={isSubmitting} icon={isSubmitting ? Cpu : FileDown}>
          {isSubmitting ? 'Guardando en Supabase...' : 'Finalizar y Guardar Informe'}
        </Button>
      </div>
    </div>
  );
};

// --- MANTENCIÓN CORRECTIVA ---
const MantencionCorrectiva = () => {
  const { formData, setActiveModule, repuestos, saveOrden, resetRegistrationForm, currentUser } = useContext(ERPContext);
  const defaultCondicionInicial = `Se recibe equipo ${formData.tipoEquipo || 'sin tipo definido'} ${formData.marca || ''} ${formData.modelo || ''}, serie ${formData.numeroSerie || 'sin serie'}, inventario ${formData.numeroInventario || 'sin inventario'}, ubicado en ${formData.ubicacionArea || 'area no informada'}, por solicitud de ${formData.solicitadoPor || 'solicitante no informado'}, reportando fallas o problemas en su funcionamiento.`;
  const isReopenedCorrectiva = Boolean(formData.ordenId);
  const [repuestosSeleccionados, setRepuestosSeleccionados] = useState(Array.isArray(formData.correctivaRepuestos) ? formData.correctivaRepuestos : []);
  const [condicionInicial, setCondicionInicial] = useState(formData.correctivaCondicionInicial || defaultCondicionInicial);
  const [diagnostico, setDiagnostico] = useState({
    text: formData.correctivaDiagnostico || '',
    conclusion: formData.correctivaConclusion || ''
  });
  const [condicionFinal, setCondicionFinal] = useState(formData.correctivaCondicionFinal || DEFAULT_CONDICION_FINAL_CORRECTIVA);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [estadoInterno, setEstadoInterno] = useState('Ingresado');
  const [fotos, setFotos] = useState(Array.isArray(formData.correctivaFotos) ? formData.correctivaFotos : []);
  const [firmaCorrectiva, setFirmaCorrectiva] = useState(formData.correctivaFirma || '');
  const availableRepuestos = repuestos.filter(r => r.licitacion_id === formData.licitacionId);

  const handleFotos = (files) => {
    const selected = Array.from(files || []);
    selected.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFotos(prev => [...prev, { id: `${file.name}-${Date.now()}-${Math.random()}`, name: file.name, src: event.target.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const addRepuesto = (id) => {
    const r = availableRepuestos.find(rep => rep.id === id);
    if (!r) return;
    setRepuestosSeleccionados(prev => [...prev, { ...r, qty: 1, toBodega: false, tempId: Date.now() }]);
  };
  const updateRepuestoSeleccionado = (tempId, patch) => {
    setRepuestosSeleccionados(prev => prev.map(r => r.tempId === tempId ? { ...r, ...patch } : r));
  };

  const generateAI = () => {
    if (repuestosSeleccionados.length === 0) return;
    setIsGenerating(true);
    setTimeout(() => {
      const items = repuestosSeleccionados.map(r => r.name).join(", ");
      setDiagnostico({
        text: `Tras la inspección técnica del equipo ${formData.tipoEquipo} ${formData.marca}, se detectaron fallas críticas. La presencia de ruidos inusuales y pérdida de potencia confirman el desgaste de los componentes asociados a ${items}.`,
        conclusion: `Se requiere el reemplazo inmediato de los componentes defectuosos (${items}) para restablecer los estándares de seguridad clínica según norma vigente.`
      });
      setIsGenerating(false);
    }, 1500);
  };

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      const orden = await saveOrden({
        estado: estadoInterno,
        observaciones: buildCorrectivaObservaciones({
          condicionInicial,
          diagnostico: diagnostico.text,
          conclusion: diagnostico.conclusion,
          condicionFinal: isReopenedCorrectiva ? condicionFinal : '',
          fotos,
          firma: firmaCorrectiva
        })
      });

      // Guardar repuestos usados
      await supabase.from('orden_repuestos').delete().eq('orden_id', orden.id);
      if (repuestosSeleccionados.length > 0) {
        const items = repuestosSeleccionados.map(r => ({
          orden_id: orden.id, repuesto_id: r.id, cantidad: r.qty || 1, desde_bodega: r.toBodega || false
        }));
        await supabase.from('orden_repuestos').insert(items);
      }

      alert(`✅ Correctiva ${formData.folio} guardada en Supabase`);
      resetRegistrationForm();
      setActiveModule('operaciones-historial-correctivo');
    } catch (err) {
      alert('❌ Error al guardar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in zoom-in-95">
      <div className="flex justify-between items-center bg-red-600 text-white p-6 rounded-xl shadow-lg">
        <div>
          <p className="text-red-100 text-xs font-bold tracking-widest uppercase">Protocolo de Mantención Correctiva</p>
          <h2 className="text-2xl font-black">{formData.folio}</h2>
        </div>
        <div className="text-right text-xs opacity-90 font-mono">
          <p>{formData.clienteNombre}</p>
          <p>S/N: {formData.numeroSerie}</p>
        </div>
      </div>

      <Card className="space-y-4">
        <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Condición Inicial</h3>
        <textarea className="w-full min-h-[112px] p-4 rounded-lg border border-slate-100 bg-slate-50 text-sm text-slate-600 leading-relaxed italic focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y"
          value={condicionInicial}
          onChange={(e) => setCondicionInicial(e.target.value)} />
        <div className="flex flex-wrap gap-4 pt-2">
          <label className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-400 transition-all cursor-pointer">
            <Camera size={24} /><span className="text-[10px] font-bold mt-1">FOTO</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFotos(e.target.files)} />
          </label>
          {fotos.map(foto => (
            <div key={foto.id} className="relative h-24 w-24 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              <img src={foto.src} alt={foto.name} className="h-full w-full object-cover" />
              <button type="button" onClick={() => setFotos(prev => prev.filter(item => item.id !== foto.id))}
                className="absolute right-1 top-1 rounded bg-white/90 p-1 text-red-500 shadow hover:bg-red-50">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Repuestos y Servicios</h3>
          <div className="w-full md:w-64">
            <Select options={availableRepuestos} placeholder="Añadir repuesto..." onChange={(e) => addRepuesto(e.target.value)} value="" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-left">
                <th className="px-4 py-3 font-bold uppercase text-[10px]">Descripción</th>
                <th className="px-4 py-3 font-bold uppercase text-[10px]">P/N</th>
                <th className="px-4 py-3 font-bold uppercase text-[10px]">Cant.</th>
                <th className="px-4 py-3 font-bold uppercase text-[10px]">Precio Unit.</th>
                <th className="px-4 py-3 font-bold uppercase text-[10px]">Bodega</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {repuestosSeleccionados.map((r) => (
                <tr key={r.tempId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{r.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.part_number}</td>
                  <td className="px-4 py-3"><input type="number" min="1" value={r.qty || 1} onChange={e => updateRepuestoSeleccionado(r.tempId, { qty: Number(e.target.value) || 1 })} className="w-12 border rounded px-1 text-center text-sm" /></td>
                  <td className="px-4 py-3 text-slate-700">${Number(r.valor_neto || 0).toLocaleString('es-CL')}</td>
                  <td className="px-4 py-3"><input type="checkbox" checked={Boolean(r.toBodega)} onChange={e => updateRepuestoSeleccionado(r.tempId, { toBodega: e.target.checked })} className="w-4 h-4 rounded" /></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setRepuestosSeleccionados(prev => prev.filter(x => x.tempId !== r.tempId))} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {repuestosSeleccionados.length === 0 && (
                <tr><td colSpan="6" className="px-4 py-10 text-center text-slate-400 italic">No hay repuestos seleccionados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="space-y-4 border-l-4 border-l-blue-500">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-blue-600">
            <Cpu size={20} /><h3 className="font-bold">Diagnóstico Técnico Inteligente</h3>
          </div>
          <Button variant="secondary" onClick={generateAI} disabled={isGenerating || repuestosSeleccionados.length === 0} className="text-xs h-8">
            {isGenerating ? 'Generando...' : 'Actualizar con IA'}
          </Button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400">Hallazgo Técnico</label>
            <textarea className="w-full h-24 p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm mt-1 focus:outline-none resize-none"
              value={diagnostico.text} onChange={(e) => setDiagnostico({ ...diagnostico, text: e.target.value })}
              placeholder="El diagnóstico se generará automáticamente según los repuestos..." />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400">Conclusión del Informe</label>
            <textarea className="w-full h-16 p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm mt-1 focus:outline-none resize-none"
              value={diagnostico.conclusion} onChange={(e) => setDiagnostico({ ...diagnostico, conclusion: e.target.value })} />
          </div>
        </div>
      </Card>

      {isReopenedCorrectiva && (
        <Card className="space-y-4">
          <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Condicion Final</h3>
          <textarea className="w-full min-h-[96px] p-4 rounded-lg border border-slate-100 bg-slate-50 text-sm text-slate-600 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y"
            value={condicionFinal}
            onChange={(e) => setCondicionFinal(e.target.value)} />
        </Card>
      )}

      <Card>
        <SignaturePad
          signerName={currentUser.name}
          initialValue={firmaCorrectiva}
          onChange={setFirmaCorrectiva}
        />
      </Card>

      <div className="flex gap-4 pb-12">
        <div className="flex-1">
          <Select label="Estado Interno" options={['Ingresado', 'En revisión', 'En reparación', 'Esperando Repuestos', 'Listo para Entrega']}
            value={estadoInterno} onChange={(e) => setEstadoInterno(e.target.value)} />
        </div>
        <div className="flex-[2] flex gap-2 items-end">
          <Button variant="secondary" className="flex-1" onClick={() => setActiveModule('operaciones-registro')} icon={ChevronLeft}>Atrás</Button>
          <Button variant="primary" className="flex-[2]" onClick={handleFinish} disabled={isSaving} icon={Mail}>
            {isSaving ? 'Guardando...' : 'Guardar y Enviar Informe'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- MODAL ---
const Modal = ({ title, onClose, children, wide = false, fullScreen = false, workspaceFull = false, sidebarOpen = false }) => createPortal(
  <div className={`fixed flex justify-center overflow-hidden ${workspaceFull ? `top-16 bottom-0 right-0 z-[45] bg-slate-50 ${sidebarOpen ? 'left-64 max-lg:left-20' : 'left-20'}` : `inset-0 z-[120] ${fullScreen ? 'items-stretch bg-white p-0' : 'items-start bg-black/40 p-4 backdrop-blur-sm md:items-center'}`}`}>
    <div className={`bg-white shadow-2xl w-full overflow-hidden flex flex-col ${workspaceFull ? 'h-full max-h-full rounded-none border-t border-slate-100' : fullScreen ? 'h-screen min-h-screen max-h-screen h-dvh min-h-dvh max-h-dvh max-w-none rounded-none' : `${wide ? 'max-w-5xl' : 'max-w-lg'} max-h-[calc(100vh-2rem)] rounded-2xl`}`}>
      <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-slate-100">
        <h3 className="font-bold text-slate-900 text-base">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors">
          <X size={20} />
        </button>
      </div>
      <div className={`${fullScreen || workspaceFull ? 'p-4 md:p-5 overflow-y-scroll' : 'p-6 overflow-y-auto'} min-h-0 flex-1`}>{children}</div>
    </div>
  </div>,
  document.body
);

// --- HISTORIAL DE MANTENCIONES ---
const HistorialMantenciones = ({ tipo }) => {
  const { clientes, licitaciones, repuestos, setActiveModule, setFormData, setCotizacionDraft } = useContext(ERPContext);
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const isPreventivo = tipo === 'preventiva';

  const loadOrdenes = async () => {
    setLoading(true);
    const { data, error } = await supabaseRequest(() =>
      supabase.from('ordenes_trabajo').select('*').eq('tipo_mantencion', tipo).order('created_at', { ascending: false })
    );
    if (error) alert('Error al cargar historial: ' + friendlyError(error));
    else setOrdenes(data || []);
    setLoading(false);
  };

  useEffect(() => { loadOrdenes(); setSelectedIds([]); setSearchTerm(''); }, [tipo]);

  const getCliente = (orden) => clientes.find(c => c.id === orden.cliente_id);
  const getLicitacion = (orden) => licitaciones.find(l => l.id === orden.licitacion_id);
  const normalize = (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const matchesSearch = (orden) => {
    const cliente = getCliente(orden);
    const lic = getLicitacion(orden);
    const haystack = [
      orden.folio, cliente?.name, cliente?.rut, lic?.name, lic?.id_licitacion,
      orden.tipo_equipo, orden.marca, orden.modelo, orden.numero_serie,
      orden.numero_inventario, orden.estado, orden.estado_equipo,
      orden.ubicacion_area, orden.solicitado_por, orden.fecha
    ].join(' ');
    return normalize(haystack).includes(normalize(searchTerm));
  };
  const filteredOrdenes = ordenes.filter(matchesSearch);
  const filteredIds = filteredOrdenes.map(o => o.id).filter(Boolean);
  const selectedVisibleIds = filteredIds.filter(id => selectedIds.includes(id));
  const allVisibleSelected = filteredIds.length > 0 && selectedVisibleIds.length === filteredIds.length;
  const selectedOrdenes = ordenes.filter(o => selectedIds.includes(o.id));
  const toggleRowSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };
  const toggleVisibleSelection = () => {
    setSelectedIds(prev => allVisibleSelected
      ? prev.filter(id => !filteredIds.includes(id))
      : Array.from(new Set([...prev, ...filteredIds])));
  };
  const getContactEmail = (orden) => {
    const lic = getLicitacion(orden);
    const cliente = getCliente(orden);
    return lic?.email_contacto || lic?.email || cliente?.email_contacto || cliente?.email || '';
  };

  const buildReportHtml = (orden) => {
    const cliente = getCliente(orden);
    const lic = getLicitacion(orden);
    if (isPreventivo) {
      const protocolo = getPreventiveProtocol(orden.tipo_equipo);
      const preventiva = parsePreventivaObservaciones(orden.observaciones);
      const checklist = orden.preventivaChecklist || preventiva.checklist || {};
      const isStructuredPreventiva = String(orden.observaciones || '').startsWith(PREVENTIVA_OBS_PREFIX);
      const obs = htmlText(isStructuredPreventiva ? preventiva.observaciones : (preventiva.observaciones || orden.observaciones || ''));
      const firmaPreventiva = preventiva.firma
        ? `<img class="firma-img" src="${preventiva.firma}" alt="Firma tecnico"/>`
        : '';
      const mark = (item, status) => checklist[item] === status ? 'X' : '';
      return `
        <html><head><title>${orden.folio}</title><style>
        body{font-family:Arial,sans-serif;color:#111827;margin:0;padding:24px}.page{max-width:960px;margin:auto}
        .head{display:flex;justify-content:space-between;border:2px solid #111827;padding:12px;align-items:center}.brand{font-weight:800;font-size:18px}
        h1{font-size:16px;text-align:center;margin:16px 0;text-transform:uppercase}.grid{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #111827;border-bottom:0}
        .cell{border-bottom:1px solid #111827;border-right:1px solid #111827;padding:7px;font-size:12px}.cell b{display:block;font-size:10px;text-transform:uppercase;color:#475569}
        table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #111827;padding:6px;font-size:11px}.mark{text-align:center;font-weight:800}th{background:#e5e7eb}.obs{border:1px solid #111827;padding:10px;min-height:70px;margin-top:12px;font-size:12px}
        .firma-img{display:block;max-width:240px;max-height:90px;margin:0 auto 8px}
        .sign{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:40px}.line{border-top:1px solid #111827;text-align:center;padding-top:8px;font-size:11px}
        @media print{button{display:none}body{padding:0}}
        </style></head><body><div class="page">
        <div class="head"><div class="brand">VAICMEDICAL</div><div>Codigo: FO-OP-001<br/>Fecha: ${orden.fecha || ''}<br/>Folio: ${orden.folio || ''}</div></div>
        <h1>${protocolo.title}</h1>
        <div class="grid">
          <div class="cell"><b>Cliente</b>${cliente?.name || ''}</div><div class="cell"><b>RUT</b>${cliente?.rut || ''}</div><div class="cell"><b>Licitacion</b>${lic?.id_licitacion || lic?.name || ''}</div>
          <div class="cell"><b>Equipo</b>${orden.tipo_equipo || ''}</div><div class="cell"><b>Marca</b>${orden.marca || ''}</div><div class="cell"><b>Modelo</b>${orden.modelo || ''}</div>
          <div class="cell"><b>Serie</b>${orden.numero_serie || ''}</div><div class="cell"><b>Inventario</b>${orden.numero_inventario || ''}</div><div class="cell"><b>Servicio</b>${orden.ubicacion_area || ''}</div>
        </div>
        <table><thead><tr><th>Accion</th><th>Si</th><th>No</th><th>N/A</th><th>Falla</th></tr></thead><tbody>
        ${protocolo.sections.flatMap(s => [`<tr><th colspan="5">${s.section}</th></tr>`, ...s.items.map(i => {
          const itemKey = `${s.section} - ${i}`;
          return `<tr><td>${i}</td><td class="mark">${mark(itemKey, 'Si')}</td><td class="mark">${mark(itemKey, 'No')}</td><td class="mark">${mark(itemKey, 'N/A')}</td><td class="mark">${mark(itemKey, 'Falla')}</td></tr>`;
        })]).join('')}
        </tbody></table>
        <div class="obs"><b>Observaciones</b><br/>${obs}</div>
        <p><b>Estado final:</b> ${orden.estado_equipo || orden.estado || ''}</p>
        <div class="sign"><div class="line">Nombre y firma quien recepciona</div><div>${firmaPreventiva}<div class="line">Tecnico en Mantenimiento Equipo Medico</div></div></div>
        <button onclick="window.print()">Imprimir / Guardar PDF</button>
        </div></body></html>`;
    }
    const correctiva = parseCorrectivaObservaciones(orden.observaciones);
    const correctivaFotos = correctiva.fotos.length > 0
      ? `<div class="photos">${correctiva.fotos.map(f => `<figure><img src="${f.src}" alt="${f.name || 'foto'}"/><figcaption>${htmlText(f.name || '')}</figcaption></figure>`).join('')}</div>`
      : '';
    const correctivaFirma = correctiva.firma
      ? `<img class="firma-img" src="${correctiva.firma}" alt="Firma tecnico"/>`
      : '';
    return `
      <html><head><title>${orden.folio}</title><style>
      body{font-family:Arial,sans-serif;color:#111827;margin:0;padding:28px}.page{max-width:900px;margin:auto}.brand{font-size:20px;font-weight:800}
      .top{display:flex;justify-content:space-between;border-bottom:3px solid #0f172a;padding-bottom:12px}.muted{color:#475569;font-size:12px}.section{margin-top:22px}
      h1{font-size:18px;letter-spacing:.08em}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:0;border:1px solid #cbd5e1}.cell{border-right:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1;padding:8px;font-size:12px}.cell b{display:block;color:#64748b;font-size:10px;text-transform:uppercase}
      .box{border:1px solid #cbd5e1;padding:12px;min-height:70px;font-size:12px;line-height:1.45}.sign{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:42px}.line{border-top:1px solid #111827;text-align:center;padding-top:8px;font-size:11px}
      .photos{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,140px));gap:8px;margin-top:10px}.photos figure{margin:0;break-inside:avoid}.photos img{width:100%;height:92px;object-fit:contain;border:1px solid #cbd5e1;background:#f8fafc}.photos figcaption{font-size:9px;color:#64748b;margin-top:3px;word-break:break-word}.firma-img{display:block;max-width:240px;max-height:90px;margin:0 auto 8px}
      @media print{button{display:none}body{padding:0}}
      </style></head><body><div class="page">
      <div class="top"><div><div class="brand">Vaicmedical</div><div class="muted">Mantencion y Reparacion de Equipos Medicos<br/>servicios@vaicmedical.cl</div></div><div class="muted">Codigo de Referencia:<br/><b>${orden.folio || ''}</b><br/>Fecha: ${orden.fecha || ''}</div></div>
      <h1>MANT. CORRECTIVO EJECUTADO</h1>
      <div class="grid">
        <div class="cell"><b>Cliente</b>${cliente?.name || ''}</div><div class="cell"><b>RUT</b>${cliente?.rut || ''}</div>
        <div class="cell"><b>Licitacion convenio</b>${lic?.id_licitacion || lic?.name || ''}</div><div class="cell"><b>Servicio</b>${orden.ubicacion_area || ''}</div>
        <div class="cell"><b>Tipo de equipo</b>${orden.tipo_equipo || ''}</div><div class="cell"><b>Marca</b>${orden.marca || ''}</div>
        <div class="cell"><b>Modelo</b>${orden.modelo || ''}</div><div class="cell"><b>Serie / Inventario</b>${orden.numero_serie || ''} / ${orden.numero_inventario || ''}</div>
      </div>
      <div class="section"><h3>Condicion inicial de equipo</h3><div class="box">${htmlText(correctiva.condicionInicial || correctivaText(correctiva))}</div></div>
      <div class="section"><h3>Informacion de diagnosticos</h3><div class="box">${htmlText(correctiva.diagnostico)}</div></div>
      <div class="section"><h3>Informacion de solucion</h3><div class="box">${htmlText(correctiva.conclusion || 'La solucion corresponde a cambio, ajuste o reparacion de componentes segun diagnostico tecnico.')}</div></div>
      <div class="section"><h3>Condicion final</h3><div class="box">${htmlText(correctiva.condicionFinal || DEFAULT_CONDICION_FINAL_CORRECTIVA)}</div></div>
      ${correctivaFotos ? `<div class="section"><h3>Registro fotografico</h3>${correctivaFotos}</div>` : ''}
      <div class="section"><h3>Estado final</h3><div class="box">${orden.estado || orden.estado_equipo || ''}</div></div>
      <div class="sign"><div class="line">Nombre y firma quien recepciona</div><div>${correctivaFirma}<div class="line">Tecnico en Mantenimiento Equipo Medico</div></div></div>
      <button onclick="window.print()">Imprimir / Guardar PDF</button>
      </div></body></html>`;
  };

  const openReportWindow = async (orden) => {
    let reportOrden = orden;
    if (isPreventivo && orden.id) {
      const parsed = parsePreventivaObservaciones(orden.observaciones);
      if (Object.keys(parsed.checklist || {}).length === 0) {
        const { data } = await supabaseRequest(() =>
          supabase.from('orden_checklist').select('*').eq('orden_id', orden.id)
        );
        const preventivaChecklist = (data || []).reduce((acc, item) => {
          acc[item.item] = item.estado;
          return acc;
        }, {});
        reportOrden = { ...orden, preventivaChecklist };
      }
    }
    const win = window.open('', '_blank');
    win.document.write(buildReportHtml(reportOrden));
    win.document.close();
    win.focus();
    return win;
  };

  const handleMail = async (orden) => {
    const email = getContactEmail(orden);
    if (!email) {
      alert('No se encontro email de contacto para esta licitacion o cliente.');
      return;
    }
    await openReportWindow(orden);
    const subject = encodeURIComponent(`Informe ${orden.folio}`);
    const body = encodeURIComponent(`Estimados,\n\nSe genero el informe ${orden.folio} para ${orden.tipo_equipo || 'equipo'} ${orden.marca || ''} ${orden.modelo || ''}.\n\nEl informe se abrio en una pestaña para imprimir/guardar como PDF y adjuntarlo al correo.\n\nSaludos.`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const handleDelete = async (orden) => {
    if (!window.confirm(`Eliminar el registro ${orden.folio}? Esta accion no se puede deshacer.`)) return;
    const { error } = await supabaseRequest(() => supabase.from('ordenes_trabajo').delete().eq('id', orden.id));
    if (error) {
      alert('Error al eliminar: ' + friendlyError(error));
      return;
    }
    setOrdenes(prev => prev.filter(o => o.id !== orden.id));
  };

  const openPdf = async (orden) => {
    await openReportWindow(orden);
  };

  const generarCotizacion = async (orden) => {
    const cliente = getCliente(orden);
    const { data: usados, error } = await supabaseRequest(() =>
      supabase.from('orden_repuestos').select('*').eq('orden_id', orden.id)
    );
    if (error) {
      alert('No se pudieron cargar los repuestos del informe: ' + friendlyError(error));
      return;
    }
    const repuestoItems = (usados || []).map((usado) => {
      const repuesto = repuestos.find(r => r.id === usado.repuesto_id) || {};
      return {
        codigo: repuesto.sku || '',
        parte: repuesto.part_number || '',
        descripcion: repuesto.name || 'Repuesto sin descripcion',
        unidad: 'Uns',
        cantidad: usado.cantidad || 1,
        precio: repuesto.valor_neto || 0,
        dcto: 0,
      };
    });
    setCotizacionDraft({
      numero: orden.folio?.replace(/\D/g, '').slice(-6) || '',
      fecha: new Date().toISOString().split('T')[0],
      cliente: cliente?.name || '',
      rut: cliente?.rut || '',
      direccion: '',
      comuna: '',
      telefono: '',
      solicitadoPor: orden.solicitado_por || '',
      vendedor: 'Catalina Ramos',
      idLicitacion: getLicitacion(orden)?.id_licitacion || getLicitacion(orden)?.name || '',
      referencia: orden.folio || '',
      glosa: `${orden.tipo_equipo || ''} ${orden.marca || ''} ${orden.modelo || ''}`.trim(),
      detalles: `ID Licitacion: ${getLicitacion(orden)?.id_licitacion || ''} Equipo: ${orden.tipo_equipo || ''} Marca: ${orden.marca || ''} Modelo: ${orden.modelo || ''} Serie: ${orden.numero_serie || ''} Inventario: ${orden.numero_inventario || ''} Servicio: ${orden.ubicacion_area || ''} Codigo informe: ${orden.folio || ''}`,
      items: repuestoItems.length > 0
        ? repuestoItems
        : [{ codigo: '', parte: '', descripcion: 'Mantencion Correctiva', unidad: 'Uns', cantidad: 1, precio: 0, dcto: 0 }],
    });
    setActiveModule('operaciones-cotizaciones');
  };

  const generarCotizacionMasiva = async () => {
    if (selectedOrdenes.length === 0) return;
    const ids = selectedOrdenes.map(o => o.id).filter(Boolean);
    let usados = [];
    if (!isPreventivo && ids.length > 0) {
      const { data, error } = await supabaseRequest(() =>
        supabase.from('orden_repuestos').select('*').in('orden_id', ids)
      );
      if (error) {
        alert('No se pudieron cargar los repuestos seleccionados: ' + friendlyError(error));
        return;
      }
      usados = data || [];
    }
    const firstCliente = getCliente(selectedOrdenes[0]) || {};
    const clientesUnicos = Array.from(new Set(selectedOrdenes.map(o => getCliente(o)?.name).filter(Boolean)));
    const folios = selectedOrdenes.map(o => o.folio).filter(Boolean);
    const reportInfo = (orden) => {
      const cliente = getCliente(orden);
      const lic = getLicitacion(orden);
      return [
        `Informe: ${orden.folio || ''}`,
        `Cliente: ${cliente?.name || ''}`,
        `Licitacion: ${lic?.id_licitacion || lic?.name || ''}`,
        `Equipo: ${orden.tipo_equipo || ''} ${orden.marca || ''} ${orden.modelo || ''}`.trim(),
        `Serie: ${orden.numero_serie || ''}`,
        `Inventario: ${orden.numero_inventario || ''}`,
        `Servicio: ${orden.ubicacion_area || ''}`,
        `Estado: ${orden.estado || orden.estado_equipo || ''}`
      ].filter(Boolean).join(' | ');
    };
    const items = selectedOrdenes.flatMap((orden) => {
      const repuestosOrden = usados.filter(u => u.orden_id === orden.id);
      if (!isPreventivo && repuestosOrden.length > 0) {
        const repuestoItems = repuestosOrden.map((usado) => {
          const repuesto = repuestos.find(r => r.id === usado.repuesto_id) || {};
          return {
            codigo: repuesto.sku || '',
            parte: repuesto.part_number || '',
            descripcion: repuesto.name || 'Repuesto sin descripcion',
            unidad: 'Uns',
            cantidad: usado.cantidad || 1,
            precio: repuesto.valor_neto || 0,
            dcto: 0,
          };
        });
        return [...repuestoItems, { tipo: 'info', descripcion: reportInfo(orden) }];
      }
      return [{
        codigo: '',
        parte: orden.folio || '',
        descripcion: `${orden.folio || ''} - ${isPreventivo ? 'Mantencion Preventiva' : 'Mantencion Correctiva'} ${orden.tipo_equipo || ''} ${orden.marca || ''} ${orden.modelo || ''} Serie ${orden.numero_serie || 'S/S'}`.trim(),
        unidad: 'Uns',
        cantidad: 1,
        precio: 0,
        dcto: 0,
      }, { tipo: 'info', descripcion: reportInfo(orden) }];
    });
    setCotizacionDraft({
      masiva: true,
      numero: `MAS-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}`,
      fecha: new Date().toISOString().split('T')[0],
      cliente: clientesUnicos.length === 1 ? clientesUnicos[0] : 'Cotizacion masiva - multiples clientes',
      rut: clientesUnicos.length === 1 ? firstCliente.rut || '' : '',
      direccion: '',
      comuna: '',
      telefono: '',
      solicitadoPor: selectedOrdenes[0]?.solicitado_por || '',
      vendedor: 'Catalina Ramos',
      idLicitacion: Array.from(new Set(selectedOrdenes.map(o => getLicitacion(o)?.id_licitacion || getLicitacion(o)?.name).filter(Boolean))).join(', '),
      referencia: `Cotizacion masiva ${isPreventivo ? 'preventiva' : 'correctiva'}`,
      glosa: `${selectedOrdenes.length} informe(s): ${folios.join(', ')}`,
      detalles: '',
      items,
    });
    setActiveModule('operaciones-cotizaciones');
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Eliminar ${selectedIds.length} registro(s) seleccionado(s)? Esta accion no se puede deshacer.`)) return;
    const { error } = await supabaseRequest(() => supabase.from('ordenes_trabajo').delete().in('id', selectedIds));
    if (error) {
      alert('Error al eliminar registros: ' + friendlyError(error));
      return;
    }
    setOrdenes(prev => prev.filter(o => !selectedIds.includes(o.id)));
    setSelectedIds([]);
  };

  const openEdit = (orden) => setEditModal({ ...orden });
  const saveEdit = async () => {
    const payload = {
      tipo_equipo: editModal.tipo_equipo,
      marca: editModal.marca,
      modelo: editModal.modelo,
      numero_serie: editModal.numero_serie,
      numero_inventario: editModal.numero_inventario,
      ubicacion_area: editModal.ubicacion_area,
      solicitado_por: editModal.solicitado_por,
      fecha: editModal.fecha,
      observaciones: editModal.observaciones,
      estado: editModal.estado,
      estado_equipo: editModal.estado_equipo,
    };
    const { data, error } = await supabaseRequest(() => supabase.from('ordenes_trabajo').update(payload).eq('id', editModal.id).select().single());
    if (error) {
      alert('Error al modificar: ' + friendlyError(error));
      return;
    }
    setOrdenes(prev => prev.map(o => o.id === data.id ? data : o));
    setEditModal(null);
  };

  const reopenFlow = async (orden) => {
    const cliente = getCliente(orden);
    const lic = getLicitacion(orden);
    const preventiva = isPreventivo
      ? parsePreventivaObservaciones(orden.observaciones)
      : { observaciones: '', checklist: {}, firma: '' };
    const correctiva = isPreventivo
      ? { condicionInicial: '', diagnostico: '', conclusion: '', condicionFinal: '', fotos: [], firma: '' }
      : parseCorrectivaObservaciones(orden.observaciones);
    let preventivaChecklist = preventiva.checklist || {};
    if (isPreventivo && orden.id && Object.keys(preventivaChecklist).length === 0) {
      const { data, error } = await supabaseRequest(() =>
        supabase.from('orden_checklist').select('*').eq('orden_id', orden.id)
      );
      if (error) {
        alert('No se pudo cargar el checklist preventivo: ' + friendlyError(error));
        return;
      }
      preventivaChecklist = (data || []).reduce((acc, item) => {
        acc[item.item] = item.estado;
        return acc;
      }, {});
    }
    let correctivaRepuestos = [];
    if (!isPreventivo && orden.id) {
      const { data, error } = await supabaseRequest(() =>
        supabase.from('orden_repuestos').select('*').eq('orden_id', orden.id)
      );
      if (error) {
        alert('No se pudieron cargar los repuestos del correctivo: ' + friendlyError(error));
        return;
      }
      correctivaRepuestos = (data || []).map((item, index) => {
        const repuesto = repuestos.find(r => r.id === item.repuesto_id) || {};
        return {
          ...repuesto,
          id: item.repuesto_id || repuesto.id,
          qty: item.cantidad || 1,
          toBodega: Boolean(item.desde_bodega),
          tempId: `${item.repuesto_id || 'rep'}-${Date.now()}-${index}`
        };
      }).filter(item => item.id);
    }
    setFormData({
      ordenId: orden.id || '',
      folio: orden.folio || '',
      clienteId: orden.cliente_id || '',
      clienteNombre: cliente?.name || '',
      rut: cliente?.rut || '',
      fecha: orden.fecha || new Date().toISOString().split('T')[0],
      licitacionId: orden.licitacion_id || '',
      licitacionNombre: lic ? `${lic.id_licitacion ? `${lic.id_licitacion} - ` : ''}${lic.name}` : '',
      tipoEquipo: orden.tipo_equipo || '',
      marca: orden.marca || '',
      modelo: orden.modelo || '',
      numeroSerie: orden.numero_serie || '',
      numeroInventario: orden.numero_inventario || '',
      ubicacionArea: orden.ubicacion_area || '',
      solicitadoPor: orden.solicitado_por || '',
      tipoMantencion: tipo,
      preventivaChecklist,
      preventivaObservaciones: preventiva.observaciones,
      preventivaEstadoEquipo: orden.estado_equipo || orden.estado || 'Operativo',
      preventivaFirma: preventiva.firma,
      correctivaCondicionInicial: correctiva.condicionInicial,
      correctivaDiagnostico: correctiva.diagnostico,
      correctivaConclusion: correctiva.conclusion,
      correctivaCondicionFinal: correctiva.condicionFinal,
      correctivaFotos: correctiva.fotos,
      correctivaFirma: correctiva.firma,
      correctivaRepuestos,
    });
    setActiveModule(isPreventivo ? 'operaciones-preventiva' : 'operaciones-correctiva');
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2">
      {editModal && (
        <Modal title={`Modificar ${editModal.folio}`} onClose={() => setEditModal(null)} wide>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Equipo" value={editModal.tipo_equipo || ''} onChange={e => setEditModal(m => ({ ...m, tipo_equipo: e.target.value }))} />
            <Input label="Marca" value={editModal.marca || ''} onChange={e => setEditModal(m => ({ ...m, marca: e.target.value }))} />
            <Input label="Modelo" value={editModal.modelo || ''} onChange={e => setEditModal(m => ({ ...m, modelo: e.target.value }))} />
            <Input label="Serie" value={editModal.numero_serie || ''} onChange={e => setEditModal(m => ({ ...m, numero_serie: e.target.value }))} />
            <Input label="Inventario" value={editModal.numero_inventario || ''} onChange={e => setEditModal(m => ({ ...m, numero_inventario: e.target.value }))} />
            <Input label="Estado Interno" value={editModal.estado || editModal.estado_equipo || ''} onChange={e => setEditModal(m => ({ ...m, estado: e.target.value }))} />
            <Input label="Area / Servicio" value={editModal.ubicacion_area || ''} onChange={e => setEditModal(m => ({ ...m, ubicacion_area: e.target.value }))} />
            <Input label="Solicitado por" value={editModal.solicitado_por || ''} onChange={e => setEditModal(m => ({ ...m, solicitado_por: e.target.value }))} />
            <Input label="Fecha" type="date" value={editModal.fecha || ''} onChange={e => setEditModal(m => ({ ...m, fecha: e.target.value }))} />
            <div className="md:col-span-3 flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Observaciones</label>
              <textarea value={editModal.observaciones || ''} onChange={e => setEditModal(m => ({ ...m, observaciones: e.target.value }))}
                className="min-h-36 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
            <Button variant="secondary" onClick={() => setEditModal(null)}>Cancelar</Button>
            <Button variant="accent" onClick={saveEdit}>Guardar cambios</Button>
          </div>
        </Modal>
      )}

      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Operaciones / Historial</p>
        <h2 className="text-2xl font-bold text-slate-900">Mantenimiento {isPreventivo ? 'preventivo' : 'correctivo'}</h2>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por folio, cliente, equipo, marca, modelo, serie, inventario o estado..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          {selectedIds.length > 0 && (
            <div className="flex flex-col gap-2 rounded-lg border border-blue-100 bg-blue-50 p-2 sm:flex-row sm:items-center">
              <span className="px-2 text-sm font-semibold text-blue-700">{selectedIds.length} registro(s) seleccionado(s)</span>
              <Button variant="accent" className="text-xs" onClick={generarCotizacionMasiva} icon={FileText}>Cotizacion masiva</Button>
              <Button variant="secondary" className="text-xs text-red-600" onClick={handleBulkDelete} icon={Trash2}>Eliminar seleccionados</Button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left border-b">
                <th className="w-10 p-3">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleVisibleSelection}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </th>
                {['Folio', 'Cliente', 'Equipo', 'Marca', 'Modelo', 'Serie', 'Inventario', 'Estado Interno', 'Acciones'].map(h => (
                  <th key={h} className="p-3 text-[10px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="10" className="px-6 py-12 text-center text-slate-400 italic">Cargando historial...</td></tr>
              ) : filteredOrdenes.length === 0 ? (
                <tr><td colSpan="10" className="px-6 py-12 text-center text-slate-400 italic">{ordenes.length === 0 ? 'No hay registros.' : 'No hay registros que coincidan con la busqueda.'}</td></tr>
              ) : filteredOrdenes.map(orden => {
                const cliente = getCliente(orden);
                return (
                  <tr key={orden.id} className="border-b hover:bg-slate-50">
                    <td className="p-3">
                      <input type="checkbox" checked={selectedIds.includes(orden.id)} onChange={() => toggleRowSelection(orden.id)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    </td>
                    <td className="p-3 font-mono text-xs">{orden.folio}</td>
                    <td className="p-3 font-medium">{cliente?.name || '—'}</td>
                    <td className="p-3">{orden.tipo_equipo || '—'}</td>
                    <td className="p-3">{orden.marca || '—'}</td>
                    <td className="p-3">{orden.modelo || '—'}</td>
                    <td className="p-3 font-mono text-xs">{orden.numero_serie || '—'}</td>
                    <td className="p-3 font-mono text-xs">{orden.numero_inventario || '—'}</td>
                    <td className="p-3">{orden.estado || orden.estado_equipo || '—'}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleMail(orden)} className="p-2 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600" title="Enviar por mail"><Mail size={14} /></button>
                        <button onClick={() => openEdit(orden)} className="p-2 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600" title="Modificar informacion"><Pencil size={14} /></button>
                        <button onClick={() => reopenFlow(orden)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Reabrir formulario"><ClipboardList size={14} /></button>
                        <button onClick={() => handleDelete(orden)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" title="Eliminar registro"><Trash2 size={14} /></button>
                        <button onClick={() => openPdf(orden)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Visualizar PDF"><FileDown size={14} /></button>
                        <button onClick={() => generarCotizacion(orden)} className="p-2 rounded-lg text-slate-400 hover:bg-green-50 hover:text-green-600" title="Generar cotizacion"><FileText size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Cotizaciones = () => {
  const { cotizacionDraft, setCotizacionDraft, setActiveModule, cotizacionesHistorial, setCotizacionesHistorial } = useContext(ERPContext);
  const [draft, setDraft] = useState(cotizacionDraft || {
    numero: '', fecha: new Date().toISOString().split('T')[0], cliente: '', rut: '', direccion: '',
    comuna: '', telefono: '', solicitadoPor: '', vendedor: '', referencia: '', glosa: '', detalles: '',
    idLicitacion: '', unidadNegocio: 'Casa Matriz', centroCosto: 'Operaciones',
    items: [{ codigo: '', parte: '', descripcion: '', unidad: 'Uns', cantidad: 1, precio: 0, dcto: 0 }],
  });

  useEffect(() => {
    if (cotizacionDraft) setDraft(cotizacionDraft);
  }, [cotizacionDraft]);

  const setField = (key, value) => setDraft(prev => ({ ...prev, [key]: value }));
  const setItem = (index, key, value) => setDraft(prev => ({
    ...prev,
    items: prev.items.map((item, i) => i === index ? { ...item, [key]: value } : item),
  }));
  const addItem = () => setDraft(prev => ({
    ...prev,
    items: [...prev.items, { codigo: '', parte: '', descripcion: '', unidad: 'Uns', cantidad: 1, precio: 0, dcto: 0 }],
  }));
  const removeItem = (index) => setDraft(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  const lineTotal = (item) => {
    return cotizacionLineTotal(item);
  };
  const { neto, iva, total } = cotizacionTotals(draft.items);

  const openPrintable = () => {
    openHtmlDocument(buildCotizacionHtml(draft));
  };

  const saveCotizacion = () => {
    const totals = cotizacionTotals(draft.items);
    const record = {
      ...draft,
      id: draft.id || `cot-${Date.now()}`,
      estado: draft.estado || 'Emitida',
      neto: totals.neto,
      iva: totals.iva,
      total: totals.total,
      updatedAt: new Date().toISOString(),
      createdAt: draft.createdAt || new Date().toISOString(),
    };
    setCotizacionesHistorial(prev => {
      const exists = prev.some(c => c.id === record.id || (record.numero && c.numero === record.numero));
      return exists
        ? prev.map(c => (c.id === record.id || (record.numero && c.numero === record.numero)) ? record : c)
        : [record, ...prev];
    });
    setDraft(record);
    setCotizacionDraft(record);
    alert(`Cotizacion ${record.numero || ''} guardada en historial`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Operaciones</p>
          <h2 className="text-2xl font-bold text-slate-900">Cotizaciones</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setActiveModule('operaciones-historial-correctivo')} icon={ChevronLeft}>Volver</Button>
          <Button variant="primary" onClick={saveCotizacion} icon={Download}>Guardar cotizacion</Button>
          <Button variant="accent" onClick={() => { setCotizacionDraft(draft); openPrintable(); }} icon={FileDown}>Visualizar PDF</Button>
        </div>
      </div>

      <Card className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Cotizacion N" value={draft.numero} onChange={e => setField('numero', e.target.value)} />
          <Input label="Fecha Documento" type="date" value={draft.fecha} onChange={e => setField('fecha', e.target.value)} />
          <Input label="Vendedor" value={draft.vendedor} onChange={e => setField('vendedor', e.target.value)} />
          <Input label="ID Licitacion" value={draft.idLicitacion || ''} onChange={e => setField('idLicitacion', e.target.value)} />
          <Input label="Unidad de Negocio" value={draft.unidadNegocio || 'Casa Matriz'} onChange={e => setField('unidadNegocio', e.target.value)} />
          <Input label="Centro de Costo" value={draft.centroCosto || 'Operaciones'} onChange={e => setField('centroCosto', e.target.value)} />
          <Input label="Sres." value={draft.cliente} onChange={e => setField('cliente', e.target.value)} />
          <Input label="Rut" value={draft.rut} onChange={e => setField('rut', e.target.value)} />
          <Input label="Solicitado por" value={draft.solicitadoPor} onChange={e => setField('solicitadoPor', e.target.value)} />
          <Input label="Direccion" value={draft.direccion} onChange={e => setField('direccion', e.target.value)} />
          <Input label="Comuna" value={draft.comuna} onChange={e => setField('comuna', e.target.value)} />
          <Input label="Telefono" value={draft.telefono} onChange={e => setField('telefono', e.target.value)} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-left">{['Codigo', 'N Parte', 'Descripcion', 'Unidad', 'Cantidad', 'Precio Unit.', 'Dcto', 'Total', ''].map(h => <th key={h} className="p-2 text-[10px] uppercase text-slate-500">{h}</th>)}</tr></thead>
            <tbody>{draft.items.map((item, index) => item.tipo === 'info' ? (
              <tr key={index} className="border-b bg-slate-50">
                <td colSpan="8" className="p-2">
                  <textarea className="w-full min-w-[720px] rounded border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-600"
                    value={item.descripcion || ''}
                    onChange={e => setItem(index, 'descripcion', e.target.value)} />
                </td>
                <td className="p-2 text-right align-top"><button onClick={() => removeItem(index)} className="text-red-500"><Trash2 size={14} /></button></td>
              </tr>
            ) : (
              <tr key={index} className="border-b">
                <td className="p-2"><input className="w-24 rounded border p-1 text-xs" value={item.codigo || ''} onChange={e => setItem(index, 'codigo', e.target.value)} /></td>
                <td className="p-2"><input className="w-20 rounded border p-1 text-xs" value={item.parte || ''} onChange={e => setItem(index, 'parte', e.target.value)} /></td>
                <td className="p-2"><input className="w-64 rounded border p-1 text-xs" value={item.descripcion || ''} onChange={e => setItem(index, 'descripcion', e.target.value)} /></td>
                <td className="p-2"><input className="w-16 rounded border p-1 text-xs" value={item.unidad || ''} onChange={e => setItem(index, 'unidad', e.target.value)} /></td>
                <td className="p-2"><input type="number" className="w-20 rounded border p-1 text-xs" value={item.cantidad || 0} onChange={e => setItem(index, 'cantidad', e.target.value)} /></td>
                <td className="p-2"><input type="number" className="w-24 rounded border p-1 text-xs" value={item.precio || 0} onChange={e => setItem(index, 'precio', e.target.value)} /></td>
                <td className="p-2"><input type="number" className="w-20 rounded border p-1 text-xs" value={item.dcto || 0} onChange={e => setItem(index, 'dcto', e.target.value)} /></td>
                <td className="p-2 font-bold">${lineTotal(item).toLocaleString('es-CL')}</td>
                <td className="p-2 text-right"><button onClick={() => removeItem(index)} className="text-red-500"><Trash2 size={14} /></button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <Button variant="secondary" onClick={addItem} icon={Plus}>Agregar item</Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Detalle equipo / informe</label>
            <textarea className="min-h-28 rounded-lg border border-slate-200 p-3 text-sm" value={draft.detalles} onChange={e => setField('detalles', e.target.value)} />
          </div>
          <div className="space-y-2 rounded-xl border border-slate-200 p-4">
            <p className="flex justify-between text-sm"><span>Neto</span><b>${neto.toLocaleString('es-CL')}</b></p>
            <p className="flex justify-between text-sm"><span>Monto Exento</span><b>$0</b></p>
            <p className="flex justify-between text-sm"><span>I.V.A. (19%)</span><b>${iva.toLocaleString('es-CL')}</b></p>
            <p className="flex justify-between border-t pt-2 text-base"><span>Total</span><b>${total.toLocaleString('es-CL')}</b></p>
            <Input label="Glosa" value={draft.glosa} onChange={e => setField('glosa', e.target.value)} />
          </div>
        </div>
      </Card>
    </div>
  );
};

const HistorialCotizaciones = () => {
  const { cotizacionesHistorial, setCotizacionesHistorial, setCotizacionDraft, setActiveModule, setOcRecibidas } = useContext(ERPContext);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [ocModal, setOcModal] = useState(null);

  const normalizeText = (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filtered = cotizacionesHistorial.filter(c => normalizeText([
    c.numero, c.cliente, c.rut, c.idLicitacion, c.fecha, c.referencia, c.glosa, c.estado, c.total
  ].join(' ')).includes(normalizeText(search)));
  const filteredIds = filtered.map(c => c.id);
  const allVisibleSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.includes(id));
  const selectedCotizaciones = cotizacionesHistorial.filter(c => selectedIds.includes(c.id));

  const toggleRow = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAllVisible = () => setSelectedIds(prev => allVisibleSelected
    ? prev.filter(id => !filteredIds.includes(id))
    : Array.from(new Set([...prev, ...filteredIds])));
  const openPdf = (cotizacion) => openHtmlDocument(buildCotizacionHtml(cotizacion));
  const mailCotizacion = (cotizacion) => {
    openPdf(cotizacion);
    const subject = encodeURIComponent(`Cotizacion ${cotizacion.numero || ''}`);
    const body = encodeURIComponent(`Estimados,\n\nSe adjunta/gestiona la cotizacion ${cotizacion.numero || ''} por un total de $${Number(cotizacion.total || 0).toLocaleString('es-CL')}.\n\nEl documento se abrio para imprimir o guardar como PDF.\n\nSaludos.`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };
  const downloadPdf = (cotizacion) => {
    const win = openHtmlDocument(buildCotizacionHtml(cotizacion));
    setTimeout(() => win.print(), 300);
  };
  const editCotizacion = (cotizacion) => {
    setCotizacionDraft(cotizacion);
    setActiveModule('operaciones-cotizaciones');
  };
  const deleteCotizacion = (cotizacion) => {
    if (!window.confirm(`Eliminar cotizacion ${cotizacion.numero || ''}?`)) return;
    setCotizacionesHistorial(prev => prev.filter(c => c.id !== cotizacion.id));
    setSelectedIds(prev => prev.filter(id => id !== cotizacion.id));
  };
  const openOcModal = (cotizaciones) => setOcModal({
    cotizaciones,
    numeroOC: '',
    fechaOC: new Date().toISOString().split('T')[0],
    estadoOC: 'Recibida',
  });
  const saveOC = () => {
    if (!ocModal?.numeroOC) {
      alert('Ingrese el numero de OC');
      return;
    }
    const cotizaciones = ocModal.cotizaciones || [];
    const totalOC = cotizaciones.reduce((sum, c) => sum + Number(c.total || cotizacionTotals(c.items).total || 0), 0);
    const oc = {
      id: `oc-${Date.now()}`,
      idLicitacion: Array.from(new Set(cotizaciones.map(c => c.idLicitacion).filter(Boolean))).join(', '),
      cliente: Array.from(new Set(cotizaciones.map(c => c.cliente).filter(Boolean))).join(', '),
      numeroOC: ocModal.numeroOC,
      fechaOC: ocModal.fechaOC,
      montoTotalOC: totalOC,
      estadoOC: ocModal.estadoOC || 'Recibida',
      cotizaciones,
      createdAt: new Date().toISOString(),
      pdfName: '',
      pdfData: '',
    };
    setOcRecibidas(prev => [oc, ...prev]);
    setCotizacionesHistorial(prev => prev.map(c => selectedIds.includes(c.id) || cotizaciones.some(q => q.id === c.id) ? { ...c, estado: 'Con OC' } : c));
    setSelectedIds([]);
    setOcModal(null);
    setActiveModule('operaciones-oc-recibidas');
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2">
      {ocModal && (
        <Modal title="Agregar OC" onClose={() => setOcModal(null)}>
          <div className="space-y-4">
            <Input label="N OC" value={ocModal.numeroOC} onChange={e => setOcModal(m => ({ ...m, numeroOC: e.target.value }))} />
            <Input label="Fecha OC" type="date" value={ocModal.fechaOC} onChange={e => setOcModal(m => ({ ...m, fechaOC: e.target.value }))} />
            <Select label="Estado OC" options={['Recibida', 'En revision', 'Aceptada', 'Facturada', 'Cerrada']} value={ocModal.estadoOC} onChange={e => setOcModal(m => ({ ...m, estadoOC: e.target.value }))} />
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              {ocModal.cotizaciones.length} cotizacion(es) seleccionada(s), total ${ocModal.cotizaciones.reduce((sum, c) => sum + Number(c.total || cotizacionTotals(c.items).total || 0), 0).toLocaleString('es-CL')}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="secondary" onClick={() => setOcModal(null)}>Cancelar</Button>
              <Button variant="accent" onClick={saveOC}>Guardar OC</Button>
            </div>
          </div>
        </Modal>
      )}

      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Operaciones / Historial</p>
        <h2 className="text-2xl font-bold text-slate-900">Historial Cotizaciones</h2>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cotizacion, cliente, licitacion, estado..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          {selectedIds.length > 0 && (
            <div className="flex flex-col gap-2 rounded-lg border border-blue-100 bg-blue-50 p-2 sm:flex-row sm:items-center">
              <span className="px-2 text-sm font-semibold text-blue-700">{selectedIds.length} cotizacion(es) seleccionada(s)</span>
              <Button variant="accent" className="text-xs" onClick={() => openOcModal(selectedCotizaciones)} icon={ClipboardList}>Agregar OC</Button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-left border-b">
              <th className="w-10 p-3"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} className="h-4 w-4 rounded border-slate-300 text-blue-600" /></th>
              {['N Cotizacion', 'Fecha', 'ID Licitacion', 'Unidad Negocio', 'Centro Costo', 'Cliente', 'Referencia', 'Total', 'Estado', 'Acciones'].map(h => <th key={h} className="p-3 text-[10px] font-bold uppercase text-slate-500">{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="11" className="px-6 py-12 text-center text-slate-400 italic">No hay cotizaciones guardadas.</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="border-b hover:bg-slate-50">
                  <td className="p-3"><input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleRow(c.id)} className="h-4 w-4 rounded border-slate-300 text-blue-600" /></td>
                  <td className="p-3 font-mono text-xs">{c.numero || '---'}</td>
                  <td className="p-3">{c.fecha || '---'}</td>
                  <td className="p-3">{c.idLicitacion || '---'}</td>
                  <td className="p-3 text-xs">{c.unidadNegocio || 'Casa Matriz'}</td>
                  <td className="p-3 text-xs">{c.centroCosto || 'Operaciones'}</td>
                  <td className="p-3 font-medium">{c.cliente || '---'}</td>
                  <td className="p-3">{c.referencia || c.glosa || '---'}</td>
                  <td className="p-3 font-bold">${Number(c.total || cotizacionTotals(c.items).total || 0).toLocaleString('es-CL')}</td>
                  <td className="p-3">{c.estado || 'Emitida'}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => mailCotizacion(c)} className="p-2 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600" title="Enviar por correo"><Mail size={14} /></button>
                      <button onClick={() => editCotizacion(c)} className="p-2 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600" title="Modificar cotizacion"><Pencil size={14} /></button>
                      <button onClick={() => deleteCotizacion(c)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" title="Eliminar"><Trash2 size={14} /></button>
                      <button onClick={() => downloadPdf(c)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Descargar PDF"><Download size={14} /></button>
                      <button onClick={() => openPdf(c)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Visualizar PDF"><FileDown size={14} /></button>
                      <button onClick={() => openOcModal([c])} className="p-2 rounded-lg text-slate-400 hover:bg-green-50 hover:text-green-600" title="Agregar OC"><ClipboardList size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const OCRecibidas = () => {
  const { ocRecibidas, setOcRecibidas } = useContext(ERPContext);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef(null);
  const [targetOcId, setTargetOcId] = useState(null);

  const normalizeText = (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filtered = ocRecibidas.filter(oc => normalizeText([
    oc.idLicitacion, oc.cliente, oc.numeroOC, oc.fechaOC, oc.montoTotalOC, oc.estadoOC
  ].join(' ')).includes(normalizeText(search)));
  const updateEstado = (oc) => {
    const next = window.prompt('Nuevo estado de OC', oc.estadoOC || 'Recibida');
    if (!next) return;
    setOcRecibidas(prev => prev.map(item => item.id === oc.id ? { ...item, estadoOC: next } : item));
  };
  const attachPdf = (oc) => {
    setTargetOcId(oc.id);
    fileInputRef.current?.click();
  };
  const handleFile = (file) => {
    if (!file || !targetOcId) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setOcRecibidas(prev => prev.map(oc => oc.id === targetOcId ? { ...oc, pdfName: file.name, pdfData: event.target.result } : oc));
      setTargetOcId(null);
    };
    reader.readAsDataURL(file);
  };
  const viewCotizaciones = (oc) => {
    const rows = (oc.cotizaciones || []).map(c => `<tr><td>${c.numero || ''}</td><td>${c.cliente || ''}</td><td>${c.idLicitacion || ''}</td><td>$${Number(c.total || cotizacionTotals(c.items).total || 0).toLocaleString('es-CL')}</td></tr>`).join('');
    openHtmlDocument(`<html><head><title>Cotizaciones OC ${oc.numeroOC}</title><style>body{font-family:Arial;padding:24px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #cbd5e1;padding:8px;font-size:12px}th{background:#e5e7eb}</style></head><body><h2>Cotizaciones relacionadas OC ${oc.numeroOC}</h2><table><thead><tr><th>Cotizacion</th><th>Cliente</th><th>ID Licitacion</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
  };
  const viewOC = (oc) => {
    if (oc.pdfData) {
      window.open(oc.pdfData, '_blank');
      return;
    }
    openHtmlDocument(`<html><head><title>OC ${oc.numeroOC}</title><style>body{font-family:Arial;padding:24px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px}.box{border:1px solid #cbd5e1;padding:10px}</style></head><body><h2>Orden de Compra ${oc.numeroOC}</h2><div class="grid"><div class="box"><b>ID Licitacion</b><br/>${oc.idLicitacion || ''}</div><div class="box"><b>Cliente</b><br/>${oc.cliente || ''}</div><div class="box"><b>Fecha OC</b><br/>${oc.fechaOC || ''}</div><div class="box"><b>Monto Total OC</b><br/>$${Number(oc.montoTotalOC || 0).toLocaleString('es-CL')}</div><div class="box"><b>Estado OC</b><br/>${oc.estadoOC || ''}</div><div class="box"><b>PDF adjunto</b><br/>${oc.pdfName || 'Sin adjunto'}</div></div></body></html>`);
  };
  const deleteOC = (oc) => {
    if (!window.confirm(`Eliminar OC ${oc.numeroOC}?`)) return;
    setOcRecibidas(prev => prev.filter(item => item.id !== oc.id));
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Operaciones / Historial</p>
        <h2 className="text-2xl font-bold text-slate-900">OC Recibidas</h2>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <div className="relative w-full lg:max-w-md">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar OC, cliente, licitacion, estado..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-left border-b">
              {['ID Licitacion', 'Cliente', 'N OC', 'Fecha OC', 'Monto Total OC', 'Estado OC', 'Acciones'].map(h => <th key={h} className="p-3 text-[10px] font-bold uppercase text-slate-500">{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-400 italic">No hay OC recibidas.</td></tr>
              ) : filtered.map(oc => (
                <tr key={oc.id} className="border-b hover:bg-slate-50">
                  <td className="p-3">{oc.idLicitacion || '---'}</td>
                  <td className="p-3 font-medium">{oc.cliente || '---'}</td>
                  <td className="p-3 font-mono text-xs">{oc.numeroOC}</td>
                  <td className="p-3">{oc.fechaOC}</td>
                  <td className="p-3 font-bold">${Number(oc.montoTotalOC || 0).toLocaleString('es-CL')}</td>
                  <td className="p-3">{oc.estadoOC}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => updateEstado(oc)} className="p-2 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600" title="Modificar estado"><Pencil size={14} /></button>
                      <button onClick={() => attachPdf(oc)} className="p-2 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600" title="Adjuntar PDF"><Upload size={14} /></button>
                      <button onClick={() => viewCotizaciones(oc)} className="p-2 rounded-lg text-slate-400 hover:bg-green-50 hover:text-green-600" title="Ver cotizacion relacionada"><FileText size={14} /></button>
                      <button onClick={() => viewOC(oc)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Ver OC"><FileDown size={14} /></button>
                      <button onClick={() => deleteOC(oc)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" title="Eliminar OC"><Trash2 size={14} /></button>
                    </div>
                    {oc.pdfName && <p className="mt-1 text-right text-[10px] text-slate-400">{oc.pdfName}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- RENDICIONES: CONSTANTES ---
const CUENTAS_CONTABLES = [
  '1100 - Caja',
  '1101 - Banco',
  '1110 - Fondo por rendir',
  '1200 - Cuentas por cobrar',
  '2100 - Proveedores',
  '5100 - Gastos de administración',
  '5101 - Gastos de operación',
  '5102 - Gastos de personal',
  '5103 - Viáticos y estadía',
  '5104 - Gastos de transporte',
  '5105 - Materiales e insumos',
  '5106 - Gastos de representación',
  '5107 - Servicios externos',
  '5108 - Gastos varios',
  '6100 - Costos directos de proyecto',
];

const TIPOS_DOCUMENTO_RENDICION = [
  'Boleta',
  'Factura',
  'Boleta de Honorarios',
  'Nota de Débito',
  'Nota de Crédito',
  'Recibo',
  'Ticket',
  'Otro',
];

const generateRendicionFolio = () => {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `REND-${year}-${seq}`;
};

const todayISO = () => new Date().toISOString().split('T')[0];

const createEmptyRendicionItem = () => ({
  id: Date.now() + Math.random(),
  fecha: todayISO(),
  numeroDoc: '',
  tipoDoc: 'Boleta',
  razonSocial: '',
  monto: '',
  cuentaContable: CUENTAS_CONTABLES[0],
  observaciones: '',
  archivoNombre: '',
  archivoData: '',
});

// --- RENDICIONES: FORMULARIO ---
const NuevaRendicion = () => {
  const { currentUser, rendiciones, setRendiciones, setActiveModule } = useContext(ERPContext);
  const [folio] = useState(generateRendicionFolio());
  const [montoAsignado, setMontoAsignado] = useState('');
  const [tipo, setTipo] = useState('rendicion');
  const [fecha, setFecha] = useState(todayISO());
  const [items, setItems] = useState([createEmptyRendicionItem()]);
  const [saving, setSaving] = useState(false);
  const fileRefs = useRef({});

  const updateItem = (id, field, value) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it));

  const addItem = () => setItems(prev => [...prev, createEmptyRendicionItem()]);

  const removeItem = (id) => setItems(prev => prev.filter(it => it.id !== id));

  const attachFile = (id) => {
    if (!fileRefs.current[id]) return;
    fileRefs.current[id].click();
  };

  const handleFileChange = (id, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => updateItem(id, 'archivoNombre', file.name) ||
      setItems(prev => prev.map(it => it.id === id ? { ...it, archivoNombre: file.name, archivoData: e.target.result } : it));
    reader.readAsDataURL(file);
  };

  const total = items.reduce((sum, it) => sum + (parseFloat(it.monto) || 0), 0);

  const handleSave = () => {
    if (!montoAsignado) { alert('Ingrese el monto asignado.'); return; }
    setSaving(true);
    const nueva = {
      id: Date.now().toString(),
      folio,
      responsable: currentUser.name,
      montoAsignado: parseFloat(montoAsignado) || 0,
      tipo,
      fecha,
      items: items.map(it => ({ ...it })),
      total,
      estado: 'Pendiente',
      fechaCreacion: new Date().toISOString(),
    };
    setRendiciones(prev => [nueva, ...prev]);
    setSaving(false);
    alert(`Rendición ${folio} guardada correctamente.`);
    setActiveModule('operaciones-historial-rendiciones');
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Operaciones / Rendiciones</p>
        <h2 className="text-2xl font-bold text-slate-900">Nueva Rendición</h2>
      </div>

      {/* Cabecera */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Datos de la Rendición</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Folio</label>
            <input readOnly value={folio} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono text-slate-600 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Responsable</label>
            <input readOnly value={currentUser.name} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Fecha</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Monto Asignado</label>
            <input type="number" min="0" value={montoAsignado} onChange={e => setMontoAsignado(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo</label>
            <div className="flex gap-4 mt-2">
              {['rendicion', 'devolucion'].map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="tipo" value={t} checked={tipo === t} onChange={() => setTipo(t)}
                    className="accent-blue-600" />
                  <span className="text-sm font-medium text-slate-700 capitalize">
                    {t === 'rendicion' ? 'Rendición' : 'Devolución'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de detalle */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Detalle de Documentos</h3>
          <button onClick={addItem}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors">
            <Plus size={14} /> Agregar fila
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b">
                {['Fecha', 'N° Documento', 'Tipo Doc.', 'Razón Social', 'Monto', 'Cuenta Contable', 'Observaciones', 'Respaldo', ''].map(h => (
                  <th key={h} className="p-3 text-[10px] font-bold uppercase text-slate-500 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id} className="border-b hover:bg-slate-50">
                  <td className="p-2">
                    <input type="date" value={it.fecha} onChange={e => updateItem(it.id, 'fecha', e.target.value)}
                      className="w-32 rounded border border-slate-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none" />
                  </td>
                  <td className="p-2">
                    <input value={it.numeroDoc} onChange={e => updateItem(it.id, 'numeroDoc', e.target.value)}
                      placeholder="Nº doc" className="w-24 rounded border border-slate-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none" />
                  </td>
                  <td className="p-2">
                    <select value={it.tipoDoc} onChange={e => updateItem(it.id, 'tipoDoc', e.target.value)}
                      className="w-28 rounded border border-slate-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none bg-white">
                      {TIPOS_DOCUMENTO_RENDICION.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td className="p-2">
                    <input value={it.razonSocial} onChange={e => updateItem(it.id, 'razonSocial', e.target.value)}
                      placeholder="Razón social" className="w-36 rounded border border-slate-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none" />
                  </td>
                  <td className="p-2">
                    <input type="number" min="0" value={it.monto} onChange={e => updateItem(it.id, 'monto', e.target.value)}
                      placeholder="0" className="w-24 rounded border border-slate-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none" />
                  </td>
                  <td className="p-2">
                    <select value={it.cuentaContable} onChange={e => updateItem(it.id, 'cuentaContable', e.target.value)}
                      className="w-52 rounded border border-slate-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none bg-white">
                      {CUENTAS_CONTABLES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="p-2">
                    <input value={it.observaciones} onChange={e => updateItem(it.id, 'observaciones', e.target.value)}
                      placeholder="Observaciones" className="w-36 rounded border border-slate-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none" />
                  </td>
                  <td className="p-2">
                    <input ref={el => fileRefs.current[it.id] = el} type="file" accept="application/pdf,image/*" className="hidden"
                      onChange={e => handleFileChange(it.id, e.target.files?.[0])} />
                    <button onClick={() => attachFile(it.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 text-xs transition-colors"
                      title="Adjuntar respaldo">
                      <Upload size={12} />
                      <span className="max-w-[80px] truncate">{it.archivoNombre || 'Adjuntar'}</span>
                    </button>
                  </td>
                  <td className="p-2">
                    <button onClick={() => removeItem(it.id)} disabled={items.length === 1}
                      className="p-1.5 rounded text-slate-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200">
                <td colSpan="4" className="p-3 text-right text-xs font-bold text-slate-600 uppercase">Total Rendición:</td>
                <td className="p-3 text-sm font-black text-blue-700">${total.toLocaleString('es-CL')}</td>
                <td colSpan="4" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60 transition-colors shadow">
          <CheckCircle size={16} /> {saving ? 'Guardando…' : 'Guardar Rendición'}
        </button>
      </div>
    </div>
  );
};

// --- RENDICIONES: HISTORIAL ---
const HistorialRendiciones = () => {
  const { rendiciones, setRendiciones } = useContext(ERPContext);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const normalizeText = (v) => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const filtered = rendiciones.filter(r =>
    normalizeText([r.folio, r.responsable, r.fecha, r.montoAsignado, r.estado, r.tipo].join(' ')).includes(normalizeText(search))
  );

  // --- selección múltiple ---
  const allFilteredIds = filtered.map(r => r.id);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedIds.includes(id));
  const someSelected = allFilteredIds.some(id => selectedIds.includes(id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...allFilteredIds])]);
    }
  };

  const toggleOne = (id) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const selectedRendiciones = rendiciones.filter(r => selectedIds.includes(r.id));

  // --- helpers ---
  const estadoBadge = (estado) => {
    const map = { 'Aprobada': 'bg-green-100 text-green-700', 'Rechazada': 'bg-red-100 text-red-700', 'Pendiente': 'bg-yellow-100 text-yellow-700' };
    return map[estado] || 'bg-slate-100 text-slate-600';
  };

  const rendicionBlock = (r) => {
    const filas = (r.items || []).map(it =>
      `<tr>
        <td>${it.fecha || ''}</td><td>${it.numeroDoc || ''}</td><td>${it.tipoDoc || ''}</td>
        <td>${it.razonSocial || ''}</td>
        <td style="text-align:right">$${Number(it.monto || 0).toLocaleString('es-CL')}</td>
        <td>${it.cuentaContable || ''}</td><td>${it.observaciones || ''}</td>
        <td>${it.archivoNombre || '—'}</td>
      </tr>`
    ).join('');
    return `
      <div class="rend-block">
        <h2>Rendición ${r.folio}</h2>
        <div class="meta">
          <div class="box"><b>Responsable</b>${r.responsable || ''}</div>
          <div class="box"><b>Fecha</b>${r.fecha || ''}</div>
          <div class="box"><b>Tipo</b>${r.tipo === 'devolucion' ? 'Devolución' : 'Rendición'}</div>
          <div class="box"><b>Monto Asignado</b>$${Number(r.montoAsignado || 0).toLocaleString('es-CL')}</div>
          <div class="box"><b>Total Rendido</b>$${Number(r.total || 0).toLocaleString('es-CL')}</div>
          <div class="box"><b>Estado</b>${r.estado || ''}</div>
        </div>
        <table>
          <thead><tr>
            <th>Fecha</th><th>N° Doc.</th><th>Tipo Doc.</th><th>Razón Social</th>
            <th>Monto</th><th>Cuenta Contable</th><th>Observaciones</th><th>Respaldo</th>
          </tr></thead>
          <tbody>${filas}</tbody>
          <tfoot><tr>
            <td colspan="4" style="text-align:right">Total:</td>
            <td style="text-align:right">$${Number(r.total || 0).toLocaleString('es-CL')}</td>
            <td colspan="3"></td>
          </tr></tfoot>
        </table>
      </div>`;
  };

  const htmlStyles = `
    body{font-family:Arial,sans-serif;padding:32px;color:#1e293b}
    h1{font-size:20px;margin-bottom:4px;color:#0f172a}
    .subtitle{font-size:12px;color:#64748b;margin-bottom:24px}
    .rend-block{margin-bottom:40px;page-break-inside:avoid}
    h2{font-size:14px;font-weight:bold;color:#1e40af;border-bottom:2px solid #bfdbfe;padding-bottom:4px;margin-bottom:12px}
    .meta{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
    .box{border:1px solid #e2e8f0;padding:8px 10px;border-radius:6px;font-size:11px}
    .box b{display:block;color:#64748b;font-size:9px;text-transform:uppercase;margin-bottom:2px}
    table{width:100%;border-collapse:collapse;font-size:10px;margin-bottom:8px}
    th{background:#f1f5f9;padding:6px 5px;text-align:left;font-size:9px;text-transform:uppercase;color:#64748b;border:1px solid #e2e8f0}
    td{padding:5px;border:1px solid #e2e8f0}
    tfoot td{font-weight:bold;background:#f8fafc}
    .resumen{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin-bottom:32px}
    .resumen h3{font-size:13px;font-weight:bold;color:#1e40af;margin-bottom:10px}
    .resumen-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
    .resumen-item{font-size:11px}.resumen-item b{display:block;color:#64748b;font-size:9px;text-transform:uppercase}
    .resumen-total{font-size:16px;font-weight:900;color:#1e40af}
    @media print{.rend-block{page-break-after:always}}`;

  const printRendicion = (r) => {
    openHtmlDocument(`<html><head><title>Rendición ${r.folio}</title><style>${htmlStyles}</style></head>
      <body>${rendicionBlock(r)}</body></html>`);
  };

  const generateInforme = () => {
    if (selectedRendiciones.length === 0) return;
    const totalGeneral = selectedRendiciones.reduce((s, r) => s + Number(r.total || 0), 0);
    const montoAsignadoTotal = selectedRendiciones.reduce((s, r) => s + Number(r.montoAsignado || 0), 0);
    const fecha = new Date().toLocaleDateString('es-CL');

    const resumenFilas = selectedRendiciones.map(r =>
      `<tr>
        <td>${r.folio}</td><td>${r.responsable}</td>
        <td>${r.tipo === 'devolucion' ? 'Devolución' : 'Rendición'}</td>
        <td>${r.fecha}</td>
        <td style="text-align:right">$${Number(r.montoAsignado || 0).toLocaleString('es-CL')}</td>
        <td style="text-align:right">$${Number(r.total || 0).toLocaleString('es-CL')}</td>
        <td>${r.estado}</td>
      </tr>`
    ).join('');

    const detalle = selectedRendiciones.map(r => rendicionBlock(r)).join('');

    openHtmlDocument(`<html><head><title>Informe Consolidado de Rendiciones</title><style>${htmlStyles}</style></head>
      <body>
        <h1>Informe Consolidado de Rendiciones</h1>
        <p class="subtitle">Generado el ${fecha} — ${selectedRendiciones.length} rendición(es) seleccionada(s)</p>
        <div class="resumen">
          <h3>Resumen General</h3>
          <div class="resumen-grid">
            <div class="resumen-item"><b>N° Rendiciones</b>${selectedRendiciones.length}</div>
            <div class="resumen-item"><b>Monto Asignado Total</b><span class="resumen-total">$${montoAsignadoTotal.toLocaleString('es-CL')}</span></div>
            <div class="resumen-item"><b>Total Rendido</b><span class="resumen-total">$${totalGeneral.toLocaleString('es-CL')}</span></div>
            <div class="resumen-item"><b>Diferencia</b><span class="resumen-total" style="color:${montoAsignadoTotal - totalGeneral >= 0 ? '#15803d' : '#dc2626'}">$${(montoAsignadoTotal - totalGeneral).toLocaleString('es-CL')}</span></div>
          </div>
        </div>
        <table>
          <thead><tr>
            <th>Folio</th><th>Responsable</th><th>Tipo</th><th>Fecha</th>
            <th>Monto Asignado</th><th>Total Rendido</th><th>Estado</th>
          </tr></thead>
          <tbody>${resumenFilas}</tbody>
          <tfoot><tr>
            <td colspan="4" style="text-align:right;font-weight:bold">Totales:</td>
            <td style="text-align:right;font-weight:bold">$${montoAsignadoTotal.toLocaleString('es-CL')}</td>
            <td style="text-align:right;font-weight:bold">$${totalGeneral.toLocaleString('es-CL')}</td>
            <td></td>
          </tr></tfoot>
        </table>
        <div style="margin-top:40px">${detalle}</div>
      </body></html>`);
  };

  const updateEstado = (r) => {
    const next = window.prompt('Nuevo estado (Pendiente / Aprobada / Rechazada):', r.estado || 'Pendiente');
    if (!next) return;
    setRendiciones(prev => prev.map(item => item.id === r.id ? { ...item, estado: next } : item));
  };

  const deleteRendicion = (r) => {
    if (!window.confirm(`¿Eliminar rendición ${r.folio}?`)) return;
    setSelectedIds(prev => prev.filter(id => id !== r.id));
    setRendiciones(prev => prev.filter(item => item.id !== r.id));
  };

  const viewRendicion = (r) => {
    const hasFiles = (r.items || []).some(it => it.archivoData);
    if (hasFiles) {
      const win = window.open('', '_blank');
      win.document.write(`<html><head><title>Respaldos ${r.folio}</title>
        <style>body{font-family:Arial;padding:24px}h2{font-size:16px;margin-bottom:16px}.item{margin-bottom:32px}iframe{width:100%;height:600px;border:1px solid #cbd5e1;border-radius:6px}</style>
        </head><body><h2>Respaldos — ${r.folio}</h2>`);
      (r.items || []).filter(it => it.archivoData).forEach(it => {
        win.document.write(`<div class="item"><p><b>${it.archivoNombre}</b> | ${it.razonSocial} | $${Number(it.monto||0).toLocaleString('es-CL')}</p>
          <iframe src="${it.archivoData}"></iframe></div>`);
      });
      win.document.write('</body></html>');
      win.document.close();
    } else {
      printRendicion(r);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Operaciones / Historial</p>
        <h2 className="text-2xl font-bold text-slate-900">Historial Rendiciones</h2>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] lg:max-w-md">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar folio, responsable, estado…"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
                {selectedIds.length} seleccionada{selectedIds.length > 1 ? 's' : ''}
              </span>
              <button onClick={generateInforme}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm">
                <FileSpreadsheet size={14} /> Generar Informe
              </button>
              <button onClick={() => setSelectedIds([])}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" title="Limpiar selección">
                <X size={14} />
              </button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left border-b">
                <th className="p-3 w-10">
                  <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-slate-300 accent-blue-600 cursor-pointer" />
                </th>
                {['Folio', 'Responsable', 'Tipo', 'Fecha', 'Monto Asignado', 'Total Rendido', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="p-3 text-[10px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="9" className="px-6 py-12 text-center text-slate-400 italic">No hay rendiciones registradas.</td></tr>
              ) : filtered.map(r => {
                const isSelected = selectedIds.includes(r.id);
                return (
                  <tr key={r.id} className={`border-b transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                    <td className="p-3">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleOne(r.id)}
                        className="w-4 h-4 rounded border-slate-300 accent-blue-600 cursor-pointer" />
                    </td>
                    <td className="p-3 font-mono text-xs font-bold text-slate-700">{r.folio}</td>
                    <td className="p-3 font-medium">{r.responsable}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${r.tipo === 'devolucion' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                        {r.tipo === 'devolucion' ? 'Devolución' : 'Rendición'}
                      </span>
                    </td>
                    <td className="p-3">{r.fecha}</td>
                    <td className="p-3 font-bold">${Number(r.montoAsignado || 0).toLocaleString('es-CL')}</td>
                    <td className="p-3">${Number(r.total || 0).toLocaleString('es-CL')}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${estadoBadge(r.estado)}`}>
                        {r.estado}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => updateEstado(r)} className="p-2 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600" title="Modificar estado"><Pencil size={14} /></button>
                        <button onClick={() => printRendicion(r)} className="p-2 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600" title="Imprimir PDF rendición"><FileDown size={14} /></button>
                        <button onClick={() => viewRendicion(r)} className="p-2 rounded-lg text-slate-400 hover:bg-green-50 hover:text-green-600" title="Ver PDF y respaldos"><FileText size={14} /></button>
                        <button onClick={() => deleteRendicion(r)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" title="Eliminar rendición"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- MANTENEDORES: CLIENTES ---
const MantenedoresClientes = () => {
  const { clientes, setClientes } = useContext(ERPContext);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [preview, setPreview] = useState([]);
  const [previewErrors, setPreviewErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [modal, setModal] = useState(null); // null | { mode: 'new'|'edit', data: {...} }
  const [saving, setSaving] = useState(false);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [emailColumnMissing, setEmailColumnMissing] = useState(false);
  const fileInputRef = useRef(null);

  const COLUMNS = [
    { key: 'name',               label: 'Nombre',                required: true  },
    { key: 'rut',                label: 'RUT',                   required: true  },
    { key: 'email',              label: 'Email',                 required: false },
    { key: 'encargado_contrato', label: 'Encargado de Contrato', required: false },
    { key: 'email_contacto',     label: 'Email de Contacto',     required: false },
  ];

  const isClienteSchemaError = (msg) => msg && (msg.includes('schema cache') || msg.includes('column'));

  useEffect(() => {
    supabase.from('clientes').select('id_RUT, Email, Encargado_Contrato, Email_contacto, Estado').limit(1)
      .then(({ error }) => { if (error && isClienteSchemaError(error.message)) setSchemaMissing(true); });
    supabase.from('clientes').select('email_institucional').limit(1)
      .then(({ error }) => { if (error && isClienteSchemaError(error.message)) setEmailColumnMissing(true); });
  }, []);

  useEffect(() => {
    const validIds = new Set(clientes.map(c => c.id));
    setSelectedIds(prev => prev.filter(id => validIds.has(id)));
  }, [clientes]);

  const fullPayload = (data) => emailColumnMissing ? clienteFullPayload(data) : clienteExtendedPayload(data);
  const basePayload = clienteBasePayload;
  const isEmailColumnError = (msg) => msg && msg.includes('email_institucional');

  const safeInsert = async (rows, single = false) => {
    const sourceRows = Array.isArray(rows) ? rows : [rows];
    let usedBaseSchema = schemaMissing;
    const payload = schemaMissing ? sourceRows.map(basePayload) : sourceRows.map(fullPayload);
    let res = await supabaseRequest(() => {
      let query = supabase.from('clientes').insert(payload).select();
      if (single) query = query.single();
      return query;
    });

    if (res.error && isClienteSchemaError(res.error.message)) {
      if (isEmailColumnError(res.error.message)) {
        setEmailColumnMissing(true);
        res = await supabaseRequest(() => {
          let retry = supabase.from('clientes').insert(sourceRows.map(clienteFullPayload)).select();
          if (single) retry = retry.single();
          return retry;
        });
        return { ...res, usedBaseSchema };
      }

      usedBaseSchema = true;
      setSchemaMissing(true);
      res = await supabaseRequest(() => {
        let retry = supabase.from('clientes').insert(sourceRows.map(basePayload)).select();
        if (single) retry = retry.single();
        return retry;
      });
    }

    return { ...res, usedBaseSchema };
  };

  const safeUpdate = async (data) => {
    const payload = schemaMissing ? basePayload(data) : fullPayload(data);
    let res = await supabaseRequest(() => supabase.from('clientes').update(payload).eq('id_RUT', data.id).select().single());

    if (res.error && isClienteSchemaError(res.error.message)) {
      if (isEmailColumnError(res.error.message)) {
        setEmailColumnMissing(true);
        res = await supabaseRequest(() => supabase.from('clientes').update(clienteFullPayload(data)).eq('id_RUT', data.id).select().single());
        return res;
      }

      setSchemaMissing(true);
      res = await supabaseRequest(() => supabase.from('clientes').update(basePayload(data)).eq('id_RUT', data.id).select().single());
    }

    return res;
  };

  // ---- CRUD manual ----
  const emptyForm = { name: '', rut: '', email: '', encargado_contrato: '', email_contacto: '' };
  const openNew  = () => setModal({ mode: 'new',  data: { ...emptyForm } });
  const openEdit = (c) => setModal({ mode: 'edit', data: {
    id: c.id, name: c.name || '', rut: c.rut || '', email: c.email || '',
    encargado_contrato: c.encargado_contrato || '', email_contacto: c.email_contacto || '',
  }});
  const closeModal = () => { setModal(null); setSaving(false); };
  const setField = (key, val) => setModal(m => ({ ...m, data: { ...m.data, [key]: val } }));

  const handleSave = async () => {
    const { mode, data } = modal;
    if (!data.name || !data.rut) return;
    setSaving(true);

    const rutExists = clientes.some(c => c.rut?.toLowerCase().replace(/[\s.]/g, '') === data.rut.toLowerCase().replace(/[\s.]/g, '') && c.id !== data.id);
    if (rutExists) {
      alert(`Error: El RUT ${data.rut} ya pertenece a otro cliente.`);
      setSaving(false);
      return;
    }

    try {
      if (mode === 'new') {
        const { data: row, error } = await safeInsert(data, true);
        if (error) throw error;
        setClientes(prev => [...prev, normalizeCliente(row)]);
      } else {
        const { data: row, error } = await safeUpdate(data);
        if (error) throw error;
        setClientes(prev => prev.map(c => c.id === row.id ? normalizeCliente(row) : c));
      }
      closeModal();
    } catch (err) {
      alert('Error al guardar: ' + friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cliente) => {
    if (!window.confirm(`¿Eliminar el cliente "${cliente.name}"? Esta acción no se puede deshacer.`)) return;
    const { error } = await supabaseRequest(() => supabase.from('clientes').delete().eq('id_RUT', cliente.id));
    if (error) {
      alert('Error al borrar: ' + friendlyError(error));
      return;
    }
    setClientes(prev => prev.filter(c => c.id !== cliente.id));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Eliminar ${selectedIds.length} cliente(s) seleccionado(s)? Esta accion no se puede deshacer.`)) return;

    const { error } = await supabaseRequest(() => supabase.from('clientes').delete().in('id_RUT', selectedIds));
    if (error) {
      alert('Error al borrar clientes: ' + friendlyError(error));
      return;
    }

    setClientes(prev => prev.filter(c => !selectedIds.includes(c.id)));
    setSelectedIds([]);
  };

  // ---- Carga Excel ----
  const exportTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      COLUMNS.map(c => c.label),
      ['Clínica Ejemplo', '76.123.456-K', 'contacto@clinica.cl', 'Juan Pérez', 'jperez@clinica.cl'],
    ]);
    ws['!cols'] = [{ wch: 35 }, { wch: 18 }, { wch: 32 }, { wch: 28 }, { wch: 32 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    XLSX.writeFile(wb, 'plantilla_clientes.xlsx');
  };

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
      const normalize = (val) => String(val).trim();
      const mapped = rows.map((row, idx) => {
        const entry = { name: '', rut: '', email: '', encargado_contrato: '', email_contacto: '', _row: idx + 2 };
        const keys = Object.keys(row);
        COLUMNS.forEach(col => {
          const match = keys.find(k => k.toLowerCase().includes(col.label.toLowerCase()));
          if (match) entry[col.key] = normalize(row[match]);
        });
        return entry;
      }).filter(r => r.name || r.rut);

      const errors = [];
      mapped.forEach(r => {
        if (!r.name) errors.push(`Fila ${r._row}: columna "Nombre" es requerida`);
        if (!r.rut)  errors.push(`Fila ${r._row}: columna "RUT" es requerida`);
      });
      setPreview(mapped);
      setPreviewErrors(errors);
      setImportResult(null);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (previewErrors.length > 0) return;
    setImporting(true);
    try {
      const emailProbe = await supabaseRequest(() => supabase.from('clientes').select('email_institucional').limit(1));
      const missingEmailColumn = emailColumnMissing || (emailProbe.error && isClienteSchemaError(emailProbe.error.message));
      if (missingEmailColumn) setEmailColumnMissing(true);

      const savedRows = [];
      let usedBaseSchema = false;
      let created = 0;
      let updated = 0;

      for (const row of preview) {
        const existing = clientes.find(c => normalizeKey(c.rut) === normalizeKey(row.rut));
        if (existing) {
          const { data, error } = await safeUpdate({ ...row, id: existing.id });
          if (error) throw error;
          savedRows.push(normalizeCliente(data));
          updated += 1;
        } else {
          const { data, error, usedBaseSchema: usedBase } = await safeInsert(row, true);
          if (error) throw error;
          usedBaseSchema = usedBaseSchema || usedBase;
          savedRows.push(normalizeCliente(data));
          created += 1;
        }
      }

      setClientes(prev => {
        let next = [...prev];
        savedRows.forEach(row => {
          const index = next.findIndex(c => c.id === row.id || normalizeKey(c.rut) === normalizeKey(row.rut));
          if (index >= 0) next[index] = row;
          else next.push(row);
        });
        return next;
      });
      setImportResult({
        ok: true,
        count: savedRows.length,
        message: usedBaseSchema
          ? 'Se guardaron nombre y RUT. Para guardar Email, Encargado y Email de Contacto, agrega esas columnas en Supabase.'
          : `${created} creados, ${updated} sobrescritos.${missingEmailColumn && preview.some(r => r.email) ? ' El email institucional no se guardó porque falta la columna email_institucional en Supabase.' : ''}`,
      });
      setPreview([]);
    } catch (err) {
      setImportResult({ ok: false, message: friendlyError(err) });
    } finally {
      setImporting(false);
    }
  };

  const clearPreview = () => {
    setPreview([]);
    setPreviewErrors([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filtered = clientes.filter(c => {
    const t = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(t) ||
      c.rut?.toLowerCase().includes(t)  ||
      c.email?.toLowerCase().includes(t) ||
      c.encargado_contrato?.toLowerCase().includes(t) ||
      c.email_contacto?.toLowerCase().includes(t)
    );
  });
  const filteredIds = filtered.map(c => c.id);
  const selectedVisibleIds = filteredIds.filter(id => selectedIds.includes(id));
  const allVisibleSelected = filteredIds.length > 0 && selectedVisibleIds.length === filteredIds.length;
  const toggleRowSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };
  const toggleVisibleSelection = () => {
    setSelectedIds(prev => {
      if (allVisibleSelected) return prev.filter(id => !filteredIds.includes(id));
      return Array.from(new Set([...prev, ...filteredIds]));
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2">

      {/* Modal nuevo/editar */}
      {modal && (
        <Modal title={modal.mode === 'new' ? 'Nuevo Cliente' : 'Editar Cliente'} onClose={closeModal}>
          <div className="space-y-4">
            <Input label="Nombre *" value={modal.data.name}
              onChange={e => setField('name', e.target.value)} placeholder="Clínica / Hospital" />
            <Input label="RUT *" value={modal.data.rut}
              onChange={e => setField('rut', e.target.value)} placeholder="76.123.456-K" />
            <Input label="Email institucional" value={modal.data.email}
              onChange={e => setField('email', e.target.value)} placeholder="info@clinica.cl" />
            <hr className="border-slate-100" />
            <Input label="Encargado de Contrato" value={modal.data.encargado_contrato}
              onChange={e => setField('encargado_contrato', e.target.value)} placeholder="Ej: Juan Pérez" />
            <Input label="Email de Contacto" value={modal.data.email_contacto}
              onChange={e => setField('email_contacto', e.target.value)} placeholder="jperez@clinica.cl" />
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
              <Button variant="accent" icon={saving ? Cpu : CheckCircle} onClick={handleSave}
                disabled={saving || !modal.data.name || !modal.data.rut}>
                {saving ? 'Guardando...' : modal.mode === 'new' ? 'Crear Cliente' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Mantenedores</p>
          <h2 className="text-2xl font-bold text-slate-900">Clientes</h2>
          <p className="text-slate-500 text-sm mt-1">Gestión y carga masiva de clientes desde Excel</p>
        </div>
        <div className="flex gap-3 flex-wrap lg:justify-end">
          <Button variant="primary" icon={Plus} onClick={openNew}>Nuevo Cliente</Button>
          <Button variant="secondary" icon={Download} onClick={exportTemplate}>Exportar Plantilla</Button>
          <Button variant="accent" icon={Upload} onClick={() => fileInputRef.current?.click()}>Cargar Excel</Button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden"
            onChange={e => handleFile(e.target.files[0])} />
        </div>
      </div>

      {/* Zona de carga / preview */}
      {preview.length === 0 && importResult === null && (
        <div
          className="border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center gap-4 text-slate-400 hover:border-blue-300 hover:text-blue-400 transition-all cursor-pointer bg-slate-50"
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => fileInputRef.current?.click()}
        >
          <FileSpreadsheet size={40} />
          <div className="text-center">
            <p className="font-semibold text-sm">Arrastra tu archivo Excel aquí</p>
            <p className="text-xs mt-1">o haz clic para seleccionar • .xlsx / .xls</p>
          </div>
          <p className="text-[10px] text-slate-300 mt-1">Columnas: Nombre · RUT · Email · Encargado de Contrato · Email de Contacto</p>
        </div>
      )}

      {/* Preview del archivo cargado */}
      {preview.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-3">
              <FileSpreadsheet size={20} className="text-blue-600" />
              <span className="font-bold text-slate-800">{preview.length} registros listos para importar</span>
              {previewErrors.length > 0 && (
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">{previewErrors.length} errores</span>
              )}
            </div>
            <button onClick={clearPreview} className="text-slate-400 hover:text-slate-700 p-1 rounded"><X size={18} /></button>
          </div>
          {previewErrors.length > 0 && (
            <div className="px-6 py-3 bg-red-50 border-b border-red-100">
              {previewErrors.map((err, i) => (
                <p key={i} className="text-xs text-red-600 flex items-center gap-1.5"><AlertTriangle size={12} /> {err}</p>
              ))}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400">#</th>
                  {COLUMNS.map(c => <th key={c.key} className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400">{c.label}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {preview.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-400 text-xs">{row._row}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{row.name || <span className="text-red-400 italic">vacío</span>}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{row.rut || <span className="text-red-400 italic">vacío</span>}</td>
                    <td className="px-4 py-3 text-slate-500">{row.email || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{row.encargado_contrato || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{row.email_contacto || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
            <Button variant="secondary" onClick={clearPreview}>Cancelar</Button>
            <Button variant="accent" icon={importing ? Cpu : CheckCircle} onClick={handleImport}
              disabled={importing || previewErrors.length > 0}>
              {importing ? 'Importando...' : `Confirmar importación (${preview.length} clientes)`}
            </Button>
          </div>
        </div>
      )}

      {/* Resultado de importación */}
      {importResult && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${importResult.ok ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
          {importResult.ok
            ? <><CheckCircle size={18} /><span className="font-semibold text-sm">{importResult.count} clientes importados correctamente{importResult.message ? `. ${importResult.message}` : ''}</span></>
            : <><AlertCircle size={18} /><span className="font-semibold text-sm">Error: {importResult.message}</span></>
          }
          <button onClick={() => setImportResult(null)} className="ml-auto opacity-60 hover:opacity-100"><X size={16} /></button>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 border-b border-slate-100">
          <div className="relative w-full sm:w-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-56" />
          </div>
          <h3 className="font-bold text-slate-800">Clientes registrados ({clientes.length})</h3>
        </div>
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between gap-3 px-6 py-3 bg-blue-50 border-b border-blue-100">
            <span className="text-sm font-semibold text-blue-700">{selectedIds.length} cliente(s) seleccionado(s)</span>
            <Button variant="danger" icon={Trash2} onClick={handleBulkDelete}>Eliminar seleccionados</Button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left border-b border-slate-100">
                <th className="px-6 py-3 w-10">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleVisibleSelection}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    aria-label="Seleccionar clientes visibles" />
                </th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase text-slate-400">Nombre</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase text-slate-400">RUT</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase text-slate-400">Email</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase text-slate-400">Encargado de Contrato</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase text-slate-400">Email de Contacto</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase text-slate-400">Estado</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase text-slate-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400 italic">
                    {clientes.length === 0 ? 'No hay clientes. Usa "Nuevo Cliente" o carga un Excel.' : 'Sin resultados para la búsqueda.'}
                  </td>
                </tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleRowSelection(c.id)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      aria-label={`Seleccionar cliente ${c.name}`} />
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{c.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{c.rut}</td>
                  <td className="px-6 py-4 text-slate-500">{c.email || '—'}</td>
                  <td className="px-6 py-4 text-slate-700 font-medium">{c.encargado_contrato || '—'}</td>
                  <td className="px-6 py-4 text-slate-500">{c.email_contacto || '—'}</td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-1 rounded-full">Activo</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEdit(c)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Editar cliente">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(c)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-1"
                      title="Borrar cliente">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const CLIENTE_TIPOS = ['No', 'Nacional', 'Prospecto', 'Extranjero', 'Zona Franca'];
const PROVEEDOR_TIPOS = ['No', 'Nacional', 'Honorario', 'Extranjero', 'Agente de Aduanas', 'Zona Franca'];
const TIPOS_CUENTA_BANCO = ['Cuenta Corriente', 'Cuenta Vista', 'Cuenta de Ahorro', 'Cuenta RUT'];

const emptyClienteProveedor = (empresaId = '') => ({
  id: '',
  empresaId,
  rut: '',
  razonSocial: '',
  nombreFantasia: '',
  giro: '',
  idExtranjero: '',
  correoSii: '',
  correoComercial: '',
  tipoCliente: 'No',
  tipoProveedor: 'No',
  direccionPrincipal: '',
  ciudad: '',
  comuna: '',
  region: '',
  pais: 'Chile',
  sucursales: [],
  telefono: '',
  plazoPago: '',
  empresaRelacionada: 'No',
  numeroCuentaBancaria: '',
  banco: '',
  tipoCuenta: 'Cuenta Corriente',
});

const emptySucursalCP = () => ({ id: Date.now() + Math.random(), sucursal: '', direccion: '', comuna: '', ciudad: '', region: '', pais: 'Chile' });

const CLIENTE_PROVEEDOR_COLUMNS = [
  ['rut', 'RUT'],
  ['razonSocial', 'Razon Social'],
  ['nombreFantasia', 'Nombre de Fantasia'],
  ['giro', 'Giro'],
  ['idExtranjero', 'ID Extranjero'],
  ['correoSii', 'Correo Electronico SII'],
  ['correoComercial', 'Correo Electronico Comercial'],
  ['tipoCliente', 'Tipo Cliente'],
  ['tipoProveedor', 'Tipo Proveedor'],
  ['direccionPrincipal', 'Direccion Principal'],
  ['ciudad', 'Ciudad'],
  ['comuna', 'Comuna'],
  ['region', 'Region'],
  ['pais', 'Pais'],
  ['telefono', 'Telefono'],
  ['plazoPago', 'Plazo de Pago'],
  ['empresaRelacionada', 'Empresa Relacionada'],
  ['numeroCuentaBancaria', 'Numero Cuenta Bancaria'],
  ['banco', 'Banco'],
  ['tipoCuenta', 'Tipo de Cuenta'],
  ['sucursal', 'Sucursal'],
  ['sucursalDireccion', 'Sucursal Direccion'],
  ['sucursalComuna', 'Sucursal Comuna'],
  ['sucursalCiudad', 'Sucursal Ciudad'],
  ['sucursalRegion', 'Sucursal Region'],
  ['sucursalPais', 'Sucursal Pais'],
];

const MantenedoresClientesProveedores = () => {
  const { clientes, setClientes, activeEmpresaId, currentEmpresa, sidebarOpen } = useContext(ERPContext);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [preview, setPreview] = useState([]);
  const [previewErrors, setPreviewErrors] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);
  const compactLabelClass = "block text-[10px] font-semibold text-slate-500 uppercase mb-1";
  const compactFieldClass = "w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";
  const compactSelectClass = `${compactFieldClass} bg-white`;

  const empresaClientes = clientes.filter(c => c.empresaId === activeEmpresaId);
  const filtered = empresaClientes.filter(c => [c.rut, c.razonSocial, c.name, c.nombreFantasia, c.giro, c.tipoCliente, c.tipoProveedor].join(' ').toLowerCase().includes(search.toLowerCase()));
  const normalizeHeader = (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  const valueFromRow = (row, label) => {
    const wanted = normalizeHeader(label);
    const key = Object.keys(row).find(k => normalizeHeader(k) === wanted) || Object.keys(row).find(k => normalizeHeader(k).includes(wanted));
    return key ? String(row[key] ?? '').trim() : '';
  };

  const openNew = () => setModal({ mode: 'new', data: emptyClienteProveedor(activeEmpresaId) });
  const openEdit = (record) => setModal({ mode: 'edit', data: { ...emptyClienteProveedor(activeEmpresaId), ...record, razonSocial: record.razonSocial || record.name || '', sucursales: record.sucursales || [] } });
  const closeModal = () => setModal(null);
  const setField = (key, value) => setModal(m => ({ ...m, data: { ...m.data, [key]: value } }));
  const addSucursal = () => setModal(m => ({ ...m, data: { ...m.data, sucursales: [...(m.data.sucursales || []), emptySucursalCP()] } }));
  const updateSucursal = (id, key, value) => setModal(m => ({ ...m, data: { ...m.data, sucursales: (m.data.sucursales || []).map(s => s.id === id ? { ...s, [key]: value } : s) } }));
  const removeSucursal = (id) => setModal(m => ({ ...m, data: { ...m.data, sucursales: (m.data.sucursales || []).filter(s => s.id !== id) } }));

  const saveRecord = () => {
    if (!activeEmpresaId) { alert('Selecciona una empresa activa antes de guardar.'); return; }
    const data = { ...modal.data, empresaId: activeEmpresaId, name: modal.data.razonSocial, email: modal.data.correoComercial || modal.data.correoSii };
    if (!data.rut || !data.razonSocial) { alert('RUT y Razón Social son obligatorios.'); return; }
    const duplicate = clientes.some(c => c.empresaId === activeEmpresaId && normalizeKey(c.rut) === normalizeKey(data.rut) && c.id !== data.id);
    if (duplicate) { alert('Ya existe un cliente/proveedor con ese RUT en la empresa activa.'); return; }
    setClientes(prev => modal.mode === 'new'
      ? [{ ...data, id: `cp-${Date.now()}` }, ...prev]
      : prev.map(c => c.id === data.id ? data : c)
    );
    closeModal();
  };

  const deleteRecord = (record) => {
    if (!window.confirm(`Eliminar "${record.razonSocial || record.name}"?`)) return;
    setClientes(prev => prev.filter(c => c.id !== record.id));
  };

  const exportTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      CLIENTE_PROVEEDOR_COLUMNS.map(([, label]) => label),
      ['76.123.456-K', 'Proveedor Ejemplo SPA', 'Proveedor Ejemplo', 'Servicios medicos', '', 'sii@proveedor.cl', 'ventas@proveedor.cl', 'Nacional', 'Nacional', 'Av. Principal 123', 'Santiago', 'Santiago', 'Metropolitana', 'Chile', '+56912345678', '30', 'No', '123456789', 'Banco Estado', 'Cuenta Corriente', 'Casa Matriz', 'Av. Principal 123', 'Santiago', 'Santiago', 'Metropolitana', 'Chile'],
    ]);
    ws['!cols'] = CLIENTE_PROVEEDOR_COLUMNS.map(() => ({ wch: 24 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes_Proveedores');
    XLSX.writeFile(wb, 'plantilla_clientes_proveedores.xlsx');
  };

  const mapImportRow = (row, index) => {
    const entry = emptyClienteProveedor(activeEmpresaId);
    CLIENTE_PROVEEDOR_COLUMNS.forEach(([key, label]) => { entry[key] = valueFromRow(row, label); });
    entry.id = `cp-import-${Date.now()}-${index}`;
    entry.name = entry.razonSocial;
    entry.email = entry.correoComercial || entry.correoSii;
    entry._row = index + 2;
    entry.sucursales = entry.sucursal || entry.sucursalDireccion ? [{
      id: Date.now() + index,
      sucursal: entry.sucursal,
      direccion: entry.sucursalDireccion,
      comuna: entry.sucursalComuna,
      ciudad: entry.sucursalCiudad,
      region: entry.sucursalRegion,
      pais: entry.sucursalPais || 'Chile',
    }] : [];
    delete entry.sucursal; delete entry.sucursalDireccion; delete entry.sucursalComuna; delete entry.sucursalCiudad; delete entry.sucursalRegion; delete entry.sucursalPais;
    return entry;
  };

  const handleFile = async (file) => {
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array', raw: false });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
    const mapped = rows.map(mapImportRow).filter(r => r.rut || r.razonSocial);
    const errors = [];
    mapped.forEach(r => {
      if (!r.rut) errors.push(`Fila ${r._row}: RUT es requerido`);
      if (!r.razonSocial) errors.push(`Fila ${r._row}: Razón Social es requerida`);
    });
    setPreview(mapped);
    setPreviewErrors(errors);
    setImportResult(null);
  };

  const confirmImport = () => {
    if (previewErrors.length > 0) return;
    setClientes(prev => {
      let next = [...prev];
      preview.forEach(row => {
        const existingIndex = next.findIndex(c => c.empresaId === activeEmpresaId && normalizeKey(c.rut) === normalizeKey(row.rut));
        if (existingIndex >= 0) next[existingIndex] = { ...next[existingIndex], ...row, id: next[existingIndex].id };
        else next.unshift(row);
      });
      return next;
    });
    setImportResult({ ok: true, count: preview.length });
    setPreview([]);
    setPreviewErrors([]);
  };

  const clearPreview = () => { setPreview([]); setPreviewErrors([]); setImportResult(null); if (fileInputRef.current) fileInputRef.current.value = ''; };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2">
      {modal && (
        <Modal title={modal.mode === 'new' ? 'Nuevo Cliente y/o Proveedor' : 'Editar Cliente y/o Proveedor'} onClose={closeModal} workspaceFull sidebarOpen={sidebarOpen}>
          <div className="flex min-h-full w-full flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {[
                ['rut','RUT *'], ['razonSocial','Razón Social *'], ['nombreFantasia','Nombre de Fantasía'], ['giro','Giro'], ['idExtranjero','ID Extranjero'],
                ['correoSii','Correo Electrónico SII'], ['correoComercial','Correo Electrónico Comercial'], ['direccionPrincipal','Dirección Principal'],
                ['ciudad','Ciudad'], ['comuna','Comuna'], ['region','Región'], ['pais','País'], ['telefono','Teléfono'], ['plazoPago','Plazo de Pago'],
                ['numeroCuentaBancaria','Número de Cuenta Bancaria'], ['banco','Banco'],
              ].map(([key, label]) => (
                <div key={key}><label className={compactLabelClass}>{label}</label><input value={modal.data[key] || ''} onChange={e => setField(key, e.target.value)} className={compactFieldClass} /></div>
              ))}
              <div><label className={compactLabelClass}>Tipo de Cliente</label><select value={modal.data.tipoCliente} onChange={e => setField('tipoCliente', e.target.value)} className={compactSelectClass}>{CLIENTE_TIPOS.map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label className={compactLabelClass}>Tipo Proveedor</label><select value={modal.data.tipoProveedor} onChange={e => setField('tipoProveedor', e.target.value)} className={compactSelectClass}>{PROVEEDOR_TIPOS.map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label className={compactLabelClass}>Empresa relacionada</label><select value={modal.data.empresaRelacionada} onChange={e => setField('empresaRelacionada', e.target.value)} className={compactSelectClass}><option>No</option><option>Si</option></select></div>
              <div><label className={compactLabelClass}>Tipo de cuenta</label><select value={modal.data.tipoCuenta} onChange={e => setField('tipoCuenta', e.target.value)} className={compactSelectClass}>{TIPOS_CUENTA_BANCO.map(t => <option key={t}>{t}</option>)}</select></div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Sucursales</h4>
                <Button variant="secondary" icon={Plus} onClick={addSucursal}>Agregar sucursal</Button>
              </div>
              <div className="p-3 space-y-2">
                {(modal.data.sucursales || []).map(s => (
                  <div key={s.id} className="grid grid-cols-1 md:grid-cols-7 gap-2">
                    {['sucursal','direccion','comuna','ciudad','region','pais'].map(k => <input key={k} value={s[k] || ''} onChange={e => updateSucursal(s.id, k, e.target.value)} placeholder={k} className="rounded border border-slate-200 px-2 py-1 text-xs" />)}
                    <button onClick={() => removeSucursal(s.id)} className="p-2 rounded text-red-500 hover:bg-red-50"><Trash2 size={14}/></button>
                  </div>
                ))}
                {(modal.data.sucursales || []).length === 0 && <p className="text-xs text-slate-400 italic text-center py-2">Sin sucursales adicionales.</p>}
              </div>
            </div>

            <div className="sticky bottom-0 z-10 mt-auto flex justify-end gap-3 border-t border-slate-100 bg-white/95 py-3 backdrop-blur">
              <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
              <Button variant="accent" icon={CheckCircle} onClick={saveRecord}>Guardar</Button>
            </div>
          </div>
        </Modal>
      )}

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Mantenedores</p>
          <h2 className="text-2xl font-bold text-slate-900">Clientes y/o Proveedores</h2>
          <p className="text-slate-500 text-sm mt-1">Datos separados por empresa activa: {currentEmpresa?.razonSocial || 'Sin empresa seleccionada'}</p>
        </div>
        <div className="flex gap-3 flex-wrap lg:justify-end">
          <Button variant="primary" icon={Plus} onClick={openNew} disabled={!activeEmpresaId}>Nuevo</Button>
          <Button variant="secondary" icon={Download} onClick={exportTemplate}>Exportar Plantilla</Button>
          <Button variant="accent" icon={Upload} onClick={() => fileInputRef.current?.click()} disabled={!activeEmpresaId}>Cargar Excel</Button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => handleFile(e.target.files[0])} />
        </div>
      </div>

      {preview.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
            <span className="font-bold text-slate-800">{preview.length} registros listos para importar</span>
            <button onClick={clearPreview} className="text-slate-400 hover:text-slate-700"><X size={18}/></button>
          </div>
          {previewErrors.length > 0 && <div className="px-6 py-3 bg-red-50 text-xs text-red-600">{previewErrors.map(e => <p key={e}>{e}</p>)}</div>}
          <div className="overflow-x-auto"><table className="w-full text-xs"><thead className="bg-slate-50"><tr>{['RUT','Razón Social','Tipo Cliente','Tipo Proveedor','Correo Comercial','Sucursal'].map(h => <th key={h} className="p-3 text-left uppercase text-slate-400">{h}</th>)}</tr></thead><tbody>{preview.map(r => <tr key={r.id} className="border-t"><td className="p-3">{r.rut}</td><td className="p-3">{r.razonSocial}</td><td className="p-3">{r.tipoCliente}</td><td className="p-3">{r.tipoProveedor}</td><td className="p-3">{r.correoComercial}</td><td className="p-3">{r.sucursales?.[0]?.sucursal || '-'}</td></tr>)}</tbody></table></div>
          <div className="flex justify-end gap-3 px-6 py-4 border-t"><Button variant="secondary" onClick={clearPreview}>Cancelar</Button><Button variant="accent" onClick={confirmImport} disabled={previewErrors.length > 0}>Confirmar importación</Button></div>
        </div>
      )}

      {importResult && <div className="flex items-center gap-3 p-4 rounded-xl border bg-green-50 border-green-100 text-green-700"><CheckCircle size={18}/><span className="font-semibold text-sm">{importResult.count} registros importados correctamente.</span><button onClick={() => setImportResult(null)} className="ml-auto"><X size={16}/></button></div>}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 border-b border-slate-100">
          <div className="relative w-full sm:w-auto"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-8 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none w-full sm:w-64" /></div>
          <h3 className="font-bold text-slate-800">Registros ({empresaClientes.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-left border-b border-slate-100">{['RUT','Razón Social','Nombre Fantasía','Tipo Cliente','Tipo Proveedor','Correo Comercial','Teléfono','Acciones'].map(h => <th key={h} className="px-6 py-3 text-[10px] font-bold uppercase text-slate-400">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan="8" className="px-6 py-12 text-center text-slate-400 italic">{activeEmpresaId ? 'No hay registros para esta empresa.' : 'Selecciona una empresa activa.'}</td></tr> : filtered.map(c => (
                <tr key={c.id} className="border-b hover:bg-slate-50">
                  <td className="px-6 py-4 font-mono text-xs">{c.rut}</td><td className="px-6 py-4 font-semibold">{c.razonSocial || c.name}</td><td className="px-6 py-4">{c.nombreFantasia || '-'}</td><td className="px-6 py-4">{c.tipoCliente || 'No'}</td><td className="px-6 py-4">{c.tipoProveedor || 'No'}</td><td className="px-6 py-4">{c.correoComercial || c.email || '-'}</td><td className="px-6 py-4">{c.telefono || '-'}</td>
                  <td className="px-6 py-4 text-right"><button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"><Pencil size={15}/></button><button onClick={() => deleteRecord(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 ml-1"><Trash2 size={15}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- MANTENEDORES: LICITACIONES ---
const ESTADOS_LICITACION = ['Activa', 'Vencida', 'En revisión', 'Cancelada', 'Suspendida'];

const estadoBadge = (estado) => {
  const map = {
    'Activa':      'bg-green-50 text-green-700',
    'Vencida':     'bg-slate-100 text-slate-500',
    'En revisión': 'bg-amber-50 text-amber-700',
    'Cancelada':   'bg-red-50 text-red-600',
    'Suspendida':  'bg-orange-50 text-orange-600',
  };
  return map[estado] || 'bg-slate-100 text-slate-500';
};

const MIGRATION_SQL = `ALTER TABLE licitaciones
  ADD COLUMN IF NOT EXISTS id_licitacion TEXT,
  ADD COLUMN IF NOT EXISTS fecha_inicio  DATE,
  ADD COLUMN IF NOT EXISTS fecha_termino DATE,
  ADD COLUMN IF NOT EXISTS monto         BIGINT,
  ADD COLUMN IF NOT EXISTS estado        TEXT DEFAULT 'Activa';`;

const isSchemaError = (msg) => msg && (msg.includes('schema cache') || msg.includes('column'));

const MantenedoresLicitaciones = () => {
  const { clientes, licitaciones, setLicitaciones, equipos, setEquipos } = useContext(ERPContext);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [preview, setPreview] = useState([]);
  const [previewErrors, setPreviewErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const fileInputRef = useRef(null);

  // Detecta si las columnas extendidas existen en el esquema
  useEffect(() => {
    supabase.from('licitaciones').select('id_licitacion, fecha_inicio, fecha_termino, monto, estado').limit(1)
      .then(({ error }) => { if (error && isSchemaError(error.message)) setSchemaMissing(true); });
  }, []);

  useEffect(() => {
    const validIds = new Set(licitaciones.map(l => l.id));
    setSelectedIds(prev => prev.filter(id => validIds.has(id)));
  }, [licitaciones]);

  const copySQL = () => {
    navigator.clipboard.writeText(MIGRATION_SQL).then(() => {
      setSqlCopied(true);
      setTimeout(() => setSqlCopied(false), 2500);
    });
  };

  // ---- CRUD manual ----
  const emptyForm = { id_licitacion: '', name: '', cliente_id: '', fecha_inicio: '', fecha_termino: '', monto: '', estado: 'Activa' };
  const openNew  = () => setModal({ mode: 'new', data: { ...emptyForm } });
  const openEdit = (l) => setModal({ mode: 'edit', data: {
    id: l.id,
    id_licitacion: l.id_licitacion || '',
    name:          l.name          || '',
    cliente_id:    l.cliente_id    || '',
    fecha_inicio:  l.fecha_inicio  || '',
    fecha_termino: l.fecha_termino || '',
    monto:         l.monto != null  ? String(l.monto) : '',
    estado:        l.estado        || 'Activa',
  }});
  const closeModal = () => { setModal(null); setSaving(false); };
  const setField = (key, val) => setModal(m => ({ ...m, data: { ...m.data, [key]: val } }));

  const fullPayload = (data) => ({
    id_licitacion: data.id_licitacion || null,
    name:          data.name,
    cliente_id:    data.cliente_id,
    fecha_inicio:  data.fecha_inicio  || null,
    fecha_termino: data.fecha_termino || null,
    monto:         data.monto ? Number(String(data.monto).replace(/\D/g, '')) || null : null,
    estado:        data.estado        || 'Activa',
  });
  const basePayload = (data) => ({ name: data.name, cliente_id: data.cliente_id });
  const hasExtendedData = (r) => Boolean(r.id_licitacion || r.fecha_inicio || r.fecha_termino || r.monto || (r.estado && r.estado !== 'Activa'));

  // Intenta con payload completo; si falla por schema, reintenta con columnas base
  const safeInsert = async (data) => {
    if (schemaMissing) return supabaseRequest(() => supabase.from('licitaciones').insert([basePayload(data)]).select().single());
    const res = await supabaseRequest(() => supabase.from('licitaciones').insert([fullPayload(data)]).select().single());
    if (res.error && isSchemaError(res.error.message)) {
      setSchemaMissing(true);
      return supabaseRequest(() => supabase.from('licitaciones').insert([basePayload(data)]).select().single());
    }
    return res;
  };

  const safeUpdate = async (data) => {
    if (schemaMissing) return supabaseRequest(() => supabase.from('licitaciones').update(basePayload(data)).eq('id', data.id).select().single());
    const res = await supabaseRequest(() => supabase.from('licitaciones').update(fullPayload(data)).eq('id', data.id).select().single());
    if (res.error && isSchemaError(res.error.message)) {
      setSchemaMissing(true);
      return supabaseRequest(() => supabase.from('licitaciones').update(basePayload(data)).eq('id', data.id).select().single());
    }
    return res;
  };

  const handleSave = async () => {
    const { mode, data } = modal;
    if (!data.name || !data.cliente_id) return;
    setSaving(true);
    try {
      if (mode === 'new') {
        const { data: row, error } = await safeInsert(data);
        if (error) throw error;
        setLicitaciones(prev => [...prev, row]);
      } else {
        const { data: row, error } = await safeUpdate(data);
        if (error) throw error;
        setLicitaciones(prev => prev.map(l => l.id === row.id ? row : l));
      }
      closeModal();
    } catch (err) {
      alert('Error al guardar: ' + friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (licitacion) => {
    const equiposAsociados = equipos.filter(e => e.licitacion_id === licitacion.id);
    const detalleEquipos = equiposAsociados.length > 0
      ? `\n\nTambién se eliminarán ${equiposAsociados.length} equipo(s) asociado(s) a esta licitación.`
      : '';

    if (!window.confirm(`¿Eliminar la licitación "${licitacion.name}"?${detalleEquipos}\n\nEsta acción no se puede deshacer.`)) return;

    const { error: equiposError } = await supabaseRequest(() => supabase.from('equipos').delete().eq('licitacion_id', licitacion.id));
    if (equiposError) {
      alert('Error al borrar equipos asociados: ' + friendlyError(equiposError));
      return;
    }

    const { error } = await supabaseRequest(() => supabase.from('licitaciones').delete().eq('id', licitacion.id));
    if (error) {
      alert('Error al borrar: ' + friendlyError(error));
      return;
    }
    setEquipos(prev => prev.filter(e => e.licitacion_id !== licitacion.id));
    setLicitaciones(prev => prev.filter(l => l.id !== licitacion.id));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const equiposAsociados = equipos.filter(e => selectedIds.includes(e.licitacion_id)).length;
    const detalleEquipos = equiposAsociados > 0 ? ` Tambien se eliminaran ${equiposAsociados} equipo(s) asociado(s).` : '';
    if (!window.confirm(`Eliminar ${selectedIds.length} licitacion(es) seleccionada(s)?${detalleEquipos} Esta accion no se puede deshacer.`)) return;

    const { error: equiposError } = await supabaseRequest(() => supabase.from('equipos').delete().in('licitacion_id', selectedIds));
    if (equiposError) {
      alert('Error al borrar equipos asociados: ' + friendlyError(equiposError));
      return;
    }

    const { error } = await supabaseRequest(() => supabase.from('licitaciones').delete().in('id', selectedIds));
    if (error) {
      alert('Error al borrar licitaciones: ' + friendlyError(error));
      return;
    }

    setEquipos(prev => prev.filter(e => !selectedIds.includes(e.licitacion_id)));
    setLicitaciones(prev => prev.filter(l => !selectedIds.includes(l.id)));
    setSelectedIds([]);
  };

  // ---- Carga Excel ----
  const COLUMNS = [
    { key: 'id_licitacion', label: 'ID Licitación',     required: false, hint: 'Código interno, ej: LIC-001' },
    { key: 'name',          label: 'Nombre Licitación', required: true,  hint: 'Nombre único de la licitación' },
    { key: 'rut_cliente',   label: 'RUT Cliente',       required: true,  hint: 'RUT del cliente ya cargado en el sistema' },
    { key: 'fecha_inicio',  label: 'Fecha Inicio',      required: false, hint: 'dd/mm/aaaa' },
    { key: 'fecha_termino', label: 'Fecha Término',     required: false, hint: 'dd/mm/aaaa' },
    { key: 'monto',         label: 'Monto Contrato',    required: false, hint: 'Solo números, sin puntos ni $' },
    { key: 'estado',        label: 'Estado',            required: false, hint: 'Activa / Vencida / En revisión / Cancelada / Suspendida' },
  ];

  const exportTemplate = () => {
    const hintRow   = COLUMNS.map(c => c.hint);
    const exampleRow = ['LIC-001', 'Contrato Mantención 2025', '76.123.456-K', '01/01/2025', '31/12/2025', '5000000', 'Activa'];

    const ws = XLSX.utils.aoa_to_sheet([COLUMNS.map(c => c.label), hintRow, exampleRow]);
    ws['!cols'] = [{ wch: 14 }, { wch: 38 }, { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 14 }];

    const clientesData = [['Nombre Cliente', 'RUT Cliente']];
    clientes.forEach(c => clientesData.push([c.name, c.rut]));
    const wsClientes = XLSX.utils.aoa_to_sheet(clientesData);
    wsClientes['!cols'] = [{ wch: 40 }, { wch: 20 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Licitaciones');
    XLSX.utils.book_append_sheet(wb, wsClientes, 'Referencia_Clientes');
    XLSX.writeFile(wb, 'plantilla_licitaciones.xlsx');
  };

  const normalizeHeader = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  const normalizeExcelDate = (value) => {
    if (!value) return '';
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
    if (typeof value === 'number') {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
    }
    const raw = String(value).trim();
    const match = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
    if (!match) return raw;
    const [, d, m, y] = match;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  };

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const rawRows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
      const normalize = (val) => String(val).trim();
      const hintValues = COLUMNS.map(c => c.hint.toLowerCase());

      const rows = rawRows.filter(row => {
        const firstVal = normalize(Object.values(row)[0]).toLowerCase();
        return !hintValues.includes(firstVal) && firstVal !== '';
      });

      const mapped = rows.map((row, idx) => {
        const entry = { id_licitacion: '', name: '', rut_cliente: '', fecha_inicio: '', fecha_termino: '', monto: '', estado: 'Activa', _row: idx + 2 };
        const keys = Object.keys(row);
        COLUMNS.forEach(col => {
          const wanted = normalizeHeader(col.label);
          const match = keys.find(k => normalizeHeader(k) === wanted || normalizeHeader(k).includes(wanted));
          if (match) entry[col.key] = col.key.startsWith('fecha_') ? normalizeExcelDate(row[match]) : normalize(row[match]);
        });
        return entry;
      }).filter(r => r.name || r.rut_cliente);

      const errors = [];
      mapped.forEach(r => {
        if (!r.name)        errors.push(`Fila ${r._row}: "Nombre Licitación" es requerido`);
        if (!r.rut_cliente) errors.push(`Fila ${r._row}: "RUT Cliente" es requerido`);
        else {
          const ok = clientes.find(c => c.rut?.toLowerCase().replace(/[\s.]/g, '') === r.rut_cliente.toLowerCase().replace(/[\s.]/g, ''));
          if (!ok) errors.push(`Fila ${r._row}: RUT "${r.rut_cliente}" no existe en el sistema`);
        }
      });

      setPreview(mapped);
      setPreviewErrors(errors);
      setImportResult(null);
    };
    reader.readAsArrayBuffer(file);
  };

  const resolveClienteId = (rut) => {
    const norm = (v) => v?.toLowerCase().replace(/[\s.]/g, '') || '';
    return clientes.find(c => norm(c.rut) === norm(rut))?.id || null;
  };

  const handleImport = async () => {
    if (previewErrors.length > 0) return;
    setImporting(true);
    try {
      const schemaProbe = await supabaseRequest(() => supabase.from('licitaciones').select('id_licitacion, fecha_inicio, fecha_termino, monto, estado').limit(1));
      const missingExtendedSchema = schemaMissing || (schemaProbe.error && isSchemaError(schemaProbe.error.message));

      if (missingExtendedSchema && preview.some(hasExtendedData)) {
        setSchemaMissing(true);
        setImportResult({
          ok: false,
          message: 'La tabla licitaciones no tiene columnas para ID, fechas, monto o estado. Copia y ejecuta el SQL amarillo de arriba en Supabase y vuelve a importar el Excel.',
        });
        return;
      }

      const buildRow = (r) => ({
        id_licitacion: r.id_licitacion || null,
        name:          r.name,
        cliente_id:    resolveClienteId(r.rut_cliente),
        fecha_inicio:  r.fecha_inicio  || null,
        fecha_termino: r.fecha_termino || null,
        monto:         r.monto ? Number(String(r.monto).replace(/\D/g, '')) || null : null,
        estado:        r.estado        || 'Activa',
      });
      const buildBaseRow = (r) => ({ name: r.name, cliente_id: resolveClienteId(r.rut_cliente) });

      const findExistingLicitacion = (row) => {
        const clienteId = resolveClienteId(row.rut_cliente);
        const idLic = normalizeKey(row.id_licitacion);
        if (idLic) return licitaciones.find(l => normalizeKey(l.id_licitacion) === idLic) || null;
        return licitaciones.find(l => l.cliente_id === clienteId && normalizeKey(l.name) === normalizeKey(row.name)) || null;
      };

      const savedRows = [];
      let created = 0;
      let updated = 0;
      let usedBaseSchema = missingExtendedSchema;

      for (const row of preview) {
        const existing = findExistingLicitacion(row);
        const payload = missingExtendedSchema ? buildBaseRow(row) : buildRow(row);
        let result;

        if (existing) {
          result = missingExtendedSchema
            ? await supabaseRequest(() => supabase.from('licitaciones').update(payload).eq('id', existing.id).select().single())
            : await safeUpdate({ ...payload, id: existing.id });
          updated += 1;
        } else {
          result = missingExtendedSchema
            ? await supabaseRequest(() => supabase.from('licitaciones').insert([payload]).select().single())
            : await safeInsert(payload);
          created += 1;
        }

        if (result.error) throw result.error;
        savedRows.push(result.data);
      }

      setLicitaciones(prev => {
        let next = [...prev];
        savedRows.forEach(row => {
          const index = next.findIndex(l => l.id === row.id);
          if (index >= 0) next[index] = row;
          else next.push(row);
        });
        return next;
      });
      setImportResult({
        ok: true,
        count: savedRows.length,
        message: usedBaseSchema
          ? `Se guardaron solo nombre y cliente porque faltan columnas extendidas en Supabase. ${created} creadas, ${updated} sobrescritas.`
          : `${created} creadas, ${updated} sobrescritas.`,
      });
      setPreview([]);
    } catch (err) {
      setImportResult({ ok: false, message: friendlyError(err) });
    } finally {
      setImporting(false);
    }
  };

  const clearPreview = () => {
    setPreview([]);
    setPreviewErrors([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filtered = licitaciones.filter(l => {
    const cliente = clientes.find(c => c.id === l.cliente_id);
    const t = search.toLowerCase();
    return (
      l.name?.toLowerCase().includes(t) ||
      l.id_licitacion?.toLowerCase().includes(t) ||
      cliente?.name?.toLowerCase().includes(t) ||
      cliente?.rut?.toLowerCase().includes(t) ||
      l.estado?.toLowerCase().includes(t)
    );
  });
  const filteredIds = filtered.map(l => l.id);
  const selectedVisibleIds = filteredIds.filter(id => selectedIds.includes(id));
  const allVisibleSelected = filteredIds.length > 0 && selectedVisibleIds.length === filteredIds.length;
  const toggleRowSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };
  const toggleVisibleSelection = () => {
    setSelectedIds(prev => {
      if (allVisibleSelected) return prev.filter(id => !filteredIds.includes(id));
      return Array.from(new Set([...prev, ...filteredIds]));
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2">

      {/* Banner migración pendiente */}
      {schemaMissing && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-amber-800 text-sm">Faltan columnas en la tabla <code className="font-mono">licitaciones</code></p>
              <p className="text-amber-700 text-xs mt-0.5">
                El guardado funciona con nombre y cliente solamente. Para habilitar ID, fechas, monto y estado ejecuta este SQL en
                <strong> Supabase → SQL Editor</strong>:
              </p>
            </div>
            <button onClick={copySQL}
              className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors border border-amber-300">
              {sqlCopied ? '✓ Copiado' : 'Copiar SQL'}
            </button>
          </div>
          <pre className="text-[11px] bg-white border border-amber-100 rounded-lg p-3 overflow-x-auto text-slate-700 leading-relaxed select-all">{MIGRATION_SQL}</pre>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <Modal title={modal.mode === 'new' ? 'Nueva Licitación' : 'Editar Licitación'} onClose={closeModal} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="ID Licitación" value={modal.data.id_licitacion}
                onChange={e => setField('id_licitacion', e.target.value)} placeholder="LIC-001" />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Estado</label>
                <select value={modal.data.estado} onChange={e => setField('estado', e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm">
                  {ESTADOS_LICITACION.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <Input label="Nombre Licitación *" value={modal.data.name}
              onChange={e => setField('name', e.target.value)} placeholder="Contrato Mantención 2025" />
            <Select label="Cliente *" options={clientes} value={modal.data.cliente_id}
              onChange={e => setField('cliente_id', e.target.value)} placeholder="Seleccionar cliente..." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Fecha Inicio" type="date" value={modal.data.fecha_inicio}
                onChange={e => setField('fecha_inicio', e.target.value)} />
              <Input label="Fecha Término" type="date" value={modal.data.fecha_termino}
                onChange={e => setField('fecha_termino', e.target.value)} />
            </div>
            <Input label="Monto Contrato (CLP)" type="number" value={modal.data.monto}
              onChange={e => setField('monto', e.target.value)} placeholder="5000000" />
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
              <Button variant="accent" icon={saving ? Cpu : CheckCircle} onClick={handleSave}
                disabled={saving || !modal.data.name || !modal.data.cliente_id}>
                {saving ? 'Guardando...' : modal.mode === 'new' ? 'Crear Licitación' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Mantenedores</p>
          <h2 className="text-2xl font-bold text-slate-900">Licitaciones</h2>
          <p className="text-slate-500 text-sm mt-1">Gestión y carga masiva de licitaciones vinculadas a clientes</p>
        </div>
        <div className="flex gap-3 flex-wrap lg:justify-end">
          <Button variant="primary" icon={Plus} onClick={openNew}>Nueva Licitación</Button>
          <Button variant="secondary" icon={Download} onClick={exportTemplate}>Exportar Plantilla</Button>
          <Button variant="accent" icon={Upload} onClick={() => fileInputRef.current?.click()}>Cargar Excel</Button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden"
            onChange={e => handleFile(e.target.files[0])} />
        </div>
      </div>

      {clientes.length === 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Primero carga los clientes</p>
            <p className="text-xs mt-0.5">Las licitaciones deben vincularse a un cliente existente. Ve a <strong>Mantenedores → Clientes</strong> para cargarlos antes de continuar.</p>
          </div>
        </div>
      )}

      {/* Zona drag & drop */}
      {preview.length === 0 && importResult === null && (
        <div
          className="border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center gap-4 text-slate-400 hover:border-blue-300 hover:text-blue-400 transition-all cursor-pointer bg-slate-50"
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => fileInputRef.current?.click()}
        >
          <FileSpreadsheet size={40} />
          <div className="text-center">
            <p className="font-semibold text-sm">Arrastra tu archivo Excel aquí</p>
            <p className="text-xs mt-1">o haz clic para seleccionar · .xlsx / .xls</p>
          </div>
          <div className="text-[11px] text-slate-300 text-center mt-1 space-y-0.5">
            <p>Requeridos: <strong className="text-slate-400">Nombre Licitación · RUT Cliente</strong></p>
            <p>Opcionales: ID Licitación · Fecha Inicio · Fecha Término · Monto Contrato · Estado</p>
            <p className="text-blue-300 font-medium">La plantilla incluye hoja de referencia con los clientes del sistema</p>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-3">
              <FileSpreadsheet size={20} className="text-blue-600" />
              <span className="font-bold text-slate-800">{preview.length} licitaciones listas para importar</span>
              {previewErrors.length > 0 && (
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">{previewErrors.length} errores</span>
              )}
            </div>
            <button onClick={clearPreview} className="text-slate-400 hover:text-slate-700 p-1 rounded"><X size={18} /></button>
          </div>
          {previewErrors.length > 0 && (
            <div className="px-6 py-3 bg-red-50 border-b border-red-100 space-y-1">
              {previewErrors.map((err, i) => (
                <p key={i} className="text-xs text-red-600 flex items-center gap-1.5"><AlertTriangle size={12} />{err}</p>
              ))}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left border-b border-slate-100">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400">#</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400">ID</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400">Nombre Licitación</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400">Cliente (RUT)</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400">Fechas</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400">Monto</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {preview.map((row, i) => {
                  const cm = clientes.find(c => c.rut?.toLowerCase().replace(/[\s.]/g, '') === row.rut_cliente.toLowerCase().replace(/[\s.]/g, ''));
                  return (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-400 text-xs">{row._row}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{row.id_licitacion || '—'}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{row.name || <span className="text-red-400 italic">vacío</span>}</td>
                      <td className="px-4 py-3">
                        {cm ? (
                          <div><p className="font-semibold text-slate-700 text-xs">{cm.name}</p><p className="text-[10px] text-slate-400 font-mono">{row.rut_cliente}</p></div>
                        ) : (
                          <span className="text-red-500 text-xs">{row.rut_cliente || <span className="italic">vacío</span>} — no encontrado</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {row.fecha_inicio || row.fecha_termino ? `${row.fecha_inicio || '?'} → ${row.fecha_termino || '?'}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {row.monto ? `$${Number(row.monto.replace(/\D/g, '')).toLocaleString('es-CL')}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${estadoBadge(row.estado)}`}>{row.estado || 'Activa'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
            <Button variant="secondary" onClick={clearPreview}>Cancelar</Button>
            <Button variant="accent" icon={importing ? Cpu : CheckCircle} onClick={handleImport}
              disabled={importing || previewErrors.length > 0}>
              {importing ? 'Importando...' : `Confirmar importación (${preview.length} licitaciones)`}
            </Button>
          </div>
        </div>
      )}

      {/* Resultado */}
      {importResult && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${importResult.ok ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
          {importResult.ok
            ? <><CheckCircle size={18} /><span className="font-semibold text-sm">{importResult.count} licitaciones importadas correctamente{importResult.message ? `. ${importResult.message}` : ''}</span></>
            : <><AlertCircle size={18} /><span className="font-semibold text-sm">Error: {importResult.message}</span></>
          }
          <button onClick={() => setImportResult(null)} className="ml-auto opacity-60 hover:opacity-100"><X size={16} /></button>
        </div>
      )}

      {/* Tabla principal */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 border-b border-slate-100">
          <div className="relative w-full sm:w-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Buscar por nombre, cliente o estado..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-72" />
          </div>
          <h3 className="font-bold text-slate-800">Licitaciones registradas ({licitaciones.length})</h3>
        </div>
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between gap-3 px-6 py-3 bg-blue-50 border-b border-blue-100">
            <span className="text-sm font-semibold text-blue-700">{selectedIds.length} licitacion(es) seleccionada(s)</span>
            <Button variant="danger" icon={Trash2} onClick={handleBulkDelete}>Eliminar seleccionadas</Button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left border-b border-slate-100">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleVisibleSelection}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    aria-label="Seleccionar licitaciones visibles" />
                </th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400">ID Licitación</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400">Nombre Licitación</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400">Cliente</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400">RUT Cliente</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400">Fecha Inicio</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400">Fecha Término</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400">Monto Contrato</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400">Estado</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-slate-400 italic">
                    {licitaciones.length === 0 ? 'No hay licitaciones. Usa "Nueva Licitación" o carga un Excel.' : 'Sin resultados para la búsqueda.'}
                  </td>
                </tr>
              ) : filtered.map(l => {
                const cliente = clientes.find(c => c.id === l.cliente_id);
                return (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <input type="checkbox" checked={selectedIds.includes(l.id)} onChange={() => toggleRowSelection(l.id)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        aria-label={`Seleccionar licitacion ${l.name}`} />
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-500">{l.id_licitacion || '—'}</td>
                    <td className="px-4 py-4 font-semibold text-slate-800">{l.name}</td>
                    <td className="px-4 py-4 text-slate-700 font-medium">{cliente?.name || '—'}</td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-500">{cliente?.rut || '—'}</td>
                    <td className="px-4 py-4 text-slate-500 text-xs">{l.fecha_inicio || '—'}</td>
                    <td className="px-4 py-4 text-slate-500 text-xs">{l.fecha_termino || '—'}</td>
                    <td className="px-4 py-4 text-slate-700">
                      {l.monto ? `$${Number(l.monto).toLocaleString('es-CL')}` : '—'}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${estadoBadge(l.estado)}`}>
                        {l.estado || 'Activa'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button onClick={() => openEdit(l)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Editar licitación">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(l)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-1"
                        title="Borrar licitación">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- MANTENEDORES: EQUIPOS ---
const MIGRATION_EQUIPOS_SQL = `CREATE TABLE IF NOT EXISTS equipos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  licitacion_id uuid REFERENCES licitaciones(id),
  tipo_equipo TEXT,
  marca TEXT,
  modelo TEXT,
  numero_serie TEXT,
  numero_inventario TEXT
);`;

const MantenedoresEquipos = () => {
  const { licitaciones, equipos, setEquipos } = useContext(ERPContext);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [preview, setPreview] = useState([]);
  const [previewErrors, setPreviewErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const fileInputRef = useRef(null);

  const COLUMNS = [
    { key: 'licitacion_id',     label: 'ID Licitación',     required: true,  hint: 'ID o Nombre Licitación' },
    { key: 'tipo_equipo',       label: 'Equipo',            required: true,  hint: 'Ej: Camas Multimarca' },
    { key: 'marca',             label: 'Marca',             required: true  },
    { key: 'modelo',            label: 'Modelo',            required: false },
    { key: 'numero_serie',      label: 'Número Serie',      required: false },
    { key: 'numero_inventario', label: 'Número Inventario', required: false },
  ];

  useEffect(() => {
    supabaseRequest(() => supabase.from('equipos').select('id').limit(1))
      .then(({ error }) => { if (error && isMissingTableError(error, 'equipos')) setSchemaMissing(true); });
  }, []);

  useEffect(() => {
    const validIds = new Set(equipos.map(e => e.id));
    setSelectedIds(prev => prev.filter(id => validIds.has(id)));
  }, [equipos]);

  const copySQL = () => {
    navigator.clipboard.writeText(MIGRATION_EQUIPOS_SQL).then(() => {
      setSqlCopied(true);
      setTimeout(() => setSqlCopied(false), 2500);
    });
  };

  // Generar plantilla de Excel
  const exportTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      COLUMNS.map(c => c.label),
      ['LIC-2025-01', 'CAMAS MULTIMARCA', 'Hill-Rom', 'Avant-Garde 2', 'SN987654321', 'INV-5544'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Equipos');
    XLSX.writeFile(wb, 'plantilla_carga_equipos.xlsx');
  };

  const openNew = () => setModal({ mode: 'new', data: { licitacion_id: '', tipo_equipo: '', marca: '', modelo: '', numero_serie: '', numero_inventario: '' } });
  const openEdit = (e) => setModal({ mode: 'edit', data: { ...e } });
  const closeModal = () => setModal(null);
  const setField = (key, val) => setModal(m => ({ ...m, data: { ...m.data, [key]: val } }));

  const handleSave = async () => {
    const { mode, data } = modal;
    if (!data.licitacion_id || !data.tipo_equipo) return;
    setSaving(true);
    try {
      if (schemaMissing) {
        alert('Primero crea la tabla equipos en Supabase usando el SQL amarillo de esta pantalla.');
        return;
      }
      const payload = {
        licitacion_id: data.licitacion_id,
        tipo_equipo: data.tipo_equipo,
        marca: data.marca,
        modelo: data.modelo || null,
        numero_serie: data.numero_serie || null,
        numero_inventario: data.numero_inventario || null,
      };
      if (mode === 'new') {
        const { data: row, error } = await supabaseRequest(() => supabase.from('equipos').insert([payload]).select().single());
        if (error) throw error;
        setEquipos(prev => [...prev, row]);
      } else {
        const { data: row, error } = await supabaseRequest(() => supabase.from('equipos').update(payload).eq('id', data.id).select().single());
        if (error) throw error;
        setEquipos(prev => prev.map(e => e.id === row.id ? row : e));
      }
      closeModal();
    } catch (err) {
      if (isMissingTableError(err, 'equipos')) setSchemaMissing(true);
      alert('Error: ' + friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (equipo) => {
    const label = equipo.numero_serie || equipo.numero_inventario || equipo.tipo_equipo;
    if (!window.confirm(`¿Eliminar el equipo "${label}"? Esta acción no se puede deshacer.`)) return;
    const { error } = await supabaseRequest(() => supabase.from('equipos').delete().eq('id', equipo.id));
    if (error) {
      if (isMissingTableError(error, 'equipos')) setSchemaMissing(true);
      alert('Error al borrar: ' + friendlyError(error));
      return;
    }
    setEquipos(prev => prev.filter(e => e.id !== equipo.id));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Eliminar ${selectedIds.length} equipo(s) seleccionado(s)? Esta accion no se puede deshacer.`)) return;

    const { error } = await supabaseRequest(() => supabase.from('equipos').delete().in('id', selectedIds));
    if (error) {
      if (isMissingTableError(error, 'equipos')) setSchemaMissing(true);
      alert('Error al borrar equipos: ' + friendlyError(error));
      return;
    }

    setEquipos(prev => prev.filter(e => !selectedIds.includes(e.id)));
    setSelectedIds([]);
  };

  const resolveLic = (val) => {
    if (!val) return null;
    const v = String(val).toLowerCase().trim();
    return licitaciones.find(l => {
      const dbId = String(l.id_licitacion || '').toLowerCase().trim();
      const dbName = String(l.name || '').toLowerCase().trim();
      return dbId === v || dbName === v || dbName.includes(v) || v.includes(dbName);
    })?.id || null;
  };

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
      const rowKeys = rows.length > 0 ? Object.keys(rows[0]) : [];

      const mapped = rows.map((row, idx) => {
        const entry = { _row: idx + 2 };
        const currentKeys = Object.keys(row);

        COLUMNS.forEach(col => {
          // Búsqueda de columna más inteligente: coincidencia exacta o por palabra clave (Licitación, Equipo, etc.)
          const labelLower = col.label.toLowerCase();
          const keyword = labelLower.includes('id') ? 'id' : labelLower.split(' ')[0];
          const match = currentKeys.find(k => k.toLowerCase() === labelLower) || currentKeys.find(k => k.toLowerCase().includes(keyword));
          
          entry[col.key] = match && row[match] ? String(row[match]).trim() : '';
        });
        return entry;
      }).filter(r => r.tipo_equipo || r.licitacion_id);
      
      const errors = [];
      mapped.forEach(r => {
        if (!resolveLic(r.licitacion_id)) errors.push(`Fila ${r._row}: Licitación "${r.licitacion_id}" no encontrada`);
        if (!r.tipo_equipo) errors.push(`Fila ${r._row}: Equipo es requerido`);
      });
      setPreview(mapped);
      setPreviewErrors(errors);
      setImportResult(null);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (previewErrors.length > 0) return;
    setImporting(true);
    try {
      if (schemaMissing) {
        setImportResult({ ok: false, message: 'Primero crea la tabla equipos en Supabase usando el SQL amarillo de esta pantalla.' });
        return;
      }
      const buildPayload = (r) => ({
        licitacion_id: resolveLic(r.licitacion_id),
        tipo_equipo: r.tipo_equipo,
        marca: r.marca,
        modelo: r.modelo || null,
        numero_serie: r.numero_serie || null,
        numero_inventario: r.numero_inventario || null,
      });

      const findExistingEquipo = (r) => {
        const licitacionId = resolveLic(r.licitacion_id);
        const serie = normalizeKey(r.numero_serie);
        const inventario = normalizeKey(r.numero_inventario);
        if (serie) return equipos.find(e => e.licitacion_id === licitacionId && normalizeKey(e.numero_serie) === serie) || null;
        if (inventario) return equipos.find(e => e.licitacion_id === licitacionId && normalizeKey(e.numero_inventario) === inventario) || null;
        return equipos.find(e =>
          e.licitacion_id === licitacionId &&
          normalizeKey(e.tipo_equipo) === normalizeKey(r.tipo_equipo) &&
          normalizeKey(e.marca) === normalizeKey(r.marca) &&
          normalizeKey(e.modelo) === normalizeKey(r.modelo)
        ) || null;
      };

      const savedRows = [];
      let created = 0;
      let updated = 0;

      for (const row of preview) {
        const payload = buildPayload(row);
        const existing = findExistingEquipo(row);
        const result = existing
          ? await supabaseRequest(() => supabase.from('equipos').update(payload).eq('id', existing.id).select().single())
          : await supabaseRequest(() => supabase.from('equipos').insert([payload]).select().single());

        if (result.error) throw result.error;
        savedRows.push(result.data);
        if (existing) updated += 1;
        else created += 1;
      }

      setEquipos(prev => {
        let next = [...prev];
        savedRows.forEach(row => {
          const index = next.findIndex(e => e.id === row.id);
          if (index >= 0) next[index] = row;
          else next.push(row);
        });
        return next;
      });
      setImportResult({ ok: true, count: savedRows.length, message: `${created} creados, ${updated} sobrescritos.` });
      setPreview([]);
    } catch (err) {
      if (isMissingTableError(err, 'equipos')) setSchemaMissing(true);
      setImportResult({ ok: false, message: friendlyError(err) });
    } finally {
      setImporting(false);
    }
  };

  const filtered = equipos.filter(e => {
    const t = search.toLowerCase();
    const lic = licitaciones.find(l => l.id === e.licitacion_id);
    return (
      e.tipo_equipo?.toLowerCase().includes(t) ||
      e.marca?.toLowerCase().includes(t) ||
      e.modelo?.toLowerCase().includes(t) ||
      e.numero_serie?.toLowerCase().includes(t) ||
      e.numero_inventario?.toLowerCase().includes(t) ||
      lic?.id_licitacion?.toLowerCase().includes(t) ||
      lic?.name?.toLowerCase().includes(t)
    );
  });
  const filteredIds = filtered.map(e => e.id);
  const selectedVisibleIds = filteredIds.filter(id => selectedIds.includes(id));
  const allVisibleSelected = filteredIds.length > 0 && selectedVisibleIds.length === filteredIds.length;
  const toggleRowSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };
  const toggleVisibleSelection = () => {
    setSelectedIds(prev => {
      if (allVisibleSelected) return prev.filter(id => !filteredIds.includes(id));
      return Array.from(new Set([...prev, ...filteredIds]));
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2">
      {modal && (
        <Modal title={modal.mode === 'new' ? 'Nuevo Equipo' : 'Editar Equipo'} onClose={closeModal} wide>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Licitación" options={licitaciones} value={modal.data.licitacion_id} onChange={e => setField('licitacion_id', e.target.value)} />
            <Select label="Tipo Equipo" options={Object.keys(EQUIPOS_CONFIG).map(k => ({id:k, name:k}))} value={modal.data.tipo_equipo} onChange={e => setField('tipo_equipo', e.target.value)} />
            <Input label="Marca" value={modal.data.marca} onChange={e => setField('marca', e.target.value)} />
            <Input label="Modelo" value={modal.data.modelo} onChange={e => setField('modelo', e.target.value)} />
            <Input label="Nº Serie" value={modal.data.numero_serie} onChange={e => setField('numero_serie', e.target.value)} />
            <Input label="Nº Inventario" value={modal.data.numero_inventario} onChange={e => setField('numero_inventario', e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-6 mt-6 border-t"><Button variant="secondary" onClick={closeModal}>Cancelar</Button><Button variant="accent" onClick={handleSave} disabled={saving}>Guardar</Button></div>
        </Modal>
      )}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div><h2 className="text-2xl font-bold">Equipos</h2><p className="text-slate-500 text-sm">Gestión del parque de equipos</p></div>
        <div className="flex gap-2 flex-wrap lg:justify-end">
          <Button variant="primary" icon={Plus} onClick={openNew}>Nuevo Equipo</Button>
          <Button variant="secondary" icon={Download} onClick={exportTemplate}>Descargar Plantilla</Button>
          <Button variant="accent" icon={Upload} onClick={() => fileInputRef.current.click()}>Cargar Excel</Button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={e => handleFile(e.target.files[0])} />
        </div>
      </div>
      {schemaMissing && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-amber-800 text-sm">Falta la tabla <code className="font-mono">equipos</code></p>
              <p className="text-amber-700 text-xs mt-0.5">
                Para cargar o editar equipos, crea esta tabla en <strong>Supabase - SQL Editor</strong>.
              </p>
            </div>
            <button onClick={copySQL}
              className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors border border-amber-300">
              {sqlCopied ? 'Copiado' : 'Copiar SQL'}
            </button>
          </div>
          <pre className="text-[11px] bg-white border border-amber-100 rounded-lg p-3 overflow-x-auto text-slate-700 leading-relaxed select-all">{MIGRATION_EQUIPOS_SQL}</pre>
        </div>
      )}
      {preview.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/30">
          <div className="flex justify-between items-center mb-4"><h4 className="font-bold">Vista previa ({preview.length} registros)</h4><Button variant="accent" onClick={handleImport} disabled={importing || previewErrors.length > 0}>{importing ? 'Importando...' : 'Confirmar'}</Button></div>
          {previewErrors.length > 0 && <div className="text-red-600 text-xs mb-2">{previewErrors.map((err, i) => <p key={i}>• {err}</p>)}</div>}
        </Card>
      )}
      {importResult && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${importResult.ok ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
          {importResult.ok
            ? <><CheckCircle size={18} /><span className="font-semibold text-sm">{importResult.count} equipos importados correctamente{importResult.message ? `. ${importResult.message}` : ''}</span></>
            : <><AlertCircle size={18} /><span className="font-semibold text-sm">Error: {importResult.message}</span></>
          }
          <button onClick={() => setImportResult(null)} className="ml-auto opacity-60 hover:opacity-100"><X size={16} /></button>
        </div>
      )}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 border-b border-slate-100">
          <div className="relative w-full sm:w-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Buscar por licitacion, equipo o serie..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-72" />
          </div>
          <h3 className="font-bold text-slate-800">Equipos registrados ({equipos.length})</h3>
        </div>
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between gap-3 px-6 py-3 bg-blue-50 border-b border-blue-100">
            <span className="text-sm font-semibold text-blue-700">{selectedIds.length} equipo(s) seleccionado(s)</span>
            <Button variant="danger" icon={Trash2} onClick={handleBulkDelete}>Eliminar seleccionados</Button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-slate-50 border-b">
                <th className="p-3 w-10">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleVisibleSelection}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    aria-label="Seleccionar equipos visibles" />
                </th>
                <th className="p-3 uppercase text-[10px] font-bold">ID Licitacion</th>
                <th className="p-3 uppercase text-[10px] font-bold">Equipo</th>
                <th className="p-3 uppercase text-[10px] font-bold">Marca</th>
                <th className="p-3 uppercase text-[10px] font-bold">Modelo</th>
                <th className="p-3 uppercase text-[10px] font-bold">Nro Serie</th>
                <th className="p-3 uppercase text-[10px] font-bold">Nro Inventario</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400 italic">
                    {equipos.length === 0 ? 'No hay equipos. Usa "Nuevo Equipo" o carga un Excel.' : 'Sin resultados para la busqueda.'}
                  </td>
                </tr>
              ) : filtered.map(e => {
                const lic = licitaciones.find(l => l.id === e.licitacion_id);
                return (
                  <tr key={e.id} className="border-b hover:bg-slate-50">
                    <td className="p-3">
                      <input type="checkbox" checked={selectedIds.includes(e.id)} onChange={() => toggleRowSelection(e.id)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        aria-label={`Seleccionar equipo ${e.tipo_equipo}`} />
                    </td>
                    <td className="p-3 text-xs font-mono">{lic?.id_licitacion || lic?.name || '—'}</td>
                    <td className="p-3 font-bold">{e.tipo_equipo}</td>
                    <td className="p-3">{e.marca}</td>
                    <td className="p-3">{e.modelo || '—'}</td>
                    <td className="p-3 font-mono text-xs">{e.numero_serie || '—'}</td>
                    <td className="p-3 font-mono text-xs">{e.numero_inventario || '—'}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => openEdit(e)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg" title="Editar Equipo"><Pencil size={14}/></button>
                      <button onClick={() => handleDelete(e)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg ml-1" title="Borrar Equipo"><Trash2 size={14}/></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- MANTENEDORES: REPUESTOS ---
const MIGRATION_REPUESTOS_SQL = `CREATE TABLE IF NOT EXISTS repuestos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  licitacion_id uuid REFERENCES licitaciones(id),
  sku TEXT,
  part_number TEXT,
  name TEXT,
  valor_neto BIGINT
);

ALTER TABLE repuestos
  ADD COLUMN IF NOT EXISTS licitacion_id uuid REFERENCES licitaciones(id),
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS part_number TEXT,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS valor_neto BIGINT;`;

const MantenedoresRepuestos = () => {
  const { licitaciones, repuestos, setRepuestos } = useContext(ERPContext);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [preview, setPreview] = useState([]);
  const [previewErrors, setPreviewErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const fileInputRef = useRef(null);
  const isRepuestosSchemaError = (err) => isMissingTableError(err, 'repuestos') || isSchemaError(err?.message || err);

  const COLUMNS = [
    { key: 'licitacion_id', label: 'ID Licitacion', required: true, hint: 'ID o nombre de licitacion' },
    { key: 'sku', label: 'SKU', required: true, hint: 'SKU interno' },
    { key: 'part_number', label: 'Numero de Parte', required: false, hint: 'P/N del fabricante' },
    { key: 'name', label: 'Nombre del Repuesto', required: true, hint: 'Descripcion del repuesto' },
    { key: 'valor_neto', label: 'Valor Neto', required: true, hint: 'Solo numeros' },
  ];

  useEffect(() => {
    supabaseRequest(() => supabase.from('repuestos').select('id, licitacion_id, sku, part_number, name, valor_neto').limit(1))
      .then(({ error }) => { if (error && isRepuestosSchemaError(error)) setSchemaMissing(true); });
  }, []);

  useEffect(() => {
    const validIds = new Set(repuestos.map(r => r.id));
    setSelectedIds(prev => prev.filter(id => validIds.has(id)));
  }, [repuestos]);

  const emptyForm = { licitacion_id: '', sku: '', part_number: '', name: '', valor_neto: '' };
  const openNew = () => setModal({ mode: 'new', data: { ...emptyForm } });
  const openEdit = (r) => setModal({ mode: 'edit', data: {
    id: r.id,
    licitacion_id: r.licitacion_id || '',
    sku: r.sku || '',
    part_number: r.part_number || '',
    name: r.name || '',
    valor_neto: r.valor_neto != null ? String(r.valor_neto) : '',
  } });
  const closeModal = () => { setModal(null); setSaving(false); };
  const setField = (key, val) => setModal(m => ({ ...m, data: { ...m.data, [key]: val } }));

  const copySQL = () => {
    navigator.clipboard.writeText(MIGRATION_REPUESTOS_SQL).then(() => {
      setSqlCopied(true);
      setTimeout(() => setSqlCopied(false), 2500);
    });
  };

  const normalizeMoney = (value) => Number(String(value || '').replace(/\D/g, '')) || 0;
  const payloadFrom = (data) => ({
    licitacion_id: data.licitacion_id,
    sku: data.sku || null,
    part_number: data.part_number || null,
    name: data.name,
    valor_neto: normalizeMoney(data.valor_neto),
  });

  const resolveLic = (value) => {
    if (!value) return null;
    const v = normalizeKey(value);
    return licitaciones.find(l =>
      normalizeKey(l.id) === v ||
      normalizeKey(l.id_licitacion) === v ||
      normalizeKey(l.name) === v ||
      normalizeKey(l.name).includes(v)
    )?.id || null;
  };

  const handleSave = async () => {
    const { mode, data } = modal;
    if (!data.licitacion_id || !data.sku || !data.name || !data.valor_neto) return;
    setSaving(true);
    try {
      if (schemaMissing) {
        alert('Primero actualiza la tabla repuestos en Supabase usando el SQL amarillo de esta pantalla.');
        return;
      }
      const payload = payloadFrom(data);
      const result = mode === 'new'
        ? await supabaseRequest(() => supabase.from('repuestos').insert([payload]).select().single())
        : await supabaseRequest(() => supabase.from('repuestos').update(payload).eq('id', data.id).select().single());
      if (result.error) throw result.error;
      setRepuestos(prev => mode === 'new'
        ? [...prev, result.data]
        : prev.map(r => r.id === result.data.id ? result.data : r));
      closeModal();
    } catch (err) {
      if (isRepuestosSchemaError(err)) setSchemaMissing(true);
      alert('Error: ' + friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (repuesto) => {
    if (!window.confirm(`Eliminar el repuesto "${repuesto.name}"? Esta accion no se puede deshacer.`)) return;
    const { error } = await supabaseRequest(() => supabase.from('repuestos').delete().eq('id', repuesto.id));
    if (error) {
      if (isRepuestosSchemaError(error)) setSchemaMissing(true);
      alert('Error al borrar: ' + friendlyError(error));
      return;
    }
    setRepuestos(prev => prev.filter(r => r.id !== repuesto.id));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Eliminar ${selectedIds.length} repuesto(s) seleccionado(s)? Esta accion no se puede deshacer.`)) return;
    const { error } = await supabaseRequest(() => supabase.from('repuestos').delete().in('id', selectedIds));
    if (error) {
      if (isRepuestosSchemaError(error)) setSchemaMissing(true);
      alert('Error al borrar repuestos: ' + friendlyError(error));
      return;
    }
    setRepuestos(prev => prev.filter(r => !selectedIds.includes(r.id)));
    setSelectedIds([]);
  };

  const exportTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      COLUMNS.map(c => c.label),
      ['LIC-001', 'REP-001', 'PN-12345', 'Bateria 12V', '95000'],
    ]);
    ws['!cols'] = [{ wch: 18 }, { wch: 16 }, { wch: 22 }, { wch: 38 }, { wch: 14 }];

    const licData = [['ID Licitacion', 'Nombre Licitacion']];
    licitaciones.forEach(l => licData.push([l.id_licitacion || l.id, l.name]));
    const wsLic = XLSX.utils.aoa_to_sheet(licData);
    wsLic['!cols'] = [{ wch: 20 }, { wch: 42 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Repuestos');
    XLSX.utils.book_append_sheet(wb, wsLic, 'Referencia_Licitaciones');
    XLSX.writeFile(wb, 'plantilla_repuestos.xlsx');
  };

  const normalizeHeader = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
      const mapped = rows.map((row, idx) => {
        const entry = { licitacion_id: '', sku: '', part_number: '', name: '', valor_neto: '', _row: idx + 2 };
        const keys = Object.keys(row);
        COLUMNS.forEach(col => {
          const wanted = normalizeHeader(col.label);
          const match = keys.find(k => normalizeHeader(k) === wanted || normalizeHeader(k).includes(wanted));
          if (match) entry[col.key] = String(row[match]).trim();
        });
        return entry;
      }).filter(r => r.licitacion_id || r.sku || r.name);

      const errors = [];
      mapped.forEach(r => {
        if (!resolveLic(r.licitacion_id)) errors.push(`Fila ${r._row}: Licitacion "${r.licitacion_id}" no encontrada`);
        if (!r.sku) errors.push(`Fila ${r._row}: SKU es requerido`);
        if (!r.name) errors.push(`Fila ${r._row}: Nombre del Repuesto es requerido`);
        if (!normalizeMoney(r.valor_neto)) errors.push(`Fila ${r._row}: Valor Neto debe ser mayor a 0`);
      });
      setPreview(mapped);
      setPreviewErrors(errors);
      setImportResult(null);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (previewErrors.length > 0) return;
    setImporting(true);
    try {
      if (schemaMissing) {
        setImportResult({ ok: false, message: 'Primero actualiza la tabla repuestos en Supabase usando el SQL amarillo de esta pantalla.' });
        return;
      }
      const savedRows = [];
      let created = 0;
      let updated = 0;
      for (const row of preview) {
        const payload = payloadFrom({ ...row, licitacion_id: resolveLic(row.licitacion_id) });
        const existing = repuestos.find(r =>
          r.licitacion_id === payload.licitacion_id &&
          normalizeKey(r.sku) === normalizeKey(payload.sku)
        );
        const result = existing
          ? await supabaseRequest(() => supabase.from('repuestos').update(payload).eq('id', existing.id).select().single())
          : await supabaseRequest(() => supabase.from('repuestos').insert([payload]).select().single());
        if (result.error) throw result.error;
        savedRows.push(result.data);
        if (existing) updated += 1;
        else created += 1;
      }
      setRepuestos(prev => {
        const next = [...prev];
        savedRows.forEach(row => {
          const index = next.findIndex(r => r.id === row.id);
          if (index >= 0) next[index] = row;
          else next.push(row);
        });
        return next;
      });
      setImportResult({ ok: true, count: savedRows.length, message: `${created} creados, ${updated} sobrescritos.` });
      setPreview([]);
    } catch (err) {
      if (isRepuestosSchemaError(err)) setSchemaMissing(true);
      setImportResult({ ok: false, message: friendlyError(err) });
    } finally {
      setImporting(false);
    }
  };

  const filtered = repuestos.filter(r => {
    const t = search.toLowerCase();
    const lic = licitaciones.find(l => l.id === r.licitacion_id);
    return (
      r.sku?.toLowerCase().includes(t) ||
      r.part_number?.toLowerCase().includes(t) ||
      r.name?.toLowerCase().includes(t) ||
      String(r.valor_neto || '').includes(t) ||
      lic?.id_licitacion?.toLowerCase().includes(t) ||
      lic?.name?.toLowerCase().includes(t)
    );
  });
  const filteredIds = filtered.map(r => r.id);
  const selectedVisibleIds = filteredIds.filter(id => selectedIds.includes(id));
  const allVisibleSelected = filteredIds.length > 0 && selectedVisibleIds.length === filteredIds.length;
  const toggleRowSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };
  const toggleVisibleSelection = () => {
    setSelectedIds(prev => {
      if (allVisibleSelected) return prev.filter(id => !filteredIds.includes(id));
      return Array.from(new Set([...prev, ...filteredIds]));
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2">
      {modal && (
        <Modal title={modal.mode === 'new' ? 'Nuevo Repuesto' : 'Editar Repuesto'} onClose={closeModal} wide>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="ID Licitacion" options={licitaciones.map(l => ({ id: l.id, name: l.id_licitacion ? `${l.id_licitacion} - ${l.name}` : l.name }))} value={modal.data.licitacion_id} onChange={e => setField('licitacion_id', e.target.value)} />
            <Input label="SKU *" value={modal.data.sku} onChange={e => setField('sku', e.target.value)} />
            <Input label="Numero de Parte" value={modal.data.part_number} onChange={e => setField('part_number', e.target.value)} />
            <Input label="Nombre del Repuesto *" value={modal.data.name} onChange={e => setField('name', e.target.value)} />
            <Input label="Valor Neto *" type="number" value={modal.data.valor_neto} onChange={e => setField('valor_neto', e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
            <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button variant="accent" onClick={handleSave} disabled={saving || !modal.data.licitacion_id || !modal.data.sku || !modal.data.name || !modal.data.valor_neto}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </Modal>
      )}

      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold">Repuestos</h2>
          <p className="text-slate-500 text-sm">Gestion de repuestos asociados a licitaciones</p>
        </div>
        <div className="flex gap-2 flex-wrap lg:justify-end">
          <Button variant="primary" icon={Plus} onClick={openNew}>Nuevo Repuesto</Button>
          <Button variant="secondary" icon={Download} onClick={exportTemplate}>Descargar Plantilla</Button>
          <Button variant="accent" icon={Upload} onClick={() => fileInputRef.current?.click()}>Cargar Excel</Button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => handleFile(e.target.files[0])} />
        </div>
      </div>

      {schemaMissing && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-amber-800 text-sm">Falta crear o actualizar la tabla <code className="font-mono">repuestos</code></p>
              <p className="text-amber-700 text-xs mt-0.5">Para cargar o editar repuestos, ejecuta este SQL en <strong>Supabase - SQL Editor</strong>. Tambien agrega la columna <code className="font-mono">valor_neto</code> si tu tabla ya existia.</p>
            </div>
            <button onClick={copySQL} className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors border border-amber-300">
              {sqlCopied ? 'Copiado' : 'Copiar SQL'}
            </button>
          </div>
          <pre className="text-[11px] bg-white border border-amber-100 rounded-lg p-3 overflow-x-auto text-slate-700 leading-relaxed select-all">{MIGRATION_REPUESTOS_SQL}</pre>
        </div>
      )}

      {preview.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h4 className="font-bold">Vista previa ({preview.length} registros)</h4>
            <Button variant="accent" onClick={handleImport} disabled={importing || previewErrors.length > 0}>{importing ? 'Importando...' : 'Confirmar'}</Button>
          </div>
          {previewErrors.length > 0 && <div className="text-red-600 text-xs mb-2 space-y-1">{previewErrors.map((err, i) => <p key={i}>{err}</p>)}</div>}
        </Card>
      )}

      {importResult && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${importResult.ok ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
          {importResult.ok
            ? <><CheckCircle size={18} /><span className="font-semibold text-sm">{importResult.count} repuestos importados correctamente{importResult.message ? `. ${importResult.message}` : ''}</span></>
            : <><AlertCircle size={18} /><span className="font-semibold text-sm">Error: {importResult.message}</span></>
          }
          <button onClick={() => setImportResult(null)} className="ml-auto opacity-60 hover:opacity-100"><X size={16} /></button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 border-b border-slate-100">
          <div className="relative w-full sm:w-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Buscar por SKU, parte, nombre o licitacion..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-80" />
          </div>
          <h3 className="font-bold text-slate-800">Repuestos registrados ({repuestos.length})</h3>
        </div>
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between gap-3 px-6 py-3 bg-blue-50 border-b border-blue-100">
            <span className="text-sm font-semibold text-blue-700">{selectedIds.length} repuesto(s) seleccionado(s)</span>
            <Button variant="danger" icon={Trash2} onClick={handleBulkDelete}>Eliminar seleccionados</Button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-slate-50 border-b">
                <th className="p-3 w-10">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleVisibleSelection}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    aria-label="Seleccionar repuestos visibles" />
                </th>
                <th className="p-3 uppercase text-[10px] font-bold">ID Licitacion</th>
                <th className="p-3 uppercase text-[10px] font-bold">SKU</th>
                <th className="p-3 uppercase text-[10px] font-bold">Numero de Parte</th>
                <th className="p-3 uppercase text-[10px] font-bold">Nombre del Repuesto</th>
                <th className="p-3 uppercase text-[10px] font-bold">Valor Neto</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400 italic">
                    {repuestos.length === 0 ? 'No hay repuestos. Usa "Nuevo Repuesto" o carga un Excel.' : 'Sin resultados para la busqueda.'}
                  </td>
                </tr>
              ) : filtered.map(r => {
                const lic = licitaciones.find(l => l.id === r.licitacion_id);
                return (
                  <tr key={r.id} className="border-b hover:bg-slate-50">
                    <td className="p-3">
                      <input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => toggleRowSelection(r.id)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        aria-label={`Seleccionar repuesto ${r.name}`} />
                    </td>
                    <td className="p-3 text-xs font-mono">{lic?.id_licitacion || lic?.name || '—'}</td>
                    <td className="p-3 font-mono text-xs">{r.sku || '—'}</td>
                    <td className="p-3 font-mono text-xs">{r.part_number || '—'}</td>
                    <td className="p-3 font-bold">{r.name}</td>
                    <td className="p-3">${Number(r.valor_neto || 0).toLocaleString('es-CL')}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => openEdit(r)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg" title="Editar Repuesto"><Pencil size={14}/></button>
                      <button onClick={() => handleDelete(r)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg ml-1" title="Borrar Repuesto"><Trash2 size={14}/></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- MANTENEDORES: USUARIOS ---
const MODULES_TREE = [
  { id: 'dashboard', label: 'Dashboard', sub: [] },
  {
    id: 'operaciones', label: 'Operaciones', sub: [
      { id: 'operaciones-registro',               label: 'Nuevo Registro' },
      { id: 'operaciones-planificacion',           label: 'Planificación' },
      { id: 'operaciones-historial-preventivo',    label: 'Historial Preventivo' },
      { id: 'operaciones-historial-correctivo',    label: 'Historial Correctivo' },
      { id: 'operaciones-cotizaciones',            label: 'Cotizaciones' },
      { id: 'operaciones-historial-cotizaciones',  label: 'Historial Cotizaciones' },
      { id: 'operaciones-oc-recibidas',            label: 'OC Recibidas' },
      { id: 'operaciones-rendiciones',             label: 'Rendiciones' },
      { id: 'operaciones-historial-rendiciones',   label: 'Historial Rendiciones' },
    ],
  },
  { id: 'comercial',   label: 'Comercial',            sub: [] },
  {
    id: 'abastecimiento', label: 'Abastecimiento', sub: [
      { id: 'abastecimiento-documentos', label: 'Documentos' },
      { id: 'abastecimiento-internacion', label: 'Internacion' },
      { id: 'abastecimiento-informe-compras', label: 'Informe de Compras' },
      { id: 'abastecimiento-registro-compras', label: 'Registro de Compras' },
    ],
  },
  {
    id: 'contabilidad', label: 'Contabilidad', sub: [
      { id: 'contabilidad-comprobantes', label: 'Comprobantes' },
      { id: 'contabilidad-informes-tributarios', label: 'Informes Tributarios' },
      { id: 'contabilidad-estados-financieros', label: 'Estados Financieros' },
    ],
  },
  { id: 'calidad',     label: 'Calidad',              sub: [] },
  { id: 'personas',    label: 'Gestión de Personas',  sub: [] },
  {
    id: 'mantenedores', label: 'Mantenedores', sub: [
      { id: 'mantenedores-clientes',    label: 'Clientes y/o Proveedores' },
      { id: 'mantenedores-licitaciones',label: 'Licitaciones' },
      { id: 'mantenedores-equipos',     label: 'Equipos' },
      { id: 'mantenedores-repuestos',   label: 'Repuestos' },
      { id: 'mantenedores-usuarios',    label: 'Usuarios' },
    ],
  },
  {
    id: 'configuraciones', label: 'Configuraciones', sub: [
      { id: 'configuraciones-empresas',          label: 'Empresas' },
      { id: 'configuraciones-plan-cuentas',      label: 'Plan de Cuentas' },
      { id: 'configuraciones-tipo-documentos',   label: 'Tipo de Documentos' },
      { id: 'configuraciones-impuestos',         label: 'Impuestos y Retenciones' },
      { id: 'configuraciones-parametros',        label: 'Parámetros' },
      { id: 'configuraciones-seguridad',         label: 'Seguridad' },
      { id: 'configuraciones-flujo-aprobacion',  label: 'Flujo de Aprobación' },
    ],
  },
];

const emptyUsuario = () => ({ id: '', usuario: '', nombre: '', rut: '', cargo: '', contrasena: '', accesos: [], permisosEmpresas: {} });

const MantenedoresUsuarios = () => {
  const { usuarios, setUsuarios, empresas } = useContext(ERPContext);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | { mode:'new'|'edit', data:{...} }
  const [selectedEmpresaId, setSelectedEmpresaId] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const normalizeText = (v) => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filtered = usuarios.filter(u =>
    normalizeText([u.usuario, u.nombre, u.rut, u.cargo].join(' ')).includes(normalizeText(search))
  );

  // --- módulo helpers ---
  const allModuleIds = (mod) => mod.sub.length > 0 ? mod.sub.map(s => s.id) : [mod.id];
  const accesosLabel = (user) => {
    const permisos = user.permisosEmpresas || {};
    const configuredCompanies = Object.keys(permisos).filter(id => (permisos[id] || []).length > 0);
    const accesos = user.accesos || [];
    if (configuredCompanies.length > 0) {
      return (
        <div className="flex flex-wrap gap-1">
          {configuredCompanies.slice(0, 3).map(id => {
            const emp = empresas.find(e => e.id === id);
            return <span key={id} className="inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-semibold">{emp?.razonSocial || 'Empresa'}</span>;
          })}
          {configuredCompanies.length > 3 && <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-semibold">+{configuredCompanies.length - 3}</span>}
        </div>
      );
    }
    if (!accesos || accesos.length === 0) return <span className="text-slate-300 italic text-xs">Sin accesos</span>;
    const mods = MODULES_TREE.filter(m => {
      const ids = allModuleIds(m);
      return ids.some(id => accesos.includes(id));
    }).map(m => m.label);
    return (
      <div className="flex flex-wrap gap-1">
        {mods.map(l => (
          <span key={l} className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-semibold">{l}</span>
        ))}
      </div>
    );
  };

  // --- modal helpers ---
  const firstEmpresaId = () => empresas[0]?.id || '';
  const openNew  = () => { setSelectedEmpresaId(firstEmpresaId()); setModal({ mode: 'new',  data: emptyUsuario() }); };
  const openEdit = (u) => {
    const permisos = u.permisosEmpresas || {};
    const firstConfigured = Object.keys(permisos).find(id => (permisos[id] || []).length > 0);
    setSelectedEmpresaId(firstConfigured || firstEmpresaId());
    setModal({ mode: 'edit', data: { ...emptyUsuario(), ...u, permisosEmpresas: permisos } });
  };
  const closeModal = () => { setModal(null); setSaving(false); };
  const setField = (key, val) => setModal(m => ({ ...m, data: { ...m.data, [key]: val } }));
  const selectedEmpresaAccesos = () => {
    if (!selectedEmpresaId) return modal?.data.accesos || [];
    return modal?.data.permisosEmpresas?.[selectedEmpresaId] || [];
  };
  const setSelectedEmpresaAccesos = (nextAccesos) => {
    if (!selectedEmpresaId) {
      setField('accesos', nextAccesos);
      return;
    }
    setModal(m => ({
      ...m,
      data: {
        ...m.data,
        permisosEmpresas: {
          ...(m.data.permisosEmpresas || {}),
          [selectedEmpresaId]: nextAccesos,
        },
      },
    }));
  };

  const toggleAcceso = (id) => {
    const acc = selectedEmpresaAccesos();
    setSelectedEmpresaAccesos(acc.includes(id) ? acc.filter(x => x !== id) : [...acc, id]);
  };

  const toggleModulo = (mod) => {
    const ids = allModuleIds(mod);
    const acc = selectedEmpresaAccesos();
    const allChecked = ids.every(id => acc.includes(id));
    setSelectedEmpresaAccesos(allChecked ? acc.filter(x => !ids.includes(x)) : [...new Set([...acc, ...ids])]);
  };

  const isModuloChecked = (mod) => allModuleIds(mod).every(id => selectedEmpresaAccesos().includes(id));
  const isModuloIndeterminate = (mod) => {
    const ids = allModuleIds(mod);
    const acc = selectedEmpresaAccesos();
    return ids.some(id => acc.includes(id)) && !ids.every(id => acc.includes(id));
  };
  const buildAccessUnion = (data) => {
    const permisos = data.permisosEmpresas || {};
    const keys = Object.keys(permisos);
    if (keys.length === 0) return [...new Set(data.accesos || [])];
    return [...new Set(Object.values(permisos).flat())];
  };
  const selectedEmpresa = empresas.find(e => e.id === selectedEmpresaId);
  const empresaAllowedIds = selectedEmpresa?.modulosPermitidos || [];
  const modulesForSelectedEmpresa = empresaAllowedIds.length === 0
    ? MODULES_TREE
    : MODULES_TREE.map(mod => {
        const filteredSub = mod.sub.filter(sub => empresaAllowedIds.includes(sub.id));
        const parentAllowed = empresaAllowedIds.includes(mod.id);
        if (mod.sub.length > 0) return filteredSub.length > 0 ? { ...mod, sub: filteredSub } : null;
        return parentAllowed ? mod : null;
      }).filter(Boolean);

  const toSupabasePayload = (data) => ({
    id: data.id || Date.now().toString(),
    usuario: data.usuario.trim(),
    nombre: data.nombre.trim(),
    rut: data.rut.trim(),
    cargo: data.cargo || '',
    contrasena: data.contrasena || '',
    accesos: buildAccessUnion(data),
    permisos_empresas: data.permisosEmpresas || {},
  });

  const handleSave = async () => {
    const { mode, data } = modal;
    if (!data.usuario.trim() || !data.nombre.trim() || !data.rut.trim()) {
      alert('Usuario, nombre y RUT son requeridos.');
      return;
    }
    const rutDup = usuarios.some(u => normalizeText(u.rut) === normalizeText(data.rut) && u.id !== data.id);
    if (rutDup) { alert(`El RUT ${data.rut} ya está registrado.`); return; }
    setSaving(true);
    try {
      const payload = toSupabasePayload(data);
      if (mode === 'new') {
        const { data: row, error } = await supabase.from('usuarios').insert([payload]).select().single();
        if (error) throw error;
        setUsuarios(prev => [{ ...row, accesos: row.accesos || [], permisosEmpresas: row.permisos_empresas || {} }, ...prev]);
      } else {
        const { data: row, error } = await supabase.from('usuarios').update(payload).eq('id', data.id).select().single();
        if (error) throw error;
        setUsuarios(prev => prev.map(u => u.id === row.id ? { ...row, accesos: row.accesos || [], permisosEmpresas: row.permisos_empresas || {} } : u));
      }
      closeModal();
    } catch (err) {
      alert('Error al guardar usuario: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`¿Eliminar el usuario "${u.usuario}"?`)) return;
    const { error } = await supabase.from('usuarios').delete().eq('id', u.id);
    if (error) { alert('Error al eliminar: ' + error.message); return; }
    setUsuarios(prev => prev.filter(x => x.id !== u.id));
    setSelectedIds(prev => prev.filter(id => id !== u.id));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`¿Eliminar ${selectedIds.length} usuario(s) seleccionado(s)? Esta acción no se puede deshacer.`)) return;
    const { error } = await supabase.from('usuarios').delete().in('id', selectedIds);
    if (error) { alert('Error al eliminar: ' + error.message); return; }
    setUsuarios(prev => prev.filter(u => !selectedIds.includes(u.id)));
    setSelectedIds([]);
  };

  const filteredIds = filtered.map(u => u.id);
  const allVisibleSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.includes(id));
  const toggleRow = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelectedIds(prev => allVisibleSelected ? prev.filter(id => !filteredIds.includes(id)) : Array.from(new Set([...prev, ...filteredIds])));

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Mantenedores</p>
        <h2 className="text-2xl font-bold text-slate-900">Usuarios</h2>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] lg:max-w-md">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar usuario, nombre, RUT, cargo…"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <button onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm">
            <Plus size={14} /> Nuevo Usuario
          </button>
        </div>
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between gap-3 px-6 py-3 bg-blue-50 border-b border-blue-100">
            <span className="text-sm font-semibold text-blue-700">{selectedIds.length} usuario(s) seleccionado(s)</span>
            <Button variant="danger" icon={Trash2} onClick={handleBulkDelete}>Eliminar seleccionados</Button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left border-b">
                <th className="p-3 w-10">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                </th>
                {['Usuario', 'Nombre', 'RUT', 'Cargo', 'Contraseña', 'Módulos con acceso', 'Acciones'].map(h => (
                  <th key={h} className="p-3 text-[10px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="8" className="px-6 py-12 text-center text-slate-400 italic">No hay usuarios registrados.</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className={`border-b hover:bg-slate-50 ${selectedIds.includes(u.id) ? 'bg-blue-50/40' : ''}`}>
                  <td className="p-3">
                    <input type="checkbox" checked={selectedIds.includes(u.id)} onChange={() => toggleRow(u.id)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                  </td>
                  <td className="p-3 font-mono text-xs font-bold text-slate-700">{u.usuario}</td>
                  <td className="p-3 font-medium">{u.nombre}</td>
                  <td className="p-3 text-slate-600">{u.rut}</td>
                  <td className="p-3 text-slate-600">{u.cargo}</td>
                  <td className="p-3 font-mono text-slate-400 tracking-widest text-xs">{u.contrasena ? '•'.repeat(Math.min(u.contrasena.length, 10)) : <span className="italic text-slate-300">—</span>}</td>
                  <td className="p-3">{accesosLabel(u)}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(u)} className="p-2 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600" title="Editar usuario"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(u)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" title="Eliminar usuario"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {modal.mode === 'new' ? 'Nuevo Usuario' : `Editar — ${modal.data.usuario}`}
              </h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><X size={16} /></button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
              {/* Datos básicos */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Datos del Usuario</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'usuario',    label: 'Usuario',    placeholder: 'ej: jperez',              type: 'text'     },
                    { key: 'nombre',     label: 'Nombre',     placeholder: 'Nombre completo',          type: 'text'     },
                    { key: 'rut',        label: 'RUT',        placeholder: '12.345.678-9',             type: 'text'     },
                    { key: 'cargo',      label: 'Cargo',      placeholder: 'ej: Jefe de Operaciones',  type: 'text'     },
                    { key: 'contrasena', label: 'Contraseña', placeholder: 'Contraseña de acceso',     type: 'password' },
                  ].map(({ key, label, placeholder, type }) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{label}</label>
                      <input type={type} value={modal.data[key] || ''} onChange={e => setField(key, e.target.value)}
                        placeholder={placeholder}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Empresa</h4>
                {empresas.length === 0 ? (
                  <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
                    Crea una empresa en Configuraciones / Empresas para asignar permisos por empresa.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Empresa</label>
                      <select value={selectedEmpresaId} onChange={e => setSelectedEmpresaId(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                        {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.razonSocial || emp.nombreFantasia || emp.rut}</option>)}
                      </select>
                    </div>
                    <span className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                      {selectedEmpresaAccesos().length} permisos
                    </span>
                  </div>
                )}
              </div>

              {/* Permisos */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Permisos de Acceso</h4>
                <div className="space-y-3">
                  {modulesForSelectedEmpresa.length === 0 && (
                    <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
                      La empresa seleccionada no tiene modulos habilitados en Configuraciones / Empresas.
                    </div>
                  )}
                  {modulesForSelectedEmpresa.map(mod => (
                    <div key={mod.id} className="rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
                      {/* fila módulo padre */}
                      <label className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-100 transition-colors">
                        <input type="checkbox"
                          checked={isModuloChecked(mod)}
                          ref={el => { if (el) el.indeterminate = isModuloIndeterminate(mod); }}
                          onChange={() => toggleModulo(mod)}
                          className="w-4 h-4 rounded border-slate-300 accent-blue-600" />
                        <span className="text-sm font-bold text-slate-700">{mod.label}</span>
                        {mod.sub.length === 0 && (
                          <span className="ml-auto text-[10px] text-slate-400 uppercase">módulo</span>
                        )}
                      </label>
                      {/* submodulos */}
                      {mod.sub.length > 0 && (
                        <div className="border-t border-slate-100 px-4 py-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 bg-white">
                          {mod.sub.map(sub => (
                            <label key={sub.id} className="flex items-center gap-2 cursor-pointer group">
                              <input type="checkbox"
                                checked={selectedEmpresaAccesos().includes(sub.id)}
                                onChange={() => toggleAcceso(sub.id)}
                                className="w-3.5 h-3.5 rounded border-slate-300 accent-blue-600" />
                              <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors">{sub.label}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <button onClick={closeModal} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-60 transition-colors">
                <CheckCircle size={15} /> {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// --- CONFIGURACIONES: HELPERS ---
const REGIONES_CL = ['Arica y Parinacota','Tarapacá','Antofagasta','Atacama','Coquimbo','Valparaíso','Metropolitana','O\'Higgins','Maule','Ñuble','Biobío','La Araucanía','Los Ríos','Los Lagos','Aysén','Magallanes'];
const MONEDAS = ['CLP - Peso Chileno','USD - Dólar Americano','EUR - Euro','UF - Unidad de Fomento'];

const emptyEmpresa = () => ({
  id: '', rut: '', razonSocial: '', nombreFantasia: '', giro: '', moneda: 'CLP - Peso Chileno',
  correoContacto: '', telefono: '', claveTributaria: '', direccion: '', comuna: '', ciudad: '', region: 'Metropolitana',
  pais: 'Chile', codigoActividad: '', rutRepresentante: '', nombreRepresentante: '',
  fechaResolucionSII: '', resolucionSII: '', sucursalResolucionSII: '',
  unidadesNegocio: [], centrosCosto: [], bodegas: [], modulosPermitidos: [],
});

const emptyUN = () => ({ id: Date.now() + Math.random(), codigo: '', descripcion: '', direccion: '', comuna: '' });
const emptyBodega = () => ({ id: Date.now() + Math.random(), codigo: '', descripcion: '', unidadNegocio: '' });
const emptyCentroCosto = () => ({ id: Date.now() + Math.random(), codigo: '', nombre: '' });

// --- CONFIGURACIONES: EMPRESAS ---
const ConfigEmpresas = () => {
  const { empresas, setEmpresas } = useContext(ERPContext);
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [form, setForm] = useState(emptyEmpresa());
  const [activeEmpresaTab, setActiveEmpresaTab] = useState('datos');
  const [search, setSearch] = useState('');

  const normalizeText = (v) => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filtered = empresas.filter(e => normalizeText([e.rut, e.razonSocial, e.nombreFantasia, e.giro].join(' ')).includes(normalizeText(search)));

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openNew  = () => { setForm(emptyEmpresa()); setActiveEmpresaTab('datos'); setView('form'); };
  const openEdit = (e) => { setForm({ ...emptyEmpresa(), ...e, modulosPermitidos: e.modulosPermitidos || [] }); setActiveEmpresaTab('datos'); setView('form'); };
  const cancel   = () => setView('list');

  const handleSave = () => {
    if (!form.rut || !form.razonSocial) { alert('RUT y Razón Social son obligatorios.'); return; }
    if (form.id) {
      setEmpresas(prev => prev.map(e => e.id === form.id ? { ...form } : e));
    } else {
      setEmpresas(prev => [{ ...form, id: Date.now().toString() }, ...prev]);
    }
    setView('list');
  };

  const handleDelete = (emp) => {
    if (!window.confirm(`¿Eliminar empresa "${emp.razonSocial}"?`)) return;
    setEmpresas(prev => prev.filter(e => e.id !== emp.id));
  };

  // Unidades de Negocio
  const addUN = () => setForm(f => ({ ...f, unidadesNegocio: [...(f.unidadesNegocio||[]), emptyUN()] }));
  const updateUN = (id, k, v) => setForm(f => ({ ...f, unidadesNegocio: f.unidadesNegocio.map(u => u.id === id ? { ...u, [k]: v } : u) }));
  const removeUN = (id) => setForm(f => ({ ...f, unidadesNegocio: f.unidadesNegocio.filter(u => u.id !== id) }));

  // Centros de Costo
  const addCC = () => setForm(f => ({ ...f, centrosCosto: [...(f.centrosCosto||[]), emptyCentroCosto()] }));
  const updateCC = (id, k, v) => setForm(f => ({ ...f, centrosCosto: f.centrosCosto.map(c => c.id === id ? { ...c, [k]: v } : c) }));
  const removeCC = (id) => setForm(f => ({ ...f, centrosCosto: f.centrosCosto.filter(c => c.id !== id) }));

  // Bodegas
  const addBodega = () => setForm(f => ({ ...f, bodegas: [...(f.bodegas||[]), emptyBodega()] }));
  const updateBodega = (id, k, v) => setForm(f => ({ ...f, bodegas: f.bodegas.map(b => b.id === id ? { ...b, [k]: v } : b) }));
  const removeBodega = (id) => setForm(f => ({ ...f, bodegas: f.bodegas.filter(b => b.id !== id) }));

  const allModuleIdsEmpresa = (mod) => mod.sub.length > 0 ? mod.sub.map(s => s.id) : [mod.id];
  const toggleEmpresaModulo = (mod) => {
    const ids = allModuleIdsEmpresa(mod);
    setForm(f => {
      const current = f.modulosPermitidos || [];
      const allChecked = ids.every(id => current.includes(id));
      return { ...f, modulosPermitidos: allChecked ? current.filter(id => !ids.includes(id)) : [...new Set([...current, ...ids])] };
    });
  };
  const toggleEmpresaSubModulo = (id) => setForm(f => {
    const current = f.modulosPermitidos || [];
    return { ...f, modulosPermitidos: current.includes(id) ? current.filter(x => x !== id) : [...current, id] };
  });
  const isEmpresaModuloChecked = (mod) => allModuleIdsEmpresa(mod).every(id => (form.modulosPermitidos || []).includes(id));
  const isEmpresaModuloIndeterminate = (mod) => {
    const ids = allModuleIdsEmpresa(mod);
    const current = form.modulosPermitidos || [];
    return ids.some(id => current.includes(id)) && !ids.every(id => current.includes(id));
  };

  const fieldCls = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";
  const labelCls = "block text-xs font-semibold text-slate-500 uppercase mb-1";

  if (view === 'form') return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Configuraciones / Empresas</p>
          <h2 className="text-2xl font-bold text-slate-900">{form.id ? 'Editar Empresa' : 'Nueva Empresa'}</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={cancel} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-colors">Cancelar</button>
          <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors">
            <CheckCircle size={15}/> Guardar Empresa
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-2 pt-2">
        <div className="flex gap-1 border-b border-slate-100">
          <button onClick={() => setActiveEmpresaTab('datos')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg border border-b-0 ${activeEmpresaTab === 'datos' ? 'bg-white text-blue-700 border-slate-200' : 'bg-slate-50 text-slate-500 border-transparent hover:text-slate-700'}`}>
            Datos de la empresa
          </button>
          <button onClick={() => setActiveEmpresaTab('modulos')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg border border-b-0 ${activeEmpresaTab === 'modulos' ? 'bg-white text-blue-700 border-slate-200' : 'bg-slate-50 text-slate-500 border-transparent hover:text-slate-700'}`}>
            Modulos
          </button>
        </div>
      </div>

      {activeEmpresaTab === 'datos' ? (
      <>
      {/* Datos generales */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Datos de la Empresa</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[['rut','RUT','76.123.456-K'],['razonSocial','Razón Social',''],['nombreFantasia','Nombre de Fantasía',''],
            ['giro','Giro',''],['correoContacto','Correo de Contacto',''],['telefono','Teléfono',''],
            ['claveTributaria','Clave Tributaria','','password'],
            ['direccion','Dirección',''],['comuna','Comuna',''],['ciudad','Ciudad',''],
            ['pais','País','Chile'],['codigoActividad','Cód. Actividad Económica',''],
            ['rutRepresentante','RUT Representante',''],['nombreRepresentante','Nombre Representante',''],
            ['fechaResolucionSII','Fecha Resolución SII','','date'],['resolucionSII','Resolución SII',''],
            ['sucursalResolucionSII','Sucursal Resolución SII','']
          ].map(([k, lbl, ph, tp]) => (
            <div key={k}>
              <label className={labelCls}>{lbl}</label>
              <input type={tp||'text'} value={form[k]||''} onChange={e=>setField(k,e.target.value)} placeholder={ph} className={fieldCls}/>
            </div>
          ))}
          <div>
            <label className={labelCls}>Moneda</label>
            <select value={form.moneda||'CLP - Peso Chileno'} onChange={e=>setField('moneda',e.target.value)} className={fieldCls+" bg-white"}>
              {MONEDAS.map(m=><option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Región</label>
            <select value={form.region||'Metropolitana'} onChange={e=>setField('region',e.target.value)} className={fieldCls+" bg-white"}>
              {REGIONES_CL.map(r=><option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Unidades de Negocio */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unidades de Negocio</h3>
          <button onClick={addUN} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors">
            <Plus size={13}/> Agregar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b">
              {['Código','Descripción','Dirección','Comuna',''].map(h=><th key={h} className="p-3 text-[10px] font-bold uppercase text-slate-500 text-left">{h}</th>)}
            </tr></thead>
            <tbody>
              {(form.unidadesNegocio||[]).length === 0
                ? <tr><td colSpan="5" className="p-6 text-center text-slate-400 italic text-xs">Sin unidades de negocio. Haz clic en Agregar.</td></tr>
                : (form.unidadesNegocio||[]).map(u=>(
                  <tr key={u.id} className="border-b">
                    {['codigo','descripcion','direccion','comuna'].map(k=>(
                      <td key={k} className="p-2"><input value={u[k]||''} onChange={e=>updateUN(u.id,k,e.target.value)} className="w-full rounded border border-slate-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"/></td>
                    ))}
                    <td className="p-2"><button onClick={()=>removeUN(u.id)} className="p-1 rounded text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"><X size={14}/></button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Centros de Costo */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Centros de Costo</h3>
          <button onClick={addCC} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors">
            <Plus size={13}/> Agregar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b">
              {['Código','Nombre',''].map(h=><th key={h} className="p-3 text-[10px] font-bold uppercase text-slate-500 text-left">{h}</th>)}
            </tr></thead>
            <tbody>
              {(form.centrosCosto||[]).length === 0
                ? <tr><td colSpan="3" className="p-6 text-center text-slate-400 italic text-xs">Sin centros de costo. Haz clic en Agregar.</td></tr>
                : (form.centrosCosto||[]).map(c=>(
                  <tr key={c.id} className="border-b">
                    <td className="p-2"><input value={c.codigo||''} onChange={e=>updateCC(c.id,'codigo',e.target.value)} className="w-32 rounded border border-slate-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"/></td>
                    <td className="p-2"><input value={c.nombre||''} onChange={e=>updateCC(c.id,'nombre',e.target.value)} className="w-64 rounded border border-slate-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"/></td>
                    <td className="p-2"><button onClick={()=>removeCC(c.id)} className="p-1 rounded text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"><X size={14}/></button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bodegas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bodegas</h3>
          <button onClick={addBodega} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors">
            <Plus size={13}/> Agregar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b">
              {['Código','Descripción','Unidad de Negocio',''].map(h=><th key={h} className="p-3 text-[10px] font-bold uppercase text-slate-500 text-left">{h}</th>)}
            </tr></thead>
            <tbody>
              {(form.bodegas||[]).length === 0
                ? <tr><td colSpan="4" className="p-6 text-center text-slate-400 italic text-xs">Sin bodegas. Haz clic en Agregar.</td></tr>
                : (form.bodegas||[]).map(b=>(
                  <tr key={b.id} className="border-b">
                    <td className="p-2"><input value={b.codigo||''} onChange={e=>updateBodega(b.id,'codigo',e.target.value)} className="w-24 rounded border border-slate-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"/></td>
                    <td className="p-2"><input value={b.descripcion||''} onChange={e=>updateBodega(b.id,'descripcion',e.target.value)} className="w-48 rounded border border-slate-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"/></td>
                    <td className="p-2">
                      <select value={b.unidadNegocio||''} onChange={e=>updateBodega(b.id,'unidadNegocio',e.target.value)} className="w-48 rounded border border-slate-200 px-2 py-1 text-xs bg-white focus:border-blue-500 focus:outline-none">
                        <option value="">— Sin asignar —</option>
                        {(form.unidadesNegocio||[]).map(u=><option key={u.id} value={u.descripcion}>{u.codigo ? `${u.codigo} - ` : ''}{u.descripcion}</option>)}
                      </select>
                    </td>
                    <td className="p-2"><button onClick={()=>removeBodega(b.id)} className="p-1 rounded text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"><X size={14}/></button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      </>
      ) : (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Modulos disponibles para la empresa</h3>
          <p className="mt-1 text-xs text-slate-400">Estos modulos y submodulos determinan que permisos se podran asignar a los usuarios para esta empresa.</p>
        </div>
        <div className="p-6 space-y-3">
          {MODULES_TREE.map(mod => (
            <div key={mod.id} className="rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
              <label className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-100 transition-colors">
                <input type="checkbox"
                  checked={isEmpresaModuloChecked(mod)}
                  ref={el => { if (el) el.indeterminate = isEmpresaModuloIndeterminate(mod); }}
                  onChange={() => toggleEmpresaModulo(mod)}
                  className="w-4 h-4 rounded border-slate-300 accent-blue-600" />
                <span className="text-sm font-bold text-slate-700">{mod.label}</span>
                {mod.sub.length === 0 && <span className="ml-auto text-[10px] text-slate-400 uppercase">modulo</span>}
              </label>
              {mod.sub.length > 0 && (
                <div className="border-t border-slate-100 px-4 py-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 bg-white">
                  {mod.sub.map(sub => (
                    <label key={sub.id} className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox"
                        checked={(form.modulosPermitidos || []).includes(sub.id)}
                        onChange={() => toggleEmpresaSubModulo(sub.id)}
                        className="w-3.5 h-3.5 rounded border-slate-300 accent-blue-600" />
                      <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors">{sub.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Configuraciones</p>
          <h2 className="text-2xl font-bold text-slate-900">Empresas</h2>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={14}/> Nueva Empresa
        </button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative w-full lg:max-w-md">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por RUT, razón social, giro…"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"/>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b">
              {['RUT','Razón Social','Nombre Fantasía','Giro','Región','UN','CC','Bodegas','Acciones'].map(h=>(
                <th key={h} className="p-3 text-[10px] font-bold uppercase text-slate-500 text-left">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan="9" className="px-6 py-12 text-center text-slate-400 italic">No hay empresas registradas.</td></tr>
                : filtered.map(e=>(
                  <tr key={e.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-mono text-xs font-bold text-slate-700">{e.rut}</td>
                    <td className="p-3 font-medium">{e.razonSocial}</td>
                    <td className="p-3 text-slate-600">{e.nombreFantasia||'—'}</td>
                    <td className="p-3 text-slate-600 max-w-[160px] truncate">{e.giro||'—'}</td>
                    <td className="p-3 text-slate-600">{e.region||'—'}</td>
                    <td className="p-3 text-center"><span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold">{(e.unidadesNegocio||[]).length}</span></td>
                    <td className="p-3 text-center"><span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold">{(e.centrosCosto||[]).length}</span></td>
                    <td className="p-3 text-center"><span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">{(e.bodegas||[]).length}</span></td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={()=>openEdit(e)} className="p-2 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600" title="Editar"><Pencil size={14}/></button>
                        <button onClick={()=>handleDelete(e)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" title="Eliminar"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- CONFIGURACIONES: PLAN DE CUENTAS ---
const NATURALEZA_OPT = ['Deudora','Acreedora'];
const TIPO_CUENTA_OPT = ['Activo','Pasivo','Patrimonio','Ingresos','Gastos','Resultado','Orden'];

const emptyPlanCuenta = () => ({
  id: '', numCuenta: '', descripcion: '', naturaleza: 'Deudora', tipoCuenta: 'Activo',
  tipoDocumento: '', numDocumento: '',
  nivel1: '', nivel2: '', nivel3: '', nivel4: '', nivel5: '',
  fechaEmision: '', fechaVencimiento: '', homologacionSII: '',
  centroCosto: '', fechaVigencia: '', presupuesto: '', flujoCaja: '',
});

const PC_COL_MAP = {
  'N° Cuenta': 'numCuenta', 'Num Cuenta': 'numCuenta', 'numCuenta': 'numCuenta',
  'Descripción': 'descripcion', 'Descripcion': 'descripcion', 'descripcion': 'descripcion',
  'Naturaleza': 'naturaleza', 'naturaleza': 'naturaleza',
  'Tipo Cuenta': 'tipoCuenta', 'tipoCuenta': 'tipoCuenta',
  'Tipo Documento': 'tipoDocumento', 'tipoDocumento': 'tipoDocumento',
  'N° Documento': 'numDocumento', 'numDocumento': 'numDocumento',
  'Nivel 1': 'nivel1', 'Nivel 2': 'nivel2', 'Nivel 3': 'nivel3', 'Nivel 4': 'nivel4', 'Nivel 5': 'nivel5',
  'Fecha Emision': 'fechaEmision', 'Fecha Emisión': 'fechaEmision',
  'Fecha Vencimiento': 'fechaVencimiento',
  'Fecha Vigencia': 'fechaVigencia',
  'Homologacion SII': 'homologacionSII', 'Homologación SII': 'homologacionSII',
  'Centro Costo': 'centroCosto', 'Centro de Costo': 'centroCosto',
  'Presupuesto': 'presupuesto',
  'Flujo Caja': 'flujoCaja', 'Flujo de Caja': 'flujoCaja',
};

const PC_TEMPLATE_HEADERS = [
  'N° Cuenta','Descripción','Naturaleza','Tipo Cuenta','Tipo Documento','N° Documento',
  'Nivel 1','Nivel 2','Nivel 3','Nivel 4','Nivel 5',
  'Fecha Emision','Fecha Vencimiento','Fecha Vigencia',
  'Homologacion SII','Centro Costo','Presupuesto','Flujo Caja',
];

const ConfigPlanCuentas = () => {
  const { planCuentas, setPlanCuentas } = useContext(ERPContext);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [importModal, setImportModal] = useState(null);
  const fileInputRef = useRef(null);

  const normalizeText = (v) => String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const filtered = planCuentas.filter(c =>
    normalizeText([c.numCuenta, c.descripcion, c.tipoCuenta, c.centroCosto].join(' ')).includes(normalizeText(search))
  );

  const openNew  = () => setModal({ mode:'new',  data: emptyPlanCuenta() });
  const openEdit = (c) => setModal({ mode:'edit', data: { ...c } });
  const closeModal = () => setModal(null);
  const setField = (k,v) => setModal(m => ({ ...m, data: { ...m.data, [k]: v } }));

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const sampleRow = ['1-01-001','Caja','Deudora','Activo','','','1','01','001','','','','','','','Operaciones','','Operacional'];
    const ws = XLSX.utils.aoa_to_sheet([PC_TEMPLATE_HEADERS, sampleRow]);
    ws['!cols'] = PC_TEMPLATE_HEADERS.map(() => ({ wch: 18 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Plan de Cuentas');
    XLSX.writeFile(wb, 'plantilla_plan_cuentas.xlsx');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { defval: '' });
        const rows = [];
        const errors = [];
        raw.forEach((row, i) => {
          const mapped = { ...emptyPlanCuenta(), id: Date.now().toString() + i };
          Object.entries(row).forEach(([col, val]) => {
            const key = PC_COL_MAP[col.trim()];
            if (key) mapped[key] = String(val ?? '').trim();
          });
          if (!mapped.numCuenta) { errors.push(`Fila ${i+2}: falta N° Cuenta`); return; }
          if (!mapped.descripcion) { errors.push(`Fila ${i+2}: falta Descripción`); return; }
          rows.push(mapped);
        });
        setImportModal({ rows, errors });
      } catch {
        alert('Error al leer el archivo. Asegúrate de que sea un archivo Excel válido (.xlsx).');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImportConfirm = () => {
    setPlanCuentas(prev => [...prev, ...importModal.rows]);
    setImportModal(null);
  };

  const handleSave = () => {
    const { mode, data } = modal;
    if (!data.numCuenta || !data.descripcion) { alert('Número de cuenta y descripción son obligatorios.'); return; }
    if (mode === 'new') {
      setPlanCuentas(prev => [...prev, { ...data, id: Date.now().toString() }]);
    } else {
      setPlanCuentas(prev => prev.map(c => c.id === data.id ? { ...data } : c));
    }
    closeModal();
  };

  const handleDelete = (c) => {
    if (!window.confirm(`¿Eliminar cuenta "${c.numCuenta} - ${c.descripcion}"?`)) return;
    setPlanCuentas(prev => prev.filter(x => x.id !== c.id));
  };

  const fieldCls = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";
  const labelCls = "block text-xs font-semibold text-slate-500 uppercase mb-1";

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Configuraciones</p>
          <h2 className="text-2xl font-bold text-slate-900">Plan de Cuentas</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDownloadTemplate} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors">
            <Download size={14}/> Plantilla Excel
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 text-xs font-semibold hover:bg-emerald-100 transition-colors">
            <Upload size={14}/> Importar Excel
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange}/>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm">
            <Plus size={14}/> Nueva Cuenta
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative w-full lg:max-w-md">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar número, descripción, tipo…"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"/>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b">
              {['N° Cuenta','Descripción','Naturaleza','Tipo','Nivel 1','Nivel 2','Centro Costo','Presupuesto','Flujo Caja','Acciones'].map(h=>(
                <th key={h} className="p-3 text-[10px] font-bold uppercase text-slate-500 text-left whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan="10" className="px-6 py-12 text-center text-slate-400 italic">No hay cuentas registradas.</td></tr>
                : filtered.map(c=>(
                  <tr key={c.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-mono text-xs font-bold text-blue-700">{c.numCuenta}</td>
                    <td className="p-3 font-medium max-w-[180px] truncate">{c.descripcion}</td>
                    <td className="p-3 text-xs">{c.naturaleza}</td>
                    <td className="p-3 text-xs">{c.tipoCuenta}</td>
                    <td className="p-3 text-xs">{c.nivel1||'—'}</td>
                    <td className="p-3 text-xs">{c.nivel2||'—'}</td>
                    <td className="p-3 text-xs">{c.centroCosto||'—'}</td>
                    <td className="p-3 text-xs">{c.presupuesto ? `$${Number(c.presupuesto).toLocaleString('es-CL')}` : '—'}</td>
                    <td className="p-3 text-xs">{c.flujoCaja||'—'}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={()=>openEdit(c)} className="p-2 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600"><Pencil size={14}/></button>
                        <button onClick={()=>handleDelete(c)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {importModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Importar Plan de Cuentas</h3>
                <p className="text-xs text-slate-500 mt-0.5">{importModal.rows.length} cuenta(s) válidas encontradas{importModal.errors.length > 0 ? ` · ${importModal.errors.length} fila(s) con error` : ''}</p>
              </div>
              <button onClick={() => setImportModal(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X size={16}/></button>
            </div>
            <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
              {importModal.errors.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs font-bold text-amber-700 mb-1">Filas ignoradas:</p>
                  {importModal.errors.map((e,i) => <p key={i} className="text-xs text-amber-600">{e}</p>)}
                </div>
              )}
              {importModal.rows.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                    <thead><tr className="bg-slate-50 border-b">
                      {['N° Cuenta','Descripción','Naturaleza','Tipo Cuenta','Nivel 1','Nivel 2','Centro Costo'].map(h=>(
                        <th key={h} className="p-2 text-[10px] font-bold uppercase text-slate-500 text-left whitespace-nowrap">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {importModal.rows.slice(0,50).map((r,i)=>(
                        <tr key={i} className="border-b hover:bg-slate-50">
                          <td className="p-2 font-mono font-bold text-blue-700">{r.numCuenta}</td>
                          <td className="p-2 max-w-[200px] truncate">{r.descripcion}</td>
                          <td className="p-2">{r.naturaleza}</td>
                          <td className="p-2">{r.tipoCuenta}</td>
                          <td className="p-2">{r.nivel1||'—'}</td>
                          <td className="p-2">{r.nivel2||'—'}</td>
                          <td className="p-2">{r.centroCosto||'—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importModal.rows.length > 50 && <p className="text-xs text-slate-400 mt-2 text-center">Mostrando primeras 50 de {importModal.rows.length} filas.</p>}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <button onClick={() => setImportModal(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-colors">Cancelar</button>
              <button onClick={handleImportConfirm} disabled={importModal.rows.length === 0}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <CheckCircle size={15}/> Importar {importModal.rows.length} cuenta(s)
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {modal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">{modal.mode==='new'?'Nueva Cuenta':'Editar Cuenta'}</h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X size={16}/></button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {/* Datos principales */}
              <div>
                <p className={labelCls+" mb-3"}>Datos principales</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div><label className={labelCls}>N° Cuenta Contable</label><input value={modal.data.numCuenta||''} onChange={e=>setField('numCuenta',e.target.value)} className={fieldCls}/></div>
                  <div className="lg:col-span-2"><label className={labelCls}>Descripción</label><input value={modal.data.descripcion||''} onChange={e=>setField('descripcion',e.target.value)} className={fieldCls}/></div>
                  <div><label className={labelCls}>Naturaleza</label>
                    <select value={modal.data.naturaleza||'Deudora'} onChange={e=>setField('naturaleza',e.target.value)} className={fieldCls+" bg-white"}>
                      {NATURALEZA_OPT.map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div><label className={labelCls}>Tipo de Cuenta</label>
                    <select value={modal.data.tipoCuenta||'Activo'} onChange={e=>setField('tipoCuenta',e.target.value)} className={fieldCls+" bg-white"}>
                      {TIPO_CUENTA_OPT.map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div><label className={labelCls}>Tipo Documento</label><input value={modal.data.tipoDocumento||''} onChange={e=>setField('tipoDocumento',e.target.value)} className={fieldCls}/></div>
                  <div><label className={labelCls}>N° Documento</label><input value={modal.data.numDocumento||''} onChange={e=>setField('numDocumento',e.target.value)} className={fieldCls}/></div>
                </div>
              </div>
              {/* Niveles */}
              <div>
                <p className={labelCls+" mb-3"}>Niveles jerárquicos</p>
                <div className="grid grid-cols-5 gap-3">
                  {[1,2,3,4,5].map(n=>(
                    <div key={n}><label className={labelCls}>Nivel {n}</label>
                      <input value={modal.data[`nivel${n}`]||''} onChange={e=>setField(`nivel${n}`,e.target.value)} className={fieldCls}/>
                    </div>
                  ))}
                </div>
              </div>
              {/* Fechas y otros */}
              <div>
                <p className={labelCls+" mb-3"}>Fechas y parámetros</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div><label className={labelCls}>Fecha Emisión</label><input type="date" value={modal.data.fechaEmision||''} onChange={e=>setField('fechaEmision',e.target.value)} className={fieldCls}/></div>
                  <div><label className={labelCls}>Fecha Vencimiento</label><input type="date" value={modal.data.fechaVencimiento||''} onChange={e=>setField('fechaVencimiento',e.target.value)} className={fieldCls}/></div>
                  <div><label className={labelCls}>Fecha Vigencia</label><input type="date" value={modal.data.fechaVigencia||''} onChange={e=>setField('fechaVigencia',e.target.value)} className={fieldCls}/></div>
                  <div><label className={labelCls}>Homologación SII</label><input value={modal.data.homologacionSII||''} onChange={e=>setField('homologacionSII',e.target.value)} className={fieldCls}/></div>
                  <div><label className={labelCls}>Centro de Costo</label><input value={modal.data.centroCosto||''} onChange={e=>setField('centroCosto',e.target.value)} className={fieldCls}/></div>
                  <div><label className={labelCls}>Presupuesto</label><input type="number" value={modal.data.presupuesto||''} onChange={e=>setField('presupuesto',e.target.value)} className={fieldCls}/></div>
                  <div><label className={labelCls}>Flujo de Caja</label><input value={modal.data.flujoCaja||''} onChange={e=>setField('flujoCaja',e.target.value)} placeholder="Ej: Operacional" className={fieldCls}/></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <button onClick={closeModal} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-colors">Cancelar</button>
              <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors">
                <CheckCircle size={15}/> Guardar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// --- CONFIGURACIONES: TIPO DE DOCUMENTOS ---
const TD_CICLO      = ['Compra','Venta','Ambos','Ninguno'];
const TD_DEBE_HABER = ['Debe','Haber','Ambos'];
const TD_MONEDA     = ['Todas','CLP - Peso Chileno','USD - Dólar Americano','EUR - Euro','UF - Unidad de Fomento'];
const TD_LIBRO      = ['Ninguno','Ventas','Compras','Honorarios','Remuneraciones'];
const TD_SI_NO      = ['No','Sí'];
const TD_PAGOS      = ['No requiere','Genera pago','Pago requerido','Automático'];
const TD_COMPROBANTE= ['No se contabiliza','Comprobante ingreso','Comprobante egreso','Comprobante diario'];
const TD_EXENTO     = ['Ambos','Exento','Afecto'];
const TD_DETALLE    = ['Productos/Servicios','Solo productos','Solo servicios','Sin detalle'];
const TD_DESTINO    = ['Unico','Múltiple'];
const TD_TESORERIA  = ['Otros','Banco','Caja','Electrónico'];
const TD_CORRELATIVO= ['Interno','Externo'];
const TD_DIRECCION  = ['Referencia','Facturación','Despacho'];
const TD_ESTADO     = ['Activo','Inactivo'];
const TD_RELACION   = ['Detalle','Encabezado','Referencia'];

const emptyTipoDoc = () => ({
  id:'', tipDoc:'', descripcion:'', codigoSII:'0', ciclo:'Compra',
  debeHaber:'Haber', moneda:'Todas', libro:'Ninguno', libroRetencion:'No',
  flujoCaja:'No', pagos:'No requiere', tipoComprobante:'No se contabiliza',
  exentoIVA:'Ambos', valorConIVA:'No', cuentaCorriente:'No',
  detalle:'Productos/Servicios', codigoFormatoXML:'0', fechaVencimiento:'No',
  destino:'Unico', deTesoreria:'Otros',
  empresaConfig:[], relacionesAnt:[], relacionesPost:[],
});

const emptyEmpresaConfig = () => ({
  id: Date.now()+Math.random(), empresa:'', stock:'No', orden:'1',
  tipoCorrelativo:'Interno', correlativo:'1', tipoDireccion:'Referencia',
  relacionObligatoria:'No', cuentaContable:'', estado:'Activo',
  formatoDoc:'', porcentajeCEEC:'No', documentoREX:'',
});

const TD_XLS_HEADERS = [
  'Tipo Doc','Descripción','Código SII','Ciclo','Debe/Haber','Moneda','Libro',
  'Libro Retención','Flujo Caja','Pagos','Tipo Comprobante','Exento IVA',
  'Valor con IVA','Cuenta Corriente','Detalle','Cód. Formato XML',
  'Fecha Vencimiento','Destino','De Tesorería',
];
const TD_XLS_MAP = {
  'Tipo Doc':'tipDoc','Descripción':'descripcion','Descripcion':'descripcion',
  'Código SII':'codigoSII','Codigo SII':'codigoSII',
  'Ciclo':'ciclo','Debe/Haber':'debeHaber','Moneda':'moneda','Libro':'libro',
  'Libro Retención':'libroRetencion','Libro Retencion':'libroRetencion',
  'Flujo Caja':'flujoCaja','Pagos':'pagos','Tipo Comprobante':'tipoComprobante',
  'Exento IVA':'exentoIVA','Valor con IVA':'valorConIVA','Cuenta Corriente':'cuentaCorriente',
  'Detalle':'detalle','Cód. Formato XML':'codigoFormatoXML','Cod. Formato XML':'codigoFormatoXML',
  'Fecha Vencimiento':'fechaVencimiento','Destino':'destino','De Tesorería':'deTesoreria','De Tesoreria':'deTesoreria',
};

const TD_SEL_CLS = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";
const TD_INP_CLS = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";
const TD_LBL_CLS = "block text-xs font-semibold text-slate-500 uppercase mb-1";

const TDSelectField = ({ label, field, opts, formObj, setFn }) => (
  <div>
    <label className={TD_LBL_CLS}>{label}</label>
    <select value={formObj[field]||opts[0]} onChange={e=>setFn(field,e.target.value)} className={TD_SEL_CLS}>
      {opts.map(o=><option key={o}>{o}</option>)}
    </select>
  </div>
);
const TDInputField = ({ label, field, formObj, setFn, type='text' }) => (
  <div>
    <label className={TD_LBL_CLS}>{label}</label>
    <input type={type} value={formObj[field]||''} onChange={e=>setFn(field,e.target.value)} className={TD_INP_CLS}/>
  </div>
);

const ConfigTipoDocumentos = () => {
  const { tipoDocumentos, setTipoDocumentos, empresas } = useContext(ERPContext);
  const [view, setView]         = useState('list');
  const [form, setForm]         = useState(emptyTipoDoc());
  const [activeTab, setActiveTab] = useState('tipo-doc');
  const [search, setSearch]     = useState('');
  const [subModal, setSubModal] = useState(null);
  const [importModal, setImportModal] = useState(null);
  const fileInputRef = useRef(null);

  const setField = (k,v) => setForm(f => ({ ...f, [k]: v }));
  const norm = (v) => String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const filtered = tipoDocumentos.filter(d =>
    norm([d.tipDoc, d.descripcion, d.ciclo].join(' ')).includes(norm(search))
  );

  const openNew  = () => { setForm(emptyTipoDoc()); setActiveTab('tipo-doc'); setView('form'); };
  const openEdit = (d) => { setForm({ ...d, empresaConfig: d.empresaConfig||[], relacionesAnt: d.relacionesAnt||[], relacionesPost: d.relacionesPost||[] }); setActiveTab('tipo-doc'); setView('form'); };
  const cancel   = () => setView('list');

  const handleSave = () => {
    if (!form.tipDoc || !form.descripcion) { alert('Tipo Doc y Descripción son obligatorios.'); return; }
    if (form.id) {
      setTipoDocumentos(prev => prev.map(d => d.id === form.id ? { ...form } : d));
    } else {
      setTipoDocumentos(prev => [{ ...form, id: Date.now().toString() }, ...prev]);
    }
    setView('list');
  };

  const handleDelete = (d) => {
    if (!window.confirm(`¿Eliminar tipo documento "${d.tipDoc} - ${d.descripcion}"?`)) return;
    setTipoDocumentos(prev => prev.filter(x => x.id !== d.id));
  };

  // Empresa config CRUD
  const openNewEC   = () => setSubModal({ type:'empresa', mode:'new', data: emptyEmpresaConfig() });
  const openEditEC  = (ec) => setSubModal({ type:'empresa', mode:'edit', data: { ...ec } });
  const saveEC = () => {
    if (!subModal.data.empresa) { alert('Selecciona una empresa.'); return; }
    if (subModal.mode === 'new') {
      setForm(f => ({ ...f, empresaConfig: [...f.empresaConfig, subModal.data] }));
    } else {
      setForm(f => ({ ...f, empresaConfig: f.empresaConfig.map(ec => ec.id === subModal.data.id ? subModal.data : ec) }));
    }
    setSubModal(null);
  };
  const removeEC = (id) => setForm(f => ({ ...f, empresaConfig: f.empresaConfig.filter(ec => ec.id !== id) }));
  const setECField = (k,v) => setSubModal(m => ({ ...m, data: { ...m.data, [k]: v } }));

  // Relaciones CRUD
  const openNewRel = (type) => setSubModal({ type, mode:'new', data:{ id: Date.now()+Math.random(), tipoDoc:'', tipoRelacion:'Detalle' } });
  const saveRel = () => {
    const { type, mode, data } = subModal;
    const key = type === 'ant' ? 'relacionesAnt' : 'relacionesPost';
    if (mode === 'new') {
      setForm(f => ({ ...f, [key]: [...f[key], data] }));
    } else {
      setForm(f => ({ ...f, [key]: f[key].map(r => r.id === data.id ? data : r) }));
    }
    setSubModal(null);
  };
  const removeRel = (type, id) => {
    const key = type === 'ant' ? 'relacionesAnt' : 'relacionesPost';
    setForm(f => ({ ...f, [key]: f[key].filter(r => r.id !== id) }));
  };
  const setRelField = (k,v) => setSubModal(m => ({ ...m, data: { ...m.data, [k]: v } }));

  // Excel template download
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const sample = ['OC','Orden de compra','0','Compra','Haber','Todas','Ninguno','No','No','No requiere','No se contabiliza','Ambos','No','No','Productos/Servicios','0','No','Unico','Otros'];
    const ws = XLSX.utils.aoa_to_sheet([TD_XLS_HEADERS, sample]);
    ws['!cols'] = TD_XLS_HEADERS.map(()=>({ wch:20 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Tipo Documentos');
    XLSX.writeFile(wb, 'plantilla_tipo_documentos.xlsx');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type:'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { defval:'' });
        const rows = []; const errors = [];
        raw.forEach((row, i) => {
          const mapped = { ...emptyTipoDoc(), id: Date.now().toString()+i };
          Object.entries(row).forEach(([col, val]) => {
            const key = TD_XLS_MAP[col.trim()];
            if (key) mapped[key] = String(val??'').trim();
          });
          if (!mapped.tipDoc)       { errors.push(`Fila ${i+2}: falta Tipo Doc`); return; }
          if (!mapped.descripcion)  { errors.push(`Fila ${i+2}: falta Descripción`); return; }
          rows.push(mapped);
        });
        setImportModal({ rows, errors });
      } catch { alert('Error al leer el archivo. Asegúrate de que sea .xlsx válido.'); }
    };
    reader.readAsBinaryString(file);
  };

  const handleImportConfirm = () => {
    setTipoDocumentos(prev => [...prev, ...importModal.rows]);
    setImportModal(null);
  };

  const tabBase = "px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap";
  const tabAct  = tabBase + " border-blue-600 text-blue-600";
  const tabIna  = tabBase + " border-transparent text-slate-500 hover:text-slate-700";

  /* ---- FORM VIEW ---- */
  if (view === 'form') return (
    <div className="w-full max-w-5xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Configuraciones / Tipo de Documentos</p>
          <h2 className="text-xl font-bold text-slate-900">
            {form.id ? `${form.tipDoc} - ${form.descripcion}` : 'Nuevo Tipo de Documento'}
          </h2>
        </div>
        <div className="flex gap-2">
          <button onClick={cancel} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-colors">Cancelar</button>
          <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors">
            <CheckCircle size={15}/> Guardar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {[['tipo-doc','Tipo documento'],['por-empresa','Tipo doc. por empresa'],['rel-ant','Relaciones anteriores'],['rel-post','Relaciones posteriores']].map(([id,lbl])=>(
            <button key={id} onClick={()=>setActiveTab(id)} className={activeTab===id?tabAct:tabIna}>{lbl}</button>
          ))}
        </div>

        {/* TAB: Tipo documento */}
        {activeTab === 'tipo-doc' && (
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <TDInputField label="Tipo Doc." field="tipDoc" formObj={form} setFn={setField}/>
              <div className="sm:col-span-2"><TDInputField label="Descripción" field="descripcion" formObj={form} setFn={setField}/></div>
              <TDInputField label="Código SII" field="codigoSII" formObj={form} setFn={setField}/>
              <TDSelectField label="Ciclo" field="ciclo" opts={TD_CICLO} formObj={form} setFn={setField}/>
              <TDSelectField label="Debe/Haber" field="debeHaber" opts={TD_DEBE_HABER} formObj={form} setFn={setField}/>
              <TDSelectField label="Moneda" field="moneda" opts={TD_MONEDA} formObj={form} setFn={setField}/>
              <TDSelectField label="Libro" field="libro" opts={TD_LIBRO} formObj={form} setFn={setField}/>
              <TDSelectField label="Libro Retención" field="libroRetencion" opts={TD_SI_NO} formObj={form} setFn={setField}/>
              <TDSelectField label="Flujo Caja" field="flujoCaja" opts={TD_SI_NO} formObj={form} setFn={setField}/>
              <TDSelectField label="Pagos" field="pagos" opts={TD_PAGOS} formObj={form} setFn={setField}/>
              <TDSelectField label="Tipo Comprobante" field="tipoComprobante" opts={TD_COMPROBANTE} formObj={form} setFn={setField}/>
              <TDSelectField label="Exento IVA/Honorarios" field="exentoIVA" opts={TD_EXENTO} formObj={form} setFn={setField}/>
              <TDSelectField label="Valor con IVA" field="valorConIVA" opts={TD_SI_NO} formObj={form} setFn={setField}/>
              <TDSelectField label="Cuenta Corriente" field="cuentaCorriente" opts={TD_SI_NO} formObj={form} setFn={setField}/>
              <TDSelectField label="Detalle" field="detalle" opts={TD_DETALLE} formObj={form} setFn={setField}/>
              <TDInputField label="Cód. Formato XML" field="codigoFormatoXML" formObj={form} setFn={setField}/>
              <TDSelectField label="Fecha Vencimiento" field="fechaVencimiento" opts={TD_SI_NO} formObj={form} setFn={setField}/>
              <TDSelectField label="Destino" field="destino" opts={TD_DESTINO} formObj={form} setFn={setField}/>
              <TDSelectField label="De Tesorería" field="deTesoreria" opts={TD_TESORERIA} formObj={form} setFn={setField}/>
            </div>
          </div>
        )}

        {/* TAB: Por empresa */}
        {activeTab === 'por-empresa' && (
          <div>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Configuración por Empresa</h3>
              <button onClick={openNewEC} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors">
                <Plus size={13}/> Agregar
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 border-b">
                  {['Empresa','Stock','Orden','Tipo Correlativo','Correlativo','Dirección','Estado',''].map(h=>(
                    <th key={h} className="p-3 text-[10px] font-bold uppercase text-slate-500 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {(form.empresaConfig||[]).length === 0
                    ? <tr><td colSpan="8" className="p-8 text-center text-slate-400 italic text-xs">Sin configuración por empresa. Haz clic en Agregar.</td></tr>
                    : (form.empresaConfig||[]).map(ec=>(
                      <tr key={ec.id} className="border-b hover:bg-slate-50">
                        <td className="p-3 font-medium text-xs">{ec.empresa}</td>
                        <td className="p-3 text-xs">{ec.stock}</td>
                        <td className="p-3 text-xs">{ec.orden}</td>
                        <td className="p-3 text-xs">{ec.tipoCorrelativo}</td>
                        <td className="p-3 text-xs">{ec.correlativo}</td>
                        <td className="p-3 text-xs">{ec.tipoDireccion}</td>
                        <td className="p-3 text-xs"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ec.estado==='Activo'?'bg-emerald-50 text-emerald-700':'bg-slate-100 text-slate-500'}`}>{ec.estado}</span></td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <button onClick={()=>openEditEC(ec)} className="p-1.5 rounded text-slate-400 hover:bg-blue-50 hover:text-blue-600"><Pencil size={13}/></button>
                            <button onClick={()=>removeEC(ec.id)} className="p-1.5 rounded text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={13}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: Relaciones anteriores / posteriores */}
        {(activeTab === 'rel-ant' || activeTab === 'rel-post') && (() => {
          const isAnt = activeTab === 'rel-ant';
          const key   = isAnt ? 'relacionesAnt' : 'relacionesPost';
          const colLabel = isAnt ? 'Tipo Documento Origen' : 'Tipo Documento Destino';
          return (
            <div>
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{isAnt ? 'Relaciones Anteriores' : 'Relaciones Posteriores'}</h3>
                <button onClick={()=>openNewRel(isAnt?'ant':'post')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors">
                  <Plus size={13}/> Nueva Relación
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-50 border-b">
                    {[colLabel,'Tipo Relación',''].map(h=>(
                      <th key={h} className="p-3 text-[10px] font-bold uppercase text-slate-500 text-left">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {(form[key]||[]).length === 0
                      ? <tr><td colSpan="3" className="p-8 text-center text-slate-400 italic text-xs">Sin relaciones. Haz clic en Nueva Relación.</td></tr>
                      : (form[key]||[]).map(r=>(
                        <tr key={r.id} className="border-b hover:bg-slate-50">
                          <td className="p-3 text-sm">{r.tipoDoc||'—'}</td>
                          <td className="p-3 text-xs"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold">{r.tipoRelacion}</span></td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <button onClick={()=>setSubModal({ type: isAnt?'ant':'post', mode:'edit', data:{...r} })} className="p-1.5 rounded text-slate-400 hover:bg-blue-50 hover:text-blue-600"><Pencil size={13}/></button>
                              <button onClick={()=>removeRel(isAnt?'ant':'post', r.id)} className="p-1.5 rounded text-slate-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={13}/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Sub-modal: Empresa config */}
      {subModal?.type === 'empresa' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">{subModal.mode==='new'?'Agregar':'Editar'} Configuración por Empresa</h3>
              <button onClick={()=>setSubModal(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X size={16}/></button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5">
              {/* General tab content */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className={TD_LBL_CLS}>Empresa</label>
                  <select value={subModal.data.empresa} onChange={e=>setECField('empresa',e.target.value)} className={TD_SEL_CLS}>
                    <option value="">— Seleccionar —</option>
                    {empresas.map(emp=><option key={emp.id} value={emp.razonSocial}>{emp.razonSocial}</option>)}
                  </select>
                </div>
                <div><label className={TD_LBL_CLS}>Stock</label><select value={subModal.data.stock} onChange={e=>setECField('stock',e.target.value)} className={TD_SEL_CLS}>{TD_SI_NO.map(o=><option key={o}>{o}</option>)}</select></div>
                <div><label className={TD_LBL_CLS}>Orden</label><input type="number" value={subModal.data.orden} onChange={e=>setECField('orden',e.target.value)} className={TD_INP_CLS}/></div>
                <div><label className={TD_LBL_CLS}>Tipo Correlativo</label><select value={subModal.data.tipoCorrelativo} onChange={e=>setECField('tipoCorrelativo',e.target.value)} className={TD_SEL_CLS}>{TD_CORRELATIVO.map(o=><option key={o}>{o}</option>)}</select></div>
                <div><label className={TD_LBL_CLS}>Correlativo</label><input type="number" value={subModal.data.correlativo} onChange={e=>setECField('correlativo',e.target.value)} className={TD_INP_CLS}/></div>
                <div><label className={TD_LBL_CLS}>Tipo de Dirección</label><select value={subModal.data.tipoDireccion} onChange={e=>setECField('tipoDireccion',e.target.value)} className={TD_SEL_CLS}>{TD_DIRECCION.map(o=><option key={o}>{o}</option>)}</select></div>
                <div><label className={TD_LBL_CLS}>Relación Obligatoria</label><select value={subModal.data.relacionObligatoria} onChange={e=>setECField('relacionObligatoria',e.target.value)} className={TD_SEL_CLS}>{TD_SI_NO.map(o=><option key={o}>{o}</option>)}</select></div>
                <div className="sm:col-span-2"><label className={TD_LBL_CLS}>Cuenta Contable</label><input value={subModal.data.cuentaContable} onChange={e=>setECField('cuentaContable',e.target.value)} className={TD_INP_CLS}/></div>
                <div><label className={TD_LBL_CLS}>Estado</label><select value={subModal.data.estado} onChange={e=>setECField('estado',e.target.value)} className={TD_SEL_CLS}>{TD_ESTADO.map(o=><option key={o}>{o}</option>)}</select></div>
                <div><label className={TD_LBL_CLS}>Formato Doc</label><input value={subModal.data.formatoDoc} onChange={e=>setECField('formatoDoc',e.target.value)} className={TD_INP_CLS}/></div>
                <div><label className={TD_LBL_CLS}>Porcentaje CEEC</label><select value={subModal.data.porcentajeCEEC} onChange={e=>setECField('porcentajeCEEC',e.target.value)} className={TD_SEL_CLS}>{TD_SI_NO.map(o=><option key={o}>{o}</option>)}</select></div>
                <div><label className={TD_LBL_CLS}>Documento REX+</label><input value={subModal.data.documentoREX} onChange={e=>setECField('documentoREX',e.target.value)} className={TD_INP_CLS}/></div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <button onClick={()=>setSubModal(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-100">Cancelar</button>
              <button onClick={saveEC} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700"><CheckCircle size={15}/> Guardar</button>
            </div>
          </div>
        </div>, document.body
      )}

      {/* Sub-modal: Relación */}
      {subModal && (subModal.type==='ant'||subModal.type==='post') && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">{subModal.mode==='new'?'Nueva':'Editar'} Relación de Documentos</h3>
              <button onClick={()=>setSubModal(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X size={16}/></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className={TD_LBL_CLS}>{subModal.type==='ant'?'Tipo Documento Origen':'Tipo Documento Destino'}</label>
                <select value={subModal.data.tipoDoc} onChange={e=>setRelField('tipoDoc',e.target.value)} className={TD_SEL_CLS}>
                  <option value="">— Seleccionar —</option>
                  {tipoDocumentos.filter(d=>d.id !== form.id).map(d=><option key={d.id} value={`${d.tipDoc} - ${d.descripcion}`}>{d.tipDoc} - {d.descripcion}</option>)}
                  <option value="Manual">Ingresar manualmente…</option>
                </select>
                {subModal.data.tipoDoc === 'Manual' && (
                  <input placeholder="Escribe el tipo de documento" onChange={e=>setRelField('tipoDoc',e.target.value)} className={TD_INP_CLS+" mt-2"}/>
                )}
              </div>
              <div>
                <label className={TD_LBL_CLS}>Tipo Relación</label>
                <select value={subModal.data.tipoRelacion} onChange={e=>setRelField('tipoRelacion',e.target.value)} className={TD_SEL_CLS}>
                  {TD_RELACION.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <button onClick={()=>setSubModal(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-100">Cancelar</button>
              <button onClick={saveRel} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700"><CheckCircle size={15}/> Guardar</button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );

  /* ---- LIST VIEW ---- */
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Configuraciones</p>
          <h2 className="text-2xl font-bold text-slate-900">Tipo de Documentos</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDownloadTemplate} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors">
            <Download size={14}/> Plantilla Excel
          </button>
          <button onClick={()=>fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 text-xs font-semibold hover:bg-emerald-100 transition-colors">
            <Upload size={14}/> Importar Excel
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange}/>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm">
            <Plus size={14}/> Nuevo Tipo
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative w-full lg:max-w-md">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar tipo, descripción, ciclo…"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"/>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b">
              {['Tipo Doc','Descripción','Ciclo','Debe/Haber','Moneda','Libro','Comprobante','Empresas','Acciones'].map(h=>(
                <th key={h} className="p-3 text-[10px] font-bold uppercase text-slate-500 text-left whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan="9" className="px-6 py-12 text-center text-slate-400 italic">No hay tipos de documento registrados.</td></tr>
                : filtered.map(d=>(
                  <tr key={d.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-mono text-xs font-bold text-blue-700">{d.tipDoc}</td>
                    <td className="p-3 font-medium max-w-[200px] truncate">{d.descripcion}</td>
                    <td className="p-3 text-xs">{d.ciclo}</td>
                    <td className="p-3 text-xs">{d.debeHaber}</td>
                    <td className="p-3 text-xs">{d.moneda}</td>
                    <td className="p-3 text-xs">{d.libro}</td>
                    <td className="p-3 text-xs max-w-[140px] truncate">{d.tipoComprobante}</td>
                    <td className="p-3 text-center"><span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold">{(d.empresaConfig||[]).length}</span></td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={()=>openEdit(d)} className="p-2 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600"><Pencil size={14}/></button>
                        <button onClick={()=>handleDelete(d)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import modal */}
      {importModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Importar Tipo de Documentos</h3>
                <p className="text-xs text-slate-500 mt-0.5">{importModal.rows.length} registro(s) válidos{importModal.errors.length > 0 ? ` · ${importModal.errors.length} fila(s) con error` : ''}</p>
              </div>
              <button onClick={()=>setImportModal(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X size={16}/></button>
            </div>
            <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
              {importModal.errors.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs font-bold text-amber-700 mb-1">Filas ignoradas:</p>
                  {importModal.errors.map((e,i)=><p key={i} className="text-xs text-amber-600">{e}</p>)}
                </div>
              )}
              {importModal.rows.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                    <thead><tr className="bg-slate-50 border-b">
                      {['Tipo Doc','Descripción','Ciclo','Debe/Haber','Moneda','Comprobante'].map(h=>(
                        <th key={h} className="p-2 text-[10px] font-bold uppercase text-slate-500 text-left">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {importModal.rows.slice(0,50).map((r,i)=>(
                        <tr key={i} className="border-b hover:bg-slate-50">
                          <td className="p-2 font-mono font-bold text-blue-700">{r.tipDoc}</td>
                          <td className="p-2">{r.descripcion}</td>
                          <td className="p-2">{r.ciclo}</td>
                          <td className="p-2">{r.debeHaber}</td>
                          <td className="p-2">{r.moneda}</td>
                          <td className="p-2">{r.tipoComprobante}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importModal.rows.length > 50 && <p className="text-xs text-slate-400 mt-2 text-center">Mostrando 50 de {importModal.rows.length} filas.</p>}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <button onClick={()=>setImportModal(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-100">Cancelar</button>
              <button onClick={handleImportConfirm} disabled={importModal.rows.length===0}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed">
                <CheckCircle size={15}/> Importar {importModal.rows.length} registro(s)
              </button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
};

// --- CONFIGURACIONES: PARÁMETROS ---
const PAR_INP = "rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";
const PAR_SEL = PAR_INP + " bg-white";
const PAR_LBL = "block text-[11px] font-semibold text-slate-500 uppercase mb-1";

const emptyCC = (activo = true) => ({ codigo: '', nombre: '', activo });

const emptyParametros = () => ({
  diasCaducidadClave:'90', monedaLocal:'PESO CHILENO', periodoContable:'Enero - Diciembre',
  correlativoComprobantes:'Por Tipo de Comprobante', tipoComprobanteStock:'Traspaso',
  tipoComprobanteApertura:'Apertura', funcionalidadComprobante:'Comprobante contable con documento',
  porcIVA:'19', ctaIVACompra:emptyCC(), ctaIVAVenta:emptyCC(),
  formaCalcularIVA:'Redondeo por detalle', porcRetencionHon:'14.5', ctaRetencionHon:emptyCC(),
  ctaIVAFueraPlazo:emptyCC(false), ccIVAFueraPlazo:emptyCC(false), concIVAFueraPlazo:['—','—','—','—'],
  ctaIVANCFueraPlazo:emptyCC(false), ccIVANCFueraPlazo:emptyCC(false), concIVANCFueraPlazo:['—','—','—','—'],
  ctaIVAProporcional:emptyCC(false), ctaIVANoRecuperable:emptyCC(false),
  ctaFacturasEmitir:emptyCC(), ctaFacturasRecibir:emptyCC(),
  ctaGuiasEmitir:emptyCC(), ctaGuiasRecibir:emptyCC(),
  ctaServicios:emptyCC(), ctaUtilidadEjercicio:emptyCC(),
  ctaImportTransito:emptyCC(false), ctaImpLey18211:emptyCC(false),
  ctaFleteExport:emptyCC(false), ctaSeguroExport:emptyCC(false), ctaCorreccionMon:emptyCC(),
  ctaInmatFavor:emptyCC(false), ccInmatFavor:emptyCC(false), concInmatFavor:['—','—','—','—'], limiteInmatFavor:'',
  ctaInmatContra:emptyCC(false), ccInmatContra:emptyCC(false), concInmatContra:['—','—','—','—'], limiteInmatContra:'',
  ctaRodFavor:emptyCC(false), ccRodFavor:emptyCC(false), concRodFavor:['—','—','—','—'],
  ctaRodContra:emptyCC(false), ccRodContra:emptyCC(false), concRodContra:['—','—','—','—'],
  ctaDifCFavor:emptyCC(false), ccDifCFavor:emptyCC(false), concDifCFavor:['—','—','—','—'],
  ctaDifCContra:emptyCC(false), ccDifCContra:emptyCC(false), concDifCContra:['—','—','—','—'],
  docAntCLiente:emptyCC(false), docAntProveedor:emptyCC(false),
  docAntCLAsoc:emptyCC(false), docAntProvAsoc:emptyCC(false),
  docAntCLSimple:emptyCC(false), docAntProvSimple:emptyCC(false),
  docAntCLExtAsoc:emptyCC(false), docAntProvExtAsoc:emptyCC(false),
  docAntCLExtSimple:emptyCC(false), docAntProvExtSimple:emptyCC(false),
  docAntHonAsoc:emptyCC(false), docAntHonSimple:emptyCC(false),
  docAntPersonal:emptyCC(false), docPrestPersonal:emptyCC(false),
  docFondoRendir:emptyCC(false), docDeudaProv:emptyCC(false),
  docPrestEmpRel:emptyCC(false), docDeudaEmpRel:emptyCC(false),
  plazoPagoOp:'60', multaPagoOp:'1.0', interesPagoOp:'25.0', ccPagoOp:emptyCC(false),
  srvMultaPagoOp:emptyCC(false), srvInteresPagoOp:emptyCC(false),
  srvMultaExentaPagoOp:emptyCC(false), srvInteresExentoPagoOp:emptyCC(false),
  fleteEnDIN:'5', seguroEnDIN:'2', unidadPeso:'', unidadVolumen:'',
  tagA2:'', tagA55:'', tagA56:'',
  nFamilia:'Familia', nSubfamilia:'SubFamilia', nMarca:'Marca', nOrigen:'Origen',
  nConcepto1:'Concepto 1', nConcepto2:'Concepto 2', nConcepto3:'Concepto 3', nConcepto4:'Concepto 4',
  nProdCaract1:'Producto característica 1', nProdCaract2:'Producto característica 2',
  nProdTexto1:'Producto texto 1', nProdTexto2:'Producto texto 2', nProdTexto3:'Producto texto 3',
  nCLProvCaract1:'Cliente/Prov característica 1', nCLProvCaract2:'Cliente/Prov característica 2',
  nCLProvTexto1:'Cliente/Prov texto 1', nCLProvTexto2:'Cliente/Prov texto 2',
});

const PAR_MONEDAS_LOCAL = ['PESO CHILENO','DÓLAR AMERICANO','EURO','UF'];
const PAR_PERIODOS      = ['Enero - Diciembre','Julio - Junio','Octubre - Septiembre'];
const PAR_CORRELATIVOS  = ['Por Tipo de Comprobante','Correlativo Único'];
const PAR_COMP_STOCK    = ['Traspaso','Ajuste','Otro'];
const PAR_COMP_APERTURA = ['Apertura','Otro'];
const PAR_FUNC_COMP     = ['Comprobante contable con documento','Comprobante contable sin documento','Sin comprobante'];
const PAR_FORMA_IVA     = ['Redondeo por detalle','Redondeo por total','Truncamiento'];
const PAR_CONCEPTOS_OPT = ['—','Concepto 1','Concepto 2','Concepto 3','Concepto 4'];

const ParCC = ({ label, value, onChange, clearable = false }) => (
  <div>
    {label && <label className={PAR_LBL}>{label}</label>}
    <div className="flex items-center gap-1">
      {clearable && (
        <button type="button" onClick={() => onChange({ ...value, codigo:'', nombre:'', activo:false })}
          className="flex-shrink-0 p-1.5 rounded border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
          <X size={13}/>
        </button>
      )}
      <input value={value.codigo||''} onChange={e => onChange({ ...value, codigo:e.target.value, activo:true })}
        className={`w-24 ${PAR_INP}`}/>
      <input value={value.nombre||''} onChange={e => onChange({ ...value, nombre:e.target.value, activo:true })}
        className={`flex-1 ${PAR_INP}`}/>
      <button type="button" className="flex-shrink-0 p-2 rounded border border-slate-200 text-slate-400 hover:text-blue-500 transition-colors">
        <Search size={14}/>
      </button>
    </div>
  </div>
);

const ParConceptos = ({ values, onChange, extras }) => (
  <div className={`grid gap-3 ${extras?.length ? `grid-cols-${4 + extras.length}` : 'grid-cols-4'}`}>
    {[0,1,2,3].map(i => (
      <div key={i}>
        <label className={PAR_LBL}>Concepto {i+1}</label>
        <select value={values[i]||'—'} onChange={e => { const a=[...values]; a[i]=e.target.value; onChange(a); }}
          className={`w-full ${PAR_SEL}`}>
          {PAR_CONCEPTOS_OPT.map(o=><option key={o}>{o}</option>)}
        </select>
      </div>
    ))}
    {(extras||[]).map(ex => (
      <div key={ex.label}>
        <label className={PAR_LBL}>{ex.label}</label>
        <input value={ex.value||''} onChange={e=>ex.onChange(e.target.value)} className={`w-full ${PAR_INP}`}/>
      </div>
    ))}
  </div>
);

const ParSaveBtn = ({ onClick }) => (
  <div className="flex justify-end pt-4 border-t border-slate-100 mt-2">
    <button onClick={onClick} className="px-6 py-2.5 rounded-lg bg-slate-700 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm tracking-widest uppercase">
      Guardar Parámetros
    </button>
  </div>
);

const ConfigParametros = () => {
  const { parametros: savedParam, setParametros } = useContext(ERPContext);
  const [form, setForm] = useState(() => ({ ...emptyParametros(), ...(savedParam || {}) }));
  const [activeTab, setActiveTab] = useState('general');

  const sf  = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = () => { setParametros(form); alert('Parámetros guardados correctamente.'); };

  const PAR_TABS = [
    ['general','General'],['impuestos','Impuestos'],['cuentas','Cuentas contables'],
    ['tesoreria','Tesorería'],['documentos','Documentos'],['proyecto','Proyecto'],
    ['otros','Otros'],['probabilidad','Probabilidad'],['nombre-campos','Nombre de campos'],['api','API Senegocia'],
  ];
  const tbBase = "px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap";

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Configuraciones</p>
        <h2 className="text-2xl font-bold text-slate-900">Parámetros Generales</h2>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {PAR_TABS.map(([id,lbl]) => (
            <button key={id} onClick={()=>setActiveTab(id)}
              className={activeTab===id ? tbBase+' border-blue-600 text-blue-600' : tbBase+' border-transparent text-slate-500 hover:text-slate-700'}>
              {lbl}
            </button>
          ))}
        </div>

        <div className="p-6">

          {/* ── GENERAL ── */}
          {activeTab==='general' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div><label className={PAR_LBL}>Días de caducidad de clave</label><input value={form.diasCaducidadClave} onChange={e=>sf('diasCaducidadClave',e.target.value)} className={`w-full ${PAR_INP}`}/></div>
                <div><label className={PAR_LBL}>Moneda local</label><select value={form.monedaLocal} onChange={e=>sf('monedaLocal',e.target.value)} className={`w-full ${PAR_SEL}`}>{PAR_MONEDAS_LOCAL.map(o=><option key={o}>{o}</option>)}</select></div>
                <div><label className={PAR_LBL}>Período contable</label><select value={form.periodoContable} onChange={e=>sf('periodoContable',e.target.value)} className={`w-full ${PAR_SEL}`}>{PAR_PERIODOS.map(o=><option key={o}>{o}</option>)}</select></div>
                <div><label className={PAR_LBL}>Correlativo de comprobantes</label><select value={form.correlativoComprobantes} onChange={e=>sf('correlativoComprobantes',e.target.value)} className={`w-full ${PAR_SEL}`}>{PAR_CORRELATIVOS.map(o=><option key={o}>{o}</option>)}</select></div>
                <div><label className={PAR_LBL}>Tipo de comprobante de stock</label><select value={form.tipoComprobanteStock} onChange={e=>sf('tipoComprobanteStock',e.target.value)} className={`w-full ${PAR_SEL}`}>{PAR_COMP_STOCK.map(o=><option key={o}>{o}</option>)}</select></div>
                <div><label className={PAR_LBL}>Tipo de comprobante de apertura</label><select value={form.tipoComprobanteApertura} onChange={e=>sf('tipoComprobanteApertura',e.target.value)} className={`w-full ${PAR_SEL}`}>{PAR_COMP_APERTURA.map(o=><option key={o}>{o}</option>)}</select></div>
                <div className="lg:col-span-2"><label className={PAR_LBL}>Funcionalidad de comprobante</label><select value={form.funcionalidadComprobante} onChange={e=>sf('funcionalidadComprobante',e.target.value)} className={`w-full ${PAR_SEL}`}>{PAR_FUNC_COMP.map(o=><option key={o}>{o}</option>)}</select></div>
              </div>
              <ParSaveBtn onClick={save}/>
            </div>
          )}

          {/* ── IMPUESTOS ── */}
          {activeTab==='impuestos' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div><label className={PAR_LBL}>% de IVA</label><input value={form.porcIVA} onChange={e=>sf('porcIVA',e.target.value)} className={`w-full ${PAR_INP}`}/></div>
                <ParCC label="Cuenta contable de IVA de compra" value={form.ctaIVACompra} onChange={v=>sf('ctaIVACompra',v)}/>
                <ParCC label="Cuenta contable de IVA de venta" value={form.ctaIVAVenta} onChange={v=>sf('ctaIVAVenta',v)}/>
                <div><label className={PAR_LBL}>Forma de calcular IVA</label><select value={form.formaCalcularIVA} onChange={e=>sf('formaCalcularIVA',e.target.value)} className={`w-full ${PAR_SEL}`}>{PAR_FORMA_IVA.map(o=><option key={o}>{o}</option>)}</select></div>
                <div><label className={PAR_LBL}>% de retención de honorarios</label><input value={form.porcRetencionHon} onChange={e=>sf('porcRetencionHon',e.target.value)} className={`w-full ${PAR_INP}`}/></div>
                <ParCC label="Cuenta contable de retención de honorarios" value={form.ctaRetencionHon} onChange={v=>sf('ctaRetencionHon',v)}/>
              </div>
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <ParCC label="Cuenta contable de IVA de fuera de plazo" value={form.ctaIVAFueraPlazo} onChange={v=>sf('ctaIVAFueraPlazo',v)} clearable/>
                  <ParCC label="Centro de costos de IVA de fuera de plazo" value={form.ccIVAFueraPlazo} onChange={v=>sf('ccIVAFueraPlazo',v)} clearable/>
                </div>
                <ParConceptos values={form.concIVAFueraPlazo} onChange={v=>sf('concIVAFueraPlazo',v)}/>
              </div>
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <ParCC label="Cuenta contable de IVA de NC fuera de plazo" value={form.ctaIVANCFueraPlazo} onChange={v=>sf('ctaIVANCFueraPlazo',v)} clearable/>
                  <ParCC label="Centro de costos de IVA de NC fuera de plazo" value={form.ccIVANCFueraPlazo} onChange={v=>sf('ccIVANCFueraPlazo',v)} clearable/>
                </div>
                <ParConceptos values={form.concIVANCFueraPlazo} onChange={v=>sf('concIVANCFueraPlazo',v)}/>
              </div>
              <div className="border-t border-slate-100 pt-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <ParCC label="Cuenta contable de IVA de proporcional" value={form.ctaIVAProporcional} onChange={v=>sf('ctaIVAProporcional',v)} clearable/>
                  <ParCC label="Cuenta contable de IVA no recuperable" value={form.ctaIVANoRecuperable} onChange={v=>sf('ctaIVANoRecuperable',v)} clearable/>
                </div>
              </div>
              <ParSaveBtn onClick={save}/>
            </div>
          )}

          {/* ── CUENTAS CONTABLES ── */}
          {activeTab==='cuentas' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ParCC label="Cuenta contable de facturas por emitir" value={form.ctaFacturasEmitir} onChange={v=>sf('ctaFacturasEmitir',v)}/>
                <ParCC label="Cuenta contable de facturas por recibir" value={form.ctaFacturasRecibir} onChange={v=>sf('ctaFacturasRecibir',v)}/>
                <ParCC label="Cuenta contable de guías por emitir" value={form.ctaGuiasEmitir} onChange={v=>sf('ctaGuiasEmitir',v)}/>
                <ParCC label="Cuenta contable de guías por recibir" value={form.ctaGuiasRecibir} onChange={v=>sf('ctaGuiasRecibir',v)}/>
                <ParCC label="Cuenta contable de Servicios" value={form.ctaServicios} onChange={v=>sf('ctaServicios',v)}/>
                <ParCC label="Cuenta contable de utilidad del ejercicio" value={form.ctaUtilidadEjercicio} onChange={v=>sf('ctaUtilidadEjercicio',v)}/>
                <ParCC label="Cuenta contable de importaciones en tránsito" value={form.ctaImportTransito} onChange={v=>sf('ctaImportTransito',v)} clearable/>
                <ParCC label="Cuenta contable de impuesto ley 18.211" value={form.ctaImpLey18211} onChange={v=>sf('ctaImpLey18211',v)} clearable/>
                <ParCC label="Cuenta contable flete en facturas de exportación" value={form.ctaFleteExport} onChange={v=>sf('ctaFleteExport',v)} clearable/>
                <ParCC label="Cuenta contable seguro en facturas de exportación" value={form.ctaSeguroExport} onChange={v=>sf('ctaSeguroExport',v)} clearable/>
                <ParCC label="Cuenta contable de corrección monetaria" value={form.ctaCorreccionMon} onChange={v=>sf('ctaCorreccionMon',v)}/>
              </div>
              <ParSaveBtn onClick={save}/>
            </div>
          )}

          {/* ── TESORERÍA ── */}
          {activeTab==='tesoreria' && (
            <div className="space-y-6">
              {[
                ['ctaInmatFavor','ccInmatFavor','concInmatFavor','Cuenta contable de inmaterial a favor','Centro de costos de inmaterial a favor',[{label:'Límite de inmaterial a favor',value:form.limiteInmatFavor,onChange:v=>sf('limiteInmatFavor',v)}]],
                ['ctaInmatContra','ccInmatContra','concInmatContra','Cuenta contable de inmaterial en contra','Centro de costos de inmaterial en contra',[{label:'Límite de inmaterial en contra',value:form.limiteInmatContra,onChange:v=>sf('limiteInmatContra',v)}]],
                ['ctaRodFavor','ccRodFavor','concRodFavor','Cuenta contable de redondeo inmaterial a favor','Centro de costos de redondeo inmaterial a favor',null],
                ['ctaRodContra','ccRodContra','concRodContra','Cuenta contable de redondeo inmaterial en contra','Centro de costos de redondeo inmaterial en contra',null],
                ['ctaDifCFavor','ccDifCFavor','concDifCFavor','Cuenta contable de diferencia cambio a favor','Centro de costos de diferencia cambio a favor',null],
                ['ctaDifCContra','ccDifCContra','concDifCContra','Cuenta contable de diferencia cambio en contra','Centro de costos de diferencia cambio en contra',null],
              ].map(([ck,cck,conck,lbl1,lbl2,extras],i) => (
                <div key={ck} className={i>0?'border-t border-slate-100 pt-5 space-y-3':'space-y-3'}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <ParCC label={lbl1} value={form[ck]} onChange={v=>sf(ck,v)} clearable/>
                    <ParCC label={lbl2} value={form[cck]} onChange={v=>sf(cck,v)} clearable/>
                  </div>
                  <ParConceptos values={form[conck]} onChange={v=>sf(conck,v)} extras={extras}/>
                </div>
              ))}
              <ParSaveBtn onClick={save}/>
            </div>
          )}

          {/* ── DOCUMENTOS ── */}
          {activeTab==='documentos' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[
                  ['docAntCLiente','Asociación de anticipo de cliente'],['docAntProveedor','Asociación de anticipo de proveedor'],
                  ['docAntCLAsoc','Anticipo de cliente asociado'],['docAntProvAsoc','Anticipo de proveedor asociado'],
                  ['docAntCLSimple','Anticipo de cliente simple'],['docAntProvSimple','Anticipo de proveedor simple'],
                  ['docAntCLExtAsoc','Anticipo de cliente extranjero asociado'],['docAntProvExtAsoc','Anticipo de proveedor extranjero asociado'],
                  ['docAntCLExtSimple','Anticipo de cliente extranjero simple'],['docAntProvExtSimple','Anticipo de proveedor extranjero simple'],
                  ['docAntHonAsoc','Anticipo de honorario asociado'],['docAntHonSimple','Anticipo de honorario simple'],
                  ['docAntPersonal','Anticipo a personal'],['docPrestPersonal','Préstamo a personal'],
                  ['docFondoRendir','Fondo por rendir a personal'],['docDeudaProv','Deuda a proveedor'],
                  ['docPrestEmpRel','Préstamo a empresa relacionada'],['docDeudaEmpRel','Deuda con empresa relacionada'],
                ].map(([k,lbl]) => (
                  <ParCC key={k} label={lbl} value={form[k]} onChange={v=>sf(k,v)} clearable/>
                ))}
              </div>
              <ParSaveBtn onClick={save}/>
            </div>
          )}

          {/* ── OTROS ── */}
          {activeTab==='otros' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div><label className={PAR_LBL}>Plazo pago oportuno</label><input value={form.plazoPagoOp} onChange={e=>sf('plazoPagoOp',e.target.value)} className={`w-full ${PAR_INP}`}/></div>
                <div><label className={PAR_LBL}>% de multa pago oportuno</label><input value={form.multaPagoOp} onChange={e=>sf('multaPagoOp',e.target.value)} className={`w-full ${PAR_INP}`}/></div>
                <div><label className={PAR_LBL}>% de interés pago oportuno</label><input value={form.interesPagoOp} onChange={e=>sf('interesPagoOp',e.target.value)} className={`w-full ${PAR_INP}`}/></div>
                <ParCC label="Centro de costo de pago oportuno" value={form.ccPagoOp} onChange={v=>sf('ccPagoOp',v)} clearable/>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ParCC label="Servicio de Multa Pago Oportuno" value={form.srvMultaPagoOp} onChange={v=>sf('srvMultaPagoOp',v)} clearable/>
                <ParCC label="Servicio de interés pago oportuno" value={form.srvInteresPagoOp} onChange={v=>sf('srvInteresPagoOp',v)} clearable/>
                <ParCC label="Servicio de multa exenta pago oportuno" value={form.srvMultaExentaPagoOp} onChange={v=>sf('srvMultaExentaPagoOp',v)} clearable/>
                <ParCC label="Servicio de interés exento pago oportuno" value={form.srvInteresExentoPagoOp} onChange={v=>sf('srvInteresExentoPagoOp',v)} clearable/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div><label className={PAR_LBL}>% de flete en DIN</label><input value={form.fleteEnDIN} onChange={e=>sf('fleteEnDIN',e.target.value)} className={`w-full ${PAR_INP}`}/></div>
                <div><label className={PAR_LBL}>% de seguro en DIN</label><input value={form.seguroEnDIN} onChange={e=>sf('seguroEnDIN',e.target.value)} className={`w-full ${PAR_INP}`}/></div>
                <div><label className={PAR_LBL}>Unidad de peso</label><input value={form.unidadPeso} onChange={e=>sf('unidadPeso',e.target.value)} className={`w-full ${PAR_INP}`}/></div>
                <div><label className={PAR_LBL}>Unidad de volumen</label><input value={form.unidadVolumen} onChange={e=>sf('unidadVolumen',e.target.value)} className={`w-full ${PAR_INP}`}/></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label className={PAR_LBL}>Texto de tag A2</label><input value={form.tagA2} onChange={e=>sf('tagA2',e.target.value)} className={`w-full ${PAR_INP}`}/></div>
                <div><label className={PAR_LBL}>Texto de tag A55</label><input value={form.tagA55} onChange={e=>sf('tagA55',e.target.value)} className={`w-full ${PAR_INP}`}/></div>
                <div><label className={PAR_LBL}>Texto de tag A56</label><input value={form.tagA56} onChange={e=>sf('tagA56',e.target.value)} className={`w-full ${PAR_INP}`}/></div>
              </div>
              <ParSaveBtn onClick={save}/>
            </div>
          )}

          {/* ── NOMBRE DE CAMPOS ── */}
          {activeTab==='nombre-campos' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[['nFamilia','Familia (familias)'],['nSubfamilia','Subfamilia (subfamilias)'],['nMarca','Marca (marcas)'],['nOrigen','Origen (orígenes)'],
                  ['nConcepto1','Concepto 1 (conceptos1)'],['nConcepto2','Concepto 2 (conceptos2)'],['nConcepto3','Concepto 3 (conceptos3)'],['nConcepto4','Concepto 4 (conceptos4)'],
                  ['nProdCaract1','Producto característica 1'],['nProdCaract2','Producto característica 2'],
                  ['nProdTexto1','Producto texto 1'],['nProdTexto2','Producto texto 2'],['nProdTexto3','Producto texto 3'],
                  ['nCLProvCaract1','Cliente/Prov característica 1'],['nCLProvCaract2','Cliente/Prov característica 2'],
                  ['nCLProvTexto1','Cliente/Prov texto 1'],['nCLProvTexto2','Cliente/Prov texto 2'],
                ].map(([k,lbl]) => (
                  <div key={k}><label className={PAR_LBL}>{lbl}</label><input value={form[k]||''} onChange={e=>sf(k,e.target.value)} className={`w-full ${PAR_INP}`}/></div>
                ))}
              </div>
              <ParSaveBtn onClick={save}/>
            </div>
          )}

          {/* ── PLACEHOLDERS ── */}
          {(activeTab==='proyecto'||activeTab==='probabilidad'||activeTab==='api') && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center"><Wrench size={28} className="text-slate-400"/></div>
              <p className="text-slate-500 font-semibold">Próximamente</p>
              <p className="text-slate-400 text-sm">Esta sección estará disponible en una versión próxima.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// --- CONTABILIDAD: COMPROBANTES ---
const accountingDate = () => new Date().toISOString().split('T')[0];
const toAmount = (value) => Number(String(value || 0).replace(/\./g, '').replace(',', '.')) || 0;
const money = (value) => Number(value || 0).toLocaleString('es-CL');

const emptyVoucherLine = (index = 1) => ({
  id: globalThis.crypto?.randomUUID?.() || `line-${Date.now()}-${index}`,
  numeroDetalle: index,
  cuentaContable: '',
  centroCosto: '',
  glosa: '',
  auxiliar: '',
  tipoDocumento: '',
  numeroDocumento: '',
  fechaDocumento: accountingDate(),
  debe: '',
  haber: '',
});

const emptyVoucher = (nextNumber = 1) => ({
  id: '',
  tipoContabilidad: 'Ambas',
  tipoComprobante: 'Traspaso',
  numero: String(nextNumber).padStart(4, '0'),
  unidadNegocio: 'Casa Matriz',
  fecha: accountingDate(),
  documento: '',
  glosa: '',
  estado: 'Borrador',
  detalles: [],
});

const ComprobantesContables = () => {
  const { comprobantes, setComprobantes, planCuentas, tipoDocumentos } = useContext(ERPContext);
  const fileInputRef = useRef(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('Todos');
  const [mode, setMode] = useState('list');
  const [draft, setDraft] = useState(() => emptyVoucher());
  const [lineDraft, setLineDraft] = useState(() => emptyVoucherLine(1));
  const [notice, setNotice] = useState('');

  const nextNumber = () => {
    const max = comprobantes.reduce((acc, item) => Math.max(acc, Number(item.numero) || 0), 0);
    return max + 1;
  };

  const totals = (draft.detalles || []).reduce((acc, item) => ({
    debe: acc.debe + toAmount(item.debe),
    haber: acc.haber + toAmount(item.haber),
  }), { debe: 0, haber: 0 });

  const filtered = comprobantes.filter(item => {
    const haystack = [item.tipoComprobante, item.numero, item.fecha, item.documento, item.glosa, item.estado].join(' ').toLowerCase();
    return haystack.includes(search.trim().toLowerCase()) && (filterType === 'Todos' || item.tipoComprobante === filterType);
  });

  const openNew = () => {
    const next = emptyVoucher(nextNumber());
    setDraft(next);
    setLineDraft(emptyVoucherLine(1));
    setMode('edit');
    setNotice('');
  };

  const openVoucher = (voucher, nextMode = 'view') => {
    const normalized = {
      ...emptyVoucher(),
      ...voucher,
      detalles: (voucher.detalles || []).map((item, index) => ({ ...emptyVoucherLine(index + 1), ...item, numeroDetalle: index + 1 })),
    };
    setDraft(normalized);
    setLineDraft(emptyVoucherLine((normalized.detalles || []).length + 1));
    setMode(nextMode);
    setNotice('');
  };

  const updateDraft = (field, value) => setDraft(prev => ({ ...prev, [field]: value }));
  const updateLine = (field, value) => setLineDraft(prev => ({ ...prev, [field]: value }));

  const addLine = () => {
    const index = (draft.detalles || []).length + 1;
    const nextLine = { ...lineDraft, id: lineDraft.id || `line-${Date.now()}`, numeroDetalle: index, glosa: lineDraft.glosa || draft.glosa };
    setDraft(prev => ({ ...prev, detalles: [...(prev.detalles || []), nextLine] }));
    setLineDraft(emptyVoucherLine(index + 1));
    setNotice('Linea agregada al comprobante.');
  };

  const removeLine = (lineId) => {
    setDraft(prev => ({
      ...prev,
      detalles: (prev.detalles || []).filter(item => item.id !== lineId).map((item, index) => ({ ...item, numeroDetalle: index + 1 })),
    }));
  };

  const saveVoucher = (nextState = draft.estado) => {
    const detailDebe = (draft.detalles || []).reduce((sum, item) => sum + toAmount(item.debe), 0);
    const payload = {
      ...draft,
      id: draft.id || `comp-${Date.now()}`,
      numero: draft.numero || String(nextNumber()).padStart(4, '0'),
      documento: draft.documento || `${String(draft.tipoComprobante || '').toUpperCase()}-${draft.numero}`,
      estado: nextState,
      debe: detailDebe,
      detalles: (draft.detalles || []).map((item, index) => ({ ...item, numeroDetalle: index + 1 })),
    };
    setComprobantes(prev => prev.some(item => item.id === payload.id) ? prev.map(item => item.id === payload.id ? payload : item) : [payload, ...prev]);
    setDraft(payload);
    setNotice(nextState === 'Contabilizado' ? 'Comprobante contabilizado.' : 'Comprobante guardado.');
    return payload;
  };

  const saveAndExit = () => {
    saveVoucher();
    setMode('list');
  };

  const deleteVoucher = (voucher) => {
    if (!window.confirm(`Eliminar comprobante ${voucher.numero}?`)) return;
    setComprobantes(prev => prev.filter(item => item.id !== voucher.id));
  };

  const handleExcel = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    const keyFor = (row, names) => {
      const keys = Object.keys(row);
      const found = keys.find(key => names.some(name => key.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(name)));
      return found ? row[found] : '';
    };
    const start = nextNumber();
    const imported = rows.map((row, index) => {
      const tipo = keyFor(row, ['tipo de comprobante', 'tipo comprobante', 'tipo']) || 'Traspaso';
      const numero = keyFor(row, ['numero de comprobante', 'nro comprobante', 'numero']) || String(start + index).padStart(4, '0');
      const fecha = keyFor(row, ['fecha']) || accountingDate();
      const documento = keyFor(row, ['documento', 'doc']) || `${tipo}-${numero}`;
      const glosa = keyFor(row, ['glosa', 'descripcion']) || 'Carga masiva Excel';
      const debe = toAmount(keyFor(row, ['debe']));
      const haber = toAmount(keyFor(row, ['haber']));
      return {
        ...emptyVoucher(start + index),
        id: `comp-xlsx-${Date.now()}-${index}`,
        tipoComprobante: tipo,
        numero: String(numero),
        fecha: String(fecha).slice(0, 10),
        documento,
        glosa,
        estado: keyFor(row, ['estado']) || 'Importado',
        debe,
        detalles: [{
          ...emptyVoucherLine(1),
          cuentaContable: keyFor(row, ['cuenta contable', 'cuenta']),
          centroCosto: keyFor(row, ['centro de costo', 'centro costo']),
          glosa,
          tipoDocumento: keyFor(row, ['tipo documento']),
          numeroDocumento: keyFor(row, ['numero documento', 'numero doc']),
          fechaDocumento: String(fecha).slice(0, 10),
          debe,
          haber,
        }],
      };
    });
    setComprobantes(prev => [...imported, ...prev]);
    setNotice(`${imported.length} comprobantes importados desde Excel.`);
    event.target.value = '';
  };

  const readOnly = mode === 'view';
  const balanceDiff = totals.debe - totals.haber;

  if (mode !== 'list') {
    return (
      <div className="w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Contabilidad / Comprobantes</p>
            <h2 className="text-2xl font-black text-slate-900">{readOnly ? 'Ver comprobante contable' : 'Nuevo comprobante contable'}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {readOnly && <Button variant="secondary" icon={Pencil} onClick={() => setMode('edit')}>Editar</Button>}
            <Button variant="secondary" icon={X} onClick={() => setMode('list')}>Cerrar</Button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 md:p-6 space-y-5">
          <div className="flex gap-6 border-b border-slate-100">
            <button className="pb-3 text-sm font-bold text-blue-700 border-b-2 border-blue-600">Encabezado</button>
            <button className="pb-3 text-sm text-slate-400">Detalle</button>
            <button className="pb-3 text-sm text-slate-400">Documentos adjuntos</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Tipo contabilidad</span><select disabled={readOnly} value={draft.tipoContabilidad} onChange={e => updateDraft('tipoContabilidad', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option>PCGA</option><option>IFRS</option><option>Ambas</option></select></label>
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Tipo de comprobante</span><select disabled={readOnly} value={draft.tipoComprobante} onChange={e => updateDraft('tipoComprobante', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option>Apertura</option><option>Egreso</option><option>Ingreso</option><option>Traspaso</option></select></label>
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Unidad de negocio</span><input disabled={readOnly} value={draft.unidadNegocio} onChange={e => updateDraft('unidadNegocio', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Fecha contable</span><input type="date" disabled={readOnly} value={draft.fecha} onChange={e => updateDraft('fecha', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
            <label className="md:col-span-2 xl:col-span-4 space-y-1"><span className="text-xs font-semibold text-slate-600">Glosa</span><textarea disabled={readOnly} value={draft.glosa} onChange={e => updateDraft('glosa', e.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none" /></label>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 md:p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Numero de detalle</span><input disabled value={(draft.detalles || []).length + 1} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
            <label className="md:col-span-2 space-y-1"><span className="text-xs font-semibold text-slate-600">Cuenta contable</span><input disabled={readOnly} list="cuentas-contables" value={lineDraft.cuentaContable} onChange={e => updateLine('cuentaContable', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /><datalist id="cuentas-contables">{planCuentas.map(c => <option key={c.id || c.codigo || c.nombre} value={`${c.codigo || ''} ${c.nombre || c.name || ''}`} />)}</datalist></label>
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Centro de costo</span><select disabled={readOnly} value={lineDraft.centroCosto} onChange={e => updateLine('centroCosto', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">Seleccionar</option><option>Administracion</option><option>Operaciones</option><option>Ventas</option><option>Casa Matriz</option></select></label>
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Debe</span><input disabled={readOnly} inputMode="numeric" value={lineDraft.debe} onChange={e => updateLine('debe', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Haber</span><input disabled={readOnly} inputMode="numeric" value={lineDraft.haber} onChange={e => updateLine('haber', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <label className="md:col-span-2 space-y-1"><span className="text-xs font-semibold text-slate-600">Glosa linea</span><input disabled={readOnly} value={lineDraft.glosa} onChange={e => updateLine('glosa', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Auxiliar</span><input disabled={readOnly} value={lineDraft.auxiliar} onChange={e => updateLine('auxiliar', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Tipo documento</span><input disabled={readOnly} list="tipo-documentos-contables" value={lineDraft.tipoDocumento} onChange={e => updateLine('tipoDocumento', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /><datalist id="tipo-documentos-contables">{tipoDocumentos.map(d => <option key={d.id || d.codigo || d.nombre} value={d.nombre || d.name || d.codigo} />)}</datalist></label>
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Numero documento</span><input disabled={readOnly} value={lineDraft.numeroDocumento} onChange={e => updateLine('numeroDocumento', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Fecha documento</span><input type="date" disabled={readOnly} value={lineDraft.fechaDocumento} onChange={e => updateLine('fechaDocumento', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
          </div>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-wrap gap-2">{!readOnly && <Button variant="accent" icon={CheckCircle2} onClick={addLine}>Guardar linea</Button>}{!readOnly && <Button variant="primary" icon={FileText} onClick={saveAndExit}>Guardar y salir</Button>}<Button variant="secondary" icon={ClipboardList} onClick={() => setNotice('No hay documentos pendientes asociados.')}>Docs. pendientes</Button></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 min-w-0">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-[10px] font-black uppercase text-slate-400">Debe</p><p className="text-lg font-black text-slate-900">{money(totals.debe)}</p></div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-[10px] font-black uppercase text-slate-400">Haber</p><p className="text-lg font-black text-slate-900">{money(totals.haber)}</p></div>
              <Button disabled={readOnly || totals.debe <= 0 || balanceDiff !== 0} variant="accent" icon={CheckCircle} onClick={() => saveVoucher('Contabilizado')}>Contabilizar</Button>
            </div>
          </div>
          {notice && <div className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">{notice}</div>}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-[10px] uppercase text-slate-400"><tr><th className="p-3 text-left">N</th><th className="p-3 text-left">Cuenta contable</th><th className="p-3 text-left">Centro costo</th><th className="p-3 text-left">Documento</th><th className="p-3 text-left">Auxiliar</th><th className="p-3 text-left">Glosa</th><th className="p-3 text-right">Debe</th><th className="p-3 text-right">Haber</th><th className="p-3"></th></tr></thead><tbody>
            {(draft.detalles || []).map(item => (<tr key={item.id} className="border-t border-slate-100"><td className="p-3 font-mono">{item.numeroDetalle}</td><td className="p-3">{item.cuentaContable || '-'}</td><td className="p-3">{item.centroCosto || '-'}</td><td className="p-3">{[item.tipoDocumento, item.numeroDocumento].filter(Boolean).join(' ') || '-'}</td><td className="p-3">{item.auxiliar || '-'}</td><td className="p-3 max-w-xs truncate">{item.glosa || '-'}</td><td className="p-3 text-right font-mono">{money(item.debe)}</td><td className="p-3 text-right font-mono">{money(item.haber)}</td><td className="p-3 text-right">{!readOnly && <button onClick={() => removeLine(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Eliminar linea"><Trash2 size={15}/></button>}</td></tr>))}
            {(!draft.detalles || draft.detalles.length === 0) && (<tr><td colSpan="9" className="p-8 text-center text-sm text-slate-400">Agrega lineas para construir el comprobante.</td></tr>)}
          </tbody></table></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Finanzas / Comprobantes contables</p><h2 className="text-2xl font-black text-slate-900">Comprobantes contables</h2></div>
        <div className="flex flex-wrap gap-2"><input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleExcel} className="hidden" /><Button variant="secondary" icon={Upload} onClick={() => fileInputRef.current?.click()}>Carga Excel</Button><Button variant="accent" icon={Plus} onClick={openNew}>Ingreso manual</Button></div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="p-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-[180px_1fr_auto] gap-3"><select value={filterType} onChange={e => setFilterType(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm"><option>Todos</option><option>Apertura</option><option>Egreso</option><option>Ingreso</option><option>Traspaso</option></select><div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar" className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div><Button variant="secondary" icon={Download} onClick={() => setNotice('Exportacion preparada desde la tabla visible.')}>Exportar</Button></div>
        {notice && <div className="mx-4 mt-4 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">{notice}</div>}
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-[10px] uppercase text-slate-400 border-b border-slate-100"><tr><th className="p-3 text-left w-12"></th><th className="p-3 text-left">Tipo</th><th className="p-3 text-left">Numero</th><th className="p-3 text-left">Fecha</th><th className="p-3 text-left">Doc</th><th className="p-3 text-left">Glosa</th><th className="p-3 text-right">Debe</th><th className="p-3 text-left">Estado</th><th className="p-3 text-right">Acciones</th></tr></thead><tbody>
          {filtered.map(item => (<tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="p-3"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-lime-50 text-lime-700"><Eye size={14}/></span></td><td className="p-3 font-medium">{item.tipoComprobante}</td><td className="p-3 font-mono">{item.numero}</td><td className="p-3 font-mono text-xs">{item.fecha}</td><td className="p-3 text-blue-600 font-semibold">{item.documento || '-'}</td><td className="p-3 max-w-sm truncate">{item.glosa || '-'}</td><td className="p-3 text-right font-mono">{money(item.debe)}</td><td className="p-3"><span className={`text-xs font-bold ${item.estado === 'Contabilizado' ? 'text-emerald-600' : 'text-amber-600'}`}>{item.estado}</span></td><td className="p-3 text-right whitespace-nowrap"><button onClick={() => openVoucher(item, 'view')} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50" title="Ver comprobante"><Eye size={15}/></button><button onClick={() => openVoucher(item, 'edit')} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100" title="Editar comprobante"><Pencil size={15}/></button><button onClick={() => deleteVoucher(item)} className="p-2 rounded-lg text-red-500 hover:bg-red-50" title="Eliminar comprobante"><Trash2 size={15}/></button></td></tr>))}
          {filtered.length === 0 && (<tr><td colSpan="9" className="p-10 text-center text-sm text-slate-400">No hay comprobantes para mostrar.</td></tr>)}
        </tbody></table></div>
        <div className="px-4 py-3 text-xs text-slate-400 border-t border-slate-100 flex justify-between"><span>Mostrando registros del 1 al {filtered.length} de un total de {comprobantes.length}.</span><span>Filas por pagina 100</span></div>
      </div>
    </div>
  );
};

// --- CONFIGURACIONES: MÓDULOS PLACEHOLDER ---
const formatJournalDate = (value) => {
  if (!value) return '';
  const [date] = String(value).split('T');
  const parts = date.includes('-') ? date.split('-') : date.split('/');
  if (parts.length !== 3) return String(value);
  return date.includes('-') ? `${parts[2]}/${parts[1]}/${parts[0]}` : String(value);
};

const dateInRange = (value, from, to) => {
  const current = new Date(value);
  if (Number.isNaN(current.getTime())) return true;
  if (from && current < new Date(`${from}T00:00:00`)) return false;
  if (to && current > new Date(`${to}T23:59:59`)) return false;
  return true;
};

const voucherCode = (voucher) => {
  const prefix = { Apertura: 'A', Egreso: 'E', Ingreso: 'I', Traspaso: 'T' }[voucher.tipoComprobante] || 'T';
  return `${prefix} - ${voucher.numero || ''}`.trim();
};

const splitAccount = (value = '') => {
  const text = String(value || '').trim();
  const match = text.match(/^([0-9.\-]+)\s+(.+)$/);
  return { code: match ? match[1] : text, name: match ? match[2] : '' };
};

const buildLibroDiarioRows = (comprobantes = [], filters = {}) => {
  const filtered = comprobantes
    .filter(v => filters.tipo === 'Todos' || (filters.tipo === 'Borrador' ? v.estado === 'Borrador' : v.tipoComprobante === filters.tipo))
    .filter(v => filters.tipoContabilidad === 'Todas' || v.tipoContabilidad === filters.tipoContabilidad || v.tipoContabilidad === 'Ambas')
    .filter(v => filters.unidadNegocio === 'Todas' || v.unidadNegocio === filters.unidadNegocio)
    .filter(v => filters.showAnulados || String(v.estado || '').toLowerCase() !== 'anulado')
    .filter(v => dateInRange(v.fecha, filters.fechaDesde, filters.fechaHasta))
    .sort((a, b) => String(a.fecha || '').localeCompare(String(b.fecha || '')) || String(a.numero || '').localeCompare(String(b.numero || '')));

  return filtered.flatMap(voucher => {
    const lines = (voucher.detalles || []).map(line => {
      const account = splitAccount(line.cuentaContable);
      const doc = [line.tipoDocumento, line.numeroDocumento].filter(Boolean).join(' - ') || voucher.documento || '';
      return {
        Fecha: formatJournalDate(voucher.fecha),
        Comprobante: voucherCode(voucher),
        'Cod. Cta. Contable': account.code,
        'Cuenta Contable': account.name,
        Glosa: line.glosa || voucher.glosa || '',
        'Documento Asociado': doc,
        Debe: toAmount(line.debe),
        Haber: toAmount(line.haber),
        voucherId: voucher.id,
      };
    });
    const total = lines.reduce((acc, row) => ({ Debe: acc.Debe + row.Debe, Haber: acc.Haber + row.Haber }), { Debe: 0, Haber: 0 });
    return [...lines, {
      Fecha: formatJournalDate(voucher.fecha),
      Comprobante: '',
      'Cod. Cta. Contable': '',
      'Cuenta Contable': '',
      Glosa: `Total ${voucher.documento || voucherCode(voucher)}`,
      'Documento Asociado': '',
      Debe: total.Debe,
      Haber: total.Haber,
      voucherId: voucher.id,
      isTotal: true,
    }];
  });
};

const buildLibroDiarioHtml = (rows, filters) => {
  const body = rows.map(row => `<tr class="${row.isTotal ? 'total' : ''}">
    <td>${row.Fecha}</td><td>${row.Comprobante}</td><td>${row['Cod. Cta. Contable']}</td><td>${row['Cuenta Contable']}</td>
    <td>${htmlText(row.Glosa)}</td><td>${htmlText(row['Documento Asociado'])}</td>
    <td class="num">${money(row.Debe)}</td><td class="num">${money(row.Haber)}</td>
  </tr>`).join('');
  const totals = rows.filter(r => !r.isTotal).reduce((acc, row) => ({ debe: acc.debe + row.Debe, haber: acc.haber + row.Haber }), { debe: 0, haber: 0 });
  return `<html><head><title>Finanzas_libro_diario</title><style>
    body{font-family:Arial,sans-serif;color:#111827;padding:24px}.top{display:flex;justify-content:space-between;border-bottom:2px solid #1f2937;padding-bottom:12px;margin-bottom:16px}
    h1{font-size:20px;margin:0}.meta{font-size:11px;color:#475569;margin-top:4px}.totals{font-size:12px;text-align:right}
    table{width:100%;border-collapse:collapse}th,td{border:1px solid #cbd5e1;padding:6px;font-size:10px;vertical-align:top}th{background:#e5e7eb;text-transform:uppercase}.num{text-align:right}.total td{background:#f8fafc;font-weight:700}
    @media print{button{display:none}body{padding:0}}
  </style></head><body>
    <button onclick="window.print()" style="margin-bottom:14px;padding:8px 14px;border:0;background:#1f5b93;color:white;border-radius:8px;font-weight:700">Descargar PDF</button>
    <div class="top"><div><h1>Libro Diario</h1><div class="meta">Tipo: ${filters.tipo} | Contabilidad: ${filters.tipoContabilidad} | Unidad: ${filters.unidadNegocio}</div><div class="meta">Periodo: ${formatJournalDate(filters.fechaDesde)} al ${formatJournalDate(filters.fechaHasta)}</div></div><div class="totals"><b>Debe:</b> ${money(totals.debe)}<br/><b>Haber:</b> ${money(totals.haber)}</div></div>
    <table><thead><tr><th>Fecha</th><th>Comprobante</th><th>Cod. Cta. Contable</th><th>Cuenta Contable</th><th>Glosa</th><th>Documento Asociado</th><th>Debe</th><th>Haber</th></tr></thead><tbody>${body}</tbody></table>
  </body></html>`;
};

const buildLibroMayorRows = (comprobantes = [], filters = {}) => {
  const accountOptions = Array.from(new Set(comprobantes.flatMap(v => (v.detalles || []).map(line => line.cuentaContable).filter(Boolean))))
    .map(splitAccount)
    .filter(account => account.code)
    .sort((a, b) => String(a.code).localeCompare(String(b.code)));
  const accountFrom = filters.cuentaDesde || accountOptions[0]?.code || '';
  const accountTo = filters.cuentaHasta || accountOptions[accountOptions.length - 1]?.code || '';
  const balances = {};

  return comprobantes
    .filter(v => dateInRange(v.fecha, filters.fechaDesde, filters.fechaHasta))
    .filter(v => filters.showAnulados || String(v.estado || '').toLowerCase() !== 'anulado')
    .flatMap(voucher => (voucher.detalles || []).map(line => ({ voucher, line, account: splitAccount(line.cuentaContable) })))
    .filter(item => !accountFrom || String(item.account.code).localeCompare(String(accountFrom)) >= 0)
    .filter(item => !accountTo || String(item.account.code).localeCompare(String(accountTo)) <= 0)
    .sort((a, b) =>
      String(a.account.code).localeCompare(String(b.account.code)) ||
      String(a.voucher.fecha || '').localeCompare(String(b.voucher.fecha || '')) ||
      String(a.voucher.numero || '').localeCompare(String(b.voucher.numero || ''))
    )
    .map(({ voucher, line, account }) => {
      const code = account.code || 'Sin cuenta';
      balances[code] = (balances[code] || 0) + toAmount(line.debe) - toAmount(line.haber);
      const docParts = [line.tipoDocumento, line.numeroDocumento].filter(Boolean);
      return {
        'Cuenta contable': code,
        'Nombre cuenta contable': account.name || code,
        Fecha: formatJournalDate(voucher.fecha),
        Comprobante: voucherCode(voucher),
        Glosa: voucher.glosa || line.glosa || '',
        'Glosa comprobante detalle': line.glosa || voucher.glosa || '',
        'Tipo documento': line.tipoDocumento || '',
        'Número documento': line.numeroDocumento || '',
        Debe: toAmount(line.debe),
        Haber: toAmount(line.haber),
        Saldo: balances[code],
        'Centro de costo': line.centroCosto || '',
        RUT: '',
        'Nombre/Razón social': line.auxiliar || '',
        'Fecha documento': formatJournalDate(line.fechaDocumento || voucher.fecha),
        'Fecha vencimiento': '',
        'Concepto 1': '',
        'Concepto 2': '',
        'Concepto 3': '',
        'Concepto 4': '',
        Documento: docParts.join(' - ') || voucher.documento || 'Sin documento',
      };
    });
};

const buildLibroMayorHtml = (rows, filters) => {
  const body = rows.map(row => `<tr>
    <td>${row.Fecha}</td><td>${row.Comprobante}</td><td>${htmlText(row.Glosa)}</td><td>${htmlText(row.Documento)}</td>
    <td>${htmlText(row['Nombre/Razón social'])}</td><td>${htmlText(row['Centro de costo'])}</td>
    <td class="num">${money(row.Debe)}</td><td class="num">${money(row.Haber)}</td><td class="num">${money(row.Saldo)}</td>
  </tr>`).join('');
  const totals = rows.reduce((acc, row) => ({ debe: acc.debe + row.Debe, haber: acc.haber + row.Haber }), { debe: 0, haber: 0 });
  return `<html><head><title>VAICMEDICAL SPA_libro_mayor</title><style>
    body{font-family:Arial,sans-serif;color:#111827;padding:24px}.top{border-bottom:2px solid #1f2937;padding-bottom:12px;margin-bottom:16px}
    h1{font-size:20px;margin:0}.meta{font-size:11px;color:#475569;margin-top:4px}.summary{float:right;text-align:right;font-size:12px}
    table{width:100%;border-collapse:collapse;clear:both}th,td{border:1px solid #cbd5e1;padding:6px;font-size:10px;vertical-align:top}th{background:#e5e7eb;text-transform:uppercase}.num{text-align:right}
    @media print{button{display:none}body{padding:0}}
  </style></head><body>
    <button onclick="window.print()" style="margin-bottom:14px;padding:8px 14px;border:0;background:#1f5b93;color:white;border-radius:8px;font-weight:700">Descargar PDF</button>
    <div class="top"><div class="summary"><b>Debe:</b> ${money(totals.debe)}<br/><b>Haber:</b> ${money(totals.haber)}</div><h1>Libro Mayor</h1><div class="meta">VAICMEDICAL SPA | RUT 77573229-6 | ${filters.tipoInforme}</div><div class="meta">Periodo: ${formatJournalDate(filters.fechaDesde)} al ${formatJournalDate(filters.fechaHasta)} | Cuentas: ${filters.cuentaDesde || 'Inicio'} a ${filters.cuentaHasta || 'Fin'}</div></div>
    <table><thead><tr><th>Fecha</th><th>Comprobante</th><th>Glosa</th><th>Documento</th><th>Nombre/Razón social</th><th>Centro de costo</th><th>Debe</th><th>Haber</th><th>Saldo</th></tr></thead><tbody>${body}</tbody></table>
  </body></html>`;
};

const purchaseDocCode = (tipoDocumento = '') => {
  const text = String(tipoDocumento || '').toLowerCase();
  if (/^\d+$/.test(String(tipoDocumento || '').trim())) return String(tipoDocumento).trim();
  if (text.includes('exenta') || text.includes('exento')) return '34';
  if (text.includes('credito') || text.includes('crédito')) return '61';
  if (text.includes('debito') || text.includes('débito')) return '56';
  if (text.includes('factura')) return '33';
  return String(tipoDocumento || '').trim();
};

const purchaseDocType = (tipoDocumento = '') => {
  const code = purchaseDocCode(tipoDocumento);
  const map = { '33': 'FACE', '34': 'FCEE', '56': 'NDE', '61': 'NCE', '914': 'DIN' };
  return map[code] || String(tipoDocumento || 'DOC').trim();
};

const purchaseDocLabel = (row = {}) => [purchaseDocType(row.tipoDocumento), row.folio].filter(Boolean).join('-');

const buildLibroCompraRows = (registroCompras = [], filters = {}) => {
  const grouped = registroCompras
    .filter(row => filters.unidadNegocio === 'Todas' || !filters.unidadNegocio || row.unidadNegocio === filters.unidadNegocio)
    .filter(row => filters.showAnulados || String(row.estado || '').toLowerCase() !== 'anulado')
    .filter(row => dateInRange(row.fechaEmision, filters.fechaDesde, filters.fechaHasta))
    .sort((a, b) =>
      String(a.fechaEmision || '').localeCompare(String(b.fechaEmision || '')) ||
      String(a.folio || '').localeCompare(String(b.folio || ''))
    );

  return grouped.map((row, index) => ({
    Fecha: formatJournalDate(row.fechaEmision),
    'Codigo doc': purchaseDocCode(row.tipoDocumento),
    Interno: row.interno || row.numeroInterno || String(index + 1).padStart(2, '0'),
    Documento: purchaseDocLabel(row),
    Proveedor: [row.rutProveedor, row.razonSocial].filter(Boolean).join(' '),
    Neto: toAmount(row.montoNeto),
    Exento: toAmount(row.montoExento),
    IVA: toAmount(row.montoIvaRecuperable),
    Total: toAmount(row.total),
    'Unidad de negocio': row.unidadNegocio || '',
    Empresa: row.empresa || '',
    'Tipo doc.': purchaseDocType(row.tipoDocumento),
    'Num. doc.': row.folio || '',
    'RUT proveedor': row.rutProveedor || '',
    RUT: row.rutProveedor || '',
    'Razon social': row.razonSocial || '',
    'Razón social': row.razonSocial || '',
    voucherId: row.voucherId || '',
  }));
};

const buildLibroCompraHtml = (rows, filters, empresa = {}) => {
  const totals = rows.reduce((acc, row) => ({
    neto: acc.neto + row.Neto,
    exento: acc.exento + row.Exento,
    iva: acc.iva + row.IVA,
    total: acc.total + row.Total,
  }), { neto: 0, exento: 0, iva: 0, total: 0 });
  const body = rows.map(row => `<tr>
    <td>${row.Fecha}</td><td>${row['Codigo doc']}</td><td>${row.Interno}</td><td>${htmlText(row.Documento)}</td>
    <td>${htmlText(row.Proveedor)}</td><td class="num">${money(row.Neto)}</td><td class="num">${money(row.Exento)}</td>
    <td class="num">${money(row.IVA)}</td><td class="num">${money(row.Total)}</td>
  </tr>`).join('');
  return `<html><head><title>Informe_finanzas_libro_compra</title><style>
    body{font-family:Arial,sans-serif;color:#111827;padding:24px}.top{display:flex;justify-content:space-between;border-bottom:2px solid #1f2937;padding-bottom:12px;margin-bottom:16px}
    h1{font-size:20px;margin:0}.meta{font-size:11px;color:#475569;margin-top:4px}.summary{text-align:right;font-size:12px}
    table{width:100%;border-collapse:collapse}th,td{border:1px solid #cbd5e1;padding:6px;font-size:10px;vertical-align:top}th{background:#e5e7eb;text-transform:uppercase}.num{text-align:right}.total td{background:#f8fafc;font-weight:700}
    @media print{button{display:none}body{padding:0}}
  </style></head><body>
    <button onclick="window.print()" style="margin-bottom:14px;padding:8px 14px;border:0;background:#1f5b93;color:white;border-radius:8px;font-weight:700">Descargar PDF</button>
    <div class="top"><div><h1>Libro Compra</h1><div class="meta">${htmlText(empresa.razonSocial || 'Empresa')} | RUT ${htmlText(empresa.rut || '')}</div><div class="meta">Periodo: ${formatJournalDate(filters.fechaDesde)} al ${formatJournalDate(filters.fechaHasta)} | Unidad: ${filters.unidadNegocio || 'Todas'}</div></div><div class="summary"><b>Neto:</b> ${money(totals.neto)}<br/><b>Exento:</b> ${money(totals.exento)}<br/><b>IVA:</b> ${money(totals.iva)}<br/><b>Total:</b> ${money(totals.total)}</div></div>
    <table><thead><tr><th>Fecha</th><th>Codigo doc</th><th>Interno</th><th>Documento</th><th>Proveedor</th><th>Neto</th><th>Exento</th><th>IVA</th><th>Total</th></tr></thead><tbody>${body}<tr class="total"><td colspan="5">Total</td><td class="num">${money(totals.neto)}</td><td class="num">${money(totals.exento)}</td><td class="num">${money(totals.iva)}</td><td class="num">${money(totals.total)}</td></tr></tbody></table>
  </body></html>`;
};

const InformesTributarios = () => {
  const { comprobantes, registroCompras, currentEmpresa } = useContext(ERPContext);
  const accountOptions = Array.from(new Set(comprobantes.flatMap(v => (v.detalles || []).map(line => line.cuentaContable).filter(Boolean))))
    .map(splitAccount)
    .filter(account => account.code)
    .sort((a, b) => String(a.code).localeCompare(String(b.code)));
  const [activeTaxTab, setActiveTaxTab] = useState('Libro diario');
  const [filters, setFilters] = useState({
    tipo: 'Todos',
    fechaDesde: `${new Date().getFullYear()}-01-01`,
    fechaHasta: accountingDate(),
    tipoContabilidad: 'PCGA',
    unidadNegocio: 'Todas',
    showAnulados: false,
    tipoInforme: 'General',
    cuentaDesde: '',
    cuentaHasta: '',
  });
  const [rows, setRows] = useState([]);
  const [generated, setGenerated] = useState(false);
  const [search, setSearch] = useState('');

  const units = Array.from(new Set([
    ...comprobantes.map(v => v.unidadNegocio || 'Casa Matriz'),
    ...registroCompras.map(row => row.unidadNegocio || 'Casa Matriz'),
  ])).filter(Boolean);
  const previewRows = rows.filter(row => Object.values(row).join(' ').toLowerCase().includes(search.toLowerCase()));
  const totals = rows.filter(r => !r.isTotal).reduce((acc, row) => ({
    debe: acc.debe + toAmount(row.Debe),
    haber: acc.haber + toAmount(row.Haber),
    neto: acc.neto + toAmount(row.Neto),
    exento: acc.exento + toAmount(row.Exento),
    iva: acc.iva + toAmount(row.IVA),
    total: acc.total + toAmount(row.Total),
  }), { debe: 0, haber: 0, neto: 0, exento: 0, iva: 0, total: 0 });
  const updateFilter = (field, value) => setFilters(prev => ({ ...prev, [field]: value }));
  const isLibroMayor = activeTaxTab === 'Libro mayor';
  const isLibroCompra = activeTaxTab === 'Libro de compra';

  const generate = () => {
    setRows(isLibroCompra ? buildLibroCompraRows(registroCompras, filters) : isLibroMayor ? buildLibroMayorRows(comprobantes, filters) : buildLibroDiarioRows(comprobantes, filters));
    setGenerated(true);
  };

  const downloadExcel = () => {
    if (isLibroCompra) {
      const header = ['Fecha', 'Código doc. ', 'Num. Interno', 'Documento', 'Proveedor', 'Neto', 'Exento', 'IVA', 'Total', 'Empresa', 'Tipo doc.', 'Num. doc.', 'RUT', 'Razón social'];
      const data = [
        header,
        ...rows.map(row => [
          row.Fecha,
          row['Codigo doc'],
          row.Interno,
          row.Documento,
          row.Proveedor,
          row.Neto,
          row.Exento,
          row.IVA,
          row.Total,
          currentEmpresa?.razonSocial || row.Empresa || '',
          row['Tipo doc.'],
          row['Num. doc.'],
          row.RUT,
          row['Razón social'],
        ]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      ws['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 46 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 24 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 36 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Hoja 1');
      XLSX.writeFile(wb, `libro_compra_detalle_emitido_${new Date().toISOString().replace(/\D/g, '').slice(0, 15)}.xlsx`);
      return;
    }
    if (isLibroMayor) {
      const wb = XLSX.utils.book_new();
      const header = ['Cuenta contable', 'Nombre cuenta contable', 'Fecha', 'Comprobante', 'Glosa', 'Glosa comprobante detalle', 'Tipo documento', 'Número documento', 'Debe', 'Haber', 'Saldo', 'Centro de costo', 'RUT', 'Nombre/Razón social', 'Fecha documento', 'Fecha vencimiento', 'Concepto 1', 'Concepto 2', 'Concepto 3', 'Concepto 4'];
      const data = [
        ['Empresa', 'VAICMEDICAL SPA'],
        ['RUT', '77573229-6'],
        ['De la fecha', formatJournalDate(filters.fechaDesde)],
        ['A la fecha', formatJournalDate(filters.fechaHasta)],
        ['Moneda', 'CLP'],
        ['Tasa de cambio', 1],
        ['Tipo de contabilidad', filters.tipoContabilidad || 'PCGA'],
        [],
        header,
        ...rows.map(row => header.map(key => row[key] ?? '')),
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      ws['!cols'] = [{ wch: 16 }, { wch: 26 }, { wch: 12 }, { wch: 14 }, { wch: 36 }, { wch: 32 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 14 }, { wch: 36 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, `finanzas_libro_mayor_${new Date().toISOString().replace(/\D/g, '').slice(0, 15)}.xlsx`);
      return;
    }
    const cleanRows = rows.map(({ voucherId, isTotal, ...row }) => row);
    const ws = XLSX.utils.json_to_sheet(cleanRows, { header: ['Fecha', 'Comprobante', 'Cod. Cta. Contable', 'Cuenta Contable', 'Glosa', 'Documento Asociado', 'Debe', 'Haber'] });
    ws['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 28 }, { wch: 42 }, { wch: 24 }, { wch: 14 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'libro_diario');
    XLSX.writeFile(wb, `Finanzas_libro_diario_${new Date().toISOString().replace(/\D/g, '').slice(0, 15)}.xlsx`);
  };

  const downloadPdf = () => {
    const win = openHtmlDocument(isLibroCompra ? buildLibroCompraHtml(rows, filters, currentEmpresa) : isLibroMayor ? buildLibroMayorHtml(rows, filters) : buildLibroDiarioHtml(rows, filters));
    setTimeout(() => win.print(), 300);
  };

  return (
    <div className="w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 space-y-5">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Contabilidad / Informes tributarios</p>
        <h2 className="text-2xl font-black text-slate-900">Informes tributarios</h2>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 bg-slate-50 px-3 pt-3">
          {['Nuevo libro diario', 'Libro diario', 'Libro mayor', 'Libro de compra', 'Libro de venta', 'Tarjeta de existencia', 'Libro de honorarios', 'Libro de retenciones', 'Libro ingresos y egresos'].map(tab => (
            <button key={tab} onClick={() => { setActiveTaxTab(tab); setGenerated(false); setRows([]); }} className={`px-3 py-2 text-xs border border-slate-200 border-b-0 rounded-t-lg whitespace-nowrap ${tab === activeTaxTab ? 'bg-white text-slate-900 font-bold' : 'bg-slate-100 text-slate-500'}`}>
              {tab}{tab === 'Nuevo libro diario' && <span className="ml-1 rounded bg-pink-500 px-1 text-[9px] font-bold text-white">Beta</span>}
            </button>
          ))}
        </div>

        <div className="p-4 md:p-6 space-y-5">
          {isLibroMayor ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Tipo de informe</span><select value={filters.tipoInforme} onChange={e => updateFilter('tipoInforme', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option>General</option><option>Centro de costos</option></select></label>
              <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Cuenta contable desde</span><select value={filters.cuentaDesde} onChange={e => updateFilter('cuentaDesde', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">Primera cuenta</option>{accountOptions.map(account => <option key={`from-${account.code}`} value={account.code}>{account.code} {account.name}</option>)}</select></label>
              <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Cuenta contable hasta</span><select value={filters.cuentaHasta} onChange={e => updateFilter('cuentaHasta', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">Ultima cuenta</option>{accountOptions.map(account => <option key={`to-${account.code}`} value={account.code}>{account.code} {account.name}</option>)}</select></label>
              <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Fecha desde</span><input type="date" value={filters.fechaDesde} onChange={e => updateFilter('fechaDesde', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
              <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Fecha hasta</span><input type="date" value={filters.fechaHasta} onChange={e => updateFilter('fechaHasta', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
            </div>
          ) : isLibroCompra ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Tipo</span><select value={filters.tipo} onChange={e => updateFilter('tipo', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option>Detalle</option><option>Resumen</option></select></label>
                <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Fecha desde</span><input type="date" value={filters.fechaDesde} onChange={e => updateFilter('fechaDesde', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
                <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Fecha hasta</span><input type="date" value={filters.fechaHasta} onChange={e => updateFilter('fechaHasta', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
                <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Unidad de negocio</span><select value={filters.unidadNegocio} onChange={e => updateFilter('unidadNegocio', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option>Todas</option>{units.map(unit => <option key={unit}>{unit}</option>)}</select></label>
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={filters.showAnulados} onChange={e => updateFilter('showAnulados', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                Mostrar movimientos anulados
              </label>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Tipo</span><select value={filters.tipo} onChange={e => updateFilter('tipo', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option>Todos</option><option>Borrador</option><option>Apertura</option><option>Egreso</option><option>Ingreso</option><option>Traspaso</option></select></label>
                <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Fecha desde</span><input type="date" value={filters.fechaDesde} onChange={e => updateFilter('fechaDesde', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
                <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Fecha hasta</span><input type="date" value={filters.fechaHasta} onChange={e => updateFilter('fechaHasta', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
                <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Tipo de contabilidad</span><select value={filters.tipoContabilidad} onChange={e => updateFilter('tipoContabilidad', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option>Todas</option><option>PCGA</option><option>IFRS</option><option>Ambas</option></select></label>
                <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Unidad de negocio</span><select value={filters.unidadNegocio} onChange={e => updateFilter('unidadNegocio', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option>Todas</option>{units.map(unit => <option key={unit}>{unit}</option>)}</select></label>
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={filters.showAnulados} onChange={e => updateFilter('showAnulados', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                Mostrar movimientos anulados
              </label>
            </>
          )}

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <button onClick={downloadPdf} disabled={!generated || rows.length === 0} className="h-10 w-10 rounded-full bg-white border border-slate-200 text-red-500 shadow-sm hover:bg-red-50 disabled:opacity-40 flex items-center justify-center" title="Descargar PDF"><FileDown size={18}/></button>
              <button onClick={downloadExcel} disabled={!generated || rows.length === 0} className="h-10 w-10 rounded-full bg-white border border-slate-200 text-emerald-600 shadow-sm hover:bg-emerald-50 disabled:opacity-40 flex items-center justify-center" title="Descargar Excel"><FileSpreadsheet size={18}/></button>
              <Button variant="accent" icon={FileText} onClick={generate}>Generar libro</Button>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button variant="secondary" className="text-blue-600 border-blue-200" onClick={() => alert('Comparacion BI preparada para futura integracion.')}>Comparar saldos con año anterior con BI</Button>
              <Button variant="primary" onClick={downloadExcel} disabled={!generated || rows.length === 0}>Generar CSV - Acepta</Button>
            </div>
          </div>
        </div>
      </div>

      {generated && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-500">Mostrar <select className="rounded border border-slate-200 px-2 py-1 text-xs"><option>10</option><option>25</option><option>100</option></select> registros</div>
            <label className="flex items-center gap-2 text-sm text-slate-500">Buscar <input value={search} onChange={e => setSearch(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
          </div>
          <div className="overflow-x-auto">
            {isLibroMayor ? (
              <table className="w-full text-xs">
                <thead className="text-[10px] uppercase text-slate-400 bg-slate-50 border-b border-slate-100">
                  <tr><th className="p-3 text-left">Fecha</th><th className="p-3 text-left">Comprobante</th><th className="p-3 text-left">Glosa</th><th className="p-3 text-left">Documento</th><th className="p-3 text-left">Nombre/Razón social</th><th className="p-3 text-left">Centro de costo</th><th className="p-3 text-right">Debe</th><th className="p-3 text-right">Haber</th><th className="p-3 text-right">Saldo</th></tr>
                </thead>
                <tbody>
                  {previewRows.slice(0, 100).map((row, index, list) => {
                    const previous = list[index - 1];
                    const showAccount = !previous || previous['Cuenta contable'] !== row['Cuenta contable'];
                    return (
                      <React.Fragment key={`${row['Cuenta contable']}-${row.Comprobante}-${index}`}>
                        {showAccount && (
                          <tr className="bg-white border-t border-slate-200">
                            <td className="p-3 font-mono text-slate-500">{row['Cuenta contable']}</td>
                            <td colSpan="2" className="p-3 font-black text-slate-800 uppercase">{row['Nombre cuenta contable']}</td>
                            <td colSpan="6" className="p-3 font-semibold text-slate-600">Saldo inicial</td>
                          </tr>
                        )}
                        <tr className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-3 font-mono">{row.Fecha}</td><td className="p-3 text-blue-600 font-semibold">{row.Comprobante}</td><td className="p-3 max-w-sm truncate">{row.Glosa}</td><td className="p-3">{row.Documento}</td><td className="p-3 max-w-xs truncate">{row['Nombre/Razón social']}</td><td className="p-3 max-w-xs truncate">{row['Centro de costo']}</td><td className="p-3 text-right font-mono">{money(row.Debe)}</td><td className="p-3 text-right font-mono">{money(row.Haber)}</td><td className="p-3 text-right font-mono">{money(row.Saldo)}</td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                  {previewRows.length === 0 && <tr><td colSpan="9" className="p-10 text-center text-slate-400">No hay movimientos para los filtros seleccionados.</td></tr>}
                </tbody>
              </table>
            ) : isLibroCompra ? (
              <table className="w-full text-xs">
                <thead className="text-[10px] uppercase text-slate-400 bg-slate-50 border-b border-slate-100">
                  <tr><th className="p-3 text-left">Fecha</th><th className="p-3 text-left">Codigo doc</th><th className="p-3 text-left">Interno</th><th className="p-3 text-left">Documento</th><th className="p-3 text-left">Proveedor</th><th className="p-3 text-right">Neto</th><th className="p-3 text-right">Exento</th><th className="p-3 text-right">IVA</th><th className="p-3 text-right">Total</th></tr>
                </thead>
                <tbody>
                  {previewRows.slice(0, 100).map((row, index) => (
                    <tr key={`${row.Documento}-${index}`} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3 font-mono">{row.Fecha}</td><td className="p-3 font-mono">{row['Codigo doc']}</td><td className="p-3 font-mono">{row.Interno}</td><td className="p-3">{row.Documento}</td><td className="p-3 max-w-sm truncate">{row.Proveedor}</td><td className="p-3 text-right font-mono">{money(row.Neto)}</td><td className="p-3 text-right font-mono">{money(row.Exento)}</td><td className="p-3 text-right font-mono">{money(row.IVA)}</td><td className="p-3 text-right font-mono">{money(row.Total)}</td>
                    </tr>
                  ))}
                  {previewRows.length > 0 && (
                    <tr className="bg-slate-50 font-bold border-t border-slate-200">
                      <td className="p-3" colSpan="5">Total</td><td className="p-3 text-right font-mono">{money(totals.neto)}</td><td className="p-3 text-right font-mono">{money(totals.exento)}</td><td className="p-3 text-right font-mono">{money(totals.iva)}</td><td className="p-3 text-right font-mono">{money(totals.total)}</td>
                    </tr>
                  )}
                  {previewRows.length === 0 && <tr><td colSpan="9" className="p-10 text-center text-slate-400">No hay documentos de compra para los filtros seleccionados.</td></tr>}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-xs">
                <thead className="text-[10px] uppercase text-slate-400 bg-slate-50 border-b border-slate-100">
                  <tr><th className="p-3 text-left">Fecha</th><th className="p-3 text-left">Comprobante</th><th className="p-3 text-left">Cod. Cuenta Contable</th><th className="p-3 text-left">Detalle</th><th className="p-3 text-left">Documento asociado</th><th className="p-3 text-right">Debe</th><th className="p-3 text-right">Haber</th><th className="p-3 text-right">Ver comprobante contable</th></tr>
                </thead>
                <tbody>
                  {previewRows.slice(0, 100).map((row, index) => (
                    <tr key={`${row.voucherId}-${index}`} className={`border-b border-slate-100 ${row.isTotal ? 'bg-slate-50 font-bold' : 'hover:bg-slate-50'}`}>
                      <td className="p-3 font-mono">{row.Fecha}</td><td className="p-3">{row.Comprobante}</td><td className="p-3 font-mono">{row['Cod. Cta. Contable']}</td><td className="p-3">{row.Glosa}</td><td className="p-3">{row['Documento Asociado']}</td><td className="p-3 text-right font-mono">{money(row.Debe)}</td><td className="p-3 text-right font-mono">{money(row.Haber)}</td><td className="p-3 text-right">{row.isTotal && <Eye size={15} className="inline text-lime-600" />}</td>
                    </tr>
                  ))}
                  {previewRows.length === 0 && <tr><td colSpan="8" className="p-10 text-center text-slate-400">No hay movimientos para los filtros seleccionados.</td></tr>}
                </tbody>
              </table>
            )}
          </div>
          <div className="px-4 py-3 text-xs text-slate-400 border-t border-slate-100 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <span>Mostrando registros del 1 al {Math.min(previewRows.length, 100)} de un total de {rows.length} registros</span>
            <span className="font-semibold text-slate-600">{isLibroCompra ? `Neto ${money(totals.neto)} | Exento ${money(totals.exento)} | IVA ${money(totals.iva)} | Total ${money(totals.total)}` : `Debe ${money(totals.debe)} | Haber ${money(totals.haber)}`}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const buildBalanceRows = (comprobantes = [], fechaInforme = accountingDate()) => {
  const grouped = {};
  comprobantes
    .filter(v => dateInRange(v.fecha, '', fechaInforme))
    .filter(v => String(v.estado || '').toLowerCase() !== 'anulado')
    .forEach(voucher => {
      (voucher.detalles || []).forEach(line => {
        const account = splitAccount(line.cuentaContable);
        const code = account.code || 'Sin cuenta';
        if (!grouped[code]) grouped[code] = { Cuenta: code, 'Cuenta contable': account.name || code, Debito: 0, Credito: 0 };
        grouped[code].Debito += toAmount(line.debe);
        grouped[code].Credito += toAmount(line.haber);
      });
    });

  return Object.values(grouped)
    .sort((a, b) => String(a.Cuenta).localeCompare(String(b.Cuenta)))
    .map(row => {
      const deudor = Math.max(0, row.Debito - row.Credito);
      const acreedor = Math.max(0, row.Credito - row.Debito);
      const first = String(row.Cuenta).charAt(0);
      return {
        ...row,
        Deudor: deudor,
        Acreedor: acreedor,
        Activo: first === '1' ? deudor : 0,
        Pasivo: ['2', '3'].includes(first) ? acreedor : 0,
        Perdidas: ['4', '5', '6'].includes(first) ? deudor : 0,
        Ganancias: ['4', '5', '6'].includes(first) ? acreedor : 0,
      };
    });
};

const buildBalanceHtml = (rows, filters) => {
  const totals = rows.reduce((acc, row) => ({
    debito: acc.debito + row.Debito,
    credito: acc.credito + row.Credito,
    deudor: acc.deudor + row.Deudor,
    acreedor: acc.acreedor + row.Acreedor,
    activo: acc.activo + row.Activo,
    pasivo: acc.pasivo + row.Pasivo,
    perdidas: acc.perdidas + row.Perdidas,
    ganancias: acc.ganancias + row.Ganancias,
  }), { debito: 0, credito: 0, deudor: 0, acreedor: 0, activo: 0, pasivo: 0, perdidas: 0, ganancias: 0 });
  const body = rows.map(row => `<tr><td>${row.Cuenta}</td><td>${htmlText(row['Cuenta contable'])}</td><td class="num">${money(row.Debito)}</td><td class="num">${money(row.Credito)}</td><td class="num">${money(row.Deudor)}</td><td class="num">${money(row.Acreedor)}</td><td class="num">${money(row.Activo)}</td><td class="num">${money(row.Pasivo)}</td><td class="num">${money(row.Perdidas)}</td><td class="num">${money(row.Ganancias)}</td></tr>`).join('');
  return `<html><head><title>VAICMEDICAL SPA_balance_tributario</title><style>
    body{font-family:Arial,sans-serif;color:#111827;padding:24px}h1{font-size:20px;margin:0}.meta{font-size:11px;color:#475569;margin-top:4px}.stamp{float:right;border:2px solid #1f5b93;color:#1f5b93;padding:8px 12px;font-weight:700;font-size:12px}
    table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border:1px solid #cbd5e1;padding:6px;font-size:10px}th{background:#e5e7eb;text-transform:uppercase}.num{text-align:right}.total td{background:#f8fafc;font-weight:700}
    @media print{button{display:none}body{padding:0}}
  </style></head><body>
    <button onclick="window.print()" style="margin-bottom:14px;padding:8px 14px;border:0;background:#1f5b93;color:white;border-radius:8px;font-weight:700">Descargar PDF</button>
    ${filters.timbrado ? '<div class="stamp">TIMBRADO</div>' : ''}
    <h1>Balance Tributario</h1><div class="meta">VAICMEDICAL SPA | RUT 77573229-6 | Moneda CLP | Fecha hasta ${formatJournalDate(filters.fechaInforme)}</div>
    <table><thead><tr><th>Cuenta</th><th>Cuenta contable</th><th>Débito</th><th>Crédito</th><th>Deudor</th><th>Acreedor</th><th>Activo</th><th>Pasivo</th><th>Pérdidas</th><th>Ganancias</th></tr></thead><tbody>${body}
    <tr class="total"><td colspan="2">Totales</td><td class="num">${money(totals.debito)}</td><td class="num">${money(totals.credito)}</td><td class="num">${money(totals.deudor)}</td><td class="num">${money(totals.acreedor)}</td><td class="num">${money(totals.activo)}</td><td class="num">${money(totals.pasivo)}</td><td class="num">${money(totals.perdidas)}</td><td class="num">${money(totals.ganancias)}</td></tr>
    </tbody></table></body></html>`;
};

const EstadosFinancieros = () => {
  const { comprobantes } = useContext(ERPContext);
  const [activeTab, setActiveTab] = useState('Balance');
  const [filters, setFilters] = useState({ tipoInforme: 'Tributario', fechaInforme: accountingDate(), timbrado: false });
  const [rows, setRows] = useState([]);
  const [generated, setGenerated] = useState(false);
  const [search, setSearch] = useState('');
  const updateFilter = (field, value) => setFilters(prev => ({ ...prev, [field]: value }));
  const visibleRows = rows.filter(row => Object.values(row).join(' ').toLowerCase().includes(search.toLowerCase()));

  const totals = rows.reduce((acc, row) => ({
    debito: acc.debito + row.Debito,
    credito: acc.credito + row.Credito,
    deudor: acc.deudor + row.Deudor,
    acreedor: acc.acreedor + row.Acreedor,
    activo: acc.activo + row.Activo,
    pasivo: acc.pasivo + row.Pasivo,
    perdidas: acc.perdidas + row.Perdidas,
    ganancias: acc.ganancias + row.Ganancias,
  }), { debito: 0, credito: 0, deudor: 0, acreedor: 0, activo: 0, pasivo: 0, perdidas: 0, ganancias: 0 });

  const generate = () => {
    setRows(buildBalanceRows(comprobantes, filters.fechaInforme));
    setGenerated(true);
  };

  const downloadExcel = () => {
    const header = ['Cuenta', 'Cuenta contable', 'Débito', 'Crédito', 'Deudor', 'Acreedor', 'Activo', 'Pasivo', 'Pérdidas', 'Ganancias'];
    const data = [
      ['Empresas', 'VAICMEDICAL SPA'],
      ['RUT', '77573229-6'],
      ['Unidad de negocio', 'Todas las unidades de negocio'],
      ['Moneda', 'CLP'],
      ['Tasa de cambio', 1],
      ['Fecha hasta', formatJournalDate(filters.fechaInforme)],
      ['Centro de costo', 'Todos los centros'],
      [],
      [],
      header,
      ...rows.map(row => [row.Cuenta, row['Cuenta contable'], row.Debito, row.Credito, row.Deudor, row.Acreedor, row.Activo, row.Pasivo, row.Perdidas, row.Ganancias]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 14 }, { wch: 32 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'VAICMEDICAL SPA');
    XLSX.writeFile(wb, `VAICMEDICAL SPA_balance_tributario_${new Date().toISOString().replace(/\D/g, '').slice(0, 15)}.xlsx`);
  };

  const downloadPdf = () => {
    const win = openHtmlDocument(buildBalanceHtml(rows, filters));
    setTimeout(() => win.print(), 300);
  };

  return (
    <div className="w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 space-y-5">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Finanzas / Balance y EEFF</p>
        <h2 className="text-2xl font-black text-slate-900">Estados Financieros</h2>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex gap-1 border-b border-slate-100 bg-slate-50 px-3 pt-3">
          {['Balance', 'Estado de resultado'].map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setGenerated(false); setRows([]); }} className={`px-3 py-2 text-xs border border-slate-200 border-b-0 rounded-t-lg ${tab === activeTab ? 'bg-white text-slate-900 font-bold' : 'bg-slate-100 text-slate-500'}`}>{tab}</button>
          ))}
        </div>

        <div className="p-4 md:p-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Tipo de informe</span><select value={filters.tipoInforme} onChange={e => updateFilter('tipoInforme', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option>Tributario</option><option>Financiero</option></select></label>
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Fecha de informe</span><input type="date" value={filters.fechaInforme} onChange={e => updateFilter('fechaInforme', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
            <label className="inline-flex items-center gap-2 pt-6 text-sm font-semibold text-slate-700"><input type="checkbox" checked={filters.timbrado} onChange={e => updateFilter('timbrado', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" /> Timbrado</label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" className="text-blue-600 border-blue-200" onClick={() => alert('Comparacion BI preparada para futura integracion.')}>Comparar saldo con año anterior con BI</Button>
            <button onClick={downloadPdf} disabled={!generated || rows.length === 0} className="h-10 w-10 rounded-full bg-white border border-slate-200 text-red-500 shadow-sm hover:bg-red-50 disabled:opacity-40 flex items-center justify-center" title="Descargar PDF"><FileDown size={18}/></button>
            <button onClick={downloadExcel} disabled={!generated || rows.length === 0} className="h-10 w-10 rounded-full bg-white border border-slate-200 text-emerald-600 shadow-sm hover:bg-emerald-50 disabled:opacity-40 flex items-center justify-center" title="Descargar Excel"><FileSpreadsheet size={18}/></button>
            <Button variant="accent" icon={FileText} onClick={generate}>Generar balance</Button>
          </div>
        </div>
      </div>

      {generated && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex items-center gap-2">
            <Search size={15} className="text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar" className="w-full bg-transparent text-sm focus:outline-none" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-[10px] uppercase text-slate-500 bg-slate-50 border-b border-slate-100">
                <tr><th className="p-3 text-left">Cuenta contable</th><th className="p-3 text-right">Débito</th><th className="p-3 text-right">Crédito</th><th className="p-3 text-right">Deudor</th><th className="p-3 text-right">Acreedor</th><th className="p-3 text-right">Activo</th><th className="p-3 text-right">Pasivo</th><th className="p-3 text-right">Pérdidas</th><th className="p-3 text-right">Ganancias</th></tr>
              </thead>
              <tbody>
                {visibleRows.map(row => (
                  <tr key={row.Cuenta} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-medium">{row.Cuenta} - {row['Cuenta contable']}</td><td className="p-3 text-right font-mono">{money(row.Debito)}</td><td className="p-3 text-right font-mono">{money(row.Credito)}</td><td className="p-3 text-right font-mono text-blue-600">{money(row.Deudor)}</td><td className="p-3 text-right font-mono text-blue-600">{money(row.Acreedor)}</td><td className="p-3 text-right font-mono">{money(row.Activo)}</td><td className="p-3 text-right font-mono">{money(row.Pasivo)}</td><td className="p-3 text-right font-mono">{money(row.Perdidas)}</td><td className="p-3 text-right font-mono">{money(row.Ganancias)}</td>
                  </tr>
                ))}
                {visibleRows.length === 0 && <tr><td colSpan="9" className="p-10 text-center text-slate-400">No hay registros para la fecha de informe seleccionada.</td></tr>}
              </tbody>
              <tfoot className="bg-slate-50 font-black">
                <tr><td className="p-3">Totales</td><td className="p-3 text-right">{money(totals.debito)}</td><td className="p-3 text-right">{money(totals.credito)}</td><td className="p-3 text-right">{money(totals.deudor)}</td><td className="p-3 text-right">{money(totals.acreedor)}</td><td className="p-3 text-right">{money(totals.activo)}</td><td className="p-3 text-right">{money(totals.pasivo)}</td><td className="p-3 text-right">{money(totals.perdidas)}</td><td className="p-3 text-right">{money(totals.ganancias)}</td></tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const AbastecimientoPlaceholder = ({ titulo }) => (
  <div className="w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2">
    <div className="mb-6">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Abastecimiento</p>
      <h2 className="text-2xl font-black text-slate-900">{titulo}</h2>
    </div>
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase text-slate-400">Estado</p>
          <p className="mt-1 text-sm font-bold text-slate-700">Modulo preparado</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase text-slate-400">Registros</p>
          <p className="mt-1 text-sm font-bold text-slate-700">0 pendientes</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase text-slate-400">Accion principal</p>
          <p className="mt-1 text-sm font-bold text-slate-700">Disponible para configurar</p>
        </div>
      </div>
      <div className="mt-6 border border-dashed border-slate-200 rounded-xl p-10 text-center">
        <div className="w-12 h-12 mx-auto rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <ClipboardList size={24} />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-600">{titulo}</p>
        <p className="mt-1 text-xs text-slate-400">Submodulo creado y listo para recibir flujo, filtros, tablas y formularios.</p>
      </div>
    </div>
  </div>
);

const ABASTECIMIENTO_DOC_TYPES = [
  { code: 'OC', description: 'Orden de compra', sii: '0', title: 'Orden de compra', create: 'Crear orden de compra' },
  { code: 'FACE', description: 'Factura de Compra Electronica', sii: '33', title: 'Factura de compra', create: 'Crear factura de compra' },
  { code: 'FCEE', description: 'Factura de Compra Exenta Electronica', sii: '34', title: 'Factura de compra exenta', create: 'Crear factura exenta' },
  { code: 'GDC', description: 'Guia de Recepcion de Compra', sii: '0', title: 'Guia de recepcion de compra', create: 'Crear guia de recepcion' },
  { code: 'NCCE', description: 'Nota de Credito de Proveedores Electronica', sii: '61', title: 'Nota de credito de proveedor', create: 'Crear nota de credito' },
  { code: 'NDCE', description: 'Nota Debito Compra Electronica', sii: '56', title: 'Nota de debito de compra', create: 'Crear nota de debito' },
  { code: 'BOR', description: 'Boleta de Honorario con retencion', sii: '0', title: 'Boleta de honorario con retencion', create: 'Crear boleta de honorario' },
  { code: 'BOH', description: 'Boleta de Honorario sin retencion', sii: '0', title: 'Boleta de honorario sin retencion', create: 'Crear boleta de honorario' },
  { code: 'GGENR', description: 'Gastos Generales', sii: '0', title: 'Gastos generales', create: 'Crear gasto general' },
  { code: 'OCI', description: 'Orden de Compra de Importacion', sii: '0', title: 'Orden de compra de importacion', create: 'Crear orden de importacion' },
  { code: 'FIM', description: 'Factura de Importacion', sii: '0', title: 'Factura de importacion', create: 'Crear factura de importacion' },
  { code: 'DE', description: 'Documento de Embarque', sii: '0', title: 'Documento de embarque', create: 'Crear documento de embarque' },
  { code: 'GDRI', description: 'Guia de Recepcion de Importacion', sii: '0', title: 'Guia de recepcion de importacion', create: 'Crear guia de importacion' },
];

const defaultDocumentDateFrom = () => {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return date.toISOString().split('T')[0];
};

const emptyPurchaseOrderLine = (index = 1) => ({
  id: `oc-line-${Date.now()}-${index}`,
  numeroDetalle: index,
  codigoProducto: '',
  descripcion: '',
  unidad: '',
  cantidad: 1,
  precioUnitario: '',
  tipoDesc: 'Monto',
  descuento: 0,
  centroCosto: '',
  moneda: 'PESO CHILENO',
  tasaCambio: 1,
  montoNeto: 0,
  concepto1: '',
  concepto2: '',
  concepto3: '',
  concepto4: '',
  fechaComprometida: '',
  descripcionAdicional: '',
});

const emptyPurchaseOrderDraft = (nextNumber = 1, currentEmpresa = null) => ({
  numeroDocumento: String(nextNumber),
  proveedorRut: '',
  proveedor: '',
  fechaDocumento: accountingDate(),
  fechaContable: accountingDate(),
  fechaVencimiento: '',
  moneda: 'PESO CHILENO',
  tasaCambio: 1,
  unidadNegocio: currentEmpresa?.unidadesNegocio?.[0]?.descripcion || currentEmpresa?.unidadesNegocio?.[0]?.nombre || 'Administracion',
  atencion: '',
  tipoDescuento: 'Monto',
  descuento: '0,00',
  stock: 'No Mueve',
  referencia: '',
  ajusteImpuesto: 0,
  glosa: '',
  lines: [],
});

const buildPurchaseOrderHtml = (order = {}, empresa = {}) => {
  const totals = (order.lines || []).reduce((acc, line) => {
    const neto = toAmount(line.montoNeto);
    const iva = Math.round(neto * 0.19);
    return { neto: acc.neto + neto, iva: acc.iva + iva, total: acc.total + neto + iva };
  }, { neto: 0, iva: 0, total: 0 });
  const body = (order.lines || []).map((line, index) => `<tr>
    <td>${index + 1}</td><td>${htmlText(line.codigoProducto)}</td><td>${htmlText(line.descripcion)}</td><td>${htmlText(line.unidad)}</td>
    <td class="num">${line.cantidad || 0}</td><td>${htmlText(line.moneda || order.moneda)}</td><td>${htmlText(line.centroCosto)}</td>
    <td class="num">$${money(line.precioUnitario)}</td><td class="num">$${money(line.montoNeto)}</td>
  </tr>`).join('');
  return `<html><head><title>Orden de compra ${order.numeroDocumento || ''}</title><style>
    body{font-family:Arial,sans-serif;color:#111827;padding:28px}.top{display:flex;justify-content:space-between;border-bottom:3px solid #111827;padding-bottom:12px;margin-bottom:16px}
    .brand{font-weight:800;font-size:20px}.doc{text-align:right;text-transform:uppercase;letter-spacing:.05em}.grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 22px;font-size:12px;margin:12px 0 18px}
    table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #cbd5e1;padding:7px;font-size:11px;vertical-align:top}th{background:#e5e7eb;text-transform:uppercase;font-size:10px}.num{text-align:right}
    .totals{margin-left:auto;width:280px}.box{border:1px solid #cbd5e1;background:#f8fafc;padding:10px;font-size:12px;margin-top:12px}.footer{margin-top:30px;border-top:1px solid #cbd5e1;padding-top:10px;font-size:10px;color:#475569}
    @media print{button{display:none}body{padding:10px}}
  </style></head><body>
    <button onclick="window.print()" style="margin-bottom:14px;padding:8px 14px;border:0;background:#1f5b93;color:white;border-radius:8px;font-weight:700">Imprimir / Guardar PDF</button>
    <div class="top"><div><div class="brand">${htmlText(empresa.razonSocial || 'VAICMEDICAL SPA')}</div><div>RUT: ${htmlText(empresa.rut || '77573229-6')}<br/>${htmlText(empresa.direccion || 'Compañía 1068, Oficina 806, Santiago')}<br/>${htmlText(empresa.telefono || '')}</div></div><div class="doc"><h2>Orden de compra<br/>N ${htmlText(order.numeroDocumento)}</h2><div>${formatJournalDate(order.fechaDocumento)}</div></div></div>
    <h3>Información del proveedor</h3><div class="grid"><div><b>Proveedor:</b> ${htmlText(order.proveedor)}</div><div><b>RUT:</b> ${htmlText(order.proveedorRut)}</div><div><b>Fecha contable:</b> ${formatJournalDate(order.fechaContable)}</div><div><b>Fecha vencimiento:</b> ${formatJournalDate(order.fechaVencimiento)}</div><div><b>Moneda:</b> ${htmlText(order.moneda)}</div><div><b>Unidad de negocio:</b> ${htmlText(order.unidadNegocio)}</div><div><b>Referencia:</b> ${htmlText(order.referencia)}</div><div><b>Atención:</b> ${htmlText(order.atencion)}</div></div>
    <table><thead><tr><th>N°</th><th>Código</th><th>Descripción</th><th>Unidad</th><th>Cantidad</th><th>Moneda</th><th>Centro de costo</th><th>Precio unit.</th><th>Monto neto</th></tr></thead><tbody>${body || '<tr><td colspan="9">Sin detalle</td></tr>'}</tbody></table>
    <table class="totals"><tbody><tr><th>Monto afecto</th><td class="num">$${money(totals.neto)}</td></tr><tr><th>Monto IVA</th><td class="num">$${money(totals.iva)}</td></tr><tr><th>Monto exento</th><td class="num">$0</td></tr><tr><th>Total</th><td class="num">$${money(totals.total)}</td></tr></tbody></table>
    <div class="box"><b>Glosa</b><br/>${htmlText(order.glosa || '')}</div><div class="footer">Documento generado por Sentauris ERP. Orden sujeta a aprobación y emisión según flujo interno.</div>
  </body></html>`;
};

const AbastecimientoDocumentos = () => {
  const { registroCompras, currentEmpresa, sidebarOpen } = useContext(ERPContext);
  const [viewDoc, setViewDoc] = useState(null);
  const [filters, setFilters] = useState({ fechaDesde: defaultDocumentDateFrom(), fechaHasta: accountingDate() });
  const [search, setSearch] = useState('');
  const [internalDocs, setInternalDocs] = useState(() => readLocalList('sentauris_abastecimiento_documentos'));
  const [orderModal, setOrderModal] = useState(null);
  const [orderTab, setOrderTab] = useState('Encabezado');
  const [orderLine, setOrderLine] = useState(() => emptyPurchaseOrderLine(1));
  const [orderPreview, setOrderPreview] = useState(false);

  useEffect(() => {
    localStorage.setItem('sentauris_abastecimiento_documentos', JSON.stringify(internalDocs));
  }, [internalDocs]);

  const updateFilter = (field, value) => setFilters(prev => ({ ...prev, [field]: value }));
  const purchaseRows = registroCompras.map(row => ({
    id: `compra-${row.id}`,
    typeCode: purchaseDocType(row.tipoDocumento),
    marca: 'Compra',
    numero: row.folio,
    referencia: purchaseDocLabel(row),
    rut: row.rutProveedor,
    proveedor: row.razonSocial,
    fechaDoc: row.fechaEmision,
    total: row.total,
    estado: row.estado || 'Registrado',
    source: 'registro-compras',
  }));
  const allDocs = [...internalDocs, ...purchaseRows];
  const dateFilteredDocs = allDocs.filter(row => dateInRange(row.fechaDoc, filters.fechaDesde, filters.fechaHasta));
  const summaryRows = ABASTECIMIENTO_DOC_TYPES.map(type => ({
    ...type,
    cantidad: dateFilteredDocs.filter(row => row.typeCode === type.code).length,
  }));

  const visibleSummary = summaryRows.filter(row =>
    [row.code, row.description, row.sii, row.cantidad].join(' ').toLowerCase().includes(search.toLowerCase())
  );
  const selectedType = ABASTECIMIENTO_DOC_TYPES.find(type => type.code === viewDoc) || null;
  const detailSearch = search.toLowerCase();
  const detailRows = dateFilteredDocs
    .filter(row => row.typeCode === viewDoc)
    .filter(row => [row.marca, row.numero, row.referencia, row.rut, row.proveedor, row.fechaDoc, row.estado].join(' ').toLowerCase().includes(detailSearch));

  const orderTotals = (orderModal?.lines || []).reduce((acc, line) => {
    const neto = toAmount(line.montoNeto);
    return { neto: acc.neto + neto, iva: acc.iva + Math.round(neto * 0.19), total: acc.total + neto + Math.round(neto * 0.19) };
  }, { neto: 0, iva: 0, total: 0 });
  const updateOrder = (field, value) => setOrderModal(prev => ({ ...prev, [field]: value }));
  const updateOrderLine = (field, value) => {
    setOrderLine(prev => {
      const next = { ...prev, [field]: value };
      const qty = toAmount(field === 'cantidad' ? value : next.cantidad);
      const price = toAmount(field === 'precioUnitario' ? value : next.precioUnitario);
      const discount = toAmount(field === 'descuento' ? value : next.descuento);
      const gross = qty * price;
      next.montoNeto = Math.max(0, gross - discount);
      return next;
    });
  };

  const openPurchaseOrderModal = () => {
    const next = internalDocs.filter(d => d.typeCode === 'OC').length + 1;
    setOrderModal(emptyPurchaseOrderDraft(next, currentEmpresa));
    setOrderLine(emptyPurchaseOrderLine(1));
    setOrderTab('Encabezado');
    setOrderPreview(false);
  };

  const addOrderLine = () => {
    setOrderModal(prev => {
      const lines = [...(prev.lines || []), { ...orderLine, numeroDetalle: (prev.lines || []).length + 1 }];
      return { ...prev, lines };
    });
    setOrderLine(emptyPurchaseOrderLine((orderModal?.lines || []).length + 2));
  };

  const savePurchaseOrder = () => {
    if (!orderModal) return;
    const docId = orderModal.docId || `ab-doc-oc-${Date.now()}`;
    const savedOrder = { ...orderModal, docId };
    const record = {
      id: docId,
      typeCode: 'OC',
      marca: 'OC',
      numero: savedOrder.numeroDocumento || String(internalDocs.length + 1),
      referencia: savedOrder.referencia || `OC-${savedOrder.numeroDocumento || internalDocs.length + 1}`,
      rut: savedOrder.proveedorRut,
      proveedor: savedOrder.proveedor,
      fechaDoc: savedOrder.fechaDocumento,
      total: orderTotals.total,
      estado: 'Borrador',
      empresa: currentEmpresa?.razonSocial || '',
      header: savedOrder,
      detalle: savedOrder.lines || [],
    };
    setInternalDocs(prev => [record, ...prev.filter(doc => doc.id !== docId)]);
    setOrderModal(savedOrder);
    setOrderPreview(true);
  };

  const visualizePurchaseOrder = () => {
    const win = openHtmlDocument(buildPurchaseOrderHtml(orderModal, currentEmpresa));
    win.focus();
  };

  const createDocument = () => {
    if (!selectedType) return;
    if (selectedType.code === 'OC') {
      openPurchaseOrderModal();
      return;
    }
    const numero = window.prompt(`Numero para ${selectedType.description}`, String(internalDocs.filter(d => d.typeCode === selectedType.code).length + 1));
    if (numero === null) return;
    const proveedor = window.prompt('Proveedor / razon social', '') || '';
    const rut = window.prompt('RUT proveedor', '') || '';
    const total = toAmount(window.prompt('Total documento', '0'));
    setInternalDocs(prev => [{
      id: `ab-doc-${Date.now()}`,
      typeCode: selectedType.code,
      marca: selectedType.code,
      numero: numero || String(prev.length + 1),
      referencia: `${selectedType.code}-${numero || prev.length + 1}`,
      rut,
      proveedor,
      fechaDoc: accountingDate(),
      total,
      estado: 'Borrador',
      empresa: currentEmpresa?.razonSocial || '',
    }, ...prev]);
  };

  if (selectedType) {
    return (
      <div className="w-full max-w-none animate-in fade-in slide-in-from-bottom-2 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-500 mb-2">{selectedType.title}</p>
            <h2 className="text-2xl font-light text-blue-600">{selectedType.title}</h2>
          </div>
          <div className="flex gap-3">
            <button onClick={() => window.print()} className="h-10 w-10 rounded-full bg-white border border-slate-200 text-red-500 shadow-sm hover:bg-red-50 flex items-center justify-center" title="PDF"><FileDown size={18}/></button>
            <button className="h-10 w-10 rounded-full bg-white border border-slate-200 text-emerald-600 shadow-sm hover:bg-emerald-50 flex items-center justify-center" title="Excel"><FileSpreadsheet size={18}/></button>
            <button onClick={() => setViewDoc(null)} className="h-10 w-10 rounded-full bg-white border border-slate-200 text-slate-400 shadow-sm hover:bg-slate-50 flex items-center justify-center" title="Volver"><ChevronLeft size={20}/></button>
          </div>
        </div>

        <Button variant="accent" icon={Plus} onClick={createDocument}>{selectedType.create}</Button>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500">Mostrar <select className="rounded border border-slate-200 px-3 py-2 text-xs"><option>10</option><option>25</option><option>100</option></select> registros</div>
          <label className="flex items-center gap-2 text-sm text-slate-500">Buscar <input value={search} onChange={e => setSearch(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 border-b border-slate-100">
                <tr><th className="p-3 text-left">Marca</th><th className="p-3 text-left">N°</th><th className="p-3 text-left">Referencia</th><th className="p-3 text-left">RUT</th><th className="p-3 text-left">Proveedor</th><th className="p-3 text-left">Fecha Doc.</th><th className="p-3 text-right">Total</th><th className="p-3 text-left">Estado Doc.</th></tr>
              </thead>
              <tbody>
                {detailRows.map(row => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3">{row.marca}</td><td className="p-3 font-mono">{row.numero}</td><td className="p-3">{row.referencia}</td><td className="p-3 font-mono">{row.rut}</td><td className="p-3">{row.proveedor}</td><td className="p-3 font-mono">{formatJournalDate(row.fechaDoc)}</td><td className="p-3 text-right font-mono">{money(row.total)}</td><td className="p-3">{row.estado}</td>
                  </tr>
                ))}
                {detailRows.length === 0 && <tr><td colSpan="8" className="p-4 text-center text-slate-500">Ningun dato disponible en esta tabla</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Mostrando registros del {detailRows.length ? 1 : 0} al {detailRows.length} de un total de {detailRows.length} registros</span>
          <div className="flex gap-6"><span className="text-slate-300">Anterior</span><span className="text-slate-300">Siguiente</span></div>
        </div>
        <Button variant="secondary" icon={CheckCircle} className="bg-lime-200 text-blue-900 border-lime-200 hover:bg-lime-300">Emitir</Button>
        {orderModal && (
          <Modal title="Generar documento - Orden de compra" onClose={() => setOrderModal(null)} workspaceFull sidebarOpen={sidebarOpen}>
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-2 overflow-x-auto">
                  {(orderPreview ? ['Encabezado', 'Detalle', 'Documentos Relacionados', 'Personalización', 'Documentos adjuntos', 'Historial'] : ['Encabezado', 'Detalle', 'Personalización', 'Documentos adjuntos']).map(tab => (
                    <button key={tab} onClick={() => setOrderTab(tab)}
                      className={`px-5 py-3 text-sm font-bold border-b-2 whitespace-nowrap ${orderTab === tab ? 'border-blue-500 bg-white text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  {!orderPreview ? (
                    <Button variant="accent" icon={CheckCircle} onClick={savePurchaseOrder}>Guardar</Button>
                  ) : (
                    <>
                      <Button variant="accent" icon={Plus} onClick={openPurchaseOrderModal}>Nuevo</Button>
                      <Button variant="primary" onClick={() => setInternalDocs(prev => { const base = prev.find(d => d.id === orderModal.docId); return base ? [{ ...base, id: `ab-doc-oc-${Date.now()}`, numero: `${orderModal.numeroDocumento}-C`, referencia: `${orderModal.referencia || 'OC'} copia` }, ...prev] : prev; })}>Duplicar</Button>
                      <Button variant="secondary" className="bg-lime-200 text-blue-900 border-lime-200">Enviar por correo</Button>
                      <Button variant="accent" icon={Pencil} onClick={() => { setOrderPreview(false); setOrderTab('Encabezado'); }}>Modificar documento</Button>
                    </>
                  )}
                  <div className="text-blue-600 text-xl font-light whitespace-nowrap">OC - {orderModal.numeroDocumento || '-'}</div>
                </div>
              </div>

              {orderPreview ? (
                <div className="space-y-5">
                  {orderTab === 'Encabezado' && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
                        <label className="space-y-1"><span className="text-sm font-semibold">Número de documento</span><input value={orderModal.numeroDocumento} readOnly className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                        <label className="space-y-1 xl:col-span-2"><span className="text-sm font-semibold">Proveedor</span><div className="grid grid-cols-2"><input value={orderModal.proveedorRut} readOnly className="rounded-l border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /><input value={orderModal.proveedor} readOnly className="rounded-r border border-l-0 border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></div></label>
                        <label className="space-y-1"><span className="text-sm font-semibold">Fecha documento</span><input value={formatJournalDate(orderModal.fechaDocumento)} readOnly className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                        <label className="space-y-1"><span className="text-sm font-semibold">Fecha contable</span><input value={formatJournalDate(orderModal.fechaContable)} readOnly className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                        <label className="space-y-1"><span className="text-sm font-semibold">Fecha vencimiento</span><input value={formatJournalDate(orderModal.fechaVencimiento)} readOnly className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                        <label className="space-y-1"><span className="text-sm font-semibold">Moneda</span><input value={orderModal.moneda} readOnly className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                        <label className="space-y-1"><span className="text-sm font-semibold">Tasa de cambio</span><input value={orderModal.tasaCambio} readOnly className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                        <label className="space-y-1"><span className="text-sm font-semibold">Unidad de negocio</span><input value={orderModal.unidadNegocio} readOnly className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                        <label className="space-y-1 xl:col-span-2"><span className="text-sm font-semibold">Atención</span><input value={orderModal.atencion || '--------'} readOnly className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                        <label className="space-y-1"><span className="text-sm font-semibold">Tipo de descuento</span><input value={orderModal.tipoDescuento} readOnly className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                        <label className="space-y-1"><span className="text-sm font-semibold">Descuento</span><input value={orderModal.descuento} readOnly className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                        <label className="space-y-1"><span className="text-sm font-semibold">Ajuste IVA</span><input value="0,000000" readOnly className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                        <label className="space-y-1"><span className="text-sm font-semibold">Stock</span><input value={orderModal.stock} readOnly className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                        <label className="space-y-1"><span className="text-sm font-semibold">Referencia</span><input value={orderModal.referencia} readOnly className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                        <label className="space-y-1"><span className="text-sm font-semibold">Ajuste impuesto</span><input value={orderModal.ajusteImpuesto || '0,000000'} readOnly className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                      </div>
                      <label className="space-y-1 block"><span className="text-sm font-semibold">Glosa</span><textarea value={orderModal.glosa} readOnly className="w-full min-h-20 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                        <table className="w-full text-xs"><thead className="bg-slate-50 text-[10px] uppercase text-slate-400"><tr>{['','N°','Código','Descripción','Cantidad','Moneda','Centro de costo','Precio Unit.','Monto Neto ($)'].map(h => <th key={h} className="p-3 text-left">{h}</th>)}</tr></thead><tbody>{(orderModal.lines || []).map(line => <tr key={line.id} className="border-t"><td className="p-3"><button className="h-7 w-7 rounded-full bg-blue-700 text-white inline-flex items-center justify-center"><Pencil size={13}/></button></td><td className="p-3">{line.numeroDetalle}</td><td className="p-3">{line.codigoProducto}</td><td className="p-3">{line.descripcion}</td><td className="p-3">{line.cantidad}</td><td className="p-3">{line.moneda}</td><td className="p-3">{line.centroCosto}</td><td className="p-3">{money(line.precioUnitario)}</td><td className="p-3">{money(line.montoNeto)}</td></tr>)}</tbody></table>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                        <label className="space-y-1"><span className="text-sm font-semibold">Monto afecto</span><input value={orderTotals.neto} readOnly className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                        <label className="space-y-1"><span className="text-sm font-semibold">Monto IVA</span><input value={orderTotals.iva} readOnly className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                        <label className="space-y-1"><span className="text-sm font-semibold">Retenciones</span><input value="0" readOnly className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                        <label className="space-y-1"><span className="text-sm font-semibold">Monto exento</span><input value="0" readOnly className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                        <label className="space-y-1"><span className="text-sm font-semibold">Impuesto especial</span><input value={orderModal.ajusteImpuesto || 0} readOnly className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                        <label className="space-y-1"><span className="text-sm font-semibold">Total</span><input value={orderTotals.total} readOnly className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                      </div>
                    </>
                  )}
                  {orderTab !== 'Encabezado' && <div className="rounded-lg border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">Sin registros adicionales para esta pestaña.</div>}
                  <div className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t border-slate-100 bg-white/95 py-3">
                    <Button variant="secondary" className="bg-lime-200 text-blue-900 border-lime-200">Solicitar aprobación</Button>
                    <Button variant="secondary" className="bg-lime-200 text-blue-900 border-lime-200">Aprobar</Button>
                    <Button variant="secondary" className="bg-lime-200 text-blue-900 border-lime-200">Emitir</Button>
                    <Button variant="accent" onClick={visualizePurchaseOrder}>Visualizar</Button>
                  </div>
                </div>
              ) : orderTab === 'Encabezado' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
                    <label className="space-y-1"><span className="text-sm font-semibold">Número documento</span><input value={orderModal.numeroDocumento} onChange={e => updateOrder('numeroDocumento', e.target.value)} className="w-full rounded border border-slate-200 px-3 py-2 text-sm" /></label>
                    <label className="space-y-1 xl:col-span-2"><span className="text-sm font-semibold">Proveedor</span><div className="flex"><button className="rounded-l border border-r-0 border-slate-200 bg-white px-3 text-slate-600"><Pencil size={15}/></button><input value={orderModal.proveedor} onChange={e => updateOrder('proveedor', e.target.value)} className="w-full border border-slate-200 px-3 py-2 text-sm" /><button className="rounded-r border border-l-0 border-slate-200 bg-white px-3 text-slate-600"><Search size={15}/></button></div></label>
                    <label className="space-y-1"><span className="text-sm font-semibold">Fecha documento</span><input type="date" value={orderModal.fechaDocumento} onChange={e => updateOrder('fechaDocumento', e.target.value)} className="w-full rounded border border-slate-200 px-3 py-2 text-sm" /></label>
                    <label className="space-y-1"><span className="text-sm font-semibold">Fecha contable</span><input type="date" value={orderModal.fechaContable} onChange={e => updateOrder('fechaContable', e.target.value)} className="w-full rounded border border-slate-200 px-3 py-2 text-sm" /></label>
                    <label className="space-y-1"><span className="text-sm font-semibold">Fecha vencimiento</span><input type="date" value={orderModal.fechaVencimiento} onChange={e => updateOrder('fechaVencimiento', e.target.value)} className="w-full rounded border border-slate-200 px-3 py-2 text-sm" /></label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
                    <label className="space-y-1"><span className="text-sm font-semibold">RUT proveedor</span><input value={orderModal.proveedorRut} onChange={e => updateOrder('proveedorRut', e.target.value)} className="w-full rounded border border-slate-200 px-3 py-2 text-sm" /></label>
                    <label className="space-y-1"><span className="text-sm font-semibold">Moneda</span><select value={orderModal.moneda} onChange={e => updateOrder('moneda', e.target.value)} className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm"><option>PESO CHILENO</option><option>DOLAR</option><option>EURO</option></select></label>
                    <label className="space-y-1"><span className="text-sm font-semibold">Tasa de cambio</span><input value={orderModal.tasaCambio} onChange={e => updateOrder('tasaCambio', e.target.value)} className="w-full rounded border border-slate-200 px-3 py-2 text-sm bg-slate-50" /></label>
                    <label className="space-y-1"><span className="text-sm font-semibold">Unidad de negocio</span><select value={orderModal.unidadNegocio} onChange={e => updateOrder('unidadNegocio', e.target.value)} className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm"><option>Administracion</option>{(currentEmpresa?.unidadesNegocio || []).map(un => { const value = un.descripcion || un.nombre || un.codigo; return <option key={un.id || value}>{value}</option>; })}</select></label>
                    <label className="space-y-1 xl:col-span-2"><span className="text-sm font-semibold">Atención</span><div className="flex"><select value={orderModal.atencion} onChange={e => updateOrder('atencion', e.target.value)} className="w-full rounded-l border border-slate-200 bg-white px-3 py-2 text-sm"><option>--------</option><option>Compras</option><option>Administración</option></select><button className="rounded-r border border-l-0 border-slate-200 bg-white px-4 font-bold">+</button></div></label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
                    <label className="space-y-1"><span className="text-sm font-semibold">Tipo de descuento</span><select value={orderModal.tipoDescuento} onChange={e => updateOrder('tipoDescuento', e.target.value)} className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm"><option>Monto</option><option>Porcentaje</option></select></label>
                    <label className="space-y-1"><span className="text-sm font-semibold">Descuento</span><input value={orderModal.descuento} onChange={e => updateOrder('descuento', e.target.value)} className="w-full rounded border border-slate-200 px-3 py-2 text-sm" /></label>
                    <label className="space-y-1"><span className="text-sm font-semibold">Stock</span><select value={orderModal.stock} onChange={e => updateOrder('stock', e.target.value)} className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm"><option>No Mueve</option><option>Mueve</option></select></label>
                    <label className="space-y-1"><span className="text-sm font-semibold">Referencia</span><input value={orderModal.referencia} onChange={e => updateOrder('referencia', e.target.value)} className="w-full rounded border border-slate-200 px-3 py-2 text-sm" /></label>
                    <label className="space-y-1"><span className="text-sm font-semibold">Ajuste impuesto</span><input value={orderModal.ajusteImpuesto} onChange={e => updateOrder('ajusteImpuesto', e.target.value)} className="w-full rounded border border-slate-200 px-3 py-2 text-sm" /></label>
                  </div>
                  <label className="space-y-1 block"><span className="text-sm font-semibold">Glosa</span><textarea value={orderModal.glosa} onChange={e => updateOrder('glosa', e.target.value)} className="w-full min-h-16 rounded border border-slate-200 px-3 py-2 text-sm" /></label>
                </div>
              )}

              {!orderPreview && orderTab === 'Detalle' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
                    <label className="space-y-1"><span className="text-sm font-semibold">Número detalle</span><input value={orderLine.numeroDetalle} readOnly className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                    <label className="space-y-1 xl:col-span-2"><span className="text-sm font-semibold">Código de producto</span><div className="flex"><button className="rounded-l border border-r-0 border-slate-200 bg-white px-3 text-slate-600"><Pencil size={15}/></button><input value={orderLine.codigoProducto} onChange={e => updateOrderLine('codigoProducto', e.target.value)} className="w-full border border-slate-200 px-3 py-2 text-sm" /><button className="rounded-r border border-l-0 border-slate-200 bg-white px-3 text-slate-600"><Search size={15}/></button></div></label>
                    <label className="space-y-1 xl:col-span-3"><span className="text-sm font-semibold">Descripción</span><input value={orderLine.descripcion} onChange={e => updateOrderLine('descripcion', e.target.value)} className="w-full rounded border border-slate-200 px-3 py-2 text-sm" /></label>
                    <label className="space-y-1"><span className="text-sm font-semibold">Unidad</span><select value={orderLine.unidad} onChange={e => updateOrderLine('unidad', e.target.value)} className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm"><option>--------</option><option>Unidad</option><option>Caja</option><option>Servicio</option></select></label>
                    <label className="space-y-1"><span className="text-sm font-semibold">Cantidad</span><input value={orderLine.cantidad} onChange={e => updateOrderLine('cantidad', e.target.value)} className="w-full rounded border border-slate-200 px-3 py-2 text-sm" /></label>
                    <label className="space-y-1"><span className="text-sm font-semibold">Precio unitario</span><input value={orderLine.precioUnitario} onChange={e => updateOrderLine('precioUnitario', e.target.value)} className="w-full rounded border border-slate-200 px-3 py-2 text-sm" /></label>
                    <label className="space-y-1"><span className="text-sm font-semibold">Tipo desc</span><select value={orderLine.tipoDesc} onChange={e => updateOrderLine('tipoDesc', e.target.value)} className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm"><option>Monto</option><option>Porcentaje</option></select></label>
                    <label className="space-y-1"><span className="text-sm font-semibold">Descuento</span><input value={orderLine.descuento} onChange={e => updateOrderLine('descuento', e.target.value)} className="w-full rounded border border-slate-200 px-3 py-2 text-sm" /></label>
                    <label className="space-y-1"><span className="text-sm font-semibold">Centro de costo</span><select value={orderLine.centroCosto} onChange={e => updateOrderLine('centroCosto', e.target.value)} className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm"><option>--------</option>{(currentEmpresa?.centrosCosto || []).map(cc => { const value = [cc.codigo, cc.nombre || cc.descripcion].filter(Boolean).join(' - '); return <option key={cc.id || value}>{value}</option>; })}</select></label>
                    <label className="space-y-1"><span className="text-sm font-semibold">Moneda</span><select value={orderLine.moneda} onChange={e => updateOrderLine('moneda', e.target.value)} className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm"><option>PESO CHILENO</option><option>DOLAR</option></select></label>
                    <label className="space-y-1"><span className="text-sm font-semibold">Tasa de cambio</span><input value={orderLine.tasaCambio} onChange={e => updateOrderLine('tasaCambio', e.target.value)} className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                    <label className="space-y-1"><span className="text-sm font-semibold">Monto neto</span><input value={orderLine.montoNeto} readOnly className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                    {['concepto1','concepto2','concepto3','concepto4'].map((key, index) => <label key={key} className="space-y-1"><span className="text-sm font-semibold">Concepto {index + 1}</span><select value={orderLine[key]} onChange={e => updateOrderLine(key, e.target.value)} className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm"><option>--------</option></select></label>)}
                    <label className="space-y-1"><span className="text-sm font-semibold">Fecha comprometida</span><input type="date" value={orderLine.fechaComprometida} onChange={e => updateOrderLine('fechaComprometida', e.target.value)} className="w-full rounded border border-slate-200 px-3 py-2 text-sm" /></label>
                  </div>
                  <label className="space-y-1 block"><span className="text-sm font-semibold">Descripción adicional</span><textarea value={orderLine.descripcionAdicional} onChange={e => updateOrderLine('descripcionAdicional', e.target.value)} className="w-full min-h-20 rounded border border-slate-200 px-3 py-2 text-sm" /></label>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="accent" icon={CheckCircle} onClick={savePurchaseOrder}>Guardar</Button>
                    <Button variant="accent" icon={Plus} onClick={addOrderLine}>Agregar nuevo</Button>
                    <Button variant="accent">Asociar con documento anterior</Button>
                    <Button variant="secondary" className="ml-auto border-blue-400 text-blue-600">Consultar Stock</Button>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-[10px] uppercase text-slate-400"><tr>{['N°','Código','Descripción','Cantidad','Moneda','Centro de costo','Precio unit.','Monto neto ($)','Mover fila'].map(h => <th key={h} className="p-3 text-left">{h}</th>)}</tr></thead>
                      <tbody>
                        {(orderModal.lines || []).map(line => <tr key={line.id} className="border-t"><td className="p-3">{line.numeroDetalle}</td><td className="p-3">{line.codigoProducto}</td><td className="p-3">{line.descripcion}</td><td className="p-3">{line.cantidad}</td><td className="p-3">{line.moneda}</td><td className="p-3">{line.centroCosto}</td><td className="p-3 text-right">{money(line.precioUnitario)}</td><td className="p-3 text-right">{money(line.montoNeto)}</td><td className="p-3"></td></tr>)}
                        {(orderModal.lines || []).length === 0 && <tr><td colSpan="9" className="p-4 text-center text-slate-400">Sin líneas agregadas.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                    <label className="space-y-1"><span className="text-sm font-semibold">Monto afecto</span><input value={orderTotals.neto} readOnly className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                    <label className="space-y-1"><span className="text-sm font-semibold">Monto IVA</span><input value={orderTotals.iva} readOnly className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                    <label className="space-y-1"><span className="text-sm font-semibold">Retenciones</span><input value="0" readOnly className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                    <label className="space-y-1"><span className="text-sm font-semibold">Monto exento</span><input value="0" readOnly className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                    <label className="space-y-1"><span className="text-sm font-semibold">Impuesto especial</span><input value={orderModal.ajusteImpuesto || 0} readOnly className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                    <label className="space-y-1"><span className="text-sm font-semibold">Total</span><input value={orderTotals.total} readOnly className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
                  </div>
                </div>
              )}

              {!orderPreview && orderTab === 'Personalización' && <div className="rounded-lg border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">Configuración de impresión y atributos personalizados de la orden de compra.</div>}
              {!orderPreview && orderTab === 'Documentos adjuntos' && <div className="rounded-lg border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">Adjunta cotizaciones, respaldos o documentos asociados a la orden.</div>}
            </div>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-none animate-in fade-in slide-in-from-bottom-2 space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-600 mb-4">Abastecimiento</p>
          <h2 className="text-2xl font-light text-blue-600">Tipo de documento a ver</h2>
        </div>
        <Button variant="accent">Visualizacion general</Button>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="space-y-1"><span className="text-xs font-semibold text-slate-700">Fecha inicial</span><input type="date" value={filters.fechaDesde} onChange={e => updateFilter('fechaDesde', e.target.value)} className="w-full rounded border border-slate-200 px-3 py-2 text-sm" /></label>
          <label className="space-y-1"><span className="text-xs font-semibold text-slate-700">Fecha final</span><input type="date" value={filters.fechaHasta} onChange={e => updateFilter('fechaHasta', e.target.value)} className="w-full rounded border border-slate-200 px-3 py-2 text-sm" /></label>
          <div className="flex items-end"><Button variant="accent" className="w-full">Filtrar</Button></div>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">Mostrar <select className="rounded border border-slate-200 px-3 py-2 text-xs"><option>100</option><option>25</option><option>10</option></select> registros</div>
        <label className="flex items-center gap-2 text-sm text-slate-500">Buscar <input value={search} onChange={e => setSearch(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 border-b border-slate-100">
              <tr><th className="p-3 text-left"></th><th className="p-3 text-left">Tipo documento</th><th className="p-3 text-left">Descripcion</th><th className="p-3 text-left">Codigo SII</th><th className="p-3 text-left">Cantidad</th></tr>
            </thead>
            <tbody>
              {visibleSummary.map(row => (
                <tr key={row.code} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 w-16"><button onClick={() => { setViewDoc(row.code); setSearch(''); }} className="h-8 w-8 rounded-full bg-blue-700 text-white hover:bg-blue-800 inline-flex items-center justify-center" title={`Ver ${row.description}`}><Search size={15}/></button></td>
                  <td className="p-3 font-mono">{row.code}</td><td className="p-3">{row.description}</td><td className="p-3 font-mono">{row.sii}</td><td className="p-3 font-mono">{row.cantidad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 text-xs text-slate-400 border-t border-slate-100">Mostrando registros del 1 al {visibleSummary.length} de un total de {summaryRows.length} registros</div>
      </div>
    </div>
  );
};

const currentPeriod = () => {
  const now = new Date();
  return `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
};

const purchasePeriodFromDate = (date = '') => {
  const [year, month] = String(date).split('-');
  return month && year ? `${month}/${year}` : currentPeriod();
};

const samplePurchasesForPeriod = (period) => {
  const [month, year] = String(period || currentPeriod()).split('/');
  const baseDate = `${year}-${month || '01'}`;
  return [
    { tipoDocumento: 'Factura Electronica', folio: '1509300', fechaEmision: `${baseDate}-01`, rutProveedor: '76081234-5', razonSocial: 'INSUMOS CLINICOS SPA', total: 1509600, pagado: 1509600 },
    { tipoDocumento: 'Factura Electronica', folio: '2513', fechaEmision: `${baseDate}-06`, rutProveedor: '96543210-8', razonSocial: 'ARRIENDOS Y EQUIPOS MEDICOS LTDA', total: 476000, pagado: 0 },
    { tipoDocumento: 'Nota de Credito Electronica', folio: '95', fechaEmision: `${baseDate}-14`, rutProveedor: '76111222-3', razonSocial: 'DIALISIS NUEVA VIDA SPA', total: 260610, pagado: 260610 },
    { tipoDocumento: 'Factura Exenta', folio: '548', fechaEmision: `${baseDate}-18`, rutProveedor: '77999888-1', razonSocial: 'SERVICIOS DE MANTENCION HUAP', total: 130305, pagado: 0 },
  ].map((row, index) => ({ ...row, id: `sii-${period}-${row.folio}-${index}`, periodo: period }));
};

const normalizeSiiKey = (value) =>
  String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

const parseSiiDate = (value = '') => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().split('T')[0];
  const text = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!match) return text;
  return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
};

const parseSiiDisplayDate = (value = '') => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const iso = value.toISOString().split('T')[0];
    const [year, month, day] = iso.split('-');
    return `${day}/${month}/${year}`;
  }
  const text = String(value || '').trim().split(/\s+/)[0];
  const dmy = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) return `${dmy[1].padStart(2, '0')}/${dmy[2].padStart(2, '0')}/${dmy[3]}`;
  const ymd = text.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (ymd) return `${ymd[3].padStart(2, '0')}/${ymd[2].padStart(2, '0')}/${ymd[1]}`;
  return text;
};

const displayDateToIso = (value = '') => {
  const text = String(value || '').trim();
  const match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!match) return parseSiiDate(value);
  return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
};

const parseDelimitedText = (text = '') => {
  const clean = String(text || '').replace(/^\uFEFF/, '');
  const delimiter = (clean.split('\n')[0].match(/;/g) || []).length >= (clean.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
  const rows = [];
  let current = '', row = [], quoted = false;
  for (let i = 0; i < clean.length; i += 1) {
    const char = clean[i];
    const next = clean[i + 1];
    if (char === '"' && quoted && next === '"') { current += '"'; i += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === delimiter && !quoted) { row.push(current); current = ''; continue; }
    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(current);
      if (row.some(cell => String(cell).trim() !== '')) rows.push(row);
      current = ''; row = [];
      continue;
    }
    current += char;
  }
  row.push(current);
  if (row.some(cell => String(cell).trim() !== '')) rows.push(row);
  const headers = rows.shift() || [];
  return rows.map(values => Object.fromEntries(headers.map((header, index) => [String(header || '').trim(), values[index] ?? ''])));
};

const getSiiValue = (row, candidates) => {
  const entries = Object.entries(row || {});
  const normalizedCandidates = candidates.map(normalizeSiiKey);
  const exact = entries.find(([key]) => normalizedCandidates.includes(normalizeSiiKey(key)));
  if (exact) return exact[1];
  const found = entries.find(([key]) => normalizedCandidates.some(name => normalizeSiiKey(key).includes(name)));
  return found ? found[1] : '';
};

const normalizeSiiPurchaseRows = (rows = [], period = currentPeriod()) =>
  rows.map((row, index) => {
    const tipoDocumento = getSiiValue(row, ['tipo documento', 'tipo doc', 'tipo']);
    const folio = getSiiValue(row, ['folio', 'numero documento', 'nro documento']);
    const fechaEmision = parseSiiDate(getSiiValue(row, ['fecha emision', 'fecha documento', 'fecha']));
    const rutProveedor = getSiiValue(row, ['rut proveedor', 'rut', 'rut emisor']);
    const razonSocial = getSiiValue(row, ['razon social', 'nombre proveedor', 'nombre']);
    const total = toAmount(getSiiValue(row, ['monto total', 'total', 'monto']));
    const pagado = toAmount(getSiiValue(row, ['pagado', 'monto pagado']));
    return {
      id: `sii-${period}-${tipoDocumento}-${folio}-${rutProveedor}-${index}`,
      periodo: period,
      tipoDocumento: tipoDocumento || 'Documento Tributario',
      folio: String(folio || '').trim(),
      fechaEmision: fechaEmision || '',
      rutProveedor: String(rutProveedor || '').trim(),
      razonSocial: String(razonSocial || '').trim(),
      total,
      pagado,
    };
  }).filter(row => row.folio || row.rutProveedor || row.razonSocial);

const parseSiiCsv = (csvText, period) => {
  const rows = parseDelimitedText(csvText);
  return normalizeSiiPurchaseRows(rows, period);
};

const normalizeBulkPurchaseRows = (rows = [], period = currentPeriod()) =>
  rows.map((row, index) => {
    const tipoDocumento = getSiiValue(row, ['tipo doc', 'tipo documento']);
    const rutProveedor = getSiiValue(row, ['rut proveedor', 'rut']);
    const razonSocial = getSiiValue(row, ['razon social', 'nombre proveedor']);
    const folio = getSiiValue(row, ['folio']);
    const fechaDocto = parseSiiDisplayDate(getSiiValue(row, ['fecha docto', 'fecha documento', 'fecha emision']));
    const montoExento = toAmount(getSiiValue(row, ['monto exento']));
    const montoNeto = toAmount(getSiiValue(row, ['monto neto']));
    const montoIvaRecuperable = toAmount(getSiiValue(row, ['monto iva recuperable', 'iva recuperable']));
    const montoTotal = toAmount(getSiiValue(row, ['monto total', 'total']));
    return {
      id: `bulk-${period}-${folio}-${rutProveedor}-${index}`,
      tipoDocumento: String(tipoDocumento || '').trim(),
      rutProveedor: String(rutProveedor || '').trim(),
      razonSocial: String(razonSocial || '').trim(),
      folio: String(folio || '').trim(),
      fechaDocto,
      montoExento,
      montoNeto,
      montoIvaRecuperable,
      montoTotal,
      cuentaContable: '',
      centroCosto: '',
    };
  }).filter(row => row.folio || row.rutProveedor || row.razonSocial);

const nextVoucherNumber = (comprobantes = []) =>
  String(comprobantes.reduce((acc, item) => Math.max(acc, Number(item.numero) || 0), 0) + 1).padStart(4, '0');

const compraAccount = {
  gasto: '410101 - Compras sin clasificar',
  iva: '110901 - IVA credito fiscal',
  proveedor: '210401 - Proveedores nacionales',
};

const buildPurchaseCentralizationVoucher = (rows = [], periodo = currentPeriod(), unidadNegocio = 'Casa Matriz', comprobantes = []) => {
  const validRows = rows.filter(row => toAmount(row.total) || toAmount(row.montoTotal));
  const detalles = validRows.flatMap((row, rowIndex) => {
    const fechaDocumento = row.fechaEmision || displayDateToIso(row.fechaDocto);
    const total = toAmount(row.total || row.montoTotal);
    const neto = toAmount(row.montoNeto);
    const exento = toAmount(row.montoExento);
    const iva = toAmount(row.montoIvaRecuperable);
    const base = neto + exento;
    const expenseDebe = base > 0 || iva > 0 ? base : total;
    const glosa = `Compra ${purchaseDocLabel(row)} ${row.razonSocial || row.rutProveedor || ''}`.trim();
    const common = {
      centroCosto: row.centroCosto || '',
      glosa,
      auxiliar: [row.rutProveedor, row.razonSocial].filter(Boolean).join(' '),
      tipoDocumento: row.tipoDocumento || '',
      numeroDocumento: row.folio || '',
      fechaDocumento,
    };
    const lines = [];
    if (expenseDebe > 0) lines.push({ ...emptyVoucherLine(), ...common, cuentaContable: row.cuentaContable || compraAccount.gasto, debe: expenseDebe, haber: 0 });
    if (iva > 0) lines.push({ ...emptyVoucherLine(), ...common, cuentaContable: compraAccount.iva, debe: iva, haber: 0 });
    if (total > 0) lines.push({ ...emptyVoucherLine(), ...common, cuentaContable: compraAccount.proveedor, debe: 0, haber: total });
    return lines.map((line, lineIndex) => ({ ...line, id: `central-${periodo}-${row.folio}-${rowIndex}-${lineIndex}`, numeroDetalle: 0 }));
  }).map((line, index) => ({ ...line, numeroDetalle: index + 1 }));

  return {
    ...emptyVoucher(),
    id: `centralizacion-compras-${periodo}`,
    source: 'centralizacion-compras',
    periodo,
    tipoContabilidad: 'Ambas',
    tipoComprobante: 'Traspaso',
    numero: nextVoucherNumber(comprobantes),
    unidadNegocio: unidadNegocio || 'Casa Matriz',
    fecha: validRows.map(row => row.fechaEmision || displayDateToIso(row.fechaDocto)).filter(Boolean).sort().slice(-1)[0] || accountingDate(),
    documento: `Libro compra ${periodo}`,
    glosa: `Centralizacion de compras periodo ${periodo}`,
    estado: 'Automatico',
    detalles,
  };
};

const upsertPurchaseSuppliers = (setClientes, rows = [], empresaId = '') => {
  if (!empresaId) return;
  const suppliers = rows
    .filter(row => row.rutProveedor && row.razonSocial)
    .reduce((acc, row) => {
      const key = normalizeSiiKey(row.rutProveedor);
      if (!acc.has(key)) acc.set(key, row);
      return acc;
    }, new Map());
  if (suppliers.size === 0) return;
  setClientes(prev => {
    const next = [...prev];
    suppliers.forEach(row => {
      const index = next.findIndex(c => c.empresaId === empresaId && normalizeSiiKey(c.rut) === normalizeSiiKey(row.rutProveedor));
      if (index >= 0) {
        next[index] = {
          ...next[index],
          razonSocial: next[index].razonSocial || row.razonSocial,
          name: next[index].name || row.razonSocial,
          tipoProveedor: next[index].tipoProveedor && next[index].tipoProveedor !== 'No' ? next[index].tipoProveedor : 'Nacional',
        };
      } else {
        next.unshift({
          ...emptyClienteProveedor(empresaId),
          id: `supplier-${empresaId}-${normalizeSiiKey(row.rutProveedor)}`,
          empresaId,
          rut: row.rutProveedor,
          razonSocial: row.razonSocial,
          name: row.razonSocial,
          tipoProveedor: 'Nacional',
          tipoCliente: 'No',
        });
      }
    });
    return next;
  });
};

const RegistroCompras = () => {
  const { registroCompras, setRegistroCompras, currentEmpresa, activeEmpresaId, planCuentas, comprobantes, setComprobantes, setClientes } = useContext(ERPContext);
  const [periodo, setPeriodo] = useState(currentPeriod());
  const [filters, setFilters] = useState({ fechaDesde: '', fechaHasta: '', folio: '', auxiliar: '', tipoDocumento: '', periodo: '' });
  const [openMenu, setOpenMenu] = useState(null);
  const [notice, setNotice] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [bulkForm, setBulkForm] = useState({ unidadNegocio: '', periodoLibro: currentPeriod() });
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkNotice, setBulkNotice] = useState('');
  const bulkFileRef = useRef(null);

  const updateFilter = (field, value) => setFilters(prev => ({ ...prev, [field]: value }));
  const selectedMonth = periodo ? `${periodo.split('/')[1]}-${periodo.split('/')[0]}` : '';

  const filtered = registroCompras.filter(row => {
    const matchesFrom = !filters.fechaDesde || row.fechaEmision >= filters.fechaDesde;
    const matchesTo = !filters.fechaHasta || row.fechaEmision <= filters.fechaHasta;
    const matchesFolio = !filters.folio || String(row.folio).toLowerCase().includes(filters.folio.toLowerCase());
    const matchesAux = !filters.auxiliar || [row.rutProveedor, row.razonSocial].join(' ').toLowerCase().includes(filters.auxiliar.toLowerCase());
    const matchesType = !filters.tipoDocumento || row.tipoDocumento === filters.tipoDocumento;
    const matchesPeriod = !filters.periodo || row.periodo === filters.periodo;
    return matchesFrom && matchesTo && matchesFolio && matchesAux && matchesType && matchesPeriod;
  });

  const tiposDocumento = Array.from(new Set(registroCompras.map(row => row.tipoDocumento))).filter(Boolean);
  const periodos = Array.from(new Set(registroCompras.map(row => row.periodo))).filter(Boolean);
  const unidadesNegocio = currentEmpresa?.unidadesNegocio || [];
  const centrosCosto = currentEmpresa?.centrosCosto || [];
  const bulkSelectedMonth = bulkForm.periodoLibro ? `${bulkForm.periodoLibro.split('/')[1]}-${bulkForm.periodoLibro.split('/')[0]}` : '';
  const planCuentaOptions = planCuentas.map(c => {
    const codigo = c.codigo || c.numCuenta || c.numero || '';
    const nombre = c.nombre || c.descripcion || c.name || '';
    return { value: [codigo, nombre].filter(Boolean).join(' - '), label: [codigo, nombre].filter(Boolean).join(' - ') };
  }).filter(opt => opt.value);
  const centroCostoOptions = centrosCosto.map(c => {
    const codigo = c.codigo || '';
    const nombre = c.nombre || c.descripcion || '';
    return { value: [codigo, nombre].filter(Boolean).join(' - '), label: [codigo, nombre].filter(Boolean).join(' - ') };
  }).filter(opt => opt.value);

  const mergePurchases = (incoming) => {
    setRegistroCompras(prev => {
      const existing = new Set(prev.map(row => `${row.periodo}-${row.tipoDocumento}-${row.folio}-${row.rutProveedor}`));
      const fresh = incoming.filter(row => !existing.has(`${row.periodo}-${row.tipoDocumento}-${row.folio}-${row.rutProveedor}`));
      return [...fresh, ...prev];
    });
  };

  const syncSii = async () => {
    if (!currentEmpresa?.rut) {
      setNotice('Selecciona una empresa activa con RUT configurado antes de sincronizar con SII.');
      return;
    }
    if (!currentEmpresa?.claveTributaria) {
      setNotice('La empresa activa no tiene Clave Tributaria configurada en Configuraciones / Empresas.');
      return;
    }
    setSyncing(true);
    setNotice(`Conectando con SII para el periodo ${periodo}...`);
    try {
      const response = await fetch('/api/sii/registro-compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portal: 'https://homer.sii.cl',
          rut: currentEmpresa.rut,
          claveTributaria: currentEmpresa.claveTributaria,
          periodo,
        }),
      });
      if (!response.ok) throw new Error(`Servicio SII no disponible (${response.status})`);
      const contentType = response.headers.get('content-type') || '';
      let incoming = [];
      if (contentType.includes('application/json')) {
        const data = await response.json();
        incoming = Array.isArray(data.rows) ? normalizeSiiPurchaseRows(data.rows, periodo) : parseSiiCsv(data.csv || '', periodo);
      } else {
        incoming = parseSiiCsv(await response.text(), periodo);
      }
      mergePurchases(incoming);
      setFilters(prev => ({ ...prev, periodo }));
      setNotice(`Sincronizacion SII completada para ${periodo}. ${incoming.length} documentos procesados.`);
    } catch (err) {
      setNotice(`No se pudo sincronizar con SII. Se requiere un servicio backend local en /api/sii/registro-compras para iniciar sesion en homer.sii.cl, descargar el CSV y devolverlo a la app. Detalle: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const deleteRow = (row) => {
    if (!window.confirm(`Eliminar documento ${row.folio}?`)) return;
    setRegistroCompras(prev => prev.filter(item => item.id !== row.id));
  };

  const editRow = (row) => {
    const total = window.prompt('Modificar total del documento', row.total);
    if (total === null) return;
    setRegistroCompras(prev => prev.map(item => item.id === row.id ? { ...item, total: toAmount(total) } : item));
    setOpenMenu(null);
  };

  const openBulkLoad = () => {
    setBulkForm({
      unidadNegocio: unidadesNegocio[0]?.descripcion || unidadesNegocio[0]?.nombre || '',
      periodoLibro: periodo,
    });
    setBulkRows([]);
    setBulkNotice('');
    setViewMode('bulk');
  };

  const handleBulkFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    let rows = [];
    if (/\.csv$/i.test(file.name)) {
      rows = parseDelimitedText(await file.text());
    } else {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', raw: false });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    }
    const parsed = normalizeBulkPurchaseRows(rows, bulkForm.periodoLibro);
    setBulkRows(parsed);
    setBulkNotice(`${parsed.length} documentos leidos desde ${file.name}.`);
    event.target.value = '';
  };

  const updateBulkRow = (id, field, value) => {
    setBulkRows(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const saveBulkRows = () => {
    if (bulkRows.length === 0) {
      setBulkNotice('Carga un archivo antes de guardar.');
      return;
    }
    const voucher = buildPurchaseCentralizationVoucher(bulkRows, bulkForm.periodoLibro, bulkForm.unidadNegocio, comprobantes);
    const incoming = bulkRows.map((row, index) => ({
      id: `bulk-reg-${bulkForm.periodoLibro}-${row.tipoDocumento}-${row.folio}-${row.rutProveedor}`,
      periodo: bulkForm.periodoLibro,
      unidadNegocio: bulkForm.unidadNegocio,
      empresa: currentEmpresa?.razonSocial || '',
      interno: String(index + 1).padStart(2, '0'),
      tipoDocumento: row.tipoDocumento,
      folio: row.folio,
      fechaEmision: displayDateToIso(row.fechaDocto),
      rutProveedor: row.rutProveedor,
      razonSocial: row.razonSocial,
      total: row.montoTotal,
      pagado: 0,
      montoExento: row.montoExento,
      montoNeto: row.montoNeto,
      montoIvaRecuperable: row.montoIvaRecuperable,
      cuentaContable: row.cuentaContable,
      centroCosto: row.centroCosto,
      voucherId: voucher.id,
    }));
    mergePurchases(incoming);
    if (voucher.detalles.length > 0) {
      setComprobantes(prev => [voucher, ...prev.filter(item => item.id !== voucher.id)]);
    }
    upsertPurchaseSuppliers(setClientes, incoming, activeEmpresaId);
    setFilters(prev => ({ ...prev, periodo: bulkForm.periodoLibro }));
    setPeriodo(bulkForm.periodoLibro);
    setNotice(`Carga masiva incorporada al registro: ${incoming.length} documentos. Se genero el comprobante de centralizacion ${voucher.numero} y se actualizaron proveedores.`);
    setViewMode('list');
  };

  if (viewMode === 'bulk') {
    return (
      <div className="w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Abastecimiento / Registro de Compras</p>
            <h2 className="text-2xl font-black text-slate-900">Carga masiva de compras</h2>
          </div>
          <Button variant="secondary" icon={ChevronLeft} onClick={() => setViewMode('list')}>Volver</Button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 md:p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-600">Unidad de negocio</span>
              <select value={bulkForm.unidadNegocio} onChange={e => setBulkForm(prev => ({ ...prev, unidadNegocio: e.target.value }))} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                <option value="">Seleccionar</option>
                {unidadesNegocio.map(un => {
                  const value = un.descripcion || un.nombre || un.codigo;
                  return <option key={un.id || value} value={value}>{un.codigo ? `${un.codigo} - ` : ''}{value}</option>;
                })}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-600">Periodo del libro</span>
              <input type="month" value={bulkSelectedMonth} onChange={e => setBulkForm(prev => ({ ...prev, periodoLibro: `${e.target.value.split('-')[1]}/${e.target.value.split('-')[0]}` }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </label>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-600">Archivo Excel/CSV</span>
              <input ref={bulkFileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleBulkFile} className="hidden" />
              <Button variant="accent" icon={Upload} onClick={() => bulkFileRef.current?.click()} className="w-full">Cargar archivo</Button>
            </div>
          </div>
          {bulkNotice && <div className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">{bulkNotice}</div>}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 border-b border-slate-100">
                <tr><th className="p-3 text-left">Tipo doc</th><th className="p-3 text-left">RUT proveedor</th><th className="p-3 text-left">Razon social</th><th className="p-3 text-left">Folio</th><th className="p-3 text-left">Fecha docto</th><th className="p-3 text-right">Monto exento</th><th className="p-3 text-right">Monto neto</th><th className="p-3 text-right">IVA recuperable</th><th className="p-3 text-right">Monto total</th><th className="p-3 text-left">Cuenta contable</th><th className="p-3 text-left">Centro de costo</th></tr>
              </thead>
              <tbody>
                {bulkRows.map(row => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-mono">{row.tipoDocumento}</td><td className="p-3 font-mono">{row.rutProveedor}</td><td className="p-3 min-w-56">{row.razonSocial}</td><td className="p-3 font-mono">{row.folio}</td><td className="p-3 font-mono">{row.fechaDocto}</td><td className="p-3 text-right font-mono">{money(row.montoExento)}</td><td className="p-3 text-right font-mono">{money(row.montoNeto)}</td><td className="p-3 text-right font-mono">{money(row.montoIvaRecuperable)}</td><td className="p-3 text-right font-mono">{money(row.montoTotal)}</td>
                    <td className="p-3 min-w-56"><select value={row.cuentaContable} onChange={e => updateBulkRow(row.id, 'cuentaContable', e.target.value)} className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs"><option value="">Seleccionar</option>{planCuentaOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></td>
                    <td className="p-3 min-w-48"><select value={row.centroCosto} onChange={e => updateBulkRow(row.id, 'centroCosto', e.target.value)} className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs"><option value="">Seleccionar</option>{centroCostoOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></td>
                  </tr>
                ))}
                {bulkRows.length === 0 && <tr><td colSpan="11" className="p-10 text-center text-sm text-slate-400">Carga un archivo para previsualizar los documentos de compra.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <span className="text-xs text-slate-400">{bulkRows.length} documentos en previsualizacion</span>
            <Button variant="accent" icon={CheckCircle} onClick={saveBulkRows} disabled={bulkRows.length === 0}>Guardar carga en registro</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Abastecimiento</p>
          <h2 className="text-2xl font-black text-slate-900">Registro de Compras</h2>
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-600">Periodo</span>
            <input type="month" value={selectedMonth} onChange={e => setPeriodo(`${e.target.value.split('-')[1]}/${e.target.value.split('-')[0]}`)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </label>
          <Button variant="secondary" icon={Upload} onClick={openBulkLoad}>Carga masiva de compras</Button>
          <Button variant="accent" icon={Download} onClick={syncSii} disabled={syncing}>{syncing ? 'Sincronizando...' : 'Sincronizar con SII'}</Button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-visible">
        <div className="p-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Fecha desde</span><input type="date" value={filters.fechaDesde} onChange={e => updateFilter('fechaDesde', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
          <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Fecha hasta</span><input type="date" value={filters.fechaHasta} onChange={e => updateFilter('fechaHasta', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
          <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Folio</span><input value={filters.folio} onChange={e => updateFilter('folio', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
          <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Auxiliar</span><input value={filters.auxiliar} onChange={e => updateFilter('auxiliar', e.target.value)} placeholder="RUT o razon social" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
          <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Tipo documento</span><select value={filters.tipoDocumento} onChange={e => updateFilter('tipoDocumento', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">Todos</option>{tiposDocumento.map(tipo => <option key={tipo}>{tipo}</option>)}</select></label>
          <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Periodo</span><select value={filters.periodo} onChange={e => updateFilter('periodo', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">Todos</option>{periodos.map(p => <option key={p}>{p}</option>)}</select></label>
        </div>
        {notice && <div className="mx-4 mt-4 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">{notice}</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase text-slate-400 bg-slate-50 border-b border-slate-100">
              <tr><th className="p-3 text-left">Tipo documento</th><th className="p-3 text-left">Folio</th><th className="p-3 text-left">Fecha emision</th><th className="p-3 text-left">RUT proveedor</th><th className="p-3 text-left">Razon social</th><th className="p-3 text-right">Total</th><th className="p-3 text-right">Pagado</th><th className="p-3 text-right">Menu</th></tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3">{row.tipoDocumento}</td><td className="p-3 font-mono">{row.folio}</td><td className="p-3 font-mono text-xs">{row.fechaEmision}</td><td className="p-3 font-mono">{row.rutProveedor}</td><td className="p-3 max-w-sm truncate font-medium">{row.razonSocial}</td><td className="p-3 text-right font-mono">{money(row.total)}</td><td className="p-3 text-right font-mono">{money(row.pagado)}</td>
                  <td className="p-3 text-right relative">
                    <button onClick={() => setOpenMenu(openMenu === row.id ? null : row.id)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" title="Menu"><MoreVertical size={16}/></button>
                    {openMenu === row.id && (
                      <div className="absolute right-3 top-10 z-20 w-36 rounded-lg border border-slate-200 bg-white shadow-xl py-1 text-left">
                        <button onClick={() => { alert(`Documento ${row.tipoDocumento} ${row.folio}\nProveedor: ${row.razonSocial}\nTotal: ${money(row.total)}`); setOpenMenu(null); }} className="w-full px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2"><Eye size={13}/> Ver</button>
                        <button onClick={() => editRow(row)} className="w-full px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2"><Pencil size={13}/> Modificar</button>
                        <button onClick={() => deleteRow(row)} className="w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 size={13}/> Eliminar</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="8" className="p-10 text-center text-sm text-slate-400">No hay compras para los filtros seleccionados. Sincroniza con SII para cargar registros.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 text-xs text-slate-400 border-t border-slate-100 flex justify-between">
          <span>Mostrando {filtered.length} de {registroCompras.length} documentos</span>
          <span>Total filtrado: {money(filtered.reduce((sum, row) => sum + toAmount(row.total), 0))}</span>
        </div>
      </div>
    </div>
  );
};

const ConfigPlaceholder = ({ titulo, descripcion }) => (
  <div className="w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2">
    <div className="mb-6">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Configuraciones</p>
      <h2 className="text-2xl font-bold text-slate-900">{titulo}</h2>
    </div>
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-24 text-center space-y-3">
      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
        <Wrench size={28} className="text-slate-400"/>
      </div>
      <p className="text-slate-600 font-semibold">{titulo}</p>
      <p className="text-slate-400 text-sm max-w-xs">{descripcion || 'Este módulo estará disponible próximamente.'}</p>
    </div>
  </div>
);

// --- AUTH: LOGIN ---
const LoginPage = () => {
  const { setLoggedInUser, setActiveEmpresaId } = useContext(ERPContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    localStorage.removeItem('sentauris_session');
    localStorage.removeItem('sentauris_active_empresa');
    setActiveEmpresaId('');
  }, [setActiveEmpresaId]);

  const doLogin = (session) => {
    setActiveEmpresaId('');
    localStorage.removeItem('sentauris_active_empresa');
    setLoggedInUser(session);
    localStorage.setItem('sentauris_session', JSON.stringify(session));
  };

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    const user = username.trim().toLowerCase();
    const pass = password.trim();

    // Superadmin hardcoded
    if (user === 'admin' && pass === 'admin123') {
      doLogin({ isSuperadmin: true, usuario: 'admin', nombre: 'Administrador', cargo: 'Superadmin', accesos: [] });
      return;
    }

    setChecking(true);
    try {
      const { data, error: dbError } = await supabase
        .from('usuarios')
        .select('*')
        .ilike('usuario', user)
        .single();

      if (dbError || !data) {
        setError('Usuario no encontrado.');
        return;
      }
      if ((data.contrasena || '').trim() !== pass) {
        setError('Contraseña incorrecta.');
        return;
      }
      doLogin({ ...data, accesos: data.accesos || [], permisosEmpresas: data.permisos_empresas || {}, isSuperadmin: false });
    } catch {
      setError('Error al conectar con el servidor.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/40">
            <TrendingUp size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">{APP_NAME}</h1>
          <p className="text-slate-400 text-sm mt-1">Ingresa tus credenciales para continuar</p>
        </div>
        <form onSubmit={handleLogin} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-5 shadow-2xl">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Usuario</label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input value={username} onChange={e => setUsername(e.target.value)}
                placeholder="Nombre de usuario" autoComplete="username"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white px-3 py-2.5 pl-9 text-sm placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contraseña</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Contraseña" autoComplete="current-password"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white px-3 py-2.5 pl-9 pr-10 text-sm placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertCircle size={13} /> {error}
            </div>
          )}
          <button type="submit" disabled={checking}
            className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 active:scale-[.98] transition-all shadow-lg shadow-blue-900/30 disabled:opacity-60 disabled:cursor-not-allowed">
            {checking ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- AUTH: ACCESO DENEGADO ---
const AccessDenied = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-in fade-in">
    <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
      <ShieldAlert size={32} className="text-red-500" />
    </div>
    <h2 className="text-xl font-bold text-slate-800">Acceso Denegado</h2>
    <p className="text-slate-500 text-sm max-w-xs">No tienes permiso para acceder a este módulo. Contacta al administrador.</p>
  </div>
);

// --- LAYOUT ---
const Sidebar = () => {
  const { activeModule, setActiveModule, sidebarOpen, currentUser, loggedInUser, logout, activeEmpresaId } = useContext(ERPContext);
  const [expandedMenus, setExpandedMenus] = useState(() => new Set());
  const toggleExpand = (id) => setExpandedMenus(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const opSubId = (label) => ({
    'Nuevo Registro': 'operaciones-registro',
    'Planificacion': 'operaciones-planificacion',
    'Historial Preventivo': 'operaciones-historial-preventivo',
    'Historial Correctivo': 'operaciones-historial-correctivo',
    'Cotizaciones': 'operaciones-cotizaciones',
    'Historial Cotizaciones': 'operaciones-historial-cotizaciones',
    'OC Recibidas': 'operaciones-oc-recibidas',
    'Rendiciones': 'operaciones-rendiciones',
    'Historial Rendiciones': 'operaciones-historial-rendiciones',
  }[label] || 'operaciones-registro');

  const isSuperadmin = loggedInUser?.isSuperadmin || false;
  const accesos = loggedInUser?.accesos || [];
  const companyAccess = activeEmpresaId ? loggedInUser?.permisosEmpresas?.[activeEmpresaId] : null;
  const effectiveAccess = companyAccess || accesos;
  const hasCompanyPermissions = activeEmpresaId && loggedInUser?.permisosEmpresas && Object.keys(loggedInUser.permisosEmpresas).length > 0;
  const canAccess = (id) => {
    if (isSuperadmin) return true;
    if (hasCompanyPermissions && !companyAccess) return false;
    return effectiveAccess.length === 0 || effectiveAccess.includes(id);
  };
  const configSubId = (label) => ({
    'Empresas':                'configuraciones-empresas',
    'Plan de Cuentas':         'configuraciones-plan-cuentas',
    'Tipo de Documentos':      'configuraciones-tipo-documentos',
    'Impuestos y Retenciones': 'configuraciones-impuestos',
    'Parámetros':              'configuraciones-parametros',
    'Seguridad':               'configuraciones-seguridad',
    'Flujo de Aprobación':     'configuraciones-flujo-aprobacion',
  }[label] || 'configuraciones-empresas');
  const abastecimientoSubId = (label) => ({
    'Documentos': 'abastecimiento-documentos',
    'Internacion': 'abastecimiento-internacion',
    'Informe de Compras': 'abastecimiento-informe-compras',
    'Registro de Compras': 'abastecimiento-registro-compras',
  }[label] || 'abastecimiento-documentos');
  const mantenedorSubId = (label) => ({
    'Clientes y/o Proveedores': 'mantenedores-clientes',
    'Clientes': 'mantenedores-clientes',
    'Licitaciones': 'mantenedores-licitaciones',
    'Equipos': 'mantenedores-equipos',
    'Repuestos': 'mantenedores-repuestos',
    'Usuarios': 'mantenedores-usuarios',
  }[label] || 'mantenedores-clientes');

  const subIdFor = (item, label) => {
    if (item.id.startsWith('operaciones'))     return opSubId(label);
    if (item.id.startsWith('abastecimiento'))  return abastecimientoSubId(label);
    if (item.id.startsWith('mantenedores'))    return mantenedorSubId(label);
    if (item.id.startsWith('configuraciones')) return configSubId(label);
    if (item.id.startsWith('contabilidad')) {
      return {
        'Comprobantes': 'contabilidad-comprobantes',
        'Informes Tributarios': 'contabilidad-informes-tributarios',
        'Estados Financieros': 'contabilidad-estados-financieros',
      }[label] || 'contabilidad-comprobantes';
    }
    return `${item.id.split('-')[0]}-${label.toLowerCase()}`;
  };
  const visibleSubs = (item) =>
    isSuperadmin ? item.sub : item.sub.filter(s => canAccess(subIdFor(item, s)));
  const showParent = (item) =>
    item.sub ? visibleSubs(item).length > 0 : canAccess(item.id);

  const menuTop = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'operaciones-registro', label: 'Operaciones', icon: ClipboardList, sub: ['Nuevo Registro', 'Planificacion', 'Historial Preventivo', 'Historial Correctivo', 'Cotizaciones', 'Historial Cotizaciones', 'OC Recibidas', 'Rendiciones', 'Historial Rendiciones'] },
    { id: 'comercial', label: 'Comercial', icon: TrendingUp },
    { id: 'abastecimiento-documentos', label: 'Abastecimiento', icon: Upload, sub: ['Documentos', 'Internacion', 'Informe de Compras', 'Registro de Compras'] },
    { id: 'contabilidad', label: 'Contabilidad', icon: FileText, sub: ['Comprobantes', 'Informes Tributarios', 'Estados Financieros'] },
    { id: 'calidad', label: 'Calidad', icon: CheckCircle2 },
    { id: 'personas', label: 'Gestión de Personas', icon: Users },
  ];
  const menuBottom = [
    { id: 'mantenedores-clientes',   label: 'Mantenedores',    icon: Database,  sub: ['Clientes y/o Proveedores', 'Licitaciones', 'Equipos', 'Repuestos', 'Usuarios'] },
    { id: 'configuraciones-empresas',label: 'Configuraciones', icon: Settings,  sub: ['Empresas', 'Plan de Cuentas', 'Tipo de Documentos', 'Impuestos y Retenciones', 'Parámetros', 'Seguridad', 'Flujo de Aprobación'] },
  ];

  const renderItems = (items) => items.filter(showParent).map(item => {
    const isActiveParent = activeModule.startsWith(item.id.split('-')[0]);
    const isExpanded = isActiveParent || expandedMenus.has(item.id);
    const handleParentClick = () => {
      if (item.sub) {
        toggleExpand(item.id);
      } else {
        setActiveModule(item.id);
      }
    };
    return (
      <div key={item.id} className="space-y-1">
        <button onClick={handleParentClick}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${isActiveParent ? 'bg-blue-600 text-white' : 'hover:bg-slate-900 hover:text-white'}`}>
          <item.icon size={20} />
          {sidebarOpen && <span className="text-sm font-semibold max-lg:hidden flex-1 text-left">{item.label}</span>}
          {sidebarOpen && item.sub && (
            <ChevronLeft size={14} className={`max-lg:hidden transition-transform duration-200 ${isExpanded ? '-rotate-90' : 'rotate-180'}`} />
          )}
        </button>
        {sidebarOpen && item.sub && isExpanded && (
          <div className="ml-9 space-y-1 border-l border-slate-800 pl-3 max-lg:hidden">
            {visibleSubs(item).map(s => {
              const sid = subIdFor(item, s);
              return (
                <button key={s} onClick={() => setActiveModule(sid)}
                  className={`text-xs py-2 block font-medium transition-colors ${activeModule === sid ? 'text-blue-400' : 'hover:text-blue-400'}`}>
                  {s}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  });

  return (
    <div className={`${sidebarOpen ? 'w-64 max-lg:w-20' : 'w-20'} bg-slate-950 h-screen transition-all duration-300 flex flex-col fixed left-0 top-0 z-50 text-slate-400 border-r border-slate-800`}>
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0"><TrendingUp size={24} /></div>
        {sidebarOpen && <span className="font-black text-xl text-white tracking-tighter max-lg:hidden">{APP_NAME}</span>}
      </div>
      <nav className="flex-1 px-3 mt-4 overflow-y-auto min-h-0">
        <div className="space-y-1">{renderItems(menuTop)}</div>
        <div className="border-t border-slate-800 pt-2 mt-2 space-y-1">{renderItems(menuBottom)}</div>
      </nav>
      <div className="p-4 bg-slate-900/50 border-t border-slate-800">
        <div className="flex items-center gap-3 w-full p-2 rounded-lg">
          <img src={currentUser.avatar} className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0" alt="Profile" />
          {sidebarOpen && (
            <div className="text-left overflow-hidden max-lg:hidden">
              <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 uppercase font-black truncate">{currentUser.position}</p>
            </div>
          )}
        </div>
        <button onClick={logout} className="mt-3 flex items-center gap-3 w-full px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
          <LogOut size={18} />{sidebarOpen && <span className="text-sm font-bold max-lg:hidden">Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
};

const Header = () => {
  const { setSidebarOpen, sidebarOpen, activeModule, empresas, activeEmpresaId, setActiveEmpresaId, getAccessibleEmpresaIds } = useContext(ERPContext);
  const titleMap = {
    'dashboard': 'Dashboard Principal',
    'operaciones-registro': 'Nueva Operación',
    'operaciones-preventiva': 'Mantención Preventiva',
    'operaciones-correctiva': 'Mantención Correctiva',
    'operaciones-historial-preventivo': 'Historial / Mantenimiento Preventivo',
    'operaciones-historial-correctivo': 'Historial / Mantenimiento Correctivo',
    'operaciones-cotizaciones': 'Operaciones / Cotizaciones',
    'operaciones-historial-cotizaciones': 'Operaciones / Historial Cotizaciones',
    'operaciones-oc-recibidas': 'Operaciones / OC Recibidas',
    'operaciones-rendiciones': 'Operaciones / Nueva Rendición',
    'operaciones-historial-rendiciones': 'Operaciones / Historial Rendiciones',
    'abastecimiento-documentos': 'Abastecimiento / Documentos',
    'abastecimiento-internacion': 'Abastecimiento / Internacion',
    'abastecimiento-informe-compras': 'Abastecimiento / Informe de Compras',
    'abastecimiento-registro-compras': 'Abastecimiento / Registro de Compras',
    'contabilidad-comprobantes': 'Contabilidad / Comprobantes',
    'contabilidad-informes-tributarios': 'Contabilidad / Informes Tributarios',
    'contabilidad-estados-financieros': 'Contabilidad / Estados Financieros',
    'mantenedores-clientes': 'Mantenedores / Clientes y/o Proveedores',
    'mantenedores-licitaciones': 'Mantenedores / Licitaciones',
    'mantenedores-equipos': 'Mantenedores / Equipos',
    'mantenedores-repuestos': 'Mantenedores / Repuestos',
    'mantenedores-usuarios':                'Mantenedores / Usuarios',
    'configuraciones-empresas':             'Configuraciones / Empresas',
    'configuraciones-plan-cuentas':         'Configuraciones / Plan de Cuentas',
    'configuraciones-tipo-documentos':      'Configuraciones / Tipo de Documentos',
    'configuraciones-impuestos':            'Configuraciones / Impuestos y Retenciones',
    'configuraciones-parametros':           'Configuraciones / Parámetros',
    'configuraciones-seguridad':            'Configuraciones / Seguridad',
    'configuraciones-flujo-aprobacion':     'Configuraciones / Flujo de Aprobación',
  };
  const allowedEmpresaIds = getAccessibleEmpresaIds();
  const accessibleEmpresas = empresas.filter(e => allowedEmpresaIds.includes(e.id));
  return (
    <header className="min-h-16 bg-white border-b border-slate-100 flex items-center justify-between gap-4 px-4 md:px-8 py-3 sticky top-0 z-40">
      <div className="flex items-center gap-3 md:gap-6 min-w-0">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
          <ChevronLeft className={`transition-transform duration-300 ${!sidebarOpen ? 'rotate-180' : ''}`} />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-slate-400 text-sm">ERP</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-bold text-sm uppercase tracking-wider truncate">{titleMap[activeModule] || activeModule}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        {accessibleEmpresas.length > 0 && (
          <select value={activeEmpresaId} onChange={e => setActiveEmpresaId(e.target.value)}
            className="hidden lg:block max-w-56 rounded-full border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            title="Seleccionar empresa activa">
            {accessibleEmpresas.map(emp => <option key={emp.id} value={emp.id}>{emp.razonSocial || emp.nombreFantasia || emp.rut}</option>)}
          </select>
        )}
        <div className="relative hidden xl:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Buscador global..." className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-xs focus:outline-none w-64" />
        </div>
        <button className="p-2 text-slate-400 hover:text-blue-600 relative transition-colors">
          <Bell size={20} /><span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><User size={20} /></button>
      </div>
    </header>
  );
};

const CompanySessionModal = () => {
  const { empresas, activeEmpresaId, setActiveEmpresaId, getAccessibleEmpresaIds, logout, loggedInUser } = useContext(ERPContext);
  const accessibleEmpresas = empresas.filter(e => getAccessibleEmpresaIds(loggedInUser).includes(e.id));
  const [selectedId, setSelectedId] = useState(accessibleEmpresas[0]?.id || '');

  useEffect(() => {
    if (!selectedId && accessibleEmpresas[0]?.id) setSelectedId(accessibleEmpresas[0].id);
  }, [selectedId, accessibleEmpresas]);

  if (activeEmpresaId || accessibleEmpresas.length === 0) return null;

  const selected = accessibleEmpresas.find(e => e.id === selectedId);
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xl backdrop-saturate-0">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
        <div className="px-6 py-5 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Seleccion de empresa</p>
          <h3 className="text-xl font-black text-slate-900">Elige a que empresa quieres ingresar</h3>
          <p className="mt-1 text-sm text-slate-500">Tu sesion usara los modulos y permisos configurados para la empresa seleccionada.</p>
        </div>
        <div className="p-6 space-y-4">
          <label className="block">
            <span className="block text-xs font-bold text-slate-500 uppercase mb-2">Empresa</span>
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              {accessibleEmpresas.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.razonSocial || emp.nombreFantasia || emp.rut}</option>
              ))}
            </select>
          </label>
          {selected && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
              <p className="font-bold text-slate-800">{selected.razonSocial || selected.nombreFantasia}</p>
              <p className="text-xs text-slate-500 mt-1">RUT: {selected.rut || 'Sin RUT'} · Moneda: {selected.moneda || 'CLP'}</p>
              <p className="text-xs text-slate-500 mt-1">Modulos habilitados: {(selected.modulosPermitidos || []).length || 'Todos'}</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button onClick={logout} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-white transition-colors">
            Cerrar sesion
          </button>
          <button disabled={!selectedId} onClick={() => setActiveEmpresaId(selectedId)}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            Ingresar a la empresa
          </button>
        </div>
      </div>
    </div>
  );
};

const ContentManager = () => {
  const { activeModule, sidebarOpen, loggedInUser, activeEmpresaId } = useContext(ERPContext);

  if (!loggedInUser) return <LoginPage />;

  // Sub-pages accessible if parent module is accessible
  const MODULE_PARENT = {
    'operaciones-preventiva': 'operaciones-registro',
    'operaciones-correctiva': 'operaciones-registro',
    'abastecimiento-documentos': 'abastecimiento',
    'abastecimiento-internacion': 'abastecimiento',
    'abastecimiento-informe-compras': 'abastecimiento',
    'abastecimiento-registro-compras': 'abastecimiento',
    'contabilidad-comprobantes': 'contabilidad',
    'contabilidad-informes-tributarios': 'contabilidad',
    'contabilidad-estados-financieros': 'contabilidad',
  };
  const canAccess = (id) => {
    if (loggedInUser.isSuperadmin) return true;
    const companyAccess = activeEmpresaId ? loggedInUser.permisosEmpresas?.[activeEmpresaId] : null;
    const hasCompanyPermissions = activeEmpresaId && loggedInUser.permisosEmpresas && Object.keys(loggedInUser.permisosEmpresas).length > 0;
    if (hasCompanyPermissions && !companyAccess) return false;
    const acc = companyAccess || loggedInUser.accesos || [];
    if (acc.length === 0) return true;
    if (acc.includes(id)) return true;
    const parent = MODULE_PARENT[id];
    return parent ? acc.includes(parent) : false;
  };

  const renderModule = () => {
    if (!canAccess(activeModule)) return <AccessDenied />;
    switch (activeModule) {
      case 'dashboard': return <Dashboard />;
      case 'operaciones-registro': return <NuevoRegistro />;
      case 'operaciones-preventiva': return <MantencionPreventiva />;
      case 'operaciones-correctiva': return <MantencionCorrectiva />;
      case 'operaciones-historial-preventivo': return <HistorialMantenciones tipo="preventiva" />;
      case 'operaciones-historial-correctivo': return <HistorialMantenciones tipo="correctiva" />;
      case 'operaciones-cotizaciones': return <Cotizaciones />;
      case 'operaciones-historial-cotizaciones': return <HistorialCotizaciones />;
      case 'operaciones-oc-recibidas': return <OCRecibidas />;
      case 'operaciones-rendiciones': return <NuevaRendicion />;
      case 'operaciones-historial-rendiciones': return <HistorialRendiciones />;
      case 'abastecimiento-documentos': return <AbastecimientoDocumentos />;
      case 'abastecimiento-internacion': return <AbastecimientoPlaceholder titulo="Internacion" />;
      case 'abastecimiento-informe-compras': return <AbastecimientoPlaceholder titulo="Informe de Compras" />;
      case 'abastecimiento-registro-compras': return <RegistroCompras />;
      case 'contabilidad-comprobantes': return <ComprobantesContables />;
      case 'contabilidad-informes-tributarios': return <InformesTributarios />;
      case 'contabilidad-estados-financieros': return <EstadosFinancieros />;
      case 'mantenedores-clientes': return <MantenedoresClientesProveedores />;
      case 'mantenedores-licitaciones': return <MantenedoresLicitaciones />;
      case 'mantenedores-equipos': return <MantenedoresEquipos />;
      case 'mantenedores-repuestos': return <MantenedoresRepuestos />;
      case 'mantenedores-usuarios':             return <MantenedoresUsuarios />;
      case 'configuraciones-empresas':          return <ConfigEmpresas />;
      case 'configuraciones-plan-cuentas':      return <ConfigPlanCuentas />;
      case 'configuraciones-tipo-documentos':   return <ConfigTipoDocumentos />;
      case 'configuraciones-impuestos':         return <ConfigPlaceholder titulo="Impuestos y Retenciones" />;
      case 'configuraciones-parametros':        return <ConfigParametros />;
      case 'configuraciones-seguridad':         return <ConfigPlaceholder titulo="Seguridad" />;
      case 'configuraciones-flujo-aprobacion':  return <ConfigPlaceholder titulo="Flujo de Aprobación" />;
      default: return <Dashboard />;
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar />
      <div className={`min-w-0 overflow-hidden transition-all duration-300 ${sidebarOpen ? 'ml-64 max-lg:ml-20' : 'ml-20'}`}>
        <Header />
        <main className="min-w-0 p-4 md:p-8">{renderModule()}</main>
      </div>
      <CompanySessionModal />
    </div>
  );
};

const App = () => (
  <ERPProvider>
    <ContentManager />
  </ERPProvider>
);

export default App;

