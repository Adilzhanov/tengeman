import { Telegraf, Markup } from "telegraf";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

const BOT_TOKEN = "8160146527:AAHfmAJ_iQFNfCrhIf6KZsqefGxCGT_ymeo";
const bot = new Telegraf(BOT_TOKEN);

// === Получение курса ===
async function getRate(code = "USD") {
  try {
    const url = "https://nationalbank.kz/rss/rates_all.xml";
    const response = await axios.get(url);
    const parser = new XMLParser();
    const data = parser.parse(response.data);
    const items = data.rss.channel.item;

    const currency = items.find((item) => item.title === code);
    if (currency) {
      return parseFloat(currency.description).toFixed(2);
    } else {
      return null;
    }
  } catch (error) {
    console.error("Ошибка API НБРК:", error.message);
    return null;
  }
}

// === Состояния пользователей ===
const userState = {}; 
// { userId: { mode: "USD", rate: 470, direction: "toKZT"|"fromKZT" } }

// === Главное меню ===
async function mainMenu(ctx) {
  const usd = await getRate("USD");
  const eur = await getRate("EUR");
  const rub = await getRate("RUB");

  ctx.reply(
    `Курсы на сегодня:\n💵 USD = ${usd} ₸\n💶 EUR = ${eur} ₸\n🇷🇺 RUB = ${rub} ₸`,
    Markup.keyboard([["USD → KZT"], ["EUR → KZT"], ["RUB → KZT"], ["🔄 Калькулятор"]]).resize()
  );
}

// === Команда /start ===
bot.start((ctx) => {
  mainMenu(ctx);
});

// === Обработка выбора валют ===
bot.hears("USD → KZT", async (ctx) => {
  const rate = await getRate("USD");
  if (rate) {
    userState[ctx.from.id] = { mode: "USD", rate: parseFloat(rate), direction: "toKZT" };
    ctx.reply(
      `💵 1 USD = ${rate} ₸\nВведите сумму в USD:`,
      Markup.keyboard([["🔙 Назад"]]).resize()
    );
  }
});

bot.hears("EUR → KZT", async (ctx) => {
  const rate = await getRate("EUR");
  if (rate) {
    userState[ctx.from.id] = { mode: "EUR", rate: parseFloat(rate), direction: "toKZT" };
    ctx.reply(
      `💶 1 EUR = ${rate} ₸\nВведите сумму в EUR:`,
      Markup.keyboard([["🔙 Назад"]]).resize()
    );
  }
});

bot.hears("RUB → KZT", async (ctx) => {
  const rate = await getRate("RUB");
  if (rate) {
    userState[ctx.from.id] = { mode: "RUB", rate: parseFloat(rate), direction: "toKZT" };
    ctx.reply(
      `🇷🇺 1 RUB = ${rate} ₸\nВведите сумму в RUB:`,
      Markup.keyboard([["🔙 Назад"]]).resize()
    );
  }
});

// === Раздел калькулятора ===
bot.hears("🔄 Калькулятор", (ctx) => {
  ctx.reply(
    "Выберите режим:",
    Markup.keyboard([["Валюта → Тенге"], ["Тенге → Валюта"], ["🔙 Назад"]]).resize()
  );
});

// === Выбор направления ===
bot.hears("Валюта → Тенге", (ctx) => {
  ctx.reply(
    "Выберите валюту:",
    Markup.keyboard([["USD → KZT"], ["EUR → KZT"], ["RUB → KZT"], ["🔙 Назад"]]).resize()
  );
});

bot.hears("Тенге → Валюта", (ctx) => {
  ctx.reply(
    "Выберите валюту для пересчёта:",
    Markup.keyboard([["KZT → USD"], ["KZT → EUR"], ["KZT → RUB"], ["🔙 Назад"]]).resize()
  );
});

// === Обратные конверсии ===
bot.hears("KZT → USD", async (ctx) => {
  const rate = await getRate("USD");
  if (rate) {
    userState[ctx.from.id] = { mode: "USD", rate: parseFloat(rate), direction: "fromKZT" };
    ctx.reply(
      `💵 1 USD = ${rate} ₸\nВведите сумму в тенге:`,
      Markup.keyboard([["🔙 Назад"]]).resize()
    );
  }
});

bot.hears("KZT → EUR", async (ctx) => {
  const rate = await getRate("EUR");
  if (rate) {
    userState[ctx.from.id] = { mode: "EUR", rate: parseFloat(rate), direction: "fromKZT" };
    ctx.reply(
      `💶 1 EUR = ${rate} ₸\nВведите сумму в тенге:`,
      Markup.keyboard([["🔙 Назад"]]).resize()
    );
  }
});

bot.hears("KZT → RUB", async (ctx) => {
  const rate = await getRate("RUB");
  if (rate) {
    userState[ctx.from.id] = { mode: "RUB", rate: parseFloat(rate), direction: "fromKZT" };
    ctx.reply(
      `🇷🇺 1 RUB = ${rate} ₸\nВведите сумму в тенге:`,
      Markup.keyboard([["🔙 Назад"]]).resize()
    );
  }
});

// === Назад в главное меню ===
bot.hears("🔙 Назад", (ctx) => {
  delete userState[ctx.from.id];
  mainMenu(ctx);
});

// === Обработка ввода числа ===
bot.on("text", (ctx) => {
  const userId = ctx.from.id;
  if (userState[userId]) {
    const input = ctx.message.text.replace(",", ".");
    const amount = parseFloat(input);

    if (!isNaN(amount)) {
      const { mode, rate, direction } = userState[userId];
      let result;

      if (direction === "toKZT") {
        result = (amount * rate).toFixed(2);
        ctx.reply(`${amount} ${mode} = ${result} ₸`);
      } else if (direction === "fromKZT") {
        result = (amount / rate).toFixed(2);
        ctx.reply(`${amount} ₸ = ${result} ${mode}`);
      }
    } else {
      ctx.reply("Введите число, например: 100");
    }
  }
});

// === Запуск бота ===
bot.launch();
console.log("🤖 Бот запущен...");
