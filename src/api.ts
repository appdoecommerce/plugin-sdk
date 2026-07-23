import dotenv from "dotenv"
import path from "path"
import fs from "fs"
import FormData from "form-data"
import fetch from "node-fetch"

function normalizeBaseUrl(value: string): string {
  return value.endsWith("/") ? value : `${value}/`
}

function resolveDashboardUrl(): string {
  const envNode = process.env.NODE_ENV
  const isDev = envNode !== "production"
  const configured = process.env.APPECOM_APP_URL?.trim()
  const fallback = isDev ? "http://localhost:3333/" : "https://v2.appdoecommerce.com.br/"
  return normalizeBaseUrl(configured || fallback)
}

function resolvePluginServerUrl(): string {
  const envNode = process.env.NODE_ENV
  const isDev = envNode !== "production"
  const configured = process.env.APPECOM_PLUGIN_SERVER_URL?.trim()
  const fallback = isDev ? "http://localhost:4000/" : "https://v2-plugins.appdoecommerce.com.br/"
  return normalizeBaseUrl(configured || fallback)
}

// ============================================
// Types
// ============================================

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

interface CreateThemeResponse {
  theme: {
    id: number
    createdByUserId: number
    name: string
    type: string
    latestVersion: string | null
    createdAt: string
    updatedAt: string | null
  }
}

interface CreateThemePayload {
  name: string
  type: string
}

interface DeployPluginResponse {
  success: boolean
  message: string
  plugin: {
    name: string
    version: string
    storeId: string
    path: string
    latest: string
    deployedAt: string
  }
}

interface DeployPluginOptions {
  zipPath: string
  pluginName: string
  version: string
  manifest: any
  force?: boolean
}

// ============================================
// Functions
// ============================================

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

function resolveApiEndpoints(cwd: string) {
  loadEnv(cwd)

  const appHost = resolveDashboardUrl()
  const pluginHost = resolvePluginServerUrl()

  return {
    appBase: new URL("api/plugins", appHost).toString(),
    themesBase: new URL("api/themes", appHost).toString(),
    pluginServerUrl: pluginHost,
  }
}

/**
 * Create app in backend API
 */
export async function createApp(payload: CreateAppPayload): Promise<CreateAppResponse> {
  const cwd = process.cwd()
  const { storeId, token } = loadEnv(cwd)
  const { appBase } = resolveApiEndpoints(cwd)

  const response = await fetch(`${appBase}/new`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Store-ID": storeId,
      "X-Integration-Token": token,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as any
    throw new Error(error.error || `API Error: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<CreateAppResponse>
}

/**
 * Delete app from backend
 */
export async function deleteApp(serviceId: string): Promise<{ message: string }> {
  const cwd = process.cwd()
  const { storeId, token } = loadEnv(cwd)
  const { appBase } = resolveApiEndpoints(cwd)

  const response = await fetch(`${appBase}/delete/${serviceId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "X-Store-ID": storeId,
      "X-Integration-Token": token,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as any
    throw new Error(error.error || `API Error: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<{ message: string }>
}

/**
 * Get current scheme from backend
 */
export async function getScheme(serviceId: string): Promise<{ scheme: string }> {
  const cwd = process.cwd()
  const { storeId, token } = loadEnv(cwd)
  const { appBase } = resolveApiEndpoints(cwd)

  const response = await fetch(`${appBase}/scheme/${serviceId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Store-ID": storeId,
      "X-Integration-Token": token,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as any
    throw new Error(error.error || `API Error: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<{ scheme: string }>
}

/**
 * Update scheme in backend
 */
export async function updateScheme(serviceId: string, config: object): Promise<CreateAppResponse> {
  const cwd = process.cwd()
  const { storeId, token } = loadEnv(cwd)
  const { appBase } = resolveApiEndpoints(cwd)

  const response = await fetch(`${appBase}/scheme/${serviceId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Store-ID": storeId,
      "X-Integration-Token": token,
    },
    body: JSON.stringify({ config }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as any
    throw new Error(error.error || `API Error: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<CreateAppResponse>
}

/**
 * Deploy plugin to plugin server
 */
export async function deployPlugin(options: DeployPluginOptions): Promise<DeployPluginResponse> {
  const cwd = process.cwd()
  const { storeId, token } = loadEnv(cwd)
  const { pluginServerUrl } = resolveApiEndpoints(cwd)

  const form = new FormData()
  
  form.append("plugin", fs.createReadStream(options.zipPath))
  form.append("name", options.pluginName)
  form.append("version", options.version)
  form.append("manifest", JSON.stringify(options.manifest))
  form.append("force", String(options.force || false))

  const response = await fetch(new URL("api/plugins/deploy", pluginServerUrl).toString(), {
    method: "POST",
    body: form,
    headers: {
      ...form.getHeaders(),
      "X-Store-ID": storeId,
      "X-Integration-Token": token,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as any
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  const result = await response.json() as any
  
  if (!result.success) {
    throw new Error(result.message || "Deploy failed")
  }

  return result
}

export async function createTheme(payload: CreateThemePayload): Promise<CreateThemeResponse> {
  const cwd = process.cwd()
  const { storeId, token } = loadEnv(cwd)
  const { themesBase } = resolveApiEndpoints(cwd)

  const response = await fetch(`${themesBase}/new`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Store-ID": storeId,
      "X-Integration-Token": token,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as any
    throw new Error(error.error || `API Error: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<CreateThemeResponse>
}

export async function updateThemeSchemeVersion(
  themeId: number,
  version: string,
  payload: { manifest: object; scheme: object; cleanScheme: object }
): Promise<{ themeVersion: { id: number; themeId: number; version: string; updatedAt: string | null } }> {
  const cwd = process.cwd()
  const { storeId, token } = loadEnv(cwd)
  const { themesBase } = resolveApiEndpoints(cwd)

  const response = await fetch(`${themesBase}/scheme/${themeId}/${version}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Store-ID": storeId,
      "X-Integration-Token": token,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as any
    throw new Error(error.error || `API Error: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<{
    themeVersion: { id: number; themeId: number; version: string; updatedAt: string | null }
  }>
}

