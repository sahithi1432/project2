// Authentication utility functions to eliminate duplicate code

export const logout = (navigate) => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('profilePhoto');
  navigate('/Login');
};

export const goHome = (navigate) => {
  navigate('/');
};

export const createMenuRef = () => {
  return { current: null };
};

export const handleClickOutside = (menuRef, menuOpen, setMenuOpen) => {
  return (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setMenuOpen(false);
    }
  };
}; 