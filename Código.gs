const NOME_ABA_PEDIDOS = 'pedidos';
const NOME_ABA_CLIENTES = 'clientes';
const NOME_ABA_DADOS = 'dados';
const NOME_PASTA = 'Documentos Gerados';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Gerador de pedidos');
}

function gerarDocumentosWeb(numeroPedido) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    numeroPedido = String(numeroPedido || '').trim();
    if (!numeroPedido) throw new Error('Informe o número do pedido.');

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const pedidos = ss.getSheetByName(NOME_ABA_PEDIDOS);
    const clientes = ss.getSheetByName(NOME_ABA_CLIENTES);
    const dados = ss.getSheetByName(NOME_ABA_DADOS);

    if (!pedidos || !clientes || !dados) {
      throw new Error('Não encontrei uma das abas: pedidos, clientes ou dados.');
    }

    const dadosPedido = obterDadosPedido(pedidos, clientes, dados, numeroPedido);

    const logo = obterLogoDataUri();

    const htmlPedido = montarDocumentoHtml(dadosPedido, false, logo);
    const htmlProducao = montarDocumentoHtml(dadosPedido, true, logo);

    const pasta = obterPastaDocumentosGerados();

    const pdfPedido = HtmlService
      .createHtmlOutput(htmlPedido)
      .getAs(MimeType.PDF)
      .setName(`PEDIDO DE COMPRA ${dadosPedido.pedido}.pdf`);

    const pdfProducao = HtmlService
      .createHtmlOutput(htmlProducao)
      .getAs(MimeType.PDF)
      .setName(`ORDEM DE PRODUÇÃO ${dadosPedido.pedido}.pdf`);

    const arquivoPedido = pasta.createFile(pdfPedido);
    const arquivoProducao = pasta.createFile(pdfProducao);

    return {
      ok: true,
      pedido: {
        nome: arquivoPedido.getName(),
        url: arquivoPedido.getUrl()
      },
      producao: {
        nome: arquivoProducao.getName(),
        url: arquivoProducao.getUrl()
      }
    };

  } finally {
    lock.releaseLock();
  }
}

