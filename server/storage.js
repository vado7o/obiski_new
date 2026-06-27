import { Storage } from '@google-cloud/storage'
import { randomUUID } from 'crypto'

const REPLIT_SIDECAR_ENDPOINT = 'http://127.0.0.1:1106'
const ACL_KEY = 'custom:aclPolicy'

export const objectStorageClient = new Storage({
  credentials: {
    audience: 'replit',
    subject_token_type: 'access_token',
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: 'external_account',
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: { type: 'json', subject_token_field_name: 'access_token' },
    },
    universe_domain: 'googleapis.com',
  },
  projectId: '',
})

export class ObjectNotFoundError extends Error {
  constructor() {
    super('Object not found')
    this.name = 'ObjectNotFoundError'
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype)
  }
}

function getPrivateObjectDir() {
  const dir = process.env.PRIVATE_OBJECT_DIR || ''
  if (!dir) throw new Error('PRIVATE_OBJECT_DIR not set')
  return dir.endsWith('/') ? dir : `${dir}/`
}

function parseObjectPath(path) {
  if (!path.startsWith('/')) path = `/${path}`
  const parts = path.split('/')
  if (parts.length < 3) throw new Error('Invalid object path')
  return { bucketName: parts[1], objectName: parts.slice(2).join('/') }
}

// Uploads a buffer to object storage and returns a servable path (/objects/...).
export async function uploadObject(buffer, contentType) {
  const objectId = randomUUID()
  const fullPath = `${getPrivateObjectDir()}uploads/${objectId}`
  const { bucketName, objectName } = parseObjectPath(fullPath)
  const file = objectStorageClient.bucket(bucketName).file(objectName)
  await file.save(buffer, {
    metadata: {
      contentType,
      metadata: {
        [ACL_KEY]: JSON.stringify({ owner: 'system', visibility: 'public' }),
      },
    },
  })
  return `/objects/uploads/${objectId}`
}

// Resolves a /objects/... path to a storage File, throwing if missing.
export async function getObjectEntityFile(objectPath) {
  if (!objectPath.startsWith('/objects/')) throw new ObjectNotFoundError()
  const parts = objectPath.slice(1).split('/')
  if (parts.length < 2) throw new ObjectNotFoundError()
  const entityId = parts.slice(1).join('/')
  const fullPath = `${getPrivateObjectDir()}${entityId}`
  const { bucketName, objectName } = parseObjectPath(fullPath)
  const file = objectStorageClient.bucket(bucketName).file(objectName)
  const [exists] = await file.exists()
  if (!exists) throw new ObjectNotFoundError()
  return file
}

// Streams a storage File to an Express response.
export async function downloadObject(file, res) {
  const [metadata] = await file.getMetadata()
  res.set({
    'Content-Type': metadata.contentType || 'application/octet-stream',
    'Content-Length': metadata.size,
    'Cache-Control': 'public, max-age=86400',
  })
  const stream = file.createReadStream()
  stream.on('error', () => {
    if (!res.headersSent) res.status(500).end()
  })
  stream.pipe(res)
}

// Best-effort deletion of a stored object by its /objects/... path.
export async function deleteObject(objectPath) {
  if (!objectPath) return
  try {
    const file = await getObjectEntityFile(objectPath)
    await file.delete()
  } catch {
    // ignore missing objects
  }
}
