import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, X, Plus, Minus, Star, Menu } from 'lucide-react';

// FAKE STORE API URL
const API_URL = 'https://fakestoreapi.com/products';

// Bootstrap CSS is loaded via CDN in the HTML head
const bootstrapStyles = `
<link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/js/bootstrap.bundle.min.js"></script>
<style>
  .product-card {
    transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
  }
  .product-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  }
  .product-image {
    height: 200px;
    object-fit: contain;
    padding: 15px;
  }
  .cart-sidebar {
    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    width: 400px;
    max-width: 100vw;
    background: white;
    z-index: 1055;
    transform: translateX(100%);
    transition: transform 0.3s ease-in-out;
  }
  .cart-sidebar.show {
    transform: translateX(0);
  }
  .cart-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 1050;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
  }
  .cart-overlay.show {
    opacity: 1;
    visibility: visible;
  }
  .navbar-brand {
    font-weight: 700;
    color: #6366f1 !important;
  }
  .btn-primary {
    background-color: #6366f1;
    border-color: #6366f1;
  }
  .btn-primary:hover {
    background-color: #4f46e5;
    border-color: #4f46e5;
  }
  .cart-item-img {
    width: 80px;
    height: 80px;
    object-fit: contain;
    padding: 5px;
  }
  .loading-spinner {
    width: 4rem;
    height: 4rem;
    border: 4px solid #e5e7eb;
    border-top: 4px solid #6366f1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .sticky-top {
    top: 0 !important;
  }
</style>
`;

// Main App Component
const App = () => {
    // Add Bootstrap CSS to head
    useEffect(() => {
        const head = document.head;
        const bootstrapLink = document.createElement('link');
        bootstrapLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css';
        bootstrapLink.rel = 'stylesheet';
        
        const bootstrapScript = document.createElement('script');
        bootstrapScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/js/bootstrap.bundle.min.js';
        
        const styleElement = document.createElement('style');
        styleElement.innerHTML = bootstrapStyles.match(/<style>(.*?)<\/style>/s)[1];
        
        head.appendChild(bootstrapLink);
        head.appendChild(bootstrapScript);
        head.appendChild(styleElement);
        
        return () => {
            head.removeChild(bootstrapLink);
            head.removeChild(bootstrapScript);
            head.removeChild(styleElement);
        };
    }, []);

    // State management
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Fetch products from API on component mount
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch(API_URL);
                if (!response.ok) {
                    throw new Error('Something went wrong!');
                }
                const data = await response.json();
                setProducts(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, []);

    // Cart logic functions
    const addToCart = (product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevCart, { ...product, quantity: 1 }];
        });
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            setCart(prevCart =>
                prevCart.map(item =>
                    item.id === productId ? { ...item, quantity: newQuantity } : item
                )
            );
        }
    };

    const removeFromCart = (productId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    };
    
    // Memoized cart calculations
    const cartCount = useMemo(() => {
        return cart.reduce((count, item) => count + item.quantity, 0);
    }, [cart]);

    const cartTotal = useMemo(() => {
        return cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);
    }, [cart]);

    return (
        <div className="bg-light min-vh-100">
            <Header cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} />
            <main className="container-fluid py-4">
                <div className="container">
                    <h1 className="display-4 fw-bold text-dark mb-4">Products</h1>
                    {isLoading && <LoadingSpinner />}
                    {error && <div className="alert alert-danger text-center">{error}</div>}
                    {!isLoading && !error && (
                        <ProductGrid products={products} onAddToCart={addToCart} />
                    )}
                </div>
            </main>
            <CartSidebar 
                isOpen={isCartOpen} 
                onClose={() => setIsCartOpen(false)} 
                cartItems={cart} 
                onUpdateQuantity={updateQuantity}
                onRemoveFromCart={removeFromCart}
                cartTotal={cartTotal}
            />
            <Footer />
        </div>
    );
};

// Header Component
const Header = ({ cartCount, onCartClick }) => (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
        <div className="container">
            <a className="navbar-brand d-flex align-items-center" href="#">
                <ShoppingCart className="me-2" size={24} />
                <span>Shopify</span>
            </a>
            
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span className="navbar-toggler-icon"></span>
            </button>
            
            <div className="collapse navbar-collapse" id="navbarNav">
                <ul className="navbar-nav me-auto">
                    <li className="nav-item">
                        <a className="nav-link" href="#">Home</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#">Deals</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#">New Arrivals</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#">Categories</a>
                    </li>
                </ul>
                
                <button onClick={onCartClick} className="btn btn-outline-primary position-relative">
                    <ShoppingCart size={20} />
                    {cartCount > 0 && (
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                            {cartCount}
                        </span>
                    )}
                </button>
            </div>
        </div>
    </nav>
);

