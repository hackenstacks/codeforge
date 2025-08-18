import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { WorkspaceAsset } from '../types';

interface WorkspaceContextType {
    assets: WorkspaceAsset[];
    activeAsset: WorkspaceAsset | null;
    addAsset: (asset: Omit<WorkspaceAsset, 'id'>) => void;
    updateAsset: (id: string, content: string) => void;
    removeAsset: (id: string) => void;
    setActiveAssetId: (id: string | null) => void;
    loadAssets: (newAssets: WorkspaceAsset[]) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [assets, setAssets] = useState<WorkspaceAsset[]>([]);
    const [activeAssetId, setActiveAssetId] = useState<string | null>(null);

    const addAsset = useCallback((assetData: Omit<WorkspaceAsset, 'id'>) => {
        const newAsset: WorkspaceAsset = { ...assetData, id: `asset-${Date.now()}` };
        setAssets(prev => [...prev, newAsset]);
        setActiveAssetId(newAsset.id);
    }, []);

    const updateAsset = useCallback((id: string, content: string) => {
        setAssets(prev => prev.map(asset => asset.id === id ? { ...asset, content } : asset));
    }, []);

    const removeAsset = useCallback((id: string) => {
        setAssets(prev => prev.filter(asset => asset.id !== id));
        if (activeAssetId === id) {
            setActiveAssetId(assets.length > 1 ? assets[0].id : null);
        }
    }, [activeAssetId, assets]);

    const loadAssets = useCallback((newAssets: WorkspaceAsset[]) => {
        setAssets(newAssets);
        setActiveAssetId(newAssets.length > 0 ? newAssets[0].id : null);
    }, []);
    
    const activeAsset = assets.find(a => a.id === activeAssetId) || null;

    const value = {
        assets,
        activeAsset,
        addAsset,
        updateAsset,
        removeAsset,
        setActiveAssetId,
        loadAssets,
    };

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    );
};

export const useWorkspace = (): WorkspaceContextType => {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
};
