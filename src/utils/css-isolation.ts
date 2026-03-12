import postcss from "postcss"

/**
 * Custom PostCSS plugin to add namespace prefix to all CSS rules
 * This prevents conflicts between plugins and with the host page
 */
export function cssIsolationPlugin(prefix: string) {
  return {
    postcssPlugin: "css-isolation",
    Rule(rule: any) {
      // Ignore selectors that should not be prefixed
      const shouldIgnore = (selector: string) => {
        return (
          selector.startsWith("html") ||
          selector.startsWith("body") ||
          selector.startsWith(":root") ||
          selector.startsWith("*") ||
          selector.includes("@") || // @keyframes, etc
          selector.startsWith(prefix) // Already prefixed
        )
      }

      // Process each selector
      rule.selectors = rule.selectors.map((selector: string) => {
        if (shouldIgnore(selector)) {
          return selector
        }

        // Add prefix before the selector
        // Handle pseudo-classes and pseudo-elements
        if (selector.startsWith(":")) {
          return selector // Don't prefix standalone pseudo-selectors
        }

        return `${prefix} ${selector}`
      })
    },
  }
}

// Required for PostCSS 8
;(cssIsolationPlugin as any).postcss = true

/**
 * Process CSS with isolation prefix
 */
export async function processCssIsolation(
  css: string,
  pluginName: string
): Promise<string> {
  const prefix = `.appecom-${pluginName}`

  const result = await postcss([
    cssIsolationPlugin(prefix) as any,
  ]).process(css, { from: undefined })

  return result.css
}
