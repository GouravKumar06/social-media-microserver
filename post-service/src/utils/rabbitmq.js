
require('dotenv').config();
const amqp = require('amqplib');
const logger = require('./logger');

let connection = null;
let channel = null;

const EXCHANGE_NAME = 'media_exchange';

const connectRabbitMQ = async () => {
    try {
        connection = await amqp.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();

        await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: false });

        logger.info('Connected to RabbitMQ');

        return channel;
    } catch (error) {
        logger.error(`Error connecting to RabbitMQ: ${error.message}`);
    }
}


async function publishEvent(routingKey, message) {
    try {
        if (!channel) {
            await connectRabbitMQ();
        }

        const bufferMessage = Buffer.from(JSON.stringify(message));

        channel.publish(EXCHANGE_NAME, routingKey, bufferMessage);
        logger.info(`Event published to RabbitMQ with routing key: ${routingKey}`);
    } catch (error) {
        logger.error(`Error publishing event to RabbitMQ: ${error.message}`);
    }
}


module.exports = {connectRabbitMQ,publishEvent}