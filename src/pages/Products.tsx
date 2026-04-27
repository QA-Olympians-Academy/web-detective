import { useState } from 'react'

interface Product {
  id: number
  name: string
  category: string
  price: number
  stock: number
  status: 'in-stock' | 'low-stock' | 'out-of-stock'
  sku: string
}

const PRODUCTS: Product[] = [
  { id: 1,  name: 'Wireless Noise-Cancelling Headphones', category: 'Electronics', price: 299.99, stock: 142, status: 'in-stock',     sku: 'ELC-001' },
  { id: 2,  name: 'Ergonomic Office Chair',               category: 'Furniture',   price: 449.00, stock: 38,  status: 'in-stock',     sku: 'FRN-002' },
  { id: 3,  name: 'Mechanical Keyboard (TKL)',            category: 'Electronics', price: 129.95, stock: 7,   status: 'low-stock',    sku: 'ELC-003' },
  { id: 4,  name: 'Stainless Steel Water Bottle',        category: 'Lifestyle',   price: 34.99,  stock: 0,   status: 'out-of-stock', sku: 'LST-004' },
  { id: 5,  name: 'LED Desk Lamp',                       category: 'Furniture',   price: 59.99,  stock: 95,  status: 'in-stock',     sku: 'FRN-005' },
  { id: 6,  name: 'USB-C Hub (7-in-1)',                  category: 'Electronics', price: 49.99,  stock: 214, status: 'in-stock',     sku: 'ELC-006' },
  { id: 7,  name: 'Premium Yoga Mat',                    category: 'Fitness',     price: 79.00,  stock: 4,   status: 'low-stock',    sku: 'FIT-007' },
  { id: 8,  name: '4K Webcam',                           category: 'Electronics', price: 199.99, stock: 52,  status: 'in-stock',     sku: 'ELC-008' },
  { id: 9,  name: 'Bamboo Cutting Board Set',            category: 'Kitchen',     price: 42.50,  stock: 0,   status: 'out-of-stock', sku: 'KTC-009' },
  { id: 10, name: 'Foam Roller',                         category: 'Fitness',     price: 27.99,  stock: 130, status: 'in-stock',     sku: 'FIT-010' },
  { id: 11, name: 'Laptop Stand (Adjustable)',           category: 'Electronics', price: 64.99,  stock: 6,   status: 'low-stock',    sku: 'ELC-011' },
  { id: 12, name: 'Cast Iron Skillet',                   category: 'Kitchen',     price: 54.95,  stock: 77,  status: 'in-stock',     sku: 'KTC-012' },
  { id: 13, name: 'Resistance Band Set',                 category: 'Fitness',     price: 22.99,  stock: 189, status: 'in-stock',     sku: 'FIT-013' },
  { id: 14, name: 'Smart Plug (4-pack)',                 category: 'Electronics', price: 39.99,  stock: 0,   status: 'out-of-stock', sku: 'ELC-014' },
  { id: 15, name: 'Ceramic Coffee Mug Set',              category: 'Kitchen',     price: 31.00,  stock: 60,  status: 'in-stock',     sku: 'KTC-015' },
]

const STATUS_LABEL: Record<Product['status'], string> = {
  'in-stock':     'In Stock',
  'low-stock':    'Low Stock',
  'out-of-stock': 'Out of Stock',
}

export default function Products() {
  const [query, setQuery] = useState('')

  const filtered = PRODUCTS.filter((p) => {
    const q = query.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    )
  })

  return (
    <>
      <div className="page-header">
        <h2>Products</h2>
        <p>Manage your product inventory.</p>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <h3>All Products ({filtered.length})</h3>
          <input
            className="table-search"
            type="search"
            placeholder="Search by name, category or SKU…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 24px' }}>
                    No products match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr key={product.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#9ca3af' }}>
                      {product.sku}
                    </td>
                    <td style={{ fontWeight: 600, color: '#16213e' }}>{product.name}</td>
                    <td>
                      <span
                        style={{
                          background: '#f0f2f5',
                          padding: '2px 10px',
                          borderRadius: 20,
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          color: '#4b5563',
                        }}
                      >
                        {product.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#0f3460' }}>
                      ${product.price.toFixed(2)}
                    </td>
                    <td>{product.stock.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${product.status}`}>
                        {STATUS_LABEL[product.status]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          Showing {filtered.length} of {PRODUCTS.length} products
        </div>
      </div>
    </>
  )
}
