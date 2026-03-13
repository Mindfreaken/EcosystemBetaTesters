import { openDB, IDBPDatabase } from 'idb';

export interface SignalStorageSchema {
  identityKey: {
    key: 'identityKey';
    value: { pubKey: ArrayBuffer; privKey: ArrayBuffer };
  };
  registrationId: {
    key: 'registrationId';
    value: number;
  };
  sessions: {
    key: string; // userId + deviceId
    value: ArrayBuffer;
  };
  preKeys: {
    key: number; // id
    value: ArrayBuffer;
  };
  signedPreKeys: {
    key: number; // id
    value: ArrayBuffer;
  };
  localDeviceId: {
    key: 'localDeviceId';
    value: string;
  };
}

class SignalStorage {
  private dbPromise: Promise<IDBPDatabase<any>>;

  constructor() {
    this.dbPromise = openDB('ecosystem-signal-storage', 1, {
      upgrade(db) {
        db.createObjectStore('identityKey');
        db.createObjectStore('registrationId');
        db.createObjectStore('sessions');
        db.createObjectStore('preKeys');
        db.createObjectStore('signedPreKeys');
        db.createObjectStore('config');
      },
    });
  }

  async get<T>(storeName: string, key: any): Promise<T | undefined> {
    const db = await this.dbPromise;
    return db.get(storeName, key);
  }

  async put(storeName: string, key: any, value: any): Promise<void> {
    const db = await this.dbPromise;
    await db.put(storeName, value, key);
  }

  async remove(storeName: string, key: any): Promise<void> {
    const db = await this.dbPromise;
    await db.delete(storeName, key);
  }

  // Simplified interface for libsignal compatibility
  async loadIdentityKey(): Promise<{ pubKey: ArrayBuffer; privKey: ArrayBuffer } | undefined> {
    return this.get('identityKey', 'identityKey');
  }

  async loadRegistrationId(): Promise<number | undefined> {
    return this.get('registrationId', 'registrationId');
  }

  async loadSession(identifier: string): Promise<ArrayBuffer | undefined> {
    return this.get('sessions', identifier);
  }

  async storeSession(identifier: string, record: ArrayBuffer): Promise<void> {
    await this.put('sessions', identifier, record);
  }

  async loadPreKey(id: number): Promise<ArrayBuffer | undefined> {
    return this.get('preKeys', id);
  }

  async storePreKey(id: number, keyRecord: ArrayBuffer): Promise<void> {
    await this.put('preKeys', id, keyRecord);
  }

  async loadSignedPreKey(id: number): Promise<ArrayBuffer | undefined> {
    return this.get('signedPreKeys', id);
  }

  async storeSignedPreKey(id: number, keyRecord: ArrayBuffer): Promise<void> {
    await this.put('signedPreKeys', id, keyRecord);
  }
  
  async getLocalDeviceId(): Promise<string> {
    let id = await this.get<string>('config', 'localDeviceId');
    if (!id) {
      id = crypto.randomUUID();
      await this.put('config', 'localDeviceId', id);
    }
    return id;
  }
}

export const storage = new SignalStorage();