function obterDadosPedido(abaPedidos, abaClientes, abaDados, numeroPedido) {
  const valoresPedidos = abaPedidos.getDataRange().getValues();
  if (valoresPedidos.length < 2) {
    throw new Error('A aba pedidos não possui dados.');
  }

  const mapaPedidos = criarMapaCabecalho(valoresPedidos[0]);
  exigirCabecalhos(mapaPedidos, [
    'DATA', 'DATA PRAZO', 'EMPRESA', 'PEDIDO',
    'NUM. CLIENTE', 'CLIENTE', 'ITEM', 'CÓDIGO', 'PEÇA',
    'LARGURA', 'ALTURA', 'ESP', 'QTDE', 'FACES',
    'ACABAMENTO', 'COR', 'm²', 'FURAÇÃO', 'USINAGEM',
    'R$ Unit', 'R$'
  ], 'pedidos');

  const idxPedido = mapaPedidos['PEDIDO'];

  const linhas = valoresPedidos
    .slice(1)
    .filter(linha => normalizarNumero(linha[idxPedido]) === normalizarNumero(numeroPedido));

  if (!linhas.length) {
    throw new Error(`Pedido ${numeroPedido} não encontrado.`);
  }

  const primeira = linhas[0];

  const numeroCliente = primeira[mapaPedidos['NUM. CLIENTE']];
  const nomeCliente = primeira[mapaPedidos['CLIENTE']];
  const empresa = primeira[mapaPedidos['EMPRESA']];

  const valoresClientes = abaClientes.getDataRange().getValues();
  if (valoresClientes.length < 2) {
    throw new Error('A aba clientes não possui dados.');
  }

  const mapaClientes = criarMapaCabecalho(valoresClientes[0]);
  exigirCabecalhos(mapaClientes, [
    'CLIENTE', 'ENDEREÇO', 'CIDADE', 'CEP', 'BAIRRO', 'TELEFONE'
  ], 'clientes');

  // NUM CLIENTE / NUM. CLIENTE é a chave de busca e não precisa
  // estar entre os cabeçalhos exigidos acima.
  const idxNumCliente = encontrarIndiceCabecalho(valoresClientes[0], [
    'NUM CLIENTE', 'NUM. CLIENTE', 'NUMERO CLIENTE', 'NÚMERO CLIENTE'
  ]);

  if (idxNumCliente === -1) {
    throw new Error('Na aba clientes, a coluna A deve ser NUM CLIENTE.');
  }

  const clienteLinha = valoresClientes
    .slice(1)
    .find(linha => normalizarNumero(linha[idxNumCliente]) === normalizarNumero(numeroCliente));

  if (!clienteLinha) {
    throw new Error(`NUM. CLIENTE ${numeroCliente} não encontrado na aba clientes.`);
  }

  const valoresDados = abaDados.getDataRange().getValues();
  if (valoresDados.length < 2) {
    throw new Error('A aba dados não possui dados.');
  }

  const mapaDados = criarMapaCabecalho(valoresDados[0]);
  exigirCabecalhos(mapaDados, [
    'EMPRESA', 'RAZÃO SOCIAL', 'CNPJ', 'I.E',
    'ENDEREÇO', 'CEP', 'BAIRRO', 'CIDADE',
    'BANCO', 'AG', 'C/C', 'PIX'
  ], 'dados');

  const empresaLinha = valoresDados
    .slice(1)
    .find(linha => texto(linha[mapaDados['EMPRESA']]) === texto(empresa));

  if (!empresaLinha) {
    throw new Error(`Empresa ${empresa} não encontrada na aba dados.`);
  }

  const dataPedido = primeira[mapaPedidos['DATA']];
  const dataPrazo = primeira[mapaPedidos['DATA PRAZO']];

  const itens = linhas.map(linha => ({
    item: linha[mapaPedidos['ITEM']],
    codigo: linha[mapaPedidos['CÓDIGO']],
    peca: linha[mapaPedidos['PEÇA']],
    largura: linha[mapaPedidos['LARGURA']],
    altura: linha[mapaPedidos['ALTURA']],
    esp: linha[mapaPedidos['ESP']],
    qtde: linha[mapaPedidos['QTDE']],
    faces: linha[mapaPedidos['FACES']],
    acabamento: linha[mapaPedidos['ACABAMENTO']],
    cor: linha[mapaPedidos['COR']],
    m2: linha[mapaPedidos['m²']],
    furacao: linha[mapaPedidos['FURAÇÃO']],
    usinagem: linha[mapaPedidos['USINAGEM']],
    unit: linha[mapaPedidos['R$ Unit']],
    total: linha[mapaPedidos['R$']]
  }));

  return {
    pedido: numeroPedido,
    dataPedido: formatarData(dataPedido),
    dataPrazo: formatarData(dataPrazo),
    empresa: texto(empresa),

    razaoSocial: texto(empresaLinha[mapaDados['RAZÃO SOCIAL']]),
    cnpj: texto(empresaLinha[mapaDados['CNPJ']]),
    ie: texto(empresaLinha[mapaDados['I.E']]),
    enderecoEmpresa: texto(empresaLinha[mapaDados['ENDEREÇO']]),
    cepEmpresa: texto(empresaLinha[mapaDados['CEP']]),
    bairroEmpresa: texto(empresaLinha[mapaDados['BAIRRO']]),
    cidadeEmpresa: texto(empresaLinha[mapaDados['CIDADE']]),

    cliente: texto(nomeCliente),
    cidadeCliente: texto(clienteLinha[mapaClientes['CIDADE']]),
    enderecoCliente: texto(clienteLinha[mapaClientes['ENDEREÇO']]),
    cepCliente: texto(clienteLinha[mapaClientes['CEP']]),
    bairroCliente: texto(clienteLinha[mapaClientes['BAIRRO']]),
    telefoneCliente: texto(clienteLinha[mapaClientes['TELEFONE']]),

    banco: texto(empresaLinha[mapaDados['BANCO']]),
    agencia: texto(empresaLinha[mapaDados['AG']]),
    conta: texto(empresaLinha[mapaDados['C/C']]),
    pix: texto(empresaLinha[mapaDados['PIX']]),

    itens: itens,

    totalPecas: itens.reduce((s, i) => s + numero(i.qtde), 0),
    totalM2: itens.reduce((s, i) => s + numero(i.m2), 0),
    totalOrcamento: itens.reduce((s, i) => s + numero(i.total), 0)
  };
}

