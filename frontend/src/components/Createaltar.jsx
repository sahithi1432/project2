import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Rnd } from "react-rnd";
import html2canvas from "html2canvas";
import { wallAPI } from "../services/api";
import { altarCategories } from '../assets/altarItems';
import { subscriptionAPI } from '../services/api';
import { useAlert } from '../context/AlertContext';
import { getErrorMessage } from '../utils/errorHandler';
import { logout, goHome, handleClickOutside } from '../utils/authUtils.js';
import './Createaltar.css';

// Function to fix image paths from saved altar data
const fixImagePaths = (wallData) => {
  if (!wallData) return wallData;

  // Dynamically create a mapping of old paths to new imported URLs for all items
  const pathMapping = {};
  altarCategories.forEach(cat => {
    cat.items.forEach(item => {
      // Try to extract the filename from the imported src
      if (item.src && typeof item.src === 'string') {
        // Support both .png, .jpg, .jpeg, .webp
        const match = item.src.match(/\/defaults\/(.+\.(png|jpg|jpeg|webp))/);
        if (match) {
          const relPath = `/src/assets/defaults/${match[1]}`;
          pathMapping[relPath] = item.src;
        }
      }
    });
  });

  // Fix wall background
  if (wallData.wallBg && pathMapping[wallData.wallBg]) {
    wallData.wallBg = pathMapping[wallData.wallBg];
  }

  // Fix images
  if (wallData.images) {
    if (Array.isArray(wallData.images)) {
      wallData.images = wallData.images.map(img => ({
        ...img,
        src: pathMapping[img.src] || img.src
      }));
    } else if (typeof wallData.images === 'object') {
      Object.keys(wallData.images).forEach(key => {
        if (wallData.images[key].src && pathMapping[wallData.images[key].src]) {
          wallData.images[key].src = pathMapping[wallData.images[key].src];
        }
      });
    }
  }

  return wallData;
};

