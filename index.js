import { Telegraf, Markup } from "telegraf";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

// 🔑 токен твоего телеграм-бота
const BOT_TOKEN = "8160146527:AAHfmAJ_iQFNfCrhIf6KZsqefGxCGT_ymeo";
const bot = new Telegraf(BOT_TOKEN);

// === Функция для получения курса из НБРК ===
async function getRate(code = "USD") {
  try {
    const url = "https://nationalbank.kz/rss/rates_all.xml";
    const response = await axios.get(url);

    const parser = new XMLParser();
    const data = parser.parse(response.data);

    const items = data.rss.channel.item;

    // Находим валюту по коду
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

// === Команда /start ===
bot.start((ctx) => {
  ctx.reply(
    "Привет! 👋 Я TENGEMAN BOT.\nВыберите валюту:",
    Markup.keyboard([["USD → KZT"], ["EUR → KZT"], ["RUB → KZT"]])
      .resize()
      .oneTime()
  );
});

// === Обработка кнопок ===
bot.hears("USD → KZT", async (ctx) => {
  const rate = await getRate("USD");
  ctx.reply(rate ? `💵 1 USD = ${rate} ₸` : "Ошибка получения курса.");
});

bot.hears("EUR → KZT", async (ctx) => {
  const rate = await getRate("EUR");
  ctx.reply(rate ? `💶 1 EUR = ${rate} ₸` : "Ошибка получения курса.");
});

bot.hears("RUB → KZT", async (ctx) => {
  const rate = await getRate("RUB");
  ctx.reply(rate ? `🇷🇺 1 RUB = ${rate} ₸` : "Ошибка получения курса.");
});

// === Запуск бота ===
bot.launch();
console.log("🤖 Бот запущен...");
