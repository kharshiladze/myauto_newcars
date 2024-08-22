import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

      // Add a request interceptor to log the full URL
      // axios.interceptors.request.use(request => {
      //   const fullUrl = `${request.baseURL || ''}${request.url}?${new URLSearchParams(request.params).toString()}`;
      //   console.log('Requesting:', fullUrl);
      //   return request;
      // });

const API_URL = 'https://api2.myauto.ge/ka/products';
const FILTERS = {
  TypeID: 0,
  ForRent: 0,
  Mans: '12.336',
  ProdYearFrom: 2002,
  ProdYearTo: 2005,
  CurrencyID: 3,
  MileageType: 1,
  FuelTypes: 3,
  Locs: '2.3.4.7.15.30.113.52.37.48.47.44.41.31.40.39.38.36.53.54.16.14.13.12.11.10.9.8.6.5.55.56.57.59.58.61.62.63.64.66.71.72.74.75.76.77.78.80.81.82.83.84.85.86.87.88.91.96.97.101.109.116.119.122.127.131.133',
  Customs: 1
};

const TELEGRAM_TOKEN = '7532849132:AAFF3OOzhcPqkDXSMYsp7qzav5xsAMMIk7M'; // Replace with your Telegram bot token
const CHAT_ID = '-4535139872'; // Replace with the user's chat ID

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

let storedCarIds = new Map();
let isFirstRun = true;
bot.sendMessage(CHAT_ID, `New car found`);
const fetchCars = async () => {
  try {
    // Initialize page number
    let currentPage = 1;
    let lastPage = 1;

    do {
      // Add the page number to the filters
      const response = await axios.get(API_URL, { params: { ...FILTERS, Page: currentPage } });
      const cars = response.data.data.items;
      const meta = response.data.data.meta;

      //console.log(meta);

      // Update lastPage based on the API response
      lastPage = meta.last_page;


      for (let car of cars) {
        const carId = car.car_id;
        const price = car.price_usd;
        const carUrl = `https://www.myauto.ge/ka/pr/${carId}`;

        if (isFirstRun) {
          // Only save car IDs during the first iteration
          storedCarIds.set(carId, price);
        } else {
          if (!storedCarIds.has(carId)) {
            // New car ID found
            storedCarIds.set(carId, price);
            bot.sendMessage(CHAT_ID, `New car found: ${carUrl}`);
          } else if (storedCarIds.get(carId) != price) {
            // Price change detected
            const previousPrice = storedCarIds.get(carId);
            const priceDifference = price - previousPrice;
            storedCarIds.set(carId, price);
            bot.sendMessage(CHAT_ID, 
              `Price change detected for car: ${carUrl}\n` +
              `Previous Price: $${previousPrice}\n` +
              `Current Price: $${price}\n` +
              `Price Difference: $${priceDifference}`);
          }
        }
      }

      currentPage++; // Move to the next page
    } while (currentPage <= lastPage);
    if (isFirstRun) {
      isFirstRun = false; // Reset the flag after the first successful iteration
    }

  } catch (error) {
    console.error('Error fetching cars:', error.message);
    // Reset to handle as a first run in case of an error
    isFirstRun = true;
    storedCarIds.clear(); // Clear stored car IDs to start fresh
  }
      console.log("started!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

};

// Run the fetch function every 5 minutes
setInterval(fetchCars, 1 * 60 * 1000);

// Initial fetch to populate storedCarIds
fetchCars();
