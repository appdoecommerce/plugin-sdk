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
    props[key] = generateValueForProperty(propSchema, schema.definitions || {})
  }

  return props
}

/**
 * Generate value for a single property
 */
function generateValueForProperty(propSchema: any, definitions: Record<string, any>): any {
  // Use default value if available
  if (propSchema.default !== undefined) {
    return propSchema.default
  }

  // Handle $ref (reference to definition)
  if (propSchema.$ref) {
    const refPath = propSchema.$ref.replace('#/definitions/', '')
    const definition = definitions[refPath]
    
    if (definition && definition.properties) {
      const obj: Record<string, any> = {}
      for (const [key, subPropSchema] of Object.entries<any>(definition.properties)) {
        obj[key] = generateValueForProperty(subPropSchema, definitions)
      }
      return obj
    }
    
    return null
  }

  // Generate sample value based on type
  switch (propSchema.type) {
    case "string":
      if (propSchema.enum && propSchema.enum.length > 0) {
        return propSchema.enum[0]
      }
      if (propSchema.format === "uri" || propSchema.format === "url") {
        return "https://example.com/image.jpg"
      } else if (propSchema.format === "email") {
        return "user@example.com"
      } else if (propSchema.format === "date") {
        return new Date().toISOString().split("T")[0]
      } else if (propSchema.format === "date-time") {
        return new Date().toISOString()
      } else if (propSchema.format === "color") {
        return "#007bff"
      } else {
        return propSchema.title || "Sample Text"
      }

    case "number":
    case "integer":
      if (propSchema.minimum !== undefined) {
        return propSchema.minimum
      } else if (propSchema.maximum !== undefined) {
        return Math.floor(propSchema.maximum / 2)
      } else {
        return 42
      }

    case "boolean":
      return true

    case "array":
      if (propSchema.items?.$ref) {
        // Generate 2 sample items for arrays with references
        const refPath = propSchema.items.$ref.replace('#/definitions/', '')
        const definition = definitions[refPath]
        
        if (definition && definition.properties) {
          const sampleItem: Record<string, any> = {}
          for (const [key, subPropSchema] of Object.entries<any>(definition.properties)) {
            sampleItem[key] = generateValueForProperty(subPropSchema, definitions)
          }
          return [sampleItem, { ...sampleItem }]
        }
      } else if (propSchema.items?.type === "string") {
        return ["Item 1", "Item 2", "Item 3"]
      } else if (propSchema.items?.type === "number") {
        return [1, 2, 3]
      }
      return []

    case "object":
      if (propSchema.properties) {
        const obj: Record<string, any> = {}
        for (const [key, subPropSchema] of Object.entries<any>(propSchema.properties)) {
          obj[key] = generateValueForProperty(subPropSchema, definitions)
        }
        return obj
      }
      return {}

    default:
      return null
  }
}
