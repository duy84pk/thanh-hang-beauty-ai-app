const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes/api');

const app = express();

// Cấu hình Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Khai báo Routes
app.use('/api/v1', apiRoutes);

// Xử lý route không tồn tại
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'API Route not found' });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`[Backend] Server đang chạy tại http://localhost:${PORT}`);
});