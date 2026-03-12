import dotenv from "dotenv"
import path from "path"
import fs from "fs"

const APP_BASE = "http://localhost:3333/api/plugins"

interface CreateAppResponse {
  service: {
    id: number
    idService: string | null
    idUser: number
    idIntegration: number
    type: string
    name: string
    config: string | null
    version: string | null
    createdAt: string
    updatedAt: string | null
  }
}

interface CreateAppPayload {
  name: string
  type: string
  config: object
  version: string
}

/**
 * Load environment variables from .env file
 */
export function loadEnv(cwd: string): { storeId: string; token: string } {
  const envPath = path.join(cwd, ".env")

  if (!fs.existsSync(envPath)) {
    throw new Error(
      ".env file not found. Run 'appecom prepare' first and configure your credentials."
    )
  }

  dotenv.config({ path: envPath })

  const storeId = process.env.APPECOM_STOREID
  const token = process.env.APPECOM_SECRET

  if (!storeId || !token) {
    throw new Error(
      "Missing credentials in .env file. Please set APPECOM_STOREID and APPECOM_SECRET."
    )
  }

  return { storeId, token }
}

/**
 * Create app in backend API
 */
export async function createApp(payload: CreateAppPayload): Promise<CreateAppResponse> {
  const cwd = process.cwd()
  const { storeId, token } = loadEnv(cwd)

  const response = await fetch(APP_BASE+"/new", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Store-ID": storeId,
      "X-Integration-Token": token,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || `API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get current scheme from backend
 */
export async function getScheme(serviceId: string): Promise<{ scheme: string }> {
  const cwd = process.cwd()
  const { storeId, token } = loadEnv(cwd)

  const response = await fetch(`${APP_BASE}/scheme/${serviceId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Store-ID": storeId,
      "X-Integration-Token": token,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || `API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Update scheme in backend
 */
export async function updateScheme(serviceId: string, config: object): Promise<CreateAppResponse> {
  const cwd = process.cwd()
  const { storeId, token } = loadEnv(cwd)

  const response = await fetch(`${APP_BASE}/scheme/${serviceId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Store-ID": storeId,
      "X-Integration-Token": token,
    },
    body: JSON.stringify({ config }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || `API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

