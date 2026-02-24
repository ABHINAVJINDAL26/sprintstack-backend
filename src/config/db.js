const mongoose = require('mongoose');
const dns = require('dns');

const withAtlasDnsFallback = async (connectFn) => {
    try {
        return await connectFn();
    } catch (error) {
        const message = error.message || '';
        const isSrvDnsError = message.includes('querySrv') || message.includes('ENOTFOUND') || message.includes('ECONNREFUSED');

        if (!isSrvDnsError) {
            throw error;
        }

        dns.setServers(['8.8.8.8', '1.1.1.1']);
        return await connectFn();
    }
};

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is missing. Add it in backend/.env before starting the server.');
        }

        const conn = await withAtlasDnsFallback(() => mongoose.connect(process.env.MONGO_URI));
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        const message = error.message || 'Unknown MongoDB error';
        console.error(`❌ MongoDB Connection Error: ${message}`);
        if (message.includes('querySrv') || message.includes('ENOTFOUND') || message.includes('ECONNREFUSED')) {
            console.error('ℹ️ Atlas DNS issue detected. Verify internet/DNS, Atlas cluster hostname in MONGO_URI, and Atlas Network Access (allow your IP or 0.0.0.0/0 for testing).');
        }
        process.exit(1);
    }
};

module.exports = connectDB;
