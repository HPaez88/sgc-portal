/**
 * fileSecurity.js - SGC Portal
 * 
 * Módulo de validación de seguridad contra archivos maliciosos y compresión
 * de imágenes en el navegador para evidencias de actividades (ISO 9001:2015).
 */
import { uploadEvidencia } from '../supabase';

const EXTENSIONES_PELIGROSAS = new Set([
  'exe', 'bat', 'cmd', 'sh', 'vbs', 'js', 'mjs', 'html', 'htm', 'scr', 
  'pif', 'jar', 'zip', 'rar', 'tar', 'gz', '7z', 'iso', 'msi', 'dll', 
  'apk', 'php', 'asp', 'aspx', 'py', 'ps1', 'wsf', 'reg', 'hta', 'com', 'bin'
]);

const EXTENSIONES_PERMITIDAS = new Set(['jpg', 'jpeg', 'png', 'webp', 'pdf']);

/**
 * Valida que el archivo sea estrictamente una Imagen o un PDF genuino.
 * Inspecciona los "Magic Bytes" binarios de cabecera para prevenir archivos
 * maliciosos con extensiones camufladas.
 */
export async function validateSafeFile(file) {
  if (!file) {
    return { valid: false, error: 'No se seleccionó ningún archivo.' };
  }

  // 1. Tamaño máximo de seguridad previa (25 MB)
  const maxBytes = 25 * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: 'El archivo excede el tamaño máximo permitido de 25 MB.' };
  }

  // 2. Extensión del nombre de archivo
  const parts = file.name.split('.');
  if (parts.length < 2) {
    return { valid: false, error: 'El archivo no tiene extensión válida.' };
  }
  const ext = parts.pop().toLowerCase();

  if (EXTENSIONES_PELIGROSAS.has(ext)) {
    return { 
      valid: false, 
      error: `Archivo potencialmente peligroso detectado (.${ext}). Por seguridad institucional solo se admiten Fotos (JPG, PNG, WEBP) y Documentos PDF.` 
    };
  }

  if (!EXTENSIONES_PERMITIDAS.has(ext)) {
    return { 
      valid: false, 
      error: `Formato (.${ext}) no admitido. Únicamente se permite subir una Foto (JPG, PNG, WEBP) o Documento PDF.` 
    };
  }

  // 3. Inspección profunda de Magic Bytes en cabecera binaria
  try {
    const buffer = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // PDF Magic Bytes: %PDF (0x25, 0x50, 0x44, 0x46)
    const isPDF = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;

    // JPEG Magic Bytes: 0xFF, 0xD8, 0xFF
    const isJPEG = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;

    // PNG Magic Bytes: 0x89, 0x50, 0x4E, 0x47 (‰PNG)
    const isPNG = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;

    // WEBP Magic Bytes: RIFF en bytes 0..3 y WEBP en bytes 8..11
    const isRIFF = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
    const isWEBP = isRIFF && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;

    if (ext === 'pdf' && isPDF) {
      return { valid: true, type: 'pdf', mime: 'application/pdf' };
    }

    if ((ext === 'jpg' || ext === 'jpeg') && isJPEG) {
      return { valid: true, type: 'image', mime: 'image/jpeg' };
    }

    if (ext === 'png' && isPNG) {
      return { valid: true, type: 'image', mime: 'image/png' };
    }

    if (ext === 'webp' && isWEBP) {
      return { valid: true, type: 'image', mime: 'image/webp' };
    }

    // Si la extensión dice ser una imagen o PDF pero los bytes no corresponden:
    return {
      valid: false,
      error: 'Archivo rechazado por seguridad: La cabecera binaria interna no coincide con un PDF o imagen legítima. El archivo podría estar alterado o dañado.'
    };
  } catch (err) {
    console.error('Error al analizar cabecera binaria del archivo:', err);
    return { valid: false, error: 'No se pudo verificar la integridad y seguridad del archivo.' };
  }
}

/**
 * Comprime una imagen en el navegador usando un Canvas offscreen.
 * Redimensiona a un máximo de 1400px y comprime a JPEG calidad 0.82.
 */
export async function compressImage(file, maxDimension = 1400, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error al leer la imagen'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Error al decodificar la imagen'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcular escala respetando aspecto
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        // Fondo blanco para imágenes transparentes (PNG a JPEG)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        canvas.toBlob((blob) => {
          if (!blob) {
            resolve({ blob: file, dataUrl, width, height });
            return;
          }
          const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve({
            file: compressedFile,
            blob,
            dataUrl,
            width,
            height,
            originalSize: file.size,
            compressedSize: blob.size
          });
        }, 'image/jpeg', quality);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Convierte un archivo PDF a Base64 Data URL.
 */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error al leer archivo'));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

/**
 * Flujo completo: Valida seguridad, comprime imagen y genera el registro de evidencia.
 */
export async function processEvidenceFile(file, usuarioNombre = 'Usuario') {
  // 1. Validar seguridad
  const check = await validateSafeFile(file);
  if (!check.valid) {
    return { success: false, error: check.error };
  }

  let finalFile = file;
  let previewUrl = '';
  let tamanoOriginalKb = Math.round(file.size / 1024);
  let tamanoComprimidoKb = tamanoOriginalKb;

  // 2. Si es imagen, comprimir
  if (check.type === 'image') {
    try {
      const comp = await compressImage(file, 1400, 0.82);
      finalFile = comp.file;
      previewUrl = comp.dataUrl;
      tamanoComprimidoKb = Math.round(comp.compressedSize / 1024);
    } catch (e) {
      console.warn('Fallo compresión client-side, usando archivo original:', e);
      previewUrl = await fileToDataUrl(file);
    }
  } else {
    // Es PDF
    previewUrl = await fileToDataUrl(file);
  }

  // 3. Subir a Supabase Storage si está disponible
  let remoteUrl = '';
  try {
    const upRes = await uploadEvidencia(finalFile);
    if (upRes && upRes.url) {
      remoteUrl = upRes.url;
    }
  } catch (e) {
    console.warn('Supabase upload falló, usando DataURL segura:', e);
  }

  const finalUrl = remoteUrl || previewUrl;

  return {
    success: true,
    evidencia: {
      url: finalUrl,
      preview: previewUrl,
      nombre: file.name,
      tipo: check.type, // 'image' | 'pdf'
      tamano_kb: tamanoComprimidoKb,
      tamano_original_kb: tamanoOriginalKb,
      fecha_subida: new Date().toISOString(),
      subido_por: usuarioNombre
    }
  };
}
