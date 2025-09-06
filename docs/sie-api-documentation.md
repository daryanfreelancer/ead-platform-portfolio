# Documentação da API SIE

## Visão Geral

Documentação completa da API do Sistema Integrado de Ensino (SIE) para integração com a plataforma EduPlatform EAD.

## Índice

- [Primeiros Passos](#primeiros-passos)
- [FAQ - Perguntas e Respostas](#faq---perguntas-e-respostas)
- [Utilidade Geral](#utilidade-geral)
- [Lista de Países](#lista-de-países)
- [Lista de Estados](#lista-de-estados)
- [Lista de Áreas de Atuação](#lista-de-áreas-de-atuação)
- [Lista de Escolaridades](#lista-de-escolaridades)
- [Lista de Regras de Acesso](#lista-de-regras-de-acesso)
- [Login do Usuário](#login-do-usuário)
- [Dados do Usuário](#dados-do-usuário)
- [Amigos](#amigos)
- [Processo de Compra](#processo-de-compra)
- [Corporativo](#corporativo)
- [Matrícula](#matrícula)
- [Categorias](#categorias)
- [Cursos](#cursos)
- [ENEM](#enem)
- [Eventos](#eventos)
- [eBooks](#ebooks)
- [Biblioteca Virtual](#biblioteca-virtual)
- [Metas e Objetivos](#metas-e-objetivos)
- [Trilhas de conhecimento](#trilhas-de-conhecimento)
- [Profissões](#profissões)
- [Processo de Estudo](#processo-de-estudo)
- [Relatórios](#relatórios)
- [Certificados](#certificados)
- [Reuniões/Aulas](#reuniõesaulas)
- [Fóruns (Perguntas & Respostas)](#fóruns-perguntas--respostas)
- [Anotações](#anotações)
- [Reflexões](#reflexões)
- [Mensagens](#mensagens)
- [Ranking](#ranking)
- [Programa de Incentivo](#programa-de-incentivo)
- [Cupons](#cupons)
- [Atendimento](#atendimento)

---

## Primeiros Passos

### Considerações Importantes

- Para requisições aos endpoints, sempre use o protocolo **HTTPS**
- Todos os resultados são servidos somente em **JSON**
- Para ter acesso a métodos privados, é necessário um **token** (contate nossa equipe de atendimento)
- Nem todos os métodos podem estar disponíveis para seu token (contate nossa equipe de atendimento)

### Especificações Padrão

| Parâmetro | Valor |
|-----------|-------|
| URL Base da API | `https://www.iped.com.br/` |
| Método de Requisição | `POST` |
| Envio dos Parâmetros | `FORM DATA` |
| Tipo de Dados Retornado | `JSON` |
| Objetos Retornados | `STATE 1` (sucesso) ou `0` (erro) |
| ERROR | Em caso de erro (STATE 0), mensagem literal |
| SUCCESS | Em caso de sucesso (STATE 1), mensagem literal |

### Versões da API

| Versão | Descrição |
|--------|----------|
| Versão Padrão | `v1` |
| Nova Versão | `v2` |
| Como alternar | Envie o parâmetro `api_version=2` |

#### Principais mudanças da v2:

**Lista de cursos / Cursos em andamento:**
- Suporte a exibir cursos que possuam questões com menor número de alternativas

**Perguntas / Respostas (durante o curso):**
- Suporte a exibir questão do tipo dissertativa, com resposta em texto livre
- Suporte a exibir imagens nas alternativas
- Suporte a exibir menor número de alternativas (exemplo: somente alternativas A e B)

---

## FAQ - Perguntas e Respostas

| Pergunta | Resposta |
|----------|----------|
| Como faço para cadastrar uma pessoa e já liberar um curso em uma única chamada? | [/api/user/set-registration](#criar-matrícula) |
| Como listar os cursos com foto, título, descrição, etc? | [/api/course/get-courses](#obter-lista-de-cursos) |
| Como mostrar mais detalhes de um único curso? | [/api/course/get-details](#obter-detalhes-de-um-curso) |
| Como listar apenas os cursos em andamento? | [/api/course/get-inprogress](#obter-cursos-em-progresso) |
| Como obter uma URL que abra direto o painel principal (AVA)? | [/api/user/get-logged-url](#obter-url-de-acesso-à-sala-de-aula) |
| Como obter uma URL que abra direto a sala de aula? | [/api/course/get-environment](#obter-ambiente-do-curso) |

---

## Utilidade Geral

### Obter última versão do App

Retorna as últimas versões de cada App para cada plataforma (Android e iOS).

- **Status:** `OPERACIONAL •`
- **Endpoint:** `/api/app/get-versions`

#### Objetos retornados:
- `Version_Android` - Última versão do app Cursos iPED para Android
- `Version_IOS` - Última versão do app Cursos iPED para iOS
- `Version_Android_MeusCursos` - Última versão do app Meus Cursos para Android
- `Version_IOS_MeusCursos` - Última versão do app Meus Cursos para iOS

#### Exemplo de retorno (JSON):

```json
{
  "Version_Android": "3.6.1",
  "Version_IOS": "3.5.0",
  "Version_Android_MeusCursos": "3.7.2",
  "Version_IOS_MeusCursos": "3.6.0"
}
```

---

### Obter informação de CEP

Ao informar um CEP brasileiro, retorna o endereço completo.

- **Status:** `OPERACIONAL •`
- **Endpoint:** `/api/app/get-postalcode`

#### Parâmetros:
- `token` (opcional) - Token de acesso à API
- `postalcode` - CEP brasileiro (formato: "12345-789" ou "12345789")

#### Objetos retornados:
- `ADDRESS` - Objeto para manusear o resultado

#### Exemplo de retorno (JSON):

```json
{
  "ADDRESS": {
    "address_street": "Nome da Rua",
    "address_neighborhood": "Nome do Bairro",
    "address_postalcode": "12345678",
    "address_city": "Nome da Cidade",
    "address_state": {
      "state_id": 26,
      "state_uf": "SP",
      "state_name": "São Paulo"
    }
  }
}
```

---
## Lista de Países

### Versão em Português (JSON):

```json
[
  {
    "id": 1,
    "name": "Afeganistão"
  },
    {
        "id": 2,
        "name": "África do Sul"
    },
    {
        "id": 3,
        "name": "Aland - Finlândia"
    },
    {
        "id": 4,
        "name": "Albânia"
    },
    {
        "id": 5,
        "name": "Alemanha"
    },
    {
        "id": 6,
        "name": "Andorra"
    },
    {
        "id": 7,
        "name": "Angola"
    },
    {
        "id": 8,
        "name": "Anguilla - Reino Unido"
    },
    {
        "id": 9,
        "name": "Antártida"
    },
    {
        "id": 10,
        "name": "Antígua e Barbuda"
    },
    {
        "id": 11,
        "name": "Antilhas Holandesas"
    },
    {
        "id": 12,
        "name": "Arábia Saudita"
    },
    {
        "id": 13,
        "name": "Argélia"
    },
    {
        "id": 14,
        "name": "Argentina"
    },
    {
        "id": 15,
        "name": "Armênia"
    },
    {
        "id": 16,
        "name": "Aruba - Holanda"
    },
    {
        "id": 17,
        "name": "Ascensão - Reino Unido"
    },
    {
        "id": 18,
        "name": "Austrália"
    },
    {
        "id": 19,
        "name": "Áustria"
    },
    {
        "id": 20,
        "name": "Azerbaijão"
    },
    {
        "id": 21,
        "name": "Bahamas"
    },
    {
        "id": 22,
        "name": "Bahrein"
    },
    {
        "id": 23,
        "name": "Bangladesh"
    },
    {
        "id": 24,
        "name": "Barbados"
    },
    {
        "id": 25,
        "name": "Belarus"
    },
    {
        "id": 26,
        "name": "Bélgica"
    },
    {
        "id": 27,
        "name": "Belize"
    },
    {
        "id": 28,
        "name": "Benin"
    },
    {
        "id": 29,
        "name": "Bermudas - Reino Unido"
    },
    {
        "id": 30,
        "name": "Bioko - Guiné Equatorial"
    },
    {
        "id": 31,
        "name": "Bolívia"
    },
    {
        "id": 32,
        "name": "Bósnia-Herzegóvina"
    },
    {
        "id": 33,
        "name": "Botsuana"
    },
    {
        "id": 34,
        "name": "Brasil"
    },
    {
        "id": 35,
        "name": "Brunei"
    },
    {
        "id": 36,
        "name": "Bulgária"
    },
    {
        "id": 37,
        "name": "Burkina Fasso"
    },
    {
        "id": 38,
        "name": "Burundi"
    },
    {
        "id": 39,
        "name": "Butão"
    },
    {
        "id": 40,
        "name": "Cabo Verde"
    },
    {
        "id": 41,
        "name": "Camarões"
    },
    {
        "id": 42,
        "name": "Camboja"
    },
    {
        "id": 43,
        "name": "Canadá"
    },
    {
        "id": 44,
        "name": "Cazaquistão"
    },
    {
        "id": 45,
        "name": "Ceuta - Espanha"
    },
    {
        "id": 46,
        "name": "Chade"
    },
    {
        "id": 47,
        "name": "Chile"
    },
    {
        "id": 48,
        "name": "China"
    },
    {
        "id": 49,
        "name": "Chipre"
    },
    {
        "id": 50,
        "name": "Cidade do Vaticano"
    },
    {
        "id": 51,
        "name": "Cingapura"
    },
    {
        "id": 52,
        "name": "Colômbia"
    },
    {
        "id": 53,
        "name": "Congo"
    },
    {
        "id": 54,
        "name": "Coréia do Norte"
    },
    {
        "id": 55,
        "name": "Coréia do Sul"
    },
    {
        "id": 56,
        "name": "Córsega - França"
    },
    {
        "id": 57,
        "name": "Costa do Marfim"
    },
    {
        "id": 58,
        "name": "Costa Rica"
    },
    {
        "id": 59,
        "name": "Creta - Grécia"
    },
    {
        "id": 60,
        "name": "Croácia"
    },
    {
        "id": 61,
        "name": "Cuba"
    },
    {
        "id": 62,
        "name": "Curaçao - Holanda"
    },
    {
        "id": 63,
        "name": "Dinamarca"
    },
    {
        "id": 64,
        "name": "Djibuti"
    },
    {
        "id": 65,
        "name": "Dominica"
    },
    {
        "id": 66,
        "name": "Egito"
    },
    {
        "id": 67,
        "name": "El Salvador"
    },
    {
        "id": 68,
        "name": "Emirado Árabes Unidos"
    },
    {
        "id": 69,
        "name": "Equador"
    },
    {
        "id": 70,
        "name": "Eritréia"
    },
    {
        "id": 71,
        "name": "Eslováquia"
    },
    {
        "id": 72,
        "name": "Eslovênia"
    },
    {
        "id": 73,
        "name": "Espanha"
    },
    {
        "id": 74,
        "name": "Estados Unidos"
    },
    {
        "id": 75,
        "name": "Estônia"
    },
    {
        "id": 76,
        "name": "Etiópia"
    },
    {
        "id": 77,
        "name": "Fiji"
    },
    {
        "id": 78,
        "name": "Filipinas"
    },
    {
        "id": 79,
        "name": "Finlândia"
    },
    {
        "id": 80,
        "name": "França"
    },
    {
        "id": 81,
        "name": "Gabão"
    },
    {
        "id": 82,
        "name": "Gâmbia"
    },
    {
        "id": 83,
        "name": "Gana"
    },
    {
        "id": 84,
        "name": "Geórgia"
    },
    {
        "id": 85,
        "name": "Gibraltar - Reino Unido"
    },
    {
        "id": 86,
        "name": "Granada"
    },
    {
        "id": 87,
        "name": "Grécia"
    },
    {
        "id": 88,
        "name": "Groenlândia - Dinamarca"
    },
    {
        "id": 89,
        "name": "Guadalupe - França"
    },
    {
        "id": 90,
        "name": "Guam - Estados Unidos"
    },
    {
        "id": 91,
        "name": "Guatemala"
    },
    {
        "id": 92,
        "name": "Guiana"
    },
    {
        "id": 93,
        "name": "Guiana Francesa"
    },
    {
        "id": 94,
        "name": "Guiné"
    },
    {
        "id": 95,
        "name": "Guiné Equatorial"
    },
    {
        "id": 96,
        "name": "Guiné-Bissau"
    },
    {
        "id": 97,
        "name": "Haiti"
    },
    {
        "id": 98,
        "name": "Holanda"
    },
    {
        "id": 99,
        "name": "Honduras"
    },
    {
        "id": 100,
        "name": "Hong Kong"
    },
    {
        "id": 101,
        "name": "Hungria"
    },
    {
        "id": 102,
        "name": "Iêmen"
    },
    {
        "id": 103,
        "name": "IIhas Virgens - Estados Unidos"
    },
    {
        "id": 104,
        "name": "Ilha de Man - Reino Unido"
    },
    {
        "id": 105,
        "name": "Ilha Natal - Austrália"
    },
    {
        "id": 106,
        "name": "Ilha Norfolk - Austrália"
    },
    {
        "id": 107,
        "name": "Ilha Pitcairn - Reino Unido"
    },
    {
        "id": 108,
        "name": "Ilha Wrangel - Rússia"
    },
    {
        "id": 109,
        "name": "Ilhas Aleutas - Estados Unidos"
    },
    {
        "id": 110,
        "name": "Ilhas Canárias - Espanha"
    },
    {
        "id": 111,
        "name": "Ilhas Cayman - Reino Unido"
    },
    {
        "id": 112,
        "name": "Ilhas Comores"
    },
    {
        "id": 113,
        "name": "Ilhas Cook - Nova Zelândia"
    },
    {
        "id": 114,
        "name": "Ilhas do Canal - Reino Unido"
    },
    {
        "id": 115,
        "name": "Ilhas Salomão"
    },
    {
        "id": 116,
        "name": "Ilhas Seychelles"
    },
    {
        "id": 117,
        "name": "Ilhas Tokelau - Nova Zelândia"
    },
    {
        "id": 118,
        "name": "Ilhas Turks e Caicos - Reino Unido"
    },
    {
        "id": 119,
        "name": "Ilhas Virgens - Reino Unido"
    },
    {
        "id": 120,
        "name": "Ilhas Wallis e Futuna - França"
    },
    {
        "id": 121,
        "name": "Ilhsa Cocos - Austrália"
    },
    {
        "id": 122,
        "name": "Índia"
    },
    {
        "id": 123,
        "name": "Indonésia"
    },
    {
        "id": 124,
        "name": "Irã"
    },
    {
        "id": 125,
        "name": "Iraque"
    },
    {
        "id": 126,
        "name": "Irlanda"
    },
    {
        "id": 127,
        "name": "Islândia"
    },
    {
        "id": 128,
        "name": "Israel"
    },
    {
        "id": 129,
        "name": "Itália"
    },
    {
        "id": 130,
        "name": "Iugoslávia"
    },
    {
        "id": 131,
        "name": "Jamaica"
    },
    {
        "id": 132,
        "name": "Jan Mayen - Noruega"
    },
    {
        "id": 133,
        "name": "Japão"
    },
    {
        "id": 134,
        "name": "Jordânia"
    },
    {
        "id": 135,
        "name": "Kiribati"
    },
    {
        "id": 136,
        "name": "Kuait"
    },
    {
        "id": 137,
        "name": "Laos"
    },
    {
        "id": 138,
        "name": "Lesoto"
    },
    {
        "id": 139,
        "name": "Letônia"
    },
    {
        "id": 140,
        "name": "Líbano"
    },
    {
        "id": 141,
        "name": "Libéria"
    },
    {
        "id": 142,
        "name": "Líbia"
    },
    {
        "id": 143,
        "name": "Liechtenstein"
    },
    {
        "id": 144,
        "name": "Lituânia"
    },
    {
        "id": 145,
        "name": "Luxemburgo"
    },
    {
        "id": 146,
        "name": "Macau - Portugal"
    },
    {
        "id": 147,
        "name": "Macedônia"
    },
    {
        "id": 148,
        "name": "Madagascar"
    },
    {
        "id": 149,
        "name": "Madeira - Portugal"
    },
    {
        "id": 150,
        "name": "Malásia"
    },
    {
        "id": 151,
        "name": "Malaui"
    },
    {
        "id": 152,
        "name": "Maldivas"
    },
    {
        "id": 153,
        "name": "Mali"
    },
    {
        "id": 154,
        "name": "Malta"
    },
    {
        "id": 155,
        "name": "Marrocos"
    },
    {
        "id": 156,
        "name": "Martinica - França"
    },
    {
        "id": 157,
        "name": "Maurício - Reino Unido"
    },
    {
        "id": 158,
        "name": "Mauritânia"
    },
    {
        "id": 159,
        "name": "México"
    },
    {
        "id": 160,
        "name": "Micronésia"
    },
    {
        "id": 161,
        "name": "Moçambique"
    },
    {
        "id": 162,
        "name": "Moldova"
    },
    {
        "id": 163,
        "name": "Mônaco"
    },
    {
        "id": 164,
        "name": "Mongólia"
    },
    {
        "id": 165,
        "name": "MontSerrat - Reino Unido"
    },
    {
        "id": 166,
        "name": "Myanma"
    },
    {
        "id": 167,
        "name": "Namíbia"
    },
    {
        "id": 168,
        "name": "Nauru"
    },
    {
        "id": 169,
        "name": "Nepal"
    },
    {
        "id": 170,
        "name": "Nicarágua"
    },
    {
        "id": 171,
        "name": "Níger"
    },
    {
        "id": 172,
        "name": "Nigéria"
    },
    {
        "id": 173,
        "name": "Niue"
    },
    {
        "id": 174,
        "name": "Noruega"
    },
    {
        "id": 175,
        "name": "Nova Bretanha - Papua-Nova Guiné"
    },
    {
        "id": 176,
        "name": "Nova Caledônia - França"
    },
    {
        "id": 177,
        "name": "Nova Zelândia"
    },
    {
        "id": 178,
        "name": "Omã"
    },
    {
        "id": 179,
        "name": "Palau - Estados Unidos"
    },
    {
        "id": 180,
        "name": "Palestina"
    },
    {
        "id": 181,
        "name": "Panamá"
    },
    {
        "id": 182,
        "name": "Papua-Nova Guiné"
    },
    {
        "id": 183,
        "name": "Paquistão"
    },
    {
        "id": 184,
        "name": "Paraguai"
    },
    {
        "id": 185,
        "name": "Peru"
    },
    {
        "id": 186,
        "name": "Polinésia Francesa"
    },
    {
        "id": 187,
        "name": "Polônia"
    },
    {
        "id": 188,
        "name": "Porto Rico"
    },
    {
        "id": 189,
        "name": "Portugal"
    },
    {
        "id": 190,
        "name": "Qatar"
    },
    {
        "id": 191,
        "name": "Quênia"
    },
    {
        "id": 192,
        "name": "Quirguistão"
    },
    {
        "id": 193,
        "name": "Reino Unido"
    },
    {
        "id": 194,
        "name": "República Centro-Africana"
    },
    {
        "id": 195,
        "name": "República Dominicana"
    },
    {
        "id": 196,
        "name": "República Tcheca"
    },
    {
        "id": 197,
        "name": "Romênia"
    },
    {
        "id": 198,
        "name": "Ruanda"
    },
    {
        "id": 199,
        "name": "Rússia"
    },
    {
        "id": 200,
        "name": "Samoa Ocidental"
    },
    {
        "id": 201,
        "name": "San Marino"
    },
    {
        "id": 202,
        "name": "Santa Helena - Reino Unido"
    },
    {
        "id": 203,
        "name": "Santa Lúcia"
    },
    {
        "id": 204,
        "name": "São Cristovão e Névis"
    },
    {
        "id": 205,
        "name": "São Tomé e Príncipe"
    },
    {
        "id": 206,
        "name": "São Vicente e Granadinas"
    },
    {
        "id": 207,
        "name": "Sardenha - Itália"
    },
    {
        "id": 208,
        "name": "Senegal"
    },
    {
        "id": 209,
        "name": "Serra Leoa"
    },
    {
        "id": 210,
        "name": "Síria"
    },
    {
        "id": 211,
        "name": "Somália"
    },
    {
        "id": 212,
        "name": "Sri Lanka"
    },
    {
        "id": 213,
        "name": "Suazilândia"
    },
    {
        "id": 214,
        "name": "Sudão"
    },
    {
        "id": 216,
        "name": "Suécia"
    },
    {
        "id": 215,
        "name": "Suíça"
    },
    {
        "id": 217,
        "name": "Suriname"
    },
    {
        "id": 218,
        "name": "Tadjiquistão"
    },
    {
        "id": 219,
        "name": "Tailândia"
    },
    {
        "id": 220,
        "name": "Taiti"
    },
    {
        "id": 221,
        "name": "Taiwan"
    },
    {
        "id": 222,
        "name": "Tanzânia"
    },
    {
        "id": 223,
        "name": "Terra de Francisco José - Rússia"
    },
    {
        "id": 224,
        "name": "Togo"
    },
    {
        "id": 225,
        "name": "Tonga"
    },
    {
        "id": 226,
        "name": "Trinidad e Tobago"
    },
    {
        "id": 227,
        "name": "Tristão da Cunha - Reino Unido"
    },
    {
        "id": 228,
        "name": "Tunísia"
    },
    {
        "id": 229,
        "name": "Turcomenistão"
    },
    {
        "id": 230,
        "name": "Turquia"
    },
    {
        "id": 231,
        "name": "Tuvalu"
    },
    {
        "id": 232,
        "name": "Ucrânia"
    },
    {
        "id": 233,
        "name": "Uganda"
    },
    {
        "id": 234,
        "name": "Uruguai"
    },
    {
        "id": 235,
        "name": "Uzbequistão"
    },
    {
        "id": 236,
        "name": "Vanuatu"
    },
    {
        "id": 237,
        "name": "Venezuela"
    },
    {
        "id": 238,
        "name": "Vietnã"
    },
    {
        "id": 239,
        "name": "Zaire"
    },
    {
        "id": 240,
        "name": "Zâmbia"
    },
  {
    "id": 241,
    "name": "Zimbábue"
  }
]
```

### Versão em Inglês (JSON):

```json

[
    {
        "id": 1,
        "label": "Afghanistan"
    },
    {
        "id": 3,
        "label": "Aland - Finland"
    },
    {
        "id": 4,
        "label": "Albania"
    },
    {
        "id": 6,
        "label": "Andorra"
    },
    {
        "id": 7,
        "label": "Angola"
    },
    {
        "id": 8,
        "label": "Anguilla - United Kingdom"
    },
    {
        "id": 9,
        "label": "Antarctica"
    },
    {
        "id": 10,
        "label": "Antigua and Barbuda"
    },
    {
        "id": 11,
        "label": "Netherlands Antilles"
    },
    {
        "id": 13,
        "label": "Algeria"
    },
    {
        "id": 14,
        "label": "Argentina"
    },
    {
        "id": 15,
        "label": "Armenia"
    },
    {
        "id": 16,
        "label": "Aruba - Netherlands"
    },
    {
        "id": 17,
        "label": "Ascension - United Kingdom"
    },
    {
        "id": 18,
        "label": "Australia"
    },
    {
        "id": 19,
        "label": "Austria"
    },
    {
        "id": 109,
        "label": "Aleutian Islands - United States"
    },
    {
        "id": 20,
        "label": "Azerbaijan"
    },
    {
        "id": 21,
        "label": "Bahamas"
    },
    {
        "id": 22,
        "label": "Bahrain"
    },
    {
        "id": 23,
        "label": "Bangladesh"
    },
    {
        "id": 24,
        "label": "Barbados"
    },
    {
        "id": 25,
        "label": "Belarus"
    },
    {
        "id": 26,
        "label": "Belgium"
    },
    {
        "id": 27,
        "label": "Belize"
    },
    {
        "id": 28,
        "label": "Benin"
    },
    {
        "id": 29,
        "label": "Bermuda - United Kingdom"
    },
    {
        "id": 30,
        "label": "Bioko - Equatorial Guinea"
    },
    {
        "id": 31,
        "label": "Bolivia"
    },
    {
        "id": 32,
        "label": "Bosnia-Herzegovina"
    },
    {
        "id": 33,
        "label": "Botswana"
    },
    {
        "id": 34,
        "label": "Brazil"
    },
    {
        "id": 35,
        "label": "Brunei"
    },
    {
        "id": 36,
        "label": "Bulgaria"
    },
    {
        "id": 37,
        "label": "Burkina Faso"
    },
    {
        "id": 38,
        "label": "Burundi"
    },
    {
        "id": 39,
        "label": "Bhutan"
    },
    {
        "id": 40,
        "label": "Cape Verde"
    },
    {
        "id": 41,
        "label": "Cameroon"
    },
    {
        "id": 42,
        "label": "Cambodia"
    },
    {
        "id": 43,
        "label": "Canada"
    },
    {
        "id": 45,
        "label": "Ceuta - Spain"
    },
    {
        "id": 46,
        "label": "Chad"
    },
    {
        "id": 47,
        "label": "Chile"
    },
    {
        "id": 48,
        "label": "China"
    },
    {
        "id": 110,
        "label": "Canary Islands - Spain"
    },
    {
        "id": 111,
        "label": "Cayman Islands - United Kingdom"
    },
    {
        "id": 112,
        "label": "Comoros"
    },
    {
        "id": 113,
        "label": "Cook Islands - New Zealand"
    },
    {
        "id": 114,
        "label": "Channel Islands - United Kingdom"
    },
    {
        "id": 121,
        "label": "Cocos Ilhsa - Australia"
    },
    {
        "id": 49,
        "label": "Cyprus"
    },
    {
        "id": 52,
        "label": "Colombia"
    },
    {
        "id": 53,
        "label": "Congo"
    },
    {
        "id": 56,
        "label": "Corsica - France"
    },
    {
        "id": 58,
        "label": "Costa Rica"
    },
    {
        "id": 59,
        "label": "Crete - Greece"
    },
    {
        "id": 60,
        "label": "Croatia"
    },
    {
        "id": 61,
        "label": "Cuba"
    },
    {
        "id": 62,
        "label": "Curaçao - Netherlands"
    },
    {
        "id": 105,
        "label": "Christmas Island - Australia"
    },
    {
        "id": 63,
        "label": "Denmark"
    },
    {
        "id": 64,
        "label": "Djibouti"
    },
    {
        "id": 65,
        "label": "Dominica"
    },
    {
        "id": 66,
        "label": "Egypt"
    },
    {
        "id": 67,
        "label": "El Salvador"
    },
    {
        "id": 69,
        "label": "Ecuador"
    },
    {
        "id": 70,
        "label": "Eritrea"
    },
    {
        "id": 71,
        "label": "Slovakia"
    },
    {
        "id": 72,
        "label": "Slovenia"
    },
    {
        "id": 73,
        "label": "Spain"
    },
    {
        "id": 74,
        "label": "United States"
    },
    {
        "id": 75,
        "label": "Estonia"
    },
    {
        "id": 76,
        "label": "Ethiopia"
    },
    {
        "id": 77,
        "label": "Fiji"
    },
    {
        "id": 78,
        "label": "Philippines"
    },
    {
        "id": 79,
        "label": "Finland"
    },
    {
        "id": 80,
        "label": "France"
    },
    {
        "id": 81,
        "label": "Gabon"
    },
    {
        "id": 82,
        "label": "Gambia"
    },
    {
        "id": 5,
        "label": "Germany"
    },
    {
        "id": 83,
        "label": "Ghana"
    },
    {
        "id": 84,
        "label": "Georgia"
    },
    {
        "id": 85,
        "label": "Gibraltar - United Kingdom"
    },
    {
        "id": 86,
        "label": "Grenada"
    },
    {
        "id": 87,
        "label": "Greece"
    },
    {
        "id": 88,
        "label": "Greenland - Denmark"
    },
    {
        "id": 89,
        "label": "Guadeloupe - France"
    },
    {
        "id": 90,
        "label": "Guam - United States of America"
    },
    {
        "id": 91,
        "label": "Guatemala"
    },
    {
        "id": 92,
        "label": "Guyana"
    },
    {
        "id": 93,
        "label": "French Guiana"
    },
    {
        "id": 94,
        "label": "Guinea"
    },
    {
        "id": 95,
        "label": "Equatorial Guinea"
    },
    {
        "id": 96,
        "label": "Guinea-Bissau"
    },
    {
        "id": 97,
        "label": "Haiti"
    },
    {
        "id": 99,
        "label": "Honduras"
    },
    {
        "id": 100,
        "label": "Hong Kong"
    },
    {
        "id": 101,
        "label": "Hungary"
    },
    {
        "id": 98,
        "label": "Netherlands"
    },
    {
        "id": 102,
        "label": "Yemen"
    },
    {
        "id": 103,
        "label": "Virgin IIhas - United States"
    },
    {
        "id": 104,
        "label": "Isle of Man - United Kingdom"
    },
    {
        "id": 106,
        "label": "Norfolk Island - Australia"
    },
    {
        "id": 108,
        "label": "Wrangel Island - Russia"
    },
    {
        "id": 122,
        "label": "India"
    },
    {
        "id": 123,
        "label": "Indonesia"
    },
    {
        "id": 124,
        "label": "Iran"
    },
    {
        "id": 125,
        "label": "Iraq"
    },
    {
        "id": 126,
        "label": "Ireland"
    },
    {
        "id": 127,
        "label": "Iceland"
    },
    {
        "id": 128,
        "label": "Israel"
    },
    {
        "id": 129,
        "label": "Italy"
    },
    {
        "id": 57,
        "label": "Ivory Coast"
    },
    {
        "id": 131,
        "label": "Jamaica"
    },
    {
        "id": 132,
        "label": "Jan Mayen - Norway"
    },
    {
        "id": 133,
        "label": "Japan"
    },
    {
        "id": 134,
        "label": "Jordan"
    },
    {
        "id": 44,
        "label": "Kazakhstan"
    },
    {
        "id": 135,
        "label": "Kiribati"
    },
    {
        "id": 136,
        "label": "Kuwait"
    },
    {
        "id": 191,
        "label": "Kenya"
    },
    {
        "id": 192,
        "label": "Kyrgyzstan"
    },
    {
        "id": 137,
        "label": "Laos"
    },
    {
        "id": 138,
        "label": "Lesotho"
    },
    {
        "id": 139,
        "label": "Latvia"
    },
    {
        "id": 140,
        "label": "Lebanon"
    },
    {
        "id": 141,
        "label": "Liberia"
    },
    {
        "id": 142,
        "label": "Libya"
    },
    {
        "id": 143,
        "label": "Liechtenstein"
    },
    {
        "id": 144,
        "label": "Lithuania"
    },
    {
        "id": 145,
        "label": "Luxembourg"
    },
    {
        "id": 146,
        "label": "Macau - Portugal"
    },
    {
        "id": 147,
        "label": "Macedonia"
    },
    {
        "id": 148,
        "label": "Madagascar"
    },
    {
        "id": 149,
        "label": "Madeira - Portugal"
    },
    {
        "id": 150,
        "label": "Malaysia"
    },
    {
        "id": 151,
        "label": "Malawi"
    },
    {
        "id": 152,
        "label": "Maldives"
    },
    {
        "id": 153,
        "label": "Mali"
    },
    {
        "id": 154,
        "label": "Malta"
    },
    {
        "id": 155,
        "label": "Morocco"
    },
    {
        "id": 156,
        "label": "Martinique - France"
    },
    {
        "id": 157,
        "label": "Mauritius - United Kingdom"
    },
    {
        "id": 158,
        "label": "Mauritania"
    },
    {
        "id": 159,
        "label": "Mexico"
    },
    {
        "id": 160,
        "label": "Micronesia"
    },
    {
        "id": 161,
        "label": "Mozambique"
    },
    {
        "id": 162,
        "label": "Moldova"
    },
    {
        "id": 163,
        "label": "Monaco"
    },
    {
        "id": 164,
        "label": "Mongolia"
    },
    {
        "id": 165,
        "label": "Montserrat - United Kingdom"
    },
    {
        "id": 166,
        "label": "Myanmar"
    },
    {
        "id": 167,
        "label": "Namibia"
    },
    {
        "id": 168,
        "label": "Nauru"
    },
    {
        "id": 169,
        "label": "Nepal"
    },
    {
        "id": 170,
        "label": "Nicaragua"
    },
    {
        "id": 171,
        "label": "Niger"
    },
    {
        "id": 172,
        "label": "Nigeria"
    },
    {
        "id": 173,
        "label": "Niue"
    },
    {
        "id": 174,
        "label": "Norway"
    },
    {
        "id": 54,
        "label": "North Korea"
    },
    {
        "id": 175,
        "label": "New Britain - Papua New Guinea"
    },
    {
        "id": 176,
        "label": "New Caledonia - France"
    },
    {
        "id": 177,
        "label": "New Zealand"
    },
    {
        "id": 178,
        "label": "Oman"
    },
    {
        "id": 179,
        "label": "Palau - United States"
    },
    {
        "id": 180,
        "label": "Palestine"
    },
    {
        "id": 181,
        "label": "Panama"
    },
    {
        "id": 182,
        "label": "Papua New Guinea"
    },
    {
        "id": 183,
        "label": "Pakistan"
    },
    {
        "id": 184,
        "label": "Paraguay"
    },
    {
        "id": 107,
        "label": "Pitcairn Island - United Kingdom"
    },
    {
        "id": 185,
        "label": "Peru"
    },
    {
        "id": 186,
        "label": "French Polynesia"
    },
    {
        "id": 187,
        "label": "Poland"
    },
    {
        "id": 188,
        "label": "Puerto Rico"
    },
    {
        "id": 189,
        "label": "Portugal"
    },
    {
        "id": 190,
        "label": "Qatar"
    },
    {
        "id": 193,
        "label": "United Kingdom"
    },
    {
        "id": 194,
        "label": "Central African Republic"
    },
    {
        "id": 195,
        "label": "Dominican Republic"
    },
    {
        "id": 196,
        "label": "Czech Republic"
    },
    {
        "id": 197,
        "label": "Romania"
    },
    {
        "id": 198,
        "label": "Rwanda"
    },
    {
        "id": 199,
        "label": "Russia"
    },
    {
        "id": 200,
        "label": "Samoa"
    },
    {
        "id": 201,
        "label": "San Marino"
    },
    {
        "id": 202,
        "label": "Saint Helena - United Kingdom"
    },
    {
        "id": 203,
        "label": "Santa Lucia"
    },
    {
        "id": 204,
        "label": "Saint Kitts and Nevis"
    },
    {
        "id": 205,
        "label": "Sao Tome and Principe"
    },
    {
        "id": 206,
        "label": "Saint Vincent and the Grenadines"
    },
    {
        "id": 207,
        "label": "Sardinia - Italy"
    },
    {
        "id": 208,
        "label": "Senegal"
    },
    {
        "id": 209,
        "label": "Sierra Leone"
    },
    {
        "id": 51,
        "label": "Singapore"
    },
    {
        "id": 210,
        "label": "Syria"
    },
    {
        "id": 211,
        "label": "Somalia"
    },
    {
        "id": 55,
        "label": "South Korea"
    },
    {
        "id": 115,
        "label": "Solomon Islands"
    },
    {
        "id": 116,
        "label": "Seychelles"
    },
    {
        "id": 212,
        "label": "Sri Lanka"
    },
    {
        "id": 213,
        "label": "Swaziland"
    },
    {
        "id": 214,
        "label": "Sudan"
    },
    {
        "id": 216,
        "label": "Sweden"
    },
    {
        "id": 215,
        "label": "Switzerland"
    },
    {
        "id": 217,
        "label": "Suriname"
    },
    {
        "id": 12,
        "label": "Saudi Arabia"
    },
    {
        "id": 2,
        "label": "South Africa"
    },
    {
        "id": 218,
        "label": "Tajikistan"
    },
    {
        "id": 219,
        "label": "Thailand"
    },
    {
        "id": 220,
        "label": "Tahiti"
    },
    {
        "id": 221,
        "label": "Taiwan"
    },
    {
        "id": 222,
        "label": "Tanzania"
    },
    {
        "id": 223,
        "label": "Franz Josef Land - Russia"
    },
    {
        "id": 224,
        "label": "Togo"
    },
    {
        "id": 225,
        "label": "Tonga"
    },
    {
        "id": 226,
        "label": "Trinidad and Tobago"
    },
    {
        "id": 227,
        "label": "Tristan da Cunha - United Kingdom"
    },
    {
        "id": 228,
        "label": "Tunisia"
    },
    {
        "id": 229,
        "label": "Turkmenistan"
    },
    {
        "id": 230,
        "label": "Turkey"
    },
    {
        "id": 231,
        "label": "Tuvalu"
    },
    {
        "id": 117,
        "label": "Tokelau - New Zealand"
    },
    {
        "id": 118,
        "label": "Turks and Caicos Islands - United Kingdom"
    },
    {
        "id": 232,
        "label": "Ukraine"
    },
    {
        "id": 233,
        "label": "Uganda"
    },
    {
        "id": 234,
        "label": "Uruguay"
    },
    {
        "id": 68,
        "label": "United Arab Emirates"
    },
    {
        "id": 235,
        "label": "Uzbekistan"
    },
    {
        "id": 50,
        "label": "Vatican City"
    },
    {
        "id": 236,
        "label": "Vanuatu"
    },
    {
        "id": 237,
        "label": "Venezuela"
    },
    {
        "id": 238,
        "label": "Vietnam"
    },
    {
        "id": 119,
        "label": "Virgin Islands - United Kingdom"
    },
    {
        "id": 130,
        "label": "Yugoslavia"
    },
    {
        "id": 120,
        "label": "Wallis and Futuna - France"
    },
    {
        "id": 239,
        "label": "Zaire"
    },
    {
        "id": 240,
        "label": "Zambia"
    },
  {
    "id": 241,
    "label": "Zimbabwe"
  }
]
```

### Versão em Espanhol (JSON):

```json

[
    {
        "id": 1,
        "label": "Afeganistão"
    },
    {
        "id": 2,
        "label": "África do Sul"
    },
    {
        "id": 3,
        "label": "Aland - Finlândia"
    },
    {
        "id": 4,
        "label": "Albânia"
    },
    {
        "id": 5,
        "label": "Alemanha"
    },
    {
        "id": 6,
        "label": "Andorra"
    },
    {
        "id": 7,
        "label": "Angola"
    },
    {
        "id": 8,
        "label": "Anguilla - Reino Unido"
    },
    {
        "id": 9,
        "label": "Antártida"
    },
    {
        "id": 10,
        "label": "Antígua e Barbuda"
    },
    {
        "id": 11,
        "label": "Antilhas Holandesas"
    },
    {
        "id": 12,
        "label": "Arábia Saudita"
    },
    {
        "id": 13,
        "label": "Argélia"
    },
    {
        "id": 14,
        "label": "Argentina"
    },
    {
        "id": 15,
        "label": "Armênia"
    },
    {
        "id": 16,
        "label": "Aruba - Holanda"
    },
    {
        "id": 17,
        "label": "Ascensão - Reino Unido"
    },
    {
        "id": 18,
        "label": "Austrália"
    },
    {
        "id": 19,
        "label": "Áustria"
    },
    {
        "id": 20,
        "label": "Azerbaijão"
    },
    {
        "id": 21,
        "label": "Bahamas"
    },
    {
        "id": 22,
        "label": "Bahrein"
    },
    {
        "id": 23,
        "label": "Bangladesh"
    },
    {
        "id": 24,
        "label": "Barbados"
    },
    {
        "id": 25,
        "label": "Belarus"
    },
    {
        "id": 26,
        "label": "Bélgica"
    },
    {
        "id": 27,
        "label": "Belize"
    },
    {
        "id": 28,
        "label": "Benin"
    },
    {
        "id": 29,
        "label": "Bermudas - Reino Unido"
    },
    {
        "id": 30,
        "label": "Bioko - Guiné Equatorial"
    },
    {
        "id": 31,
        "label": "Bolívia"
    },
    {
        "id": 32,
        "label": "Bósnia-Herzegóvina"
    },
    {
        "id": 33,
        "label": "Botsuana"
    },
    {
        "id": 34,
        "label": "Brasil"
    },
    {
        "id": 35,
        "label": "Brunei"
    },
    {
        "id": 36,
        "label": "Bulgária"
    },
    {
        "id": 37,
        "label": "Burkina Fasso"
    },
    {
        "id": 38,
        "label": "Burundi"
    },
    {
        "id": 39,
        "label": "Butão"
    },
    {
        "id": 40,
        "label": "Cabo Verde"
    },
    {
        "id": 41,
        "label": "Camarões"
    },
    {
        "id": 42,
        "label": "Camboja"
    },
    {
        "id": 43,
        "label": "Canadá"
    },
    {
        "id": 44,
        "label": "Cazaquistão"
    },
    {
        "id": 45,
        "label": "Ceuta - Espanha"
    },
    {
        "id": 46,
        "label": "Chade"
    },
    {
        "id": 47,
        "label": "Chile"
    },
    {
        "id": 48,
        "label": "China"
    },
    {
        "id": 49,
        "label": "Chipre"
    },
    {
        "id": 50,
        "label": "Cidade do Vaticano"
    },
    {
        "id": 51,
        "label": "Cingapura"
    },
    {
        "id": 52,
        "label": "Colômbia"
    },
    {
        "id": 53,
        "label": "Congo"
    },
    {
        "id": 54,
        "label": "Coréia do Norte"
    },
    {
        "id": 55,
        "label": "Coréia do Sul"
    },
    {
        "id": 56,
        "label": "Córsega - França"
    },
    {
        "id": 57,
        "label": "Costa do Marfim"
    },
    {
        "id": 58,
        "label": "Costa Rica"
    },
    {
        "id": 59,
        "label": "Creta - Grécia"
    },
    {
        "id": 60,
        "label": "Croácia"
    },
    {
        "id": 61,
        "label": "Cuba"
    },
    {
        "id": 62,
        "label": "Curaçao - Holanda"
    },
    {
        "id": 63,
        "label": "Dinamarca"
    },
    {
        "id": 64,
        "label": "Djibuti"
    },
    {
        "id": 65,
        "label": "Dominica"
    },
    {
        "id": 66,
        "label": "Egito"
    },
    {
        "id": 67,
        "label": "El Salvador"
    },
    {
        "id": 68,
        "label": "Emirado Árabes Unidos"
    },
    {
        "id": 69,
        "label": "Equador"
    },
    {
        "id": 70,
        "label": "Eritréia"
    },
    {
        "id": 71,
        "label": "Eslováquia"
    },
    {
        "id": 72,
        "label": "Eslovênia"
    },
    {
        "id": 73,
        "label": "Espanha"
    },
    {
        "id": 74,
        "label": "Estados Unidos"
    },
    {
        "id": 75,
        "label": "Estônia"
    },
    {
        "id": 76,
        "label": "Etiópia"
    },
    {
        "id": 77,
        "label": "Fiji"
    },
    {
        "id": 78,
        "label": "Filipinas"
    },
    {
        "id": 79,
        "label": "Finlândia"
    },
    {
        "id": 80,
        "label": "França"
    },
    {
        "id": 81,
        "label": "Gabão"
    },
    {
        "id": 82,
        "label": "Gâmbia"
    },
    {
        "id": 83,
        "label": "Gana"
    },
    {
        "id": 84,
        "label": "Geórgia"
    },
    {
        "id": 85,
        "label": "Gibraltar - Reino Unido"
    },
    {
        "id": 86,
        "label": "Granada"
    },
    {
        "id": 87,
        "label": "Grécia"
    },
    {
        "id": 88,
        "label": "Groenlândia - Dinamarca"
    },
    {
        "id": 89,
        "label": "Guadalupe - França"
    },
    {
        "id": 90,
        "label": "Guam - Estados Unidos"
    },
    {
        "id": 91,
        "label": "Guatemala"
    },
    {
        "id": 92,
        "label": "Guiana"
    },
    {
        "id": 93,
        "label": "Guiana Francesa"
    },
    {
        "id": 94,
        "label": "Guiné"
    },
    {
        "id": 95,
        "label": "Guiné Equatorial"
    },
    {
        "id": 96,
        "label": "Guiné-Bissau"
    },
    {
        "id": 97,
        "label": "Haiti"
    },
    {
        "id": 98,
        "label": "Holanda"
    },
    {
        "id": 99,
        "label": "Honduras"
    },
    {
        "id": 100,
        "label": "Hong Kong"
    },
    {
        "id": 101,
        "label": "Hungria"
    },
    {
        "id": 102,
        "label": "Iêmen"
    },
    {
        "id": 103,
        "label": "IIhas Virgens - Estados Unidos"
    },
    {
        "id": 104,
        "label": "Ilha de Man - Reino Unido"
    },
    {
        "id": 105,
        "label": "Ilha Natal - Austrália"
    },
    {
        "id": 106,
        "label": "Ilha Norfolk - Austrália"
    },
    {
        "id": 107,
        "label": "Ilha Pitcairn - Reino Unido"
    },
    {
        "id": 108,
        "label": "Ilha Wrangel - Rússia"
    },
    {
        "id": 109,
        "label": "Ilhas Aleutas - Estados Unidos"
    },
    {
        "id": 110,
        "label": "Ilhas Canárias - Espanha"
    },
    {
        "id": 111,
        "label": "Ilhas Cayman - Reino Unido"
    },
    {
        "id": 112,
        "label": "Ilhas Comores"
    },
    {
        "id": 113,
        "label": "Ilhas Cook - Nova Zelândia"
    },
    {
        "id": 114,
        "label": "Ilhas do Canal - Reino Unido"
    },
    {
        "id": 115,
        "label": "Ilhas Salomão"
    },
    {
        "id": 116,
        "label": "Ilhas Seychelles"
    },
    {
        "id": 117,
        "label": "Ilhas Tokelau - Nova Zelândia"
    },
    {
        "id": 118,
        "label": "Ilhas Turks e Caicos - Reino Unido"
    },
    {
        "id": 119,
        "label": "Ilhas Virgens - Reino Unido"
    },
    {
        "id": 120,
        "label": "Ilhas Wallis e Futuna - França"
    },
    {
        "id": 121,
        "label": "Ilhsa Cocos - Austrália"
    },
    {
        "id": 122,
        "label": "Índia"
    },
    {
        "id": 123,
        "label": "Indonésia"
    },
    {
        "id": 124,
        "label": "Irã"
    },
    {
        "id": 125,
        "label": "Iraque"
    },
    {
        "id": 126,
        "label": "Irlanda"
    },
    {
        "id": 127,
        "label": "Islândia"
    },
    {
        "id": 128,
        "label": "Israel"
    },
    {
        "id": 129,
        "label": "Itália"
    },
    {
        "id": 130,
        "label": "Iugoslávia"
    },
    {
        "id": 131,
        "label": "Jamaica"
    },
    {
        "id": 132,
        "label": "Jan Mayen - Noruega"
    },
    {
        "id": 133,
        "label": "Japão"
    },
    {
        "id": 134,
        "label": "Jordânia"
    },
    {
        "id": 135,
        "label": "Kiribati"
    },
    {
        "id": 136,
        "label": "Kuait"
    },
    {
        "id": 137,
        "label": "Laos"
    },
    {
        "id": 138,
        "label": "Lesoto"
    },
    {
        "id": 139,
        "label": "Letônia"
    },
    {
        "id": 140,
        "label": "Líbano"
    },
    {
        "id": 141,
        "label": "Libéria"
    },
    {
        "id": 142,
        "label": "Líbia"
    },
    {
        "id": 143,
        "label": "Liechtenstein"
    },
    {
        "id": 144,
        "label": "Lituânia"
    },
    {
        "id": 145,
        "label": "Luxemburgo"
    },
    {
        "id": 146,
        "label": "Macau - Portugal"
    },
    {
        "id": 147,
        "label": "Macedônia"
    },
    {
        "id": 148,
        "label": "Madagascar"
    },
    {
        "id": 149,
        "label": "Madeira - Portugal"
    },
    {
        "id": 150,
        "label": "Malásia"
    },
    {
        "id": 151,
        "label": "Malaui"
    },
    {
        "id": 152,
        "label": "Maldivas"
    },
    {
        "id": 153,
        "label": "Mali"
    },
    {
        "id": 154,
        "label": "Malta"
    },
    {
        "id": 155,
        "label": "Marrocos"
    },
    {
        "id": 156,
        "label": "Martinica - França"
    },
    {
        "id": 157,
        "label": "Maurício - Reino Unido"
    },
    {
        "id": 158,
        "label": "Mauritânia"
    },
    {
        "id": 159,
        "label": "México"
    },
    {
        "id": 160,
        "label": "Micronésia"
    },
    {
        "id": 161,
        "label": "Moçambique"
    },
    {
        "id": 162,
        "label": "Moldova"
    },
    {
        "id": 163,
        "label": "Mônaco"
    },
    {
        "id": 164,
        "label": "Mongólia"
    },
    {
        "id": 165,
        "label": "MontSerrat - Reino Unido"
    },
    {
        "id": 166,
        "label": "Myanma"
    },
    {
        "id": 167,
        "label": "Namíbia"
    },
    {
        "id": 168,
        "label": "Nauru"
    },
    {
        "id": 169,
        "label": "Nepal"
    },
    {
        "id": 170,
        "label": "Nicarágua"
    },
    {
        "id": 171,
        "label": "Níger"
    },
    {
        "id": 172,
        "label": "Nigéria"
    },
    {
        "id": 173,
        "label": "Niue"
    },
    {
        "id": 174,
        "label": "Noruega"
    },
    {
        "id": 175,
        "label": "Nova Bretanha - Papua-Nova Guiné"
    },
    {
        "id": 176,
        "label": "Nova Caledônia - França"
    },
    {
        "id": 177,
        "label": "Nova Zelândia"
    },
    {
        "id": 178,
        "label": "Omã"
    },
    {
        "id": 179,
        "label": "Palau - Estados Unidos"
    },
    {
        "id": 180,
        "label": "Palestina"
    },
    {
        "id": 181,
        "label": "Panamá"
    },
    {
        "id": 182,
        "label": "Papua-Nova Guiné"
    },
    {
        "id": 183,
        "label": "Paquistão"
    },
    {
        "id": 184,
        "label": "Paraguai"
    },
    {
        "id": 185,
        "label": "Peru"
    },
    {
        "id": 186,
        "label": "Polinésia Francesa"
    },
    {
        "id": 187,
        "label": "Polônia"
    },
    {
        "id": 188,
        "label": "Porto Rico"
    },
    {
        "id": 189,
        "label": "Portugal"
    },
    {
        "id": 190,
        "label": "Qatar"
    },
    {
        "id": 191,
        "label": "Quênia"
    },
    {
        "id": 192,
        "label": "Quirguistão"
    },
    {
        "id": 193,
        "label": "Reino Unido"
    },
    {
        "id": 194,
        "label": "República Centro-Africana"
    },
    {
        "id": 195,
        "label": "República Dominicana"
    },
    {
        "id": 196,
        "label": "República Tcheca"
    },
    {
        "id": 197,
        "label": "Romênia"
    },
    {
        "id": 198,
        "label": "Ruanda"
    },
    {
        "id": 199,
        "label": "Rússia"
    },
    {
        "id": 200,
        "label": "Samoa Ocidental"
    },
    {
        "id": 201,
        "label": "San Marino"
    },
    {
        "id": 202,
        "label": "Santa Helena - Reino Unido"
    },
    {
        "id": 203,
        "label": "Santa Lúcia"
    },
    {
        "id": 204,
        "label": "São Cristovão e Névis"
    },
    {
        "id": 205,
        "label": "São Tomé e Príncipe"
    },
    {
        "id": 206,
        "label": "São Vicente e Granadinas"
    },
    {
        "id": 207,
        "label": "Sardenha - Itália"
    },
    {
        "id": 208,
        "label": "Senegal"
    },
    {
        "id": 209,
        "label": "Serra Leoa"
    },
    {
        "id": 210,
        "label": "Síria"
    },
    {
        "id": 211,
        "label": "Somália"
    },
    {
        "id": 212,
        "label": "Sri Lanka"
    },
    {
        "id": 213,
        "label": "Suazilândia"
    },
    {
        "id": 214,
        "label": "Sudão"
    },
    {
        "id": 216,
        "label": "Suécia"
    },
    {
        "id": 215,
        "label": "Suíça"
    },
    {
        "id": 217,
        "label": "Suriname"
    },
    {
        "id": 218,
        "label": "Tadjiquistão"
    },
    {
        "id": 219,
        "label": "Tailândia"
    },
    {
        "id": 220,
        "label": "Taiti"
    },
    {
        "id": 221,
        "label": "Taiwan"
    },
    {
        "id": 222,
        "label": "Tanzânia"
    },
    {
        "id": 223,
        "label": "Terra de Francisco José - Rússia"
    },
    {
        "id": 224,
        "label": "Togo"
    },
    {
        "id": 225,
        "label": "Tonga"
    },
    {
        "id": 226,
        "label": "Trinidad e Tobago"
    },
    {
        "id": 227,
        "label": "Tristão da Cunha - Reino Unido"
    },
    {
        "id": 228,
        "label": "Tunísia"
    },
    {
        "id": 229,
        "label": "Turcomenistão"
    },
    {
        "id": 230,
        "label": "Turquia"
    },
    {
        "id": 231,
        "label": "Tuvalu"
    },
    {
        "id": 232,
        "label": "Ucrânia"
    },
    {
        "id": 233,
        "label": "Uganda"
    },
    {
        "id": 234,
        "label": "Uruguai"
    },
    {
        "id": 235,
        "label": "Uzbequistão"
    },
    {
        "id": 236,
        "label": "Vanuatu"
    },
    {
        "id": 237,
        "label": "Venezuela"
    },
    {
        "id": 238,
        "label": "Vietnã"
    },
    {
        "id": 239,
        "label": "Zaire"
    },
    {
        "id": 240,
        "label": "Zâmbia"
    },
  {
    "id": 241,
    "label": "Zimbábue"
  }
]
```

---

## Lista de Estados

### Versão em Português (JSON):

```json

[
    {
        "id": 1,
        "label": "Acre"
    },
    {
        "id": 2,
        "label": "Alagoas"
    },
    {
        "id": 3,
        "label": "Amazonas"
    },
    {
        "id": 4,
        "label": "Amapá"
    },
    {
        "id": 5,
        "label": "Bahia"
    },
    {
        "id": 6,
        "label": "Ceará"
    },
    {
        "id": 7,
        "label": "Distrito Federal"
    },
    {
        "id": 8,
        "label": "Espírito Santo"
    },
    {
        "id": 9,
        "label": "Goiás"
    },
    {
        "id": 10,
        "label": "Maranhão"
    },
    {
        "id": 11,
        "label": "Minas Gerais"
    },
    {
        "id": 12,
        "label": "Mato Grosso do Sul"
    },
    {
        "id": 13,
        "label": "Mato Grosso"
    },
    {
        "id": 14,
        "label": "Pará"
    },
    {
        "id": 15,
        "label": "Paraíba"
    },
    {
        "id": 16,
        "label": "Pernambuco"
    },
    {
        "id": 17,
        "label": "Piauí"
    },
    {
        "id": 18,
        "label": "Paraná"
    },
    {
        "id": 19,
        "label": "Rio de Janeiro"
    },
    {
        "id": 20,
        "label": "Rio Grande do Norte"
    },
    {
        "id": 21,
        "label": "Rondônia"
    },
    {
        "id": 22,
        "label": "Roraima"
    },
    {
        "id": 23,
        "label": "Rio Grande do Sul"
    },
    {
        "id": 24,
        "label": "Santa Catarina"
    },
    {
        "id": 25,
        "label": "Sergipe"
    },
    {
        "id": 26,
        "label": "São Paulo"
    },
  {
    "id": 27,
    "label": "Tocantins"
  }
]
```

---

## Lista de Áreas de Atuação

### Versão em Português (JSON):

```json

[
	{
		"id": 110,
		"label": "Administrativo"
	},
	{
		"id": 109,
		"label": "Atendimento"
	},
	{
		"id": 106,
		"label": "Compras"
	},
	{
		"id": 117,
		"label": "Engenharia e Segurança do Trabalho"
	},
	{
		"id": 114,
		"label": "Facilities"
	},
	{
		"id": 107,
		"label": "Financeiro"
	},
	{
		"id": 112,
		"label": "Gestão de Pessoas"
	},
	{
		"id": 113,
		"label": "Inovação"
	},
	{
		"id": 115,
		"label": "Jurídico"
	},
	{
		"id": 102,
		"label": "Logística"
	},
	{
		"id": 100,
		"label": "Marketing"
	},
	{
		"id": 101,
		"label": "Negócios"
	},
	{
		"id": 111,
		"label": "Produção"
	},
	{
		"id": 116,
		"label": "Qualidade"
	},
	{
		"id": 103,
		"label": "R.H."
	},
	{
		"id": 108,
		"label": "T.I."
	},
	{
		"id": 104,
		"label": "Treinamento"
	},
	{
		"id": 105,
		"label": "Vendas"
	}
]
```

---

## Lista de Escolaridades

### Versão em Português (JSON):

```json

[
	{
		"id": 1, 
		"label": "Fundamental incompleto"
	},
	{
		"id": 2, 
		"label": "Ensino Fundamental"
	},
	{
		"id": 3, 
		"label": "Médio incompleto"
	},
	{
		"id": 4, 
		"label": "Ensino Médio"
	},
	{
		"id": 5, 
		"label": "Técnico incompleto"
	},
	{
		"id": 6, 
		"label": "Ensino Técnico"
	},
	{
		"id": 7, 
		"label": "Superior incompleto"
	},
	{
		"id": 8, 
		"label": "Ensino Superior"
	},
	{
		"id": 9, 
		"label": "Pós Graduado"
	},
	{
		"id": 10, 
		"label": "PhD"
	}
]
```

---

## Lista de Regras de Acesso

### Versão em Português (JSON):

```json

[
	{
		"id": 1,
		"label": "permitir acesso todos os dias, qualquer horário (opção padrão)"
	},
	{
		"id": 2,
		"label": "permitir acesso apenas durante a semana, num horário específico"
	},
	{
		"id": 3,
		"label": "permitir acesso apenas durante o final de semana, num horário específico"
	},
	{
		"id": 4,
		"label": "permitir acesso todos os dias, num horário específico"
	}
]
```

---

## Login do Usuário

### Login

Quando informado credenciais corretas, retorna a URL de acesso à sala de aula (AVA).

- **Status:** `OPERACIONAL •`
- **Endpoint:** `/api/user/login`

#### Parâmetros:
- `token` (opcional) - Token de acesso à API
- `user_email` - E-mail do Usuário ou CPF
- `user_password` - Senha do Usuário
- `platform` (opcional) - "1" para Android ou "2" para iOS (para uso apenas no App)
- `user_registerid` (opcional) - ID de registro para GCM/APNS (para uso apenas no App)
- `device_token` (opcional) - Token do dispositivo para GCM/APNS (para uso apenas no App)

#### Objetos retornados:
- `USER_ID` - ID do Usuário
- `USER_TOKEN` - Token Privado do Usuário (usado para métodos de remoção, por exemplo)
- `URL` - URL para acesso à sala de aula (em caso de utilização em Web Apps)

#### Exemplo de retorno (JSON):

```json	
{
	...
	"USER_ID": 1,
	"USER_TOKEN": "82e47251b78187e0acbacf185ec",
	"USER_TYPE": 3,
	"USER_COMPANY": {
		"company_id": 1,
		"company_name": "Nome da Empresa",
		"company_url": "https://www.sie.com.br/url-da-empresa",
		"company_logo": "https://...url-da-imagem",
		"company_header_color": "#ffffff",
		"company_categories_id": "",
		"company_resources": [
			"aulas",	
			"cursos",
			"metas",
			"biblioteca",
			...
		]
	},

    // Informações da IA para exibição no site.
    "IA_INFO": {
        "name": "Lina",
        "image": "https://www.iped.com.br/_img/ia/1/imagem.jpg",
        
        //link e text são propriedades para compra da IA, só aparecem caso o usuário não tenha IA habilitada.
        "link": "https://www.iped.com.br/comprar/0?tipo=3&comprar_ia=1&mensal=1&user_id=396946&user_token=07f97e68e9bfa9d4a2b3333c745a0bc09573f5f6",
        "text": "Adquirir por R$ 29,90"
    }
}
```

#### Notas:

1. **USER_TYPE:** 
   - 1 = curso grátis
   - 2 = curso plus
   - 3 = curso premium
   - 4 = plano ilimitado

2. **USER_COMPANY:** Este objeto será retornado caso seja um aluno relacionado com uma empresa, do contrário retornará lista vazia `[]`

3. **IA_INFO:** Informações da IA para exibição no site. Os campos `link` e `text` só aparecem caso o usuário não tenha IA habilitada.

---

### Recuperar senha

Quando informado o e-mail ou CPF de cadastro, é enviado um e-mail de recuperação de senha para o usuário.

- **Status:** `OPERACIONAL •`
- **Endpoint:** `/api/user/recovery`

#### Parâmetros:
- `user_email` - E-mail do Usuário ou CPF

#### Objetos retornados:
- `SUCCESS` - Em caso de sucesso, mensagem literal

#### Exemplo de retorno (JSON):

```json
{
  "SUCCESS": "Enviamos as instruções para o seu e-mail: us...r@gmail.com."
}
```

---

### Cadastro

Efetua o cadastro de um novo usuário. Retorna a URL de acesso à sala de aula.

- **Status:** `OPERACIONAL •`
- **Endpoint:** `/api/user/signup`

#### Parâmetros:
- `token` (opcional) - Token de acesso à API
- `user_name` - Nome Completo do Usuário (incluindo sobrenome)
- `user_email` - E-mail do Usuário
- `user_cpf` - CPF do Usuário (brasileiros) ou Documento de Identificação (estrangeiros)
- `user_password` - Senha do Usuário
- `user_country` - País do Usuário - valor inteiro (veja a lista) - padrão = 34 (Brasil)
- `user_info` (opcional) - Informação Extra do Usuário (número de registro interno, exibido nos relatórios)
- `user_occupation` (opcional) - Área de Atuação do Usuário (veja a lista)
- `platform` (opcional) - "1" para Android ou "2" para iOS (uso no App)
- `user_registerid` (opcional) - ID de registro para GCM/APNS (uso no App)
- `device_token` (opcional) - Token do dispositivo para GCM/APNS (uso no App)

#### Objetos retornados:
- `USER_ID` - ID do Usuário
- `USER_TOKEN` - Token Privado do Usuário (usado para métodos de remoção)
- `URL` - URL para acesso à sala de aula (Web Apps)
Exemplo de retorno (JSON):	
{
	...
	"USER_ID": 1,
	"USER_TOKEN": "82e47251b78187e0acbacf185ec",
	"USER_TYPE": 3,
	"USER_COMPANY": {
		"company_id": 1,
		"company_name": "Nome da Empresa",
		"company_url": "https://www.sie.com.br/url-da-empresa",
		"company_logo": "https://...url-da-imagem",
		"company_header_color": "#ffffff",
		"company_categories_id": "",
		"company_resources": [
			"aulas",	
			"cursos",
			"metas",
			"biblioteca",
			...
		]
	}
}
```

#### Notas:

1. **USER_TYPE:** 
   - 1 = curso grátis
   - 2 = curso plus
   - 3 = curso premium
   - 4 = plano ilimitado

2. **USER_COMPANY:** Este objeto será retornado caso seja um aluno relacionado com uma empresa, do contrário retornará lista vazia `[]`

---

## Dados do Usuário
### Obter perfil do usuário

Retorna dados principais do perfil de um usuário cadastrado (nome, email, foto de perfil, etc.).

- **Status:** `OPERACIONAL •`
- **Endpoint:** `/api/user/get-profile`

#### Parâmetros:
- `token` - Token de acesso à API
- `user_id` - ID do Usuário
- `user_token` - Token Privado do Usuário (logado)

#### Objetos retornados:
- `PROFILE` - Em caso de sucesso, objeto para manusear os dados
Exemplo de retorno (JSON):	
{
	"PROFILE": {
		"user_id": 1,
		"user_type": 2,
		"user_name": "Jonas Sampaio",
		"user_first_name": "Jonas",
		"user_email": "john@sie.com.br",
		"user_image": "https://../url-da-imagem",
		"user_image_small": "https://../url-da-imagem",
		"user_cpf": "123.456.789-01",
		"user_address": {
			"address_street": "Nome da Rua",
			"address_neighborhood": "Nome do Bairro",
			"address_postalcode": "12345678",
			"address_city": "Nome da Cidade",
			"address_state": {
				"state_id": 26,
				"state_uf": "SP",
				"state_name": "São Paulo"
			}
		},
		"user_ranking": {
			"user_points": {
				"total": 10000,
				"month": 2000
			},
			"user_level": {
				"level_name": "Gran Mestre",
				"level_image": "https://../url-da-imagem"
			}
		},
		"user_dashboard": {
			"dashboard_grade": "7.80",
			"dashboard_score": 60,
			"dashboard_colaborations": 70,
			"dashboard_reflections": 10,
			"dashboard_orientations": 6,
			"dashboard_rating_total": 15,
			"dashboard_rating_average": 4.50,
			"dashboard_courses_inprogress": 2,
			"dashboard_courses_completed": 3,
			"dashboard_courses_total": 5,
			"dashboard_badges": [
				{
					"badge_id": 4,
					"badge_quantity": 1,
					"badge_date": "2020-09-23 13:45:46",
					"badge_title": "Aluno comprometido",
					"badge_image": "https://...url-da-imagem"
				},
				...
			],
			"dashboard_profile": {
				"main_area": {
					"area_id": 2,
					"area_name": "Administração",
					"total_started_courses": 40
				},
				"secondary_area": {
					"area_id": 25,
					"area_name": "Cotidiano",
					"total_started_courses": 20
				},
				"completed_courses_by_area": [
					{
						"area_id": 1,
						"area_name": "3D e Games",
						"total_completed_courses": 3
					},
					...
				],
				"last_course_completed": {
					"course_id": 1,
					"course_title": "Título do Curso",
					"course_completed_date": "2020-06-18 08:14:26",
					"course_completed_time": {
						"time_in_seconds": 7200
					}
				},
				"average_time_to_complete_course": {
					"time_in_seconds": 1075474
				},
				"average_time_to_start_new_course": {
					"time_in_seconds": 777746
				},
				"last_trail_completed": {
					"trail_id": 1,
					"trail_title": "Título da Trilha"
				}
			}
		}
	}
}
Nota:
USER_TYPE: 1 = curso grátis; 2 = curso plus; 3 = curso premium; 4 = plano ilimitado

Atualizar perfil do usuário
Efetua atualização nos dados cadastrais de um usuário (foto de perfil, endereço, etc.).

Status:	OPERACIONAL •
Endpoint:	/api/user/set-profile
Parâmetros:	token Token de acesso a API
user_id ID do Usuário
user_token Token Privado do Usuário (logado)
user_name opcional - Nome do Usuário (necessário sobrenome)
user_email opcional - E-mail do Usuário
user_cpf opcional - CPF do Usuário (para brasileiros) ou Documento de Identificação (para estrangeiros)
user_photo opcional - Foto do Usuário (imagem/jpeg codificada com base64)
user_address opcional - Endereço Completo (incluindo número)
user_neighborhood opcional - Bairro
user_city opcional - Cidade
user_state opcional - ID do Estado (veja a lista)
user_postalcode opcional - CEP
user_cellphone opcional - Celular (informar no formato (99)99999-9999)
user_genre opcional - Sexo (use "1" para masculino, "0" para feminino e "2" para outros)
user_theme opcional - Tema do Ambiente da Sala de Aula (use "1" para claro/light, "2" para escuro/dark)
user_birthday opcional - Data de Nascimento (informar no formato YYYY-MM-DD)
user_education opcional - Escolaridade (ver valores em Lista de Escolaridades)
user_occupation_area opcional - Área de atuação (ver valores em Lista de Categorias de Cursos)
user_profession opcional - Profissão (ver valores em Lista de Profissões)
user_professional_position opcional - Cargo do usuário
Objetos retornados:	SUCCESS em caso de sucesso, isto será uma mensagem literal
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Perfil atualizado com sucesso!"
}
Atualizar perfis de múltiplos usuários
Efetua atualização nos dados cadastrais de múltiplos usuários (foto de perfil, endereço, etc.).

Status:	OPERACIONAL •
Endpoint:	/api/user/set-profiles
Parâmetros:	token Token de acesso a API
users JSON contendo a lista de usuários e atributos (disponível todos os campos do set-profile, veja exemplo abaixo). Limite máximo de 30 usuários.
Exemplo de JSON:	
[
	{
		
		"user_id": "12345", 
		"user_token": "tokenPrivado123", 
		"user_name": "João Silva", 
		"user_email": "joao.silva@email.com", 
		"user_cpf": "123.456.789-00", 
		"user_address": "Rua das Flores, 123", 
		"user_neighborhood": "Centro", 
		"user_city": "São Paulo", 
		"user_state": "SP", 
		"user_postalcode": "01001-000", 
		"user_cellphone": "(11)91234-5678", 
	},
	{
		"user_id": "67890", 
		"user_token": "tokenPrivado456", 
		"user_name": "Maria Oliveira", 
		"user_education": "Pós-graduação", 
		"user_occupation_area": "Marketing e Comunicação", 
		"user_profession": "Especialista em Marketing Digital", 
		"user_professional_position": "Gerente de Projetos"
	},
	{
		"user_id": "11223", 
		"user_token": "tokenPrivado789", 
		"user_professional_position": "Supervisor de Operações"
	}
]
Objetos retornados:	STATE 1 Todos os dados foram atualizados com sucesso
STATE 0 Todos ou alguns usuários não foram atualizados (Acompanha mensagem de erro)
errors Em caso de erro, mostrará todos os usuários que não foram atualizados (Key será o id do usuário)
users Em caso de sucesso, mostrará todos os usuários que foram atualizados (Key será o id do usuário)
Exemplo de retorno (JSON):	
{
	"STATE": 0,
	"errors": {
		"123456": "Parâmetro user_token inválido."
	},
	"users": {
		"321654": "Perfil editado com sucesso."
	}
}
Obter preferências do usuário
Retorna dados das preferências salvas do usuário logado.

Status:	OPERACIONAL •
Endpoint:	/api/user/get-preference
Parâmetros:	token Token de acesso a API
user_id ID do Usuário
user_token Token Privado do Usuário (logado)
Objetos retornados:	PREFERENCE em caso de sucesso, utilize este objeto para manusear os dados
Exemplo de retorno (JSON):	
{
	"PREFERENCE": {
		"user_id": 123456,
		"user_language": "pt",
		"user_course_assistant": true,
		"user_course_accessibility": false,
		"user_notification_sound": true,
		"user_email_course_expires": true,
		"user_email_course_releases": true,
		"user_email_friendship": true,
		"user_email_message": false,
		"user_email_suggestion": false,
		"user_email_talk": false,
		"user_email_news": true,
		"user_message_forum_reply": true,
		"user_message_reflection_reply": true,
		"user_message_course_completed": true,
		"user_message_course_expires": true,
		"user_message_course_messages": false,
		"user_call_course_pending": false,
		"user_call_course_releases": false,
		"user_whatsapp_course_expires": true,
		"user_whatsapp_course_releases": true,
		"user_push_talk": true,
		"user_push_course_expires": true,
		"user_push_course_pending": true,
		"user_push_course_releases": true,
		"user_push_categories": [
			6,
			13,
			30
		]
	}
}
Atualizar preferências do usuário
Atualiza preferências e opções de privacidade do usuário.

Status:	OPERACIONAL •
Endpoint:	/api/user/set-preference
Parâmetros:	token Token de acesso a API
user_id ID do Usuário
user_token Token Privado do Usuário (logado)
user_language opcional - Idioma de Interface (pt, en, es, fr ou zh)
user_course_assistant opcional - Ativar ou Desativar assistente durante o curso (true ou false)
user_course_accessibility opcional - Ativar ou Desativar recursos de melhoria de acessibilidade durante o curso (true ou false)
user_notification_sound opcional - Ativar ou Desativar sons de notificação (true ou false)
user_email_course_expires opcional - Ativar ou Desativar e-mail quando curso vencer (true ou false)
user_email_course_releases opcional - Ativar ou Desativar e-mail quando houver lançamentos de curso (true ou false)
user_email_friendship opcional - Ativar ou Desativar e-mail quando receber novo pedido de amizade (true ou false)
user_email_message opcional - Ativar ou Desativar e-mail quando receber nova mensagem privada (true ou false)
user_email_suggestion opcional - Ativar ou Desativar e-mail de sugestões de cursos de amigos (true ou false)
user_email_talk opcional - Ativar ou Desativar e-mail quando houver nova transmissão ao vivo (true ou false)
user_email_news opcional - Ativar ou Desativar e-mail quando houver novidades (true ou false)
user_message_forum_reply opcional - Ativar ou Desativar mensagem quando receber resposta de uma pergunta no Fórum (true ou false)
user_message_reflection_reply opcional - Ativar ou Desativar mensagem quando receber resposta de uma Atividade Reflexiva (true ou false)
user_message_course_completed opcional - Ativar ou Desativar mensagem quando concluir um curso, para emitir certificado (true ou false)
user_message_course_expires opcional - Ativar ou Desativar mensagem quando o curso estiver perto de vencer (true ou false)
user_message_course_messages opcional - Ativar ou Desativar mensagem de amigos durante curso (true ou false)
user_call_course_pending opcional - Ativar ou Desativar autorização de ligação quando curso estiver pendente de pagamento (true ou false)
user_call_course_releases opcional - Ativar ou Desativar autorização de ligação quando houver lançamentos de novos cursos (true ou false)
user_whatsapp_course_expires opcional - Ativar ou Desativar autorização de Whatsapp/SMS quando curso estiver próximo de vencer (true ou false)
user_whatsapp_course_releases opcional - Ativar ou Desativar autorização de Whatsapp/SMS quando houver lançamentos de novos cursos (true ou false)
user_push_talk opcional - Ativar ou Desativar pushs no App quando houver nova transmissão ao vivo (true ou false)
user_push_course_expires opcional - Ativar ou Desativar pushs no App quando o curso estiver vencendo (true ou false)
user_push_course_pending opcional - Ativar ou Desativar pushs no App quando não acessar o curso há mais de 5 dias (true ou false)
user_push_course_releases opcional - Ativar ou Desativar pushs no App quando tiver lançamentos de novos cursos (true ou false)
user_push_categories opcional - Ativar ou desativar pushs no App para as categorias de cursos selecionadas (enviar serializado, ex.: 1,2,3,4)
Objetos retornados:	SUCCESS em caso de sucesso, isto será uma mensagem literal
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Preferências salvas com sucesso!"
}
Alterar senha do usuário
Efetua alteração na senha de acesso do usuário.

Status:	OPERACIONAL •
Endpoint:	/api/user/set-password
Parâmetros:	token Token de acesso a API
user_id ID do Usuário
user_token Token Privado do Usuário (logado)
user_password Nova Senha de Acesso para o Usuário
Objetos retornados:	SUCCESS em caso de sucesso, isto será uma mensagem literal
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Senha alterada com sucesso!"
}
Nota importante:	O usuário precisa estar relacionado com a sua empresa, para que tenha permissão de alteração de senha.
Obter URL de acesso à sala de aula
Ao informar o ID e CPF do usuário, retorna a URL de acesso à sala de aula (AVA).

Status:	OPERACIONAL •
Endpoint:	/api/user/get-logged-url
Parâmetros:	token Token de acesso a API
user_id ID do Usuário
user_cpf CPF do Usuário
user_email opcional - utilizado para realizar uma nova busca (no caso de não encontrar por CPF)
expire_url_minutes opcional - use para adicionar validade (em minutos) a URL de login.
Objetos retornados:	URL URL de acesso à sala de aula
USER_ID o ID do Usuário
USER_TOKEN o Token Privado do Usuário
Exemplo de retorno (JSON):	
{
	"URL": "https://../url-usuario-logado",
	"USER_ID": 2509142,
	"USER_TOKEN": "82e47251b78187e0acbacf185ec"
}
Obter preferência de tema do usuário
Ao informar o ID e Token do usuário, retorna a preferência do tema escolhido.

Status:	OPERACIONAL •
Endpoint:	/api/user/get-theme
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado)
Objetos retornados:	THEME em caso de sucesso, este objeto retornará as propriedades do tema
Exemplo de retorno 1 (JSON):	
{
	"THEME": {
		"theme": 0,
		"interval_hours": "20-05",
		"message": "Sua tela vai escurecer automaticamente a partir das 20 horas até as 5 horas da manhã"
	}
}
Exemplo de retorno 2 (JSON):	
{
	"THEME": {
		"theme": 1,
		"interval_hours": "00-24",
		"message": "Sua tela vai ficar sempre clara"
	}
}
Exemplo de retorno 3 (JSON):	
{
	"THEME": {
		"theme": 2,
		"interval_hours": "00-24",
		"message": "Sua tela vai ficar sempre escura"
	}
}
Atualizar preferência de tema do usuário
Efetua alteração no tema do usuário (automático, claro ou escuro).

Status:	OPERACIONAL •
Endpoint:	/api/user/set-theme
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado)
theme Flag para o Tema escolhido (0, 1 ou 2)
Objetos retornados:	THEME em caso de sucesso, este objeto retornará as propriedades do tema
Exemplo de retorno (JSON):	
{
	"THEME": {
		"theme": 1,
		"interval_hours": "00-24",
		"message": "Sua tela vai ficar sempre clara"
	}
}
Obter painel inicial do AVA
Retorna dados de cursos, professores e próximos cursos.

Status:	OPERACIONAL •
Endpoint:	/api/user/get-welcome
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado)
Objetos retornados:	WELCOME em caso de sucesso, use esse objeto para manusear os dados
Exemplo de retorno (JSON):	
{
	"WELCOME": {
		"title": "Bem-vindo, João!",
		"image": "https://..url-to-image",
		"description": "Aqui você pode iniciar seus treinamentos...",
		"tip_label": "Veja abaixo",
		"has_button": true,
		"button_label": "Ir para Meus Cursos",
		"button_url": "/aulas",
		"company_home_banner": "https://..url-to-image", // optional
		"company_home_url": "" // optional
	},
	"SECTIONS": [
		{
			"title": "Cursos que você deveria fazer",
			"headline": "Escolhidos por nossa IA para melhorar sua capacidade de trabalhar em equipe",
			"courses": [
				{
					"course_id": 114420,
					"title": "React",
					"image": "https://..url-to-image",
					"progress": 40,
					"progress_label": "Em andamento",
					"teacher_photo": "https://..url-to-image"
				}
				,...
			]
		}
		,...
	],
	"TEACHERS": {
		"title": "Professores em Destaque",
		"headline": "Veja os cursos ministrados pelos professores que se destacaram",
		"teachers": [
			{
				"teacher_id": 117,
				"teacher_name": "Fabio Bergamo",
				"teacher_image": "https://..url-to-image"
			}
			,...
		]
	},
	"NEXT_COURSES": {
		"title": "Próximos Lançamentos",
		"headline": "Se prepare para o que vem por aí...",
		"courses": [
			{
				"course_title": "Curso de People Analytics",
				"course_image": "https://..url-to-image",
				"course_teacher_name": "Mauricio Pereira",
				"course_teacher_photo": "https://..url-to-image",
				"course_release_date": "2024-04-12",
				"course_release_date_left": "2 dias"
			}
			,...
		]
	}
}
Amigos
Obter lista de amigos de um usuário
Retorna a lista de amigos, com paginação.

Status:	OPERACIONAL •
Endpoint:	/api/user/get-friends
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado)
pending opcional - para retornar somente amigos pendentes de aceitação (true ou false)
page opcional - número da página atual (padrão = 1)
query opcional - para buscar pelo nome do amigo
Objetos retornados:	FRIENDS em caso de sucesso, este objeto retornará a lista
Exemplo de retorno (JSON):	
{
	"TOTAL_PAGES": 1,
	"CURRENT_PAGE": 1,
	"FRIENDS": [
		{
			"user_id": 12345678,
			"user_name": "João Nascimento",
			"user_first_name": "João",
			"user_image_small": "https://...url-to-image"
		},
		...
	]
}
Iniciar amizade com outro usuário
Adiciona o usuário como amigo.

Status:	OPERACIONAL •
Endpoint:	/api/user/set-friendship
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado)
profile_id ID do usuário que deseja adicionar como amigo
Objetos retornados:	SUCCESS em caso de sucesso, esta será uma mensagem literal
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Convite de amizade enviado com sucesso!"
}
Confirmar amizade com outro usuário
Confirma o pedido de amizade.

Status:	OPERACIONAL •
Endpoint:	/api/user/confirm-friendship
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado)
profile_id ID do amigo
Objetos retornados:	SUCCESS em caso de sucesso, esta será uma mensagem literal
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Convite aceito com sucesso!"
}
Desfazer amizade com outro usuário
Remove o usuário como amigo.

Status:	OPERACIONAL •
Endpoint:	/api/user/del-friendship
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado)
profile_id ID do usuário que deseja remover como amigo
Objetos retornados:	SUCCESS em caso de sucesso, esta será uma mensagem literal
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Perfil removido como amigo!"
}
Agenda
Obter agenda do usuário (corporativo)
Retorna a lista com dias do mês e registros definidos para o usuário.

Status:	OPERACIONAL •
Endpoint:	/api/user/get-calendar
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado)
month opcional - padrão é o mês atual - se informado, busca agenda do mês/ano (formato YYYY-MM)
Objetos retornados:	CALENDAR em caso de sucesso, use para manusear os resultados
Exemplo de retorno (JSON):	
{
	"MONTH": "2024-03",
	"CALENDAR": [
		{
			"calendar_day": "2024-03-18",
			"calendar_title": "Prazo para conclusão do PDI",
			"calendar_description": "Seu gestor definiu o dia 18/03/2024 como data final para conclusão do PDI. Acesse para mais detalhes.",
			"calendar_url": "https://..url-to-item"
		}
		,...
	]
}
Processo de Compra
Criar um carrinho de compras para pagamento
Efetua criação de um carrinho de compras (do lado do servidor do Sie Edtech) para em seguida redirecionar para seu ambiente próprio de pagamento. Utilizado principalmente na modalidade "site pronto" com API do Sie Edtech.

Status:	OPERACIONAL •
Endpoint:	/api/buying/set-cart
Parâmetros:	token Token de acesso a API
course_id ID do Curso - inteiro ou lista*
course_type Tipo do Curso (use "2" para plus; "3" para premium; "4" para ilimitado)
course_plan Plano do Curso (números de meses de acesso, use "1", "2", "3", "6" ou "12")
user_id ID do Usuário - inteiro
* Para enviar uma lista de cursos no campo "course_id" você pode utilizar o modelo convencional de array em POST. Exemplo de query-string: course_id[]=1&course_id[]=2...

Objetos retornados:	PAYMENT em caso de sucesso, utilize este objeto para manusear os dados do carrinho
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Carrinho de cursos criado com sucesso!",
	"PAYMENT": {
		"user_id": 12345,
		"course_id": 12345,
		"payment_id": 12345,
		"payment_url": "https://...url-para-pagamento-da-empresa..."
	}
}
Exemplo de código (PHP):	
<?php

// seu token privado e o endpoint desejado da api
$token = 'seu-token-aqui';
$endpoint = '/api/buying/set-cart';

// monta parametros para requisicao
$url = 'https://www.iped.com.br'.$endpoint;
$data = [
	'token' => $token,
	'course_id' => [69768, 66741],
	'course_type' => 3,
	'course_plan' => 1,
	'user_id' => 1234
];

// executa requisicao
$curl_handle = curl_init();
curl_setopt($curl_handle, CURLOPT_URL, $url);
curl_setopt($curl_handle, CURLOPT_CUSTOMREQUEST, 'POST');
curl_setopt($curl_handle, CURLOPT_POSTFIELDS, $data);
curl_setopt($curl_handle, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl_handle, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl_handle, CURLOPT_SSL_VERIFYPEER, 0);
$response = curl_exec($curl_handle);
curl_close($curl_handle);

// tratamento para caso de erros de comunicacao
if (!$response) {
	echo 'Falha ao se comunicar com a API: '.$url;
	exit;
}

// converte json em array
$response = json_decode($response, true);

// verifica se a api retornou algum erro
if ($response && $response['STATE'] != 1) {
	echo $response['ERROR']; 
	exit;
}

// redireciona para URL de pagamento
header("Location: ".$response['PAYMENT']['payment_url']);
exit;
Corporativo
Obter dados de uma empresa
Obtém dados gerais (Nome, CNPJ, URL, Logotipo, etc.) da empresa principal ou de uma filial. Este método só está disponível para empresas que usam o formato "Cobrança por Curso" para site pronto.

Status:	OPERACIONAL •
Endpoint:	/api/corporate/get-company
Parâmetros:	token Token de acesso a API (empresa pai)
company_id opcional - ID da empresa filial, se não for informado será utilizado o ID da empresa pai (do token)
Objetos retornados:	COMPANY em caso de sucesso, utilize este objeto para manusear os dados da empresa
Exemplo de retorno (JSON):	
{
	"COMPANY": [
		{
			"company_id": 1,
			"company_name": "Razão Social da Empresa",
			"company_cnpj": "12345678...",
			"company_url": "https://www.sie.com.br/url-da-empresa",
			"company_logo": "https://...url-da-imagem",
			"company_header_color": "#ffffff",
			"company_price_course": 89.90,
			"company_price_fast": 49.90,
			"company_price_unlimited": 499.90,
			"company_gateway_type": 0,
			"company_gateway_url": "",
			"company_site_type": 1, 
			"company_categories_id": "",
			"company_about": "Texto para seção Sobre a empresa...",
			"company_resources": [
				"aulas",	
				"cursos",
				"metas",
				"biblioteca",
				...
			],
			"company_rules": {
				"gamification": 1,
				"receive_educational_emails": 1,
				"include_behavioral_questions_on_courses": 1,
				"include_incentive_messages_on_courses": 0,
				"quantity_courses_simultaneous": 2,
				"quantity_days_to_finish_course": 5,
				"quantity_days_to_cancel_course": 5,
				"access": 1,
				"access_hour_start": "08:00:00",
				"access_hour_finish": "18:00:00",
				"chat": 1,
				"chat_exhibition": 2
			}
		}
	]
}
Criar uma empresa (filial)
Cadastra uma empresa filha (subordinada à empresa principal).

Status:	OPERACIONAL •
Endpoint:	/api/corporate/set-company
Parâmetros:	token Token de acesso a API (empresa pai)
company_name Razão Social da nova empresa
company_cnpj CNPJ da nova empresa
company_slug Sufixo de URL para uso no site, ex.: sie.com.br/slug-da-empresa
company_limit Quantidade limite de colaboradores que a empresa pode cadastrar, ex.: 50
admin_name Nome completo do Responsável
admin_cpf CPF do Responsável
admin_email E-mail do Responsável
admin_password Senha para o Responsável
allow_courses Flag para permissão de criar cursos e utilizar a biblioteca virtual (0 para "Não" ou 1 para "Sim"). O espaço do seu plano é compartilhado com as empresas filiais.
Objetos retornados:	COMPANY em caso de sucesso, utilize este objeto para manusear os dados da empresa recém-criada
Exemplo de retorno (JSON):	
{
	"COMPANY": [
		{
			"company_id": 1,
			"company_name": "Razão Social da Empresa",
			"company_cnpj": "12345678...",
			"company_url": "https://www.sie.com.br/url-da-empresa",
			"company_admin": {
				"admin_name": "Nome do Responsável",
				"admin_cpf": "CPF do Responsável",
				"admin_email": "E-mail do Responsável"
			}
		}
	]
}
Remover uma empresa (filial)
Exclui uma empresa filha (subordinada à empresa principal).

Status:	OPERACIONAL •
Endpoint:	/api/corporate/del-company
Parâmetros:	token Token de acesso a API (empresa pai)
company_id* ID da empresa filial
company_cnpj* CNPJ da empresa filial
company_force_remove Forçar remoção instantânea
* Informe apenas 1 dos parâmetros, não necessariamente ambos.

A remoção instantânea (company_force_remove) só acontecerá caso a empresa exista a mais de 30 dias na base e estará sujeita a cobrança proporcional de uso.

Objetos retornados:	COMPANY em caso de sucesso, retornará os dados da empresa excluída ou agendada para exclusão
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Empresa excluída com sucesso."
	"COMPANY": [
		{
			"company_id": 1,
			"company_name": "Razão Social da Empresa",
			"company_cnpj": "12345678...",
		}
	]
}
Alterar limite de colaboradores (filial)
Efetua alteração nas preferências de limites de colaboradores de uma empresa filha (subordinada à empresa principal).

Status:	OPERACIONAL •
Endpoint:	/api/corporate/set-limit
Parâmetros:	token Token de acesso a API (empresa pai)
company_id ID da empresa filial
limit Limite de colaboradores para filial - inteiro, ex.: 50
Objetos retornados:	SUCCESS em caso de sucesso, retornará mensagem informando que limite foi alterado
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Limite alterado para 50 colaboradores."
	"COMPANY": [
		{
			"company_id": 1,
			"company_name": "Razão Social da Empresa",
			"company_cnpj": "12345678...",
		}
	]
}
Login de empresa (filial)
Retorna URL de acesso ao ambiente administrador da empresa filha (subordinada à empresa principal).

Status:	OPERACIONAL •
Endpoint:	/api/corporate/login
Parâmetros:	token Token de acesso a API (empresa pai)
company_id ID da empresa filial
admin_id ID do Administrador
admin_email E-mail do Administrador
Objetos retornados:	URL em caso de sucesso, retornará uma URL de acesso ao corporativo
Exemplo de retorno (JSON):	
{
	"URL": "https://www.sie.com.br/..url-de-acesso.."
}
Lista de Colaboradores
Retorna lista de colaboradores de uma empresa, incluindo data de agendamento para exclusão (se houver).

Status:	OPERACIONAL •
Endpoint:	/api/corporate/get-users
Parâmetros:	token Token de acesso a API
user_name opcional - para filtrar/buscar pelo Nome (ou parte dele) do Usuário
user_email opcional - para filtrar/buscar pelo E-mail (ou parte dele) do Usuário
user_cpf opcional - para filtrar/buscar pelo CPF do Usuário
page opcional - número da página atual
results opcional - quantidade de resultados por página (padrão = 20)
Objetos retornados:	USERS em caso de sucesso, retornará uma lista de colaboradores da empresa (vide exemplo)
Exemplo de retorno (JSON):	
{
		"STATE": 1,
		"TOTAL_PAGES": 16,
		"CURRENT_PAGE": 1,
		"USERS_TOTAL": 10,
		"USERS": [
			{
				"user_id": 1,
				"user_name": "Nome do Colaborador",
				"user_email": "email@dominio...",
				"user_token": "XPRO...",
				"user_groups": [
					{
						"group_id": 123,
						"group_name": "RH"
					},
					{
						"group_id": 321,
						"group_name": "Administrativo"
					}
				],
				"exclusion_schedule": "Data agendada para exclusão (se houver)",
			},
			...
		]
		}
Gerar Relatórios Pedagógicos
Retorna o relatório solicitado de acordo com o tipo (assíncrono).

Status:	OPERACIONAL •
Endpoint:	/api/corporate/get-report
Parâmetros:	token Token de acesso a API
type Tipo do relatório que deseja gerar
complete para Relatório Completo
pedagogical para Relatório Pedagógico Detalhado
progress para Relatório em Andamento
development para Relatório de Desenvolvimento
profile para Relatório Perfil de Formação
log para Relatório Log de Evasões, Desistências e Conclusões
collaborators para Relatório de Colaboradores
Observação:	Este endpoint funciona de forma assíncrona. Enquanto o relatório estiver sendo gerado, retornará o status in_progress (ver exemplo 1 abaixo). O relatório pode demorar alguns minutos, a depender da quantidade de usuários da empresa. Recomendamos que seja feito o consumo a cada 1 minuto, até obter o status de relatório pronto: completed (ver exemplo 2 abaixo).
Objetos retornados:	REPORT quando o relatório estiver pronto
Exemplo de retorno 1 (JSON):	
{
	"REPORT": {
		"report_status": "in_progress",
		"report_type": "complete",
	}
}
Exemplo de retorno 2 (JSON):	
{
	"REPORT": {
		"report_status": "completed",
		"report_expires_at": "2025-08-16 14:14:00",
		"report_file": "https://www.sie.com.br/admin/...",
		"report_type": "complete",
	}
}
Histórico de Pagamentos
Retorna a lista de faturas da empresa

Status:	OPERACIONAL •
Endpoint:	/api/corporate/get-billing
Parâmetros:	token Token de acesso a API
page opcional - número da página atual, padrão = 1
Objetos retornados:	PAYMENTS para a lista de pagamentos
Exemplo de retorno (JSON):	
{
	"STATE": 1,
	"TOTAL_PAGES": 3,
	"CURRENT_PAGE": 1,
	"PAYMENTS": [
		{
			"payment_id": "123...",
			"payment_amount": "120.00",
			"payment_date": "2025-03-07 12:47:07",
			"payment_due_date": "2025-03-12",
			"payment_status": "Pendente",
			"payment_description": "Treinamento de colaboradores",
			"payment_fiscal_document": "https://...url-to-document",
			"payment_report": "https://...url-to-report"
		},
		...
	]
}
Grupos (Corporativo)
Obter grupos da empresa
Retorna a lista de grupos da empresa.

Status:	OPERACIONAL •
Endpoint:	/api/corporate/get-groups
Parâmetros:	token Token de acesso a API
group_id opcional - ID do grupo, se desejar filtrar
Objetos retornados:	GROUPS em caso de sucesso, retornará a lista de grupos
Exemplo de retorno (JSON):	
{
	"GROUPS": [
		{
			"group_id": 1,
			"group_parent_id": 0,
			"group_name": "Finanças",
			"group_color": "",
			"group_limit": "",
			"group_access_role": 1,
			"group_access_role_start": "",
			"group_access_role_end": "",
			"group_subgroups": []
		},
		{
			"group_id": 2,
			"group_parent_id": 0,
			"group_name": "Industrial",
			"group_color": "",
			"group_limit": "",
			"group_access_role": 1,
			"group_access_role_start": "",
			"group_access_role_end": "",
			"group_subgroups": [
				{
					"group_id": 3,
					"group_parent_id": 2,
					"group_name": "Demandas",
					"group_color": "",
					"group_limit": "",
					"group_access_role": 1,
					"group_access_role_start": "",
					"group_access_role_end": "",
					"group_subgroups": []
				}
			]
		},
		...
	]
}
Criar um grupo
Adiciona um novo grupo para a empresa.

Status:	OPERACIONAL •
Endpoint:	/api/corporate/set-group
Parâmetros:	token Token de acesso a API
group_name Nome do grupo
group_parent_id opcional - ID do grupo pai
group_color opcional - cor de fundo para o grupo, formato HEX (ex.: #333333) - usado no organograma e trilhas
group_limit opcional - limite de colaboradores
group_access_role opcional - regras de acesso, padrão é sempre permitir qualquer dia e horário (veja as opções)
group_access_role_start opcional - horário de início das atividades (formato: 08:00)
group_access_role_end opcional - horário de fim das atividades (formato: 18:00)
Objetos retornados:	SUCCESS em caso de sucesso, retornará o ID do grupo criado
Exemplo de retorno (JSON):	
{
	"GROUP_ID": 1,
	"SUCCESS": "Grupo criado com sucesso"
}
Editar um grupo
Edita um grupo da empresa.

Status:	OPERACIONAL •
Endpoint:	/api/corporate/edit-group
Parâmetros:	token Token de acesso a API
group_id ID do grupo que será alterado
group_name opcional - Nome do grupo
group_parent_id opcional - ID do grupo pai
group_color opcional - cor de fundo para o grupo, formato HEX (ex.: #333333) - usado no organograma e trilhas
group_limit opcional - limite de colaboradores
group_access_role opcional - regras de acesso (veja as opções)
group_access_role_start opcional - horário de início das atividades (formato: 08:00)
group_access_role_end opcional - horário de fim das atividades (formato: 18:00)
Objetos retornados:	SUCCESS em caso de sucesso, retornará o ID do grupo alterado
Exemplo de retorno (JSON):	
{
	"GROUP_ID": 1,
	"SUCCESS": "Grupo alterado com sucesso"
}
Excluir um grupo
Remove um grupo da empresa.

Status:	OPERACIONAL •
Endpoint:	/api/corporate/del-group
Parâmetros:	token Token de acesso a API
group_id ID do grupo que será excluído
Objetos retornados:	SUCCESS em caso de sucesso, retornará o ID do grupo excluído
Aviso importante:	Ao excluir um grupo, todos os subgrupos que existirem abaixo dele também serão removidos
Exemplo de retorno (JSON):	
{
	"GROUP_ID": 1,
	"SUCCESS": "Grupo excluído com sucesso"
}
Reagrupar colaboradores
Reagrupa os colaboradores da empresa em grupos.

Status:	OPERACIONAL •
Endpoint:	/api/corporate/set-regroup
Parâmetros:	token Token de acesso a API
users_id ID do Colaborador (ou uma lista)
groups_id ID do novo Grupo (ou uma lista)
action opcional - Ação de reagrupamento:
overwrite (padrão) sobrescreve os grupos que o colaborador tiver atualmente, pelos novos informados
add insere o colaborador nos novos grupos informados (se ela tiver em outros grupos, mantém)
delete remove o colaborador dos grupos informados
Objetos retornados:	SUCCESS em caso de sucesso.
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Reagrupamento realizado com sucesso."
}
Exemplo de retorno 2 (JSON):	
{
					"ERROR": "O máximo de registros aceito é de 200.",
					"STATE": 0
				}
Matrícula
Criar matrícula
Efetua matrícula de um novo aluno e associa um curso (ou plano de cursos) na mesma chamada.

Status:	OPERACIONAL •
Endpoint:	/api/user/set-registration
Parâmetros:	token Token de acesso a API
course_id ID do Curso - inteiro ou lista*
course_type Tipo do Curso (use "2" para plus; "3" para premium; "4" para ilimitado)
course_plan Plano do Curso (números de meses de acesso, use "1", "2", "3", "6" ou "12")
user_id ID do Usuário - inteiro ou lista* (em caso de um novo usuário, mantenha em branco ou use "0")
user_name Nome do Usuário (obrigatório para um novo usuário)
user_cpf CPF do Usuário (obrigatório para um novo usuário, informe um CPF válido - para brasileiros - ou Documento de Identificação - para estrangeiros)
user_email E-mail do Usuário (obrigatório para um novo usuário)
user_password Senha do Usuário (obrigatório para um novo usuário)
force_new_password opcional - Flag para alterar a senha do usuário mesmo em caso de já existir um cadastro prévio (informar valor "1")
user_country País do Usuário - valor inteiro (veja a lista) - o padrão é "34" (Brasil)
user_genre Sexo do Usuário (obrigatório para um novo usuário, use "1" para masculino, "0" para feminino e "2" para outros)
user_cellphone opcional - Celular (informar no formato (99)99999-9999)
user_info opcional - Informação Extra do Usuário (um campo extra para informar qualquer informação extra sobre o usuário, como um número de registro interno, será exibido nos relatórios do 'Sie Edtech')
user_occupation opcional - Área de Atuação do Usuário (veja a lista)
user_professional_position opcional - Cargo do usuário
group_id opcional - ID do Grupo (se quiser gerenciar este usuário no 'Sie Edtech' - obtenha o ID do Grupo no 'Sie Edtech')
only_fast opcional - Informe = "1" para ativar acesso somente a cursos rápidos
* Para enviar uma lista de cursos no campo "course_id", ou lista de usuários no campo "user_id", você pode utilizar o modelo convencional de array em POST. Exemplo de query-string: course_id[]=1&course_id[]=2...

Objetos retornados:	REGISTRATION em caso de sucesso, isto retornará os ID's registrados (veja exemplos 1 e 2)
Observações Importantes:	
Para plano ilimitado (course_type = 4) informe course_id = 0
Este método não envia o e-mail de boas vindas do Sie Edtech
Este método cancela a exclusão (ou agendamento de exclusão) do colaborador
Em caso de registro de um "novo usuário", a API sempre irá checar se o usuário existe. Neste caso, observe os retornos diferentes abaixo:
Exemplo 1 (abaixo): Registrado o curso para o novo usuário (STATE = 1)
Exemplo 2 (abaixo): Registrado o curso para um usuário já existente (STATE = 2)
Exemplo de retorno 1 (JSON):	
{
	"SUCCESS": "Novo aluno cadastrado e habilitado com sucesso.",
	"REGISTRATION": {
		"course_id": 208,
		"user_id": 509341,
		"user_data": [
			{
				"user_id": 509341,
				"user_token": "82e47251b78187e0acbacf185ec"
			}
		]
	},
	"STATE": 1
}
PS.: Os objetos REGISTRATION.course_id e REGISTRATION.user_id podem ser um inteiro (em caso de 1 usuário) ou uma lista (em caso de mais de 1 usuário)

Exemplo de retorno 2 (JSON):	
{
	"SUCCESS": "Aluno já cadastrado foi habilitado com sucesso.",
	"REGISTRATION": {
		"course_id": [7531, 69724],
		"user_id": [208551, 509341],
		"user_data": [
			{
				"user_id": 208551,
				"user_token": "91f102k92e872uytq02ec#mb160"
			},
			{
				"user_id": 509341,
				"user_token": "82e47251b78187e0acbacf185ec"
			}
		]
	},
	"STATE": 2
}
PS.: Os objetos REGISTRATION.course_id e REGISTRATION.user_id podem ser um inteiro (em caso de 1 usuário) ou uma lista (em caso de mais de 1 usuário)

Exemplo de retorno 3 (JSON):	
{
	"ERROR": "Empresa não possui licenças suficientes para habilitar este curso.",
	"STATE": 0
}
Cancelar matrícula (sem excluir dados de certificado, etc.)
Efetua a exclusão (ou agendamento) da relação de "Colaborador x Empresa" e a empresa deixa de pagar por esse colaborador. Não apaga certificados e dados de estudo desse aluno.

Status:	OPERACIONAL •
Endpoint:	/api/user/del-registration
Parâmetros:	token Token de acesso a API
user_id ID do Usuário
user_email opcional - E-mail do Usuário (campo adicional, caso não informe o user_id)
Objetos retornados:	SUCCESS em caso de sucesso, isto será uma mensagem literal
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Aluno excluído com sucesso!",
	"USER_ID": 2172,
	"PROTOCOL": "Número do protocolo da exclusão"
}
Cancelar matrícula (com exclusão de dados)
Efetua a exclusão (ou agendamento de exclusão) de um colaborador da empresa. Também envia um e-mail ao colaborador para decidir sobre a exclusão total dos dados.

Status:	OPERACIONAL •
Endpoint:	/api/user/del-registration-data
Parâmetros:	token Token de acesso a API
user_id ID do Usuário (associado à empresa)
Objetos retornados:	SUCCESS em caso de sucesso, isto será uma mensagem literal
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Aluno excluído com sucesso!",
	"USER_ID": 2172,
	"PROTOCOL": "Número do protocolo da exclusão"
}
Exemplo do e-mail recebido pelo colaborador:	...recebemos uma solicitação da empresa para excluir todos os seus dados, inclusive certificados. O que você deseja fazer?
• Opção 1: Desejo manter minhas certificações, porém essa empresa não pode ter acesso a meus dados
• Opção 2: Desejo excluir todos os meus dados, inclusive todas as certificações e atividades que existam
Nota importante:	O e-mail será enviado ao colaborador somente se a sua empresa for a responsável pelo cadastro dele. Ou seja, foi a primeira empresa a cadastrar ele na base de dados de milhões de alunos do Sie Edtech. Caso sua empresa apenas liberou cursos, sem ter efetivamente cadastrado os dados desse colaborador, a relação com sua empresa será excluída, mas os dados do aluno, certificações e tudo mais permanecem.
Categorias
Obter categorias de cursos
Retorna a lista de categorias de cursos, podendo ser informados filtros de busca.

Status:	OPERACIONAL •
Endpoint:	/api/category/get-categories
Parâmetros:	token Token de acesso a API
query opcional - para filtrar/buscar pelo Título da Categoria
slug opcional - para filtrar/buscar pela URL amigável da categoria (slug)
all_formats opcional - Informe true se desejar retorna todos os formatos de cursos (não somente vídeo por padrão)
Objetos retornados:	CATEGORIES em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"CATEGORIES": [
		{
			"category_id": 2,
			"category_title": "Administração",
			"category_description": "Descrição aqui...",
			"category_slug": "administracao",
			"category_courses_total": 120,
			"category_image": "https://url-to-big-image",
			"category_icon": "https://url-to-icon"
		}
		,...
	]
}
Exemplo de código (PHP):	Veja este exemplo em execução
<?php

// seu token privado e o endpoint desejado da api
$token = 'seu-token-aqui';
$endpoint = '/api/category/get-categories';

// monta url e parametros para requisicao
$url = 'https://www.iped.com.br'.$endpoint;
$data = [
	'token' => $token
];

// executa requisicao
$curl_handle = curl_init();
curl_setopt($curl_handle, CURLOPT_URL, $url);
curl_setopt($curl_handle, CURLOPT_CUSTOMREQUEST, 'POST');
curl_setopt($curl_handle, CURLOPT_POSTFIELDS, $data);
curl_setopt($curl_handle, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl_handle, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl_handle, CURLOPT_SSL_VERIFYPEER, 0);
$response = curl_exec($curl_handle);
curl_close($curl_handle);

// tratamento para caso de erros de comunicacao
if (!$response) {
	echo 'Falha ao se comunicar com a API: '.$url;
	exit;
}

// converte json em array
$response = json_decode($response, true);

// verifica se a api retornou algum erro
if ($response && $response['STATE'] != 1) {
	echo $response['ERROR'];
	exit;
}

// tratamento para o caso de retornar uma lista vazia
if (!$response['CATEGORIES']) {
	echo 'Nenhuma categoria encontrada';
	exit;
}

// inicia html de exemplo
echo '<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Categorias</title>
</head>';

// css de exemplo
echo '<style>
body{font-family:arial;margin:20px}
h1{font-weight:normal;margin:30px 10px}
#categories{font-size:85%}
#categories,#categories li{margin:0;padding:0;list-style:none}
#categories li a{display:block;box-sizing:border-box;text-decoration:none;border:solid #e8e8e8 1px;border-radius:5px;float:left;margin:10px;width:30%;color:#333;min-height:25px;padding:15px}
#categories li a:hover{background:#e8e8e8}
#categories li a span{color:#999}
@media(max-width:900px) {#categories li a{width:40%}}
@media(max-width:600px) {#categories li a{width:100%;margin:0;margin-bottom:15px;}}
</style>';

// html de exemplo
echo '<body>
<h1>Lista de Categorias</h1>';

// exibe categorias (lista)
echo '<ul id="categories">';
foreach($response['CATEGORIES'] AS $category) {
	echo '<li>
	<a href="cursos.php?cat='.$category["category_id"].'">
	'.$category['category_title'].'
	<span> ('.$category['category_courses_total'].' cursos)</span>
	</a>
	</li>';
}
echo '</ul>';

// finaliza html de exemplo
echo '</body>
</html>';
Obter categorias e cursos agrupados
Retorna a lista de categorias e seus cursos, podendo ser informados filtros de busca.

Status:	OPERACIONAL •
Endpoint:	/api/course/get-categories-courses
Parâmetros:	token Token de acesso a API
user_id opcional - para filtrar/buscar por ID do Usuário
category_id opcional - para filtrar/buscar por ID de Categoria
category_slug opcional - para filtrar/buscar por Slug de Categoria
course_id opcional - para filtrar/buscar por ID do Curso
course_slug opcional - para filtrar/buscar por Slug do Curso
query opcional - para filtrar/buscar por Título
type opcional - use "1" para "cursos premium", "2" para "cursos rápidos" ou "3" para "cursos sob medida"
always_show opcional - use "1" para exibir "cursos rápidos" quando o usuário não tiver nenhum liberado
external_lms opcional - use "1" para retornar a URL de acesso à sala de aula. Neste caso, é obrigatório enviar junto também o parâmetro user_token
expire_url_minutes opcional - use para adicionar validade (em minutos) a URL de acesso à sala de aula. Neste caso, é obrigatório enviar junto também o parâmetro external_lms
inprogress opcional - use true para retornar somente cursos em andamento do usuário
include_topics opcional - use "1" para incluir os tópicos do curso
include_skills opcional - use "1" para incluir as habilidades do curso
include_all opcional - use "1" para incluir os cursos secundários da área
iped_only opcional - use "1" para buscar somente por cursos do Sie Edtech
all_formats opcional - Informe true se desejar retorna todos os formatos de cursos (não somente vídeo por padrão)
Objetos retornados:	CATEGORIES em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"CATEGORIES": [
		{
			"category_id": 1,
			"category_title": "3D e Games",
			"category_description": "Descrição aqui...",
			"category_slug": "3d-e-games",
			"category_courses": [
				{
					"course_id": 54828,
					"course_company_id": 1,
					"course_title": "Curso de 3D Game Studio na Prática",
					"course_description": "Descrição aqui...",
					"course_slug": "3d-game-studio-na-pratica",
					"course_free": 0,
					"course_format": 1,
					"course_category_id": 1,
					"course_rating": 4,
					"course_students": 1964,
					"course_captions": [
						"pt",
						"en"
					],
					"course_hours": 80,
					"course_minutes": 0,
					"course_video": "https://../url-do-video-apresentacao",
					"course_image": "https://../url-da-imagem",
					"course_slideshow": [
						"https://../url-da-imagem-1",
						"https://../url-da-imagem-2",
						"https://../url-da-imagem-3"
					],
					"course_teacher": {
						"teacher_name": "Nome do professor...",
						"teacher_description": "Descrição do professor...",
						"teacher_image": "https://../url-da-imagem"
					},
					"course_price": 89,
					"course_user": {
						"user_id": 1,
						"user_course_completed": 55,
						"user_course_grade": 70, // aproveitamento em %
						"user_course_format": 2
					}
				}
			]
			,...
		}
		,...
	]
}
Nota:
course_format esta propriedade retorna o formato do curso, são eles: 0 = curso somente em texto (tipo plus); 1 = curso somente em vídeo (tipo premium); 2 = curso em texto e vídeo (disponível nos 2 tipos, plus e premium)

Obter cursos de uma categoria
Retorna a lista de cursos de uma categoria, podendo ser informados filtros de busca.

Nota: Utilize o método Obter lista de cursos, informando o parâmetro category_id ou category_slug.

Cursos
Obter lista de cursos
Retorna a lista de cursos, podendo ser informados filtros de busca.

Status:	OPERACIONAL •
Endpoint:	/api/course/get-courses
Parâmetros:	token Token de acesso a API
user_id opcional - para filtrar/buscar por ID do Usuário
category_id opcional - para filtrar/buscar por ID de Categoria
category_slug opcional - para filtrar/buscar por Slug de Categoria
profession_id opcional - para filtrar/buscar por Profissão
course_id opcional - para filtrar/buscar por ID do Curso (podendo ser um inteiro ou uma lista)
teacher_id opcional - para filtrar/buscar por ID do Professor (inteiro)
query opcional - para filtrar/buscar pelo Título do Curso
slug opcional - para filtrar/buscar pela URL amigável do curso (slug)
type opcional - use "1" para "cursos premium", "2" para "cursos rápidos" ou "3" para "cursos sob medida"
always_show opcional - use "1" para exibir "cursos rápidos" quando o usuário não tiver nenhum liberado
order opcional - ordenação do resultado: use "title" (padrão) para ordenar pelo título do curso; "relevance" para ordenar por relevância (votação e alunos em curso); "date" para ordenar por data de lançamento (mais novos primeiro)
page opcional - número da página atual, padrão = 1
results opcional - quantidade de resultados por página (padrão = 20; máximo = 100)
external_lms opcional - use "1" para retornar a URL de acesso à sala de aula. Neste caso, é obrigatório também enviar junto o parâmetro user_token
expire_url_minutes opcional - use para adicionar validade (em minutos) a URL de acesso à sala de aula. Neste caso, é obrigatório enviar junto também o parâmetro external_lms
include_topics opcional - use "1" para incluir os tópicos do curso
include_skills opcional - use "1" para incluir as habilidades do curso
include_unlimited opcional - use "1" para incluir o "Plano Ilimitado" na lista de cursos
iped_only opcional - use "1" para buscar somente por cursos do Sie Edtech
all_formats opcional - Informe true se desejar retorna todos os formatos de cursos (não somente vídeo por padrão)
Objetos retornados:	COURSES em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"TOTAL_PAGES": 6,
	"CURRENT_PAGE": 1,
	"COURSES": [
		{
			"course_id": 54828,
			"course_company_id": 1,
			"course_title": "Curso de 3D Game Studio na Prática",
			"course_description": "Descrição aqui...",
			"course_slug": "3d-game-studio-na-pratica",
			"course_free": 0,
			"course_format": 1,
			"course_category_id": 1,
			"course_category_slug": "slug-categoria",
			"course_category_title": "Título da Categoria",
			"course_rating": 4,
			"course_students": 1964,
			"course_captions": [
				"pt",
				"en"
			],
			// Caso envie o parametro user_id a api irá chegar se o usuário tem IA implementada.
			"course_ia_enable": false,
			// Caso o usuário não tenha ia implementada, a api irá retornar opção para comprar a IA
            "course_ia_payment": {
                "name": "Lina",
                "image": "https://www.iped.com.br/_img/ia/1/imagem.jpg",
                "link": "https://www.iped.com.br/comprar/0?tipo=3&comprar_ia=1&mensal=1&user_id=396946&user_token=07f97e68e9bfa9d4a2b3333c745a0bc09573f5f6",
                "link_app": "https://www.iped.com.br/api/form/submit?user_id=396946",
                "text": "Adquirir por R$ 29,90",
                "value": 29.9,
                "description": "Sistema de inteligência Artificial treinado para orientá-lo nos estudos"
            },
			"course_hours": 80,
			"course_minutes": 0,
			"course_video": "https://../url-do-video-apresentacao",
			"course_image": "https://../url-da-imagem",
			"course_slideshow": [
				"https://../url-da-imagem-1",
				"https://../url-da-imagem-2",
				"https://../url-da-imagem-3"
			],
			"course_teacher": {
				"teacher_name": "Nome do professor...",
				"teacher_description": "Descrição do professor...",
				"teacher_image": "https://../url-da-imagem"
			},
			"course_price": 89,
			"course_user": {
				"user_id": 1,
				"user_course_completed": 55, // etapa do curso em %
				"user_course_grade": 70, // aproveitamento em %
				"user_course_format": 2,
				"user_course_start_date": "2025-01-01",
				"user_course_conclusion_date": "2025-01-25",
				"user_course_last_access": "2025-01-25",
				"user_course_rating": 5, // nota de 1 a 5 estrelas
				"user_course_testimonial": "Gostei do curso"
			}
		}
		,...
	]
}
Nota:
course_format esta propriedade retorna o formato do curso, são eles: 0 = curso somente em texto (tipo plus); 1 = curso somente em vídeo (tipo premium); 2 = curso em texto e vídeo (disponível nos 2 tipos, plus e premium)

Exemplo de código (PHP):	Veja este exemplo em execução
<?php

// seu token privado e o endpoint desejado da api
$token = 'seu-token-aqui';
$endpoint = '/api/course/get-courses';

// valores padrao para busca
$category_id = 1; // busca padrao pela categoria id 1
$page = 1; // busca padrao pela pagina 1

// verifica se possui paginacao na URL
if (isset($_GET['page']) && $_GET['page'] > 1) {
	$page = (int)$_GET['page'];
}

// verifica se possui categoria na URL
if (isset($_GET['cat']) && $_GET['cat'] > 1) {
	$category_id = (int)$_GET['cat'];
}

// monta url e parametros para requisicao
$url = 'https://www.iped.com.br'.$endpoint;
$data = [
	'token' => $token,
	'category_id' => $category_id,
	'page' => $page
];

// executa requisicao
$curl_handle = curl_init();
curl_setopt($curl_handle, CURLOPT_URL, $url);
curl_setopt($curl_handle, CURLOPT_CUSTOMREQUEST, 'POST');
curl_setopt($curl_handle, CURLOPT_POSTFIELDS, $data);
curl_setopt($curl_handle, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl_handle, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl_handle, CURLOPT_SSL_VERIFYPEER, 0);
$response = curl_exec($curl_handle);
curl_close($curl_handle);

// tratamento para caso de erros de comunicacao
if (!$response) {
	echo 'Falha ao se comunicar com a API: '.$url;
	exit;
}

// converte json em array
$response = json_decode($response, true);

// verifica se a api retornou algum erro
if ($response && $response['STATE'] != 1) {
	echo $response['ERROR'];
	exit;
}

// tratamento para o caso de retornar uma lista vazia
if (!$response['COURSES']) {
	echo 'Nenhum curso localizado';
	exit;
}

// inicia html de exemplo
echo '<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Cursos de '.$response['COURSES'][0]['course_category_title'].'</title>
</head>';

// css de exemplo
echo '<style>
body{font-family:arial;margin:20px}
h1{font-weight:normal;margin:30px 10px}
#courses{clear:both}
#courses,#courses li{margin:0;padding:0;list-style:none}
#courses li a,#courses li a img,#courses li a span{display:block}
#courses li a{box-sizing:border-box;text-decoration:none;background:#f0f0f0;float:left;margin:10px;width:290px;color:#333;min-height:350px;overflow:hidden;border-radius:5px}
#courses li a img{width:100%;opacity:0.8}
#courses li a:hover{background:#e8e8e8}
#courses li a:hover img{opacity:1}
#courses li a span{padding:15px 20px}
#courses li a span.title{font-weight:bold}
#courses li a span.description{font-size:80%}
@media(max-width:600px) {#courses li a{width:100%;float:none;margin:0;margin-bottom:25px;}}
</style>';

// html de exemplo
echo '<body>
<h1>Cursos de '.$response['COURSES'][0]['course_category_title'].'</h1>';

// funcao auxiliar para resumo da descricao
function truncate($text, $chars = 100) {
	if (strlen($text) <= $chars) {
		return $text;
	}
	$text = $text.' ';
	$text = substr($text,0,$chars);
	$text = substr($text,0,strrpos($text,' '));
	$text = $text.'...';
	return $text;
}

// exibe cursos (lista)
echo '<ul id="courses">';
foreach($response['COURSES'] AS $course) {
	echo '<li>
	<a href="curso.php?id='.$course["course_id"].'">
	<img src="'.$course['course_image'].'" />
	<span class="title">'.$course['course_title'].'</span>
	<span class="description">'.truncate($course['course_description']).'</span>
	</a>
	</li>';
}
echo '</ul>';

// finaliza html de exemplo
echo '</body>
</html>';
Obter detalhes de um curso
Retorna detalhes de um curso, podendo ser retornado também os tópicos.

Status:	OPERACIONAL •
Endpoint:	/api/course/get-courses
Parâmetros:	token Token de acesso a API
course_id - para filtrar/buscar por ID do Curso
include_topics - use "1" para incluir os tópicos do curso
all_formats opcional - Informe true se desejar retorna todos os formatos de cursos (não somente vídeo por padrão)
Objetos retornados:	COURSES em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"TOTAL_PAGES": 1,
	"CURRENT_PAGE": 1,
	"COURSES": [
		{
			"course_id": 54828,
			"course_company_id": 1,
			"course_title": "Curso de 3D Game Studio na Prática",
			"course_description": "Descrição aqui...",
			"course_slug": "3d-game-studio-na-pratica",
			"course_free": 0,
			"course_format": 1,
			"course_category_id": 1,
			"course_category_slug": "slug-categoria",
			"course_category_title": "Título da Categoria",
			"course_rating": 4,
			"course_students": 1964,
			"course_captions": [
				"pt",
				"en"
			],
			"course_hours": 80,
			"course_video": "https://../url-do-video-apresentacao",
			"course_image": "https://../url-da-imagem",
			"course_slideshow": [
				"https://../url-da-imagem-1",
				"https://../url-da-imagem-2",
				"https://../url-da-imagem-3"
			],
			"course_teacher": {
				"teacher_name": "Nome do professor...",
				"teacher_description": "Descrição do professor...",
				"teacher_image": "https://../url-da-imagem"
			},
			"course_price": 89,
			"course_user": {
				"user_id": 1,
				"user_course_completed": 55,
				"user_course_grade": 70, // aproveitamento em %
				"user_course_format": 2
			}
		}
	]
}
Exemplo de código (PHP):	Veja este exemplo em execução
<?php

// seu token privado e o endpoint desejado da api
$token = 'seu-token-aqui';
$endpoint = '/api/course/get-courses';

// verifica se informou o id do curso na URL
if (!isset($_GET['id']) || (int)$_GET['id'] == 0) {
	echo 'Informe o ID do curso';
	exit;
}

// reserva id do curso para os parametros da requisicao
$course_id = (int)$_GET['id'];

// monta url e parametros para requisicao
$url = 'https://www.iped.com.br'.$endpoint;
$data = [
	'token' => $token,
	'course_id' => $course_id,
	'include_topics' => 1
];

// executa requisicao
$curl_handle = curl_init();
curl_setopt($curl_handle, CURLOPT_URL, $url);
curl_setopt($curl_handle, CURLOPT_CUSTOMREQUEST, 'POST');
curl_setopt($curl_handle, CURLOPT_POSTFIELDS, $data);
curl_setopt($curl_handle, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl_handle, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($curl_handle, CURLOPT_SSL_VERIFYPEER, 0);
$response = curl_exec($curl_handle);
curl_close($curl_handle);

// tratamento para caso de erros de comunicacao
if (!$response) {
	echo 'Falha ao se comunicar com a API: '.$url;
	exit;
}

// converte json em array
$response = json_decode($response, true);

// verifica se a api retornou algum erro
if ($response && $response['STATE'] != 1) {
	echo $response['ERROR'];
	exit;
}

// tratamento para o caso de retornar uma lista vazia
if (!$response['COURSES']) {
	echo 'Nenhum curso encontrado';
	exit;
}

// retorna unico resultado para uma variavel
$course = current($response['COURSES']);

// inicia html de exemplo
echo '<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>'.$course['course_title'].'</title>
</head>';

// css de exemplo
echo '<style>
body{font-family:arial;margin:20px}
h1,h2,p{font-weight:normal;margin:30px 10px;clear:both}
h2{margin-top:40px}
p,li{line-height:1.5}
p.course-teacher img{float:left;border-radius:100px;width:100px;height:100px;margin-right:25px}
#slides{text-align:center}
.slide-controller:nth-child(1):checked ~ .slide-show .slides-list{--selected-item: 0}
.slide-controller:nth-child(2):checked ~ .slide-show .slides-list{--selected-item: 1}
.slide-controller:nth-child(3):checked ~ .slide-show .slides-list{--selected-item: 2}
.slide-show{overflow:hidden}
.slides-list{--selected-item:0;--total-items:3;list-style-type:none;margin:10px 0;padding:0;position:relative;left:calc(var(--selected-item) * -100%);width:calc(var(--total-items) * 100%);transition:left 0.4s cubic-bezier(0.680, -0.550, 0.265, 1.550);display:grid;grid-auto-flow:column;grid-auto-columns:1fr}
.slide{width:100%}
.slide img{border-radius:5px}
</style>';

// funcao auxiliar para exibir player de video
function video_player($url) {
	preg_match('#(\.be/|/embed/|/v/|/watch\?v=)([A-Za-z0-9_-]{5,11})#', $url, $match);
	return '<iframe width="100%" height="450" src="//www.youtube.com/embed/'.$match[2].'?wmode=transparent&autohide=1&rel=0&showinfo=0&showsearch=0&iv_load_policy=3&modestbranding=1" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';
}

// html de exemplo
echo '<body>
<h1>'.$course['course_title'].'</h1>

<h2>Vídeo de Apresentação</h2>
<p>'.video_player($course['course_video']).'</p>

<h2>Imagens do curso</h2>
<div id="slides">
<input type="radio" class="slide-controller" name="slide" checked />
<input type="radio" class="slide-controller" name="slide" />
<input type="radio" class="slide-controller" name="slide" />
<div class="slide-show">
<ul class="slides-list">';
foreach($course['course_slideshow'] AS $image) {
	echo '<li class="slide"><img src="'.$image.'" /></li>';
}
echo '</ul>
</div>
</div>

<h2>Descrição</h2>
<p>'.$course['course_description'].'</p>

<h2>Tópicos</h2>
<ul>';
foreach($course['course_topics'] AS $topic) {
	echo '<li>'.$topic.'</li>';
}
echo '</ul>

<h2>Professor</h2>
<p class="course-teacher"><img src="'.$course['course_teacher']['teacher_image'].'" />
<strong>'.$course['course_teacher']['teacher_name'].'</strong>
'.$course['course_teacher']['teacher_description'].'</p>';

// finaliza html de exemplo
echo '</body>
</html>';
Obter cursos em destaque do usuário
Retorna cursos indicados para o usuário, de acordo o plano dele.

Status:	OPERACIONAL •
Endpoint:	/api/course/get-featured
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário (utilizado para verificar os tipos do curso)
all_formats opcional - Informe true se desejar retorna todos os formatos de cursos (não somente vídeo por padrão)
Objetos retornados:	COURSES em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"COURSES": [
		{
			"course_id": 54828,
			"course_company_id": 1,
			"course_title": "Curso de 3D Game Studio na Prática",
			"course_description": "Descrição aqui...",
			"course_slug": "3d-game-studio-na-pratica",
			"course_free": 0,
			"course_format": 1,
			"course_category_id": 1,
			"course_category_slug": "slug-categoria",
			"course_rating": 4,
			"course_students": 1964,
			"course_captions": [
				"pt",
				"en"
			],
			"course_hours": 80,
			"course_minutes": 0,
			"course_video": "https://../url-do-video-apresentacao",
			"course_image": "https://../url-da-imagem",
			"course_slideshow": [
				"https://../url-da-imagem-1",
				"https://../url-da-imagem-2",
				"https://../url-da-imagem-3"
			],
			"course_teacher": {
				"teacher_name": "Nome do professor...",
				"teacher_description": "Descrição do professor...",
				"teacher_image": "https://../url-da-imagem"
			}
		}
		,...
	]
}
Obter cursos relacionados
Retorna a lista de cursos relacionado com outro curso.

Status:	OPERACIONAL •
Endpoint:	/api/course/get-related
Parâmetros:	token Token de acesso a API
category_id ID da Categoria
course_id ID do Curso atual; ele não será exibido nos resultados
iped_only opcional - use "1" para buscar somente por cursos do Sie Edtech
Objetos retornados:	COURSES em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"COURSES": [
		{
			"course_id": 54828,
			"course_company_id": 1,
			"course_title": "Curso de 3D Game Studio na Prática",
			"course_description": "Descrição aqui...",
			"course_slug": "3d-game-studio-na-pratica",
			"course_free": 0,
			"course_format": 1,
			"course_category_id": 1,
			"course_category_slug": "slug-categoria",
			"course_rating": 4,
			"course_students": 1964,
			"course_captions": [
				"pt",
				"en"
			],
			"course_hours": 80,
			"course_minutes": 0,
			"course_video": "https://../url-do-video-apresentacao",
			"course_image": "https://../url-da-imagem",
			"course_slideshow": [
				"https://../url-da-imagem-1",
				"https://../url-da-imagem-2",
				"https://../url-da-imagem-3"
			],
			"course_teacher": {
				"teacher_name": "Nome do professor...",
				"teacher_description": "Descrição do professor...",
				"teacher_image": "https://../url-da-imagem"
			}
		}
		,...
	]
}
Obter cursos concluídos
Retorna a lista de cursos finalizados de um usuário.

Status:	OPERACIONAL •
Endpoint:	/api/course/get-completed
Parâmetros:	token Token de acesso a API
user_id ID do Usuário
Objetos retornados:	COURSES em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"COURSES": [
		{
			"course_id": 54828,
			"course_title": "Curso de 3D Game Studio na Prática",
			"course_description": "Descrição aqui...",
			"course_image": "https://../url-da-imagem",
			"course_percentage": 100
		}
		,...
	]
}
Obter cursos em progresso (em andamento)
Retorna a lista de cursos em andamento de um usuário.

Status:	OPERACIONAL •
Endpoint:	/api/course/get-inprogress
Parâmetros:	token Token de acesso a API
user_id ID do Usuário
category_id opcional - para filtrar/buscar por Categoria
course_id opcional - para filtrar/buscar por ID do Curso
query opcional - para filtrar/buscar por Título
type opcional - use "1" para "cursos premium" ou "2" para "cursos rápidos"
external_lms opcional - use "1" para retornar a URL de acesso à sala de aula. Neste caso, é obrigatório também enviar junto o parâmetro user_token
expire_url_minutes opcional - use para adicionar validade (em minutos) a URL de acesso à sala de aula. Neste caso, é obrigatório enviar junto também o parâmetro external_lms
all_formats opcional - Informe true se desejar retorna todos os formatos de cursos (não somente vídeo por padrão)
Objetos retornados:	COURSES em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"COURSES": [
		{
			"course_id": 54828,
			"course_company_id": 1,
			"course_title": "Curso de 3D Game Studio na Prática",
			"course_description": "Descrição aqui...",
			"course_slug": "3d-game-studio-na-pratica",
			"course_free": 0,
			"course_format": 1,
			"course_category_id": 1,
			"course_category_slug": "slug-categoria",
			"course_rating": 4,
			"course_students": 1964,
			"course_captions": [
				"pt",
				"en"
			],
			"course_hours": 80,
			"course_minutes": 0,
			"course_video": "https://../url-do-video-apresentacao",
			"course_image": "https://../url-da-imagem",
			"course_slideshow": [
				"https://../url-da-imagem-1",
				"https://../url-da-imagem-2",
				"https://../url-da-imagem-3"
			],
			"course_teacher": {
				"teacher_name": "Nome do professor...",
				"teacher_description": "Descrição do professor...",
				"teacher_image": "https://../url-da-imagem"
			},
			"course_user": {
				"user_id": 1,
				"user_course_completed": 55,
				"user_course_grade": 70, // aproveitamento em %
				"user_course_format": 2
			}
		}
		,...
	]
}
Requisitar curso (corporativo)
Envia requisição ao gestor (empresa precisa ativar isso).

Status:	OPERACIONAL •
Endpoint:	/api/course/set-request
Parâmetros:	token Token de acesso a API
user_id ID do Usuário
user_token Token do Usuário logado
course_id ID do Curso para requisitar
message Mensagem enviada ao gestor
Objetos retornados:	SUCCESS em caso de sucesso, isso será uma mensagem literal
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Solicitação enviada com sucesso!"
}
Obter lista de professores
Retorna lista de alguns professores dos cursos.

Status:	OPERACIONAL •
Endpoint:	/api/course/get-teachers
Parâmetros:	token Token de acesso a API
Objetos retornados:	TEACHERS em caso de sucesso, use esse objeto para manusear os dados
Exemplo de retorno (JSON):	
{
	"TEACHERS": [
		{
			"teacher_id": 1,
			"teacher_name": "João dos Santos",
			"teacher_first_name": "João"
		}
		,...
	]
}
Enviar sugestão
Envia sugestão aos gestores.

Status:	OPERACIONAL •
Endpoint:	/api/course/set-suggest
Parâmetros:	token Token de acesso a API
user_id ID do Usuário
user_token Token do Usuário logado
suggestion Sugestão para enviar
Objetos retornados:	SUCCESS em caso de sucesso, isso será uma mensagem literal
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Sugestão enviada com sucesso!"
}
ENEM
Obter lista de cursos (universidade)
Retorna lista de cursos com notas de corte (min e max).

Status:	OPERACIONAL •
Endpoint:	/api/enem/get-university-courses
Parâmetros:	token Token de acesso a API
Objetos retornados:	COURSES em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"COURSES": [
		{
			"course_id": 1,
			"course_title": "Administração",
			"course_score_min": 100,
			"course_score_max": 200
		},
		{
			"course_id": 2,
			"course_title": "Comunicação"
			"course_score_min": 120,
			"course_score_max": 250
		}
		,...
	]
}
Obter visão geral do usuário
Retorna dados consolidados para relatório do ENEM do usuário (precisa estar habilitado).

Status:	OPERACIONAL •
Endpoint:	/api/enem/get-summary
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado)
Objetos retornados:	ENEM em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"ENEM": {
		"enem_user": {
			"user_id": 1,
			"user_name": "João dos Santos",
			"user_first_name": "João",
			"user_image": "https://..url-to-image",
		},
		"enem_quiz": {
			"quiz_url": "https://..url-to-quiz",
			"quiz_score": 120,
			"quiz_completed": 30, // percentage %
			"quiz_total_correct": 27,
			"quiz_total_wrong": 27,
			"quiz_areas": [
				{
					"area_name": "Ciências Naturais",
					"area_quiz_correct": 2
					"area_quiz_total": 13,
				},
				{
					"area_name": "Ciências Humanas",
					"area_quiz_correct": 32
					"area_quiz_total": 7,
				}
				,...
			]
		}
		"enem_ranking": {
			"ranking_position": 4462,
			"ranking_near": [
				{
					"user_position": 4459,
					"user_name": "Irlanda Conceição",
					"user_image": "https://...url-to-image",
					"user_score": 100
				}
				,...
			]
		}
	}
}
Obter relatório por matéria do usuário
Retorna notas de cada matéria para relatório do ENEM do usuário (precisa estar habilitado).

Status:	OPERACIONAL •
Endpoint:	/api/enem/get-report
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado)
Objetos retornados:	ENEM em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"ENEM": {
		"enem_user": {
			"user_id": 1,
			"user_name": "João dos Santos",
			"user_first_name": "João",
			"user_image": "https://..url-to-image",
		},
		"enem_quiz": {
			"quiz_completed": 30, // percentage %
			"quiz_url": "https://..url-to-quiz"
		},
		"enem_courses_doing_bad": [
			{
				"couse_id": 1,
				"course_title": "Biologia",
				"course_quiz_performance": 20, // percentage %
				"course_quiz_correct": 1,
				"course_quiz_total": 5
			}
			,...
		],
		"enem_factors_doing_bad": [
			{
				"factor_id": 1,
				"factor_name": "Interpretação de imagens"
			},
			{
				"factor_id": 2,
				"factor_name": "Interpretação de mapas"
			}
			,...
		],
		"enem_factors_doing_well": [
			{
				"factor_id": 3,
				"factor_name": "Interpretação de textos"
			},
			{
				"factor_id": 4,
				"factor_name": "Interpretação de tabela, gráfico ou infográfico"
			}
			,...
		]
	}
}
Obter vídeos de revisão de uma matéria
Retorna vídeos de revisão do ENEM do usuário (precisa estar habilitado).

Status:	OPERACIONAL •
Endpoint:	/api/enem/get-videos
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado)
course_id ID do Curso (matéria)
factor_id opcional - ID do Fator (está indo mal), se informado sobrescreve o ID do Curso
Objetos retornados:	ENEM em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"ENEM": {
		"enem_title": "Biologia",
		"enem_videos": [
			{
				"video_title": "Aminoácidos",
				"video_subject": "Bioquímica",
				"video_image": "https://..url-to-image"
				"video_url": "https://..url-to-video",
				"video_embed": "https://..url-to-embed",
				"video_difficulty": "Média"
			}
			,...
		]
	}
}
Eventos
Obter lista de eventos
Retorna lista de eventos disponíveis para um usuário (corporativo).

Status:	OPERACIONAL •
Endpoint:	/api/event/get-events
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado)
event_id opcional - filtra por um ID de evento
company_id opcional - para filtrar pelo ID da empresa (caso tenha autorização)
Objetos retornados:	EVENTS em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"EVENTS": [
		{
			"event_id": 1,
			"event_title": "Título do Evento",
			"event_description": "Descrição do evento...",
			"event_image": "https://..url-to-image",
			"event_image_dark": "https://..url-to-image",
			"event_teacher": {
				"teacher_id": 1,
				"teacher_name": "Fabrício John",
				"teacher_image": "https://..url-to-image"
			},
			"event_type": "live",
			"event_date": "2024-04-26 08:50:00",
			"event_video": {
				"video_main": {
					"main_video_url": "https://..url-to-video",
					"main_video_embed": "HTML code to embed",
					"main_video_live": "URL to live broadcast"
				},
				"video_secondary": {
					"secondary_video_url": "https://..url-to-video"
					"secondary_video_embed": "HTML code to embed",
					"main_video_live": "URL to live broadcast"
				}
			},
			"event_forum": {
				"forum_id": 1,
				"forum_question": {
					"question_id": 9821,
					"question_title": "Text here..."
				}
			}
		}
		,...
	]
}
eBooks
Obter eBooks do usuário
Retorna lista de eBooks disponíveis para o usuário.

Status:	OPERACIONAL •
Endpoint:	/api/ebook/get-ebooks
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado)
Objetos retornados:	EBOOKS em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"EBOOKS": [
		{
			"ebook_id": 3,
			"ebook_title": "Como obter maior retorno com treinamentos online",
			"ebook_description": "Neste eBook você vai aprender como...",
			"ebook_url": "https://...url-to-ebook",
			"ebook_purchase_id": 198822,
			"ebook_purchase_date": "2024-01-10 10:02:00"
		}
		,...
	]
}
Biblioteca Virtual
Obter categorias da biblioteca da empresa
Retorna lista de categorias da biblioteca virtual da empresa.

Status:	OPERACIONAL •
Endpoint:	/api/library/get-categories
Parâmetros:	token Token de acesso a API
Objetos retornados:	CATEGORIES em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"CATEGORIES": [
		{
			"category_id": 7,
			"category_title": "Relatórios Digitais"
		},
		{
			"category_id": 120,
			"category_title": "Vídeos"
		}
		,...
	]
}
Obter itens da biblioteca do usuário
Retorna lista de objetos da biblioteca virtual disponíveis para o usuário.

Status:	OPERACIONAL •
Endpoint:	/api/library/get-library
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado)
category_id opcional - para filtrar por uma categoria da biblioteca
favorites opcional - informe true para filtrar somente pelos favoritos do usuário
Objetos retornados:	LIBRARY em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"LIBRARY": [
		{
			"item_id": 95,
			"item_category_id": 7,
			"item_category_title": "Relatórios Digitais",
			"item_title": "Relatório de Resultados Semestral",
			"item_image": "https://...url-to-image",
			"item_file": "https://...url-to-file-download",
			"item_type": "pdf",
			"item_date": "2024-02-27 08:27:00",
			"item_favorite_count": 2,
			"item_favorite": true
		}
		,...
	]
}
Registra item como favorito
Registra item como favorito na biblioteca do usuário.

Status:	OPERACIONAL •
Endpoint:	/api/library/set-favorite
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado)
item_id ID do item da Biblioteca
Objetos retornados:	SUCCESS em caso de sucesso, esta será uma mensagem literal
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Item registrado como favorito!"
}
Remove item dos favoritos
Remove item dos favoritos da biblioteca do usuário.

Status:	OPERACIONAL •
Endpoint:	/api/library/del-favorite
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado)
item_id ID do item da Biblioteca
Objetos retornados:	SUCCESS em caso de sucesso, esta será uma mensagem literal
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Item removido dos favoritos!"
}
Metas e Objetivos
Obter metas de um usuário
Retorna lista de metas/objetivos de um usuário específico.

Status:	OPERACIONAL •
Endpoint:	/api/goal/get-goals
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado)
goal_id opcional - filtra por uma meta e retorna o objeto user_summary para comparação
Objetos retornados:	GOALS em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"GOALS": [
		{
			"goal_id": 1,
			"goal_title": "Comprometimento para Liderança",
			"goal_description": "Meta definida para alcançar nível de liderança na empresa",
			"goal_conclusion_date": "2024-03-25",
			"goal_metrics": {
				"goal_score": 90,
				"goal_commitment": 90,
				"goal_engagement": 90
			},
			"goal_badges": [
				{
					"badge_id": 8,
					"badge_title": "Adaptação e Enfrentamento",
					"badge_image": "https://...url-to-image"
				},
				...
			],
			"user_summary": {
				"user_metrics": {
					"user_score": 80,
					"user_commitment": 70,
					"user_engagement": 75
				},
				"user_badges_already": [
					{
						"badge_id": 8,
						"badge_title": "Adaptação e Enfrentamento",
						"badge_image": "https://...url-to-image"
					},
					...
				],
				"user_badges_needs": [
					{
						"badge_id": 9,
						"badge_title": "Capacidade de Execução",
						"badge_image": "https://...url-to-image"
					},
					...
				]
			}
		}
		,...
	]
}
Obter ações de PDI de um usuário
Retorna ações adicionais do PDI (Plano de Desenvolvimento Individual) definido pela empresa.

Status:	OPERACIONAL •
Endpoint:	/api/goal/get-pdi
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado)
Objetos retornados:	PDI em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"PDI": [
		{
			"pdi_id": 1,
			"pdi_description": "Fazer Curso de Liderança",
			"pdi_conclusion_date": "2024-12-25"
		}
		,...
	]
}
Trilhas de conhecimento
Obter trilhas
Retorna lista de trilhas da empresa ou de um usuário.

Status:	OPERACIONAL •
Endpoint:	/api/trail/get-trails
Parâmetros:	token Token de acesso a API
query opcional - pesquisa trilhas pelo Título
user_id opcional - pesquisa trilhas de um Usuário
trail_id opcional - pesquisa trilha por ID
course_id opcional - pesquisa trilhas que contenham o ID do curso
all_formats opcional - Informe true se desejar retorna todos os formatos de cursos (não somente vídeo por padrão)
Objetos retornados:	TRAILS em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"TRAILS": [
		{
			"trail_id": 1,
			"trail_title": "Título da Trilha do Conhecimento",
			"trail_objective": "Objetivo da trilha",
			"trail_conclusion_date": "2019-03-25 12:00:00",
			"trail_conclusion_message": "Esses cursos fazem parte da Trilha de Conhecimento definida pelo seu gestor e você precisa concluir todos os cursos dessa trilha até do dia 25/03/2019.",
			"trail_courses": [
				{
					"course_trail_order": 1,
					"course_trail_available": 1,    // flag 0 ou 1
					"course_trail_message": "",
					// +  conteúdo do objeto "COURSES"
				},
				{
					"course_trail_order": 2,
					"course_trail_available": 0,   // flag 0 ou 1
					"course_trail_message": "Esse curso só vai estar disponível após...",
					// +  conteúdo do objeto "COURSES"
				}
				,...
			]
		}
		,...
	]
}
Criar uma trilha
Efetua cadastro de uma nova trilha para a empresa.

Status:	OPERACIONAL •
Endpoint:	/api/trail/set-trail
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado)
title Título para a Trilha
courses Lista de Cursos para a Trilha (ex.: 864,1260,2458)
goal opcional - Objetivo para a Trilha
Observação importante:	Este endpoint verifique se o usuário possui um "plano ilimitado" liberado; Caso o usuário ainda não o tenha, efetue a liberação antes usando o endpoint de matrícula.
Objetos retornados:	SUCCESS em caso de sucesso, isto será uma mensagem literal
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Trilha criada com sucesso!"
}
Excluir uma trilha
Remove uma trilha inteira, bloqueando os cursos que possuir.

Status:	OPERACIONAL •
Endpoint:	/api/trail/del-trail
Parâmetros:	token Token de acesso a API
trail_id o ID da Trilha (precisa ter sido criada por sua empresa)
Objetos retornados:	SUCCESS em caso de sucesso, isto será uma mensagem literal
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Trilha excluída com sucesso!"
}
Profissões
Obter profissões
Retorna a lista de profissões, podendo ser informados filtros de busca.

Status:	OPERACIONAL •
Endpoint:	/api/profession/get-professions
Parâmetros:	token Token de acesso a API
query opcional - para filtrar/buscar por Título
include_courses opcional - para incluir os cursos nos resultados, caso contrário veja Obter cursos de uma profissão
Objetos retornados:	PROFESSIONS em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"PROFESSIONS": [
		{
			"profession_id": 4,
			"profession_title": "Administrador",
			"profession_description": "Descrição aqui...",
			"profession_slug": "slug-aqui...",
			"profession_icon": "https://../url-da-imagem",
			"profession_color": "#fc6455"
		}
		,...
	],
	"PROFESSIONS_ALL": [
		{
			"profession_id": 27,
			"profession_title": "Outra Profissão",
			"profession_description": "Descrição aqui...",
			"profession_slug": "slug-aqui..."
		}
		,...
	]
}
Obter cursos de uma profissão
Retorna a lista de de cursos de uma profissão, podendo ser informados filtros de busca.

Nota: Utilize o método Obter lista de cursos, informando o parâmetro profession_id.

Processo de Estudo
Utilizado para manusear os dados de um curso do usuário.

Obter ambiente do curso (sala de aula)
Retorna a URL de acesso à sala de aula personalizada (podendo ser escolhido o layout).

Status:	OPERACIONAL •
Endpoint:	/api/course/get-environment
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
course_id ID do Curso
course_layout Layout do Curso (use "0" para exibir somente o vídeo do curso; "1" para exibir vídeo + botões próximo/anterior; "2" para exibir vídeo + botões + tópicos)
course_activities para ativar/desativar as Atividades Reflexivas no curso (use "1" para Ativar; "0" para Desativar)
expire_url_minutes opcional - use para adicionar validade (em minutos) a URL de acesso à sala de aula.
topic_index o Índice do Tópico que deseja visualizar, caso não seja informado será retomado da última parte vista
Objetos retornados:	ENVIRONMENT em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"ENVIRONMENT": {
		"course_id": 54828,
		"course_company_id": 1,
		"course_title": "Curso de 3D Game Studio na Prática",
		"course_iframe_url": "https://../url-to-embed-iframe",
		"course_user": {
			"user_id": 1,
			"user_course_completed": 55,
			"user_course_grade": 70, // aproveitamento em %
			"user_course_topic_index": 25,
			"user_course_time_elapsed": 3600,
			"user_course_date_lastaccess": "2018-08-10 18:00:00",
			"user_course_date_conclusion": ""
		}
	}
}
Obter resumo do curso do usuário (porcentagem, último acesso, etc.)
Retorna o sumário de um curso do aluno.

Status:	OPERACIONAL •
Endpoint:	/api/course/get-summary
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado) - isto é usado para verificar a autoria
course_id ID do Curso
Objetos retornados:	SUMMARY em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"SUMMARY": {
		"course_id": 54828,
		"course_company_id": 1,
		"course_title": "Curso de 3D Game Studio na Prática",
		"course_user": {
			"user_id": 1,
			"user_course_completed": 55,
			"user_course_grade": 70, // aproveitamento em %
			"user_course_topic_index": 25,
			"user_course_time_elapsed": 3600,
			"user_course_date_start": "2018-08-09 10:00:00",
			"user_course_date_lastaccess": "2018-08-10 18:00:00",
			"user_course_date_conclusion": ""
		}
	}
}
Obter anexos do curso
Retorna a lista de anexos de um curso.

Status:	OPERACIONAL •
Endpoint:	/api/course/get-attachments
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado) - isto é usado para verificar a autoria
course_id ID do Curso
Observação Importante:	
Caso o usuário não tenha acesso ao curso, será retornado uma URL para pagamento
Objetos retornados:	TOPICS em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno 1 (JSON):	
{
	"TOPICS": [
		{
			"topic_index": 1,
			"topic_id": 154,
			"topic_title": "Título do tópico...",
			"topic_image": "https://../url-da-imagem",
			"topic_type": 0,
			"topic_completed": 1,
			"topic_has_attachment": 0,
			"topic_percentage": 0,
			"topic_attachments": [
				{
					"attach_id": 2,
					"attach_name": "Título do anexo...",
					"attach_format": "pdf",
					"attach_url": "https://../url-to-file"
				},
				{
					"attach_id": 5,
					"attach_name": "Título do anexo...",
					"attach_format": "pdf",
					"attach_url": "https://../url-to-file"
				}
			]
		},
		{
			"topic_index": 8,
			"topic_id": 256,
			"topic_title": "Título do tópico...",
			"topic_image": "https://../url-da-imagem",
			"topic_type": 0,
			"topic_completed": 1,
			"topic_has_attachment": 0,
			"topic_percentage": 7,
			"topic_attachments": [
				{
					"attach_id": 18,
					"attach_name": "Título do anexo...",
					"attach_format": "pdf",
					"attach_url": "https://../url-to-file"
				}
			]
		}
		,...
	]
}
Obter lista de tópicos do curso
Retorna a lista de tópicos de um curso.

Status:	OPERACIONAL •
Endpoint:	/api/course/get-topics
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado) - isto é usado para verificar a autoria
course_id ID do Curso
include_reflections opcional - para incluir Reflexões na árvore de tópicos do curso
include_reactions opcional - para incluir as Avaliações de Reações (se houverem) na árvore de tópicos do curso
Observação Importante:	
Caso o usuário não tenha acesso ao curso, será retornado uma URL para pagamento
Objetos retornados:	TOPICS em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno 1 (JSON):	
{
	"TOPICS": [
		{
			"topic_index": 1,
			"topic_id": 154,
			"topic_title": "Título do tópico...",
			"topic_image": "https://../url-da-imagem",
			"topic_type": 0,
			"topic_completed": 1,
			"topic_has_attachment": 1,
			"topic_percentage": 0,
			"topic_format": "video"
		},
		{
			"topic_index": 2,
			"topic_id": 192,
			"topic_title": "Título do tópico...",
			"topic_image": "https://../url-da-imagem",
			"topic_type": 0
			"topic_completed": 1,
			"topic_has_attachment": 0,
			"topic_percentage": 8,
			"topic_format": "text"
		},
		{
			"topic_index": 3,
			"topic_id": 192,
			"topic_title": "Atividade Reflexiva - Publicar",
			"topic_image": "https://../url-da-imagem",
			"topic_type": 7
			"topic_completed": 0,
			"topic_has_attachment": 0,
			"topic_percentage": 30,
			"topic_format": "reflection"
		}
		,...
		{
			"topic_index": 4,
			"topic_id": 192,
			"topic_title": "Atividade Reflexiva - Comentar",
			"topic_image": "https://../url-da-imagem",
			"topic_type": 8
			"topic_completed": 0,
			"topic_has_attachment": 0,
			"topic_percentage": 40,
			"topic_format": "reflection"
		}
		,...
		{
			"topic_index": 5,
			"topic_id": 1211,
			"topic_title": "Avaliação Final",
			"topic_image": "https://../url-da-imagem",
			"topic_type": 1
			"topic_completed": 0,
			"topic_has_attachment": 0,
			"topic_percentage": 95,
			"topic_format": "form"
		}
	]
}
Exemplo de retorno 2 (JSON):	
{
	"ERROR": "Curso não liberado para este usuário.",
	"STATE": 2,
	"FORM": {
		"title": "Para ter acesso a esse curso você precisa ter um plano premium.\n\nTenha acesso ilimitado a todos os cursos por 1 ano.\n\nApenas R$ 0,00.",
		"field_1": "Nome",
		"field_2": 'CPF',
		"field_3": "N.º do Cartão",
		"field_4": "Validade (MM/AA)",
		"field_5": 'CVV',
		"submit": "https://../url-para-envio"
	}
}
Nota 1:
Você pode pré-preencher os campos do formulário (ex.: Nome) utilizando o método Obter perfil do usuário.

Nota 2:
Submeta os campos (field_1, field_2, field_3, field_4, field_5) para a URL do campo submit, utilizando sempre o método POST, então aguarde o retorno (isto irá validar os campos); utilize o retorno de STATE para erro ou sucesso (mesmo descrito em Especificações padrão).

Marcar tópico como lido
Efetua marcação num tópico do curso do usuário, como tópico visto.

Status:	OPERACIONAL •
Endpoint:	/api/course/set-read
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado) - isto é usado para verificar a autoria
course_id ID do Curso
topic_index Índice do Tópico (importante: utilize o Índice, não o ID)
time_elapsed Tempo decorrido (em segundos) assistindo o vídeo (ex.: 180)
include_reflections opcional - para incluir Reflexões na árvore de tópicos do curso
include_reactions opcional - para incluir as Avaliações de Reações (se houverem) na árvore de tópicos do curso
Observação Importante:	
Não é possível marcar um Quiz/Avaliação Final como lido. Neste caso, utilize o método Postar respostas de um formulário.
Objetos retornados:	SUCCESS em caso de sucesso, isto será uma mensagem literal
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Tópico marcado como lido!"
}
Obter perguntas/respostas de um tópico
Retorna lista de perguntas (formulário) de um tópico do curso.

Status:	OPERACIONAL •
Endpoint:	/api/course/get-form
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado) - isto é usado para verificar a autoria
course_id ID do Curso
topic_index Índice do Tópico do formulário retornado na Listagem de tópicos (importante: utilize o Índice, não o ID)
include_reflections opcional - para incluir Reflexões na árvore de tópicos do curso
include_reactions opcional - para incluir as Avaliações de Reações (se houverem) na árvore de tópicos do curso
Observações Importantes:	
No caso da Avaliação Final (final do curso), o usuário precisará ter completado todos os tópicos anteriores (verifique o parâmetro topic_completed na listagem de tópicos), caso contrário será retornada uma mensagem de ERROR (veja exemplo 2 abaixo)
Para submeter as respostas, utilize Postar respostas de um formulário
Objetos retornados:	TOPIC em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno 1 (JSON):	
{
	"TOPIC": {
		"topic_index": 4,
		"topic_id": 1211,
		"topic_title": "Avaliação Final",
		"topic_type": 1,
		"topic_completed": 0,
		"topic_has_attachment": 0,
		"topic_percentage": 95,
		"topic_questions": [
			{
				"question_id": 2552,
				"question_type": 2,
				"question_title": "Título da questão...",
				"question_answer_type": 1,
				"question_alt_a": "Alternativa A",
				"question_alt_b": "Alternativa B",
				"question_alt_c": "Alternativa C",
				"question_alt_d": "Alternativa D",
				"question_alt_e": "Alternativa E"
			},
			{
				"question_id": 2553,
				"question_type": 2,
				"question_title": "Título da questão...",
				"question_answer_type": 1,
				"question_alt_a": "Alternativa A",
				"question_alt_b": "Alternativa B",
				"question_alt_c": "Alternativa C",
				"question_alt_d": "Alternativa D",
				"question_alt_e": "Alternativa E"
			},
			{
				"question_id": 2554,
				"question_type": 2,
				"question_title": "Título da questão...",
				"question_answer_type": 2, // resposta dissertativa (exibir campo texto)
				"question_alt_a": "",
				"question_alt_b": "",
				"question_alt_c": "",
				"question_alt_d": "",
				"question_alt_e": ""
			}
			,...
		]
	}
}
Exemplo de retorno 2 (JSON):	
{
	"ERROR": "Você precisa visualizar todos os tópicos anteriores antes de responder a Avaliação Final."
}
Postar respostas de um formulário
Submete as respostas do formulário, de um tópico do curso, para correção.

Status:	OPERACIONAL •
Endpoint:	/api/course/set-form
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado) - isto é usado para verificar a autoria
course_id ID do Curso
topic_index Índice do Tópico (importante: utilize o Índice, não o ID)
responses um objeto JSON das respostas (veja exemplo abaixo)
include_reflections opcional - para incluir Reflexões na árvore de tópicos do curso
include_reactions opcional - para incluir as Avaliações de Reações (se houverem) na árvore de tópicos do curso
Exemplo de 'responses':	
[
	{
		"question_id": 2552,
		"question_response": 3  // 1 até 5, representa "A" até "E"
	},
	{
		"question_id": 2553,
		"question_response": 1  // 1 até 5, representa "A" até "E"
	},
	...
]
Observações Importantes:	
Não é permitido submeter o mesmo formulário mais de 1 vez
Verifique se o usuário preencheu todas as respostas, antes de submeter
No caso de Quiz (formulário comum), o tópico será automaticamente marcado como lido (veja exemplo 1 abaixo), e a API já retornará o ID do próximo tópico em TOPIC_NEXT
No caso da Avaliação Final (final do curso), existem 2 cenários:
Se o usuário passar no teste, o tópico será automaticamente marcado como lido e o curso marcado como finalizado (veja exemplo 2 abaixo)
Se o usuário não passar no teste, a API retornará uma mensagem de ERROR e alguns tópicos para rever no campo TOPICS (veja exemplo 3 abaixo)
Objetos retornados:	SUCCESS em caso de sucesso, isto será uma mensagem literal
Exemplo de retorno 1 (JSON):	
{
	"STATE": 3,
	"SUCCESS": "Avaliação registrada com sucesso!",
	"TOPIC_NEXT": 4,
	"QUESTIONS": {
		"percentage": 75,
		"question_responses": ["a","b","d","c"],
		"user_responses": ["a","b","d","a"]
	}
}
Exemplo de retorno 2 (JSON):	
{
	"STATE": 1,
	"SUCCESS": "Curso concluído com sucesso!"
}
Exemplo de retorno 3 (JSON):	
{
	"STATE": 2,
	"ERROR": "Você não obteve a média mínima na Avaliação Final. Alguns tópicos precisam ser revistos no curso.",
	"TOPIC_NEXT": 17,
	"TOPICS": [
		{
			"topic_index": 17,
			"topic_id": 53619,
			"topic_title": "Título do primeiro tópico marcado para rever...",
			"topic_type": 0,
			"topic_completed": 0,
			"topic_has_attachment": 0,
			"topic_image": "https://../url-da-imagem"
		},
		{
			"topic_index": 21,
			"topic_id": 55011,
			"topic_title": "Título do segundo tópico marcado para rever...",
			"topic_type": 0,
			"topic_completed": 0,
			"topic_has_attachment": 0,
			"topic_image": "https://../url-da-imagem"
		}
		,...
	]
}
Postar pesquisa de satisfação (final do curso)
Submete as resposta do formulário da pesquisa de satisfação.

Status:	OPERACIONAL •
Endpoint:	/api/course/set-survey
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado) - isto é usado para verificar a autoria
course_id ID do Curso
responses um objeto JSON com as respostas (veja exemplo abaixo)
Exemplo de 'responses':	
{
	"recommend": 1,                      // "1" para "Sim"; "0" para "Não"
	"quality": 5,                        // 1 até 5, nota para "Conteúdo do Curso"
	"interactions": 5,                   // 1 até 5, nota para "Interações no Curso"
	"activities": 5,                     // 1 até 5, nota para "Atividades Extras"
	"notifications": 5,                  // 1 até 5, nota para "Notificações/SMS"
	"rewards": 5,                        // 1 até 5, nota para "Programa de Recompensa"
	"artificial_intelligence": 5,        // 1 até 5, nota para "Inteligência Artificial"
	"video": 5,                          // 1 até 5, nota para "Qualidade HD do Vídeo"
	"comment": "Very good course, Thank you"  // comentário livre
}
Objetos retornados:	SUCCESS em caso de sucesso, isto será uma mensagem literal
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Pesquisa registrada com sucesso!"
}
Zerar/cancelar um curso
Reseta ou cancela (para corporativo) um curso do aluno.

Status:	OPERACIONAL •
Endpoint:	/api/course/set-reset
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado) - isto é usado para verificar a autoria
course_id ID do Curso
action opcional - informe 1 (default) para zerar e 2 para cancelar (específico do corporativo)
comment opcional - informe o motivo do cancelamento do curso (obrigatório quando ação for cancelar)
Objetos retornados:	SUCCESS em caso de sucesso, isto será uma mensagem literal
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Curso zerado com sucesso!"
}
Obter lista de alunos online no curso
Retorna lista de usuários que estão fazendo o curso.

Status:	OPERACIONAL •
Endpoint:	/api/course/get-users
Parâmetros:	token Token de acesso a API
course_id ID do Curso
Objetos retornados:	USERS em caso de sucesso, isto será uma lista de usuários
Exemplo de retorno (JSON):	
{
	"USERS": [
		{
			"user_id": 1,
			"user_name": "Camila B.",
			"user_first_name": "Camila",
			"user_image": "https://../url-to-image",
		}
		,...
	]
}
Relatórios
Relatório de desempenho do usuário
Retorna lista de cursos (agrupados por categorias) e a performance do usuário em cada um.

Status:	OPERACIONAL •
Endpoint:	/api/report/get-performance
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado) - isto é usado para verificar a autoria
Objetos retornados:	REPORT em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"REPORT": [
		{
			"category_id": 1,
			"category_title": "Título da Categoria",
			"category_courses": [
				{
					"course_id": 54828,
					"course_title": "Curso de 3D Game Studio...",
					"course_user_completed": 100,
					"course_user_grade": 78
				}
				,...
			]
		}
		,...
]
Relatório de desenvolvimento do usuário
Retorna dados de desempenho do usuário agrupado por seções e fatores comportamentais.

Status:	OPERACIONAL •
Endpoint:	/api/report/get-development
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado) - isto é usado para verificar a autoria
Objetos retornados:	REPORT em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"REPORT": {
		"report_chart": {
			"chart_image": "https://...url-to-image",
			"chart_faq": [
				{
					"faq_title": "Como funciona o gráfico?",
					"faq_description": "O gráfico (radar) analisa as principais..."
				},
				{
					"faq_title": "Como são analisados?",
					"faq_description": "Usando algoritmos avançados de análise..."
				},
				{
					"faq_title": "Entendendo o gráfico",
					"faq_description": "Quando mais próximo do centro..."
				},
			]
		},
		"report_user": {
			"user_score": 80,
			"user_engagement": 75
			"user_performance": 81,
			"user_commitment": 70,
			"user_report_faq": "Texto..."
		},
		"report_behavioral": [
			{
				"behavioral_title": "Liderança e Decisão",
				"behavioral_summary": "Menos provável que você tenha essa característica",
				"behavioral_description": "Esses comportamentos são importantes em cargos...",
				"behavioral_average": 4,
				"behavioral_courses": [
					{
						"course_id": 1,
						"course_title": "Título do Curso...",
						"course_image": "https://...url-to-image"
					}
					,...
				]
			}
			,...
		]
}
Certificados
Obter certificados (Cursos e Trilhas finalizadas)
Retorna a lista de certificados disponíveis para um usuário.

Status:	OPERACIONAL •
Endpoint:	/api/certificate/get-certificates
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário (logado)
user_token Token Privado do Usuário (logado)
Objetos retornados:	COURSES em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"COURSES": [
		{
			"course_id": 391,
			"course_company_id": 1,
			"course_date_conclusion": "2018-04-16 09:26:47",
			"course_date_start": "2018-03-28 14:01:02",
			"course_time_elapsed": 72000,
			"course_title": "Curso de Espanhol - Básico",
			"course_certificate_pdf": "https://../link-certificado",  // no caso do cpf existir
			"course_certificate_personalized": "https://../link-certificado-personalizado",  // se existir certificado personalizado
			"course_user_cpf_exists": 1   // 1 ou 0, existe ou não
		}
		,...
	"TRAILS": [
		{
			"trail_id": 37,
			"trail_title": "Nome da trilha",
			"trail_courses": "id_curso_lista",
			"trail_start": "0000-00-00 00:00:00",
			"trail_conclusion": "2024-07-24 14:16:36",
			"trail_certificate_pdf": "https://../link-certificado"
		}
		,...
	]
}
Nota:
No caso do CPF não existir (course_user_cpf_exists = 0), o PDF do certificado (course_certificate_pdf) não estará disponível. Neste caso, você pode utilizar o método Atualizar perfil do usuário para atualizar a informação do CPF e daí ter acesso aos certificados de forma integral.

Obter certificados de uma Lista de Usuários
Retorna a lista de certificados disponíveis para uma lista de usuários (agrupado por usuário).

Status:	OPERACIONAL •
Endpoint:	/api/certificate/get-certificates-grouped
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário - inteiro ou lista* - o usuário precisa estar associado à sua empresa
* Para enviar uma lista de ID's de usuários, no campo "user_id", você pode utilizar o modelo convencional de array em POST. Exemplo de query-string: user_id[]=1&user_id[]=2...

Objetos retornados:	USERS em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"USERS": [
		{
			"user_id": 391,
			"user_name": "João da Silva",
			"user_email": "joao@silva.com",
			"user_certificates": [
				{
					"course_id": 1,
					"course_company_id": 1,
					"course_date_conclusion": "2018-04-16 09:26:47",
					"course_date_start": "2018-03-28 14:01:02",
					"course_time_elapsed": 72000,
					"course_title": "Curso de Espanhol - Básico",
					"course_certificate_pdf": "https://../link-certificado",  // no caso do cpf existir
					"course_certificate_personalized": "https://../link-certificado-personalizado",  // se existir certificado personalizado
					"course_user_cpf_exists": 1   // 1 ou 0, existe ou não
				}
				,...
			]
		},
		{
			"user_id": 501,
			"user_name": "Amanda Santos",
			"user_email": "amanda@santos.com",
			"user_certificates": [
				{
					"course_id": 1,
					"course_company_id": 1,
					"course_date_conclusion": "2019-04-16 09:26:47",
					"course_date_start": "2019-03-28 14:01:02",
					"course_time_elapsed": 72000,
					"course_title": "Curso de Física",
					"course_certificate_pdf": "https://../link-certificado",  // no caso do cpf existir
					"course_certificate_personalized": "https://../link-certificado-personalizado",  // se existir certificado personalizado
					"course_user_cpf_exists": 1   // 1 ou 0, existe ou não
				}
				,...
			]
		}
		,...
	]
}
Nota:
No caso do CPF não existir (course_user_cpf_exists = 0), o PDF do certificado (course_certificate_pdf) não estará disponível. Neste caso, você pode utilizar o método Atualizar perfil do usuário para atualizar a informação do CPF e daí ter acesso aos certificados de forma integral.

Obter detalhes de um certificado
Retorna os detalhes de um certificado (número) de um aluno.

Status:	OPERACIONAL •
Endpoint:	/api/certificate/get-details
Parâmetros:	token Token de acesso a API
certificate_number o Número do certificado
Objetos retornados:	CERTIFICATE em caso de sucesso, utilize este objeto para manusear os detalhes
Exemplo de retorno (JSON):	
{
	"CERTIFICATE": {
			"certificate_number": 391,
			"certificate_date_start": "2018-03-28 14:01:02",
			"certificate_date_conclusion": "2018-04-16 09:26:47",
			"certificate_time_elapsed": 72000,
			"certificate_user_name": "Nome do Aluno",
			"certificate_course_title": "Curso de Espanhol - Básico"
	}
}
Obter declarações (somente iPED)
Retorna a lista de declarações disponíveis para um usuário.

Status:	OPERACIONAL •
Endpoint:	/api/certificate/get-declarations
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário (logado)
user_token Token Privado do Usuário (logado)
Objetos retornados:	DECLARATIONS em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"DECLARATIONS": [
		{
			"declaration_label": "Declaração de...",
			"declaration_items": [
				{
					"course_id": 391,
					"course_company_id": 1,
					"course_date_conclusion": "2018-04-16 09:26:47",
					"course_date_start": "2018-03-28 14:01:02",
					"course_time_elapsed": 72000,
					"course_title": "Espanhol - Básico",
					"course_declaration_price": "29,90",
					"course_declaration_request_link": "https://...link-to-payment"
				}
				,...
			]
		}
		,...
	]
}
Nota:
No caso do CPF não existir (course_user_cpf_exists = 0), o PDF do certificado (course_certificate_pdf) não estará disponível. Neste caso, você pode utilizar o método Atualizar perfil do usuário para atualizar a informação do CPF e daí ter acesso aos certificados de forma integral.

Reuniões/Aulas
Obter reuniões onde o aluno participa
Retorna a lista de reuniões/aulas onde o aluno foi convidado a participar.

Status:	OPERACIONAL •
Endpoint:	/api/meeting/get-meeting
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário (logado)
user_token Token Privado do Usuário (logado) - isto é usado para verificar a autoria
meeting_id opcional - ID da Reunião, para filtrar por uma reunião específica
Objetos retornados:	MEETING em caso de sucesso, este objeto retornará a lista de reuniões/aulas
Exemplo de retorno (JSON):	
{
	"MEETING": [
		{
			"meeting_id": 79,
			"meeting_company_id": 1,
			"meeting_type": 1,  // 1 = reuniao, 2 = aula
			"meeting_format": 1,  // 1 = online, 2 = presencial
			"meeting_date": "2020-09-08 12:00:00",
			"meeting_duration": "00:30:00",
			"meeting_title": "Reunião do Departamento Financeiro",
			"meeting_instructions": "Instruções/descrição da reunião fornecida pela empresa (opcional)",
			"meeting_has_questions": 1,  // 1 = sim, 0 = nao
			"meeting_qrcode_mandatory": 0,  // 1 = sim, 0 = nao
			"meeting_user_invite_date": "2020-09-08 10:00:00",
			"meeting_user_presence_status": 1,  // confirmou presenca
			"meeting_user_presence_date": "2020-09-08 11:55:00",
			"meeting_user_questions_status": 0,  // nao respondeu questoes
			"meeting_user_questions_date": "0000-00-00 00:00:00"
		}
		,...
	]
}
Marcar presença numa reunião/aula
Marca presença numa reunião/aula que o aluno foi convidado. Caso já tenha marcado presença anteriormente, não sobrescreve a data.

Status:	OPERACIONAL •
Endpoint:	/api/meeting/set-presence
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário (logado)
user_token Token Privado do Usuário (logado) - isto é usado para verificar a autoria
meeting_id ID da Reunião
Objetos retornados:	SUCCESS em caso de sucesso, isto será uma mensagem literal
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Presença registrada com sucesso!"
}
Obter formulário de questões da reunião/aula
Retorna a lista de questões de uma reunião específica.

Status:	OPERACIONAL •
Endpoint:	/api/meeting/get-form
Parâmetros:	token Token de acesso a API
meeting_id o ID da Reunião
Objetos retornados:	QUESTIONS em caso de sucesso, este objeto retornará a lista de questões do quizz
Exemplo de retorno (JSON):	
{
	"QUESTIONS": [
		{
			"question_id": 2552,
			"question_title": "Título da questão...",
			"question_alt_a": "Alternativa A",
			"question_alt_b": "Alternativa B",
			"question_alt_c": "Alternativa C",
			"question_alt_d": "Alternativa D",
			"question_alt_e": "Alternativa E"
		},
		{
			"question_id": 2553,
			"question_title": "Título da questão...",
			"question_alt_a": "Alternativa A",
			"question_alt_b": "Alternativa B",
			"question_alt_c": "Alternativa C",
			"question_alt_d": "Alternativa D",
			"question_alt_e": "Alternativa E"
		}
		,...
	]
}
Postar respostas de um formulário da reunião/aula
Envia a lista de respostas de um formulário da reunião.

Status:	OPERACIONAL •
Endpoint:	/api/meeting/set-form
Parâmetros:	token Token de acesso a API
meeting_id o ID da Reunião
user_id o ID do Usuário (logado)
user_token Token Privado do Usuário (logado) - isto é usado para verificar a autoria
responses um objeto JSON das respostas (veja exemplo abaixo)
Exemplo de 'responses':	
[
	{
		"question_id": 2552,
		"question_response": 3  // 1 até 5, representa "A" até "E"
	},
	{
		"question_id": 2553,
		"question_response": 1  // 1 até 5, representa "A" até "E"
	},
	...
]
Objetos retornados:	SUCCESS em caso de sucesso, isto será uma mensagem literal
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Respostas registradas com sucesso!"
}
Fórums (Perguntas & Respostas)
Obter lista de fórums
Retorna a lista de fórums (grupos de estudo) disponíveis.

Status:	OPERACIONAL •
Endpoint:	/api/forum/get-forums
Parâmetros:	token Token de acesso a API
user_id opcional - apenas Fórums de um Usuário
course_id opcional - Fórum associado com um Curso
forum_id ID do Fórum/Grupo opcional se informado, sobescreve o course_id
query opcional - Efetua uma busca pelo título do fórum
page opcional - número da página atual, padrão = 1
Objetos retornados:	FORUMS em caso de sucesso, utilize este objeto para manusear o resultados (máximo 20 resultados por página)
TOTAL_PAGES total de páginas (para paginação)
CURRENT_PAGE número da página atual (para paginação)
Exemplo de retorno (JSON):	
{
	"TOTAL_PAGES": 37,
	"CURRENT_PAGE": 1,
	"FORUMS": [
		{
			"forum_id": 1,
			"forum_title": "Forum Título (same course title)",
			"forum_description": "Descrição aqui...",
			"forum_image": "https://../url-da-imagem",
			"forum_members": 856,
			"forum_course": {
				"course_id": 1
			}
		}
		,...
	]
}
Obter questões de um fórum
Retorna a lista de perguntas num fórum (grupo de estudo).

Status:	OPERACIONAL •
Endpoint:	/api/forum/get-questions
Parâmetros:	token Token de acesso a API
course_id ID do Curso
forum_id ID do Fórum/Grupo opcional se informado, sobescreve o course_id
user_id opcional - se informado, retornará as últimas questões deste Usuário e descartará o parâmetro course_id
has_answers opcional - para retornar apenas perguntas que tenham respostas
page opcional - número da página atual, padrão = 1
Objetos retornados:	QUESTIONS em caso de sucesso, utilize este objeto para manusear o resultados (max. 20 resuls per page)
TOTAL_PAGES total de páginas (para paginação)
CURRENT_PAGE número da página atual (para paginação)
Exemplo de retorno (JSON):	
{
	"TOTAL_PAGES": 1,
	"CURRENT_PAGE": 1,
	"QUESTIONS": [
		{
			"question_id": 1,
			"question_title": "Sobre texturas...",
			"question_description": "Como funciona o sistema de textura desse software?",
			"question_last_response": "2018-09-28 20:50:09",
			"question_views": 3,
			"question_responses": 0,
			"question_user": {
				"user_id": 1,
				"user_name": "Jonas Sampaio",
				"user_firstname": "Jonas",
				"user_image": "https://../url-da-imagem"
			}
		}
		,...
	]
}
Postar uma questão
Submete uma nova pergunta num fórum (grupo de estudo).

Status:	OPERACIONAL •
Endpoint:	/api/forum/set-question
Parâmetros:	token Token de acesso a API
course_id ID do Curso
user_id o ID do Usuário (logado)
user_token Token Privado do Usuário (logado) - isto é usado para verificar a autoria
title Título da Questão
question Texto da Questão
Objetos retornados:	SUCCESS em caso de sucesso, isto será uma mensagem literal
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Pergunta postada com sucesso!"
}
Remover an question
Efetua exclusão de uma pergunta num fórum (grupo de estudo).

Status:	OPERACIONAL •
Endpoint:	/api/forum/del-question
Parâmetros:	token Token de acesso a API
question_id ID da Questão
user_id o ID do Usuário (logado) - isto é usado para verificar a autoria
user_token Token Privado do Usuário (logado) - isto é usado para verificar a autoria
Objetos retornados:	SUCCESS em caso de sucesso, isto será uma mensagem literal
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Pergunta removida com sucesso!"
}
Obter respostas de uma questão
Retorna lista de respostas de uma pergunta num fórum (grupo de estudo).

Status:	OPERACIONAL •
Endpoint:	/api/forum/get-answers
Parâmetros:	token Token de acesso a API
question_id ID da Questão
Objetos retornados:	QUESTION question
ANSWERS answers
Exemplo de retorno (JSON):	
{
	"QUESTION": {
		"question_id": 1,
		"question_title": "Título da questão...",
		"question_description": "Conteúdo da questão...",
		"question_last_response": "2018-09-28 20:50:09",
		"question_views": 3,
		"question_responses": 0,
		"question_user": {
			"user_id": 1,
			"user_name": "Jonas Sampaio",
			"user_firstname": "Jonas",
			"user_image": "https://../url-da-imagem"
	},
	"ANSWERS": [
		{
			"answer_id": 2,
			"answer_text": "Título da resposta...",
			"answer_best_response": 0,
			"answer_date": "2016-07-19 19:30:04",
			"answer_teacher_id": 0,
			"answer_user": {
				"user_id": 1,
				"user_name": "Ana Santos",
				"user_name_first": "Ana",
				"user_image": "https://../url-da-imagem"
			}
		}
		,...
	]
}
Votar (útil / não útil) numa questão
Submete uma marcação (útil ou não útil) numa resposta do fórum (grupo de estudo).

Status:	OPERACIONAL •
Endpoint:	/api/forum/set-vote
Parâmetros:	token Token de acesso a API
answer_id ID da Resposta
vote para identificar seu Voto: use "1" para "Útil" e "-1" para "Não Útil"
Objetos retornados:	SUCCESS em caso de sucesso, isto será uma mensagem literal
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Voto registrado com sucesso!"
}
Postar uma resposta
Submete uma nova resposta à uma pergunta do fórum (grupo de estudo).

Status:	OPERACIONAL •
Endpoint:	/api/forum/set-answer
Parâmetros:	token Token de acesso a API
question_id ID da Questão
user_id o ID do Usuário (logado)
user_token Token Privado do Usuário (logado) - isto é usado para verificar a autoria
answer Texto da Resposta
Objetos retornados:	SUCCESS em caso de sucesso, isto será uma mensagem literal
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Resposta postada com sucesso!"
}
Remover uma resposta
Efetua a exclusão de uma resposta no fórum (grupo de estudo).

Status:	OPERACIONAL •
Endpoint:	/api/forum/del-answer
Parâmetros:	token Token de acesso a API
answer_id ID da Resposta
user_id o ID do Usuário (logado) - isto é usado para verificar a autoria
user_token Token Privado do Usuário (logado) - isto é usado para verificar a autoria
Objetos retornados:	SUCCESS em caso de sucesso, isto será uma mensagem literal
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Resposta removida com sucesso!"
}
Anotações
Obter anotações de um tópico do curso
Retorna a lista de anotações previamente feitas num tópico do curso.

Status:	OPERACIONAL •
Endpoint:	/api/note/get-notes
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado) - isto é usado para verificar a autoria
topic_id ID do Tópico (do curso)
Objetos retornados:	NOTES em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"NOTES": [
		{
			"note_id": 1,
			"note_text": "Conteúdo da nota...",
			"note_time": "00:00:05",
			"note_time_seconds": 5
		}
		,...
	]
}
Obter anotações de um curso (agrupado por tópicos)
Retorna a lista de anotações de um curso inteiro.

Status:	OPERACIONAL •
Endpoint:	/api/note/get-notes-course
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado) - isto é usado para verificar a autoria
course_id ID do Curso
Objetos retornados:	TOPICS em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"COURSE": {
		"course_id": 2,
		"course_title": "Título do curso...",
		"course_image": "https://../url-da-imagem"
	},
	"TOPICS": [
		{
			"topic_id": 1,
			"topic_title": "Título do tópico...",
			"topic_notes": [
				{
					"note_id": 1,
					"note_text": "Conteúdo da nota...",
					"note_time": "00:00:05",
					"note_time_seconds": 5
				},
				{
					"note_id": 2,
					"note_text": "Conteúdo da nota...",
					"note_time": "00:00:20",
					"note_time_seconds": 20
				}
				,...
			]
		}
		,...
	]
}
Obter cursos que contenham anotações
Retorna a lista de cursos de um usuário que contenham anotações.

Status:	OPERACIONAL •
Endpoint:	/api/note/get-courses
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado) - isto é usado para verificar a autoria
Objetos retornados:	COURSES em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"COURSES": [
		{
			"course_id": 1,
			"course_title": "Título do curso...",
			"course_image": "https://../url-da-imagem",
			"course_notes": 15
		}
		,...
	]
}
Postar uma anotação
Submete uma nova anotação num tópico do curso.

Status:	OPERACIONAL •
Endpoint:	/api/note/set-note
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado) - isto é usado para verificar a autoria
course_id ID do Curso
topic_id ID do Tópico
time Tempo atual do vídeo (formato HH:MM:SS)
text Texto da Anotação (limitado em 140 caracteres)
Objetos retornados:	SUCCESS em caso de sucesso, isto será uma mensagem literal
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Anotação postada com sucesso!"
}
Remover uma anotação
Efetua a exclusão de uma anotação num tópico do curso.

Status:	OPERACIONAL •
Endpoint:	/api/note/del-note
Parâmetros:	token Token de acesso a API
note_id Nota ID
user_id o ID do Usuário - isto é usado para verificar a autoria
user_token Token Privado do Usuário (logado) - isto é usado para verificar a autoria
Objetos retornados:	SUCCESS em caso de sucesso, this will be a literal var
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Anotação removida com sucesso!"
}
Reflexões
Obter reflexões
Retorna a lista de reflexões de um usuário num curso.

Status:	OPERACIONAL •
Endpoint:	/api/reflection/get-reflections
Parâmetros:	token Token de acesso a API
user_id opcional - para filtrar por ID do Usuário
user_token opcional - User Token (no caso de ter informado o user_id)
reflection_id opcional - para filtrar por ID da Reflexão
course_id opcional - para filtrar por ID do Curso
has_no_comments opcional - para mostrar apenas reflexões sem respostas (informe = "1")
has_answers opcional - para retornar apenas perguntas que tenham respostas
page opcional - número da página atual, padrão = 1
all_formats opcional - Informe true se desejar retorna todos os formatos de cursos (não somente vídeo por padrão)
Objetos retornados:	REFLECTIONS em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"REFLECTIONS": [
		{
			"reflection_id": 7534,
			"reflection_course": 590,
			"reflection_topic_index": 5,
			"reflection_stage": 1,
			"reflection_text": "Conteúdo da reflexão...",
			"reflection_date": "2019-04-08 09:21:20",
			"reflection_answered": 0,
			"reflection_user": {
				"user_id": 12345,
				"user_name": "Luciano Gomes",
				"user_first_name": "Luciano",
				"user_image": "https://../url-da-imagem",
				"user_image_small": "https://../url-da-imagem"
			}
		},...
	]
}
Postar uma reflexão
Submete uma nova reflexão num tópico do curso.

Status:	OPERACIONAL •
Endpoint:	/api/reflection/set-reflection
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado)
course_id ID do Curso
topic_index Índice do Tópico (durante o curso)
reflection_text Texto da Reflexão
Objetos retornados:	SUCCESS em caso de sucesso, isto será uma mensagem literal
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Reflexão postada com sucesso!"
}
Avaliar/Comentar uma reflexão
Submete a avaliação de uma reflexão de terceiro num tópico do curso.

Status:	OPERACIONAL •
Endpoint:	/api/reflection/set-comment
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado)
course_id ID do Curso
topic_index Índice do Tópico (durante o curso)
reflection_id ID da Reflexão
comment_grammar Nota para Gramática (utilize valores entre 6 ~ 10)
comment_perception Nota para Percepção (utilize valores entre 6 ~ 10)
comment_understanding Nota para Entendimento (utilize valores entre 6 ~ 10)
comment_text Texto do Comentário
Objetos retornados:	SUCCESS em caso de sucesso, isto será uma mensagem literal
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Avaliação postada com sucesso!"
}
Mensagens
Obter mensagens recebidas
Retorna a lista de mensagens recebidas agrupadas por usuário.

Status:	OPERACIONAL •
Endpoint:	/api/message/get-inbox
Parâmetros:	token Token de acesso a API
user_id - ID do Usuário (logado)
user_token - Token do Usuário (logado)
unread_count opcional - para retornar quantidade de mensagens não lidas
limit opcional - para limitar quantidade de registros
page opcional - número da página atual, padrão = 1
Objetos retornados:	DIALOGUES em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"CONVERSATIONS": [
		{
			"conversation_id": 12345,
			"conversation_unread": true,
			"conversation_description": "Como está indo no curso?",
			"conversation_date": "2024-03-18 10:00:00",
			"conversation_user": {
				"user_id": 12345,
				"user_name": "Luciano Gomes",
				"user_first_name": "Luciano",
				"user_image": "https://...url-to-image.."
			}
		}
		,...
	]
}
Obter conversa com outro usuário
Retorna a lista de mensagens de uma conversa com outro usuário.

Status:	OPERACIONAL •
Endpoint:	/api/message/get-conversation
Parâmetros:	token Token de acesso a API
user_id - ID do Usuário (logado)
user_token - Token do Usuário (logado)
conversation_id - ID da conversa
Objetos retornados:	MESSAGES em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"MESSAGES": [
		{
			"message_description": "Como está indo no curso?",
			"message_date": "2024-03-18 10:00:00",
			"message_user": {
				"user_id": 12345,
				"user_name": "Luciano Gomes",
				"user_first_name": "Luciano",
				"user_image": "https://...url-to-image.."
			}
		},
		{
			"message_description": "Eu gostei. Mas tive dificuldade na etapa de 60%. Perguntei no Fórum sobre isso.",
			"message_date": "2024-03-18 10:20:00",
			"message_user": {
				"user_id": 56789,
				"user_name": "João Silva",
				"user_first_name": "João",
				"user_image": "https://...url-to-image.."
			}
		}
		,...
	]
}
Remover conversa com outro usuário
Remove uma conversa inteira que teve com outro usuário.

Status:	OPERACIONAL •
Endpoint:	/api/message/del-conversation
Parâmetros:	token Token de acesso a API
user_id - ID do Usuário (logado)
user_token - Token do Usuário (logado)
conversation_id - ID da conversa
Objetos retornados:	SUCCESS em caso de sucesso, esta será uma mensagem literal
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Conversa removida com sucesso!"
}
Postar uma mensagem
Registra nova mensagem numa conversa com outro usuário.

Status:	OPERACIONAL •
Endpoint:	/api/message/set-message
Parâmetros:	token Token de acesso a API
user_id - ID do Usuário (logado)
user_token - Token do Usuário (logado)
conversation_id - ID da conversa
message - Mensagem (texto)
Objetos retornados:	SUCCESS em caso de sucesso, esta será uma mensagem literal
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Mensagem enviada com sucesso!"
}
Ranking
Obter ranking - Todo o período
Retorna a lista usuários (top 10) do ranking geral.

Status:	OPERACIONAL •
Endpoint:	/api/ranking/get-ranking-alltime
Parâmetros:	token Token de acesso a API
user_id opcional - para filtrar por um usuário específico
user_only opcional - para retornar somente ranking do usuário ou o Top 10
Objetos retornados:	RANKING em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"RANKING": [
		{
			"user_position": 1,
			"user_id": 1,
			"user_points": 116688,
			"user_name": "Jonas Sampaio",
			"user_image": "https://../url-da-imagem",
			"user_level": {
				"level_name": "Gran Mestre",
				"level_image": "https://../url-da-imagem"
			}
		}
		,...
	]
}
Obter ranking - Somente mês atual
Retorna a lista usuários (top 10) do ranking mensal.

Status:	OPERACIONAL •
Endpoint:	/api/ranking/get-ranking-month
Parâmetros:	token Token de acesso a API
user_id opcional - para filtrar por um usuário específico
user_only opcional - para retornar somente ranking do usuário ou o Top 10
Objetos retornados:	RANKING em caso de sucesso, utilize este objeto para manusear o resultados
MONTH nome do mês
Exemplo de retorno (JSON):	
{
	"MONTH": "Outubro",
	"RANKING": [
		{
			"user_position": 1,
			"user_id": 1,
			"user_points": 116688,
			"user_name": "Jonas Sampaio",
			"user_image": "https://../url-da-imagem",
			"user_level": {
				"level_name": "Gran Mestre",
				"level_image": "https://../url-da-imagem"
			}
		}
		,...
	]
}
Obter ranking de um usuário numa competição - Mês atual
Retorna um sumário para montagem de competição comparando com um usuário.

Status:	OPERACIONAL •
Endpoint:	/api/ranking/get-competition
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
Objetos retornados:	COMPETITION em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"COMPETITION": {
		"summary": {
			"min_points": 0,
			"max_points": 17000,
			"max_points_formatted": "17.000",
			"day_start": "01/04",
			"day_finish": "30/04"
		},
		"user": {
			"id": 123,
			"name": "Patricia",
			"photo": "https://../url-da-imagem",
			"points": 0,
			"points_formatted": "0"
		},
		"friends": {
			"1": {
				"id": 211,
				"name": "André",
				"photo": "https://../url-da-imagem",
				"points": 1900,
				"points_formatted": "1.900"
			},
			"2": {
				"id": 912,
				"name": "Luan",
				"photo": "https://../url-da-imagem",
				"points": 0,
				"points_formatted": "0"
			},
			"3": {
				"id": 581,
				"name": "Pedro",
				"photo": ""https://../url-da-imagem",
				"points": 300,
				"points_formatted": "300"
			}
		}
	}
}
Criar relação de amizade numa competição
Insere novo usuário como amigo numa competição de ranking.

Status:	OPERACIONAL •
Endpoint:	/api/ranking/set-competition
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado)
friend_email E-mail do Amigo (precisa ser de alguém registrado no Sie Edtech, caso contrário retornará um erro - exemplo 2)
friend_id opcional - ID do Amigo (caso não informe o E-mail, e deseje informar diretamente um ID)
friend_number Número do Amigo no Ranking para trocar (1, 2 ou 3)
Objetos retornados:	SUCCESS em caso de sucesso, isto será uma mensagem literal
Exemplo de retorno 1 (JSON):	
{
	"SUCCESS": "Amigo atualizado com sucesso!"
}
Exemplo de retorno 2 (JSON):	
{
	"ERROR": "Nenhum usuário encontrado com este e-mail"
}
Programa de Incentivo
Obter resgates/vouchers de um usuário
Retorna a lista de resgates ou vouchers já disponíveis para um usuário.

Status:	OPERACIONAL •
Endpoint:	/api/reward/get-rewards
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado) - isto é usado para verificar a autoria
month opcional - use "1" para exibir somente do mês atual
Objetos retornados:	REWARDS em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"REWARDS": [
		{
			"reward_id": 1,
			"reward_title": "Ingresso Cinema",
			"reward_description": "Descrição aqui...",
			"reward_date": "2018-10-01",
			"reward_image": "https://../url-da-imagem",
			"reward_redeemed": 1,
			"reward_code": "xyz",
			"reward_pdf": "https://../url-para-pdf"
		},
		{
			"reward_id": 2,
			"reward_title": "Ingresso Cinema",
			"reward_description": "Descrição aqui...",
			"reward_date": "2018-10-01",
			"reward_image": "https://../url-da-imagem",
			"reward_redeemed": 0
		}
		,...
	]
}
Resgatar um prêmio/voucher
Submete resgate de prêmio ou voucher para um usuário.

Status:	OPERACIONAL •
Endpoint:	/api/reward/set-redeem
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado) - isto é usado para verificar a autoria
reward_id ID do Prêmio
type Tipo do Prêmio, use "1" para Cinemark e "2" para Cinepolis
Objetos retornados:	SUCCESS em caso de sucesso, isto será uma mensagem literal
Exemplo de retorno (JSON):	
{
	"SUCCESS": "Prêmio resgatado com sucesso!"
}
Obter lista de prêmios disponíveis e condições
Retorna a lista de prêmios disponíveis no Programa de Incentivo.

Status:	OPERACIONAL •
Endpoint:	/api/reward/get-items
Parâmetros:	token Token de acesso a API
Objetos retornados:	ITEMS em caso de sucesso, utilize este objeto para manusear o resultados
Exemplo de retorno (JSON):	
{
	"WARNING": "Mensagem de aviso, quando o Programa de Incentivo não está habilitado para o aluno. Quando preenchido, os atributos ITEMS e RULES virão como lista vazia.",
	"HOWWORK": "Explicação de como funciona o Programa de Incentivo.",
	"RULES": [
		"Precisa ter no mínimo 2.000 pontos",
		"Premiados apenas o 1º e 2º colocado",
		...
	],
	"ITEMS": [
		{
			"item_id": 1,
			"item_title": "1 Ingresso de Cinema",
			"item_image": "https://../url-da-imagem",
			"item_position": 2,
			"item_condition": "1º lugar do ranking do mês. O prêmio é creditado no mês seguinte.",
		},
		,...
	]
}
Obter lista de níveis do programa de incentivo
Lista os níveis do programa de incentivo com seus atributos.

Status:	OPERACIONAL •
Endpoint:	/api/reward/get-levels
Parâmetros:	token Token de acesso a API
Objetos retornados:	LEVELS em caso de sucesso, retornará lista de níveis do programa
Exemplo de retorno (JSON):	
{
	"LEVELS": [
		{
			"level_name": "Aço",
			"level_image": "https://.../url-to-image",
			"level_points": 3000,
			"level_benefits": []
		},
		{
			"level_name": "Bronze",
			"level_image": "https://.../url-to-image",
			"level_points": 7000,
			"level_benefits": [
				"1 curso premium com carga horária..."
			]
		},
		...
	]
}
Obter extrato de pontos de um usuário
Retorna a lista pontos conquistados do usuário (somente últimos registros).

Status:	OPERACIONAL •
Endpoint:	/api/reward/get-points
Parâmetros:	token Token de acesso a API
user_id o ID do Usuário
user_token Token Privado do Usuário (logado) - isto é usado para verificar a autoria
Objetos retornados:	SUMMARY dados consolidados de pontos do aluno
ITEMS em caso de sucesso, utilize este objeto para manusear o resultados
INSTRUCTIONS instruções de como se ganha ou perde pontos
Exemplo de retorno (JSON):	
{
	"SUMMARY": {
		"user_points": 1200,
		"user_points_current_month": 500
	},
	"ITEMS": [
		{
			"item_description": "Acessou o Curso XYZ...",
			"item_date": "2024-02-22",
			"item_points": 10
		},
		,...
	],
	"INSTRUCTIONS": {
		"gain": [
			"1.000 pontos ao concluir um curso premium *",
			"5 pontos por cada comentário em Atividades Reflexivas relacionadas ao curso **",
			...
		],
		"loss": [
			"-15 pontos por errar uma resposta",
			"-500 pontos ao prorrogar o curso por 5 dias",
			...
		]
	}
}
Cupons
Resgatar um cupom/cartão com Login existente
Resgata um cupom informando E-mail e CPF do usuário.

Status:	OPERACIONAL •
Endpoint:	/api/coupon/redeem-login
Parâmetros:	token Token de acesso a API
coupon Cupom/Cartão
user_email E-mail do Usuário
user_cpf CPF do Usuário
Objetos retornados:	STATE "0" em caso de erro (quando o cupom é inválido ou erro de preenchimento dos campos)
STATE "1" em caso de sucesso (quando usuário existe e o cupom foi resgatado com sucesso; neste caso direcione o usuário para a tela de login)
STATE "2" em caso de erro parcial (quando o cupom é válido, mas o usuário não existe; neste caso o cupom não é resgatado, direcione o usuário para a tela de cadastro completo e utilize o método Resgatar um cupom com cadastro)
SUCCESS em caso de sucesso, isto será uma mensagem literal
ITEMS em caso de sucesso, isto retornará os nomes dos cursos ou pacotes resgatados
Exemplo de retorno 1 (JSON):	
{
	"STATE": 1,
	"SUCCESS": "Cupom resgatado com sucesso!",
	"ITEMS": [
		"Plano Ilimitado"
	],
	"USER_COMPANY": {
		"company_id": 1,
		"company_name": "Nome da Empresa",
		"company_url": "https://www.sie.com.br/url-da-empresa",
		"company_logo": "https://...url-da-imagem",
		"company_header_color": "#ffffff",
		"company_categories_id": "",
		"company_resources": [
			"aulas",	
			"cursos",
			"metas",
			"biblioteca",
			...
		]
	}
	...
}
Exemplo de retorno 2 (JSON):	
{
	"STATE": 2,
	"ERROR": "Este E-mail e CPF não foram localizados. Por favor, efetue um cadastro."
}
Resgatar um cupom/cartão com Cadastro
Resgata um cupom informando dados de um novo usuário.

Status:	OPERACIONAL •
Endpoint:	/api/coupon/redeem-signup
Parâmetros:	token Token de acesso a API
coupon Cupom/Cartão
user_name Nome do Usuário
user_email E-mail do Usuário
user_cpf CPF do Usuário
user_password Senha do Usuário
Objetos retornados:	STATE "0" em caso de erro (quando o cupom é inválido ou erro de preenchimento dos campos)
STATE "1" em caso de sucesso (quando o cadastro foi efetuado e o cupom foi resgatado com sucesso; será retornado todos os dados do usuário para logar automático, similar ao que é retornado no método Login do Usuário)
STATE "2" em caso de sucesso (quando usuário já existe e o cupom foi resgatado; neste caso não são retornados os dados para logar automático, direcione o usuário para a tela de login)
SUCCESS em caso de sucesso, isto será uma mensagem literal
ITEMS em caso de sucesso, isto retornará os nomes dos cursos ou pacotes resgatados
Exemplo de retorno 1 (JSON):	
{
	"STATE": 1,
	"SUCCESS": "Cadastro efetuado e cupom resgatado com sucesso!",
	"ITEMS": [
		"Curso de Administração",
		"Curso de Excel"
	],
	...
	"USER_ID": 1,
	"USER_TOKEN": "82e47251b78187e0acbacf185ec",
	"USER_TYPE": 3,
	"USER_COMPANY": {
		"company_id": 1,
		"company_name": "Nome da Empresa",
		"company_url": "https://www.sie.com.br/url-da-empresa",
		"company_logo": "https://...url-da-imagem",
		"company_header_color": "#ffffff",
		"company_categories_id": "",
		"company_resources": [
			"aulas",	
			"cursos",
			"metas",
			"biblioteca",
			...
		]
	}
	...
}
Exemplo de retorno 2 (JSON):	
{
	"STATE": 2,
	"SUCCESS": "Cupom resgatado com sucesso!",
	"ITEMS": [
		"Curso de Administração",
		"Curso de Excel"
	],
	"USER_COMPANY": {
		"company_id": 1,
		"company_name": "Nome da Empresa",
		"company_url": "https://www.sie.com.br/url-da-empresa",
		"company_logo": "https://...url-da-imagem",
		"company_header_color": "#ffffff",
		"company_categories_id": "",
		"company_resources": [
			"aulas",	
			"cursos",
			"metas",
			"biblioteca",
			...
		]
	}
	...
}
## Atendimento

### Postar um contato

Submete formulário de contato com equipe de atendimento.

- **Status:** `OPERACIONAL •`
- **Endpoint:** `/api/support/set-contact`

#### Parâmetros:
- `token` - Token de acesso à API
- `user_name` - Nome do Usuário
- `user_email` - E-mail do Usuário
- `message` - Mensagem

#### Objetos retornados:
- `SUCCESS` - Em caso de sucesso, mensagem literal
- `CONTACT` - Em caso de sucesso, retorna o número de protocolo

#### Exemplo de retorno (JSON):

```json
{
  "SUCCESS": "Mensagem enviada com sucesso!",
  "CONTACT": {
    "contact_id": 123,
    "contact_response": "Enviaremos a resposta por e-mail em até 1 dia útil."
  }
}
```

---

*Documentoção da API SIE - Sistema Integrado de Ensino*  
*Última atualização: $(date)*

