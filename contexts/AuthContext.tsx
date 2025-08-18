import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { cryptoHelpers, createCryptoService, type CryptoService } from '../services/cryptoService';
import { dbService } from '../db';

interface AuthContextType {
    isLocked: boolean;
    isVaultInitialized: boolean;
    error: string | null;
    login: (password: string) => Promise<void>;
    logout: () => void;
    setMasterPassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isVaultInitialized, setIsVaultInitialized] = useState(cryptoHelpers.hasSalt());
    
    const isLocked = useMemo(() => !encryptionKey, [encryptionKey]);

    useEffect(() => {
        // When the vault is unlocked, pass the crypto service to the db service.
        if (encryptionKey) {
            const cryptoService = createCryptoService(encryptionKey);
            dbService.setCryptoService(cryptoService);
        } else {
            dbService.setCryptoService(null as any);
        }
    }, [encryptionKey]);
    
    const setMasterPassword = async (password: string) => {
        if (isVaultInitialized) {
            setError("Vault is already initialized.");
            return;
        }
        const salt = cryptoHelpers.getOrCreateSalt();
        const key = await cryptoHelpers.deriveKey(password, salt);
        setEncryptionKey(key);
        setIsVaultInitialized(true);
        setError(null);
    };

    const login = async (password: string) => {
        setError(null);
        try {
            const salt = cryptoHelpers.getOrCreateSalt();
            const key = await cryptoHelpers.deriveKey(password, salt);
            
            // Test decryption with a dummy encryption to verify the password
            const dummyData = { test: 'ok' };
            const cryptoService = createCryptoService(key);
            const ciphertext = await cryptoService.encrypt(dummyData);
            const decrypted = await cryptoService.decrypt<{ test: string }>(ciphertext);

            if (decrypted.test !== 'ok') {
                throw new Error("Decryption test failed.");
            }
            
            setEncryptionKey(key);
        } catch (e) {
            console.error("Login failed:", e);
            setError("Invalid password. Please try again.");
            setEncryptionKey(null);
        }
    };

    const logout = () => {
        setEncryptionKey(null);
    };

    const value = {
        isLocked,
        isVaultInitialized,
        error,
        login,
        logout,
        setMasterPassword,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};