import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Project } from './types';

const DB_NAME = 'CodeForgeDB';
const DB_VERSION = 1; // Remains 1, as we are not changing structure, just data type logic
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
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, {
                keyPath: 'id',
                autoIncrement: true,
            });
            store.createIndex('createdAt', 'createdAt');
            store.createIndex('tags', 'tags', { multiEntry: true });
        }
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

  async updateProject(project: Project): Promise<number> {
    const db = await getDb();
    return db.put(STORE_NAME, project);
  },

  async getProject(id: number): Promise<Project | undefined> {
    const db = await getDb();
    return db.get(STORE_NAME, id);
  },

  async getAllProjects(): Promise<Project[]> {
    const db = await getDb();
    const projects = await db.getAllFromIndex(STORE_NAME, 'createdAt');
    return projects.reverse(); // Sort newest first
  },

  async searchProjects(query: string): Promise<Project[]> {
    const db = await getDb();
    const allProjects = await db.getAll(STORE_NAME);
    
    const lowerCaseQuery = query.toLowerCase();

    if (!lowerCaseQuery) {
        return allProjects.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    return allProjects.filter(p => {
        // Search in tags
        if (p.tags && p.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery))) {
            return true;
        }
        // Search in prompt/title
        if (p.prompt && p.prompt.toLowerCase().includes(lowerCaseQuery)) {
            return true;
        }
         // Search in filename (for legacy projects)
        if (p.fileName && p.fileName.toLowerCase().includes(lowerCaseQuery)) {
            return true;
        }
        // Search within data
        if (p.type === 'chat') {
            if (p.data.messages.some(m => m.content.toLowerCase().includes(lowerCaseQuery))) {
                return true;
            }
        } else if (p.type === 'review') {
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