import { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function App() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const startEdit = (product) => {
    setEditingId(product.id);
    setName(product.name);
    setSku(product.sku);
    setQuantity(product.stock_quantity);
    setPrice(product.price);
  };
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ totalValue: 0, lowStockCount: 0 });
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' }); const exportPDF = () => {
    const doc = new jsPDF();

    // Заглавие на документа
    doc.text("Справка за наличности в склада", 20, 10);

    // Генериране на таблицата
    const tableColumn = ["Име", "SKU", "Наличност", "Цена (лв)"];
    const tableRows = [];

    products.forEach(p => {
      const productData = [
        p.name,
        p.sku,
        `${p.stock_quantity} бр.`,
        `${Number(p.price).toFixed(2)} лв.`
      ];
      tableRows.push(productData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save(`sklad_report_${new Date().toLocaleDateString()}.pdf`);
  };


  // 1. Функция за взимане на данните (Read)
  const fetchProducts = (search = searchTerm, sort = sortConfig.key, order = sortConfig.direction, currentPage = page) => {
    axios.get(`http://localhost:5000/api/products`, {
      params: { search, sort, order, page: currentPage, limit: 1 }
    })
      .then(res => {
        setProducts(res.data.products);
        setTotalPages(res.data.totalPages);
        setStats(res.data.stats); // Запазваме глобалната статистика
      });
  };

  const requestSort = (key) => {
    const isAsc = sortConfig.key === key && sortConfig.direction === 'asc';
    const direction = isAsc ? 'desc' : 'asc';
    setSortConfig({ key, direction });

    // ВЕДНАГА викаме сървъра с новите параметри
    fetchProducts(searchTerm, key, direction);
  };

  const totalValue = products.reduce((sum, p) => sum + (Number(p.price) * p.stock_quantity), 0);
  const lowStock = products.filter(p => p.stock_quantity < 5).length;

  const cardStyle = {
    backgroundColor: 'black',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    flex: 1,
    textAlign: 'center'
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    fetchProducts(value);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = (id) => {
    if (window.confirm("Сигурен ли си, че искаш да изтриеш този продукт?")) {
      axios.delete(`http://localhost:5000/api/products/${id}`)
        .then(() => fetchProducts()) 
        .catch(err => console.error(err));
    }
  };

  const handleDeleteAll = () => {
    if (window.confirm("ВНИМАНИЕ: Това ще изтрие целия склад! Сигурен ли си?")) {
      axios.delete('http://localhost:5000/api/products-all')
        .then(() => fetchProducts())
        .catch(err => console.error(err));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.length < 3) {
      alert("Името на продукта трябва да е поне 3 символа!");
      return;
    }

    if (price <= 0) {
      alert("Цената трябва да е по-голяма от 0!");
      return;
    }
    const productData = { name, sku, stock_quantity: Number(quantity), price: Number(price) };

    if (editingId) {
      // РЕДАКЦИЯ
      axios.put(`http://localhost:5000/api/products/${editingId}`, productData)
        .then(() => {
          fetchProducts();
          setEditingId(null); // Излизаме от режим на редакция
          setName(''); setSku(''); setQuantity(0); setPrice(0);
        });
    } else {
      // НОВ ЗАПИС
      axios.post('http://localhost:5000/api/products', productData)
        .then(() => {
          fetchProducts();
          setName(''); setSku(''); setQuantity(0); setPrice(0);
        });
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial' }}>
      <h1>📦 ERP Складова Система</h1>

      {/* Форма за добавяне */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Име на продукт" required />
        <input value={sku} onChange={e => setSku(e.target.value)} placeholder="SKU Код" required />
        <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Количество" />
        <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="Цена" />
        <button type="submit">{editingId ? "💾 Запази промените" : "➕ Добави в склада"}</button>
        {editingId && <button onClick={() => { setEditingId(null); setName(''); setSku(''); }}>Отказ</button>}
      </form>

      <button
        onClick={handleDeleteAll}
        style={{ backgroundColor: 'red', color: 'white', marginBottom: '10px', cursor: 'pointer' }}
      >
        🗑️ ИЗТРИЙ ВСИЧКО
      </button>
      <button
        onClick={exportPDF}
        style={{
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '10px 20px',
          marginBottom: '20px',
          cursor: 'pointer',
          border: 'none',
          borderRadius: '5px'
        }}
      >
        📄 Генерирай PDF Отчет
      </button>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="🔍 Търси продукт или SKU..."
          value={searchTerm}
          onChange={handleSearch}
          style={{ padding: '10px', width: '300px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
      </div>
      <div style={{ padding: '20px', backgroundColor: '#7a7a7a', minHeight: '100vh' }}>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
          <div style={cardStyle}>
            <h3>💰 Стойност на целия склад</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {Number(stats.totalValue).toFixed(2)} лв.
            </p>
          </div>
          <div style={cardStyle}>
            <h3>⚠️ Критична наличност (общо)</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'red' }}>
              {stats.lowStockCount} артикула
            </p>
          </div>
        </div>
        <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#000000', color: 'white', cursor: 'pointer' }}>
              <th onClick={() => requestSort('name')}>Име {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '🔼' : '🔽') : ''}</th>
              <th onClick={() => requestSort('sku')}>SKU {sortConfig.key === 'sku' ? (sortConfig.direction === 'asc' ? '🔼' : '🔽') : ''}</th>
              <th onClick={() => requestSort('stock_quantity')}>Наличност {sortConfig.key === 'stock_quantity' ? (sortConfig.direction === 'asc' ? '🔼' : '🔽') : ''}</th>
              <th onClick={() => requestSort('price')}>Цена {sortConfig.key === 'price' ? (sortConfig.direction === 'asc' ? '🔼' : '🔽') : ''}</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => {
              const isLowStock = p.stock_quantity < 5;

              return (
                <tr
                  key={p.id}
                  style={{
                    textAlign: 'center',
                    backgroundColor: isLowStock ? '#ffe6e6' : 'transparent', // По-лек фон за по-добър контраст
                  }}
                >
                  <td style={{ color: 'black' }}>{p.name}</td>
                  <td style={{ color: 'black' }}>{p.sku}</td>
                  <td style={{
                    color: isLowStock ? 'red' : 'black', // Черен текст за нормална наличност
                    fontWeight: isLowStock ? 'bold' : 'normal'
                  }}>
                    {p.stock_quantity} бр. {isLowStock && '⚠️'}
                  </td>
                  <td style={{ color: 'black' }}>{Number(p.price).toFixed(2)} лв.</td>
                  <td>
                    <button onClick={() => startEdit(p)}>Редактирай</button>
                    <button onClick={() => handleDelete(p.id)} style={{ color: 'red', marginLeft: '5px' }}>Изтрий</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <button disabled={page === 1} onClick={() => { setPage(page - 1); fetchProducts(searchTerm, sortConfig.key, sortConfig.direction, page - 1); }}>
            ◀ Предишна
          </button>

          <span>Страница {page} от {totalPages}</span>

          <button disabled={page === totalPages} onClick={() => { setPage(page + 1); fetchProducts(searchTerm, sortConfig.key, sortConfig.direction, page + 1); }}>
            Следваща ▶
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;