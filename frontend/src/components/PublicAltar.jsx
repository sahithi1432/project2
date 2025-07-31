import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './PublicAltar.css';

function PublicAltar() {
  const { id } = useParams();
  const [altar, setAltar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAltar() {
      setLoading(true);
      try {
        const res = await fetch(`/api/wall/${id}/public`);
        if (!res.ok) throw new Error('Not found or not public');
        const data = await res.json();
        setAltar(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAltar();
  }, [id]);

  if (loading) return <div style={{textAlign:'center',marginTop:40}}>Loading...</div>;
  if (error) return <div style={{color:'red',textAlign:'center',marginTop:40}}>Error: {error}</div>;
  if (!altar) return null;

  let wallData = typeof altar.wall_data === 'string' ? JSON.parse(altar.wall_data) : altar.wall_data;
  const originalWidth = wallData.width || 800;
  const originalHeight = wallData.height || 500;
  const maxWidth = 360;
  const scale = Math.min(maxWidth / originalWidth, 1);
  const displayWidth = originalWidth * scale;
  const displayHeight = originalHeight * scale;

  return (
    <div style={{padding:16,maxWidth:420,margin:'0 auto'}}>
      <h2 style={{textAlign:'center',color:'#2563eb',marginBottom:12}}>{altar.wall_name}</h2>
      <div
        style={{
          width: displayWidth,
          height: displayHeight,
          background: wallData.wallBg ? `url(${wallData.wallBg}) center/cover no-repeat` : wallData.color || '#3b82f6',
          backgroundColor: wallData.wallBg ? 'transparent' : wallData.color || '#3b82f6',
          position: 'relative',
          margin: '0 auto',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(59,130,246,0.08)'
        }}
      >
        {Array.isArray(wallData.images) && wallData.images.map((img, i) => (
          <img
            key={i}
            src={img.src}
            alt="altar item"
            style={{
              position: 'absolute',
              left: img.x * scale,
              top: img.y * scale,
              width: img.w * scale,
              height: img.h * scale,
              objectFit: 'cover',
              borderRadius:
                img.shape === 'circle' ? '50%' :
                img.shape === 'ellipse' ? '50% / 40%' :
                img.shape === 'rounded' ? Math.max(20 * scale, 8) : 0
            }}
          />
        ))}
      </div>
      {wallData.interest && (
        <div style={{textAlign:'center',marginTop:16,color:'#64748b',fontSize:'1.1rem'}}>
          Theme: {wallData.interest}
        </div>
      )}
      {/* Visitor stories/memories section will go here */}
      <div style={{marginTop:32}}>
        <h3 style={{textAlign:'center',color:'#334155'}}>Stories & Memories</h3>
        <div style={{textAlign:'center',color:'#64748b',marginTop:8}}>
          (Coming soon: Visitors will be able to add their own stories here)
        </div>
      </div>
    </div>
  );
}

export default PublicAltar; 