import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const AuthContext = createContext(null);

function getProfilePhotoKey(userId) {
    return userId ? `lodo_profile_photo_${userId}` : null;
}

function loadStoredProfilePhoto(userId) {
    const key = getProfilePhotoKey(userId);
    return key ? localStorage.getItem(key) : null;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [loading, setLoading] = useState(true);

    const clearAuth = () => {
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
        setProfilePhoto(null);
    };

    useEffect(() => {
        if (!user?.id) {
            setProfilePhoto(null);
            return;
        }
        setProfilePhoto(loadStoredProfilePhoto(user.id));
    }, [user?.id]);

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_URL}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                } else {
                    clearAuth();
                }
            } catch (error) {
                console.error('Error verifying token:', error);
                clearAuth();
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, [token]);

    const login = async (email, password) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Error al iniciar sesión');
        }

        const data = await response.json();
        localStorage.setItem('auth_token', data.token);
        setToken(data.token);
        setUser(data.user);
        return data.user;
    };

    const register = async (email, password, name) => {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Error al registrarse');
        }

        const data = await response.json();
        localStorage.setItem('auth_token', data.token);
        setToken(data.token);
        setUser(data.user);
        return data.user;
    };

    const changePassword = async (currentPassword, newPassword) => {
        const response = await fetch(`${API_URL}/auth/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'No se pudo cambiar la contraseña');
        }

        return true;
    };

    const saveProfilePhoto = (imageDataUrl) => {
        if (!user?.id) return;
        const key = getProfilePhotoKey(user.id);
        localStorage.setItem(key, imageDataUrl);
        setProfilePhoto(imageDataUrl);
    };

    const removeProfilePhoto = () => {
        if (!user?.id) return;
        const key = getProfilePhotoKey(user.id);
        localStorage.removeItem(key);
        setProfilePhoto(null);
    };

    const logout = async () => {
        try {
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Error during logout request:', error);
        } finally {
            clearAuth();
        }
    };

    const isAdmin = user?.role === 'admin';

    const value = useMemo(() => ({
        user,
        token,
        profilePhoto,
        loading,
        isAuthenticated: !!user,
        isAdmin,
        login,
        register,
        changePassword,
        saveProfilePhoto,
        removeProfilePhoto,
        logout
    }), [user, token, profilePhoto, loading, isAdmin]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
