/**
 * Storage API — presigned MinIO uploads.
 *
 * Flow:
 *  1. `storageApi.presign({contentType, ext})` → `{ uploadUrl, publicUrl, key, expiresAt }`.
 *  2. `uploadPhotoToPresignedUrl(localUri, uploadUrl, contentType)` → PUT the
 *     raw file bytes at `uploadUrl`.
 *  3. Save `publicUrl` in the mission submission's `photoUrls[]` array.
 *
 * On React Native the `expo-image-picker` URI is a `file://` path; we read
 * it with `fetch(uri).blob()` (Expo/RN polyfills handle file URIs) and
 * forward the Blob as the PUT body. On web the URI is already an
 * https/blob URL so the same code path works.
 */
import apiClient from './client';

export interface PresignRequest {
  contentType: string;
  ext: string;
}

export interface PresignResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresAt: string;
}

export interface PresignReadItem {
  key: string;
  url: string;
  expiresAt: string;
}

export const storageApi = {
  presign: async (payload: PresignRequest): Promise<PresignResponse> => {
    const res = await apiClient.post<PresignResponse>('/storage/presign', payload);
    return res.data;
  },

  /**
   * Mint short-lived GET URLs so the parent's Verify screen can render
   * private submission photos. Accepts either raw bucket keys or the full
   * publicUrls saved in `MissionSubmission.photoUrls[]` — the backend
   * normalises both.
   */
  presignRead: async (keys: string[]): Promise<PresignReadItem[]> => {
    if (!keys.length) return [];
    const res = await apiClient.post<{ items: PresignReadItem[] }>(
      '/storage/presign-read',
      { keys },
    );
    return res.data.items;
  },
};

/**
 * PUT a local file at `uri` to a presigned `uploadUrl`. Returns the
 * (unchanged) `publicUrl` you supplied so this can be chained ergonomically.
 *
 * Errors: throws an Error with `.status` populated for non-2xx responses.
 */
export async function uploadPhotoToPresignedUrl(params: {
  uri: string;
  uploadUrl: string;
  publicUrl: string;
  contentType: string;
}): Promise<string> {
  const { uri, uploadUrl, publicUrl, contentType } = params;

  // Read the local file as a Blob. RN's fetch supports file:// URIs out of
  // the box; on web the URI is already https/blob.
  let blob: Blob;
  try {
    const fileRes = await fetch(uri);
    if (!fileRes.ok) {
      throw new Error(`Could not read local file (${fileRes.status})`);
    }
    blob = await fileRes.blob();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn('[upload] failed to read local file', { uri, msg });
    throw new Error(`Could not read local file: ${msg}`);
  }

  // Diagnostic: log the host of the presigned URL — most "Network failed"
  // errors on physical devices are because MinIO presigned a `localhost`
  // URL that the phone can't reach over LAN.
  try {
    const host = uploadUrl.replace(/^https?:\/\//, '').split('/')[0];
    console.log('[upload] PUT', host, 'size=', blob.size, 'type=', contentType);
  } catch {
    /* noop */
  }

  let putRes: Response;
  try {
    putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: blob,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn('[upload] PUT failed (network)', { uploadUrl, msg });
    throw new Error(
      `Photo upload network error — check that the MinIO endpoint in the presigned URL is reachable from this device (got: ${uploadUrl}). Underlying: ${msg}`,
    );
  }

  if (!putRes.ok) {
    let body = '';
    try {
      body = await putRes.text();
    } catch {
      /* noop */
    }
    console.warn('[upload] PUT non-2xx', {
      status: putRes.status,
      statusText: putRes.statusText,
      body: body.slice(0, 300),
    });
    const err = new Error(
      `MinIO upload failed: ${putRes.status} ${putRes.statusText}`,
    ) as Error & { status?: number };
    err.status = putRes.status;
    throw err;
  }
  return publicUrl;
}
