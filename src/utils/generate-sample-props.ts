/**
 * Generate sample props from JSON Schema
 * Uses default values when available, or generates appropriate sample data
 */
export function generateSampleProps(schema: any): Record<string, any> {
  if (!schema || !schema.properties) {
    return {}
  }

  const props: Record<string, any> = {}

  for (const [key, propSchema] of Object.entries<any>(schema.properties)) {
    // Use default value if available
    if (propSchema.default !== undefined) {
      props[key] = propSchema.default
      continue
    }

    // Generate sample value based on type
    switch (propSchema.type) {
      case "string":
        if (propSchema.format === "uri" || propSchema.format === "url") {
          props[key] = "https://example.com/image.jpg"
        } else if (propSchema.format === "email") {
          props[key] = "user@example.com"
        } else if (propSchema.format === "date") {
          props[key] = new Date().toISOString().split("T")[0]
        } else if (propSchema.format === "date-time") {
          props[key] = new Date().toISOString()
        } else {
          props[key] = propSchema.title || key || "Sample Text"
        }
        break

      case "number":
      case "integer":
        if (propSchema.minimum !== undefined) {
          props[key] = propSchema.minimum
        } else if (propSchema.maximum !== undefined) {
          props[key] = Math.floor(propSchema.maximum / 2)
        } else {
          props[key] = 42
        }
        break

      case "boolean":
        props[key] = true
        break

      case "array":
        if (propSchema.items?.type === "string") {
          props[key] = ["Item 1", "Item 2", "Item 3"]
        } else if (propSchema.items?.type === "number") {
          props[key] = [1, 2, 3]
        } else {
          props[key] = []
        }
        break

      case "object":
        props[key] = {}
        break

      default:
        props[key] = null
    }
  }

  return props
}
