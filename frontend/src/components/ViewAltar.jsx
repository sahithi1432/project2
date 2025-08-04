import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { wallAPI } from '../services/api';
import { getErrorMessage } from '../utils/errorHandler';
import { getApiUrl } from '../config/environment';
import './ViewAltar.css';

function ViewAltar() {
  const { id, token } = useParams();
  const [altar, setAltar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAltar() {
      try {
        console.log('API Base URL:', getApiUrl());
        console.log('Fetching altar with params:', { id, token });
        let data;
        if (token) {
          // Fetch by share token (public access)
          console.log('Fetching by share token:', token);
          data = await wallAPI.getDesignByToken(token);
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