// A service to handle all Web Crypto API interactions.

const SALT_KEY = 'ai-forge-salt';
const IV_LENGTH = 12; // bytes for AES-GCM
const KEY_ALGORITHM = { name: 'PBKDF2' };
const ENCRYPTION_ALGORITHM = { name: 'AES-GCM', iv: new Uint8Array(IV_LENGTH) };

// --- Key Derivation ---

/**
 * Derives a CryptoKey from a password and salt using PBKDF2.
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const masterKey = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            ...KEY_ALGORITHM,
            salt: salt,
            iterations: 250000,
            hash: 'SHA-256',
        },
        masterKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

// --- Salt Management ---

/**
 * Retrieves the salt from local storage or creates a new one.
 */
export function getOrCreateSalt(): Uint8Array {
    const storedSalt = localStorage.getItem(SALT_KEY);
    if (storedSalt) {
        return Uint8Array.from(atob(storedSalt), c => c.charCodeAt(0));
    }
    const newSalt = crypto.getRandomValues(new Uint8Array(16));
    localStorage.setItem(SALT_KEY, btoa(String.fromCharCode(...newSalt)));
    return newSalt;
}

export function hasSalt(): boolean {
    return localStorage.getItem(SALT_KEY) !== null;
}


// --- Encryption/Decryption ---
/**
 * Encrypts data (an object) using the derived key.
 * @returns A base64 string containing the IV + ciphertext.
 */
async function encrypt<T>(key: CryptoKey, data: T): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encodedData = new TextEncoder().encode(JSON.stringify(data));

    const encryptedContent = await crypto.subtle.encrypt(
        { ...ENCRYPTION_ALGORITHM, iv },
        key,
        encodedData
    );

    const combined = new Uint8Array(iv.length + encryptedContent.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedContent), iv.length);

    return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts a base64 string into its original object.
 */
async function decrypt<T>(key: CryptoKey, base64Ciphertext: string): Promise<T> {
    const combined = Uint8Array.from(atob(base64Ciphertext), c => c.charCodeAt(0));
    
    const iv = combined.slice(0, IV_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH);

    const decryptedContent = await crypto.subtle.decrypt(
        { ...ENCRYPTION_ALGORITHM, iv },
        key,
        ciphertext
    );

    return JSON.parse(new TextDecoder().decode(decryptedContent));
}


export interface CryptoService {
    encrypt: <T>(data: T) => Promise<string>;
    decrypt: <T>(ciphertext: string) => Promise<T>;
}

export const createCryptoService = (key: CryptoKey): CryptoService => ({
    encrypt: (data) => encrypt(key, data),
    decrypt: (ciphertext) => decrypt(key, ciphertext),
});

export const cryptoHelpers = {
    deriveKey,
    getOrCreateSalt,
    hasSalt,
};