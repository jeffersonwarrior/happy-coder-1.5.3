import axios from 'axios';
import { getRandomBytes } from 'expo-crypto';
import sodium from 'react-native-libsodium';
import { getServerUrl } from '@/sync/serverConfig';
import { encodeBase64 } from '../encryption/base64';

export interface QRAuthKeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export function generateAuthKeyPair(): QRAuthKeyPair {
  const secret = getRandomBytes(32);
  const keypair = sodium.crypto_box_seed_keypair(secret);
  return {
    publicKey: keypair.publicKey,
    secretKey: keypair.privateKey,
  };
}

export async function authQRStart(keypair: QRAuthKeyPair): Promise<boolean> {
  try {
    const serverUrl = getServerUrl();
    console.log(`[AUTH DEBUG] Sending auth request to: ${serverUrl}/v1/auth/account/request`);
    console.log(`[AUTH DEBUG] Public key: ${encodeBase64(keypair.publicKey).substring(0, 20)}...`);

    await axios.post(`${serverUrl}/v1/auth/account/request`, {
      publicKey: encodeBase64(keypair.publicKey),
    });

    console.log('[AUTH DEBUG] Auth request sent successfully');
    return true;
  } catch (error) {
    console.log('[AUTH DEBUG] Failed to send auth request:', error);
    console.log('Failed to create authentication request, please try again later.');
    return false;
  }
}
