import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Project } from './types';

const DB_NAME = 'CodeForgeDB';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

interface CodeForgeDB extends DBSchema {
  [STORE_NAME]: {
    key: number;
    value: Project;
    indexes: { 'createdAt': Date, 'tags': string[] };
  };
}

let dbPromise: Promise<IDBPDatabase<CodeForgeDB>> | null = null;

const getDb = (): Promise<IDBPDatabase<CodeForgeDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<CodeForgeDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('createdAt', 'createdAt');
        store.createIndex('tags', 'tags', { multiEntry: true });
      },
    });
  }
  return dbPromise;
};

export const db = {
  async addProject(project: Omit<Project, 'id' | 'createdAt'>): Promise<number> {
    const db = await getDb();
    const newProject: Omit<Project, 'id'> = {
        ...project,
        createdAt: new Date(),
    };
    return db.add(STORE_NAME, newProject as Project);
  },

  async getProject(id: number): Promise<Project | undefined> {
    const db = await getDb();
    return db.get(STORE_NAME, id);
  },

  async getAllProjects(): Promise<Project[]> {
    const db = await getDb();
    return db.getAllFromIndex(STORE_NAME, 'createdAt');
  },

  async searchProjects(query: string): Promise<Project[]> {
    const db = await getDb();
    const allProjects = await db.getAll(STORE_NAME);
    
    const lowerCaseQuery = query.toLowerCase();

    if (!lowerCaseQuery) {
        // Return sorted by date if query is empty
        return allProjects.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    return allProjects.filter(p => {
        // Search in tags
        if (p.tags && p.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery))) {
            return true;
        }
        // Search in prompt
        if (p.prompt && p.prompt.toLowerCase().includes(lowerCaseQuery)) {
            return true;
        }
         // Search in filename
        if (p.fileName && p.fileName.toLowerCase().includes(lowerCaseQuery)) {
            return true;
        }
        // Search within data
        if(p.type === 'review') {
            const { review, originalCode } = p.data;
            if (originalCode.toLowerCase().includes(lowerCaseQuery) ||
                review.summary.toLowerCase().includes(lowerCaseQuery) ||
                review.correctedCode.toLowerCase().includes(lowerCaseQuery)
            ) return true;
        } else if (p.type === 'code') {
            if (p.data.generatedCode.toLowerCase().includes(lowerCaseQuery)) return true;
        }
        return false;
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async deleteProject(id: number): Promise<void> {
    const db = await getDb();
    return db.delete(STORE_NAME, id);
  },
};