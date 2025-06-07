# Price Watcher Scraper

Este é um **scraper simples** em Node.js que monitora preços em sites específicos e envia notificações via Telegram sempre que roda (e de acordo com as suas preferências).

---
## 📦 Estrutura do Projeto

```
price-watcher/
├─ src/
│  ├─ storage/                  # pasta onde o lowest.json será salvo
│  ├─ index.js                  # entrypoint + cron
│  ├─ notifier.js               # envia mensagem no Telegram
│  ├─ scraper.js                # faz o fetch e parse do HTML (Axios + Cheerio)
│  ├─ scraper-puppeteer.js      # faz o fetch via Puppeteer para sites protegidos
│  ├─ products.js               # lista de TARGETS (url + selector + usePuppeteer)
│  └─ storage.js                # lê e grava lowest.json
├─ .env                         # variáveis de ambiente
├─ .gitignore
├─ package.json
└─ README.md
```

---
## 🔧 Dependências

```bash
npm install
```

Instala:
- axios  
- cheerio  
- node-cron  
- node-telegram-bot-api  
- dotenv  
- puppeteer

---
## ⚙️ Configuração (.env)

Crie um arquivo `.env` na raiz com as variáveis:

```ini
# token fornecido pelo BotFather
TELEGRAM_BOT_TOKEN=<SEU_TELEGRAM_BOT_TOKEN>

# chat_id para onde o bot vai enviar (veja abaixo como obter)
TELEGRAM_CHAT_ID=<SEU_CHAT_ID>
```

### Como obter o `TELEGRAM_BOT_TOKEN`

1. Abra o Telegram e converse com o **@BotFather**.  
2. Envie `/newbot` e siga as instruções para criar um bot.  
3. O BotFather retorna o **bot token** (algo como `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`).

### Como obter o `TELEGRAM_CHAT_ID`

1. No Telegram, envie **qualquer** mensagem ao seu bot.  
2. No terminal ou no browser, faça uma requisição:
   ```bash
   curl "https://api.telegram.org/bot<SEU_TELEGRAM_BOT_TOKEN>/getUpdates"
   ```
3. Na resposta JSON, localize o campo `chat":{"id": 123456789}`. Esse é o seu `CHAT_ID`.

---
## 🛠 Products (src/products.js)

O arquivo `products.js` exporta um objeto `CATEGORIES`, cujas chaves são categorias e valores são arrays de objetos com:

- `url`: link completo do produto.  
- `selector`: seletor CSS que aponta para o elemento HTML onde está o preço.  
- `usePuppeteer` (opcional): `true` para usar Puppeteer em lojas que bloqueiam bots; `false` (ou omitido) para usar Axios + Cheerio.

> **Como encontrar o selector**:  
> 1. Abra a página no navegador.  
> 2. Clique com o botão direito sobre o preço e escolha **Inspect**.  
> 3. No DevTools, clique com o botão direito no elemento selecionado e faça **Copy → Copy selector**.  
> 4. Cole o selector no campo `selector`.

```js
// src/products.js
export const CATEGORIES = {
  "Memória Ram": [
    {
      url: 'https://www.kabum.com.br/...',
      selector: '#blocoValores h4',
      usePuppeteer: false
    }
  ],
  "Placa Mãe": [
    {
      url: 'https://www.pichau.com.br/...',
      selector: '.mui-1q2ojdg-price_vista',
      usePuppeteer: true  // precisa Puppeteer devido a bloqueios
    }
  ]
};
```

---
## ⏰ Agendamento (cron)

O agendamento é feito em `src/index.js` por `node-cron`:

```js
import cron from 'node-cron';

// roda sempre no minuto zero de cada hora
cron.schedule('0 * * * *', () => {
  console.log('Verificando preços…');
  checkPrices();
});
```

| Expressão     | Descrição                   |
| ------------- | --------------------------- |
| `0 * * * *`   | a cada hora, no minuto `00` |
| `*/5 * * * *` | a cada 5 minutos            |
| `30 18 * * *` | todo dia às 18:30           |
| `0 9 * * 1-5` | segunda a sexta, às 9h      |

> Para customizar, edite a string do `cron.schedule()` conforme a [sintaxe cron](https://crontab.guru).

---
## ▶️ Como rodar

1. Instale as dependências:  
   ```bash
   npm install
   ```
2. Configure o `.env` (ver acima).  
3. Execute:
   ```bash
   npm start
   ```

O script vai:
- Disparar uma primeira checagem imediata.  
- Agendar novas checagens conforme o cron.

---
## 🚀 Opções de Deploy

Algumas sugestões:

- **PM2** (process manager):
  ```bash
  npm install -g pm2
  pm2 start src/index.js --name price-watcher
  pm2 save
  ```
- **Docker**: monte um `Dockerfile` com Node.js e copie o projeto.  
- **Servidor Cloud** (AWS, GCP, Heroku, Railway, etc.)  

Em produção, lembre-se de:
- Configurar variáveis de ambiente (`.env` ou secrets).  
- Garantir que o processo reinicie em caso de falhas.

---
Qualquer dúvida, fique à vontade para abrir uma issue ou me chamar no Telegram! :)
