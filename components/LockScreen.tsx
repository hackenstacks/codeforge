import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ForgeIcon } from './icons/ForgeIcon';
import { Loader } from './Loader';

export const LockScreen: React.FC = () => {
    const { login, setMasterPassword, isVaultInitialized, error } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [localError, setLocalError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        setIsLoading(true);

        if (isVaultInitialized) {
            await login(password);
        } else {
            if (password !== confirmPassword) {
                setLocalError("Passwords do not match.");
                setIsLoading(false);
                return;
            }
            if (password.length < 8) {
                setLocalError("Password must be at least 8 characters long.");
                setIsLoading(false);
                return;
            }
            await setMasterPassword(password);
        }
        // If login fails, the error state in the context will be set and displayed.
        // If it succeeds, the component will unmount.
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center justify-center p-4 font-sans">
            <div className="w-full max-w-sm">
                <div className="flex flex-col items-center justify-center mb-8">
                    <ForgeIcon className="h-16 w-16 text-blue-500 mb-4" />
                    <h1 className="text-4xl font-bold text-white">AI Forge</h1>
                    <p className="text-gray-400 mt-1">Your Secure AI Workspace</p>
                </div>
                
                <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-lg shadow-2xl border border-gray-700">
                    <h2 className="text-2xl font-semibold text-center text-white mb-2">
                        {isVaultInitialized ? "Unlock Your Forge" : "Create Master Password"}
                    </h2>
                    <p className="text-sm text-gray-500 text-center mb-6">
                         {isVaultInitialized ? "Enter your password to decrypt your data." : "This password encrypts all your local data."}
                    </p>
                    
                    <div className="space-y-4">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Master Password"
                            autoFocus
                            className="w-full p-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {!isVaultInitialized && (
                             <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm Password"
                                className="w-full p-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        )}
                    </div>

                    {(error || localError) && <p className="text-red-400 text-sm mt-4 text-center">{error || localError}</p>}
                    
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full mt-6 p-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading ? <Loader /> : (isVaultInitialized ? 'Unlock' : 'Set Password & Create Vault')}
                    </button>
                </form>

                 {!isVaultInitialized && (
                    <div className="mt-6 text-center text-xs text-yellow-400 bg-yellow-900/50 p-3 rounded-md border border-yellow-700/50">
                        <strong>Important:</strong> Your password is never stored. If you forget it, your encrypted data cannot be recovered. Please store it securely.
                    </div>
                )}
            </div>
        </div>
    );
};