function montarDocumentoHtml(d, producao, logo) {
  const nomeArquivo = producao ? 'ordem_producao' : 'pedido';
  let html = HtmlService.createHtmlOutputFromFile(nomeArquivo).getContent();

  const rows = d.itens.map(i => producao ? `
    <tr>
      <td>${esc(i.item)}</td>
      <td>${esc(i.codigo)}</td>
      <td class="left">${esc(i.peca)}</td>
      <td>${fmtNumero(i.largura)}</td>
      <td>${fmtNumero(i.altura)}</td>
      <td>${fmtNumero(i.esp)}</td>
      <td>${fmtNumero(i.qtde)}</td>
      <td>${esc(i.faces)}</td>
      <td class="left">${esc(i.acabamento)}</td>
      <td class="left">${esc(i.cor)}</td>
      <td>${fmtNumero(i.m2, 2)}</td>
      <td class="left">${esc(i.furacao)}</td>
      <td class="left">${esc(i.usinagem)}</td>
    </tr>
  ` : `
    <tr>
      <td>${esc(i.item)}</td>
      <td>${esc(i.codigo)}</td>
      <td class="left">${esc(i.peca)}</td>
      <td>${fmtNumero(i.largura)}</td>
      <td>${fmtNumero(i.altura)}</td>
      <td>${fmtNumero(i.esp)}</td>
      <td>${fmtNumero(i.qtde)}</td>
      <td>${esc(i.faces)}</td>
      <td class="left">${esc(i.acabamento)}</td>
      <td class="left">${esc(i.cor)}</td>
      <td>${fmtNumero(i.m2, 2)}</td>
      <td class="left">${esc(i.furacao)}</td>
      <td class="left">${esc(i.usinagem)}</td>
      <td>${fmtMoeda(i.unit)}</td>
      <td>${fmtMoeda(i.total)}</td>
    </tr>
  `).join('');

  const placeholders = {
    '{{LOGO}}': logo,
    '{{RAZAO_SOCIAL}}': esc(d.razaoSocial),
    '{{CNPJ_IE}}': esc(d.cnpj + (d.ie ? '  |  I.E.: ' + d.ie : '')),
    '{{ENDERECO_EMPRESA}}': esc(d.enderecoEmpresa + (d.cepEmpresa ? '  |  CEP: ' + d.cepEmpresa : '')),
    '{{BAIRRO_CIDADE_EMPRESA}}': esc(d.bairroEmpresa + (d.cidadeEmpresa ? '  |  ' + d.cidadeEmpresa : '')),

    '{{DATA}}': esc(d.dataPedido),
    '{{PEDIDO}}': esc(d.pedido),
    '{{TITULO}}': producao ? 'ORDEM DE PRODUÇÃO' : 'PEDIDO DE COMPRA',

    '{{CLIENTE}}': esc(d.cliente),
    '{{CIDADE}}': esc(d.cidadeCliente),
    '{{TELEFONE}}': esc(d.telefoneCliente),
    '{{ENDERECO}}': esc(d.enderecoCliente),
    '{{CEP}}': esc(d.cepCliente),
    '{{BAIRRO}}': esc(d.bairroCliente),

    '{{ROWS}}': rows,
    '{{TOTAL_PECAS}}': fmtNumero(d.totalPecas),
    '{{TOTAL_M2}}': fmtNumero(d.totalM2, 2),
    '{{TOTAL_ORCAMENTO}}': fmtMoeda(d.totalOrcamento),

    '{{DATA_RECEBIMENTO}}': esc(d.dataPedido),
    '{{DATA_EMBARQUE}}': esc(d.dataPrazo),
    '{{BANCO}}': esc(d.banco),
    '{{AGENCIA}}': esc(d.agencia),
    '{{CONTA}}': esc(d.conta),
    '{{RAZAO_BANCO}}': esc(d.razaoSocial),
    '{{CNPJ_BANCO}}': esc(d.cnpj),
    '{{PIX}}': esc(d.pix)
  };

  Object.keys(placeholders).forEach(k => {
    html = html.split(k).join(placeholders[k]);
  });

  return html;
}

function obterPastaDocumentosGerados() {
  const pastas = DriveApp.getFoldersByName(NOME_PASTA);
  return pastas.hasNext() ? pastas.next() : DriveApp.createFolder(NOME_PASTA);
}

function criarMapaCabecalho(cabecalhos) {
  const mapa = {};
  cabecalhos.forEach((valor, i) => {
    mapa[normalizarCabecalho(valor)] = i;
  });

  const saida = {};
  Object.keys(mapa).forEach(k => saida[k] = mapa[k]);
  return new Proxy(saida, {
    get(target, prop) {
      if (prop in target) return target[prop];
      const chave = normalizarCabecalho(prop);
      return target[chave];
    },
    has(target, prop) {
      return normalizarCabecalho(prop) in target;
    }
  });
}

function exigirCabecalhos(mapa, cabecalhos, nomeAba) {
  const faltantes = cabecalhos.filter(c => !(normalizarCabecalho(c) in mapa));
  if (faltantes.length) {
    throw new Error(`Na aba "${nomeAba}" faltam os cabeçalhos: ${faltantes.join(', ')}`);
  }
}

function encontrarIndiceCabecalho(cabecalhos, alternativas) {
  for (const alternativa of alternativas) {
    const alvo = normalizarCabecalho(alternativa);
    const idx = cabecalhos.findIndex(c => normalizarCabecalho(c) === alvo);
    if (idx !== -1) return idx;
  }
  return -1;
}

function normalizarCabecalho(v) {
  return texto(v)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.\-_/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function normalizarNumero(v) {
  if (v === null || v === '' || typeof v === 'undefined') return '';
  const n = Number(v);
  return Number.isNaN(n) ? texto(v).trim() : String(n);
}

function numero(v) {
  if (typeof v === 'number') return v;
  if (v === null || v === '') return 0;

  let s = String(v).trim().replace(/\s/g, '');
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }

  const n = Number(s);
  return Number.isNaN(n) ? 0 : n;
}

function texto(v) {
  return v === null || typeof v === 'undefined' ? '' : String(v);
}

function formatarData(v) {
  if (!v) return '';
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v)) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  }

  const d = new Date(v);
  if (!isNaN(d)) {
    return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  }

  return texto(v);
}

function fmtNumero(v, casas) {
  const n = numero(v);
  const c = typeof casas === 'number' ? casas : (Number.isInteger(n) ? 0 : 2);
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: c,
    maximumFractionDigits: c
  });
}

function fmtMoeda(v) {
  return numero(v).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function esc(v) {
  return texto(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
