import './config/dotenv.js';
import app from './app.js';
import dbConnection from './config/db.js';
import processHandler from './utils/error/processHandler.js';

const port = process.env.PORT || 3000;

dbConnection();

app.listen(port, () => console.log('Studify is running'));

processHandler();
