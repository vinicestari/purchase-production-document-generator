const PROP_LOGO_ID = 'LOGO_FILE_ID';
const LOGO_LIMITE_BYTES = 2 * 1024 * 1024; // 2 MB

// GIF transparente de 1x1 px: usado quando ainda não há logo,
// para o PDF não exibir o ícone de "imagem quebrada".
const LOGO_TRANSPARENTE =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/**
 * Chamada pelo gerador de PDFs. Retorna a logo como data URI
 * (ou um pixel transparente se não houver logo cadastrada).
 */
function obterLogoDataUri() {
  return lerLogoDataUri_() || LOGO_TRANSPARENTE;
}

/**
 * Chamada pela interface: informa se há logo e devolve uma prévia.
 */
function obterStatusLogo() {
  const arquivo = obterArquivoLogo_();
  if (!arquivo) return { configurada: false };

  return {
    configurada: true,
    nome: arquivo.getName(),
    preview: lerLogoDataUri_()
  };
}

/**
 * Chamada pela interface: recebe a imagem em base64 (sem o prefixo
 * "data:...;base64,"), valida e salva no Drive substituindo a anterior.
 */
function salvarLogo(base64) {
  if (!base64) throw new Error('Nenhum arquivo recebido.');

  const bytes = Utilities.base64Decode(base64);

  if (bytes.length > LOGO_LIMITE_BYTES) {
    throw new Error('A imagem é muito grande. O limite é de 2 MB.');
  }

  const tipo = detectarTipoImagem_(bytes);
  if (!tipo) {
    throw new Error('Formato inválido. Envie uma imagem PNG ou JPG.');
  }

  const props = PropertiesService.getScriptProperties();
  const idAntigo = props.getProperty(PROP_LOGO_ID);

  const blob = Utilities.newBlob(bytes, tipo.mime, 'logo.' + tipo.ext);
  const novo = obterPastaDocumentosGerados().createFile(blob);
  props.setProperty(PROP_LOGO_ID, novo.getId());

  // Só remove a logo antiga depois que a nova foi salva com sucesso.
  if (idAntigo) {
    try {
      DriveApp.getFileById(idAntigo).setTrashed(true);
    } catch (e) {
      // arquivo antigo já não existe: nada a fazer
    }
  }

  return { ok: true, nome: novo.getName(), preview: lerLogoDataUri_() };
}

function obterArquivoLogo_() {
  const id = PropertiesService.getScriptProperties().getProperty(PROP_LOGO_ID);
  if (!id) return null;

  try {
    const arquivo = DriveApp.getFileById(id);
    return arquivo.isTrashed() ? null : arquivo;
  } catch (e) {
    return null;
  }
}

function lerLogoDataUri_() {
  const arquivo = obterArquivoLogo_();
  if (!arquivo) return '';

  const blob = arquivo.getBlob();
  return 'data:' + blob.getContentType() + ';base64,' +
    Utilities.base64Encode(blob.getBytes());
}

// Confere os primeiros bytes do arquivo (assinatura), sem confiar na extensão.
function detectarTipoImagem_(bytes) {
  const b = i => bytes[i] & 255; // bytes do Apps Script vêm com sinal

  if (bytes.length > 8 && b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4E && b(3) === 0x47) {
    return { mime: 'image/png', ext: 'png' };
  }
  if (bytes.length > 3 && b(0) === 0xFF && b(1) === 0xD8 && b(2) === 0xFF) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }
  return null;
}
