const Product = require('../models/productModel');

exports.getProducts = async (req, res) => {
    try {
        const data = await Product.getAll(req.query);
        
        const limit = parseInt(req.query.limit) || 10;
        const totalPages = Math.ceil(data.totalCount / limit);

        res.json({
            products: data.products,
            stats: data.stats,
            totalPages: totalPages || 1
        });
    } catch (err) {
        console.error("Грешка при извличане на продукти:", err);
        res.status(500).json({ error: "Сървърна грешка при извличане на продукти." });
    }
};

exports.createProducts = async (req, res) => {
    const { name, sku, stock_quantity, price } = req.body;

    if (!name || !sku || stock_quantity === undefined || price === undefined) {
        return res.status(400).json({ error: "Всички полета са задължителни!" });
    }

    if (stock_quantity < 0 || price < 0) {
        return res.status(400).json({ error: "Количеството и цената не могат да бъдат под 0!" });
    }

    try {
        const result = await Product.create(req.body);
        res.status(201).json({ message: "Успешно добавен продукт!", id: result.insertId });
    } catch (err) {
        console.error("Грешка при запис:", err);
        res.status(500).json(err);
    }
};

exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await Product.deleteById(id);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Продукт с такова ID не е намерен." });
        }
        res.json({ message: "Продуктът е изтрит!" });
    } catch (err) {
        res.status(500).json(err);
    }
}

exports.deleteAllProducts = async (req, res) => {
    try {
        const result = await Product.deleteAll();
        res.json({ message: `Всички ${result.affectedRows} продукти са изтрити!` });
    } catch (err) {
        res.status(500).json(err);
    }
}

exports.editProduct = async (req, res) => {
    const { id } = req.params;
    const { name, sku, stock_quantity, price } = req.body;

    if (!name || !sku || stock_quantity === undefined || price === undefined) {
        return res.status(400).json({ error: "Всички полета са задължителни!" });
    }
    if (stock_quantity < 0 || price < 0) {
        return res.status(400).json({ error: "Количеството и цената не могат да бъдат под 0!" });
    }

    try {
        const result = await Product.updateById(id, req.body);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Продукт с такова ID не е намерен." });
        }
        res.json({ message: "Продуктът е обновен успешно!" });
    } catch (err) {
        res.status(500).json(err);
    }
}