'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';

export default function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Recalculate available quota based on cart
  const recalculateQuotaFromCart = (cartState, baseProducts) => {
    return baseProducts.map(product => {
      const item = cartState[product.id];
      const usedQty = item ? item.quantity : 0;
      return {
        ...product,
        quota: product.originalQuota - usedQty,
      };
    });
  };

  // Fetch products and load cart
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('https://fakestoreapi.com/products?limit=10');
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();

        const withQuota = data.map(p => {
          const originalQuota = Math.floor(Math.random() * 5) + 1;
          return { ...p, originalQuota, quota: originalQuota };
        });

        const localCart = JSON.parse(localStorage.getItem('cart') || '{}');
        setCart(localCart);
        const updatedProducts = recalculateQuotaFromCart(localCart, withQuota);
        setProducts(updatedProducts);
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };

    fetchProducts();
  }, []);

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Toggle cart sidebar
  const toggleCartSidebar = () => {
    setIsCartOpen(prev => !prev);
  };

  // Toggle product in cart
  const toggleCart = (product) => {
    setCart(prevCart => {
      const updatedCart = { ...prevCart };

      if (updatedCart[product.id]) {
        delete updatedCart[product.id];
      } else {
        if (product.quota < 1) return prevCart;
        updatedCart[product.id] = { ...product, quantity: 1 };
      }

      const updatedProducts = recalculateQuotaFromCart(updatedCart, products);
      setProducts(updatedProducts);
      return updatedCart;
    });
  };

  // Update quantity and adjust quota
  const updateQuantity = (id, newQty) => {
    if (newQty < 1) return;

    setCart(prevCart => {
      const updatedCart = { ...prevCart };
      const item = updatedCart[id];
      if (!item) return prevCart;

      const product = products.find(p => p.id === id);
      const maxQty = product.originalQuota;

      // Hitung total kuantitas yang digunakan di cart, selain item ini
      const otherUsage = Object.values(updatedCart)
        .filter(i => i.id !== id)
        .reduce((sum, i) => sum + i.quantity, 0);

      const allowed = maxQty - otherUsage;

      if (newQty > allowed) {
        alert(`Maksimum tersedia hanya ${allowed} item untuk produk ini.`);
        return prevCart;
      }

      updatedCart[id].quantity = newQty;
      const updatedProducts = recalculateQuotaFromCart(updatedCart, products);
      setProducts(updatedProducts);
      return updatedCart;
    });
  };

  return (
    <div className="relative p-6 bg-gradient-to-r from-indigo-50 via-pink-100 to-yellow-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-indigo-900">🛍️ Katalog Produk</h1>
        <button onClick={toggleCartSidebar} className="relative">
          <ShoppingCart className="w-8 h-8 text-indigo-700 hover:text-indigo-900 transition" />
          {Object.keys(cart).length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
              {Object.keys(cart).length}
            </span>
          )}
        </button>
      </div>

      {/* Produk */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <div key={product.id} className="border rounded-2xl p-4 shadow-lg hover:shadow-2xl transition duration-300 flex flex-col justify-between bg-white">
            <img src={product.image} alt={product.title} className="h-48 w-full object-contain mb-4" />
            <div className="flex-1">
              <h2 className="font-semibold text-base mb-1 text-gray-800 line-clamp-2 min-h-[48px]">{product.title}</h2>
              <p className="text-teal-600 font-bold mb-1">💲 {product.price}</p>
              <p className="text-sm text-gray-500 mb-4">Sisa Kuota: {product.quota}</p>
            </div>
            <button
              className={`w-full py-2 rounded-xl font-medium transition duration-200 ${product.quota === 0 ? 'bg-gray-300 cursor-not-allowed' : cart[product.id] ? 'bg-red-400 hover:bg-red-500' : 'bg-teal-400 hover:bg-teal-500'} text-white`}
              onClick={() => toggleCart(product)}
              disabled={product.quota === 0}
            >
              {cart[product.id] ? '🗑 Remove from Cart' : '🛒 Add to Cart'}
            </button>
          </div>
        ))}
      </div>

      {/* Sidebar Cart */}
      <div className={`fixed top-0 right-0 w-80 h-screen bg-white shadow-lg p-4 transition-transform transform ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <h2 className="text-xl font-bold text-indigo-900">🛒 Cart</h2>
        {Object.keys(cart).length === 0 ? (
          <p className="text-gray-500 mt-4">Keranjang kosong.</p>
        ) : (
          <div className="space-y-4 mt-4">
            {Object.values(cart).map(item => (
              <div key={item.id} className="flex items-center justify-between border-b py-4">
                <div className="flex items-center gap-4">
                  <img src={item.image} className="h-16 w-16 object-contain" />
                  <div>
                    <p className="font-medium text-sm text-gray-800">{item.title}</p>
                    <p className="text-teal-600 font-semibold">💲 {item.price}</p>
                    <p className="text-sm text-gray-500">Qty:
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                        className="w-16 text-center ml-2 border rounded"
                      />
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleCart(item)}
                  className="text-red-500 hover:text-red-600 font-medium"
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={toggleCartSidebar}
          className="absolute top-2 right-2 text-xl text-gray-600 hover:text-gray-800"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
