import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Project, EncryptedProject } from './types';
import { type CryptoService } from './services/cryptoService';

const DB_NAME = 'AIForgeDB';
const DB_VERSION = 1; 
const STORE_NAME = 'projects';

interface AIForgeDB extends DBSchema {
  [STORE_NAME]: {
    key: number;
    value: EncryptedProject;
  };
}

let dbPromise: Promise<IDBPDatabase<AIForgeDB>> | null = null;

const getDb = (): Promise<IDBPDatabase<AIForgeDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<AIForgeDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, {
                keyPath: 'id',
            });
        }
      },
    });
  }
  return dbPromise;
};

// The DB service is now a class that holds the crypto key
export class DBService {
    private crypto: CryptoService | null = null;

    setCryptoService(crypto: CryptoService) {
        this.crypto = crypto;
    }

    private ensureCrypto() {
        if (!this.crypto) {
            throw new Error("Crypto service not initialized. Is the vault unlocked?");
        }
        return this.crypto;
    }

    async addProject(project: Omit<Project, 'id' | 'createdAt'>): Promise<number> {
        const crypto = this.ensureCrypto();
        const db = await getDb();
        const newProject: Omit<Project, 'id'> = {
            ...project,
            createdAt: new Date(),
        };
        const ciphertext = await crypto.encrypt(newProject);
        const keys = await db.getAllKeys(STORE_NAME);
        const lastId = keys.length > 0 ? (keys[keys.length - 1] as number) : 0;
        const newId = lastId + 1;
        await db.add(STORE_NAME, { id: newId, ciphertext });
        return newId;
    }

    async updateProject(project: Project): Promise<number> {
        const crypto = this.ensureCrypto();
        const db = await getDb();
        if (!project.id) throw new Error("Project must have an ID to be updated.");
        const ciphertext = await crypto.encrypt(project);
        return db.put(STORE_NAME, { id: project.id, ciphertext });
    }

    async getProject(id: number): Promise<Project | undefined> {
        const crypto = this.ensureCrypto();
        const db = await getDb();
        const encryptedProject = await db.get(STORE_NAME, id);
        if (!encryptedProject) return undefined;
        return crypto.decrypt<Project>(encryptedProject.ciphertext);
    }

    async getAllProjects(): Promise<Project[]> {
        const crypto = this.ensureCrypto();
        const db = await getDb();
        const encryptedProjects = await db.getAll(STORE_NAME);
        const projects = await Promise.all(
            encryptedProjects.map(p => crypto.decrypt<Project>(p.ciphertext))
        );
        return projects.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    async searchProjects(query: string): Promise<Project[]> {
        const allProjects = await this.getAllProjects();
        const lowerCaseQuery = query.toLowerCase();

        if (!lowerCaseQuery) return allProjects;

        return allProjects.filter(p => {
            if (p.tags?.some(tag => tag.toLowerCase().includes(lowerCaseQuery))) return true;
            if (p.prompt?.toLowerCase().includes(lowerCaseQuery)) return true;
            if (p.fileName?.toLowerCase().includes(lowerCaseQuery)) return true;
            if (p.type === 'chat') {
                return p.data.messages.some(m => m.content.toLowerCase().includes(lowerCaseQuery));
            } else if (p.type === 'review') {
                const { review, originalCode } = p.data;
                return originalCode.toLowerCase().includes(lowerCaseQuery) ||
                    review.summary.toLowerCase().includes(lowerCaseQuery) ||
                    review.correctedCode.toLowerCase().includes(lowerCaseQuery);
            } else if (p.type === 'code') {
                return p.data.generatedCode.toLowerCase().includes(lowerCaseQuery);
            }
            return false;
        });
    }

    async deleteProject(id: number): Promise<void> {
        this.ensureCrypto();
        const db = await getDb();
        return db.delete(STORE_NAME, id);
    }
}

export const dbService = new DBService();