function Createaltar({ editModeShare = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [showWallProps, setShowWallProps] = useState(false);
  const [showImageProps, setShowImageProps] = useState(false);
  const { editToken: routeEditToken } = useParams();
  const { showSuccess, showError, showWarning, showInfo } = useAlert();

  // Check for editToken in both route params and query params
  const urlParams = new URLSearchParams(location.search);
  const queryEditToken = urlParams.get('editToken');
  const editToken = routeEditToken || queryEditToken;

  // Subscription check
  const [subscription, setSubscription] = useState(null);
  const [subLoading, setSubLoading] = useState(true);
  // Track how many items of each category the user has added
  const [usedItems, setUsedItems] = useState({
    'Background': 0,
    'Tables': 0,
    'Frames': 0,
    'Garlands': 0,
    'Wall Garlands': 0,
    'Candles': 0,
    'Bouquets': 0,
    'Fruits': 0
  });

  useEffect(() => {
    subscriptionAPI.getSubscription().then(sub => {
      setSubscription(sub);
      setSubLoading(false);
    });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) {
      // Always redirect to Login with correct 'from' state for all unauthenticated access
      navigate('/Login', { state: { from: location }, replace: true });
      return;
    }
    // Load altar from navigation state if present
    const altar = location.state?.altar;
    if (altar && altar.wall_data) {
      const wallData = typeof altar.wall_data === 'string' ? JSON.parse(altar.wall_data) : altar.wall_data;
      // Fix image paths for loaded altar data
      const fixedWallData = fixImagePaths(wallData);
      setwidth(fixedWallData.width || 800);
      setheight(fixedWallData.height || 500);
      setcolor(fixedWallData.color || "#f8fafc");
      setWallBg(fixedWallData.wallBg || null);
      setshape(fixedWallData.shape || "rectangle");
      setImgWidth(fixedWallData.imgwidth || 100);
      setImgHeight(fixedWallData.imgheight || 100);
      // Fix: handle both array and object for images
      let imgObj = {};
      if (Array.isArray(fixedWallData.images)) {
        fixedWallData.images.forEach((img, idx) => {
          imgObj[idx] = { ...img };
        });
      } else if (typeof fixedWallData.images === 'object' && fixedWallData.images !== null) {
        imgObj = { ...fixedWallData.images };
      }
      setImages(imgObj);
      setAltarId(altar.id || null);
      setWallName(altar.wall_name || ''); // <-- set wallName from loaded altar
    }
  }, [navigate, location.state]);

  useEffect(() => {
    if (editToken) {
      // Load altar by edit token for shared edit mode (automatically enable edit mode)
      wallAPI.getDesignByEditToken(editToken).then((altar) => {
        if (altar && altar.wall_data) {
          const wallData = typeof altar.wall_data === 'string' ? JSON.parse(altar.wall_data) : altar.wall_data;
          // Fix image paths for loaded altar data
          const fixedWallData = fixImagePaths(wallData);
          setwidth(fixedWallData.width || 800);
          setheight(fixedWallData.height || 500);
          setcolor(fixedWallData.color || "#f8fafc");
          setWallBg(fixedWallData.wallBg || null);
          setshape(fixedWallData.shape || "rectangle");
          setImgWidth(fixedWallData.imgwidth || 100);
          setImgHeight(fixedWallData.imgheight || 100);
          // Fix: handle both array and object for images
          let imgObj = {};
          if (Array.isArray(fixedWallData.images)) {
            fixedWallData.images.forEach((img, idx) => {
              imgObj[idx] = { ...img };
            });
          } else if (typeof fixedWallData.images === 'object' && fixedWallData.images !== null) {
            imgObj = { ...fixedWallData.images };
          }
          setImages(imgObj);
          setAltarId(altar.id || null);
          setWallName(altar.wall_name || '');
        }
      });
    }
  }, [editModeShare, editToken]);

  useEffect(() => {
    const clickHandler = handleClickOutside(menuRef, menuOpen, setMenuOpen);
    if (menuOpen) {
      document.addEventListener('mousedown', clickHandler);
    } else {
      document.removeEventListener('mousedown', clickHandler);
    }
    return () => {
      document.removeEventListener('mousedown', clickHandler);
    };
  }, [menuOpen]);



  const handleLogout = () => logout(navigate);

  const [width, setwidth] = useState(800);
  const [height, setheight] = useState(500);
  const [color, setcolor] = useState("#f8fafc");
  // Change images state from array to object
  const [images, setImages] = useState({});
  const [imgwidth, setImgWidth] = useState(100);
  const [imgheight, setImgHeight] = useState(100);
  const [shape, setshape] = useState("rectangle");
  const [wallBg, setWallBg] = useState(null);
  // Change default expandedCategory to null so no menu is open by default
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    imageIndex: null,
  });
  // Add selectedImageKey state
  const [selectedImageKey, setSelectedImageKey] = useState(null);
  // Add altarId state
  const [altarId, setAltarId] = useState(null);
  // Add wallName state
  const [wallName, setWallName] = useState('');
  const [showUpgradeMsg, setShowUpgradeMsg] = useState(false);

  useEffect(() => {
    const handleClick = () => setContextMenu(c => ({ ...c, visible: false }));
    if (contextMenu.visible) {
      window.addEventListener("click", handleClick);
      return () => window.removeEventListener("click", handleClick);
    }
  }, [contextMenu.visible]);

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // When adding a new image (single or multiple), assign z property
  const handleAddImage = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await fileToBase64(file);
      const key = Date.now() + Math.random();
      const maxZ = Math.max(0, ...Object.values(images).map(img => img.z || 0));
      setImages(prev => ({
        ...prev,
        [key]: { src: base64, x: 10, y: 10, w: imgwidth, h: imgheight, shape: "rectangle", z: maxZ + 1 }
      }));
    }
    e.target.value = "";
  };

  const handleChangeShape = (newShape) => {
    setImages(prev => ({
      ...prev,
      [contextMenu.imageIndex]: {
        ...prev[contextMenu.imageIndex],
        shape: newShape
      }
    }));
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleDeleteImage = () => {
    setImages(prev => {
      const updated = { ...prev };
      delete updated[contextMenu.imageIndex];
      return updated;
    });
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleDeleteBackground = () => {
    setWallBg(null);
  };

  const handledownload = async () => {
    const node = document.getElementById("altar-canvas");
    if (!node) return;
    const canvas = await html2canvas(node);
    const link = document.createElement("a");
    link.download = "my decor.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    alert("Downloaded successfully");
  };

  const handleSaveAltar = async () => {
    try {
      showInfo('saving');
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        showError('Please login first to save your altar. User data not found.');
        return;
      }

      // Prepare altar data
      const wallData = {
        width,
        height,
        color,
        wallBg: wallBg || null,
        images: Object.values(images)
          .sort((a, b) => (a.z || 0) - (b.z || 0))
          .map(img => ({
            x: img.x,
            y: img.y,
            w: img.w,
            h: img.h,
            shape: img.shape,
            src: img.src && !img.src.startsWith('blob:') ? img.src : null,
            z: img.z || 0
          })),
        shape,
        imgwidth,
        imgheight,
        timestamp: new Date().toISOString()
      };

      let interest = '';
      let finalWallName = wallName;

      if (altarId) {
        interest = (typeof location.state?.altar?.wall_data === 'string'
          ? JSON.parse(location.state?.altar?.wall_data).interest
          : location.state?.altar?.wall_data?.interest) || '';
      } else {
        let newName = prompt('Enter a name for your altar:', '');
        if (!newName || newName.trim() === '') {
          showWarning('Please enter a valid name for your altar');
          return;
        }
        finalWallName = newName.trim();
        setWallName(finalWallName);
        interest = prompt('Enter a theme or interest for your altar (optional):', '');
      }

      // If editToken is present, this is a shared edit - save to both sender and receiver
      if (editToken) {
        // Save to sender's altar (by editToken)
        await wallAPI.updateDesignByEditToken(editToken, {
          wallName: finalWallName.trim(),
          wallData: { ...wallData, interest: interest || '' }
        });
        // Save a copy to receiver's DB (current user)
        await wallAPI.saveDesign({
          userId: user.id,
          wallName: finalWallName.trim() + ' (Shared Edit)',
          wallData: { ...wallData, interest: interest || '' }
        });
        showSuccess('Altar saved for both sender and receiver!');
        return;
      }

      // Normal save logic
      const requestData = {
        userId: user.id,
        wallName: finalWallName.trim(),
        wallData: { ...wallData, interest: interest || '' }
      };
      if (altarId) {
        await wallAPI.updateDesign(altarId, requestData);
        showSuccess('altarSave');
      } else {
        await wallAPI.saveDesign(requestData);
        showSuccess('altarSave');
      }
    } catch (error) {
      console.error('Error saving altar:', error);
      const errorMessage = getErrorMessage(error);
      showError(errorMessage);
    }
  };

  const handleNewAltar = () => {
    if (window.confirm('Start a new altar? This will clear your current design.')) {
      setwidth(800);
      setheight(500);
      setcolor('#f8fafc');
      setImages({});
      setImgWidth(100);
      setImgHeight(100);
      setshape('rectangle');
      setWallBg(null);
      setAltarId(null); // Clear altarId when starting a new altar
      setWallName(''); // Clear wallName when starting a new altar
    }
  };

  const getShapeStyle = (shape) => {
    if (shape === "circle") return { borderRadius: "50%" };
    if (shape === "ellipse") return { borderRadius: "50% / 40%" };
    if (shape === "rounded") return { borderRadius: 20 };
    return { borderRadius: 0 };
  };

  // Get user and check if admin
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAuthenticated = user && user.id;
  const isAdmin = user.role === 'admin';

  // Overlay control handlers (object-based, not array)
  // Replace bringForward/sendBackward with click-to-front logic
  const handleImageClick = (key) => {
    setSelectedImageKey(key);
    setImages(prev => {
      const maxZ = Math.max(0, ...Object.values(prev).map(img => img.z || 0));
      return {
        ...prev,
        [key]: { ...prev[key], z: maxZ + 1 }
      };
    });
  };

  // Check if subscription is expired
  const isExpired = subscription && subscription.expiry_date && new Date(subscription.expiry_date) < new Date();

  if (subLoading) return <div>Loading...</div>;
  if (!isAuthenticated) {
    // Fallback UI if router protection is missing
    return (
      <div style={{ maxWidth: 500, margin: '60px auto', padding: 32, background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px rgba(59,130,246,0.08)', textAlign: 'center' }}>
        <h2 style={{ color: '#2563eb', marginBottom: 16 }}>Please Login</h2>
        <p style={{ color: '#334155', fontSize: '1.1rem', marginBottom: 24 }}>
          You must be logged in to edit or create an altar.<br/>
        </p>
        <button onClick={() => navigate('/Login', { state: { from: location } })} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontSize: '1rem', cursor: 'pointer', marginRight: 12 }}>
          Login
        </button>
        <button onClick={() => navigate('/Signup', { state: { from: location } })} style={{ background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 6, padding: '10px 24px', fontSize: '1rem', cursor: 'pointer' }}>
          Sign Up
        </button>
      </div>
    );
  }
  if (isExpired) {
    return (
      <div style={{ maxWidth: 500, margin: '60px auto', padding: 32, background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px rgba(59,130,246,0.08)', textAlign: 'center' }}>
        <h2 style={{ color: '#ef4444', marginBottom: 16 }}>Your plan has expired!</h2>
        <p style={{ color: '#334155', fontSize: '1.1rem', marginBottom: 24 }}>
          Your subscription expired on <b>{new Date(subscription.expiry_date).toLocaleDateString()}</b>.<br/>
          Please recharge your subscription to create new altars.
        </p>
        <button onClick={() => navigate('/subscription')} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontSize: '1rem', cursor: 'pointer' }}>
          Go to Subscription Page
        </button>
      </div>
    );
  }

  return (
    <div className="createaltar-container">
      {/* Menu Icon */}
      <div className="menu-container">
        <button
          className="menu-icon"
          aria-label="Menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span>&#9776;</span>
        </button>
        {menuOpen && (
          <div ref={menuRef} className="menu-dropdown">
            <ul>
              <li>
                <button onClick={() => { setMenuOpen(false); goHome(navigate); }}>🏠 Home</button>
              </li>
              {isAdmin && (
                <li>
                  <button onClick={() => { setMenuOpen(false); navigate('/admin'); }}>⚙️ Admin Panel</button>
                </li>
              )}
              <li>
                <button onClick={() => { setMenuOpen(false); navigate('/profile'); }}>👤 Profile</button>
              </li>
              <li>
                <button onClick={() => { setMenuOpen(false); handleLogout(); }}>🚪 Logout</button>
              </li>
            </ul>
          </div>
        )}
      </div>
      {/* Sidebar */}
      <div className="createaltar-sidebar">
        {/* Wall Properties */}
        <div className="createaltar-properties-card">
          <div 
            className="createaltar-properties-title"
            style={{ cursor: 'pointer' }}
            onClick={() => setShowWallProps(!showWallProps)}
          >
            <span role="img" aria-label="wall">🖼️</span> Wall Properties
            <span style={{ marginLeft: 'auto' }}>{showWallProps ? '▾' : '▸'}</span>
          </div>
          {showWallProps && (
            <>
              <div className="createaltar-property-row">
                <label>Width:</label>
                <input type="number" value={width} onChange={e => setwidth(Number(e.target.value))} required />
              </div>
              <div className="createaltar-property-row">
                <label>Height:</label>
                <input type="number" value={height} onChange={e => setheight(Number(e.target.value))} required />
              </div>
              <div className="createaltar-property-row">
                <label>Color:</label>
                <input type="color" value={color} onChange={e => setcolor(e.target.value)} required style={{ padding: 0, width: 48, height: 32 }} />
              </div>
            </>
          )}
        </div>

        {/* Custom Background Upload for Premium Members */}
        <div className="createaltar-properties-card upload-background-card">
          <input
            id="upload-background-input"
            type="file"
            accept="image/*"
            className="createaltar-hidden-input"
            onChange={async e => {
              const file = e.target.files[0];
              if (file) {
                try {
                  const base64 = await fileToBase64(file);
                  setWallBg(base64);
                  showSuccess('Custom background uploaded successfully!');
                } catch (error) {
                  console.error('Error uploading background:', error);
                  showError('Failed to upload background. Please try again.');
                }
              }
            }}
          />
          <label 
            htmlFor="upload-background-input" 
            className="upload-background-label"
            onClick={(e) => {
              // Check if user is on free plan
              if (subscription?.subscription_plan === 'free') {
                e.preventDefault(); // Prevent file dialog from opening
                setShowUpgradeMsg(true);
                return;
              }
            }}
          >
            <span role="img" aria-label="upload background" className="upload-background-icon">🎨</span>
            <span>Upload Custom Background</span>
            <span className="premium-badge">Premium</span>
          </label>
        </div>

        {/* Image Properties */}
        <div className="createaltar-properties-card">
          <div 
            className="createaltar-properties-title"
            style={{ cursor: 'pointer' }}
            onClick={() => setShowImageProps(!showImageProps)}
          >
            <span role="img" aria-label="image">🖼️</span> Image Properties
            <span style={{ marginLeft: 'auto' }}>{showImageProps ? '▾' : '▸'}</span>
          </div>
          {showImageProps && (
            <>
              <div className="createaltar-property-row">
                <label>Width:</label>
                <input type="number" value={imgwidth} onChange={e => setImgWidth(Number(e.target.value))} min={10} max={1000} />
              </div>
              <div className="createaltar-property-row">
                <label>Height:</label>
                <input type="number" value={imgheight} onChange={e => setImgHeight(Number(e.target.value))} min={10} max={1000} />
              </div>
              <div className="createaltar-property-row">
                <label>Shape:</label>
                <select value={shape} onChange={e => setshape(e.target.value)}>
                  <option value="rectangle">Rectangle</option>
                  <option value="circle">Circle</option>
                  <option value="ellipse">Oval</option>
                  <option value="rounded">Rounded rectangle</option>
                </select>
              </div>
            </>
          )}
        </div>
        {/* Upload images input (styled as card-label) */}
        <div className="createaltar-properties-card upload-image-card">
          <input
            id="upload-image-input"
            type="file"
            multiple
            accept="image/*"
            className="createaltar-hidden-input"
            onChange={async e => {
              const files = Array.from(e.target.files);
              if (files.length > 0) {
                const gap = 10;
                let x = 10;
                const y = 10;
                let newImages = {};
                const maxZ = Math.max(0, ...Object.values(images).map(img => img.z || 0));
                for (let i = 0; i < files.length; i++) {
                  const file = files[i];
                  const base64 = await fileToBase64(file);
                  const key = Date.now() + Math.random() + i;
                  newImages[key] = {
                    src: base64,
                    x,
                    y,
                    w: imgwidth,
                    h: imgheight,
                    shape: shape,
                    z: maxZ + 1 + i
                  };
                  x += imgwidth + gap;
                }
                setImages(prev => ({ ...prev, ...newImages }));
              }
            }}
          />
          <label htmlFor="upload-image-input" className="upload-image-label">
            <span role="img" aria-label="upload" className="upload-image-icon">📤</span>
            <span>Upload Images</span>
          </label>
        </div>
        {/* Categories */}
        {altarCategories.map((cat, idx) => (
          <div key={cat.name} className="createaltar-category">
            <div
              className="createaltar-category-header"
              onClick={() => setExpandedCategory(expandedCategory === cat.name ? null : cat.name)}
            >
              {cat.name}
                             {subscription?.subscription_plan === 'free' && (
                 <span className="free-plan-indicator">
                   {(() => {
                     const freePlanLimits = {
                       'Background': 5,
                       'Tables': 2,
                       'Frames': 2,
                       'Garlands': 2,
                       'Wall Garlands': 1,
                       'Candles': 2,
                       'Bouquets': 2,
                       'Fruits': 1
                     };
                     const limit = freePlanLimits[cat.name] || 0;
                     const used = usedItems[cat.name] || 0;
                     const remaining = limit - used;
                     return limit > 0 ? ` (${remaining} remaining)` : '';
                   })()}
                 </span>
               )}
              <span>{expandedCategory === cat.name ? '▾' : '▸'}</span>
            </div>
            {expandedCategory === cat.name && (
              <div className="createaltar-category-content">
                {cat.items.map((item, i) => (
                  <div key={item.name} className="createaltar-item" onClick={() => {
                    // Free plan restrictions: check if user has reached their limit for this category
                    if (subscription?.subscription_plan === 'free') {
                      const freePlanLimits = {
                        'Background': 5, // All backgrounds available
                        'Tables': 2,     // Only 2 tables total
                        'Frames': 2,     // Only 2 frames total
                        'Garlands': 2,   // Only 2 garlands total
                        'Wall Garlands': 1, // Only 1 wall garland
                        'Candles': 2,    // Only 2 candles total
                        'Bouquets': 2,   // Only 2 bouquets total
                        'Fruits': 1      // Only 1 fruit
                      };
                      
                      const categoryLimit = freePlanLimits[cat.name] || 0;
                      const currentUsed = usedItems[cat.name] || 0;
                      
                      if (currentUsed >= categoryLimit) {
                        setShowUpgradeMsg(true);
                        return;
                      }
                    }
                    
                    // Add the item
                    if (cat.name === 'Background') {
                      setWallBg(item.src);
                    } else {
                        const key = Date.now() + Math.random() + i;
                        const maxZ = Math.max(0, ...Object.values(images).map(img => img.z || 0));
                        setImages(prev => ({
                          ...prev,
                          [key]: { src: item.src, x: 10, y: 10, w: imgwidth, h: imgheight, shape: shape, z: maxZ + 1 }
                        }));
                        
                        // Increment the used count for this category (only for free users)
                        if (subscription?.subscription_plan === 'free') {
                          setUsedItems(prev => ({
                            ...prev,
                            [cat.name]: (prev[cat.name] || 0) + 1
                          }));
                        }
                    }
                  }}>
                    <img src={item.src} alt={item.name} style={{ 
                      filter: subscription?.subscription_plan === 'free' && 
                      (() => {
                        const freePlanLimits = {
                          'Background': 5,
                          'Tables': 2,
                          'Frames': 2,
                          'Garlands': 2,
                          'Wall Garlands': 1,
                          'Candles': 2,
                          'Bouquets': 2,
                          'Fruits': 1
                        };
                        const categoryLimit = freePlanLimits[cat.name] || 0;
                        const currentUsed = usedItems[cat.name] || 0;
                        return currentUsed >= categoryLimit;
                      })() ? 'grayscale(1)' : 'none' 
                    }} />
                    <div className="createaltar-item-name">{item.name}</div>
                </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Main content */}
      <div className="createaltar-main-content">
        {/* Action buttons */}
        <div className="createaltar-actions">
          <button className="createaltar-btn createaltar-btn-save" type="button" onClick={handleSaveAltar}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 20 20" style={{ verticalAlign: 'middle' }}><path d="M4 17a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8.586a2 2 0 0 1 1.414.586l3.414 3.414A2 2 0 0 1 18 8.414V15a2 2 0 0 1-2 2H4Zm6-2v-4H6v4h4Zm2-8V5H4v10h12V8h-4a2 2 0 0 1-2-2Z" fill="#fff"/></svg>
              Save Altar
            </span>
          </button>
          <button className="createaltar-btn createaltar-btn-new" type="button" onClick={handleNewAltar}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 20 20" style={{ verticalAlign: 'middle' }}><path d="M10 5v10m5-5H5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
              New Altar
            </span>
          </button>
          <button className="createaltar-btn createaltar-btn-download" type="button" onClick={handledownload}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 20 20" style={{ verticalAlign: 'middle' }}><path d="M10 3v10m0 0l-4-4m4 4l4-4M4 17h12" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
              Download
            </span>
          </button>
          <button className="createaltar-btn createaltar-btn-delete-bg" type="button" onClick={handleDeleteBackground}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 20 20" style={{ verticalAlign: 'middle' }}><path d="M6 6l8 8m0-8l-8 8M10 18a8 8 0 100-16 8 8 0 000 16z" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
              Delete Background
            </span>
          </button>
        </div>
        {/* Canvas Container */}
        <div className="createaltar-canvas-container">
          <div
            id="altar-canvas"
            className="createaltar-canvas createaltar-canvas-dynamic"
            style={{
              width: width + 'px',
              height: height + 'px',
              background: wallBg
                ? `url(${wallBg}) center/cover no-repeat`
                : color,
              backgroundColor: wallBg ? "transparent" : color,
            }}
          >
        {Object.entries(images)
          .sort(([, a], [, b]) => (a.z || 0) - (b.z || 0))
          .map(([key, imgObj]) => (
            <Rnd
              key={key}
              position={{ x: imgObj.x, y: imgObj.y }}
              size={{ width: imgObj.w, height: imgObj.h }}
              style={{ ...getShapeStyle(imgObj.shape), position: 'absolute', zIndex: imgObj.z || 1 }}
              bounds="parent"
              minWidth={30}
              minHeight={30}
              maxWidth={width - 20}
              maxHeight={height - 20}
              onDrag={(e, d) => {
                // Ensure image stays within wall boundaries
                const maxX = width - imgObj.w;
                const maxY = height - imgObj.h;
                const newX = Math.max(0, Math.min(d.x, maxX));
                const newY = Math.max(0, Math.min(d.y, maxY));
                
                setImages(prev => ({
                  ...prev,
                  [key]: { ...prev[key], x: newX, y: newY }
                }));
              }}
              onResize={(e, direction, ref, delta, position) => {
                // Ensure resized image stays within wall boundaries
                const newWidth = parseInt(ref.style.width, 10);
                const newHeight = parseInt(ref.style.height, 10);
                const maxX = width - newWidth;
                const maxY = height - newHeight;
                const newX = Math.max(0, Math.min(position.x, maxX));
                const newY = Math.max(0, Math.min(position.y, maxY));
                
                setImages(prev => ({
                  ...prev,
                  [key]: {
                    ...prev[key],
                    w: newWidth,
                    h: newHeight,
                    x: newX,
                    y: newY
                  }
                }));
              }}
              onClick={() => handleImageClick(key)}
            >
              <img
                src={imgObj.src}
                alt="user upload"
                style={{ width: '100%', height: '100%', objectFit: 'cover', ...getShapeStyle(imgObj.shape) }}
                onContextMenu={e => {
                  e.preventDefault();
                  const canvas = e.currentTarget.closest('#altar-canvas');
                  const canvasRect = canvas.getBoundingClientRect();
                  const x = e.clientX - canvasRect.left;
                  const y = e.clientY - canvasRect.top;
                  
                  // Ensure context menu stays within canvas bounds
                  const menuWidth = 160; // Approximate menu width
                  const menuHeight = 280; // Approximate menu height
                  
                  let adjustedX = x;
                  let adjustedY = y;
                  
                  // Adjust if menu would go outside right edge
                  if (x + menuWidth > canvasRect.width) {
                    adjustedX = x - menuWidth;
                  }
                  
                  // Adjust if menu would go outside bottom edge
                  if (y + menuHeight > canvasRect.height) {
                    adjustedY = y - menuHeight;
                  }
                  
                  // Ensure menu doesn't go outside left or top edges
                  adjustedX = Math.max(0, adjustedX);
                  adjustedY = Math.max(0, adjustedY);
                  
                  setContextMenu({
                    visible: true,
                    x: adjustedX,
                    y: adjustedY,
                    imageIndex: key,
                  });
                }}
              />
            </Rnd>
          ))}
        {contextMenu.visible && (
          <ul
            className="createaltar-context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onMouseLeave={() => setContextMenu({ ...contextMenu, visible: false })}
          >
            <li className="createaltar-context-menu-item" onClick={() => document.getElementById("add-image-input").click()}>
              Add Image
            </li>
            <li className="createaltar-context-menu-item" onClick={handleDeleteImage}>
              Delete Image
            </li>
            <li style={{ borderTop: "1px solid #eee", margin: 0 }} />
            <li className="createaltar-context-menu-item" onClick={() => handleChangeShape("rectangle")}>Rectangle</li>
            <li className="createaltar-context-menu-item" onClick={() => handleChangeShape("circle")}>Circle</li>
            <li className="createaltar-context-menu-item" onClick={() => handleChangeShape("ellipse")}>Oval</li>
            <li className="createaltar-context-menu-item" onClick={() => handleChangeShape("rounded")}>Rounded Rectangle</li>
          </ul>
        )}
        <input
          id="add-image-input"
          type="file"
          accept="image/*"
          className="createaltar-hidden-input"
          onChange={handleAddImage}
        />
          </div>
        </div>
      </div>
      {showUpgradeMsg && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 320, boxShadow: '0 2px 16px #0002', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 20, color: '#2563eb', marginBottom: 16 }}>Upgrade to Premium</div>
            <div style={{ fontSize: 16, color: '#374151', marginBottom: 24 }}>Upgrade to a premium plan to use this altar item and unlock all features!</div>
            <button style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: 'pointer', marginRight: 12 }} onClick={() => { setShowUpgradeMsg(false); navigate('/subscriptions'); }}>Upgrade</button>
            <button style={{ background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 6, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }} onClick={() => setShowUpgradeMsg(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Createaltar;