// Product Grid Component
const ProductGrid = ({ products, onAddToCart }) => (
    <div className="row g-4">
        {products.map(product => (
            <div key={product.id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                <ProductCard product={product} onAddToCart={onAddToCart} />
            </div>
        ))}
    </div>
);

// Product Card Component
const ProductCard = ({ product, onAddToCart }) => {
    const { title, price, image, category, rating } = product;

    return (
        <div className="card h-100 product-card border-0 shadow-sm">
            <div className="position-relative" style={{paddingTop: '100%'}}>
                <img 
                    src={image} 
                    alt={title} 
                    className="position-absolute top-0 start-0 w-100 h-100 product-image"
                />
            </div>
            <div className="card-body d-flex flex-column">
                <span className="badge bg-primary text-uppercase small mb-2 align-self-start">{category}</span>
                <h5 className="card-title fw-semibold" style={{height: '3rem', overflow: 'hidden'}}>
                    {title}
                </h5>
                <div className="d-flex justify-content-between align-items-center mt-auto mb-3">
                    <h4 className="fw-bold text-dark mb-0">${price.toFixed(2)}</h4>
                    {rating && (
                        <div className="d-flex align-items-center">
                            <Star className="text-warning me-1" size={16} fill="currentColor" />
                            <small className="text-muted fw-medium">
                                {rating.rate} ({rating.count})
                            </small>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => onAddToCart(product)}
                    className="btn btn-primary w-100 fw-semibold"
                >
                    Add to Cart
                </button>
            </div>
        </div>
    );
};

// Cart Sidebar Component
const CartSidebar = ({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveFromCart, cartTotal }) => {
    return (
        <>
            <div className={`cart-overlay ${isOpen ? 'show' : ''}`} onClick={onClose}></div>
            <div className={`cart-sidebar shadow-lg ${isOpen ? 'show' : ''}`}>
                <div className="d-flex flex-column h-100">
                    <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                        <h4 className="fw-bold mb-0">Shopping Cart</h4>
                        <button onClick={onClose} className="btn btn-outline-secondary btn-sm rounded-circle p-2">
                            <X size={18} />
                        </button>
                    </div>

                    {cartItems.length === 0 ? (
                        <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center text-center p-4">
                            <ShoppingCart size={80} className="text-muted mb-3" />
                            <h5 className="fw-semibold text-secondary">Your cart is empty</h5>
                            <p className="text-muted">Add some products to get started.</p>
                        </div>
                    ) : (
                        <div className="flex-grow-1 overflow-auto p-3">
                            {cartItems.map(item => (
                                <CartItem 
                                    key={item.id} 
                                    item={item} 
                                    onUpdateQuantity={onUpdateQuantity}
                                    onRemoveFromCart={onRemoveFromCart}
                                />
                            ))}
                        </div>
                    )}
                    
                    {cartItems.length > 0 && (
                        <div className="p-3 border-top">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="fw-bold mb-0">Subtotal</h5>
                                <h5 className="fw-bold mb-0">${cartTotal}</h5>
                            </div>
                            <button className="btn btn-primary w-100 fw-semibold py-2">
                                Proceed to Checkout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

// Cart Item Component
const CartItem = ({ item, onUpdateQuantity, onRemoveFromCart }) => (
    <div className="d-flex align-items-center mb-3 pb-3 border-bottom">
        <div className="bg-light rounded me-3 flex-shrink-0">
            <img src={item.image} alt={item.title} className="cart-item-img" />
        </div>
        <div className="flex-grow-1 me-2">
            <h6 className="fw-semibold mb-1 small">{item.title}</h6>
            <h5 className="fw-bold text-dark mb-2">${(item.price * item.quantity).toFixed(2)}</h5>
            <div className="d-flex align-items-center">
                <button 
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} 
                    className="btn btn-outline-secondary btn-sm rounded-circle p-1 me-2"
                >
                    <Minus size={14} />
                </button>
                <span className="fw-medium mx-2">{item.quantity}</span>
                <button 
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} 
                    className="btn btn-outline-secondary btn-sm rounded-circle p-1 ms-2"
                >
                    <Plus size={14} />
                </button>
            </div>
        </div>
        <button 
            onClick={() => onRemoveFromCart(item.id)} 
            className="btn btn-outline-danger btn-sm rounded-circle p-2"
        >
            <X size={16} />
        </button>
    </div>
);

// Loading Spinner Component
const LoadingSpinner = () => (
    <div className="d-flex justify-content-center align-items-center" style={{height: '300px'}}>
        <div className="loading-spinner"></div>
    </div>
);

// Footer Component
const Footer = () => (
    <footer className="bg-white border-top mt-5">
        <div className="container py-4 text-center text-muted">
            <p className="mb-1">&copy; {new Date().getFullYear()} Shopify. All rights reserved.</p>
            <p className="small">A React & Bootstrap CSS Demo App.</p>
        </div>
    </footer>
);

export default App;