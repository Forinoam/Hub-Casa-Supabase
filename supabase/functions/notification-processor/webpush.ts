/**
 * Web Push (RFC 8291 / aes128gcm) + VAPID (RFC 8292) implementado somente com
 * WebCrypto — compatível com o runtime Deno das Supabase Edge Functions.
 * Nenhuma dependência Node é usada aqui.
 */

export type PushKeys = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type VapidKeys = {
  publicKey: string;
  privateKey: string;
  subject: string;
};

export type PushResult = {
  ok: boolean;
  status: number;
  /** true quando o serviço indicou que a inscrição não existe mais (404/410). */
  gone: boolean;
  error?: string;
};

const encoder = new TextEncoder();

export function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export function base64UrlEncode(bytes: Uint8Array | ArrayBuffer): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function concat(...chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info },
    key,
    length * 8,
  );
  return new Uint8Array(bits);
}

async function importVapidPrivateKey(vapid: VapidKeys): Promise<CryptoKey> {
  const publicKey = base64UrlDecode(vapid.publicKey);
  if (publicKey.length !== 65 || publicKey[0] !== 0x04) {
    throw new Error("VAPID_PUBLIC_KEY inválida: esperada chave P-256 não comprimida (65 bytes).");
  }
  const privateKey = base64UrlDecode(vapid.privateKey);
  if (privateKey.length !== 32) {
    throw new Error("VAPID_PRIVATE_KEY inválida: esperados 32 bytes em base64url.");
  }

  return crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC",
      crv: "P-256",
      d: base64UrlEncode(privateKey),
      x: base64UrlEncode(publicKey.slice(1, 33)),
      y: base64UrlEncode(publicKey.slice(33, 65)),
      ext: true,
    },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
}

async function buildVapidAuthorization(endpoint: string, vapid: VapidKeys): Promise<string> {
  const audience = new URL(endpoint).origin;
  const header = base64UrlEncode(encoder.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = base64UrlEncode(
    encoder.encode(
      JSON.stringify({
        aud: audience,
        exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
        sub: vapid.subject,
      }),
    ),
  );

  const signingInput = `${header}.${payload}`;
  const key = await importVapidPrivateKey(vapid);
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    encoder.encode(signingInput),
  );

  const jwt = `${signingInput}.${base64UrlEncode(signature)}`;
  return `vapid t=${jwt}, k=${vapid.publicKey}`;
}

async function encryptPayload(keys: PushKeys, plaintext: Uint8Array): Promise<Uint8Array> {
  const uaPublic = base64UrlDecode(keys.p256dh);
  const authSecret = base64UrlDecode(keys.auth);

  const localKeyPair = (await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  )) as CryptoKeyPair;

  const asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", localKeyPair.publicKey));
  const uaPublicKey = await crypto.subtle.importKey(
    "raw",
    uaPublic,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );

  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: uaPublicKey }, localKeyPair.privateKey, 256),
  );

  const ikm = await hkdf(
    authSecret,
    sharedSecret,
    concat(encoder.encode("WebPush: info\0"), uaPublic, asPublic),
    32,
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, encoder.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, encoder.encode("Content-Encoding: nonce\0"), 12);

  const contentKey = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce, tagLength: 128 },
      contentKey,
      concat(plaintext, new Uint8Array([0x02])),
    ),
  );

  const recordSize = new Uint8Array(4);
  new DataView(recordSize.buffer).setUint32(0, 4096);

  return concat(salt, recordSize, new Uint8Array([asPublic.length]), asPublic, ciphertext);
}

export async function sendWebPush(
  keys: PushKeys,
  payload: unknown,
  vapid: VapidKeys,
  ttlSeconds = 86_400,
  urgency: "very-low" | "low" | "normal" | "high" = "normal",
): Promise<PushResult> {
  try {
    const body = await encryptPayload(keys, encoder.encode(JSON.stringify(payload)));
    const authorization = await buildVapidAuthorization(keys.endpoint, vapid);

    const response = await fetch(keys.endpoint, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        TTL: String(ttlSeconds),
        Urgency: urgency,
      },
      body,
    });

    if (response.ok) {
      return { ok: true, status: response.status, gone: false };
    }

    const text = await response.text().catch(() => "");
    return {
      ok: false,
      status: response.status,
      gone: response.status === 404 || response.status === 410,
      error: `${response.status} ${text}`.trim().slice(0, 500),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      gone: false,
      error: error instanceof Error ? error.message : "Falha desconhecida ao enviar push.",
    };
  }
}
