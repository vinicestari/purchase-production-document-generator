Language: Portuguese (Brazil)

# Gerador de Pedidos e Ordens de Produção

App web desenvolvido com o **Google Apps Script**, integrado ao **Google Sheets**, para automatizar a geração de documentos em PDF a partir de dados de pedidos.

O sistema utiliza a planilha anexa como banco de dados e permite gerar automaticamente dois documentos:

* **Pedido de Compra**
* **Ordem de Produção**

Os documentos são armazenados automaticamente no Google Drive.

## Funcionalidades

* Busca de pedidos pelo número do pedido.
* Consulta automática dos dados do cliente.
* Consulta dos dados da empresa.
* Geração simultânea de:
  * Pedido de Compra em PDF;
  * Ordem de Produção em PDF.
* Preenchimento automático dos itens do pedido.
* Cálculo do total de peças.
* Cálculo do total de m².
* Cálculo do valor total do pedido.
* Formatação de datas, números e valores monetários.
* Geração dos documentos a partir de templates HTML.
* Armazenamento automático dos PDFs no Google Drive.
* Configuração de logo por instalação.
* Validação do arquivo de logo.
* Interface web para geração dos documentos.

## Tecnologias utilizadas

* **Google Apps Script**
* **Google Sheets**
* **Google Drive**
* **HTML5**
* **CSS3**
* **JavaScript**

O projeto não utiliza banco de dados externo. Os dados são armazenados diretamente em uma planilha Google Sheets.

## Estrutura do projeto

A estrutura esperada do projeto é:

```text
/
├── Código.gs
├── logo.gs
├── index.html
├── pedido.html
└── ordem_producao.html
```

### `Código.gs`

Contém a lógica principal da aplicação:

* leitura dos dados da planilha;
* busca de pedidos;
* busca de clientes;
* busca dos dados da empresa;
* processamento dos itens;
* geração dos documentos;
* conversão dos HTMLs para PDF;
* armazenamento dos arquivos no Google Drive;

### `logo.gs`

Contém a lógica de gerenciamento da logo da instalação:

* recebimento da logo enviada pela interface;
* validação do tamanho e formato da imagem;
* armazenamento da logo no Google Drive;
* substituição da logo anteriormente configurada;
* armazenamento do ID da logo nas propriedades do projeto;
* recuperação da logo para utilização nos documentos;
* geração da prévia da logo na interface;
* utilização de uma imagem transparente padrão quando nenhuma logo estiver configurada;

### `index.html`

Interface web utilizada para:

* informar o número do pedido;
* gerar os documentos;
* configurar o logo da instalação;
* visualizar o logo configurado.

### `pedido.html`

Template HTML utilizado para gerar o **Pedido de Compra**.

### `ordem_producao.html`

Template HTML utilizado para gerar a **Ordem de Produção**.

# Estrutura da planilha

A aplicação espera uma planilha contendo três abas:

```text
pedidos
clientes
dados
```

Os nomes das abas são utilizados diretamente pelo código e, portanto, **não devem ser alterados** sem modificar o `Code.gs`.

---

## Aba `pedidos`

A aba `pedidos` deve conter os seguintes cabeçalhos:

| Cabeçalho    | Descrição                       |
| ------------ | ------------------------------- |
| DATA         | Data do pedido                  |
| DATA PRAZO   | Prazo do pedido                 |
| EMPRESA      | Empresa responsável pelo pedido |
| PEDIDO       | Número do pedido                |
| NUM. CLIENTE | Número identificador do cliente |
| CLIENTE      | Nome do cliente                 |
| ITEM         | Número do item                  |
| CÓDIGO       | Código do produto/peça          |
| PEÇA         | Descrição da peça               |
| LARGURA      | Largura em milímetros           |
| ALTURA       | Altura em milímetros            |
| ESP          | Espessura em milímetros         |
| QTDE         | Quantidade                      |
| FACES        | Número/configuração de faces    |
| ACABAMENTO   | Acabamento                      |
| COR          | Cor                             |
| m²           | Área em metros quadrados        |
| FURAÇÃO      | Informações de furação          |
| USINAGEM     | Informações de usinagem         |
| R$ Unit      | Valor unitário                  |
| R$           | Valor total do item             |

