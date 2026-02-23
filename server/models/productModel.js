const db = require('../config/db');

const Product = {};

Product.getAll = async (options) => {
    const { search = '', sort = 'id', order = 'asc', page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;
    const searchTerm = `%${search}%`;

    const allowedSortColumns = ['id', 'name', 'sku', 'stock_quantity', 'price'];
    const allowedOrderValues = ['asc', 'desc'];
    const safeSort = allowedSortColumns.includes(sort) ? sort : 'id';
    const safeOrder = allowedOrderValues.includes(order.toLowerCase()) ? order : 'asc';

    const statsSql = `SELECT SUM(price * stock_quantity) as totalValue, 
                      COUNT(CASE WHEN stock_quantity < 5 THEN 1 END) as totalLowStock FROM products`;
    
    const countSql = `SELECT COUNT(*) as totalCount FROM products WHERE name LIKE ? OR sku LIKE ?`;
    
    const dataSql = `SELECT * FROM products WHERE name LIKE ? OR sku LIKE ? 
                         ORDER BY ${db.escapeId(safeSort)} ${safeOrder} LIMIT ? OFFSET ?`;

    // Изпълняваме заявките паралелно с Promise.all за по-добра производителност
    const [statsResult] = await db.query(statsSql);
    const [countResult] = await db.query(countSql, [searchTerm, searchTerm]);
    const [products] = await db.query(dataSql, [searchTerm, searchTerm, parseInt(limit), parseInt(offset)]);

    const globalStats = {
        totalValue: statsResult[0].totalValue || 0,
        lowStockCount: statsResult[0].totalLowStock || 0
    };

    return { products, stats: globalStats, totalCount: countResult[0].totalCount };
};

Product.create = async (productData) => {
    const sql = "INSERT INTO products (name, sku, stock_quantity, price) VALUES (?, ?, ?, ?)";
    const { name, sku, stock_quantity, price } = productData;
    const [result] = await db.query(sql, [name, sku, stock_quantity, price]);
    return result;
};

Product.deleteById = async (id) => {
    const sql = "DELETE FROM products WHERE id = ?";
    const [result] = await db.query(sql, [id]);
    return result;
};

Product.deleteAll = async () => {
    const sql = "DELETE FROM products";
    const [result] = await db.query(sql);
    return result;
};

Product.updateById = async (id, productData) => {
    const { name, sku, stock_quantity, price } = productData;
    const sql = "UPDATE products SET name = ?, sku = ?, stock_quantity = ?, price = ? WHERE id = ?";
    const [result] = await db.query(sql, [name, sku, stock_quantity, price, id]);
    return result;
};

module.exports = Product;