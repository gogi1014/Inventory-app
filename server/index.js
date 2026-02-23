const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/productRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Всички пътища, започващи с /api/products, отиват в productRoutes
app.use('/api/products', productRoutes);

const PORT = 5000;
app.listen(PORT, () => console.log(`MVC Сървърът работи на ${PORT}`));