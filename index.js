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
const userState = {}; // { userId: { mode: "USD", rate: 470 } }

// === Главное меню ===
function mainMenu(ctx) {
  ctx.reply(
    "Выберите валюту:",
    Markup.keyboard([["USD → KZT"], ["EUR → KZT"], ["RUB → KZT"]])
      .resize()
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
    userState[ctx.from.id] = { mode: "USD", rate: parseFloat(rate) };
    ctx.reply(
      `💵 1 USD = ${rate} ₸\nВведите сумму в USD или нажмите "Назад"`,
      Markup.keyboard([["🔙 Назад"]]).resize()
    );
  }
});

bot.hears("EUR → KZT", async (ctx) => {
  const rate = await getRate("EUR");
  if (rate) {
    userState[ctx.from.id] = { mode: "EUR", rate: parseFloat(rate) };
    ctx.reply(
      `💶 1 EUR = ${rate} ₸\nВведите сумму в EUR или нажмите "Назад"`,
      Markup.keyboard([["🔙 Назад"]]).resize()
    );
  }
});

bot.hears("RUB → KZT", async (ctx) => {
  const rate = await getRate("RUB");
  if (rate) {
    userState[ctx.from.id] = { mode: "RUB", rate: parseFloat(rate) };
    ctx.reply(
      `🇷🇺 1 RUB = ${rate} ₸\nВведите сумму в RUB или нажмите "Назад"`,
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
    const input = ctx.message.text.replace(",", "."); // поддержка запятой
    const amount = parseFloat(input);

    if (!isNaN(amount)) {
      const { mode, rate } = userState[userId];
      const result = (amount * rate).toFixed(2);
      ctx.reply(
        `${amount} ${mode} = ${result} ₸`,
        Markup.keyboard([["🔙 Назад"]]).resize()
      );
    } else {
      ctx.reply("Введите число, например: 100");
    }
  }
});

// === Запуск бота ===
bot.launch();
console.log("🤖 Бот запущен...");