O sistema utiliza o número informado pelo usuário para localizar todas as linhas correspondentes ao pedido.

## Aba `clientes`

A aba `clientes` deve conter os dados cadastrais dos clientes.

Os cabeçalhos utilizados pelo sistema são:

| Cabeçalho   | Descrição                |
| ----------- | ------------------------ |
| NUM CLIENTE | Identificador do cliente |
| CLIENTE     | Nome do cliente          |
| ENDEREÇO    | Endereço                 |
| CIDADE      | Cidade                   |
| CEP         | CEP                      |
| BAIRRO      | Bairro                   |
| TELEFONE    | Telefone                 |

O campo `NUM CLIENTE` funciona como chave de busca.

O sistema utiliza o `NUM. CLIENTE` encontrado na aba `pedidos` para localizar os dados correspondentes na aba `clientes`.

O código aceita algumas variações do cabeçalho da chave, como:

```text
NUM CLIENTE
NUM. CLIENTE
NUMERO CLIENTE
NÚMERO CLIENTE
```

## Aba `dados`

A aba `dados` contém os dados cadastrais e bancários das empresas utilizadas nos pedidos.

Os cabeçalhos esperados são:

```text
EMPRESA
RAZÃO SOCIAL
CNPJ
I.E
ENDEREÇO
CEP
BAIRRO
CIDADE
BANCO
AG
C/C
PIX
```

A empresa utilizada no pedido é localizada pelo campo `EMPRESA`.


# Como instalar

## 1. Criar uma cópia da planilha

Crie uma cópia da planilha modelo do projeto no seu próprio Google Drive.

A planilha deve possuir as abas:

```text
pedidos
clientes
dados
```

Não é necessário manter o mesmo nome do arquivo da planilha.

O código utiliza:

```javascript
SpreadsheetApp.getActiveSpreadsheet()
```

Portanto, o nome do arquivo pode ser alterado.


## 2. Abrir o Apps Script

Na planilha:

**Extensões → Apps Script**

Crie ou substitua os arquivos do projeto pelos arquivos deste repositório.

A estrutura deve ficar:

```text
Código.gs
index.html
pedido.html
ordem_producao.html
```

## 3. Autorizar o projeto

Na primeira execução, o Google solicitará autorização para que o script possa acessar recursos como:

* Google Sheets;
* Google Drive;
* geração de arquivos.

Conceda as permissões necessárias para a execução do projeto.


## 4. Publicar como aplicativo web

No Apps Script:

**Implantar → Nova implantação**

Selecione:

```text
Tipo: Aplicativo da Web
```

Configure o acesso conforme a utilização desejada.

Após a implantação, o Apps Script fornecerá uma URL para acessar a aplicação.


# Configuração do logo

O logo não é armazenado diretamente no código.

Cada instalação pode configurar seu próprio logo pela interface do aplicativo.

Na aplicação:

1. Selecione uma imagem PNG ou JPG.
2. Clique em **Enviar logo**.
3. O sistema armazena a imagem no Google Drive.
4. O identificador do arquivo é salvo nas propriedades do projeto.
5. O logo passa a ser utilizado automaticamente nos PDFs.

O sistema aceita imagens de até **2 MB**.

A imagem é redimensionada no navegador antes de ser enviada ao Apps Script, reduzindo o tamanho necessário para processamento.

Isso permite que cada instalação utilize sua própria identidade visual sem modificar o código-fonte.


# Geração dos documentos

Na interface principal:

1. Informe o número do pedido.
2. Clique em **Gerar documentos**.
3. O sistema localiza o pedido na aba `pedidos`.
4. Os dados do cliente são obtidos na aba `clientes`.
5. Os dados da empresa são obtidos na aba `dados`.
6. Os dois documentos são montados a partir dos templates HTML.
7. Os HTMLs são convertidos para PDF.
8. Os arquivos são armazenados no Google Drive.

