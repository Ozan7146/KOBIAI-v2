import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  useLocation,
} from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  BarChart3,
} from "lucide-react";

import Dashboard from "./Dashboard.jsx";
import Products from "./Products.jsx";
import Orders from "./Orders.jsx";
import Cargo from "./Cargo.jsx";
import Inventory from "./Inventory.jsx";

const navItems = [
  { path: "/", label: "Yönetim Paneli", icon: LayoutDashboard },
  { path: "/orders", label: "Siparişler", icon: ShoppingCart },
  { path: "/products", label: "Ürün Yönetimi", icon: Package },
  { path: "/cargo", label: "Kargo & Lojistik", icon: Truck },
  { path: "/inventory", label: "Stok & Envanter", icon: BarChart3 },
];

function Sidebar() {
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isExpanded = !isMobile && isHovered;
  const sidebarWidth = isMobile ? "100%" : isExpanded ? "240px" : "80px";

  return (
    <aside
      className="sidebar"
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      style={{
        width: sidebarWidth,
        height: isMobile ? "70px" : "100vh",
        transition: "all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)",
        position: isMobile ? "fixed" : "relative",
        bottom: isMobile ? "0" : "auto",
        top: isMobile ? "auto" : "0",
        left: "0",
        zIndex: 1050,
        background: "var(--bg-card)",
        borderRight: isMobile ? "none" : "1px solid var(--border)",
        borderTop: isMobile ? "1px solid var(--border)" : "none",
        display: "flex",
        flexDirection: isMobile ? "row" : "column",
        boxShadow: isExpanded ? "10px 0 30px rgba(0,0,0,0.3)" : "none",
        padding: isMobile ? "0 10px" : "0",
      }}
    >
      {!isMobile && (
        <div
          className="sidebar-brand"
          style={{
            padding: "24px 0 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: isExpanded ? "flex-start" : "center",
            paddingLeft: isExpanded ? "20px" : "0",
            width: "100%",
          }}
        >
          <div
            className="brand-logo"
            style={{
              fontSize: isExpanded ? "20px" : "18px",
              whiteSpace: "nowrap",
              color: "var(--accent)",
              fontFamily: "var(--font-display)",
            }}
          >
            {isExpanded ? "KOBİ·AI" : "K·AI"}
          </div>
          <div
            style={{
              fontSize: "9px",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginTop: "4px",
              whiteSpace: "nowrap",
              opacity: isExpanded ? 1 : 0,
              display: isExpanded ? "block" : "none",
            }}
          >
            Akıllı Operasyon Merkezi
          </div>
        </div>
      )}

      <nav
        className="sidebar-nav"
        style={{
          flex: 1,
          padding: isMobile ? "0" : "16px 12px",
          display: "flex",
          flexDirection: isMobile ? "row" : "column",
          justifyContent: isMobile ? "space-around" : "flex-start",
          alignItems: isMobile ? "center" : "stretch",
          gap: isMobile ? "0" : "8px",
          overflow: "hidden",
        }}
      >
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            style={({ isActive }) => ({
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: "center",
              justifyContent: isMobile
                ? "center"
                : isExpanded
                  ? "flex-start"
                  : "center",
              padding: isMobile ? "8px" : "12px",
              borderRadius: "var(--radius-sm)",
              textDecoration: "none",
              transition: "all 0.2s ease",
              background: isActive ? "var(--accent-glow)" : "transparent",
              color: isActive ? "var(--accent)" : "var(--text-secondary)",
              borderLeft:
                !isMobile && isExpanded && isActive
                  ? "2px solid var(--accent)"
                  : "none",
              borderBottom:
                isMobile && isActive ? "2px solid var(--accent)" : "none",
              width: "100%",
              gap: isMobile ? "4px" : "0",
            })}
          >
            <div
              style={{
                width: isMobile ? "auto" : "24px",
                display: "flex",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={isMobile ? 20 : 18} />
            </div>
            <span
              style={{
                marginLeft: isMobile ? "0" : isExpanded ? "12px" : "0",
                fontSize: isMobile ? "10px" : "14px",
                fontWeight: "500",
                opacity: isExpanded || isMobile ? 1 : 0,
                display: isExpanded || isMobile ? "block" : "none",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
          </NavLink>
        ))}
      </nav>

      {!isMobile && isExpanded && (
        <div
          className="sidebar-footer"
          style={{
            padding: "20px",
            borderTop: "1px solid var(--border)",
            fontSize: "10px",
            color: "var(--text-muted)",
          }}
        >
          <div style={{ color: "var(--accent)", fontWeight: "700" }}>
            KOBI-AI
          </div>
          <div style={{ marginTop: "2px" }}>Akıllı Operasyon Merkezi</div>
        </div>
      )}
    </aside>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div
        className="app-layout"
        style={{
          display: "flex",
          flexDirection: "row",
          minHeight: "100vh",
          background: "var(--bg)",
        }}
      >
        <Sidebar />
        <main
          className="main-content"
          style={{
            flex: 1,
            height: "100vh",
            overflowY: "auto",
            paddingBottom: window.innerWidth <= 900 ? "80px" : "0",
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/cargo" element={<Cargo />} />
            <Route path="/inventory" element={<Inventory />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
