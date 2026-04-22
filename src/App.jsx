import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard, User, ClipboardList, TrendingUp, FileText, Users, LogOut,
  Search, Bell, ChevronLeft, Wrench, CheckCircle2, AlertCircle,
  Mail, FileDown, Camera, Trash2, Cpu, Database, Upload, Download,
  FileSpreadsheet, X, CheckCircle, AlertTriangle, Plus, Pencil,
  Lock, Eye, EyeOff, ShieldAlert, Settings, MoreVertical, ArrowUpDown, Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from './supabaseClient';

// --- CONSTANTES ---
const APP_NAME = "Sentauris ERP";

const MOCK_USER = {
  id: 'u1', name: 'Arquitecto Senior', email: 'admin@sentauris.cl',
  rut: '',
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

const cloneProtocol = (protocol) => JSON.parse(JSON.stringify(protocol));
const PREVENTIVE_PROTOCOL_KEYS = [
  { id: 'camas', label: 'Camas', match: ['cama', 'camilla', 'mubi'] },
  { id: 'monitores', label: 'Monitores', match: ['monitor', 'multiparametro', 'signosvitales'] },
  { id: 'lamparas', label: 'Lamparas', match: ['lampara', 'quirurgica'] },
  { id: 'otros', label: 'Otros', match: [] },
];
const defaultPreventiveProtocolByKey = (key) => cloneProtocol({
  camas: PREVENTIVE_PROTOCOLS.camas,
  monitores: PREVENTIVE_PROTOCOLS.monitores,
  lamparas: PREVENTIVE_PROTOCOLS.lamparas,
  otros: GENERIC_PREVENTIVE_PROTOCOL,
}[key] || GENERIC_PREVENTIVE_PROTOCOL);
const defaultPreventiveProtocolsConfig = () => PREVENTIVE_PROTOCOL_KEYS.reduce((acc, item) => {
  acc[item.id] = defaultPreventiveProtocolByKey(item.id);
  return acc;
}, {});
const normalizeProtocolCriticidad = (value) => normalizeKey(value) === 'critico' ? 'Critico' : 'No critico';
const protocolItemLabel = (item) => typeof item === 'string' ? item : (item?.label || item?.name || item?.item || '');
const protocolItemCriticidad = (item) => typeof item === 'object' && item ? normalizeProtocolCriticidad(item.criticidad) : 'No critico';
const protocolItemRequired = (item) => typeof item === 'object' && item ? Boolean(item.obligatorio ?? item.required) : false;
const preventiveProtocolKeyFor = (tipoEquipo = '') => {
  const key = normalizeKey(tipoEquipo);
  if (key.includes('monitor') || key.includes('multiparametro') || key.includes('signosvitales')) return 'monitores';
  if (key.includes('lampara') || key.includes('quirurgica')) return 'lamparas';
  if (key.includes('cama') || key.includes('camilla') || key.includes('mubi')) return 'camas';
  return 'otros';
};
const normalizePreventiveProtocol = (protocol, key = 'otros') => {
  const fallback = defaultPreventiveProtocolByKey(key);
  return {
    title: protocol?.title || fallback.title,
    sections: Array.isArray(protocol?.sections) && protocol.sections.length > 0
      ? protocol.sections.map(section => ({
          section: section.section || 'Seccion',
          items: Array.isArray(section.items)
            ? section.items.map(item => ({
                label: protocolItemLabel(item),
                criticidad: protocolItemCriticidad(item),
                obligatorio: protocolItemRequired(item),
              })).filter(item => item.label)
            : [],
        }))
      : fallback.sections,
  };
};
const getPreventiveProtocol = (tipoEquipo = '', customProtocols = {}) => {
  const protocolKey = preventiveProtocolKeyFor(tipoEquipo);
  return normalizePreventiveProtocol(customProtocols?.[protocolKey], protocolKey);
};

const looksLikeEmail = (value) => String(value || '').includes('@');
const looksLikeTimestamp = (value) => /^\d{4}-\d{2}-\d{2}/.test(String(value || ''));
const normalizeKey = (value) => String(value || '').toLowerCase().replace(/[\s.]/g, '').trim();
const normalizeRutKey = (value) => normalizeKey(value).replace(/[^0-9k]/g, '');
const isNetworkFetchError = (err) => /failed to fetch|fetch failed|networkerror|econn|etimedout/i.test(String(err?.message || err || ''));
const isMissingTableError = (err, table) => {
  const message = String(err?.message || err || '').toLowerCase();
  const expected = table ? [`table 'public.${table}'`, `relation "public.${table}" does not exist`] : ['could not find the table', 'does not exist'];
  return ['PGRST205', '42P01'].includes(err?.code) || expected.some(text => message.includes(text));
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
  direccionPrincipal: cliente.direccionPrincipal || cliente.direccion_principal || '',
  comuna: cliente.comuna || '',
  ciudad: cliente.ciudad || '',
  region: cliente.region || '',
  pais: cliente.pais || 'Chile',
  telefono: cliente.telefono || '',
  giro: cliente.giro || '',
  nombreFantasia: cliente.nombreFantasia || cliente.nombre_fantasia || '',
  tipoCliente: cliente.tipoCliente || cliente.tipo_cliente || 'No',
  tipoProveedor: cliente.tipoProveedor || cliente.tipo_proveedor || 'No',
  correoSii: cliente.correoSii || cliente.correo_sii || '',
  correoComercial: cliente.correoComercial || cliente.correo_comercial || '',
  plazoPago: cliente.plazoPago || cliente.plazo_pago || '',
  sucursales: cliente.sucursales || [],
}) : cliente;

const clienteBasePayload = (data) => ({
  name: data.name,
  rut: data.rut || null,
  empresa_id: data.empresaId || data.empresa_id || null,
});

const clienteFullPayload = (data) => ({
  ...clienteBasePayload(data),
  Encargado_Contrato:     data.encargado_contrato || null,
  Email_contacto:         data.email_contacto     || data.email || null,
  direccion_principal:    data.direccionPrincipal || data.direccion_principal || null,
  comuna:                 data.comuna             || null,
  ciudad:                 data.ciudad             || null,
  region:                 data.region             || null,
  pais:                   data.pais               || null,
  telefono:               data.telefono           || null,
  giro:                   data.giro               || null,
  nombre_fantasia:        data.nombreFantasia     || data.nombre_fantasia || null,
  tipo_cliente:           data.tipoCliente        || null,
  tipo_proveedor:         data.tipoProveedor      || null,
  correo_sii:             data.correoSii          || null,
  correo_comercial:       data.correoComercial    || null,
  plazo_pago:             data.plazoPago          || null,
  sucursales:             data.sucursales?.length ? data.sucursales : null,
});

const clienteExtendedSnapshot = (data = {}) => ({
  id: data.id || data.id_RUT || '',
  id_RUT: data.id_RUT || data.id || '',
  rut: data.rut || '',
  razonSocial: data.razonSocial || data.name || '',
  name: data.name || data.razonSocial || '',
  email: data.email || data.correoComercial || data.correoSii || '',
  empresaId: data.empresaId || data.empresa_id || null,
  empresa_id: data.empresa_id || data.empresaId || null,
  encargado_contrato: data.encargado_contrato || '',
  email_contacto: data.email_contacto || '',
  direccionPrincipal: data.direccionPrincipal || data.direccion_principal || '',
  direccion_principal: data.direccion_principal || data.direccionPrincipal || '',
  comuna: data.comuna || '',
  ciudad: data.ciudad || '',
  region: data.region || '',
  pais: data.pais || 'Chile',
  telefono: data.telefono || '',
  giro: data.giro || '',
  nombreFantasia: data.nombreFantasia || data.nombre_fantasia || '',
  tipoCliente: data.tipoCliente || data.tipo_cliente || 'No',
  tipoProveedor: data.tipoProveedor || data.tipo_proveedor || 'No',
  correoSii: data.correoSii || data.correo_sii || '',
  correoComercial: data.correoComercial || data.correo_comercial || '',
  plazoPago: data.plazoPago || data.plazo_pago || '',
  sucursales: Array.isArray(data.sucursales) ? data.sucursales : [],
});

const mergeClientesExtended = (baseClientes = [], extendedClientes = []) => {
  const byId = new Map();
  const byRut = new Map();
  (extendedClientes || []).forEach(item => {
    const normalized = normalizeCliente(clienteExtendedSnapshot(item));
    if (normalized.id) byId.set(String(normalized.id), normalized);
    if (normalized.rut) byRut.set(normalizeKey(normalized.rut), normalized);
  });
  return baseClientes.map(cliente => {
    const ext = byId.get(String(cliente.id || cliente.id_RUT || '')) || byRut.get(normalizeKey(cliente.rut));
    return ext ? { ...cliente, ...ext, id: cliente.id, id_RUT: cliente.id_RUT || cliente.id, empresaId: ext.empresaId || cliente.empresaId } : cliente;
  });
};

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
  preventivaFirmaRecepcion: '', preventivaRecibidoPor: '', preventivaCargoRecepcion: '',
  correctivaCondicionInicial: '', correctivaDiagnostico: '',
  correctivaConclusion: '', correctivaCondicionFinal: '',
  correctivaFotos: [], correctivaFirma: '', correctivaRepuestos: [],
  correctivaEstadoInterno: '', correctivaFirmaRecepcion: '',
  correctivaRecibidoPor: '', correctivaCargoRecepcion: '',
  correctivaGarantiaContrato: false, correctivaOrigenGarantiaFolio: ''
});

const PREVENTIVA_OBS_PREFIX = '__PREVENTIVA_JSON__';
const CORRECTIVA_OBS_PREFIX = '__CORRECTIVA_JSON__';
const DEFAULT_CORRECTIVA_CONCLUSION_PROMPT = 'Redacta la conclusion como un analisis causal tecnico del daño del repuesto o componente asociado a la falla. Explica la causa probable, el efecto sobre el funcionamiento del equipo y una solucion tecnica concreta. Usa un tono profesional y natural, sin citar textualmente el hallazgo ni mencionar instrucciones internas.';
const PERM_MODIFICAR_CORRECTIVA_EJECUTADA = 'perm-modificar-correctiva-ejecutada';
const DEFAULT_CONDICION_FINAL_CORRECTIVA = 'Tras la ejecución de las pruebas funcionales pertinentes, se constató que el equipo opera conforme a lo especificado, lo que confirma su operatividad.';
const DEFAULT_ESTADOS_INTERNOS_CORRECTIVA = ['Ingresado', 'Garantía', 'En revisión', 'En reparación', 'Esperando Repuestos', 'Listo para Entrega', 'Ejecutado'];

