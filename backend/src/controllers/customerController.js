const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../../data');
const dataFile = path.join(dataDir, 'customers.json');

const initDB = () => {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(dataFile)) {
        fs.writeFileSync(dataFile, JSON.stringify([]));
    }
};

const customerController = {
    getAllCustomers: (req, res) => {
        try {
            initDB();
            const data = fs.readFileSync(dataFile, 'utf8');
            const customers = JSON.parse(data);
            return res.status(200).json({ success: true, data: customers.reverse() });
        } catch (error) {
            console.error('[Lỗi Database] Không thể đọc dữ liệu:', error);
            return res.status(500).json({ success: false, message: 'Lỗi khi đọc dữ liệu khách hàng' });
        }
    },

    createCustomer: (req, res) => {
        try {
            initDB();
            const newCustomer = req.body;
            newCustomer.id = Date.now().toString();
            
            const today = new Date();
            newCustomer.date = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
            
            newCustomer.isCalled = false;
            newCustomer.isBirthdayWished = false;

            const data = fs.readFileSync(dataFile, 'utf8');
            const customers = JSON.parse(data);
            
            customers.push(newCustomer);
            fs.writeFileSync(dataFile, JSON.stringify(customers, null, 4));

            return res.status(201).json({ success: true, data: newCustomer });
        } catch (error) {
            console.error('[Lỗi Database] Không thể lưu dữ liệu:', error);
            return res.status(500).json({ success: false, message: 'Lỗi khi lưu khách hàng mới' });
        }
    },
    
    // Đã nâng cấp: Cập nhật MỌI THÔNG TIN (Trạng thái + Sửa hồ sơ)
    updateCustomer: (req, res) => {
        try {
            initDB();
            const { id } = req.params;
            const updateData = req.body;
            
            const data = fs.readFileSync(dataFile, 'utf8');
            let customers = JSON.parse(data);
            
            const index = customers.findIndex(c => c.id === id);
            if (index !== -1) {
                // Hợp nhất dữ liệu cũ và dữ liệu mới gửi lên
                customers[index] = { ...customers[index], ...updateData };
                
                fs.writeFileSync(dataFile, JSON.stringify(customers, null, 4));
                return res.status(200).json({ success: true, data: customers[index] });
            }
            return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng này' });
        } catch (error) {
            console.error('[Lỗi Database] Không thể cập nhật:', error);
            return res.status(500).json({ success: false, message: 'Lỗi khi cập nhật' });
        }
    },

    // MỚI: Tính năng Xóa
    deleteCustomer: (req, res) => {
        try {
            initDB();
            const { id } = req.params;
            
            const data = fs.readFileSync(dataFile, 'utf8');
            let customers = JSON.parse(data);
            
            // Lọc bỏ khách hàng có ID trùng khớp
            customers = customers.filter(c => c.id !== id);
            
            fs.writeFileSync(dataFile, JSON.stringify(customers, null, 4));
            return res.status(200).json({ success: true, message: 'Đã xóa khách hàng thành công' });
        } catch (error) {
            console.error('[Lỗi Database] Không thể xóa:', error);
            return res.status(500).json({ success: false, message: 'Lỗi khi xóa khách hàng' });
        }
    }
};

module.exports = customerController;