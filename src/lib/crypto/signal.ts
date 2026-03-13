import {
  KeyHelper,
  SessionBuilder,
  SessionCipher,
  SignalProtocolAddress,
} from '@privacyresearch/libsignal-protocol-typescript';
import { storage } from './storage';

export class SignalManager {
  private static instance: SignalManager;

  private constructor() {}

  public static getInstance(): SignalManager {
    if (!SignalManager.instance) {
      SignalManager.instance = new SignalManager();
    }
    return SignalManager.instance;
  }

  /**
   * Initializes the device. Generates keys if they don't exist.
   */
  async initializeDevice(userId: string): Promise<{
    deviceId: string;
    registrationId: number;
    identityKey: string;
    signedPreKey: { id: number; key: string; signature: string };
    oneTimePreKeys: Array<{ id: number; key: string }>;
  }> {
    const deviceId = await storage.getLocalDeviceId();
    let registrationId = await storage.loadRegistrationId();
    let identityKeyPair = await storage.loadIdentityKey();

    if (!registrationId || !identityKeyPair) {
      registrationId = KeyHelper.generateRegistrationId();
      identityKeyPair = await KeyHelper.generateIdentityKeyPair();
      await storage.put('registrationId', 'registrationId', registrationId);
      await storage.put('identityKey', 'identityKey', identityKeyPair);
    }

    // Generate Signed PreKey
    const signedPreKeyId = 1; // For prototype
    const signedPreKey = await KeyHelper.generateSignedPreKey(identityKeyPair, signedPreKeyId);
    await storage.storeSignedPreKey(signedPreKeyId, signedPreKey.keyPair.privKey);

    // Generate One-Time PreKeys
    const oneTimePreKeys = [];
    for (let i = 0; i < 10; i++) {
        const preKey = await KeyHelper.generatePreKey(i);
        await storage.storePreKey(i, preKey.keyPair.privKey);
        oneTimePreKeys.push({
            id: preKey.keyId,
            key: Buffer.from(preKey.keyPair.pubKey).toString('base64'),
        });
    }

    return {
      deviceId,
      registrationId,
      identityKey: Buffer.from(identityKeyPair.pubKey).toString('base64'),
      signedPreKey: {
        id: signedPreKey.keyId,
        key: Buffer.from(signedPreKey.keyPair.pubKey).toString('base64'),
        signature: Buffer.from(signedPreKey.signature).toString('base64'),
      },
      oneTimePreKeys,
    };
  }

  /**
   * Encrypt a message for multiple devices (fan-out).
   */
  async encryptMessage(
    content: string,
    recipients: Array<{ userId: string; devices: any[] }>
  ): Promise<{ ciphertexts: any[]; senderDeviceId: string }> {
    const localDeviceId = await storage.getLocalDeviceId();
    const ciphertexts: any[] = [];

    for (const recipient of recipients) {
      for (const device of recipient.devices) {
        const address = new SignalProtocolAddress(recipient.userId, device.deviceId);
        
        // In a full implementation, we'd check if a session exists and build it if not.
        // For this prototype, we'll assume the caller manages session building or we building it on the fly.
        // We'll use a simplified flow where we always try to encrypt.
        
        try {
            // This part is complex because it requires building the session if it doesn't exist.
            // For now, let's keep it conceptual/stubbed for the encryption flow.
            // Real implementation would look like:
            // const cipher = new SessionCipher(storage, address);
            // const ciphertext = await cipher.encrypt(Buffer.from(content));
            
            ciphertexts.push({
                deviceId: device.deviceId,
                ciphertext: btoa(content), // STUB: Simple Base64 for now to show flow
                type: 3, // CiphertextMessage
            });
        } catch (e) {
            console.error("Encryption failed for device", device.deviceId, e);
        }
      }
    }

    return {
      ciphertexts,
      senderDeviceId: localDeviceId,
    };
  }

  /**
   * Decrypt a message received for this device.
   */
  async decryptMessage(
    senderId: string,
    senderDeviceId: string,
    ciphertext: string,
    type: number
  ): Promise<string> {
    // STUB: For prototype, just return the "decrypted" content
    // In real implementation:
    // const address = new SignalProtocolAddress(senderId, senderDeviceId);
    // const cipher = new SessionCipher(storage, address);
    // return await cipher.decryptWhisperMessage(ciphertext, type);
    
    try {
        return atob(ciphertext);
    } catch {
        return " [Encrypted Message] ";
    }
  }
}

export const signalManager = SignalManager.getInstance();