const normalizeEstadoInterno = (value) => String(value || '').trim();
const dedupeByNormalizedText = (values = []) => {
  const seen = new Set();
  return values
    .map(value => String(value || '').trim())
    .filter(value => {
      const key = normalizeKey(value);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};
const ensureDefaultEstadosInternos = (values = [], { preserveEmpty = false } = {}) => {
  const source = Array.isArray(values) && values.length > 0 ? values : DEFAULT_ESTADOS_INTERNOS_CORRECTIVA;
  const merged = [...source, 'Ejecutado']
    .map(value => preserveEmpty ? String(value ?? '') : normalizeEstadoInterno(value));
  const seen = new Set();
  return merged.filter(value => {
    const key = normalizeKey(value);
    if (!key) return preserveEmpty;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
const isEstadoEjecutado = (value) => normalizeKey(value) === 'ejecutado';

const buildPreventivaObservaciones = ({ observaciones, checklist, firma, firmaRecepcion, recibidoPor, cargoRecepcion, tecnicoNombre, tecnicoRut }) =>
  `${PREVENTIVA_OBS_PREFIX}${JSON.stringify({
    observaciones: observaciones || '',
    checklist: checklist || {},
    firma: firma || '',
    firmaRecepcion: firmaRecepcion || '',
    recibidoPor: recibidoPor || '',
    cargoRecepcion: cargoRecepcion || '',
    tecnicoNombre: tecnicoNombre || '',
    tecnicoRut: tecnicoRut || ''
  })}`;

const parsePreventivaObservaciones = (value = '') => {
  const text = String(value || '');
  if (text.startsWith(PREVENTIVA_OBS_PREFIX)) {
    try {
      const parsed = JSON.parse(text.slice(PREVENTIVA_OBS_PREFIX.length));
      return {
        observaciones: parsed.observaciones || '',
        checklist: parsed.checklist && typeof parsed.checklist === 'object' ? parsed.checklist : {},
        firma: parsed.firma || '',
        firmaRecepcion: parsed.firmaRecepcion || '',
        recibidoPor: parsed.recibidoPor || '',
        cargoRecepcion: parsed.cargoRecepcion || '',
        tecnicoNombre: parsed.tecnicoNombre || '',
        tecnicoRut: parsed.tecnicoRut || ''
      };
    } catch {
      return { observaciones: text, checklist: {}, firma: '', firmaRecepcion: '', recibidoPor: '', cargoRecepcion: '', tecnicoNombre: '', tecnicoRut: '' };
    }
  }
  return { observaciones: text, checklist: {}, firma: '', firmaRecepcion: '', recibidoPor: '', cargoRecepcion: '', tecnicoNombre: '', tecnicoRut: '' };
};

const normalizePreventiveChecklistEntry = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const estado = String(value.estado || '').trim();
    const criticidad = normalizeKey(value.criticidad) === 'critico' ? 'Critico' : 'No critico';
    return {
      criticidad,
      estado,
      falla: criticidad === 'Critico' && estado === 'No' ? Boolean(value.falla) : false,
    };
  }
  const legacyEstado = String(value || '').trim();
  return {
    criticidad: 'No critico',
    estado: legacyEstado === 'Falla' ? 'No' : legacyEstado,
    falla: legacyEstado === 'Falla',
  };
};

const preventiveEntryMatches = (value, status) => {
  const entry = normalizePreventiveChecklistEntry(value);
  if (status === 'Falla') return entry.falla;
  return entry.estado === status;
};

const preventiveChecklistEstadoForDb = (value) => {
  const entry = normalizePreventiveChecklistEntry(value);
  if (!entry.estado) return '';
  if (entry.falla) return 'Falla';
  return entry.estado;
};

const derivePreventiveFinalStatus = (checklist = {}) => {
  const entries = Object.values(checklist).map(normalizePreventiveChecklistEntry);
  if (entries.some(entry => entry.criticidad === 'Critico' && entry.estado === 'No' && entry.falla)) return 'No Operativo';
  if (entries.some(entry => entry.estado === 'No')) return 'Operativo con Obs.';
  return 'Operativo';
};

const buildCorrectivaObservaciones = ({ condicionInicial, diagnostico, conclusion, condicionFinal, fotos, firma, firmaRecepcion, recibidoPor, cargoRecepcion, garantiaContrato, origenGarantiaFolio, repuestosGarantia }) =>
  `${CORRECTIVA_OBS_PREFIX}${JSON.stringify({
    condicionInicial: condicionInicial || '',
    diagnostico: diagnostico || '',
    conclusion: conclusion || '',
    condicionFinal: condicionFinal || '',
    fotos: Array.isArray(fotos) ? fotos : [],
    firma: firma || '',
    firmaRecepcion: firmaRecepcion || '',
    recibidoPor: recibidoPor || '',
    cargoRecepcion: cargoRecepcion || '',
    garantiaContrato: Boolean(garantiaContrato),
    origenGarantiaFolio: origenGarantiaFolio || '',
    repuestosGarantia: Array.isArray(repuestosGarantia) ? repuestosGarantia : []
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
        firma: parsed.firma || '',
        firmaRecepcion: parsed.firmaRecepcion || '',
        recibidoPor: parsed.recibidoPor || '',
        cargoRecepcion: parsed.cargoRecepcion || '',
        garantiaContrato: Boolean(parsed.garantiaContrato),
        origenGarantiaFolio: parsed.origenGarantiaFolio || '',
        repuestosGarantia: Array.isArray(parsed.repuestosGarantia) ? parsed.repuestosGarantia : []
      };
    } catch {
      return { condicionInicial: '', diagnostico: text, conclusion: '', condicionFinal: DEFAULT_CONDICION_FINAL_CORRECTIVA, fotos: [], firma: '', firmaRecepcion: '', recibidoPor: '', cargoRecepcion: '', garantiaContrato: false, origenGarantiaFolio: '', repuestosGarantia: [] };
    }
  }
  const [condicionInicial = '', diagnostico = '', conclusion = ''] = text.split(/\n{2,}/);
  return { condicionInicial, diagnostico, conclusion, condicionFinal: DEFAULT_CONDICION_FINAL_CORRECTIVA, fotos: [], firma: '', firmaRecepcion: '', recibidoPor: '', cargoRecepcion: '', garantiaContrato: false, origenGarantiaFolio: '', repuestosGarantia: [] };
};

const correctivaText = (data) =>
  [data.condicionInicial, data.diagnostico, data.conclusion, data.condicionFinal].filter(Boolean).join('\n\n');

const htmlText = (value = '') =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');

const formatPdfDate = (value = '') => {
  const text = String(value || '').trim();
  if (!text) return '';
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const reportVerificationUrl = (tipo = 'preventiva', orden = {}) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const params = new URLSearchParams({ verify: tipo });
  if (orden.id) params.set('orden', orden.id);
  if (orden.folio) params.set('folio', orden.folio);
  return `${origin}/?${params.toString()}`;
};

const preventiveVerificationUrl = (orden = {}) => reportVerificationUrl('preventiva', orden);

const qrImageUrl = (value = '') =>
  `https://api.qrserver.com/v1/create-qr-code/?size=132x132&margin=8&data=${encodeURIComponent(value)}`;

const normalizeEquipmentMatchValue = (value = '') =>
  normalizeKey(String(value || '').replace(/\s+/g, ' ').trim());

const sameEquipmentIdentity = (source = {}, target = {}) =>
  normalizeEquipmentMatchValue(source.tipo_equipo ?? source.tipoEquipo) === normalizeEquipmentMatchValue(target.tipo_equipo ?? target.tipoEquipo) &&
  normalizeEquipmentMatchValue(source.marca) === normalizeEquipmentMatchValue(target.marca) &&
  normalizeEquipmentMatchValue(source.modelo) === normalizeEquipmentMatchValue(target.modelo) &&
  normalizeEquipmentMatchValue(source.numero_serie ?? source.numeroSerie) === normalizeEquipmentMatchValue(target.numero_serie ?? target.numeroSerie) &&
  normalizeEquipmentMatchValue(source.numero_inventario ?? source.numeroInventario) === normalizeEquipmentMatchValue(target.numero_inventario ?? target.numeroInventario);

const addMonthsToIsoDate = (value = '', months = 0) => {
  const date = new Date(`${String(value || '').slice(0, 10)}T12:00:00`);
  const amount = Number(months) || 0;
  if (!value || Number.isNaN(date.getTime()) || amount <= 0) return '';
  const day = date.getDate();
  date.setMonth(date.getMonth() + amount);
  if (date.getDate() !== day) date.setDate(0);
  return date.toISOString().slice(0, 10);
};

const dateWithinWarranty = (sourceDate = '', targetDate = '', months = 0) => {
  const endDate = addMonthsToIsoDate(sourceDate, months);
  const checkDate = String(targetDate || new Date().toISOString()).slice(0, 10);
  return Boolean(endDate && checkDate >= String(sourceDate || '').slice(0, 10) && checkDate <= endDate);
};

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

const normalizeUsuario = (u) => u ? ({
  ...u,
  accesos: Array.isArray(u.accesos) ? u.accesos : [],
  permisosEmpresas: u.permisosEmpresas || u.permisos_empresas || {},
}) : u;

const normalizeUsuarios = (rows = []) => rows.map(normalizeUsuario);

const normalizeUserEmpresaPermissions = (user = {}, empresas = []) => {
  const permisos = user.permisosEmpresas || user.permisos_empresas || {};
  const validIds = new Set((empresas || []).map(e => String(e.id)));
  const normalized = Object.entries(permisos).reduce((acc, [empresaId, accesos]) => {
    if (validIds.has(String(empresaId))) acc[empresaId] = Array.isArray(accesos) ? accesos : [];
    return acc;
  }, {});
  const hasValid = Object.values(normalized).some(accesos => (accesos || []).length > 0);
  const orphanAccess = Object.entries(permisos)
    .filter(([empresaId]) => !validIds.has(String(empresaId)))
    .flatMap(([, accesos]) => Array.isArray(accesos) ? accesos : []);
  if (!hasValid && empresas.length === 1 && orphanAccess.length > 0) {
    normalized[empresas[0].id] = [...new Set(orphanAccess)];
  }
  return normalized;
};

const userEmpresaAccess = (user = {}, empresaId = '', empresas = []) => {
  if (!user || !empresaId) return null;
  const normalized = normalizeUserEmpresaPermissions(user, empresas);
  if (normalized[empresaId]) return normalized[empresaId];
  return null;
};

const usuarioPayload = (data, { includeId = true } = {}) => {
  const payload = {
    usuario: String(data.usuario || '').trim().toLowerCase(),
    nombre: String(data.nombre || '').trim(),
    rut: String(data.rut || '').trim(),
    cargo: data.cargo || '',
    contrasena: data.contrasena || '',
    accesos: Array.isArray(data.accesos) ? data.accesos : [],
    permisos_empresas: data.permisosEmpresas || data.permisos_empresas || {},
  };
  if (includeId && data.id) payload.id = data.id;
  return payload;
};

const insertUsuario = async (data) => {
  const basePayload = usuarioPayload(data, { includeId: false });
  let res = await supabaseRequest(() => supabase.from('usuarios').insert([basePayload]).select().single());
  if (!res.error) return res;

  const fallbackPayload = usuarioPayload({ ...data, id: data.id || crypto.randomUUID() }, { includeId: true });
  return supabaseRequest(() => supabase.from('usuarios').insert([fallbackPayload]).select().single());
};

const upsertLocalUsuariosToSupabase = async (remoteUsuarios = []) => {
  const localUsuarios = readLocalList('sentauris_usuarios').map(normalizeUsuario);
  if (localUsuarios.length === 0) return { migrated: 0, error: null };

  const remoteKeys = new Set(remoteUsuarios.map(u => normalizeKey(u.usuario)));
  const pending = localUsuarios.filter(u => u?.usuario && !remoteKeys.has(normalizeKey(u.usuario)));
  let migrated = 0;

  for (const localUser of pending) {
    const payload = usuarioPayload({
      ...localUser,
      accesos: localUser.accesos || [],
      permisosEmpresas: localUser.permisosEmpresas || {},
    }, { includeId: false });
    const { error } = await supabaseRequest(() =>
      supabase.from('usuarios').upsert([payload], { onConflict: 'usuario' })
    );
    if (error) return { migrated, error };
    migrated += 1;
  }

  if (migrated > 0) localStorage.removeItem('sentauris_usuarios');
  return { migrated, error: null };
};

const PARAMETROS_ROW_ID = 'global';

const loadParametrosFromSupabase = async () => {
  const { data, error } = await supabaseRequest(() =>
    supabase.from('parametros').select('data').eq('id', PARAMETROS_ROW_ID).maybeSingle()
  );
  if (error) return { data: null, error };
  return { data: data?.data || null, error: null };
};

const saveParametrosToSupabase = async (data) => supabaseRequest(() =>
  supabase.from('parametros').upsert([{
    id: PARAMETROS_ROW_ID,
    data: data || {},
    updated_at: new Date().toISOString(),
  }], { onConflict: 'id' }).select().single()
);

const migrateLocalParametrosToSupabase = async () => {
  const localParametros = readLocalObj('sentauris_parametros');
  if (!localParametros) return { data: null, error: null };
  const { error } = await saveParametrosToSupabase(localParametros);
  return { data: localParametros, error };
};

const APP_DATA_KEYS = {
  clientes_ext: 'sentauris_clientes_ext',
  cotizaciones_historial: 'sentauris_cotizaciones_historial',
  oc_recibidas: 'sentauris_oc_recibidas',
  rendiciones: 'sentauris_rendiciones',
  productos_rendiciones: 'sentauris_productos_rendiciones',
  comprobantes: 'sentauris_comprobantes',
  registro_compras: 'sentauris_registro_compras',
  empresas: 'sentauris_empresas',
  plan_cuentas: 'sentauris_plan_cuentas',
  tipo_documentos: 'sentauris_tipo_docs',
  abastecimiento_documentos: 'sentauris_abastecimiento_documentos',
  protocolos_preventivos: 'sentauris_protocolos_preventivos',
};

const appDataParamId = (key) => `app_data:${key}`;

const loadAppDataFromSupabase = async (keys) => {
  const response = await supabaseRequest(() =>
    supabase.from('parametros').select('id, data').in('id', keys.map(appDataParamId))
  );
  if (response.error) return response;
  return {
    data: (response.data || []).map(row => ({ key: String(row.id || '').replace(/^app_data:/, ''), data: row.data })),
    error: null,
  };
};

const saveAppDataToSupabase = async (key, data) => {
  const payload = data || [];
  return supabaseRequest(() =>
    supabase.from('parametros').upsert([{
      id: appDataParamId(key),
      data: payload,
      updated_at: new Date().toISOString(),
    }], { onConflict: 'id' }).select().single()
  );
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

const nextCotizacionNumero = (cotizaciones = []) => {
  const max = cotizaciones.reduce((acc, cotizacion) => {
    const number = Number(String(cotizacion?.numero || '').replace(/\D/g, ''));
    return Number.isFinite(number) ? Math.max(acc, number) : acc;
  }, 0);
  return String(max + 1).padStart(6, '0');
};

const clienteDireccion = (cliente = {}) => {
  const c = cliente || {};
  return c.direccionPrincipal || c.direccion_principal || c.direccion || c.sucursalDireccion || c.sucursales?.[0]?.direccion || '';
};

const clienteComuna = (cliente = {}) => {
  const c = cliente || {};
  return c.comuna || c.sucursalComuna || c.sucursales?.[0]?.comuna || '';
};

const clienteTelefono = (cliente = {}) => {
  const c = cliente || {};
  return c.telefono || c.phone || c.fono || c.celular || '';
};

const asArray = (value) => Array.isArray(value) ? value : [];

const getEmpresaUnidadesNegocio = (empresa = {}) =>
  asArray(empresa.unidadesNegocio || empresa.unidades_negocio || empresa.unidades || empresa.unidadesDeNegocio);

const getEmpresaCentrosCosto = (empresa = {}) =>
  asArray(empresa.centrosCosto || empresa.centros_costo || empresa.centros || empresa.centrosDeCosto);

const empresaUnidadValue = (unidad = {}) => {
  if (typeof unidad === 'string') return unidad.trim();
  return unidad.descripcion || unidad.nombre || unidad.name || unidad.codigo || unidad.code || '';
};

const empresaCentroCostoValue = (centro = {}) => {
  if (typeof centro === 'string') return centro.trim();
  const codigo = centro.codigo || centro.code || centro.cod || '';
  const nombre = centro.nombre || centro.descripcion || centro.name || centro.detalle || '';
  return [codigo, nombre].filter(Boolean).join(' - ') || codigo || nombre || '';
};

const emptyCotizacionDraft = (cotizaciones = [], currentEmpresa = null) => {
  const unidadNegocio = getEmpresaUnidadesNegocio(currentEmpresa).map(empresaUnidadValue).filter(Boolean)[0] || '';
  const centroCosto = getEmpresaCentrosCosto(currentEmpresa).map(empresaCentroCostoValue).filter(Boolean)[0] || '';
  return {
    numero: nextCotizacionNumero(cotizaciones),
    fecha: new Date().toISOString().split('T')[0],
    cliente: '',
    rut: '',
    direccion: '',
    comuna: '',
    telefono: '',
    clienteId: '',
    solicitadoPor: '',
    vendedor: '',
    referencia: '',
    glosa: '',
    detalles: '',
    idLicitacion: '',
    licitacionId: '',
    unidadNegocio,
    centroCosto,
    items: [],
  };
};

const buildCotizacionHtml = (draft, empresaInforme = {}) => {
  const docTitle = draft.masiva ? 'Cotizacion Masiva' : 'Cotizacion';
  const detailsHtml = htmlText(draft.detalles || '');
  const { neto, iva, total } = cotizacionTotals(draft.items || []);
  const empresaNombre = empresaInforme?.razonSocial || empresaInforme?.nombreFantasia || 'Vaicmedical';
  const empresaRut = empresaInforme?.rut || empresaInforme?.RUT || '77.573.229-6';
  const empresaGiro = empresaInforme?.giro || 'Mantencion y Reparacion de Equipos Medicos';
  const empresaMail = empresaInforme?.correoContacto || empresaInforme?.email || 'servicios@vaicmedical.cl';
  const empresaMembrete = empresaInforme?.membreteImagen || '/logo-vaic-pdf.jpeg';
  let printableItem = 0;
  return `
    <html><head><title>Cotizacion ${draft.numero || ''}</title><style>
    body{font-family:Arial,sans-serif;padding:28px;color:#111827}.page{max-width:960px;margin:auto}.head{display:grid;grid-template-columns:150px 1fr 176px;border:2px solid #111827;padding:12px;align-items:center;gap:18px}.logo-box{display:flex;align-items:center;justify-content:flex-start}.logo{display:block;width:136px;max-height:88px;object-fit:contain}.brand{font-weight:800;font-size:18px}.company{text-align:center;font-size:11px;line-height:1.5;color:#334155}.meta{text-align:right;font-size:12px;line-height:1.5;color:#111827}.folio-label{font-size:10px;text-transform:uppercase;color:#475569;font-weight:700}.folio-value{display:block;font-size:22px;line-height:1.1;font-weight:900;color:#0f172a;margin-bottom:8px}
    h1{font-size:16px;text-align:center;margin:16px 0;text-transform:uppercase;letter-spacing:.06em}.badge{display:inline-block;margin-top:6px;border:1px solid #111827;padding:3px 8px;font-size:10px;font-weight:700}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;margin:18px 0;font-size:12px}.intro{font-size:12px;margin:10px 0 4px}
    table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #cbd5e1;padding:7px;font-size:11px;vertical-align:top}th{background:#e5e7eb;text-transform:uppercase;font-size:10px}.info-row td{background:#f8fafc;color:#334155;font-size:10px;font-weight:700}.totals{margin-left:auto;width:260px;margin-top:12px}.obs{margin-top:16px;font-size:12px;line-height:1.45}.details{border:1px solid #cbd5e1;padding:10px;background:#f8fafc}
    .footer{margin-top:28px;border-top:1px solid #cbd5e1;padding-top:10px;font-size:10px;color:#475569}@media print{button{display:none}body{padding:12px}}
    </style></head><body><div class="page">
    <div class="head"><div class="logo-box"><img class="logo" src="${empresaMembrete}" alt="Membrete empresa"/></div><div class="company"><div class="brand">${htmlText(empresaNombre)}</div><div>RUT: ${htmlText(empresaRut)}</div><div>Giro: ${htmlText(empresaGiro)}</div><div>Correo: ${htmlText(empresaMail)}</div></div><div class="meta"><span class="folio-label">Cotizacion</span><span class="folio-value">${htmlText(draft.numero || '')}</span>Fecha: ${htmlText(formatPdfDate(draft.fecha))}</div></div>
    <h1>${docTitle}</h1>${draft.masiva ? '<div style="text-align:right"><span class="badge">Consolidado de informes</span></div>' : ''}
    <h3>Informacion del cliente</h3><div class="grid"><div><b>Sres.:</b> ${htmlText(draft.cliente || '')}</div><div><b>Fecha Documento:</b> ${htmlText(formatPdfDate(draft.fecha))}</div><div><b>Rut:</b> ${htmlText(draft.rut || '')}</div><div><b>Vendedor:</b> ${htmlText(draft.vendedor || '')}</div><div><b>Direccion:</b> ${htmlText(draft.direccion || '')}</div><div><b>Comuna:</b> ${htmlText(draft.comuna || '')}</div><div><b>Telefono:</b> ${htmlText(draft.telefono || '')}</div><div><b>Solicitado por:</b> ${htmlText(draft.solicitadoPor || '')}</div></div>
    <p class="intro">Tenemos el agrado de cotizar a usted lo siguiente:</p>
    <table><thead><tr><th>Item</th><th>Codigo</th><th>N de Parte</th><th>Descripcion</th><th>Unidad</th><th>Cantidad</th><th>Precio Unit.</th><th>Dcto</th><th>Total</th></tr></thead><tbody>
    ${(draft.items || []).map((item) => item.tipo === 'info'
      ? `<tr class="info-row"><td colspan="9">${htmlText(item.descripcion || '')}</td></tr>`
      : `<tr><td>${++printableItem}</td><td>${htmlText(item.codigo || '')}</td><td>${htmlText(item.parte || '')}</td><td>${htmlText(item.descripcion || '')}</td><td>${htmlText(item.unidad || '')}</td><td>${item.cantidad || 0}</td><td>$${Number(item.precio || 0).toLocaleString('es-CL')}</td><td>${item.dcto || 0}</td><td>$${cotizacionLineTotal(item).toLocaleString('es-CL')}</td></tr>`).join('')}
    </tbody></table>${detailsHtml ? `<div class="obs details"><b>Descripcion Adicional</b><br/>${detailsHtml}</div>` : ''}
    <table class="totals"><tbody><tr><th>Neto</th><td>$${neto.toLocaleString('es-CL')}</td></tr><tr><th>Monto Exento</th><td>$0</td></tr><tr><th>I.V.A. (19%)</th><td>$${iva.toLocaleString('es-CL')}</td></tr><tr><th>Total</th><td>$${total.toLocaleString('es-CL')}</td></tr></tbody></table>
    <div class="obs"><b>Observaciones</b><br/><br/></div><div class="footer">Cotizacion emitida por ${htmlText(empresaNombre)}. Valores netos afectos a IVA, salvo indicacion contraria.</div><button onclick="window.print()">Imprimir / Guardar PDF</button></div></body></html>`;
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
        : { ...MOCK_USER, id: loggedInUser.id, name: loggedInUser.nombre, email: loggedInUser.email || loggedInUser.usuario, rut: loggedInUser.rut || '', position: loggedInUser.cargo })
    : MOCK_USER;
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(() => (typeof window === 'undefined' ? true : window.innerWidth >= 1024));
  const [clientes, setClientes] = useState([]);
  const [licitaciones, setLicitaciones] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [cotizacionDraft, setCotizacionDraft] = useState(null);
  const [cotizacionesHistorial, setCotizacionesHistorial] = useState(() => readLocalList('sentauris_cotizaciones_historial'));
  const [ocRecibidas, setOcRecibidas] = useState(() => readLocalList('sentauris_oc_recibidas'));
  const [rendiciones, setRendiciones] = useState(() => readLocalList('sentauris_rendiciones'));
  const [productosRendiciones, setProductosRendiciones] = useState(() => readLocalList('sentauris_productos_rendiciones'));
  const [comprobantes, setComprobantes] = useState(() => readLocalList('sentauris_comprobantes'));
  const [registroCompras, setRegistroCompras] = useState(() => readLocalList('sentauris_registro_compras'));
  const [usuarios, setUsuarios] = useState(() => readLocalList('sentauris_usuarios'));
  const [empresas, setEmpresas] = useState(() => readLocalList('sentauris_empresas'));
  const [activeEmpresaId, setActiveEmpresaId] = useState(() => localStorage.getItem('sentauris_active_empresa') || '');
  const [planCuentas, setPlanCuentas] = useState(() => readLocalList('sentauris_plan_cuentas'));
  const [tipoDocumentos, setTipoDocumentos] = useState(() => readLocalList('sentauris_tipo_docs'));
  const [parametros, setParametrosState] = useState(() => readLocalObj('sentauris_parametros'));
  const [protocolosPreventivos, setProtocolosPreventivos] = useState(() => ({
    ...defaultPreventiveProtocolsConfig(),
    ...(readLocalObj('sentauris_protocolos_preventivos') || {}),
  }));
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState('connecting'); // 'connecting' | 'ok' | 'error'
  const appDataLoadedRef = useRef(false);

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

        if (e1 || e2 || e3 || e4 || e5) {
          console.error('Error Supabase:', e1 || e2 || e3 || e4 || e5);
          setDbStatus('error');
        } else {
          const remoteUsuarios = normalizeUsuarios(usuariosData || []);
          const migration = await upsertLocalUsuariosToSupabase(remoteUsuarios);
          if (migration.error) {
            console.error('Error migrando usuarios locales a Supabase:', migration.error);
          }

          const remoteParametros = await loadParametrosFromSupabase();
          if (remoteParametros.error) {
            console.error('Error cargando parametros desde Supabase:', remoteParametros.error);
          } else if (remoteParametros.data) {
            setParametrosState(remoteParametros.data);
            localStorage.setItem('sentauris_parametros', JSON.stringify(remoteParametros.data));
          } else {
            const migratedParametros = await migrateLocalParametrosToSupabase();
            if (migratedParametros.error) {
              console.error('Error migrando parametros locales a Supabase:', migratedParametros.error);
          } else if (migratedParametros.data) {
              setParametrosState(migratedParametros.data);
            }
          }

          const appDataSetters = {
            clientes_ext: null,
            cotizaciones_historial: setCotizacionesHistorial,
            oc_recibidas: setOcRecibidas,
            rendiciones: setRendiciones,
            productos_rendiciones: setProductosRendiciones,
            comprobantes: setComprobantes,
            registro_compras: setRegistroCompras,
            empresas: setEmpresas,
            plan_cuentas: setPlanCuentas,
            tipo_documentos: setTipoDocumentos,
            protocolos_preventivos: setProtocolosPreventivos,
          };
          const appDataResponse = await loadAppDataFromSupabase(Object.keys(appDataSetters));
          if (appDataResponse.error) {
            console.error('Error cargando datos de app_data desde Supabase:', appDataResponse.error);
          } else {
            const remoteByKey = new Map((appDataResponse.data || []).map(row => [row.key, row.data]));
            for (const [key, setter] of Object.entries(appDataSetters)) {
              if (remoteByKey.has(key)) {
                const remoteValue = key === 'protocolos_preventivos'
                  ? { ...defaultPreventiveProtocolsConfig(), ...(remoteByKey.get(key) || {}) }
                  : (Array.isArray(remoteByKey.get(key)) ? remoteByKey.get(key) : []);
                if (setter) setter(remoteValue);
                localStorage.setItem(APP_DATA_KEYS[key], JSON.stringify(remoteValue));
              } else {
                const localValue = key === 'protocolos_preventivos'
                  ? readLocalObj(APP_DATA_KEYS[key])
                  : readLocalList(APP_DATA_KEYS[key]);
                if ((Array.isArray(localValue) && localValue.length > 0) || (localValue && typeof localValue === 'object' && Object.keys(localValue).length > 0)) {
                  await saveAppDataToSupabase(key, localValue);
                }
              }
            }
          }
          appDataLoadedRef.current = true;

          const clientesBase = (clientesData || []).map(c => ({ ...normalizeCliente(c), empresaId: c.empresa_id || c.empresaId || null }));
          const clientesExt = readLocalList(APP_DATA_KEYS.clientes_ext);
          setClientes(mergeClientesExtended(clientesBase, clientesExt));
          setLicitaciones(licitData || []);
          setRepuestos(repData || []);
          setEquipos(equiposData || []);
          setUsuarios(migration.migrated > 0
            ? normalizeUsuarios((await supabase.from('usuarios').select('*')).data || remoteUsuarios)
            : remoteUsuarios);
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

  const persistAppData = (key, localStorageKey, value) => {
    localStorage.setItem(localStorageKey, JSON.stringify(value));
    if (appDataLoadedRef.current) {
      saveAppDataToSupabase(key, value).then(({ error }) => {
        if (error) console.error(`Error guardando ${key} en Supabase:`, error);
      });
    }
  };

  useEffect(() => {
    persistAppData('cotizaciones_historial', APP_DATA_KEYS.cotizaciones_historial, cotizacionesHistorial);
  }, [cotizacionesHistorial]);

  useEffect(() => {
    persistAppData('oc_recibidas', APP_DATA_KEYS.oc_recibidas, ocRecibidas);
  }, [ocRecibidas]);

  useEffect(() => {
    persistAppData('rendiciones', APP_DATA_KEYS.rendiciones, rendiciones);
  }, [rendiciones]);

  useEffect(() => {
    persistAppData('productos_rendiciones', APP_DATA_KEYS.productos_rendiciones, productosRendiciones);
  }, [productosRendiciones]);

  useEffect(() => {
    localStorage.removeItem('sentauris_clientes');
  }, []);

  useEffect(() => {
    persistAppData('comprobantes', APP_DATA_KEYS.comprobantes, comprobantes);
  }, [comprobantes]);

  useEffect(() => {
    persistAppData('registro_compras', APP_DATA_KEYS.registro_compras, registroCompras);
  }, [registroCompras]);

  // usuarios se persisten en Supabase, no en localStorage

  useEffect(() => {
    persistAppData('empresas', APP_DATA_KEYS.empresas, empresas);
  }, [empresas]);

  useEffect(() => {
    persistAppData('plan_cuentas', APP_DATA_KEYS.plan_cuentas, planCuentas);
  }, [planCuentas]);

  useEffect(() => {
    persistAppData('tipo_documentos', APP_DATA_KEYS.tipo_documentos, tipoDocumentos);
  }, [tipoDocumentos]);

  useEffect(() => {
    persistAppData('protocolos_preventivos', APP_DATA_KEYS.protocolos_preventivos, protocolosPreventivos);
  }, [protocolosPreventivos]);

  const setParametros = async (nextParametros) => {
    setParametrosState(nextParametros);
    localStorage.setItem('sentauris_parametros', JSON.stringify(nextParametros));
    return saveParametrosToSupabase(nextParametros);
  };

  const getAccessibleEmpresaIds = (user = loggedInUser) => {
    if (!user) return [];
    if (user.isSuperadmin) return empresas.map(e => e.id);
    const permisos = normalizeUserEmpresaPermissions(user, empresas);
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
  const accessibleEmpresaIds = getAccessibleEmpresaIds();
  const currentEmpresa = empresas.find(e => e.id === activeEmpresaId)
    || empresas.find(e => accessibleEmpresaIds.includes(e.id))
    || empresas[0]
    || null;

  // Guardar orden en Supabase
  const saveOrden = async (extraData = {}) => {
    const isDuplicateFolioError = (err) => {
      const message = String(err?.message || err || '').toLowerCase();
      return message.includes('ordenes_trabajo_folio_key') || (message.includes('duplicate key') && message.includes('folio'));
    };
    // Verificar si el cliente existe en Supabase antes de enviar el FK
    let clienteIdFinal = null;
    const candidateId = formData.clienteId || null;
    if (candidateId) {
      const { data: clienteDB } = await supabase.from('clientes').select('id_RUT').eq('id_RUT', candidateId).maybeSingle();
      clienteIdFinal = clienteDB ? candidateId : null;
      if (!clienteDB) console.warn('[saveOrden] cliente_id', candidateId, 'no existe en Supabase — se guardará sin cliente');
    }
    const payload = {
      folio: formData.folio,
      cliente_id: clienteIdFinal,
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
      productosRendiciones, setProductosRendiciones,
      comprobantes, setComprobantes,
      registroCompras, setRegistroCompras,
      usuarios, setUsuarios,
      empresas, setEmpresas, activeEmpresaId, setActiveEmpresaId,
      currentEmpresa,
      getAccessibleEmpresaIds,
      planCuentas, setPlanCuentas,
      tipoDocumentos, setTipoDocumentos,
      protocolosPreventivos, setProtocolosPreventivos,
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

const SearchableSelect = ({ label, options = [], value, onChange, disabled, placeholder, getLabel, getSearchText }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  const selected = options.find(opt => String(opt.id || opt) === String(value || ''));
  const labelFor = (opt) => getLabel ? getLabel(opt) : (opt?.name || opt);
  const searchFor = (opt) => getSearchText ? getSearchText(opt) : labelFor(opt);

  useEffect(() => {
    const handler = (event) => { if (ref.current && !ref.current.contains(event.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(opt => normalizeKey(searchFor(opt)).includes(normalizeKey(query)));
  const select = (opt) => {
    onChange?.({ target: { value: opt.id || opt } });
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative flex w-full flex-col gap-1.5">
      {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
      <input
        type="text"
        value={open ? query : (selected ? labelFor(selected) : '')}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => { setQuery(''); setOpen(true); }}
        disabled={disabled}
        placeholder={placeholder || 'Buscar y seleccionar...'}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-9 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400"
      />
      <Search size={14} className="pointer-events-none absolute bottom-3 right-3 text-slate-400" />
      {open && !disabled && (
        <ul className="absolute z-50 top-full mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <li className="px-3 py-3 text-sm italic text-slate-400">Sin resultados</li>
          ) : filtered.map(opt => (
            <li
              key={opt.id || labelFor(opt)}
              onMouseDown={() => select(opt)}
              className="cursor-pointer px-3 py-2 text-sm text-slate-700 hover:bg-blue-600 hover:text-white"
            >
              {labelFor(opt)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const ComboInput = ({ label, value, onChange, options = [], disabled, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const ref = useRef(null);

  useEffect(() => { setQuery(value || ''); }, [value]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query
    ? options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  const handleInput = (e) => {
    setQuery(e.target.value);
    setOpen(true);
    onChange(e);
  };

  const select = (opt) => {
    setQuery(opt);
    setOpen(false);
    onChange({ target: { value: opt } });
  };

  const chevronSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`;

  return (
    <div ref={ref} className="flex flex-col gap-1.5 w-full relative">
      {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
      <input
        type="text" value={query} onChange={handleInput}
        onFocus={() => setOpen(true)}
        disabled={disabled} placeholder={placeholder || 'Seleccionar...'}
        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400 transition-all text-sm"
        style={{ backgroundImage: chevronSvg, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em 1em', paddingRight: '2rem' }}
      />
      {open && !disabled && filtered.length > 0 && (
        <ul className="absolute z-50 top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {filtered.map(opt => (
            <li key={opt} onMouseDown={() => select(opt)}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-600 hover:text-white ${opt === value ? 'bg-blue-600 text-white font-medium' : 'text-slate-700'}`}>
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const SignaturePad = ({ signerName, onChange, initialValue = '', label = 'Firma del tecnico', disabled = false }) => {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const initialDrawnRef = useRef(false);
  const ignoreMouseRef = useRef(false);

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
    if (disabled) return;
    if (event.type?.startsWith('mouse') && ignoreMouseRef.current) return;
    if (event.type?.startsWith('touch')) ignoreMouseRef.current = true;
    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const point = getPoint(event);
    drawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const draw = (event) => {
    if (disabled || !drawingRef.current) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const point = getPoint(event);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (disabled || !drawingRef.current) return;
    drawingRef.current = false;
    initialDrawnRef.current = true;
    onChange?.(canvasRef.current.toDataURL('image/png'));
    window.setTimeout(() => { ignoreMouseRef.current = false; }, 500);
  };

  const clear = () => {
    if (disabled) return;
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    onChange?.('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-bold text-slate-700">{label}</label>
        <button
          type="button"
          onClick={clear}
          disabled={disabled}
          className={`text-xs font-bold ${disabled ? 'cursor-not-allowed text-slate-300' : 'text-blue-600 hover:text-blue-800'}`}
        >
          Redibujar firma
        </button>
      </div>
      <div className={`rounded-xl border-2 border-dashed p-3 ${disabled ? 'border-slate-200 bg-slate-100' : 'border-slate-200 bg-slate-50'}`}>
        <canvas
          ref={canvasRef}
          className={`h-36 w-full touch-none rounded-lg bg-white ${disabled ? 'cursor-not-allowed opacity-80' : ''}`}
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
  const { formData, setFormData, setActiveModule, generateFolio, clientes, licitaciones, equipos, setEquipos, repuestos, activeEmpresaId } = useContext(ERPContext);
  const clientesEmpresa = (() => {
    const base = activeEmpresaId ? clientes.filter(c => c.empresaId === activeEmpresaId) : clientes;
    const seen = new Set();
    return base.filter(c => {
      const key = (c.rut || c.id || '').toLowerCase().replace(/[\s.]/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();
  const selectedCliente = clientesEmpresa.find(c => c.id === formData.clienteId);
  const availableLicitations = licitaciones.filter(l => {
    if (l.cliente_id === formData.clienteId) return true;
    if (selectedCliente) {
      const licCliente = clientes.find(c => c.id === l.cliente_id);
      return licCliente && normalizeKey(licCliente.rut) === normalizeKey(selectedCliente.rut);
    }
    return false;
  });
  const availableEquipos = equipos.filter(e => e.licitacion_id === formData.licitacionId);
  const unique = (values) => dedupeByNormalizedText(values).sort((a, b) => a.localeCompare(b));
  const tipoEquipoOptions = unique(availableEquipos.map(e => e.tipo_equipo));
  const marcaOptions = unique(availableEquipos
    .filter(e => !formData.tipoEquipo || normalizeKey(e.tipo_equipo) === normalizeKey(formData.tipoEquipo))
    .map(e => e.marca));
  const modeloOptions = unique(availableEquipos
    .filter(e =>
      (!formData.tipoEquipo || normalizeKey(e.tipo_equipo) === normalizeKey(formData.tipoEquipo)) &&
      (!formData.marca || normalizeKey(e.marca) === normalizeKey(formData.marca))
    )
    .map(e => e.modelo));
  const serieOptions = unique(availableEquipos
    .filter(e =>
      (!formData.tipoEquipo || normalizeKey(e.tipo_equipo) === normalizeKey(formData.tipoEquipo)) &&
      (!formData.marca || normalizeKey(e.marca) === normalizeKey(formData.marca)) &&
      (!formData.modelo || normalizeKey(e.modelo) === normalizeKey(formData.modelo)) &&
      (!formData.numeroInventario || normalizeKey(e.numero_inventario) === normalizeKey(formData.numeroInventario))
    )
    .map(e => e.numero_serie));
  const inventarioOptions = unique(availableEquipos
    .filter(e =>
      (!formData.tipoEquipo || normalizeKey(e.tipo_equipo) === normalizeKey(formData.tipoEquipo)) &&
      (!formData.marca || normalizeKey(e.marca) === normalizeKey(formData.marca)) &&
      (!formData.modelo || normalizeKey(e.modelo) === normalizeKey(formData.modelo)) &&
      (!formData.numeroSerie || normalizeKey(e.numero_serie) === normalizeKey(formData.numeroSerie))
    )
    .map(e => e.numero_inventario));

  // Estado para nuevo cliente inline
  const [showNewCliente, setShowNewCliente] = useState(false);
  const [newCliente, setNewCliente] = useState({ name: '', rut: '', email: '' });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    const sameText = (a, b) => normalizeKey(a) === normalizeKey(b);
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
      newData.numeroSerie = '';
      newData.numeroInventario = '';
    }
    if (field === 'numeroSerie') {
      const match = availableEquipos.find(e =>
        sameText(e.tipo_equipo, newData.tipoEquipo) &&
        sameText(e.marca, newData.marca) &&
        (!newData.modelo || sameText(e.modelo, newData.modelo)) &&
        sameText(e.numero_serie, value)
      );
      if (match) {
        newData.modelo = match.modelo || newData.modelo;
      }
      const hasMatchingInventario = !newData.numeroInventario || availableEquipos.some(e =>
        sameText(e.tipo_equipo, newData.tipoEquipo) &&
        sameText(e.marca, newData.marca) &&
        (!newData.modelo || sameText(e.modelo, newData.modelo)) &&
        sameText(e.numero_serie, value) &&
        sameText(e.numero_inventario, newData.numeroInventario)
      );
      if (!hasMatchingInventario) newData.numeroInventario = '';
    }
    if (field === 'numeroInventario') {
      const match = availableEquipos.find(e =>
        sameText(e.tipo_equipo, newData.tipoEquipo) &&
        sameText(e.marca, newData.marca) &&
        (!newData.modelo || sameText(e.modelo, newData.modelo)) &&
        sameText(e.numero_inventario, value)
      );
      if (match) {
        newData.modelo = match.modelo || newData.modelo;
      }
      const hasMatchingSerie = !newData.numeroSerie || availableEquipos.some(e =>
        sameText(e.tipo_equipo, newData.tipoEquipo) &&
        sameText(e.marca, newData.marca) &&
        (!newData.modelo || sameText(e.modelo, newData.modelo)) &&
        sameText(e.numero_inventario, value) &&
        sameText(e.numero_serie, newData.numeroSerie)
      );
      if (!hasMatchingSerie) newData.numeroSerie = '';
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
      setClientes(prev => [...prev, { ...data, empresaId: data.empresa_id || null }]);
      handleChange('clienteId', data.id);
      setShowNewCliente(false);
      setNewCliente({ name: '', rut: '', email: '' });
    } else if (error) {
      alert('❌ Error al crear cliente: ' + error.message);
    }
    setSaving(false);
  };

  const isFormValid = formData.clienteId && formData.licitacionId && formData.tipoEquipo &&
    formData.marca && formData.ubicacionArea && formData.solicitadoPor;

  const ensureEquipoRegistered = async () => {
    const payload = {
      licitacion_id: formData.licitacionId,
      tipo_equipo: String(formData.tipoEquipo || '').trim(),
      marca: String(formData.marca || '').trim(),
      modelo: String(formData.modelo || '').trim() || null,
      numero_serie: String(formData.numeroSerie || '').trim() || null,
      numero_inventario: String(formData.numeroInventario || '').trim() || null,
    };
    if (!payload.licitacion_id || !payload.tipo_equipo || !payload.marca) return;
    const existing = equipos.find(e =>
      e.licitacion_id === payload.licitacion_id &&
      normalizeKey(e.tipo_equipo) === normalizeKey(payload.tipo_equipo) &&
      normalizeKey(e.marca) === normalizeKey(payload.marca) &&
      normalizeKey(e.modelo) === normalizeKey(payload.modelo) &&
      normalizeKey(e.numero_serie) === normalizeKey(payload.numero_serie) &&
      normalizeKey(e.numero_inventario) === normalizeKey(payload.numero_inventario)
    );
    if (existing) return;
    const { data, error } = await supabaseRequest(() => supabase.from('equipos').insert([payload]).select().single());
    if (error) {
      alert('No se pudo agregar el equipo nuevo a la tabla de equipos: ' + friendlyError(error));
      return;
    }
    setEquipos(prev => [...prev, data]);
  };

  const garantiaCondicionInicial = (baseText, previousFolio = '') => {
    const prefix = `El equipo corresponde a una garantia por contrato${previousFolio ? ` asociada a la mantencion correctiva previa ${previousFolio}` : ''}.`;
    const fallback = `Se recibe equipo ${formData.tipoEquipo || 'sin tipo definido'} ${formData.marca || ''} ${formData.modelo || ''}, serie ${formData.numeroSerie || 'sin serie'}, inventario ${formData.numeroInventario || 'sin inventario'}, ubicado en ${formData.ubicacionArea || 'area no informada'}, por solicitud de ${formData.solicitadoPor || 'solicitante no informado'}, reportando fallas o problemas en su funcionamiento.`;
    const text = baseText || fallback;
    return String(text || '').includes('garantia por contrato') ? text : `${prefix}\n\n${text}`.trim();
  };

  const handleNext = async (tipo) => {
    if (!isFormValid) return;
    await ensureEquipoRegistered();
    let extraCorrectiva = {};
    if (tipo === 'correctiva') {
      const hasFullEquipmentIdentity = [
        formData.tipoEquipo,
        formData.marca,
        formData.modelo,
        formData.numeroSerie,
        formData.numeroInventario
      ].every(value => normalizeEquipmentMatchValue(value));
      let previousOrden = null;
      if (hasFullEquipmentIdentity) {
        const { data, error } = await supabaseRequest(() =>
          supabase.from('ordenes_trabajo')
            .select('*')
            .eq('tipo_mantencion', 'correctiva')
            .order('created_at', { ascending: false })
        );
        if (error) {
          alert('No se pudo revisar el historial correctivo: ' + friendlyError(error));
          return;
        }
        previousOrden = (data || []).find(orden => sameEquipmentIdentity(orden, formData));
      }
      if (previousOrden) {
        const currentLicitacion = licitaciones.find(l => l.id === formData.licitacionId) || {};
        const previousLicitacion = licitaciones.find(l => l.id === previousOrden.licitacion_id) || {};
        const garantiaCorrectivaMeses = Number(currentLicitacion.garantia_correctiva_meses ?? previousLicitacion.garantia_correctiva_meses ?? 0) || 0;
        const coberturaHasta = addMonthsToIsoDate(previousOrden.fecha, garantiaCorrectivaMeses);
        const garantiaVigente = dateWithinWarranty(previousOrden.fecha, formData.fecha, garantiaCorrectivaMeses);
        if (!garantiaVigente) {
          setFormData(prev => ({ ...prev, tipoMantencion: tipo, folio: prev.folio || generateFolio() }));
          setActiveModule('operaciones-correctiva');
          return;
        }
        const bringPrevious = window.confirm(`El equipo seleccionado tiene una mantencion correctiva previamente realizada, posiblemente aplique la garantia por contrato.\n\nCobertura estimada hasta: ${formatPdfDate(coberturaHasta)}\n\nDesea traer datos previamente cargados?\n\nAceptar = Si / Cancelar = No`);
        if (bringPrevious) {
          const previousCorrectiva = parseCorrectivaObservaciones(previousOrden.observaciones);
          const { data: usados, error: repError } = await supabaseRequest(() =>
            supabase.from('orden_repuestos').select('*').eq('orden_id', previousOrden.id)
          );
          if (repError) {
            alert('No se pudieron cargar los repuestos del informe anterior: ' + friendlyError(repError));
            return;
          }
          const previousRepuestos = (usados || []).map((item, index) => {
            const repuesto = repuestos.find(r => r.id === item.repuesto_id) || {};
            return {
              ...repuesto,
              id: item.repuesto_id || repuesto.id,
              qty: item.cantidad || 1,
              toBodega: Boolean(item.desde_bodega),
              garantia: true,
              lockedQty: true,
              tempId: `garantia-${item.repuesto_id || 'rep'}-${Date.now()}-${index}`
            };
          }).filter(item => item.id);
          extraCorrectiva = {
            correctivaCondicionInicial: garantiaCondicionInicial(previousCorrectiva.condicionInicial, previousOrden.folio),
            correctivaDiagnostico: previousCorrectiva.diagnostico || '',
            correctivaConclusion: previousCorrectiva.conclusion || '',
            correctivaCondicionFinal: previousCorrectiva.condicionFinal || DEFAULT_CONDICION_FINAL_CORRECTIVA,
            correctivaFotos: previousCorrectiva.fotos || [],
            correctivaRepuestos: previousRepuestos,
            correctivaEstadoInterno: 'Garantía',
            correctivaGarantiaContrato: true,
            correctivaOrigenGarantiaFolio: previousOrden.folio || '',
          };
        }
      }
    }
    setFormData(prev => ({ ...prev, tipoMantencion: tipo, folio: prev.folio || generateFolio(), ...extraCorrectiva }));
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

          <ComboInput
            label="Tipo de Equipo"
            options={tipoEquipoOptions}
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
  const { formData, setActiveModule, currentUser, saveOrden, resetRegistrationForm, protocolosPreventivos } = useContext(ERPContext);
  const isReopenedPreventiva = Boolean(formData.ordenId);
  const [checklist, setChecklist] = useState(formData.preventivaChecklist || {});
  const [observaciones, setObservaciones] = useState(formData.preventivaObservaciones || '');
  const [estadoEquipo, setEstadoEquipo] = useState(formData.preventivaEstadoEquipo || 'Operativo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureData, setSignatureData] = useState(formData.preventivaFirma || '');
  const [firmaRecepcion, setFirmaRecepcion] = useState(formData.preventivaFirmaRecepcion || '');
  const [recibidoPor, setRecibidoPor] = useState(formData.preventivaRecibidoPor || '');
  const [cargoRecepcion, setCargoRecepcion] = useState(formData.preventivaCargoRecepcion || '');
  const protocolo = getPreventiveProtocol(formData.tipoEquipo, protocolosPreventivos);
  const statusOptions = ['Si', 'No', 'N/A', 'Falla'];

  const handleBackToRegistro = () => {
    resetRegistrationForm();
    setActiveModule('operaciones-registro');
  };

  useEffect(() => {
    setEstadoEquipo(derivePreventiveFinalStatus(checklist));
  }, [checklist]);

  const updateChecklistEntry = (itemKey, patch) => {
    setChecklist(prev => {
      const current = normalizePreventiveChecklistEntry(prev[itemKey]);
      const next = { ...current, ...patch };
      if (next.criticidad !== 'Critico' || next.estado !== 'No') next.falla = false;
      return { ...prev, [itemKey]: next };
    });
  };

  const toggleChecklistStatus = (itemKey, itemCriticidad, status, entry) => {
    if (status === 'Falla') {
      updateChecklistEntry(itemKey, {
        criticidad: itemCriticidad,
        falla: !entry.falla,
      });
      return;
    }
    const selected = preventiveEntryMatches(entry, status);
    updateChecklistEntry(itemKey, {
      criticidad: itemCriticidad,
      estado: selected ? '' : status,
      falla: false,
    });
  };

  const handleFinish = async () => {
    const missingRequired = protocolo.sections.flatMap(section =>
      section.items
        .map(item => {
          const itemLabel = protocolItemLabel(item);
          const itemKey = `${section.section} - ${itemLabel}`;
          const entry = normalizePreventiveChecklistEntry(checklist[itemKey]);
          return protocolItemRequired(item) && !entry.estado ? `${section.section}: ${itemLabel}` : null;
        })
        .filter(Boolean)
    );
    if (missingRequired.length > 0) {
      alert(`Debes completar los campos obligatorios antes de guardar:\n\n${missingRequired.slice(0, 8).join('\n')}${missingRequired.length > 8 ? `\n...y ${missingRequired.length - 8} mas` : ''}`);
      return;
    }
    setIsSubmitting(true);
    try {
      const orden = await saveOrden({
        estado_equipo: estadoEquipo,
        observaciones: buildPreventivaObservaciones({
          observaciones,
          checklist,
          firma: signatureData,
          firmaRecepcion,
          recibidoPor: recibidoPor.trim(),
          cargoRecepcion: cargoRecepcion.trim(),
          tecnicoNombre: currentUser.name,
          tecnicoRut: currentUser.rut,
        }),
        estado: 'Completado'
      });

      // Guardar checklist
      const checkItems = Object.entries(checklist)
        .map(([item, value]) => ({
          orden_id: orden.id,
          item,
          estado: preventiveChecklistEstadoForDb(value)
        }))
        .filter(item => ['Si', 'No', 'N/A', 'Falla'].includes(item.estado));
      const { error: delErr } = await supabase.from('orden_checklist').delete().eq('orden_id', orden.id);
      if (delErr) throw delErr;
      if (checkItems.length > 0) {
        const { error: insErr } = await supabase.from('orden_checklist').insert(checkItems);
        if (insErr) {
          console.warn('No se pudo guardar la copia resumida del checklist preventivo:', insErr);
        }
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
            <div className="grid grid-cols-1 gap-2 border-b border-slate-100 px-6 py-2 text-[10px] font-black uppercase text-slate-400 lg:grid-cols-[1fr_auto] lg:items-center">
              <span>Actividad</span>
              <div className="grid grid-cols-[minmax(88px,auto)_repeat(4,minmax(44px,auto))] gap-2">
                <span className="text-center">Criticidad</span>
                <span className="col-span-4 text-center">Estados</span>
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {section.items.map((item, i) => {
                const itemLabel = protocolItemLabel(item);
                const itemCriticidad = protocolItemCriticidad(item);
                const itemRequired = protocolItemRequired(item);
                const itemKey = `${section.section} - ${itemLabel}`;
                const entry = { ...normalizePreventiveChecklistEntry(checklist[itemKey]), criticidad: itemCriticidad };
                return (
                  <div key={i} className="flex flex-col gap-3 px-6 py-3 hover:bg-slate-50 transition-colors lg:flex-row lg:items-center lg:justify-between">
                    <span className="flex flex-wrap items-center gap-2 text-sm text-slate-700 font-medium">
                      {itemLabel}
                      {itemRequired && (
                        <span className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">
                          Obligatorio
                        </span>
                      )}
                    </span>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="grid grid-cols-[minmax(88px,auto)_repeat(4,minmax(44px,auto))] gap-2 md:items-center">
                      <span className={`flex items-center justify-center rounded border px-3 py-1 text-[10px] font-bold uppercase ${itemCriticidad === 'Critico' ? 'border-amber-200 bg-amber-100 text-amber-800' : 'border-slate-200 bg-slate-100 text-slate-500'}`}>
                        {itemCriticidad}
                      </span>
                      {statusOptions.map(status => (
                        <button key={status}
                          disabled={status === 'Falla' && !(itemCriticidad === 'Critico' && entry.estado === 'No')}
                          onClick={() => toggleChecklistStatus(itemKey, itemCriticidad, status, entry)}
                          className={`px-3 py-1 rounded text-[10px] font-bold border transition-all ${
                            preventiveEntryMatches(entry, status)
                              ? status === 'Si' ? 'bg-green-600 border-green-600 text-white' : status === 'No' || status === 'Falla' ? 'bg-red-600 border-red-600 text-white' : 'bg-slate-500 border-slate-500 text-white'
                              : status === 'Falla' && !(itemCriticidad === 'Critico' && entry.estado === 'No')
                                ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                          }`}>{status}</button>
                      ))}
                      </div>
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
                <button key={s} disabled title="Estado calculado automaticamente por criticidad y resultado"
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${estadoEquipo === s ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>{s}</button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <SignaturePad
              signerName={currentUser.name}
              initialValue={signatureData}
              onChange={setSignatureData}
              disabled={isReopenedPreventiva}
            />
            <p className={`text-[10px] font-bold uppercase ${signatureData ? 'text-green-600' : 'text-slate-400'}`}>
              {signatureData ? 'Firma capturada' : 'Firma pendiente'}
            </p>
          </div>
        </div>
      </Card>

      <Card className="space-y-4 border-l-4 border-l-blue-500">
        <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Recepcion del equipo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nombre" value={recibidoPor} onChange={(e) => setRecibidoPor(e.target.value)} placeholder="Nombre de quien recibe" />
          <Input label="Cargo" value={cargoRecepcion} onChange={(e) => setCargoRecepcion(e.target.value)} placeholder="Cargo de quien recibe" />
        </div>
        <SignaturePad
          label="Firma de recepcion"
          signerName={recibidoPor || 'Pendiente de receptor'}
          initialValue={firmaRecepcion}
          onChange={setFirmaRecepcion}
          disabled={isReopenedPreventiva}
        />
      </Card>

      <div className="flex gap-4 pb-12">
        <Button variant="secondary" className="flex-1" onClick={handleBackToRegistro} icon={ChevronLeft}>Atrás</Button>
        <Button variant="accent" className="flex-[2] py-4" onClick={handleFinish} disabled={isSubmitting} icon={isSubmitting ? Cpu : FileDown}>
          {isSubmitting ? 'Guardando en Supabase...' : 'Finalizar y Guardar Informe'}
        </Button>
      </div>
    </div>
  );
};

// --- MANTENCIÓN CORRECTIVA ---
const MantencionCorrectiva = () => {
  const { formData, setActiveModule, repuestos, saveOrden, resetRegistrationForm, currentUser, parametros } = useContext(ERPContext);
  const defaultCondicionInicial = `Se recibe equipo ${formData.tipoEquipo || 'sin tipo definido'} ${formData.marca || ''} ${formData.modelo || ''}, serie ${formData.numeroSerie || 'sin serie'}, inventario ${formData.numeroInventario || 'sin inventario'}, ubicado en ${formData.ubicacionArea || 'area no informada'}, por solicitud de ${formData.solicitadoPor || 'solicitante no informado'}, reportando fallas o problemas en su funcionamiento.`;
  const isReopenedCorrectiva = Boolean(formData.ordenId);
  const repuestoVisibleFields = (r = {}) => ({
    id: r.id,
    name: r.name || '',
    part_number: r.part_number || '',
    qty: r.qty || 1,
    toBodega: Boolean(r.toBodega),
    garantia: Boolean(r.garantia),
    lockedQty: Boolean(r.lockedQty),
    tempId: r.tempId || `${r.id || 'repuesto'}-${Date.now()}-${Math.random()}`
  });
  const [repuestosSeleccionados, setRepuestosSeleccionados] = useState(Array.isArray(formData.correctivaRepuestos) ? formData.correctivaRepuestos.map(repuestoVisibleFields) : []);
  const garantiaPrefix = formData.correctivaGarantiaContrato
    ? `El equipo corresponde a una garantia por contrato${formData.correctivaOrigenGarantiaFolio ? ` asociada a la mantencion correctiva previa ${formData.correctivaOrigenGarantiaFolio}` : ''}.`
    : '';
  const initialCondicionInicial = formData.correctivaCondicionInicial || defaultCondicionInicial;
  const [condicionInicial, setCondicionInicial] = useState(garantiaPrefix && !initialCondicionInicial.includes('garantia por contrato') ? `${garantiaPrefix}\n\n${initialCondicionInicial}` : initialCondicionInicial);
  const [diagnostico, setDiagnostico] = useState({
    text: formData.correctivaDiagnostico || '',
    conclusion: formData.correctivaConclusion || ''
  });
  const [condicionFinal, setCondicionFinal] = useState(formData.correctivaCondicionFinal || DEFAULT_CONDICION_FINAL_CORRECTIVA);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const estadoInternoOptions = ensureDefaultEstadosInternos(parametros?.estadosInternosCorrectiva || []);
  const [estadoInterno, setEstadoInterno] = useState(formData.correctivaEstadoInterno || estadoInternoOptions[0] || 'Ingresado');
  const [fotos, setFotos] = useState(Array.isArray(formData.correctivaFotos) ? formData.correctivaFotos : []);
  const [firmaCorrectiva, setFirmaCorrectiva] = useState(formData.correctivaFirma || '');
  const [firmaRecepcion, setFirmaRecepcion] = useState(formData.correctivaFirmaRecepcion || '');
  const [recibidoPor, setRecibidoPor] = useState(formData.correctivaRecibidoPor || '');
  const [cargoRecepcion, setCargoRecepcion] = useState(formData.correctivaCargoRecepcion || '');
  const availableRepuestos = repuestos.filter(r => r.licitacion_id === formData.licitacionId);
  const garantiaHabilitada = Boolean(formData.correctivaGarantiaContrato);
  const estadoEsEjecutado = isEstadoEjecutado(estadoInterno);
  const estadoInternoKey = normalizeKey(estadoInterno);
  const muestraCondicionFinal = ['garantia', 'sugerencia de baja'].includes(estadoInternoKey) || estadoEsEjecutado;

  const handleBackToRegistro = () => {
    resetRegistrationForm();
    setActiveModule('operaciones-registro');
  };

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
    setRepuestosSeleccionados(prev => [...prev, repuestoVisibleFields({ ...r, qty: 1, toBodega: false, garantia: false, lockedQty: false, tempId: Date.now() })]);
  };
  const updateRepuestoSeleccionado = (tempId, patch) => {
    setRepuestosSeleccionados(prev => prev.map(r => r.tempId === tempId ? { ...r, ...patch } : r));
  };

  const generateAI = () => {
    if (!diagnostico.text.trim()) {
      alert('Primero escribe el hallazgo tecnico del problema del equipo.');
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      const items = repuestosSeleccionados.map(r => r.name).filter(Boolean).join(', ') || 'sin repuestos seleccionados';
      const estiloConclusion = normalizeKey(parametros?.promptConclusionCorrectiva || DEFAULT_CORRECTIVA_CONCLUSION_PROMPT);
      const requiereDetalle = estiloConclusion.includes('detall') || estiloConclusion.includes('diagnostico');
      const garantiaText = garantiaHabilitada ? ' Considerando que el caso se encuentra asociado a garantía por contrato, se recomienda mantener trazabilidad de la intervención y de los componentes evaluados.' : '';
      const equipo = `${formData.tipoEquipo || 'equipo'} ${formData.marca || ''} ${formData.modelo || ''}`.trim();
      const serieInventario = [
        formData.numeroSerie ? `serie ${formData.numeroSerie}` : '',
        formData.numeroInventario ? `inventario ${formData.numeroInventario}` : ''
      ].filter(Boolean).join(', ');
      const contextoEquipo = `${equipo}${serieInventario ? `, ${serieInventario}` : ''}`;
      const detalle = requiereDetalle
        ? ` Se debe revisar el conjunto asociado al componente comprometido, confirmar si existe desgaste, pérdida de ajuste, daño eléctrico, fatiga mecánica o falla de conexión, y validar que la causa detectada no afecte otros subsistemas del equipo.`
        : '';
      setDiagnostico(prev => ({
        ...prev,
        conclusion: `El análisis técnico del ${contextoEquipo} permite orientar la falla hacia un daño o deterioro del componente asociado al sistema intervenido. La causa probable se relaciona con desgaste operacional, pérdida de ajuste, fatiga del material o alteración funcional del repuesto comprometido, lo que puede generar un comportamiento inestable del equipo y afectar su desempeño durante el uso.\n\nLa solución técnica recomendada es intervenir el conjunto afectado, reemplazar o reparar el repuesto comprometido según corresponda, revisar sus puntos de fijación, conexiones y elementos relacionados, y posteriormente realizar pruebas funcionales para confirmar que la falla fue corregida. Para esta intervención se consideran los siguientes repuestos o servicios: ${items}.${detalle}${garantiaText}\n\nFinalizada la reparación, se recomienda verificar el funcionamiento del equipo en condiciones normales de operación, dejar registro de las acciones ejecutadas y entregar el equipo solo cuando se confirme una respuesta estable y conforme.`
      }));
      setIsGenerating(false);
    }, 1500);
  };
  const handleFinish = async () => {
    if (estadoEsEjecutado && (!recibidoPor.trim() || !cargoRecepcion.trim() || !firmaRecepcion)) {
      alert('Para marcar como Ejecutado debes completar Recibido por, Cargo y la firma de recepción.');
      return;
    }
    setIsSaving(true);
    try {
      const orden = await saveOrden({
        estado: estadoInterno,
        observaciones: buildCorrectivaObservaciones({
          condicionInicial,
          diagnostico: diagnostico.text,
          conclusion: diagnostico.conclusion,
          condicionFinal: muestraCondicionFinal ? condicionFinal : '',
          fotos,
          firma: firmaCorrectiva,
          firmaRecepcion: estadoEsEjecutado ? firmaRecepcion : '',
          recibidoPor: estadoEsEjecutado ? recibidoPor.trim() : '',
          cargoRecepcion: estadoEsEjecutado ? cargoRecepcion.trim() : '',
          garantiaContrato: Boolean(formData.correctivaGarantiaContrato),
          origenGarantiaFolio: formData.correctivaOrigenGarantiaFolio || '',
          repuestosGarantia: repuestosSeleccionados
            .filter(r => r.garantia)
            .map(r => ({ id: r.id, name: r.name || '', part_number: r.part_number || '', qty: Number(r.qty) || 1 }))
        })
      });

      // Guardar repuestos usados
      const { error: delRepErr } = await supabase.from('orden_repuestos').delete().eq('orden_id', orden.id);
      if (delRepErr) throw delRepErr;
      if (repuestosSeleccionados.length > 0) {
        const items = repuestosSeleccionados.map(r => ({
          orden_id: orden.id,
          repuesto_id: r.id,
          cantidad: Number(r.qty) || 1,
          desde_bodega: r.toBodega || false,
          garantia: Boolean(r.garantia),
          origen_garantia_folio: r.garantia ? (formData.correctivaOrigenGarantiaFolio || null) : null,
        }));
        const { error: insRepErr } = await supabase.from('orden_repuestos').insert(items);
        if (insRepErr && isSchemaError(insRepErr.message)) {
          const fallbackItems = items.map(({ garantia, origen_garantia_folio, ...base }) => base);
          const { error: fallbackErr } = await supabase.from('orden_repuestos').insert(fallbackItems);
          if (fallbackErr) throw fallbackErr;
          console.warn('La tabla orden_repuestos no tiene columnas de garantia. Ejecuta supabase/garantia_repuestos.sql para guardar el check en tabla.');
        } else if (insRepErr) {
          throw insRepErr;
        }
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
            <SearchableSelect
              options={availableRepuestos}
              placeholder="Buscar repuesto..."
              onChange={(e) => addRepuesto(e.target.value)}
              value=""
              getLabel={(r) => `${r.name || 'Repuesto'}${r.part_number ? ` - ${r.part_number}` : ''}`}
              getSearchText={(r) => [r.name, r.part_number, r.sku].join(' ')}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-left">
                <th className="px-4 py-3 font-bold uppercase text-[10px]">Descripción</th>
                <th className="px-4 py-3 font-bold uppercase text-[10px]">P/N</th>
                <th className="px-4 py-3 font-bold uppercase text-[10px]">Cant.</th>
                <th className="px-4 py-3 font-bold uppercase text-[10px]">Solicitar compra</th>
                {garantiaHabilitada && <th className="px-4 py-3 font-bold uppercase text-[10px]">Garantia</th>}
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {repuestosSeleccionados.map((r) => (
                <tr key={r.tempId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{r.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.part_number}</td>
                  <td className="px-4 py-3"><input type="number" min="1" value={r.qty ?? ''} disabled={r.lockedQty} onChange={e => updateRepuestoSeleccionado(r.tempId, { qty: e.target.value })} onBlur={e => updateRepuestoSeleccionado(r.tempId, { qty: Number(e.target.value) > 0 ? e.target.value : 1 })} className="w-16 border rounded px-1 text-center text-sm disabled:bg-slate-100 disabled:text-slate-400" /></td>
                  <td className="px-4 py-3"><input type="checkbox" checked={Boolean(r.toBodega)} onChange={e => updateRepuestoSeleccionado(r.tempId, { toBodega: e.target.checked })} className="w-4 h-4 rounded" /></td>
                  {garantiaHabilitada && <td className="px-4 py-3"><input type="checkbox" checked={Boolean(r.garantia)} onChange={e => updateRepuestoSeleccionado(r.tempId, { garantia: e.target.checked })} className="w-4 h-4 rounded accent-emerald-600" /></td>}
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setRepuestosSeleccionados(prev => prev.filter(x => x.tempId !== r.tempId))} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {repuestosSeleccionados.length === 0 && (
                <tr><td colSpan={garantiaHabilitada ? 6 : 5} className="px-4 py-10 text-center text-slate-400 italic">No hay repuestos seleccionados</td></tr>
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
          <Button variant="secondary" onClick={generateAI} disabled={isGenerating || !diagnostico.text.trim()} className="text-xs h-8">
            {isGenerating ? 'Generando...' : 'Generar conclusion IA'}
          </Button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400">Hallazgo Técnico</label>
            <textarea className="w-full h-24 p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm mt-1 focus:outline-none resize-none"
              value={diagnostico.text} onChange={(e) => setDiagnostico({ ...diagnostico, text: e.target.value })}
              placeholder="Escribe las notas del problema, sintomas observados, pruebas realizadas y hallazgos tecnicos..." />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400">Conclusión del Informe</label>
            <textarea className="w-full min-h-44 p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm mt-1 focus:outline-none resize-y"
              value={diagnostico.conclusion} onChange={(e) => setDiagnostico({ ...diagnostico, conclusion: e.target.value })} />
          </div>
        </div>
      </Card>

      {muestraCondicionFinal && (
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
          disabled={isReopenedCorrectiva}
        />
      </Card>

      {estadoEsEjecutado && (
        <Card className="space-y-4 border-l-4 border-l-emerald-500">
          <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Recepción de equipo ejecutado</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Recibido por" value={recibidoPor} onChange={(e) => setRecibidoPor(e.target.value)} placeholder="Nombre de quien recibe" />
            <Input label="Cargo" value={cargoRecepcion} onChange={(e) => setCargoRecepcion(e.target.value)} placeholder="Cargo de quien recibe" />
          </div>
          <SignaturePad
            label="Firma de recepción"
            signerName={recibidoPor || 'Pendiente de receptor'}
            initialValue={firmaRecepcion}
            onChange={setFirmaRecepcion}
          />
        </Card>
      )}

      <div className="flex gap-4 pb-12">
        <div className="flex-1">
          <Select label="Estado Interno" options={estadoInternoOptions}
            value={estadoInterno} onChange={(e) => setEstadoInterno(e.target.value)} />
        </div>
        <div className="flex-[2] flex gap-2 items-end">
          <Button variant="secondary" className="flex-1" onClick={handleBackToRegistro} icon={ChevronLeft}>Atrás</Button>
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
    <div className={`bg-white shadow-2xl w-full overflow-hidden flex flex-col ${workspaceFull ? 'h-full max-h-full rounded-none border-t border-slate-100' : fullScreen ? 'h-dvh min-h-dvh max-h-dvh max-w-none rounded-none' : `${wide ? 'max-w-5xl' : 'max-w-lg'} max-h-[calc(100vh-2rem)] rounded-2xl`}`}>
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
const HistorialMantenciones = ({ tipo, verifyOrderId = '', verifyFolio = '' }) => {
  const { clientes, licitaciones, repuestos, setActiveModule, setFormData, setCotizacionDraft, cotizacionesHistorial, currentEmpresa, currentUser, loggedInUser, activeEmpresaId, empresas, protocolosPreventivos } = useContext(ERPContext);
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'fecha', direction: 'desc' });
  const verifiedReportOpened = useRef(false);
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

  useEffect(() => { loadOrdenes(); setSelectedIds([]); setSearchTerm(''); setFechaDesde(''); setFechaHasta(''); }, [tipo]);

  const getCliente = (orden) => {
    const base = clientes.find(c => String(c.id || c.id_RUT || '') === String(orden.cliente_id || ''));
    if (!base) return null;
    const hasContactData = (cliente) => Boolean(clienteDireccion(cliente) || clienteComuna(cliente) || clienteTelefono(cliente));
    if (hasContactData(base) || !base.rut) return base;
    const richerSameRut = clientes.find(c =>
      String(c.id || c.id_RUT || '') !== String(base.id || base.id_RUT || '') &&
      normalizeRutKey(c.rut) === normalizeRutKey(base.rut) &&
      hasContactData(c)
    );
    return richerSameRut ? { ...base, ...clienteExtendedSnapshot(richerSameRut), id: base.id, id_RUT: base.id_RUT || base.id } : base;
  };
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
  const matchesDateRange = (orden) => {
    const fecha = String(orden.fecha || '').slice(0, 10);
    if (!fecha && (fechaDesde || fechaHasta)) return false;
    if (fechaDesde && fecha < fechaDesde) return false;
    if (fechaHasta && fecha > fechaHasta) return false;
    return true;
  };
  const filteredOrdenes = ordenes.filter(orden => matchesSearch(orden) && matchesDateRange(orden));
  const sortValue = (orden, key) => {
    const cliente = getCliente(orden);
    const values = {
      fecha: orden.fecha || orden.created_at || '',
      folio: orden.folio || '',
      cliente: cliente?.name || '',
      equipo: orden.tipo_equipo || '',
      marca: orden.marca || '',
      modelo: orden.modelo || '',
      serie: orden.numero_serie || '',
      inventario: orden.numero_inventario || '',
      estado: orden.estado || orden.estado_equipo || '',
    };
    return normalize(String(values[key] || ''));
  };
  const sortedOrdenes = [...filteredOrdenes].sort((a, b) => {
    const av = sortValue(a, sortConfig.key);
    const bv = sortValue(b, sortConfig.key);
    const result = av.localeCompare(bv, 'es', { numeric: true });
    return sortConfig.direction === 'asc' ? result : -result;
  });
  const toggleSort = (key) => setSortConfig(prev => ({
    key,
    direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
  }));
  const canModifyExecutedCorrectiva = loggedInUser?.isSuperadmin || (
    activeEmpresaId
      ? (userEmpresaAccess(loggedInUser, activeEmpresaId, empresas) || []).includes(PERM_MODIFICAR_CORRECTIVA_EJECUTADA)
      : (loggedInUser?.accesos || []).includes(PERM_MODIFICAR_CORRECTIVA_EJECUTADA)
  );
  const canReopenOrden = (orden) => isPreventivo || !isEstadoEjecutado(orden.estado) || canModifyExecutedCorrectiva;
  const SortableHeader = ({ label, sortKey }) => (
    <th className="p-3 text-[10px] font-bold uppercase text-slate-500">
      <button type="button" onClick={() => toggleSort(sortKey)} className="inline-flex items-center gap-1 hover:text-slate-900">
        <span>{label}</span>
        <ArrowUpDown size={12} className={sortConfig.key === sortKey ? 'text-blue-600' : 'text-slate-300'} />
      </button>
    </th>
  );
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
    const empresaInforme = currentEmpresa || {};
    const empresaNombre = empresaInforme.razonSocial || empresaInforme.nombreFantasia || 'Vaicmedical';
    const empresaRut = empresaInforme.rut || empresaInforme.RUT || '77.573.229-6';
    const empresaGiro = empresaInforme.giro || 'Mantencion y Reparacion de Equipos Medicos';
    const empresaMail = empresaInforme.correoContacto || empresaInforme.email || 'servicios@vaicmedical.cl';
    const empresaMembrete = empresaInforme.membreteImagen || '/logo-vaic-pdf.jpeg';
    const fechaInforme = formatPdfDate(orden.fecha);
    if (isPreventivo) {
      const protocolo = getPreventiveProtocol(orden.tipo_equipo, protocolosPreventivos);
      const preventiva = parsePreventivaObservaciones(orden.observaciones);
      const tecnicoNombre = preventiva.tecnicoNombre || currentUser?.name || '';
      const tecnicoRut = preventiva.tecnicoRut || currentUser?.rut || '';
      const checklist = orden.preventivaChecklist || preventiva.checklist || {};
      const isStructuredPreventiva = String(orden.observaciones || '').startsWith(PREVENTIVA_OBS_PREFIX);
      const obs = htmlText(isStructuredPreventiva ? preventiva.observaciones : (preventiva.observaciones || orden.observaciones || ''));
      const firmaPreventiva = preventiva.firma
        ? `<img class="firma-img" src="${preventiva.firma}" alt="Firma tecnico"/>`
        : '';
      const firmaRecepcionPreventiva = preventiva.firmaRecepcion
        ? `<img class="firma-img" src="${preventiva.firmaRecepcion}" alt="Firma recepcion"/>`
        : '';
      const mark = (item, status) => preventiveEntryMatches(checklist[item], status) ? 'X' : '';
      const criticidad = (item) => normalizePreventiveChecklistEntry(checklist[item]).criticidad;
      const verificationUrl = preventiveVerificationUrl(orden);
      const recepcionPreventivaHtml = `<div class="section-title">Recepcion del equipo</div><table class="recepcion"><thead><tr><th>Nombre</th><th>Cargo</th><th>Verificacion QR</th></tr></thead><tbody><tr><td>${htmlText(preventiva.recibidoPor || '')}</td><td>${htmlText(preventiva.cargoRecepcion || '')}</td><td class="qr-cell"><img class="qr" src="${qrImageUrl(verificationUrl)}" alt="QR verificacion"/><div class="qr-url">${htmlText(verificationUrl)}</div></td></tr></tbody></table>`;
      return `
        <html><head><title>${orden.folio}</title><style>
        body{font-family:Arial,sans-serif;color:#111827;margin:0;padding:24px}.page{max-width:960px;margin:auto}
        .head{display:grid;grid-template-columns:150px 1fr 176px;border:2px solid #111827;padding:12px;align-items:center;gap:18px}.logo-box{display:flex;align-items:center;justify-content:flex-start}.logo{display:block;width:136px;max-height:88px;object-fit:contain}.brand{font-weight:800;font-size:18px}.company{text-align:center;font-size:11px;line-height:1.5;color:#334155}.meta{text-align:right;font-size:12px;line-height:1.5;color:#111827}.folio-label{font-size:10px;text-transform:uppercase;color:#475569;font-weight:700}.folio-value{display:block;font-size:22px;line-height:1.1;font-weight:900;color:#0f172a;margin-bottom:8px}
        h1{font-size:16px;text-align:center;margin:16px 0;text-transform:uppercase}.grid{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #111827;border-bottom:0}
        .cell{border-bottom:1px solid #111827;border-right:1px solid #111827;padding:7px;font-size:12px}.cell b{display:block;font-size:10px;text-transform:uppercase;color:#475569}
        table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #111827;padding:6px;font-size:11px}.mark{text-align:center;font-weight:800}th{background:#e5e7eb}.obs{border:1px solid #111827;padding:10px;min-height:70px;margin-top:12px;font-size:12px}
        .section-title{font-size:12px;font-weight:800;text-transform:uppercase;margin-top:14px}.recepcion th,.recepcion td{text-align:left;vertical-align:middle}.recepcion th:nth-child(3),.recepcion td:nth-child(3){width:180px;text-align:center}.qr{width:108px;height:108px;object-fit:contain}.qr-url{font-size:7px;line-height:1.2;color:#475569;word-break:break-all;margin-top:4px}
        .firma-img{display:block;max-width:240px;max-height:90px;margin:0 auto}
        .sign{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:40px}.sign-card{display:flex;flex-direction:column}.signature-slot{height:96px;display:flex;align-items:flex-end;justify-content:center}.line{border-top:1px solid #111827;text-align:center;padding-top:8px;font-size:11px;min-height:38px}
        @media print{button{display:none}body{padding:0}}
        </style></head><body><div class="page">
        <div class="head"><div class="logo-box"><img class="logo" src="${empresaMembrete}" alt="Membrete empresa"/></div><div class="company"><div class="brand">${htmlText(empresaNombre)}</div><div>RUT: ${htmlText(empresaRut)}</div><div>Giro: ${htmlText(empresaGiro)}</div><div>Correo: ${htmlText(empresaMail)}</div></div><div class="meta"><span class="folio-label">Folio</span><span class="folio-value">${htmlText(orden.folio || '')}</span>Fecha: ${htmlText(fechaInforme)}</div></div>
        <h1>${protocolo.title}</h1>
        <div class="grid">
          <div class="cell"><b>Cliente</b>${cliente?.name || ''}</div><div class="cell"><b>RUT</b>${cliente?.rut || ''}</div><div class="cell"><b>Licitacion</b>${lic?.id_licitacion || lic?.name || ''}</div>
          <div class="cell"><b>Equipo</b>${orden.tipo_equipo || ''}</div><div class="cell"><b>Marca</b>${orden.marca || ''}</div><div class="cell"><b>Modelo</b>${orden.modelo || ''}</div>
          <div class="cell"><b>Serie</b>${orden.numero_serie || ''}</div><div class="cell"><b>Inventario</b>${orden.numero_inventario || ''}</div><div class="cell"><b>Servicio</b>${orden.ubicacion_area || ''}</div>
        </div>
        <table><thead><tr><th rowspan="2">Accion</th><th rowspan="2">Criticidad</th><th colspan="4">Estados</th></tr><tr><th>Si</th><th>No</th><th>N/A</th><th>Falla</th></tr></thead><tbody>
        ${protocolo.sections.flatMap(s => [`<tr><th colspan="6">${s.section}</th></tr>`, ...s.items.map(i => {
          const itemLabel = protocolItemLabel(i);
          const itemKey = `${s.section} - ${itemLabel}`;
          return `<tr><td>${htmlText(itemLabel)}</td><td>${criticidad(itemKey)}</td><td class="mark">${mark(itemKey, 'Si')}</td><td class="mark">${mark(itemKey, 'No')}</td><td class="mark">${mark(itemKey, 'N/A')}</td><td class="mark">${mark(itemKey, 'Falla')}</td></tr>`;
        })]).join('')}
        </tbody></table>
        <div class="obs"><b>Observaciones</b><br/>${obs}</div>
        <p><b>Estado final:</b> ${orden.estado_equipo || orden.estado || ''}</p>
        ${recepcionPreventivaHtml}
        <div class="sign"><div class="sign-card"><div class="signature-slot">${firmaRecepcionPreventiva}</div><div class="line">Firma y Recepcion Conforme</div></div><div class="sign-card"><div class="signature-slot">${firmaPreventiva}</div><div class="line">Tecnico en Mantenimiento Equipo Medico${tecnicoNombre ? `<br/>${htmlText(tecnicoNombre)}` : ''}${tecnicoRut ? ` - RUT: ${htmlText(tecnicoRut)}` : ''}</div></div></div>
        <button onclick="window.print()">Imprimir / Guardar PDF</button>
        </div></body></html>`;
    }
    const correctiva = parseCorrectivaObservaciones(orden.observaciones);
    const correctivaEstado = String(orden.estado || '').trim();
    const correctivaEstadoKey = normalizeKey(correctivaEstado);
    const correctivaTitle = correctiva.garantiaContrato || correctivaEstadoKey === 'garantia'
      ? 'MANT. CORRECTIVO. - GARANTIA'
      : isEstadoEjecutado(orden.estado)
        ? 'MANT. CORRECTIVO - EJECUTADO'
        : correctivaEstadoKey === 'ingresado'
          ? 'MANT. CORRECTIVO - DIAGNOSTICO'
          : correctivaEstado
            ? `MANT. CORRECTIVO - ${correctivaEstado.toUpperCase()}`
            : 'MANT. CORRECTIVO';
    const correctivaFotos = correctiva.fotos.length > 0
      ? `<div class="photos">${correctiva.fotos.map(f => `<figure><img src="${f.src}" alt="${f.name || 'foto'}"/><figcaption>${htmlText(f.name || '')}</figcaption></figure>`).join('')}</div>`
      : '';
    const correctivaFirma = correctiva.firma
      ? `<img class="firma-img" src="${correctiva.firma}" alt="Firma tecnico"/>`
      : '';
    const correctivaFirmaRecepcion = correctiva.firmaRecepcion
      ? `<img class="firma-img" src="${correctiva.firmaRecepcion}" alt="Firma recepcion"/>`
      : '';
    const correctivaVerificationUrl = reportVerificationUrl('correctiva', orden);
    const recepcionHtml = `<div class="section-title">Recepcion del equipo</div><table class="recepcion"><thead><tr><th>Nombre</th><th>Cargo</th><th>Verificacion QR</th></tr></thead><tbody><tr><td>${htmlText(correctiva.recibidoPor || '')}</td><td>${htmlText(correctiva.cargoRecepcion || '')}</td><td class="qr-cell"><img class="qr" src="${qrImageUrl(correctivaVerificationUrl)}" alt="QR verificacion"/><div class="qr-url">${htmlText(correctivaVerificationUrl)}</div></td></tr></tbody></table>`;
    const showCorrectivaCondicionFinal = ['garantia', 'sugerencia de baja'].includes(correctivaEstadoKey) || isEstadoEjecutado(orden.estado);
    const diagnosticoHtml = correctiva.conclusion ? htmlText(correctiva.conclusion) : '';
    return `
      <html><head><title>${orden.folio}</title><style>
      body{font-family:Arial,sans-serif;color:#111827;margin:0;padding:24px}.page{max-width:960px;margin:auto}
      .head{display:grid;grid-template-columns:150px 1fr 176px;border:2px solid #111827;padding:12px;align-items:center;gap:18px}.logo-box{display:flex;align-items:center;justify-content:flex-start}.logo{display:block;width:136px;max-height:88px;object-fit:contain}.brand{font-weight:800;font-size:18px}.company{text-align:center;font-size:11px;line-height:1.5;color:#334155}.meta{text-align:right;font-size:12px;line-height:1.5;color:#111827}.folio-label{font-size:10px;text-transform:uppercase;color:#475569;font-weight:700}.folio-value{display:block;font-size:22px;line-height:1.1;font-weight:900;color:#0f172a;margin-bottom:8px}
      h1{font-size:16px;text-align:center;margin:16px 0;text-transform:uppercase;letter-spacing:.06em}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:0;border:1px solid #111827;border-bottom:0}.cell{border-right:1px solid #111827;border-bottom:1px solid #111827;padding:7px;font-size:12px}.cell b{display:block;font-size:10px;text-transform:uppercase;color:#475569}
      .section{margin-top:18px}.section-title{font-size:12px;font-weight:800;text-transform:uppercase;margin-top:14px}.box{border:1px solid #111827;padding:12px;min-height:70px;font-size:12px;line-height:1.45}.recepcion{width:100%;border-collapse:collapse;margin-top:16px}.recepcion th,.recepcion td{border:1px solid #111827;padding:6px;font-size:11px;text-align:left;vertical-align:middle}.recepcion th{background:#e5e7eb}.recepcion th:nth-child(3),.recepcion td:nth-child(3){width:180px;text-align:center}.qr{width:108px;height:108px;object-fit:contain}.qr-url{font-size:7px;line-height:1.2;color:#475569;word-break:break-all;margin-top:4px}.sign{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:40px}.sign-card{display:flex;flex-direction:column}.signature-slot{height:96px;display:flex;align-items:flex-end;justify-content:center}.line{border-top:1px solid #111827;text-align:center;padding-top:8px;font-size:11px;min-height:38px}
      .photos{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,140px));gap:8px;margin-top:10px}.photos figure{margin:0;break-inside:avoid}.photos img{width:100%;height:92px;object-fit:contain;border:1px solid #cbd5e1;background:#f8fafc}.photos figcaption{font-size:9px;color:#64748b;margin-top:3px;word-break:break-word}.firma-img{display:block;max-width:240px;max-height:90px;margin:0 auto 8px}
      @media print{button{display:none}body{padding:0}}
      </style></head><body><div class="page">
      <div class="head"><div class="logo-box"><img class="logo" src="${empresaMembrete}" alt="Membrete empresa"/></div><div class="company"><div class="brand">${htmlText(empresaNombre)}</div><div>RUT: ${htmlText(empresaRut)}</div><div>Giro: ${htmlText(empresaGiro)}</div><div>Correo: ${htmlText(empresaMail)}</div></div><div class="meta"><span class="folio-label">Folio</span><span class="folio-value">${htmlText(orden.folio || '')}</span>Fecha: ${htmlText(fechaInforme)}</div></div>
      <h1>${correctivaTitle}</h1>
      <div class="grid">
        <div class="cell"><b>Cliente</b>${cliente?.name || ''}</div><div class="cell"><b>RUT</b>${cliente?.rut || ''}</div>
        <div class="cell"><b>Licitacion convenio</b>${lic?.id_licitacion || lic?.name || ''}</div><div class="cell"><b>Servicio</b>${orden.ubicacion_area || ''}</div>
        <div class="cell"><b>Tipo de equipo</b>${orden.tipo_equipo || ''}</div><div class="cell"><b>Marca</b>${orden.marca || ''}</div>
        <div class="cell"><b>Modelo</b>${orden.modelo || ''}</div><div class="cell"><b>Serie / Inventario</b>${orden.numero_serie || ''} / ${orden.numero_inventario || ''}</div>
      </div>
      <div class="section"><h3>Condicion inicial de equipo</h3><div class="box">${htmlText(correctiva.condicionInicial || correctivaText(correctiva))}</div></div>
      <div class="section"><h3>Informacion de diagnostico</h3><div class="box">${diagnosticoHtml}</div></div>
      ${showCorrectivaCondicionFinal ? `<div class="section"><h3>Condicion final</h3><div class="box">${htmlText(correctiva.condicionFinal || DEFAULT_CONDICION_FINAL_CORRECTIVA)}</div></div>` : ''}
      ${correctivaFotos ? `<div class="section"><h3>Registro fotografico</h3>${correctivaFotos}</div>` : ''}
      ${recepcionHtml}
      <div class="sign"><div class="sign-card"><div class="signature-slot">${correctivaFirmaRecepcion}</div><div class="line">Firma y Recepcion Conforme</div></div><div class="sign-card"><div class="signature-slot">${correctivaFirma}</div><div class="line">Tecnico en Mantenimiento Equipo Medico</div></div></div>
      <button onclick="window.print()">Imprimir / Guardar PDF</button>
      </div></body></html>`;
  };

  const prepareReportOrden = async (orden) => {
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
    return reportOrden;
  };

  const openReportWindow = async (orden) => {
    const reportOrden = await prepareReportOrden(orden);
    const win = window.open('', '_blank');
    win.document.write(buildReportHtml(reportOrden));
    win.document.close();
    win.focus();
    return win;
  };

  const reportInnerHtml = (html) => {
    const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || html;
    return body.replace(/<button[\s\S]*?<\/button>/gi, '');
  };

  const reportStyle = (html) => html.match(/<style>([\s\S]*?)<\/style>/i)?.[1] || '';

  const buildBulkReportsHtml = (reports) => {
    const firstHtml = reports[0]?.html || '';
    const styles = `${reportStyle(firstHtml)}
      .bulk-report{break-after:page;page-break-after:always}
      .bulk-report:last-child{break-after:auto;page-break-after:auto}
      @media print{.bulk-actions{display:none}}`;
    const pages = reports.map(report => `<section class="bulk-report">${reportInnerHtml(report.html)}</section>`).join('');
    return `<html><head><title>Informes ${isPreventivo ? 'preventivos' : 'correctivos'}</title><style>${styles}</style></head><body><div class="bulk-actions"><button onclick="window.print()">Imprimir / Guardar PDF masivo</button></div>${pages}</body></html>`;
  };

  const recordsForMassAction = () => selectedOrdenes.length > 0 ? selectedOrdenes : filteredOrdenes;

  const downloadBulkPdfs = async () => {
    const targets = recordsForMassAction();
    if (targets.length === 0) {
      alert('No hay registros para descargar.');
      return;
    }
    const prepared = await Promise.all(targets.map(async (orden) => {
      const reportOrden = await prepareReportOrden(orden);
      return { orden: reportOrden, html: buildReportHtml(reportOrden) };
    }));
    const win = window.open('', '_blank');
    win.document.write(buildBulkReportsHtml(prepared));
    win.document.close();
    win.focus();
  };

  const exportHistorialExcel = () => {
    const targets = recordsForMassAction();
    if (targets.length === 0) {
      alert('No hay registros para exportar.');
      return;
    }
    const rows = targets.map((orden) => {
      const cliente = getCliente(orden);
      const lic = getLicitacion(orden);
      return {
        Folio: orden.folio || '',
        Fecha: formatPdfDate(orden.fecha),
        Cliente: cliente?.name || '',
        RUT: cliente?.rut || '',
        Licitacion: lic?.id_licitacion || lic?.name || '',
        Equipo: orden.tipo_equipo || '',
        Marca: orden.marca || '',
        Modelo: orden.modelo || '',
        Serie: orden.numero_serie || '',
        Inventario: orden.numero_inventario || '',
        Servicio: orden.ubicacion_area || '',
        'Solicitado por': orden.solicitado_por || '',
        'Estado interno': orden.estado || '',
        'Estado equipo': orden.estado_equipo || '',
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isPreventivo ? 'Preventivo' : 'Correctivo');
    const suffix = new Date().toISOString().replace(/\D/g, '').slice(0, 12);
    XLSX.writeFile(wb, `historial_${isPreventivo ? 'preventivo' : 'correctivo'}_${suffix}.xlsx`);
  };

  useEffect(() => {
    if (!isPreventivo || verifiedReportOpened.current || loading || (!verifyOrderId && !verifyFolio)) return;
    const target = ordenes.find(orden =>
      (verifyOrderId && String(orden.id) === String(verifyOrderId)) ||
      (verifyFolio && String(orden.folio || '').toLowerCase() === String(verifyFolio).toLowerCase())
    );
    if (!target) return;
    verifiedReportOpened.current = true;
    openReportWindow(target);
  }, [isPreventivo, loading, ordenes, verifyOrderId, verifyFolio]);

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
    const correctiva = parseCorrectivaObservaciones(orden.observaciones);
    const garantiaIds = new Set((correctiva.repuestosGarantia || []).map(item => String(item.id || '')));
    const repuestoItems = (usados || []).map((usado) => {
      const repuesto = repuestos.find(r => r.id === usado.repuesto_id) || {};
      const esGarantia = Boolean(usado.garantia) || garantiaIds.has(String(usado.repuesto_id || ''));
      return {
        codigo: repuesto.sku || '',
        parte: repuesto.part_number || '',
        descripcion: repuesto.name || 'Repuesto sin descripcion',
        unidad: 'Uns',
        cantidad: usado.cantidad || 1,
        precio: esGarantia ? 0 : (repuesto.valor_neto || 0),
        dcto: 0,
      };
    });
    setCotizacionDraft({
      numero: nextCotizacionNumero(cotizacionesHistorial),
      fecha: new Date().toISOString().split('T')[0],
      cliente: cliente?.name || '',
      clienteId: cliente?.id || cliente?.id_RUT || orden.cliente_id || '',
      rut: cliente?.rut || '',
      direccion: clienteDireccion(cliente),
      comuna: clienteComuna(cliente),
      telefono: clienteTelefono(cliente),
      solicitadoPor: orden.solicitado_por || '',
      vendedor: '',
      idLicitacion: getLicitacion(orden)?.id_licitacion || getLicitacion(orden)?.name || '',
      licitacionId: getLicitacion(orden)?.id || '',
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
        const correctiva = parseCorrectivaObservaciones(orden.observaciones);
        const garantiaIds = new Set((correctiva.repuestosGarantia || []).map(item => String(item.id || '')));
        const repuestoItems = repuestosOrden.map((usado) => {
          const repuesto = repuestos.find(r => r.id === usado.repuesto_id) || {};
          const esGarantia = Boolean(usado.garantia) || garantiaIds.has(String(usado.repuesto_id || ''));
          return {
            codigo: repuesto.sku || '',
            parte: repuesto.part_number || '',
            descripcion: repuesto.name || 'Repuesto sin descripcion',
            unidad: 'Uns',
            cantidad: usado.cantidad || 1,
            precio: esGarantia ? 0 : (repuesto.valor_neto || 0),
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
      numero: nextCotizacionNumero(cotizacionesHistorial),
      fecha: new Date().toISOString().split('T')[0],
      cliente: clientesUnicos.length === 1 ? clientesUnicos[0] : 'Cotizacion masiva - multiples clientes',
      clienteId: clientesUnicos.length === 1 ? firstCliente.id || firstCliente.id_RUT || selectedOrdenes[0]?.cliente_id || '' : '',
      rut: clientesUnicos.length === 1 ? firstCliente.rut || '' : '',
      direccion: clientesUnicos.length === 1 ? clienteDireccion(firstCliente) : '',
      comuna: clientesUnicos.length === 1 ? clienteComuna(firstCliente) : '',
      telefono: clientesUnicos.length === 1 ? clienteTelefono(firstCliente) : '',
      solicitadoPor: selectedOrdenes[0]?.solicitado_por || '',
      vendedor: '',
      idLicitacion: Array.from(new Set(selectedOrdenes.map(o => getLicitacion(o)?.id_licitacion || getLicitacion(o)?.name).filter(Boolean))).join(', '),
      licitacionId: Array.from(new Set(selectedOrdenes.map(o => getLicitacion(o)?.id).filter(Boolean))).length === 1
        ? Array.from(new Set(selectedOrdenes.map(o => getLicitacion(o)?.id).filter(Boolean)))[0]
        : '',
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

  const openEdit = (orden) => setEditModal({
    ...orden,
    editCorrectiva: !isPreventivo ? parseCorrectivaObservaciones(orden.observaciones) : null,
    editPreventiva: isPreventivo ? parsePreventivaObservaciones(orden.observaciones) : null,
  });
  const saveEdit = async () => {
    const nextObservaciones = isPreventivo
      ? buildPreventivaObservaciones({
          observaciones: editModal.editPreventiva?.observaciones || '',
          checklist: editModal.editPreventiva?.checklist || {},
          firma: editModal.editPreventiva?.firma || '',
          firmaRecepcion: editModal.editPreventiva?.firmaRecepcion || '',
          recibidoPor: editModal.editPreventiva?.recibidoPor || '',
          cargoRecepcion: editModal.editPreventiva?.cargoRecepcion || '',
          tecnicoNombre: editModal.editPreventiva?.tecnicoNombre || '',
          tecnicoRut: editModal.editPreventiva?.tecnicoRut || '',
        })
      : buildCorrectivaObservaciones({
          condicionInicial: editModal.editCorrectiva?.condicionInicial || '',
          diagnostico: editModal.editCorrectiva?.diagnostico || '',
          conclusion: editModal.editCorrectiva?.conclusion || '',
          condicionFinal: editModal.editCorrectiva?.condicionFinal || '',
          fotos: editModal.editCorrectiva?.fotos || [],
          firma: editModal.editCorrectiva?.firma || '',
          firmaRecepcion: editModal.editCorrectiva?.firmaRecepcion || '',
          recibidoPor: editModal.editCorrectiva?.recibidoPor || '',
          cargoRecepcion: editModal.editCorrectiva?.cargoRecepcion || '',
          garantiaContrato: editModal.editCorrectiva?.garantiaContrato || false,
          origenGarantiaFolio: editModal.editCorrectiva?.origenGarantiaFolio || '',
          repuestosGarantia: editModal.editCorrectiva?.repuestosGarantia || [],
        });
    const payload = {
      tipo_equipo: editModal.tipo_equipo,
      marca: editModal.marca,
      modelo: editModal.modelo,
      numero_serie: editModal.numero_serie,
      numero_inventario: editModal.numero_inventario,
      ubicacion_area: editModal.ubicacion_area,
      solicitado_por: editModal.solicitado_por,
      fecha: editModal.fecha,
      observaciones: nextObservaciones,
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
    if (!canReopenOrden(orden)) {
      alert('Este mantenimiento correctivo ya fue Ejecutado y solo puede reabrirlo personal autorizado.');
      return;
    }
    const cliente = getCliente(orden);
    const lic = getLicitacion(orden);
    const preventiva = isPreventivo
      ? parsePreventivaObservaciones(orden.observaciones)
      : { observaciones: '', checklist: {}, firma: '' };
    const correctiva = isPreventivo
      ? { condicionInicial: '', diagnostico: '', conclusion: '', condicionFinal: '', fotos: [], firma: '', firmaRecepcion: '', recibidoPor: '', cargoRecepcion: '' }
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
      const garantiaIds = new Set((correctiva.repuestosGarantia || []).map(item => String(item.id || '')));
      correctivaRepuestos = (data || []).map((item, index) => {
        const repuesto = repuestos.find(r => r.id === item.repuesto_id) || {};
        const esGarantia = Boolean(item.garantia) || garantiaIds.has(String(item.repuesto_id || repuesto.id || ''));
        return {
          ...repuesto,
          id: item.repuesto_id || repuesto.id,
          qty: item.cantidad || 1,
          toBodega: Boolean(item.desde_bodega),
          garantia: esGarantia,
          lockedQty: esGarantia,
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
      preventivaFirmaRecepcion: preventiva.firmaRecepcion,
      preventivaRecibidoPor: preventiva.recibidoPor,
      preventivaCargoRecepcion: preventiva.cargoRecepcion,
      correctivaCondicionInicial: correctiva.condicionInicial,
      correctivaDiagnostico: correctiva.diagnostico,
      correctivaConclusion: correctiva.conclusion,
      correctivaCondicionFinal: correctiva.condicionFinal,
      correctivaFotos: correctiva.fotos,
      correctivaFirma: correctiva.firma,
      correctivaRepuestos,
      correctivaEstadoInterno: orden.estado || '',
      correctivaFirmaRecepcion: correctiva.firmaRecepcion,
      correctivaRecibidoPor: correctiva.recibidoPor,
      correctivaCargoRecepcion: correctiva.cargoRecepcion,
      correctivaGarantiaContrato: correctiva.garantiaContrato,
      correctivaOrigenGarantiaFolio: correctiva.origenGarantiaFolio,
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
            {isPreventivo ? (
              <div className="md:col-span-3 flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700">Observaciones</label>
                <textarea value={editModal.editPreventiva?.observaciones || ''} onChange={e => setEditModal(m => ({ ...m, editPreventiva: { ...(m.editPreventiva || {}), observaciones: e.target.value } }))}
                  className="min-h-36 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
            ) : (
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Condición inicial</label>
                  <textarea value={editModal.editCorrectiva?.condicionInicial || ''} onChange={e => setEditModal(m => ({ ...m, editCorrectiva: { ...(m.editCorrectiva || {}), condicionInicial: e.target.value } }))}
                    className="min-h-24 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Diagnóstico</label>
                  <textarea value={editModal.editCorrectiva?.diagnostico || ''} onChange={e => setEditModal(m => ({ ...m, editCorrectiva: { ...(m.editCorrectiva || {}), diagnostico: e.target.value } }))}
                    className="min-h-28 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Conclusión</label>
                  <textarea value={editModal.editCorrectiva?.conclusion || ''} onChange={e => setEditModal(m => ({ ...m, editCorrectiva: { ...(m.editCorrectiva || {}), conclusion: e.target.value } }))}
                    className="min-h-28 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Condición final</label>
                  <textarea value={editModal.editCorrectiva?.condicionFinal || ''} onChange={e => setEditModal(m => ({ ...m, editCorrectiva: { ...(m.editCorrectiva || {}), condicionFinal: e.target.value } }))}
                    className="min-h-20 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
                {(isEstadoEjecutado(editModal.estado) || editModal.editCorrectiva?.recibidoPor || editModal.editCorrectiva?.cargoRecepcion) && (
                  <>
                    <Input label="Recibido por" value={editModal.editCorrectiva?.recibidoPor || ''} onChange={e => setEditModal(m => ({ ...m, editCorrectiva: { ...(m.editCorrectiva || {}), recibidoPor: e.target.value } }))} />
                    <Input label="Cargo recepción" value={editModal.editCorrectiva?.cargoRecepcion || ''} onChange={e => setEditModal(m => ({ ...m, editCorrectiva: { ...(m.editCorrectiva || {}), cargoRecepcion: e.target.value } }))} />
                  </>
                )}
              </div>
            )}
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
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4">
          <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-[minmax(220px,360px)_160px_160px]">
            <div className="relative self-end">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por folio, cliente, equipo, marca, modelo, serie, inventario o estado..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <label className="space-y-1">
              <span className="block text-[10px] font-bold uppercase text-slate-400">Fecha desde</span>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <label className="space-y-1">
              <span className="block text-[10px] font-bold uppercase text-slate-400">Fecha hasta</span>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
          </div>
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 p-2">
              <span className="shrink-0 px-2 text-sm font-semibold text-blue-700">{selectedIds.length} registro(s) seleccionado(s)</span>
              <Button variant="secondary" className="text-xs" onClick={exportHistorialExcel} icon={FileSpreadsheet}>Excel seleccionados</Button>
              <Button variant="secondary" className="text-xs" onClick={downloadBulkPdfs} icon={Download}>PDFs seleccionados</Button>
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
                <SortableHeader label="Fecha" sortKey="fecha" />
                <SortableHeader label="Folio" sortKey="folio" />
                <SortableHeader label="Cliente" sortKey="cliente" />
                <SortableHeader label="Equipo" sortKey="equipo" />
                <SortableHeader label="Marca" sortKey="marca" />
                <SortableHeader label="Modelo" sortKey="modelo" />
                <SortableHeader label="Serie" sortKey="serie" />
                <SortableHeader label="Inventario" sortKey="inventario" />
                <SortableHeader label="Estado Interno" sortKey="estado" />
                <th className="p-3 text-[10px] font-bold uppercase text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="11" className="px-6 py-12 text-center text-slate-400 italic">Cargando historial...</td></tr>
              ) : sortedOrdenes.length === 0 ? (
                <tr><td colSpan="11" className="px-6 py-12 text-center text-slate-400 italic">{ordenes.length === 0 ? 'No hay registros.' : 'No hay registros que coincidan con la busqueda.'}</td></tr>
              ) : sortedOrdenes.map(orden => {
                const cliente = getCliente(orden);
                return (
                  <tr key={orden.id} className="border-b hover:bg-slate-50">
                    <td className="p-3">
                      <input type="checkbox" checked={selectedIds.includes(orden.id)} onChange={() => toggleRowSelection(orden.id)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    </td>
                    <td className="p-3 font-mono text-xs">{formatPdfDate(orden.fecha)}</td>
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
                        <button onClick={() => reopenFlow(orden)} disabled={!canReopenOrden(orden)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30" title={canReopenOrden(orden) ? 'Reabrir formulario' : 'Correctiva ejecutada: requiere permiso'}><ClipboardList size={14} /></button>
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
  const { cotizacionDraft, setCotizacionDraft, setActiveModule, cotizacionesHistorial, setCotizacionesHistorial, currentEmpresa, clientes, activeEmpresaId, licitaciones, repuestos } = useContext(ERPContext);
  const [draft, setDraft] = useState(cotizacionDraft || emptyCotizacionDraft(cotizacionesHistorial, currentEmpresa));

  useEffect(() => {
    setDraft(cotizacionDraft || emptyCotizacionDraft(cotizacionesHistorial, currentEmpresa));
  }, [cotizacionDraft]);

  const unidadOptions = (currentEmpresa?.unidadesNegocio || []).map(empresaUnidadValue).filter(Boolean);
  const centroCostoOptions = (currentEmpresa?.centrosCosto || []).map(empresaCentroCostoValue).filter(Boolean);
  const clientesEmpresa = (() => {
    const base = activeEmpresaId ? clientes.filter(c => c.empresaId === activeEmpresaId) : clientes;
    const seen = new Set();
    return base.filter(c => {
      const key = normalizeRutKey(c.rut) || String(c.id || c.id_RUT || '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();
  const selectedCliente = clientes.find(c => String(c.id || c.id_RUT || '') === String(draft.clienteId || ''))
    || clientesEmpresa.find(c => normalizeRutKey(c.rut) && normalizeRutKey(c.rut) === normalizeRutKey(draft.rut));
  const filteredLicitaciones = selectedCliente ? licitaciones.filter(l => {
    if (String(l.cliente_id || '') === String(selectedCliente.id || selectedCliente.id_RUT || '')) return true;
    const licCliente = clientes.find(c => String(c.id || c.id_RUT || '') === String(l.cliente_id || ''));
    return licCliente && normalizeRutKey(licCliente.rut) === normalizeRutKey(selectedCliente.rut);
  }) : [];
  const selectedLic = filteredLicitaciones.find(l =>
    String(l.id) === String(draft.licitacionId || draft.idLicitacion) ||
    normalizeKey(l.id_licitacion) === normalizeKey(draft.idLicitacion) ||
    normalizeKey(l.name) === normalizeKey(draft.idLicitacion)
  ) || licitaciones.find(l => String(l.id) === String(draft.licitacionId || ''));
  const repuestosFiltrados = repuestos.filter(r => !selectedLic?.id || String(r.licitacion_id || '') === String(selectedLic.id));
  const repuestoOptionsId = 'cotizacion-repuestos-options';
  const setField = (key, value) => setDraft(prev => {
    if (key === 'clienteId') {
      const cliente = clientesEmpresa.find(c => String(c.id || c.id_RUT || '') === String(value));
      return {
        ...prev,
        clienteId: value,
        cliente: cliente?.razonSocial || cliente?.name || '',
        rut: cliente?.rut || '',
        direccion: clienteDireccion(cliente || {}),
        comuna: clienteComuna(cliente || {}),
        telefono: clienteTelefono(cliente || {}),
        licitacionId: '',
        idLicitacion: '',
      };
    }
    if (key === 'licitacionId') {
      const lic = filteredLicitaciones.find(l => String(l.id) === String(value));
      return { ...prev, licitacionId: value, idLicitacion: lic?.id_licitacion || lic?.name || '' };
    }
    return { ...prev, [key]: value };
  });
  const setItem = (index, key, value) => setDraft(prev => ({
    ...prev,
    items: prev.items.map((item, i) => i === index ? { ...item, [key]: value } : item),
  }));
  const applyRepuestoToItem = (index, value) => {
    const repuesto = repuestosFiltrados.find(r => normalizeKey(r.name) === normalizeKey(value));
    setDraft(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? {
        ...item,
        descripcion: value,
        ...(repuesto ? {
          codigo: repuesto.sku || '',
          parte: repuesto.part_number || '',
          unidad: repuesto.unidad || item.unidad || 'Uns',
          precio: repuesto.valor_neto || 0,
        } : {}),
      } : item),
    }));
  };
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
    openHtmlDocument(buildCotizacionHtml(draft, currentEmpresa));
  };

  const saveCotizacion = () => {
    const totals = cotizacionTotals(draft.items);
    const record = {
      ...draft,
      numero: draft.numero || nextCotizacionNumero(cotizacionesHistorial),
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
    const nextCleanDraft = emptyCotizacionDraft([record, ...cotizacionesHistorial], currentEmpresa);
    setDraft(nextCleanDraft);
    setCotizacionDraft(null);
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
          <label className="space-y-1">
            <span className="text-sm font-semibold text-slate-700">ID Licitacion</span>
            <select value={draft.licitacionId || ''} onChange={e => setField('licitacionId', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="">{selectedCliente ? 'Seleccionar licitacion' : 'Selecciona cliente primero'}</option>
              {filteredLicitaciones.map(l => <option key={l.id} value={l.id}>{l.id_licitacion ? `${l.id_licitacion} - ${l.name}` : l.name}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-semibold text-slate-700">Unidad de Negocio</span>
            <select value={draft.unidadNegocio || ''} onChange={e => setField('unidadNegocio', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="">Seleccionar unidad</option>
              {unidadOptions.map(unit => <option key={unit} value={unit}>{unit}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-semibold text-slate-700">Centro de Costo</span>
            <select value={draft.centroCosto || ''} onChange={e => setField('centroCosto', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="">Seleccionar centro</option>
              {centroCostoOptions.map(cc => <option key={cc} value={cc}>{cc}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-semibold text-slate-700">Sres.</span>
            <select value={draft.clienteId || selectedCliente?.id || ''} onChange={e => setField('clienteId', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="">Seleccionar cliente</option>
              {clientesEmpresa.map(c => <option key={c.id || c.id_RUT} value={c.id || c.id_RUT}>{c.razonSocial || c.name}</option>)}
            </select>
          </label>
          <Input label="Rut" value={draft.rut} onChange={e => setField('rut', e.target.value)} />
          <Input label="Solicitado por" value={draft.solicitadoPor} onChange={e => setField('solicitadoPor', e.target.value)} />
          <Input label="Direccion" value={draft.direccion} onChange={e => setField('direccion', e.target.value)} />
          <Input label="Comuna" value={draft.comuna} onChange={e => setField('comuna', e.target.value)} />
          <Input label="Telefono" value={draft.telefono} onChange={e => setField('telefono', e.target.value)} />
        </div>

        <div className="overflow-x-auto">
          <datalist id={repuestoOptionsId}>
            {repuestosFiltrados.map(r => <option key={r.id} value={r.name}>{[r.sku, r.part_number, r.valor_neto ? `$${Number(r.valor_neto).toLocaleString('es-CL')}` : ''].filter(Boolean).join(' | ')}</option>)}
          </datalist>
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
                <td className="p-2"><input list={repuestoOptionsId} className="w-64 rounded border p-1 text-xs" value={item.descripcion || ''} onChange={e => applyRepuestoToItem(index, e.target.value)} placeholder={selectedLic ? 'Escribir o seleccionar repuesto' : 'Selecciona licitacion para filtrar'} /></td>
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
  const { cotizacionesHistorial, setCotizacionesHistorial, setCotizacionDraft, setActiveModule, setOcRecibidas, currentEmpresa } = useContext(ERPContext);
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
  const openPdf = (cotizacion) => openHtmlDocument(buildCotizacionHtml(cotizacion, currentEmpresa));
  const mailCotizacion = (cotizacion) => {
    openPdf(cotizacion);
    const subject = encodeURIComponent(`Cotizacion ${cotizacion.numero || ''}`);
    const body = encodeURIComponent(`Estimados,\n\nSe adjunta/gestiona la cotizacion ${cotizacion.numero || ''} por un total de $${Number(cotizacion.total || 0).toLocaleString('es-CL')}.\n\nEl documento se abrio para imprimir o guardar como PDF.\n\nSaludos.`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };
  const downloadPdf = (cotizacion) => {
    const win = openHtmlDocument(buildCotizacionHtml(cotizacion, currentEmpresa));
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

const planCuentaLabel = (cuenta = {}) =>
  [cuenta.numCuenta || cuenta.codigo, cuenta.descripcion || cuenta.nombre || cuenta.name].filter(Boolean).join(' - ');

const cuentaContableOptions = (planCuentas = []) => {
  const fromPlan = planCuentas.map(planCuentaLabel).filter(Boolean);
  return fromPlan.length > 0 ? fromPlan : CUENTAS_CONTABLES;
};

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
  tipoGastoId: '',
  tipoGasto: '',
  cuentaContable: '',
  observaciones: '',
  archivoNombre: '',
  archivoData: '',
});

// --- RENDICIONES: FORMULARIO ---
const NuevaRendicion = () => {
  const { currentUser, rendiciones, setRendiciones, setActiveModule, productosRendiciones, activeEmpresaId } = useContext(ERPContext);
  const [folio] = useState(generateRendicionFolio());
  const [montoAsignado, setMontoAsignado] = useState('');
  const [tipo, setTipo] = useState('rendicion');
  const [fecha, setFecha] = useState(todayISO());
  const [items, setItems] = useState([createEmptyRendicionItem()]);
  const [saving, setSaving] = useState(false);
  const fileRefs = useRef({});

  const updateItem = (id, field, value) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it));
  const productosEmpresa = productosRendiciones.filter(item => !activeEmpresaId || item.empresaId === activeEmpresaId);
  const applyTipoGasto = (id, productId) => {
    const product = productosEmpresa.find(item => item.id === productId);
    setItems(prev => prev.map(it => it.id === id ? {
      ...it,
      tipoGastoId: productId,
      tipoGasto: product?.nombre || '',
      cuentaContable: product?.cuentaContable || '',
    } : it));
  };

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
                  <span className="relative inline-flex items-center group">
                    <Info size={15} className="text-slate-400 hover:text-blue-600" />
                    <span className="pointer-events-none absolute left-0 top-6 z-20 hidden w-72 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium normal-case leading-relaxed text-slate-600 shadow-lg group-hover:block">
                      {t === 'rendicion'
                        ? 'Monto asignado, previamente transferido en donde debe informar y declarar en que se utilizaron lo recursos'
                        : 'solicitar devolucion de fondos por compras y egresos que se hayan realizado y que hayan sido previamente autorizados.'}
                    </span>
                  </span>
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
                {['Fecha', 'N° Documento', 'Tipo Doc.', 'Razón Social', 'Monto', 'Tipo de Gasto', 'Observaciones', 'Respaldo', ''].map(h => (
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
                    <select value={it.tipoGastoId || ''} onChange={e => applyTipoGasto(it.id, e.target.value)}
                      className="w-52 rounded border border-slate-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none bg-white">
                      <option value="">Seleccionar tipo de gasto</option>
                      {productosEmpresa.map(product => (
                        <option key={product.id} value={product.id}>
                          {[product.codigo, product.nombre].filter(Boolean).join(' - ')}
                        </option>
                      ))}
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
  const { rendiciones, setRendiciones, currentEmpresa } = useContext(ERPContext);
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

  const rendicionHeader = (r, title = 'Rendicion') => {
    const empresaNombre = currentEmpresa?.razonSocial || currentEmpresa?.nombreFantasia || 'Vaicmedical';
    const empresaRut = currentEmpresa?.rut || currentEmpresa?.RUT || '77.573.229-6';
    const empresaGiro = currentEmpresa?.giro || 'Mantencion y Reparacion de Equipos Medicos';
    const empresaMail = currentEmpresa?.correoContacto || currentEmpresa?.email || 'servicios@vaicmedical.cl';
    const empresaMembrete = currentEmpresa?.membreteImagen || '/logo-vaic-pdf.jpeg';
    return `<div class="head"><div class="logo-box"><img class="logo" src="${empresaMembrete}" alt="Membrete empresa"/></div><div class="company"><div class="brand">${htmlText(empresaNombre)}</div><div>RUT: ${htmlText(empresaRut)}</div><div>Giro: ${htmlText(empresaGiro)}</div><div>Correo: ${htmlText(empresaMail)}</div></div><div class="meta-head"><span class="folio-label">${htmlText(title)}</span><span class="folio-value">${htmlText(r?.folio || '')}</span>Fecha: ${htmlText(formatPdfDate(r?.fecha))}</div></div>`;
  };

  const rendicionLineData = (it = {}) => [
    ['Fecha', formatPdfDate(it.fecha)],
    ['N° documento', it.numeroDoc],
    ['Tipo Doc.', it.tipoDoc],
    ['Razon social', it.razonSocial],
    ['Monto', `$${Number(it.monto || 0).toLocaleString('es-CL')}`],
    ['Tipo gasto', it.tipoGasto || it.cuentaContable],
    ['Observacion', it.observaciones],
  ];

  const attachmentPages = (r) => (r.items || [])
    .filter(it => it.archivoData)
    .map((it, index) => {
      const isImage = String(it.archivoData || '').startsWith('data:image/');
      const media = isImage
        ? `<img class="attachment-media" src="${it.archivoData}" alt="${htmlText(it.archivoNombre || `Respaldo ${index + 1}`)}"/>`
        : `<iframe class="attachment-media" src="${it.archivoData}" title="${htmlText(it.archivoNombre || `Respaldo ${index + 1}`)}"></iframe>`;
      return `<section class="attachment-page">
        ${rendicionHeader(r, 'Respaldo')}
        <div class="attachment-wrap">
          <div class="attachment-data">
            <div class="attachment-title">Linea ${index + 1} - ${htmlText(it.archivoNombre || 'Respaldo adjunto')}</div>
            <div class="attachment-grid">
              ${rendicionLineData(it).map(([label, value]) => `<div><b>${htmlText(label)}</b><span>${htmlText(value || '')}</span></div>`).join('')}
            </div>
          </div>
          ${media}
        </div>
      </section>`;
    }).join('');

  const rendicionBlock = (r, { includeHeader = true, mainPage = false } = {}) => {
    const filas = (r.items || []).map(it =>
      `<tr>
        <td>${htmlText(formatPdfDate(it.fecha))}</td><td>${htmlText(it.numeroDoc || '')}</td><td>${htmlText(it.tipoDoc || '')}</td>
        <td>${htmlText(it.razonSocial || '')}</td>
        <td style="text-align:right">$${Number(it.monto || 0).toLocaleString('es-CL')}</td>
        <td>${htmlText(it.tipoGasto || it.cuentaContable || '')}</td><td>${htmlText(it.observaciones || '')}</td>
        <td>${htmlText(it.archivoNombre || '—')}</td>
      </tr>`
    ).join('');
    return `
      <section class="rend-block ${mainPage ? 'main-page' : ''}">
        ${includeHeader ? rendicionHeader(r) : ''}
        <h1>${r.tipo === 'devolucion' ? 'Devolucion de fondos' : 'Rendicion de fondos'}</h1>
        <div class="doc-meta">
          <div class="box"><b>Responsable</b>${htmlText(r.responsable || '')}</div>
          <div class="box"><b>Fecha</b>${htmlText(formatPdfDate(r.fecha))}</div>
          <div class="box"><b>Tipo</b>${r.tipo === 'devolucion' ? 'Devolución' : 'Rendición'}</div>
          <div class="box"><b>Monto Asignado</b>$${Number(r.montoAsignado || 0).toLocaleString('es-CL')}</div>
          <div class="box"><b>Total Rendido</b>$${Number(r.total || 0).toLocaleString('es-CL')}</div>
          <div class="box"><b>Estado</b>${htmlText(r.estado || '')}</div>
        </div>
        <table>
          <thead><tr>
            <th>Fecha</th><th>N° Doc.</th><th>Tipo Doc.</th><th>Razón Social</th>
            <th>Monto</th><th>Tipo de Gasto</th><th>Observaciones</th><th>Respaldo</th>
          </tr></thead>
          <tbody>${filas}</tbody>
          <tfoot><tr>
            <td colspan="4" style="text-align:right">Total:</td>
            <td style="text-align:right">$${Number(r.total || 0).toLocaleString('es-CL')}</td>
            <td colspan="3"></td>
          </tr></tfoot>
        </table>
      </section>`;
  };

  const htmlStyles = `
    @page{size:A4;margin:12mm}
    body{font-family:Arial,sans-serif;padding:28px;color:#111827}
    .page{max-width:960px;margin:auto}.head{display:grid;grid-template-columns:150px 1fr 194px;border:2px solid #111827;padding:12px;align-items:center;gap:18px}.logo-box{display:flex;align-items:center;justify-content:flex-start}.logo{display:block;width:136px;max-height:88px;object-fit:contain}.brand{font-weight:800;font-size:18px}.company{text-align:center;font-size:11px;line-height:1.5;color:#334155}.meta-head{text-align:right;font-size:12px;line-height:1.5;color:#111827;min-width:0}.folio-label{font-size:10px;text-transform:uppercase;color:#475569;font-weight:700}.folio-value{display:block;font-size:18px;line-height:1.1;font-weight:900;color:#0f172a;margin-bottom:8px;white-space:nowrap;letter-spacing:0}
    h1{font-size:16px;text-align:center;margin:16px 0;text-transform:uppercase;letter-spacing:.06em;color:#0f172a}
    .subtitle{font-size:12px;color:#64748b;margin-bottom:24px}
    .rend-block{margin-bottom:40px;page-break-inside:avoid}
    .main-page{page-break-after:always}
    .doc-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
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
    .attachment-page{min-height:260mm;position:relative}
    .attachment-page + .attachment-page{page-break-before:always}
    .attachment-wrap{position:relative;margin-top:16px;height:232mm;border:1px solid #cbd5e1;background:#f8fafc;overflow:hidden}
    .attachment-media{display:block;width:100%;height:100%;object-fit:contain;border:0;background:white}
    .attachment-data{position:absolute;left:12px;right:12px;top:12px;z-index:2;border:1px solid rgba(15,23,42,.35);background:rgba(255,255,255,.92);padding:10px}
    .attachment-title{font-size:11px;font-weight:900;text-transform:uppercase;color:#0f172a;margin-bottom:8px}
    .attachment-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
    .attachment-grid div{font-size:10px;line-height:1.25}.attachment-grid b{display:block;font-size:8px;text-transform:uppercase;color:#64748b}.attachment-grid span{font-weight:700;color:#111827}
    @media print{button{display:none}body{padding:0}.rend-block{page-break-after:auto}.main-page{page-break-after:always}}`;

  const printRendicion = (r) => {
    openHtmlDocument(`<html><head><title>Rendición ${r.folio}</title><style>${htmlStyles}</style></head>
      <body><div class="page">${rendicionBlock(r, { mainPage: true })}${attachmentPages(r)}<button onclick="window.print()">Imprimir / Guardar PDF</button></div></body></html>`);
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

// --- MANTENEDORES: PRODUCTOS/SERVICIOS RENDICIONES ---
const emptyProductoRendicion = (empresaId = '') => ({
  id: '',
  empresaId,
  codigo: '',
  nombre: '',
  tipo: 'Servicio',
  familia: '',
  descripcion: '',
  cuentaContable: '',
  estado: 'Activo',
});

const MantenedoresProductosRendiciones = () => {
  const { productosRendiciones, setProductosRendiciones, planCuentas, activeEmpresaId, currentEmpresa } = useContext(ERPContext);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const accountOptions = cuentaContableOptions(planCuentas);
  const filtered = productosRendiciones
    .filter(item => !activeEmpresaId || item.empresaId === activeEmpresaId)
    .filter(item => normalizeKey([item.codigo, item.nombre, item.tipo, item.familia, item.cuentaContable, item.estado].join(' ')).includes(normalizeKey(search)));

  const openNew = () => {
    if (!activeEmpresaId) { alert('Selecciona una empresa activa antes de crear productos o servicios.'); return; }
    setModal({ mode: 'new', data: emptyProductoRendicion(activeEmpresaId) });
  };
  const openEdit = (item) => setModal({ mode: 'edit', data: { ...emptyProductoRendicion(activeEmpresaId), ...item } });
  const closeModal = () => setModal(null);
  const setField = (key, value) => setModal(prev => ({ ...prev, data: { ...prev.data, [key]: value } }));
  const save = () => {
    const data = { ...modal.data, empresaId: activeEmpresaId || modal.data.empresaId };
    if (!data.codigo || !data.nombre || !data.cuentaContable) {
      alert('Codigo, nombre y cuenta contable son obligatorios.');
      return;
    }
    const duplicate = productosRendiciones.some(item =>
      item.empresaId === data.empresaId &&
      normalizeKey(item.codigo) === normalizeKey(data.codigo) &&
      item.id !== data.id
    );
    if (duplicate) {
      alert('Ya existe un producto o servicio con ese codigo en la empresa activa.');
      return;
    }
    const record = { ...data, id: data.id || `rend-prod-${Date.now()}` };
    setProductosRendiciones(prev => modal.mode === 'new'
      ? [record, ...prev]
      : prev.map(item => item.id === record.id ? record : item));
    closeModal();
  };
  const remove = (item) => {
    if (!window.confirm(`Eliminar "${item.nombre}"?`)) return;
    setProductosRendiciones(prev => prev.filter(row => row.id !== item.id));
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Mantenedores / Rendiciones</p>
          <h2 className="text-2xl font-bold text-slate-900">Productos y/o Servicios</h2>
          <p className="mt-1 text-sm text-slate-500">Empresa activa: {currentEmpresa?.razonSocial || 'Sin empresa seleccionada'}</p>
        </div>
        <Button variant="primary" onClick={openNew} icon={Plus}>Nuevo producto/servicio</Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <div className="relative max-w-md">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por codigo, nombre, cuenta..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-slate-50 text-left">
              {['Codigo', 'Nombre', 'Tipo', 'Familia', 'Cuenta contable', 'Estado', 'Acciones'].map(h => <th key={h} className="p-3 text-[10px] font-bold uppercase text-slate-500">{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-400 italic">{activeEmpresaId ? 'No hay productos o servicios para rendiciones.' : 'Selecciona una empresa activa.'}</td></tr>
              ) : filtered.map(item => (
                <tr key={item.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 font-mono text-xs">{item.codigo}</td>
                  <td className="p-3 font-semibold">{item.nombre}</td>
                  <td className="p-3">{item.tipo}</td>
                  <td className="p-3">{item.familia || '—'}</td>
                  <td className="p-3 text-xs">{item.cuentaContable}</td>
                  <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${item.estado === 'Activo' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{item.estado}</span></td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(item)} className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600" title="Editar"><Pencil size={14} /></button>
                      <button onClick={() => remove(item)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Eliminar"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title={modal.mode === 'new' ? 'Nuevo producto/servicio' : 'Editar producto/servicio'} onClose={closeModal} maxWidth="max-w-5xl">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input label="Codigo" value={modal.data.codigo} onChange={e => setField('codigo', e.target.value)} />
            <Input label="Nombre" value={modal.data.nombre} onChange={e => setField('nombre', e.target.value)} />
            <label className="space-y-1"><span className="text-sm font-semibold text-slate-700">Tipo</span><select value={modal.data.tipo} onChange={e => setField('tipo', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option>Producto</option><option>Servicio</option><option>Tipo de gasto</option></select></label>
            <Input label="Familia" value={modal.data.familia} onChange={e => setField('familia', e.target.value)} />
            <label className="space-y-1 md:col-span-2"><span className="text-sm font-semibold text-slate-700">Cuenta contable</span><select value={modal.data.cuentaContable} onChange={e => setField('cuentaContable', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">Seleccionar cuenta</option>{accountOptions.map(account => <option key={account} value={account}>{account}</option>)}</select></label>
            <label className="space-y-1"><span className="text-sm font-semibold text-slate-700">Estado</span><select value={modal.data.estado} onChange={e => setField('estado', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option>Activo</option><option>Inactivo</option></select></label>
            <label className="space-y-1 md:col-span-3"><span className="text-sm font-semibold text-slate-700">Descripcion</span><textarea value={modal.data.descripcion} onChange={e => setField('descripcion', e.target.value)} className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
          </div>
          <div className="mt-6 flex justify-end gap-3 border-t pt-4">
            <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button variant="accent" onClick={save}>Guardar</Button>
          </div>
        </Modal>
      )}
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
  const persistClientesExtended = async (nextClientes) => {
    const snapshots = nextClientes.map(clienteExtendedSnapshot);
    localStorage.setItem(APP_DATA_KEYS.clientes_ext, JSON.stringify(snapshots));
    const { error } = await saveAppDataToSupabase('clientes_ext', snapshots);
    if (error) {
      alert('El cliente se guardo en esta sesion, pero no se pudo compartir la informacion extendida con otros usuarios: ' + friendlyError(error));
    }
  };

  const saveRecord = async () => {
    if (!activeEmpresaId) { alert('Selecciona una empresa activa antes de guardar.'); return; }
    const data = { ...modal.data, empresaId: activeEmpresaId, name: modal.data.razonSocial, email: modal.data.correoComercial || modal.data.correoSii };
    if (!data.rut || !data.razonSocial) { alert('RUT y Razón Social son obligatorios.'); return; }
    const duplicate = clientes.some(c => c.empresaId === activeEmpresaId && normalizeRutKey(c.rut) === normalizeRutKey(data.rut) && c.id !== data.id);
    if (duplicate) { alert('Ya existe un cliente/proveedor con ese RUT en la empresa activa.'); return; }

    const isColError = (msg) => msg && (msg.includes('column') || msg.includes('schema cache'));
    const extPayload  = clienteFullPayload(data);
    const basePayload = clienteBasePayload(data);

    if (modal.mode === 'new') {
      let { data: row, error } = await supabase.from('clientes').insert([extPayload]).select().single();
      if (error && isColError(error.message)) {
        ({ data: row, error } = await supabase.from('clientes').insert([basePayload]).select().single());
      }
      if (error) { alert('Error al guardar: ' + error.message); return; }
      const normalized = { ...normalizeCliente(row), ...data, empresaId: activeEmpresaId };
      const nextClientes = [normalized, ...clientes];
      setClientes(nextClientes);
      await persistClientesExtended(nextClientes);
    } else {
      let { error } = await supabase.from('clientes').update(extPayload).eq('id_RUT', data.id);
      if (error && isColError(error.message)) {
        ({ error } = await supabase.from('clientes').update(basePayload).eq('id_RUT', data.id));
      }
      if (error) { alert('Error al guardar: ' + error.message); return; }
      const nextClientes = clientes.map(c => c.id === data.id ? { ...c, ...normalizeCliente({ ...c, ...data }) } : c);
      setClientes(nextClientes);
      await persistClientesExtended(nextClientes);
    }
    closeModal();
  };

  const deleteRecord = async (record) => {
    if (!window.confirm(`Eliminar "${record.razonSocial || record.name}"?`)) return;
    const { error } = await supabase.from('clientes').delete().eq('id', record.id);
    if (error) { alert('Error al eliminar: ' + error.message); return; }
    const nextClientes = clientes.filter(c => c.id !== record.id);
    setClientes(nextClientes);
    await persistClientesExtended(nextClientes);
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

  const confirmImport = async () => {
    if (previewErrors.length > 0) return;
    let nextClientes = [...clientes];
    preview.forEach(row => {
      const existingIndex = nextClientes.findIndex(c => c.empresaId === activeEmpresaId && normalizeRutKey(c.rut) === normalizeRutKey(row.rut));
      if (existingIndex >= 0) nextClientes[existingIndex] = { ...nextClientes[existingIndex], ...row, id: nextClientes[existingIndex].id };
      else nextClientes.unshift(row);
    });
    setClientes(nextClientes);
    await persistClientesExtended(nextClientes);
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
  ADD COLUMN IF NOT EXISTS estado        TEXT DEFAULT 'Activa',
  ADD COLUMN IF NOT EXISTS garantia_preventiva_meses INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS garantia_correctiva_meses INTEGER DEFAULT 0;`;

const isSchemaError = (msg) => msg && (msg.includes('schema cache') || msg.includes('column'));

const MantenedoresLicitaciones = () => {
  const { clientes, licitaciones, setLicitaciones, equipos, setEquipos, activeEmpresaId } = useContext(ERPContext);
  const clientesEmpresa = activeEmpresaId ? clientes.filter(c => c.empresaId === activeEmpresaId) : clientes;
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
    supabase.from('licitaciones').select('id_licitacion, fecha_inicio, fecha_termino, monto, estado, garantia_preventiva_meses, garantia_correctiva_meses').limit(1)
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
  const emptyForm = { id_licitacion: '', name: '', cliente_id: '', fecha_inicio: '', fecha_termino: '', monto: '', estado: 'Activa', garantia_preventiva_meses: '', garantia_correctiva_meses: '' };
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
    garantia_preventiva_meses: l.garantia_preventiva_meses != null ? String(l.garantia_preventiva_meses) : '',
    garantia_correctiva_meses: l.garantia_correctiva_meses != null ? String(l.garantia_correctiva_meses) : '',
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
    garantia_preventiva_meses: data.garantia_preventiva_meses ? Number(data.garantia_preventiva_meses) || 0 : 0,
    garantia_correctiva_meses: data.garantia_correctiva_meses ? Number(data.garantia_correctiva_meses) || 0 : 0,
  });
  const basePayload = (data) => ({ name: data.name, cliente_id: data.cliente_id });
  const hasExtendedData = (r) => Boolean(r.id_licitacion || r.fecha_inicio || r.fecha_termino || r.monto || r.garantia_preventiva_meses || r.garantia_correctiva_meses || (r.estado && r.estado !== 'Activa'));

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
    { key: 'garantia_preventiva_meses', label: 'Garantia Preventiva Meses', required: false, hint: 'Meses cobertura preventiva, ej: 3' },
    { key: 'garantia_correctiva_meses', label: 'Garantia Correctiva Meses', required: false, hint: 'Meses cobertura correctiva, ej: 6' },
    { key: 'estado',        label: 'Estado',            required: false, hint: 'Activa / Vencida / En revisión / Cancelada / Suspendida' },
  ];

  const exportTemplate = () => {
    const hintRow   = COLUMNS.map(c => c.hint);
    const exampleRow = ['LIC-001', 'Contrato Mantención 2025', '76.123.456-K', '01/01/2025', '31/12/2025', '5000000', '3', '6', 'Activa'];

    const ws = XLSX.utils.aoa_to_sheet([COLUMNS.map(c => c.label), hintRow, exampleRow]);
    ws['!cols'] = [{ wch: 14 }, { wch: 38 }, { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 24 }, { wch: 24 }, { wch: 14 }];

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
        const entry = { id_licitacion: '', name: '', rut_cliente: '', fecha_inicio: '', fecha_termino: '', monto: '', garantia_preventiva_meses: '', garantia_correctiva_meses: '', estado: 'Activa', _row: idx + 2 };
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
      const schemaProbe = await supabaseRequest(() => supabase.from('licitaciones').select('id_licitacion, fecha_inicio, fecha_termino, monto, estado, garantia_preventiva_meses, garantia_correctiva_meses').limit(1));
      const missingExtendedSchema = schemaMissing || (schemaProbe.error && isSchemaError(schemaProbe.error.message));

      if (missingExtendedSchema && preview.some(hasExtendedData)) {
        setSchemaMissing(true);
        setImportResult({
          ok: false,
          message: 'La tabla licitaciones no tiene columnas para ID, fechas, monto, estado o garantias. Copia y ejecuta el SQL amarillo de arriba en Supabase y vuelve a importar el Excel.',
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
        garantia_preventiva_meses: r.garantia_preventiva_meses ? Number(String(r.garantia_preventiva_meses).replace(/\D/g, '')) || 0 : 0,
        garantia_correctiva_meses: r.garantia_correctiva_meses ? Number(String(r.garantia_correctiva_meses).replace(/\D/g, '')) || 0 : 0,
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
            <Select label="Cliente *" options={clientesEmpresa} value={modal.data.cliente_id}
              onChange={e => setField('cliente_id', e.target.value)} placeholder="Seleccionar cliente..." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Fecha Inicio" type="date" value={modal.data.fecha_inicio}
                onChange={e => setField('fecha_inicio', e.target.value)} />
              <Input label="Fecha Término" type="date" value={modal.data.fecha_termino}
                onChange={e => setField('fecha_termino', e.target.value)} />
            </div>
            <Input label="Monto Contrato (CLP)" type="number" value={modal.data.monto}
              onChange={e => setField('monto', e.target.value)} placeholder="5000000" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Garantia preventiva (meses)" type="number" value={modal.data.garantia_preventiva_meses}
                onChange={e => setField('garantia_preventiva_meses', e.target.value)} placeholder="0" />
              <Input label="Garantia correctiva (meses)" type="number" value={modal.data.garantia_correctiva_meses}
                onChange={e => setField('garantia_correctiva_meses', e.target.value)} placeholder="0" />
            </div>
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
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400">Garantia Prev.</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400">Garantia Corr.</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400">Estado</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="12" className="px-6 py-12 text-center text-slate-400 italic">
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
                    <td className="px-4 py-4 text-slate-500 text-xs">{l.garantia_preventiva_meses ? `${l.garantia_preventiva_meses} mes(es)` : '—'}</td>
                    <td className="px-4 py-4 text-slate-500 text-xs">{l.garantia_correctiva_meses ? `${l.garantia_correctiva_meses} mes(es)` : '—'}</td>
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
      { id: 'contabilidad-analiticos', label: 'Analiticos' },
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
      { id: 'mantenedores-productos-rendiciones', label: 'Productos/Servicios Rendiciones' },
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
    const permisos = normalizeUserEmpresaPermissions(u, empresas);
    const firstConfigured = Object.keys(permisos).find(id => empresas.some(emp => emp.id === id) && (permisos[id] || []).length > 0);
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

  const toSupabasePayload = (data, options) => usuarioPayload({
    ...data,
    accesos: buildAccessUnion(data),
    permisosEmpresas: data.permisosEmpresas || {},
  }, options);

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
      if (mode === 'new') {
        const { data: row, error } = await insertUsuario({
          ...data,
          accesos: buildAccessUnion(data),
          permisosEmpresas: data.permisosEmpresas || {},
        });
        if (error) throw error;
        setUsuarios(prev => [normalizeUsuario(row), ...prev]);
      } else {
        const payload = toSupabasePayload(data, { includeId: false });
        const { data: row, error } = await supabaseRequest(() =>
          supabase.from('usuarios').update(payload).eq('id', data.id).select().single()
        );
        if (error) throw error;
        setUsuarios(prev => prev.map(u => u.id === row.id ? normalizeUsuario(row) : u));
      }
      closeModal();
    } catch (err) {
      alert('Error al guardar usuario: ' + friendlyError(err));
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
                  <div className="rounded-xl border border-amber-100 bg-amber-50 overflow-hidden">
                    <label className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-amber-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedEmpresaAccesos().includes(PERM_MODIFICAR_CORRECTIVA_EJECUTADA)}
                        onChange={() => toggleAcceso(PERM_MODIFICAR_CORRECTIVA_EJECUTADA)}
                        className="w-4 h-4 rounded border-slate-300 accent-amber-600"
                      />
                      <span className="text-sm font-bold text-slate-700">Autorizar modificacion de correctivas ejecutadas</span>
                    </label>
                    <div className="border-t border-amber-100 bg-white px-4 py-2 text-xs text-slate-500">
                      Permite reabrir un mantenimiento correctivo guardado con estado interno Ejecutado.
                    </div>
                  </div>
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
  membreteImagen: '', membreteNombre: '',
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
  const [savingEmpresa, setSavingEmpresa] = useState(false);

  const normalizeText = (v) => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filtered = empresas.filter(e => normalizeText([e.rut, e.razonSocial, e.nombreFantasia, e.giro].join(' ')).includes(normalizeText(search)));

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleMembreteFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Debes seleccionar un archivo de imagen.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1200;
        const maxHeight = 500;
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = mime === 'image/png' ? canvas.toDataURL(mime) : canvas.toDataURL(mime, 0.88);
        setForm(f => ({
          ...f,
          membreteImagen: dataUrl,
          membreteNombre: file.name,
        }));
      };
      img.onerror = () => alert('No se pudo leer la imagen seleccionada.');
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };
  const removeMembrete = () => setForm(f => ({ ...f, membreteImagen: '', membreteNombre: '' }));

  const openNew  = () => { setForm(emptyEmpresa()); setActiveEmpresaTab('datos'); setView('form'); };
  const openEdit = (e) => { setForm({ ...emptyEmpresa(), ...e, modulosPermitidos: e.modulosPermitidos || [] }); setActiveEmpresaTab('datos'); setView('form'); };
  const cancel   = () => setView('list');

  const handleSave = async () => {
    if (!form.rut || !form.razonSocial) { alert('RUT y Razón Social son obligatorios.'); return; }
    setSavingEmpresa(true);
    try {
      const savedForm = form.id ? { ...form } : { ...form, id: Date.now().toString() };
      const nextEmpresas = form.id
        ? empresas.map(e => e.id === form.id ? savedForm : e)
        : [savedForm, ...empresas];
      const { error } = await saveAppDataToSupabase('empresas', nextEmpresas);
      if (error) {
        alert('No se pudo guardar el membrete para otros usuarios: ' + friendlyError(error));
        return;
      }
      localStorage.setItem(APP_DATA_KEYS.empresas, JSON.stringify(nextEmpresas));
      setEmpresas(nextEmpresas);
      setView('list');
    } finally {
      setSavingEmpresa(false);
    }
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
          <button onClick={handleSave} disabled={savingEmpresa} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
            <CheckCircle size={15}/> {savingEmpresa ? 'Guardando...' : 'Guardar Empresa'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-2 pt-2">
        <div className="flex gap-1 border-b border-slate-100">
          <button onClick={() => setActiveEmpresaTab('datos')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg border border-b-0 ${activeEmpresaTab === 'datos' ? 'bg-white text-blue-700 border-slate-200' : 'bg-slate-50 text-slate-500 border-transparent hover:text-slate-700'}`}>
            Datos de la empresa
          </button>
          <button onClick={() => setActiveEmpresaTab('membrete')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg border border-b-0 ${activeEmpresaTab === 'membrete' ? 'bg-white text-blue-700 border-slate-200' : 'bg-slate-50 text-slate-500 border-transparent hover:text-slate-700'}`}>
            Membrete
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
      ) : activeEmpresaTab === 'membrete' ? (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Membrete de documentos</h3>
          <p className="mt-1 text-sm text-slate-500">Carga la imagen que se usará en el encabezado de los documentos de esta empresa.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-3">
            <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-400 transition-colors hover:border-blue-300 hover:text-blue-600">
              <Upload size={24} />
              <span className="mt-2 text-sm font-bold">Cargar imagen</span>
              <span className="mt-1 text-xs">PNG, JPG o JPEG</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={e => handleMembreteFile(e.target.files?.[0])}
              />
            </label>
            {form.membreteImagen && (
              <button onClick={removeMembrete} className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100">
                <Trash2 size={14}/> Quitar imagen
              </button>
            )}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">Vista previa</p>
                <p className="text-sm font-semibold text-slate-700">{form.membreteNombre || 'Sin imagen cargada'}</p>
              </div>
            </div>
            <div className="flex min-h-52 items-center justify-center rounded-lg bg-slate-50 p-4">
              {form.membreteImagen ? (
                <img src={form.membreteImagen} alt="Membrete de empresa" className="max-h-48 max-w-full object-contain" />
              ) : (
                <div className="text-center text-sm text-slate-400">
                  <FileText size={28} className="mx-auto mb-2" />
                  No hay imagen de membrete cargada.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
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
  const { tipoDocumentos, setTipoDocumentos, empresas, protocolosPreventivos, setProtocolosPreventivos } = useContext(ERPContext);
  const [view, setView]         = useState('list');
  const [form, setForm]         = useState(emptyTipoDoc());
  const [activeTab, setActiveTab] = useState('tipo-doc');
  const [mainTab, setMainTab] = useState('documentos');
  const [selectedProtocolKey, setSelectedProtocolKey] = useState('camas');
  const [search, setSearch]     = useState('');
  const [subModal, setSubModal] = useState(null);
  const [importModal, setImportModal] = useState(null);
  const fileInputRef = useRef(null);

  const setField = (k,v) => setForm(f => ({ ...f, [k]: v }));
  const norm = (v) => String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const filtered = tipoDocumentos.filter(d =>
    norm([d.tipDoc, d.descripcion, d.ciclo].join(' ')).includes(norm(search))
  );
  const selectedProtocol = normalizePreventiveProtocol(protocolosPreventivos?.[selectedProtocolKey], selectedProtocolKey);
  const updateSelectedProtocol = (nextProtocol) => {
    setProtocolosPreventivos(prev => ({
      ...defaultPreventiveProtocolsConfig(),
      ...(prev || {}),
      [selectedProtocolKey]: normalizePreventiveProtocol(nextProtocol, selectedProtocolKey),
    }));
  };
  const updateProtocolTitle = (value) => updateSelectedProtocol({ ...selectedProtocol, title: value });
  const updateProtocolSectionName = (sectionIndex, value) => updateSelectedProtocol({
    ...selectedProtocol,
    sections: selectedProtocol.sections.map((section, index) => index === sectionIndex ? { ...section, section: value } : section),
  });
  const updateProtocolItem = (sectionIndex, itemIndex, value) => updateSelectedProtocol({
    ...selectedProtocol,
    sections: selectedProtocol.sections.map((section, index) => index === sectionIndex
      ? { ...section, items: section.items.map((item, i) => i === itemIndex ? { ...item, label: value } : item) }
      : section),
  });
  const updateProtocolItemCriticidad = (sectionIndex, itemIndex, criticidad) => updateSelectedProtocol({
    ...selectedProtocol,
    sections: selectedProtocol.sections.map((section, index) => index === sectionIndex
      ? { ...section, items: section.items.map((item, i) => i === itemIndex ? { ...item, criticidad } : item) }
      : section),
  });
  const updateProtocolItemRequired = (sectionIndex, itemIndex, obligatorio) => updateSelectedProtocol({
    ...selectedProtocol,
    sections: selectedProtocol.sections.map((section, index) => index === sectionIndex
      ? { ...section, items: section.items.map((item, i) => i === itemIndex ? { ...item, obligatorio } : item) }
      : section),
  });
  const addProtocolSection = () => updateSelectedProtocol({
    ...selectedProtocol,
    sections: [...selectedProtocol.sections, { section: 'Nueva seccion', items: [{ label: 'Nueva actividad', criticidad: 'No critico', obligatorio: false }] }],
  });
  const removeProtocolSection = (sectionIndex) => updateSelectedProtocol({
    ...selectedProtocol,
    sections: selectedProtocol.sections.filter((_, index) => index !== sectionIndex),
  });
  const addProtocolItem = (sectionIndex) => updateSelectedProtocol({
    ...selectedProtocol,
    sections: selectedProtocol.sections.map((section, index) => index === sectionIndex
      ? { ...section, items: [...section.items, { label: 'Nueva actividad', criticidad: 'No critico', obligatorio: false }] }
      : section),
  });
  const removeProtocolItem = (sectionIndex, itemIndex) => updateSelectedProtocol({
    ...selectedProtocol,
    sections: selectedProtocol.sections.map((section, index) => index === sectionIndex
      ? { ...section, items: section.items.filter((_, i) => i !== itemIndex) }
      : section),
  });
  const resetSelectedProtocol = () => {
    if (!window.confirm('Restaurar este protocolo a su version base?')) return;
    updateSelectedProtocol(defaultPreventiveProtocolByKey(selectedProtocolKey));
  };

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
        {mainTab === 'documentos' && <div className="flex items-center gap-2">
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
        </div>}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {[['documentos','Documentos'],['protocolos','Protocolos'],['formatos','Formatos']].map(([id, label]) => (
            <button key={id} onClick={() => setMainTab(id)}
              className={mainTab === id ? tabAct : tabIna}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {mainTab === 'protocolos' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 grid grid-cols-1 md:grid-cols-[260px_1fr_auto] gap-4 md:items-end">
            <div>
              <label className={TD_LBL_CLS}>Protocolo preventivo</label>
              <select value={selectedProtocolKey} onChange={e => setSelectedProtocolKey(e.target.value)} className={TD_SEL_CLS}>
                {PREVENTIVE_PROTOCOL_KEYS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label className={TD_LBL_CLS}>Titulo del protocolo</label>
              <input value={selectedProtocol.title} onChange={e => updateProtocolTitle(e.target.value)} className={TD_INP_CLS} />
            </div>
            <button onClick={resetSelectedProtocol} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100">
              Restaurar base
            </button>
          </div>
          <div className="p-5 space-y-4">
            {selectedProtocol.sections.map((section, sectionIndex) => (
              <div key={`${section.section}-${sectionIndex}`} className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-[1fr_auto] gap-3 bg-slate-50 border-b border-slate-100 p-3">
                  <input value={section.section} onChange={e => updateProtocolSectionName(sectionIndex, e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  <button onClick={() => removeProtocolSection(sectionIndex)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" title="Eliminar seccion">
                    <Trash2 size={15}/>
                  </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {section.items.map((item, itemIndex) => (
                    <div key={`${item}-${itemIndex}`} className="grid grid-cols-[1fr_auto] gap-3 p-3">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_160px_140px]">
                        <input value={protocolItemLabel(item)} onChange={e => updateProtocolItem(sectionIndex, itemIndex, e.target.value)}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        <select value={protocolItemCriticidad(item)} onChange={e => updateProtocolItemCriticidad(sectionIndex, itemIndex, e.target.value)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                          <option>Critico</option>
                          <option>No critico</option>
                        </select>
                        <label className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">
                          <input type="checkbox" checked={protocolItemRequired(item)} onChange={e => updateProtocolItemRequired(sectionIndex, itemIndex, e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 accent-blue-600" />
                          Obligatorio
                        </label>
                      </div>
                      <button onClick={() => removeProtocolItem(sectionIndex, itemIndex)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" title="Eliminar actividad">
                        <X size={15}/>
                      </button>
                    </div>
                  ))}
                  <div className="p-3">
                    <button onClick={() => addProtocolItem(sectionIndex)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-100 bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100">
                      <Plus size={13}/> Agregar actividad
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addProtocolSection} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700">
              <Plus size={14}/> Agregar seccion
            </button>
          </div>
        </div>
      )}

      {mainTab === 'formatos' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <FileText size={34} className="mx-auto text-slate-300 mb-3" />
          <p className="font-bold text-slate-700">Formatos</p>
          <p className="mt-1 text-sm text-slate-400">Los formatos configurables se pueden incorporar aqui cuando definamos la estructura de cada documento.</p>
        </div>
      )}

      {mainTab === 'documentos' && <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
      </div>}

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
  estadosInternosCorrectiva: DEFAULT_ESTADOS_INTERNOS_CORRECTIVA,
  promptConclusionCorrectiva: DEFAULT_CORRECTIVA_CONCLUSION_PROMPT,
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
  const save = async () => {
    const cleanForm = {
      ...form,
      estadosInternosCorrectiva: ensureDefaultEstadosInternos(form.estadosInternosCorrectiva || []),
    };
    const result = await setParametros(cleanForm);
    if (result?.error) {
      alert('Parámetros guardados localmente, pero no se pudieron guardar en Supabase: ' + friendlyError(result.error));
      return;
    }
    alert('Parámetros guardados correctamente.');
  };
  const estadosInternos = ensureDefaultEstadosInternos(form.estadosInternosCorrectiva || [], { preserveEmpty: true });
  const setEstadosInternos = (next) => sf('estadosInternosCorrectiva', ensureDefaultEstadosInternos(next, { preserveEmpty: true }));
  const updateEstadoInterno = (index, value) => {
    const next = [...estadosInternos];
    next[index] = value;
    setEstadosInternos(next);
  };
  const addEstadoInterno = () => setEstadosInternos([...estadosInternos, 'Nuevo estado']);
  const removeEstadoInterno = (index) => {
    const target = estadosInternos[index];
    if (isEstadoEjecutado(target)) {
      alert('El estado Ejecutado es obligatorio para habilitar la recepcion de equipo.');
      return;
    }
    setEstadosInternos(estadosInternos.filter((_, i) => i !== index));
  };

  const PAR_TABS = [
    ['general','General'],['impuestos','Impuestos'],['cuentas','Cuentas contables'],
    ['tesoreria','Tesorería'],['documentos','Documentos'],['proyecto','Proyecto'],
    ['otros','Otros'],['estado-interno','Estado Interno'],['prompt','Prompt'],['probabilidad','Probabilidad'],['nombre-campos','Nombre de campos'],['api','API Senegocia'],
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

          {/* ── ESTADO INTERNO ── */}
          {activeTab==='estado-interno' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Estados internos de mantención correctiva</h3>
                  <p className="mt-1 text-xs text-slate-400">Estos estados aparecerán en el selector de Estado Interno de cada correctiva.</p>
                </div>
                <button onClick={addEstadoInterno} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors">
                  <Plus size={14}/> Agregar
                </button>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      <th className="p-3 text-left text-[10px] font-bold uppercase text-slate-500">Estado</th>
                      <th className="p-3 text-left text-[10px] font-bold uppercase text-slate-500">Comportamiento</th>
                      <th className="p-3 w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {estadosInternos.map((estado, index) => (
                      <tr key={`estado-interno-${index}`} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="p-3">
                          <input value={estado} onChange={e => updateEstadoInterno(index, e.target.value)}
                            className={`w-full ${PAR_INP}`} />
                        </td>
                        <td className="p-3 text-xs text-slate-500">
                          {isEstadoEjecutado(estado)
                            ? 'Solicita Recibido por, Cargo y firma de recepción.'
                            : 'Estado operativo normal.'}
                        </td>
                        <td className="p-3 text-right">
                          <button onClick={() => removeEstadoInterno(index)}
                            className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                            title="Eliminar estado">
                            <Trash2 size={14}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ParSaveBtn onClick={save}/>
            </div>
          )}

          {/* PROMPT */}
          {activeTab==='prompt' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Prompt para conclusion IA correctiva</h3>
                <p className="mt-1 text-xs text-slate-400">Este texto se usa para generar solo la conclusion del informe. El hallazgo tecnico queda como texto escrito manualmente.</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={PAR_LBL}>Prompt de conclusion</label>
                <textarea
                  value={form.promptConclusionCorrectiva || DEFAULT_CORRECTIVA_CONCLUSION_PROMPT}
                  onChange={e => sf('promptConclusionCorrectiva', e.target.value)}
                  className={`min-h-56 w-full ${PAR_INP}`}
                />
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
  const { comprobantes, setComprobantes, planCuentas, tipoDocumentos, clientes, activeEmpresaId, currentEmpresa } = useContext(ERPContext);
  const fileInputRef = useRef(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('Todos');
  const [mode, setMode] = useState('list');
  const [draft, setDraft] = useState(() => emptyVoucher());
  const [lineDraft, setLineDraft] = useState(() => emptyVoucherLine(1));
  const [editingLineId, setEditingLineId] = useState('');
  const [notice, setNotice] = useState('');

  const currentEmpresaName = currentEmpresa?.razonSocial || currentEmpresa?.nombreFantasia || '';
  const belongsToActiveEmpresa = (item = {}) => {
    if (!activeEmpresaId) return true;
    if (item.empresaId || item.empresa_id) return String(item.empresaId || item.empresa_id) === String(activeEmpresaId);
    if (Array.isArray(item.empresas)) return item.empresas.some(id => String(id) === String(activeEmpresaId));
    if (Array.isArray(item.empresaConfig) && item.empresaConfig.length > 0) {
      return item.empresaConfig.some(cfg =>
        String(cfg.empresaId || cfg.empresa_id || '') === String(activeEmpresaId) ||
        normalizeKey(cfg.empresa) === normalizeKey(currentEmpresaName)
      );
    }
    return true;
  };
  const unidadNegocioOptions = dedupeByNormalizedText(getEmpresaUnidadesNegocio(currentEmpresa).map(empresaUnidadValue));
  const centroCostoOptions = dedupeByNormalizedText(getEmpresaCentrosCosto(currentEmpresa).map(empresaCentroCostoValue));
  const planCuentasEmpresa = planCuentas.filter(belongsToActiveEmpresa);
  const cuentaContableOptionsComprobante = cuentaContableOptions(planCuentasEmpresa.length ? planCuentasEmpresa : planCuentas);
  const auxiliarOptions = dedupeByNormalizedText(
    clientes
      .filter(c => !activeEmpresaId || c.empresaId === activeEmpresaId)
      .map(c => [c.rut, c.razonSocial || c.name || c.nombreFantasia].filter(Boolean).join(' - '))
  );
  const tipoDocumentosEmpresa = tipoDocumentos.filter(belongsToActiveEmpresa);
  const tipoDocumentoOptions = dedupeByNormalizedText(
    (tipoDocumentosEmpresa.length ? tipoDocumentosEmpresa : tipoDocumentos)
      .map(d => [d.tipDoc || d.codigo, d.descripcion || d.nombre || d.name].filter(Boolean).join(' - '))
  );

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
    const next = {
      ...emptyVoucher(nextNumber()),
      unidadNegocio: unidadNegocioOptions[0] || currentEmpresa?.razonSocial || 'Casa Matriz',
    };
    setDraft(next);
    setLineDraft(emptyVoucherLine(1));
    setEditingLineId('');
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
    setEditingLineId('');
    setMode(nextMode);
    setNotice('');
  };

  const updateDraft = (field, value) => setDraft(prev => ({ ...prev, [field]: value }));
  const updateLine = (field, value) => setLineDraft(prev => ({ ...prev, [field]: value }));

  const addLine = () => {
    if (editingLineId) {
      setDraft(prev => ({
        ...prev,
        detalles: (prev.detalles || []).map(item =>
          item.id === editingLineId ? { ...lineDraft, id: editingLineId, glosa: lineDraft.glosa || draft.glosa } : item
        ).map((item, index) => ({ ...item, numeroDetalle: index + 1 })),
      }));
      setLineDraft(emptyVoucherLine((draft.detalles || []).length + 1));
      setEditingLineId('');
      setNotice('Linea actualizada.');
      return;
    }
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
    if (editingLineId === lineId) {
      setEditingLineId('');
      setLineDraft(emptyVoucherLine((draft.detalles || []).length));
    }
  };

  const editLine = (line) => {
    setLineDraft({ ...emptyVoucherLine(line.numeroDetalle || 1), ...line });
    setEditingLineId(line.id);
    setNotice(`Editando linea ${line.numeroDetalle}.`);
  };

  const cancelLineEdit = () => {
    setEditingLineId('');
    setLineDraft(emptyVoucherLine((draft.detalles || []).length + 1));
    setNotice('');
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

  const accountAndExit = () => {
    saveVoucher('Contabilizado');
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
            <ComboInput
              label="Unidad de negocio"
              disabled={readOnly}
              value={draft.unidadNegocio}
              onChange={e => updateDraft('unidadNegocio', e.target.value)}
              options={unidadNegocioOptions}
              placeholder={unidadNegocioOptions.length ? 'Seleccionar unidad' : 'Sin unidades creadas'}
            />
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Fecha contable</span><input type="date" disabled={readOnly} value={draft.fecha} onChange={e => updateDraft('fecha', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
            <label className="md:col-span-2 xl:col-span-4 space-y-1"><span className="text-xs font-semibold text-slate-600">Glosa</span><textarea disabled={readOnly} value={draft.glosa} onChange={e => updateDraft('glosa', e.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none" /></label>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 md:p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Numero de detalle</span><input disabled value={editingLineId ? (lineDraft.numeroDetalle || '') : (draft.detalles || []).length + 1} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" /></label>
            <div className="md:col-span-2">
              <ComboInput
                label="Cuenta contable"
                disabled={readOnly}
                value={lineDraft.cuentaContable}
                onChange={e => updateLine('cuentaContable', e.target.value)}
                options={cuentaContableOptionsComprobante}
                placeholder={cuentaContableOptionsComprobante.length ? 'Seleccionar cuenta' : 'Sin cuentas para empresa activa'}
              />
            </div>
            <ComboInput
              label="Centro de costo"
              disabled={readOnly}
              value={lineDraft.centroCosto}
              onChange={e => updateLine('centroCosto', e.target.value)}
              options={centroCostoOptions}
              placeholder={centroCostoOptions.length ? 'Seleccionar centro' : 'Sin centros creados'}
            />
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Debe</span><input disabled={readOnly} inputMode="numeric" value={lineDraft.debe} onChange={e => updateLine('debe', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Haber</span><input disabled={readOnly} inputMode="numeric" value={lineDraft.haber} onChange={e => updateLine('haber', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <label className="md:col-span-2 space-y-1"><span className="text-xs font-semibold text-slate-600">Glosa linea</span><input disabled={readOnly} value={lineDraft.glosa} onChange={e => updateLine('glosa', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
            <ComboInput
              label="Auxiliar"
              disabled={readOnly}
              value={lineDraft.auxiliar}
              onChange={e => updateLine('auxiliar', e.target.value)}
              options={auxiliarOptions}
              placeholder={auxiliarOptions.length ? 'Seleccionar cliente/proveedor' : 'Sin auxiliares para empresa activa'}
            />
            <ComboInput
              label="Tipo documento"
              disabled={readOnly}
              value={lineDraft.tipoDocumento}
              onChange={e => updateLine('tipoDocumento', e.target.value)}
              options={tipoDocumentoOptions}
              placeholder={tipoDocumentoOptions.length ? 'Seleccionar tipo documento' : 'Sin tipos creados'}
            />
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Numero documento</span><input disabled={readOnly} value={lineDraft.numeroDocumento} onChange={e => updateLine('numeroDocumento', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
            <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Fecha documento</span><input type="date" disabled={readOnly} value={lineDraft.fechaDocumento} onChange={e => updateLine('fechaDocumento', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
          </div>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {!readOnly && <Button variant="accent" icon={CheckCircle2} onClick={addLine}>{editingLineId ? 'Actualizar linea' : 'Guardar linea'}</Button>}
              {!readOnly && editingLineId && <Button variant="secondary" icon={X} onClick={cancelLineEdit}>Cancelar edicion</Button>}
              {!readOnly && <Button variant="primary" icon={FileText} onClick={saveAndExit}>Guardar y salir</Button>}
              <Button variant="secondary" icon={ClipboardList} onClick={() => setNotice('No hay documentos pendientes asociados.')}>Docs. pendientes</Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 min-w-0">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-[10px] font-black uppercase text-slate-400">Debe</p><p className="text-lg font-black text-slate-900">{money(totals.debe)}</p></div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-[10px] font-black uppercase text-slate-400">Haber</p><p className="text-lg font-black text-slate-900">{money(totals.haber)}</p></div>
              <Button disabled={readOnly || totals.debe <= 0 || balanceDiff !== 0} variant="accent" icon={CheckCircle} onClick={accountAndExit}>Contabilizar</Button>
            </div>
          </div>
          {notice && <div className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">{notice}</div>}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-[10px] uppercase text-slate-400"><tr><th className="p-3 text-left">N</th><th className="p-3 text-left">Cuenta contable</th><th className="p-3 text-left">Centro costo</th><th className="p-3 text-left">Documento</th><th className="p-3 text-left">Auxiliar</th><th className="p-3 text-left">Glosa</th><th className="p-3 text-right">Debe</th><th className="p-3 text-right">Haber</th><th className="p-3"></th></tr></thead><tbody>
            {(draft.detalles || []).map(item => (<tr key={item.id} className={`border-t border-slate-100 ${editingLineId === item.id ? 'bg-blue-50/50' : ''}`}><td className="p-3 font-mono">{item.numeroDetalle}</td><td className="p-3">{item.cuentaContable || '-'}</td><td className="p-3">{item.centroCosto || '-'}</td><td className="p-3">{[item.tipoDocumento, item.numeroDocumento].filter(Boolean).join(' ') || '-'}</td><td className="p-3">{item.auxiliar || '-'}</td><td className="p-3 max-w-xs truncate">{item.glosa || '-'}</td><td className="p-3 text-right font-mono">{money(item.debe)}</td><td className="p-3 text-right font-mono">{money(item.haber)}</td><td className="p-3 text-right whitespace-nowrap">{!readOnly && <button onClick={() => editLine(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Modificar linea"><Pencil size={15}/></button>}{!readOnly && <button onClick={() => removeLine(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Eliminar linea"><Trash2 size={15}/></button>}</td></tr>))}
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

const filterValueMatches = (value = '', selected = '') => {
  const normalizedValue = normalizeKey(value);
  const normalizedSelected = normalizeKey(selected);
  if (!normalizedSelected || normalizedValue === normalizedSelected) return true;
  const selectedParts = String(selected).split(' - ').map(normalizeKey).filter(Boolean);
  const valueParts = String(value).split(' - ').map(normalizeKey).filter(Boolean);
  return selectedParts.includes(normalizedValue) || valueParts.includes(normalizedSelected);
};

const buildAnaliticoRows = (comprobantes = [], filters = {}) => comprobantes
  .filter(voucher => dateInRange(voucher.fecha, filters.fechaDesde, filters.fechaHasta))
  .filter(voucher => {
    const estado = normalizeKey(voucher.estado);
    if (filters.documentos === 'Solo pendientes') return !['contabilizado', 'cancelado', 'pagado'].includes(estado);
    if (filters.documentos === 'Cancelados') return ['contabilizado', 'cancelado', 'pagado'].includes(estado);
    return true;
  })
  .filter(voucher => !filters.unidadNegocio || filters.unidadNegocio === 'Todas' || filterValueMatches(voucher.unidadNegocio, filters.unidadNegocio))
  .flatMap(voucher => (voucher.detalles || []).map(line => ({ voucher, line, account: splitAccount(line.cuentaContable) })))
  .filter(item => !filters.cuentaContable || normalizeKey(item.line.cuentaContable) === normalizeKey(filters.cuentaContable))
  .filter(item => !filters.auxiliar || normalizeKey(item.line.auxiliar) === normalizeKey(filters.auxiliar))
  .filter(item => !filters.centroCosto || filters.centroCosto === 'Todos' || filterValueMatches(item.line.centroCosto, filters.centroCosto))
  .sort((a, b) =>
    String(a.account.code || '').localeCompare(String(b.account.code || '')) ||
    String(a.voucher.fecha || '').localeCompare(String(b.voucher.fecha || '')) ||
    String(a.voucher.numero || '').localeCompare(String(b.voucher.numero || ''))
  )
  .map(({ voucher, line, account }) => {
    const debe = toAmount(line.debe);
    const haber = toAmount(line.haber);
    return {
      Fecha: formatJournalDate(voucher.fecha),
      Comprobante: voucherCode(voucher),
      'Tipo comprobante': voucher.tipoComprobante || '',
      Estado: voucher.estado || '',
      'Unidad de negocio': voucher.unidadNegocio || '',
      'Cod. cuenta': account.code || '',
      'Cuenta contable': account.name || line.cuentaContable || '',
      'Cuenta completa': line.cuentaContable || '',
      Documento: [line.tipoDocumento, line.numeroDocumento].filter(Boolean).join(' - ') || voucher.documento || '',
      Auxiliar: line.auxiliar || '',
      'Centro de costo': line.centroCosto || '',
      Glosa: line.glosa || voucher.glosa || '',
      Debe: debe,
      Haber: haber,
      Saldo: debe - haber,
      voucherId: voucher.id,
    };
  });

const buildAnaliticoHtml = (rows = [], filters = {}, empresa = {}) => {
  const totals = rows.reduce((acc, row) => ({
    debe: acc.debe + toAmount(row.Debe),
    haber: acc.haber + toAmount(row.Haber),
    saldo: acc.saldo + toAmount(row.Saldo),
  }), { debe: 0, haber: 0, saldo: 0 });
  const body = rows.map(row => `<tr>
    <td>${htmlText(row.Fecha)}</td><td>${htmlText(row.Comprobante)}</td><td>${htmlText(row['Cod. cuenta'])}</td><td>${htmlText(row['Cuenta contable'])}</td>
    <td>${htmlText(row.Documento)}</td><td>${htmlText(row.Auxiliar)}</td><td>${htmlText(row['Centro de costo'])}</td><td>${htmlText(row['Unidad de negocio'])}</td>
    <td>${htmlText(row.Estado)}</td><td class="num">${money(row.Debe)}</td><td class="num">${money(row.Haber)}</td><td class="num">${money(row.Saldo)}</td>
  </tr>`).join('');
  return `<html><head><title>Analitico contable</title><style>
    body{font-family:Arial,sans-serif;color:#111827;padding:24px}.top{display:flex;justify-content:space-between;border-bottom:2px solid #1f2937;padding-bottom:12px;margin-bottom:16px}
    h1{font-size:20px;margin:0}.meta{font-size:11px;color:#475569;margin-top:4px}.summary{text-align:right;font-size:12px}
    table{width:100%;border-collapse:collapse}th,td{border:1px solid #cbd5e1;padding:6px;font-size:9px;vertical-align:top}th{background:#e5e7eb;text-transform:uppercase}.num{text-align:right}.total td{background:#f8fafc;font-weight:700}
    @media print{button{display:none}body{padding:0}}
  </style></head><body>
    <button onclick="window.print()" style="margin-bottom:14px;padding:8px 14px;border:0;background:#1f5b93;color:white;border-radius:8px;font-weight:700">Descargar PDF</button>
    <div class="top"><div><h1>Analitico contable</h1><div class="meta">${htmlText(empresa?.razonSocial || empresa?.nombreFantasia || 'Empresa')} | RUT ${htmlText(empresa?.rut || '')}</div><div class="meta">Periodo: ${formatJournalDate(filters.fechaDesde)} al ${formatJournalDate(filters.fechaHasta)} | Cuenta: ${htmlText(filters.cuentaContable || 'Todas')} | Documentos: ${htmlText(filters.documentos || 'Todos')}</div></div><div class="summary"><b>Debe:</b> ${money(totals.debe)}<br/><b>Haber:</b> ${money(totals.haber)}<br/><b>Saldo:</b> ${money(totals.saldo)}</div></div>
    <table><thead><tr><th>Fecha</th><th>Comprobante</th><th>Cod. cuenta</th><th>Cuenta</th><th>Documento</th><th>Auxiliar</th><th>Centro costo</th><th>Unidad</th><th>Estado</th><th>Debe</th><th>Haber</th><th>Saldo</th></tr></thead><tbody>${body}<tr class="total"><td colspan="9">Total</td><td class="num">${money(totals.debe)}</td><td class="num">${money(totals.haber)}</td><td class="num">${money(totals.saldo)}</td></tr></tbody></table>
  </body></html>`;
};

const AnaliticosContables = () => {
  const { comprobantes, currentEmpresa, planCuentas, clientes, activeEmpresaId } = useContext(ERPContext);
  const currentEmpresaName = currentEmpresa?.razonSocial || currentEmpresa?.nombreFantasia || '';
  const belongsToCurrentEmpresa = (item = {}) => {
    if (!activeEmpresaId) return true;
    if (item.empresaId || item.empresa_id) return String(item.empresaId || item.empresa_id) === String(activeEmpresaId);
    if (Array.isArray(item.empresas)) return item.empresas.some(id => String(id) === String(activeEmpresaId));
    if (Array.isArray(item.empresaConfig) && item.empresaConfig.length > 0) {
      return item.empresaConfig.some(cfg =>
        String(cfg.empresaId || cfg.empresa_id || '') === String(activeEmpresaId) ||
        normalizeKey(cfg.empresa) === normalizeKey(currentEmpresaName)
      );
    }
    return true;
  };
  const accountOptions = dedupeByNormalizedText(planCuentas.filter(belongsToCurrentEmpresa).map(planCuentaLabel));
  const centroOptions = dedupeByNormalizedText(getEmpresaCentrosCosto(currentEmpresa).map(empresaCentroCostoValue));
  const unidadOptions = dedupeByNormalizedText(getEmpresaUnidadesNegocio(currentEmpresa).map(empresaUnidadValue));
  const auxiliarOptions = dedupeByNormalizedText(
    clientes
      .filter(c => !activeEmpresaId || c.empresaId === activeEmpresaId)
      .map(c => [c.rut, c.razonSocial || c.name || c.nombreFantasia].filter(Boolean).join(' - '))
  );
  const [filters, setFilters] = useState({
    fechaDesde: `${new Date().getFullYear()}-01-01`,
    fechaHasta: accountingDate(),
    cuentaContable: '',
    documentos: 'Todos',
    auxiliar: '',
    centroCosto: 'Todos',
    unidadNegocio: 'Todas',
  });
  const [rows, setRows] = useState([]);
  const [generated, setGenerated] = useState(false);
  const [search, setSearch] = useState('');
  const updateFilter = (field, value) => setFilters(prev => ({ ...prev, [field]: value }));
  const previewRows = rows.filter(row => Object.values(row).join(' ').toLowerCase().includes(search.toLowerCase()));

  const generate = () => {
    setRows(buildAnaliticoRows(comprobantes, filters));
    setGenerated(true);
  };
  const exportExcel = () => {
    const cleanRows = rows.map(({ voucherId, 'Cuenta completa': _cuentaCompleta, ...row }) => row);
    const ws = XLSX.utils.json_to_sheet(cleanRows, { header: ['Fecha', 'Comprobante', 'Tipo comprobante', 'Estado', 'Unidad de negocio', 'Cod. cuenta', 'Cuenta contable', 'Documento', 'Auxiliar', 'Centro de costo', 'Glosa', 'Debe', 'Haber', 'Saldo'] });
    ws['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 20 }, { wch: 14 }, { wch: 30 }, { wch: 22 }, { wch: 34 }, { wch: 22 }, { wch: 40 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Analitico');
    XLSX.writeFile(wb, `analitico_contable_${new Date().toISOString().replace(/\D/g, '').slice(0, 15)}.xlsx`);
  };
  const exportPdf = () => {
    const win = openHtmlDocument(buildAnaliticoHtml(rows, filters, currentEmpresa));
    setTimeout(() => win.print(), 300);
  };

  return (
    <div className="w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 space-y-5">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Contabilidad / Analiticos</p>
        <h2 className="text-2xl font-black text-slate-900">Analiticos</h2>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 md:p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
          <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Fecha desde</span><input type="date" value={filters.fechaDesde} onChange={e => updateFilter('fechaDesde', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
          <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Fecha hasta</span><input type="date" value={filters.fechaHasta} onChange={e => updateFilter('fechaHasta', e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
          <div className="xl:col-span-2"><ComboInput label="Cuenta contable" value={filters.cuentaContable} onChange={e => updateFilter('cuentaContable', e.target.value)} options={accountOptions} placeholder="Todas las cuentas" /></div>
          <label className="space-y-1"><span className="text-xs font-semibold text-slate-600">Documentos a incluir</span><select value={filters.documentos} onChange={e => updateFilter('documentos', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option>Solo pendientes</option><option>Cancelados</option><option>Todos</option></select></label>
          <ComboInput label="Auxiliar" value={filters.auxiliar} onChange={e => updateFilter('auxiliar', e.target.value)} options={auxiliarOptions} placeholder="Todos los auxiliares" />
          <ComboInput label="Centro de costo" value={filters.centroCosto} onChange={e => updateFilter('centroCosto', e.target.value)} options={['Todos', ...centroOptions]} placeholder="Todos" />
          <ComboInput label="Unidad de negocios" value={filters.unidadNegocio} onChange={e => updateFilter('unidadNegocio', e.target.value)} options={['Todas', ...unidadOptions]} placeholder="Todas" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="accent" icon={FileText} onClick={generate}>Generar informe</Button>
          <Button variant="secondary" icon={FileSpreadsheet} onClick={exportExcel} disabled={!generated || rows.length === 0}>Exportar a Excel</Button>
          <Button variant="secondary" icon={FileDown} onClick={exportPdf} disabled={!generated || rows.length === 0}>PDF</Button>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100"><div className="relative max-w-md"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar en informe generado" className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div></div>
        <div className="overflow-x-auto"><table className="w-full text-xs"><thead className="bg-slate-50 text-[10px] uppercase text-slate-400"><tr><th className="p-3 text-left">Fecha</th><th className="p-3 text-left">Comprobante</th><th className="p-3 text-left">Cuenta</th><th className="p-3 text-left">Documento</th><th className="p-3 text-left">Auxiliar</th><th className="p-3 text-left">Centro costo</th><th className="p-3 text-left">Unidad</th><th className="p-3 text-left">Estado</th><th className="p-3 text-right">Debe</th><th className="p-3 text-right">Haber</th><th className="p-3 text-right">Saldo</th></tr></thead><tbody>
          {previewRows.map((row, index) => (<tr key={`${row.voucherId}-${index}`} className="border-t border-slate-100 hover:bg-slate-50"><td className="p-3 font-mono">{row.Fecha}</td><td className="p-3">{row.Comprobante}</td><td className="p-3 min-w-52">{[row['Cod. cuenta'], row['Cuenta contable']].filter(Boolean).join(' - ')}</td><td className="p-3">{row.Documento || '-'}</td><td className="p-3 min-w-52">{row.Auxiliar || '-'}</td><td className="p-3">{row['Centro de costo'] || '-'}</td><td className="p-3">{row['Unidad de negocio'] || '-'}</td><td className="p-3">{row.Estado || '-'}</td><td className="p-3 text-right font-mono">{money(row.Debe)}</td><td className="p-3 text-right font-mono">{money(row.Haber)}</td><td className="p-3 text-right font-mono">{money(row.Saldo)}</td></tr>))}
          {(!generated || previewRows.length === 0) && <tr><td colSpan="11" className="p-10 text-center text-sm text-slate-400">{generated ? 'No hay movimientos para los filtros seleccionados.' : 'Genera el informe para ver movimientos del libro diario.'}</td></tr>}
        </tbody></table></div>
        <div className="px-4 py-3 text-xs text-slate-400 border-t border-slate-100 flex justify-between"><span>Mostrando {previewRows.length} de {rows.length} movimientos</span><span>Origen: comprobantes contables / libro diario</span></div>
      </div>
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
  const internalDocsLoadedRef = useRef(false);
  const [orderModal, setOrderModal] = useState(null);
  const [orderTab, setOrderTab] = useState('Encabezado');
  const [orderLine, setOrderLine] = useState(() => emptyPurchaseOrderLine(1));
  const [orderPreview, setOrderPreview] = useState(false);

  useEffect(() => {
    const loadInternalDocs = async () => {
      const { data, error } = await loadAppDataFromSupabase(['abastecimiento_documentos']);
      if (error) {
        console.error('Error cargando documentos de abastecimiento desde Supabase:', error);
        internalDocsLoadedRef.current = true;
        return;
      }
      const remoteRow = (data || []).find(row => row.key === 'abastecimiento_documentos');
      if (remoteRow) {
        const remoteDocs = Array.isArray(remoteRow.data) ? remoteRow.data : [];
        setInternalDocs(remoteDocs);
        localStorage.setItem(APP_DATA_KEYS.abastecimiento_documentos, JSON.stringify(remoteDocs));
      } else if (internalDocs.length > 0) {
        await saveAppDataToSupabase('abastecimiento_documentos', internalDocs);
      }
      internalDocsLoadedRef.current = true;
    };
    loadInternalDocs();
  }, []);

  useEffect(() => {
    localStorage.setItem(APP_DATA_KEYS.abastecimiento_documentos, JSON.stringify(internalDocs));
    if (internalDocsLoadedRef.current) {
      saveAppDataToSupabase('abastecimiento_documentos', internalDocs).then(({ error }) => {
        if (error) console.error('Error guardando documentos de abastecimiento en Supabase:', error);
      });
    }
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
  const { setLoggedInUser, setActiveEmpresaId, empresas } = useContext(ERPContext);
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
    const normalizedSession = session.isSuperadmin
      ? session
      : { ...session, permisosEmpresas: normalizeUserEmpresaPermissions(session, empresas) };
    setActiveEmpresaId('');
    localStorage.removeItem('sentauris_active_empresa');
    setLoggedInUser(normalizedSession);
    localStorage.setItem('sentauris_session', JSON.stringify(normalizedSession));
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
        .maybeSingle();

      if (dbError || !data) {
        setError(dbError ? `No se pudo consultar usuarios: ${friendlyError(dbError)}` : 'Usuario no encontrado.');
        return;
      }
      if ((data.contrasena || '').trim() !== pass) {
        setError('Contraseña incorrecta.');
        return;
      }
      doLogin({ ...normalizeUsuario(data), isSuperadmin: false });
    } catch (err) {
      setError('Error al conectar con el servidor: ' + friendlyError(err));
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
  const { activeModule, setActiveModule, setCotizacionDraft, sidebarOpen, setSidebarOpen, currentUser, loggedInUser, logout, activeEmpresaId, empresas } = useContext(ERPContext);
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
  const companyAccess = activeEmpresaId ? userEmpresaAccess(loggedInUser, activeEmpresaId, empresas) : null;
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
    'Productos/Servicios Rendiciones': 'mantenedores-productos-rendiciones',
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
        'Analiticos': 'contabilidad-analiticos',
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
    { id: 'contabilidad', label: 'Contabilidad', icon: FileText, sub: ['Comprobantes', 'Informes Tributarios', 'Analiticos', 'Estados Financieros'] },
    { id: 'calidad', label: 'Calidad', icon: CheckCircle2 },
    { id: 'personas', label: 'Gestión de Personas', icon: Users },
  ];
  const menuBottom = [
    { id: 'mantenedores-clientes',   label: 'Mantenedores',    icon: Database,  sub: ['Clientes y/o Proveedores', 'Licitaciones', 'Equipos', 'Repuestos', 'Productos/Servicios Rendiciones', 'Usuarios'] },
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
        if (typeof window !== 'undefined' && window.innerWidth < 1024) setSidebarOpen(false);
      }
    };
    return (
      <div key={item.id} className="space-y-1">
        <button onClick={handleParentClick}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${isActiveParent ? 'bg-blue-600 text-white' : 'hover:bg-slate-900 hover:text-white'}`}>
          <item.icon size={20} />
          {sidebarOpen && <span className="text-sm font-semibold flex-1 text-left">{item.label}</span>}
          {sidebarOpen && item.sub && (
            <ChevronLeft size={14} className={`transition-transform duration-200 ${isExpanded ? '-rotate-90' : 'rotate-180'}`} />
          )}
        </button>
        {sidebarOpen && item.sub && isExpanded && (
          <div className="ml-9 space-y-1 border-l border-slate-800 pl-3">
            {visibleSubs(item).map(s => {
              const sid = subIdFor(item, s);
              return (
                <button key={s} onClick={() => { if (sid === 'operaciones-cotizaciones') setCotizacionDraft(null); setActiveModule(sid); if (typeof window !== 'undefined' && window.innerWidth < 1024) setSidebarOpen(false); }}
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
    <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-950 h-screen transition-all duration-300 flex flex-col fixed left-0 top-0 z-50 text-slate-400 border-r border-slate-800`}>
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0"><TrendingUp size={24} /></div>
        {sidebarOpen && <span className="font-black text-xl text-white tracking-tighter">{APP_NAME}</span>}
      </div>
      <nav className="flex-1 px-3 mt-4 overflow-y-auto min-h-0">
        <div className="space-y-1">{renderItems(menuTop)}</div>
        <div className="border-t border-slate-800 pt-2 mt-2 space-y-1">{renderItems(menuBottom)}</div>
      </nav>
      <div className="p-4 bg-slate-900/50 border-t border-slate-800">
        <div className="flex items-center gap-3 w-full p-2 rounded-lg">
          <img src={currentUser.avatar} className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0" alt="Profile" />
          {sidebarOpen && (
            <div className="text-left overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 uppercase font-black truncate">{currentUser.position}</p>
            </div>
          )}
        </div>
        <button onClick={logout} className="mt-3 flex items-center gap-3 w-full px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
          <LogOut size={18} />{sidebarOpen && <span className="text-sm font-bold">Cerrar Sesión</span>}
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
    'contabilidad-analiticos': 'Contabilidad / Analiticos',
    'contabilidad-estados-financieros': 'Contabilidad / Estados Financieros',
    'mantenedores-clientes': 'Mantenedores / Clientes y/o Proveedores',
    'mantenedores-licitaciones': 'Mantenedores / Licitaciones',
    'mantenedores-equipos': 'Mantenedores / Equipos',
    'mantenedores-repuestos': 'Mantenedores / Repuestos',
    'mantenedores-productos-rendiciones': 'Mantenedores / Productos y Servicios Rendiciones',
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

const buildPreventivePublicReportHtml = ({ orden, cliente, lic, empresa, protocolosPreventivos }) => {
  const empresaInforme = empresa || {};
  const empresaNombre = empresaInforme.razonSocial || empresaInforme.nombreFantasia || 'Vaicmedical';
  const empresaRut = empresaInforme.rut || empresaInforme.RUT || '77.573.229-6';
  const empresaGiro = empresaInforme.giro || 'Mantencion y Reparacion de Equipos Medicos';
  const empresaMail = empresaInforme.correoContacto || empresaInforme.email || 'servicios@vaicmedical.cl';
  const empresaMembrete = empresaInforme.membreteImagen || '/logo-vaic-pdf.jpeg';
  const protocolo = getPreventiveProtocol(orden.tipo_equipo, protocolosPreventivos);
  const preventiva = parsePreventivaObservaciones(orden.observaciones);
  const checklist = orden.preventivaChecklist || preventiva.checklist || {};
  const isStructuredPreventiva = String(orden.observaciones || '').startsWith(PREVENTIVA_OBS_PREFIX);
  const obs = htmlText(isStructuredPreventiva ? preventiva.observaciones : (preventiva.observaciones || orden.observaciones || ''));
  const mark = (item, status) => preventiveEntryMatches(checklist[item], status) ? 'X' : '';
  const criticidad = (item) => normalizePreventiveChecklistEntry(checklist[item]).criticidad;
  const firmaPreventiva = preventiva.firma ? `<img class="firma-img" src="${preventiva.firma}" alt="Firma tecnico"/>` : '';
  const firmaRecepcionPreventiva = preventiva.firmaRecepcion ? `<img class="firma-img" src="${preventiva.firmaRecepcion}" alt="Firma recepcion"/>` : '';
  const verificationUrl = preventiveVerificationUrl(orden);
  const tecnicoNombre = preventiva.tecnicoNombre || '';
  const tecnicoRut = preventiva.tecnicoRut || '';

  return `
    <style>
      body{font-family:Arial,sans-serif;color:#111827;margin:0;padding:24px;background:#fff}.page{max-width:960px;margin:auto}
      .print-btn{margin-bottom:12px;padding:8px 14px;border:0;background:#0f172a;color:white;border-radius:8px;font-weight:700}
      .head{display:grid;grid-template-columns:150px 1fr 176px;border:2px solid #111827;padding:12px;align-items:center;gap:18px}.logo{display:block;width:136px;max-height:88px;object-fit:contain}.brand{font-weight:800;font-size:18px}.company{text-align:center;font-size:11px;line-height:1.5;color:#334155}.meta{text-align:right;font-size:12px;line-height:1.5}.folio-label{font-size:10px;text-transform:uppercase;color:#475569;font-weight:700}.folio-value{display:block;font-size:22px;line-height:1.1;font-weight:900;margin-bottom:8px}
      h1{font-size:16px;text-align:center;margin:16px 0;text-transform:uppercase}.grid{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #111827;border-bottom:0}.cell{border-bottom:1px solid #111827;border-right:1px solid #111827;padding:7px;font-size:12px}.cell b{display:block;font-size:10px;text-transform:uppercase;color:#475569}
      table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #111827;padding:6px;font-size:11px}.mark{text-align:center;font-weight:800}th{background:#e5e7eb}.obs{border:1px solid #111827;padding:10px;min-height:70px;margin-top:12px;font-size:12px}
      .section-title{font-size:12px;font-weight:800;text-transform:uppercase;margin-top:14px}.recepcion th,.recepcion td{text-align:left;vertical-align:middle}.recepcion th:nth-child(3),.recepcion td:nth-child(3){width:180px;text-align:center}.qr{width:108px;height:108px;object-fit:contain}.qr-url{font-size:7px;line-height:1.2;color:#475569;word-break:break-all;margin-top:4px}
      .firma-img{display:block;max-width:240px;max-height:90px;margin:0 auto}.sign{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:40px}.sign-card{display:flex;flex-direction:column}.signature-slot{height:96px;display:flex;align-items:flex-end;justify-content:center}.line{border-top:1px solid #111827;text-align:center;padding-top:8px;font-size:11px;min-height:38px}
      @media print{.print-btn{display:none}body{padding:0}}
    </style>
    <div class="page">
      <button class="print-btn" onclick="window.print()">Imprimir / Guardar PDF</button>
      <div class="head"><div><img class="logo" src="${empresaMembrete}" alt="Membrete empresa"/></div><div class="company"><div class="brand">${htmlText(empresaNombre)}</div><div>RUT: ${htmlText(empresaRut)}</div><div>Giro: ${htmlText(empresaGiro)}</div><div>Correo: ${htmlText(empresaMail)}</div></div><div class="meta"><span class="folio-label">Folio</span><span class="folio-value">${htmlText(orden.folio || '')}</span>Fecha: ${htmlText(formatPdfDate(orden.fecha))}</div></div>
      <h1>${htmlText(protocolo.title)}</h1>
      <div class="grid">
        <div class="cell"><b>Cliente</b>${htmlText(cliente?.name || '')}</div><div class="cell"><b>RUT</b>${htmlText(cliente?.rut || '')}</div><div class="cell"><b>Licitacion</b>${htmlText(lic?.id_licitacion || lic?.name || '')}</div>
        <div class="cell"><b>Equipo</b>${htmlText(orden.tipo_equipo || '')}</div><div class="cell"><b>Marca</b>${htmlText(orden.marca || '')}</div><div class="cell"><b>Modelo</b>${htmlText(orden.modelo || '')}</div>
        <div class="cell"><b>Serie</b>${htmlText(orden.numero_serie || '')}</div><div class="cell"><b>Inventario</b>${htmlText(orden.numero_inventario || '')}</div><div class="cell"><b>Servicio</b>${htmlText(orden.ubicacion_area || '')}</div>
      </div>
      <table><thead><tr><th rowspan="2">Accion</th><th rowspan="2">Criticidad</th><th colspan="4">Estados</th></tr><tr><th>Si</th><th>No</th><th>N/A</th><th>Falla</th></tr></thead><tbody>
      ${protocolo.sections.flatMap(s => [`<tr><th colspan="6">${htmlText(s.section)}</th></tr>`, ...s.items.map(i => {
        const itemLabel = protocolItemLabel(i);
        const itemKey = `${s.section} - ${itemLabel}`;
        return `<tr><td>${htmlText(itemLabel)}</td><td>${htmlText(criticidad(itemKey))}</td><td class="mark">${mark(itemKey, 'Si')}</td><td class="mark">${mark(itemKey, 'No')}</td><td class="mark">${mark(itemKey, 'N/A')}</td><td class="mark">${mark(itemKey, 'Falla')}</td></tr>`;
      })]).join('')}
      </tbody></table>
      <div class="obs"><b>Observaciones</b><br/>${obs}</div>
      <p><b>Estado final:</b> ${htmlText(orden.estado_equipo || orden.estado || '')}</p>
      <div class="section-title">Recepcion del equipo</div><table class="recepcion"><thead><tr><th>Nombre</th><th>Cargo</th><th>Verificacion QR</th></tr></thead><tbody><tr><td>${htmlText(preventiva.recibidoPor || '')}</td><td>${htmlText(preventiva.cargoRecepcion || '')}</td><td><img class="qr" src="${qrImageUrl(verificationUrl)}" alt="QR verificacion"/><div class="qr-url">${htmlText(verificationUrl)}</div></td></tr></tbody></table>
      <div class="sign"><div class="sign-card"><div class="signature-slot">${firmaRecepcionPreventiva}</div><div class="line">Firma y Recepcion Conforme</div></div><div class="sign-card"><div class="signature-slot">${firmaPreventiva}</div><div class="line">Tecnico en Mantenimiento Equipo Medico${tecnicoNombre ? `<br/>${htmlText(tecnicoNombre)}` : ''}${tecnicoRut ? ` - RUT: ${htmlText(tecnicoRut)}` : ''}</div></div></div>
    </div>`;
};

const PublicPreventiveReport = ({ verifyOrderId = '', verifyFolio = '' }) => {
  const [state, setState] = useState({ loading: true, error: '', html: '' });

  useEffect(() => {
    const loadReport = async () => {
      setState({ loading: true, error: '', html: '' });
      let query = supabase.from('ordenes_trabajo').select('*').eq('tipo_mantencion', 'preventiva').limit(1);
      query = verifyOrderId ? query.eq('id', verifyOrderId) : query.eq('folio', verifyFolio);
      const { data: ordenesData, error: ordenError } = await supabaseRequest(() => query);
      const orden = ordenesData?.[0];
      if (ordenError || !orden) {
        setState({ loading: false, error: 'No se encontro el informe preventivo solicitado.', html: '' });
        return;
      }

      const [{ data: clientesData }, { data: licData }, { data: checklistData }, { data: appData }] = await Promise.all([
        supabase.from('clientes').select('*').eq('id_RUT', orden.cliente_id).maybeSingle(),
        supabase.from('licitaciones').select('*').eq('id', orden.licitacion_id).maybeSingle(),
        supabase.from('orden_checklist').select('*').eq('orden_id', orden.id),
        supabase.from('app_data').select('key, data').in('key', ['empresas', 'protocolos_preventivos']),
      ]);
      const checklist = (checklistData || []).reduce((acc, item) => {
        acc[item.item] = item.estado;
        return acc;
      }, {});
      const appRows = appData || [];
      const empresas = appRows.find(row => row.key === 'empresas')?.data || [];
      const protocolosPreventivos = appRows.find(row => row.key === 'protocolos_preventivos')?.data || {};
      const html = buildPreventivePublicReportHtml({
        orden: { ...orden, preventivaChecklist: Object.keys(checklist).length ? checklist : undefined },
        cliente: clientesData,
        lic: licData,
        empresa: Array.isArray(empresas) ? empresas[0] : null,
        protocolosPreventivos,
      });
      setState({ loading: false, error: '', html });
    };
    loadReport();
  }, [verifyOrderId, verifyFolio]);

  if (state.loading) return <div className="min-h-screen grid place-items-center bg-white text-slate-500">Cargando informe...</div>;
  if (state.error) return <div className="min-h-screen grid place-items-center bg-white p-6 text-center text-slate-700">{state.error}</div>;
  return <div dangerouslySetInnerHTML={{ __html: state.html }} />;
};

const buildCorrectivePublicReportHtml = ({ orden, cliente, lic, empresa }) => {
  const empresaInforme = empresa || {};
  const empresaNombre = empresaInforme.razonSocial || empresaInforme.nombreFantasia || 'Vaicmedical';
  const empresaRut = empresaInforme.rut || empresaInforme.RUT || '77.573.229-6';
  const empresaGiro = empresaInforme.giro || 'Mantencion y Reparacion de Equipos Medicos';
  const empresaMail = empresaInforme.correoContacto || empresaInforme.email || 'servicios@vaicmedical.cl';
  const empresaMembrete = empresaInforme.membreteImagen || '/logo-vaic-pdf.jpeg';
  const correctiva = parseCorrectivaObservaciones(orden.observaciones);
  const estado = String(orden.estado || '').trim();
  const estadoKey = normalizeKey(estado);
  const title = correctiva.garantiaContrato || estadoKey === 'garantia'
    ? 'MANT. CORRECTIVO. - GARANTIA'
    : isEstadoEjecutado(estado)
      ? 'MANT. CORRECTIVO - EJECUTADO'
      : estadoKey === 'ingresado'
        ? 'MANT. CORRECTIVO - DIAGNOSTICO'
        : estado
          ? `MANT. CORRECTIVO - ${estado.toUpperCase()}`
          : 'MANT. CORRECTIVO';
  const showCondicionFinal = ['garantia', 'sugerencia de baja'].includes(estadoKey) || isEstadoEjecutado(estado);
  const verificationUrl = reportVerificationUrl('correctiva', orden);
  const firmaTecnico = correctiva.firma ? `<img class="firma-img" src="${correctiva.firma}" alt="Firma tecnico"/>` : '';
  const firmaRecepcion = correctiva.firmaRecepcion ? `<img class="firma-img" src="${correctiva.firmaRecepcion}" alt="Firma recepcion"/>` : '';
  const fotos = correctiva.fotos?.length
    ? `<div class="photos">${correctiva.fotos.map(f => `<figure><img src="${f.src}" alt="${htmlText(f.name || 'foto')}"/><figcaption>${htmlText(f.name || '')}</figcaption></figure>`).join('')}</div>`
    : '';
  const diagnosticoHtml = correctiva.conclusion ? htmlText(correctiva.conclusion) : '';

  return `
    <style>
      body{font-family:Arial,sans-serif;color:#111827;margin:0;padding:24px;background:#fff}.page{max-width:960px;margin:auto}.print-btn{margin-bottom:12px;padding:8px 14px;border:0;background:#0f172a;color:white;border-radius:8px;font-weight:700}
      .head{display:grid;grid-template-columns:150px 1fr 176px;border:2px solid #111827;padding:12px;align-items:center;gap:18px}.logo{display:block;width:136px;max-height:88px;object-fit:contain}.brand{font-weight:800;font-size:18px}.company{text-align:center;font-size:11px;line-height:1.5;color:#334155}.meta{text-align:right;font-size:12px;line-height:1.5}.folio-label{font-size:10px;text-transform:uppercase;color:#475569;font-weight:700}.folio-value{display:block;font-size:22px;line-height:1.1;font-weight:900;margin-bottom:8px}
      h1{font-size:16px;text-align:center;margin:16px 0;text-transform:uppercase;letter-spacing:.06em}.grid{display:grid;grid-template-columns:repeat(2,1fr);border:1px solid #111827;border-bottom:0}.cell{border-bottom:1px solid #111827;border-right:1px solid #111827;padding:7px;font-size:12px}.cell b{display:block;font-size:10px;text-transform:uppercase;color:#475569}
      .section{margin-top:18px}.section-title{font-size:12px;font-weight:800;text-transform:uppercase;margin-top:14px}.box{border:1px solid #111827;padding:12px;min-height:70px;font-size:12px;line-height:1.45}.recepcion{width:100%;border-collapse:collapse;margin-top:16px}.recepcion th,.recepcion td{border:1px solid #111827;padding:6px;font-size:11px;text-align:left;vertical-align:middle}.recepcion th{background:#e5e7eb}.recepcion th:nth-child(3),.recepcion td:nth-child(3){width:180px;text-align:center}.qr{width:108px;height:108px;object-fit:contain}.qr-url{font-size:7px;line-height:1.2;color:#475569;word-break:break-all;margin-top:4px}
      .photos{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,140px));gap:8px;margin-top:10px}.photos figure{margin:0;break-inside:avoid}.photos img{width:100%;height:92px;object-fit:contain;border:1px solid #cbd5e1;background:#f8fafc}.photos figcaption{font-size:9px;color:#64748b;margin-top:3px;word-break:break-word}.firma-img{display:block;max-width:240px;max-height:90px;margin:0 auto 8px}.sign{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:40px}.sign-card{display:flex;flex-direction:column}.signature-slot{height:96px;display:flex;align-items:flex-end;justify-content:center}.line{border-top:1px solid #111827;text-align:center;padding-top:8px;font-size:11px;min-height:38px}
      @media print{.print-btn{display:none}body{padding:0}}
    </style>
    <div class="page">
      <button class="print-btn" onclick="window.print()">Imprimir / Guardar PDF</button>
      <div class="head"><div><img class="logo" src="${empresaMembrete}" alt="Membrete empresa"/></div><div class="company"><div class="brand">${htmlText(empresaNombre)}</div><div>RUT: ${htmlText(empresaRut)}</div><div>Giro: ${htmlText(empresaGiro)}</div><div>Correo: ${htmlText(empresaMail)}</div></div><div class="meta"><span class="folio-label">Folio</span><span class="folio-value">${htmlText(orden.folio || '')}</span>Fecha: ${htmlText(formatPdfDate(orden.fecha))}</div></div>
      <h1>${htmlText(title)}</h1>
      <div class="grid">
        <div class="cell"><b>Cliente</b>${htmlText(cliente?.name || '')}</div><div class="cell"><b>RUT</b>${htmlText(cliente?.rut || '')}</div>
        <div class="cell"><b>Licitacion convenio</b>${htmlText(lic?.id_licitacion || lic?.name || '')}</div><div class="cell"><b>Servicio</b>${htmlText(orden.ubicacion_area || '')}</div>
        <div class="cell"><b>Tipo de equipo</b>${htmlText(orden.tipo_equipo || '')}</div><div class="cell"><b>Marca</b>${htmlText(orden.marca || '')}</div>
        <div class="cell"><b>Modelo</b>${htmlText(orden.modelo || '')}</div><div class="cell"><b>Serie / Inventario</b>${htmlText(`${orden.numero_serie || ''} / ${orden.numero_inventario || ''}`)}</div>
      </div>
      <div class="section"><h3>Condicion inicial de equipo</h3><div class="box">${htmlText(correctiva.condicionInicial || correctivaText(correctiva))}</div></div>
      <div class="section"><h3>Informacion de diagnostico</h3><div class="box">${diagnosticoHtml}</div></div>
      ${showCondicionFinal ? `<div class="section"><h3>Condicion final</h3><div class="box">${htmlText(correctiva.condicionFinal || DEFAULT_CONDICION_FINAL_CORRECTIVA)}</div></div>` : ''}
      ${fotos ? `<div class="section"><h3>Registro fotografico</h3>${fotos}</div>` : ''}
      <div class="section-title">Recepcion del equipo</div><table class="recepcion"><thead><tr><th>Nombre</th><th>Cargo</th><th>Verificacion QR</th></tr></thead><tbody><tr><td>${htmlText(correctiva.recibidoPor || '')}</td><td>${htmlText(correctiva.cargoRecepcion || '')}</td><td><img class="qr" src="${qrImageUrl(verificationUrl)}" alt="QR verificacion"/><div class="qr-url">${htmlText(verificationUrl)}</div></td></tr></tbody></table>
      <div class="sign"><div class="sign-card"><div class="signature-slot">${firmaRecepcion}</div><div class="line">Firma y Recepcion Conforme</div></div><div class="sign-card"><div class="signature-slot">${firmaTecnico}</div><div class="line">Tecnico en Mantenimiento Equipo Medico</div></div></div>
    </div>`;
};

const PublicCorrectiveReport = ({ verifyOrderId = '', verifyFolio = '' }) => {
  const [state, setState] = useState({ loading: true, error: '', html: '' });

  useEffect(() => {
    const loadReport = async () => {
      setState({ loading: true, error: '', html: '' });
      let query = supabase.from('ordenes_trabajo').select('*').eq('tipo_mantencion', 'correctiva').limit(1);
      query = verifyOrderId ? query.eq('id', verifyOrderId) : query.eq('folio', verifyFolio);
      const { data: ordenesData, error: ordenError } = await supabaseRequest(() => query);
      const orden = ordenesData?.[0];
      if (ordenError || !orden) {
        setState({ loading: false, error: 'No se encontro el informe correctivo solicitado.', html: '' });
        return;
      }
      const [{ data: clientesData }, { data: licData }, { data: appData }] = await Promise.all([
        supabase.from('clientes').select('*').eq('id_RUT', orden.cliente_id).maybeSingle(),
        supabase.from('licitaciones').select('*').eq('id', orden.licitacion_id).maybeSingle(),
        supabase.from('app_data').select('key, data').in('key', ['empresas']),
      ]);
      const empresas = (appData || []).find(row => row.key === 'empresas')?.data || [];
      const html = buildCorrectivePublicReportHtml({
        orden,
        cliente: clientesData,
        lic: licData,
        empresa: Array.isArray(empresas) ? empresas[0] : null,
      });
      setState({ loading: false, error: '', html });
    };
    loadReport();
  }, [verifyOrderId, verifyFolio]);

  if (state.loading) return <div className="min-h-screen grid place-items-center bg-white text-slate-500">Cargando informe...</div>;
  if (state.error) return <div className="min-h-screen grid place-items-center bg-white p-6 text-center text-slate-700">{state.error}</div>;
  return <div dangerouslySetInnerHTML={{ __html: state.html }} />;
};

const ContentManager = () => {
  const { activeModule, setActiveModule, sidebarOpen, setSidebarOpen, loggedInUser, activeEmpresaId, empresas } = useContext(ERPContext);
  const [verificationRequest] = useState(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const type = params.get('verify');
    if (!['preventiva', 'correctiva'].includes(type)) return null;
    return {
      type,
      orden: params.get('orden') || '',
      folio: params.get('folio') || '',
    };
  });

  useEffect(() => {
    if (verificationRequest?.type === 'preventiva') {
      setActiveModule('operaciones-historial-preventivo');
    } else if (verificationRequest?.type === 'correctiva') {
      setActiveModule('operaciones-historial-correctivo');
    }
  }, [verificationRequest, setActiveModule]);

  if (verificationRequest?.type === 'preventiva' && !loggedInUser) {
    return <PublicPreventiveReport verifyOrderId={verificationRequest.orden} verifyFolio={verificationRequest.folio} />;
  }
  if (verificationRequest?.type === 'correctiva' && !loggedInUser) {
    return <PublicCorrectiveReport verifyOrderId={verificationRequest.orden} verifyFolio={verificationRequest.folio} />;
  }

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
    'contabilidad-analiticos': 'contabilidad',
    'contabilidad-estados-financieros': 'contabilidad',
  };
  const canAccess = (id) => {
    if (loggedInUser.isSuperadmin) return true;
    const companyAccess = activeEmpresaId ? userEmpresaAccess(loggedInUser, activeEmpresaId, empresas) : null;
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
      case 'operaciones-historial-preventivo': return <HistorialMantenciones tipo="preventiva" verifyOrderId={verificationRequest?.orden || ''} verifyFolio={verificationRequest?.folio || ''} />;
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
      case 'contabilidad-analiticos': return <AnaliticosContables />;
      case 'contabilidad-estados-financieros': return <EstadosFinancieros />;
      case 'mantenedores-clientes': return <MantenedoresClientesProveedores />;
      case 'mantenedores-licitaciones': return <MantenedoresLicitaciones />;
      case 'mantenedores-equipos': return <MantenedoresEquipos />;
      case 'mantenedores-repuestos': return <MantenedoresRepuestos />;
      case 'mantenedores-productos-rendiciones': return <MantenedoresProductosRendiciones />;
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
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-y-0 left-64 right-0 z-40 bg-slate-950/30 backdrop-blur-[1px] lg:hidden"
        />
      )}
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

