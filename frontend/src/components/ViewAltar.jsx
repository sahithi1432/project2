import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { wallAPI } from '../services/api';
import { getErrorMessage } from '../utils/errorHandler';
import { getApiUrl } from '../config/environment';
import { altarCategories } from '../assets/altarItems';
import './ViewAltar.css';

// Function to fix image paths from saved altar data
const fixImagePaths = (wallData) => {
  if (!wallData) return wallData;

  // Dynamically create a mapping of old paths to new imported URLs for all items
  const pathMapping = {};
  altarCategories.forEach(cat => {
    cat.items.forEach(item => {
      if (item.src && typeof item.src === 'string') {
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

function ViewAltar() {
  const { id, token } = useParams();
  const [altar, setAltar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAltar() {
      try {
        const apiBaseUrl = getApiUrl();
        console.log('API Base URL:', apiBaseUrl);
        console.log('Fetching altar with params:', { id, token });
        
        // Test the API endpoint directly
        const testUrl = `${apiBaseUrl}/health`;
        console.log('Testing API health endpoint:', testUrl);
        try {
          const healthResponse = await fetch(testUrl);
          console.log('Health check response:', healthResponse.status, healthResponse.ok);
        } catch (healthError) {
          console.error('Health check failed:', healthError);
        }
        
        let data;
        if (token) {
          // Fetch by share token (public access)
          console.log('Fetching by share token:', token);
          const shareUrl = `${apiBaseUrl}/wall/shared/${token}`;
          console.log('Share URL:', shareUrl);
          
          const response = await fetch(shareUrl);
          console.log('Share response status:', response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Share API error:', response.status, errorText);
            throw new Error(`Failed to fetch shared altar: ${response.status} ${errorText}`);
          }
          
          data = await response.json();
        } else if (id) {
          // Fetch by ID (requires authentication)
          console.log('Fetching by ID:', id);
          data = await wallAPI.getDesign(id);
        } else {
          setError('No altar ID or token provided');
          setLoading(false);
          return;
        }
        console.log('Altar data received:', data);
        setAltar(data);
      } catch (err) {
        console.error('Error fetching altar:', err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    fetchAltar();
  }, [id, token]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!altar) return <div>No altar found.</div>;

  let wallData = typeof altar.wall_data === 'string' ? JSON.parse(altar.wall_data) : altar.wall_data;
  
  // Fix image paths for shared links
  wallData = fixImagePaths(wallData);

  return (
    <div className="viewaltar-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 32 }}>
      <h2 style={{ color: '#2563eb', marginBottom: 16 }}>{altar.wall_name}</h2>
      {wallData.interest && <div style={{ marginBottom: 8 }}>Theme: {wallData.interest}</div>}
      <div
        className="viewaltar-canvas"
        style={{
          width: wallData.width || 800,
          height: wallData.height || 500,
          background: wallData.wallBg ? `url(${wallData.wallBg}) center/cover no-repeat` : wallData.color || '#3b82f6',
          backgroundColor: wallData.wallBg ? 'transparent' : wallData.color || '#3b82f6',
          position: 'relative',
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(59,130,246,0.08)',
          marginBottom: 24
        }}
      >
        {Array.isArray(wallData.images) && wallData.images.map((img, i) => (
          <img
            key={i}
            src={img.src}
            alt="altar item"
            style={{
              position: 'absolute',
              left: img.x,
              top: img.y,
              width: img.w,
              height: img.h,
              objectFit: 'cover',
              borderRadius:
                img.shape === 'circle' ? '50%' :
                img.shape === 'ellipse' ? '50% / 40%' :
                img.shape === 'rounded' ? 20 : 0
            }}
          />
        ))}
      </div>
      {token && (
        <div style={{ color: '#64748b', fontSize: '1rem', marginTop: 12 }}>
          (Read-only shared view)
        </div>
      )}
    </div>
  );
}

export default ViewAltar; 