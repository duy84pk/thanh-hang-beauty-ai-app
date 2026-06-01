const express = require('express');
const router = express.Router();
const beautyController = require('../controllers/beautyController');
const customerController = require('../controllers/customerController');

// Tuyến đường (Route) mới: Nhận thông số MediaPipe, gọi Claude phân tích và tạo Prompt
router.post('/analyze-face', beautyController.analyzeFaceAndGeneratePrompt);

// Các tuyến đường (Routes) quản lý khách hàng (giữ nguyên)
router.get('/customers', customerController.getAllCustomers);            
router.post('/customers', customerController.createCustomer);            
router.put('/customers/:id', customerController.updateCustomer);    
router.delete('/customers/:id', customerController.deleteCustomer); 

module.exports = router;