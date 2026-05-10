// import React, { useState } from 'react'
// import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
// import {
//   LayoutDashboard, Package, ShoppingCart, Truck, BarChart3, Bot, ChevronRight
// } from 'lucide-react'

// import Dashboard from "./Dashboard.jsx";
// import Products from "./Products.jsx";
// import Orders from "./Orders.jsx";
// import Cargo from "./Cargo.jsx";
// import Inventory from "./Inventory.jsx";
// import client from "./client.js"
// const navItems = [
//   { path: '/', label: 'Dashboard', icon: LayoutDashboard },
//   { path: '/orders', label: 'Siparişler', icon: ShoppingCart },
//   { path: '/products', label: 'Ürünler', icon: Package },
//   { path: '/cargo', label: 'Kargo', icon: Truck },
//   { path: '/inventory', label: 'Envanter', icon: BarChart3 },
// ]

// function Sidebar() {
//   const location = useLocation()
//   return (
//     <aside className="sidebar">
//       <div className="sidebar-brand">
//         <div className="brand-logo">KOBİ·AI</div>
//         <div className="brand-sub">İş Yönetim Platformu</div>
//       </div>

//       <nav className="sidebar-nav">
//         <span className="nav-section-label">Yönetim</span>
//         {navItems.map(({ path, label, icon: Icon }) => (
//           <NavLink
//             key={path}
//             to={path}
//             end={path === '/'}
//             className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
//           >
//             <Icon size={16} />
//             {label}
//           </NavLink>
//         ))}

//         <span className="nav-section-label">Yapay Zeka</span>
//         <NavLink
//           to="/ai"
//           className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
//         >
//           <Bot size={16} />
//           AI Asistan
//         </NavLink>
//       </nav>

//       <div className="sidebar-footer">
//         <div style={{ marginBottom: 2, color: 'var(--accent)', fontWeight: 700 }}>YZTA 5.0</div>
//         <div>Hackathon Projesi</div>
//         <div style={{ marginTop: 4 }}>FastAPI + React</div>
//       </div>
//     </aside>
//   )
// }

// export default function App() {
//   return (
//     <BrowserRouter>
//       <div className="app-layout">
//         <Sidebar />
//         <main className="main-content">
//           <Routes>
//             <Route path="/" element={<Dashboard />} />
//             <Route path="/products" element={<Products />} />
//             <Route path="/orders" element={<Orders />} />
//             <Route path="/cargo" element={<Cargo />} />
//             <Route path="/inventory" element={<Inventory />} />
//             <Route path="/ai" element={<AIAssistant />} />
//           </Routes>
//         </main>
//       </div>
//     </BrowserRouter>
//   )
// }



import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./Dashboard.jsx";
import Products from "./Products.jsx";
import Orders from "./Orders.jsx";
import Cargo from "./Cargo.jsx";
import Inventory from "./Inventory.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/cargo" element={<Cargo />} />
        <Route path="/inventory" element={<Inventory />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;