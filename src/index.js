import 'dotenv/config';
import cron from 'node-cron';
import { checkDrops } from './tasks/check-drops.js';
import { dailySummary } from './tasks/daily-summary.js';

cron.schedule('0 9 * * *', () => {
    console.log('Enviando resumo diário...');
    dailySummary();
});

cron.schedule('0 * * * *', () => {
    console.log('Verificando quedas de preço...');
    checkDrops();
});

dailySummary();
checkDrops();