São gerados dois arquivos:

```text
PEDIDO DE COMPRA [número].pdf
ORDEM DE PRODUÇÃO [número].pdf
```

Os arquivos são armazenados em uma pasta no Drive chamada:

```text
Documentos Gerados
```

Caso a pasta ainda não exista, o sistema cria automaticamente uma.


# Fluxo da aplicação

```text
                    Google Sheets
                         │
          ┌──────────────┼──────────────┐
          │              │              │
       pedidos        clientes        dados
          │              │              │
          └──────────────┼──────────────┘
                         │
                         ▼
                 Código.gs / Apps Script
                         │
                         ▼
                obterDadosPedido()
                         │
                         ▼
               montarDocumentoHtml()
                    /          \
                   /            \
                  ▼              ▼
           pedido.html    ordem_producao.html
                  │              │
                  └──────┬───────┘
                         ▼
                    PDF
                         │
                         ▼
                  Google Drive
                         │
                         ▼
                Documentos Gerados
```

# Validação e tratamento de dados

O sistema possui algumas validações para reduzir erros durante a geração dos documentos.

### Cabeçalhos

Os cabeçalhos das planilhas são normalizados para tolerar diferenças como:

* maiúsculas/minúsculas;
* acentuação;
* pontos;
* hífens;
* espaços duplicados.

### Pedido inexistente

Caso o número informado não seja encontrado:

```text
Pedido X não encontrado.
```

### Cliente inexistente

Caso o número do cliente não seja encontrado na aba `clientes`, a geração é interrompida e uma mensagem de erro é apresentada.

### Empresa inexistente

Caso a empresa informada no pedido não seja encontrada na aba `dados`, a geração também é interrompida.

### Dados numéricos

Valores numéricos podem ser tratados tanto no formato decimal convencional quanto no formato utilizado no padrão brasileiro.

# Personalização

Os documentos são gerados a partir de HTML e CSS.

Isso permite modificar diretamente os templates:

```text
pedido.html
ordem_producao.html
```

É possível alterar:

* layout;
* dimensões;
* fontes;
* espaçamentos;
* cabeçalho;
* rodapé;
* tabelas;
* logotipo;
* informações apresentadas;
* orientação da página.

A lógica de obtenção dos dados permanece no `Código.gs`.


# Importante

### Não renomeie as abas

As abas:

```text
pedidos
clientes
dados
```

são utilizadas diretamente pelo código.

Caso seja necessário utilizar outros nomes, altere as constantes no início do `Código.gs`:

```javascript
const NOME_ABA_PEDIDOS = 'pedidos';
const NOME_ABA_CLIENTES = 'clientes';
const NOME_ABA_DADOS = 'dados';
```

### Não é necessário manter o nome original da planilha

O nome do arquivo Google Sheets pode ser alterado livremente.

### Cada instalação deve utilizar sua própria configuração

O projeto foi estruturado para que terceiros possam criar suas próprias instalações a partir de uma cópia da planilha e do código.

O logo e os arquivos PDF pertencem à instalação correspondente.


# Limitações atuais

* O sistema depende da estrutura definida para as abas da planilha.
* Alterações nos nomes dos campos podem exigir alterações no código ou nos templates.
* A aplicação depende dos serviços Google Sheets, Apps Script e Drive.
* O sistema foi projetado para instalações individuais, não como uma plataforma multiempresa centralizada.
* A conversão para PDF depende do mecanismo de renderização do Google Apps Script.


# Objetivo do projeto

O projeto foi desenvolvido para substituir a montagem manual de documentos de compra e produção por um processo automatizado baseado em dados estruturados.

A proposta é manter a simplicidade de uma planilha como fonte de dados, utilizando o Google Apps Script para transformar essas informações em documentos padronizados e prontos para utilização.
