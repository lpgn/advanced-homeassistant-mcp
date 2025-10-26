import { z } from 'zod';
import * as yaml from 'js-yaml';

/**
 * Advanced YAML configuration file editor
 * Read, edit, and write YAML files including automations, scripts, dashboards, and more
 */
export const yamlEditorTool = {
  name: 'yaml_editor',
  description: 'Read, edit, and write YAML configuration files in Home Assistant. Supports automations.yaml, scripts.yaml, dashboard configs (ui-lovelace.yaml), and custom YAML files. Can perform operations like read, write, update (merge), and validate.',
  parameters: z.object({
    operation: z.enum(['read', 'write', 'update', 'validate', 'list']).describe('Operation to perform: read (get content), write (replace entire file), update (merge with existing), validate (check syntax), list (show available config files)'),
    file_path: z.string().optional().describe('Relative path to YAML file from config directory (e.g., "automations.yaml", "scripts.yaml", "ui-lovelace.yaml", "custom_components/my_component/config.yaml"). Required for all operations except list.'),
    content: z.any().optional().describe('Content to write/update. Can be YAML string or JavaScript object. For update operation, only specified keys will be merged/updated.'),
    backup: z.boolean().optional().default(true).describe('Create backup before writing (default: true). Backup will be saved as filename.backup.yaml'),
  }),
  execute: async (params: { operation: string; file_path?: string; content?: any; backup?: boolean }) => {
    const wrapResult = (result: any) => ({
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    });
    
    try {
      // Check if YAML editing is enabled for write operations
      const yamlEditorEnabled = process.env.ENABLE_YAML_EDITOR === 'true';
      const configModsAllowed = process.env.ALLOW_CONFIG_MODIFICATIONS === 'true';
      
      const isReadOnly = params.operation === 'read' || params.operation === 'list' || params.operation === 'validate';
      
      if (!isReadOnly && !yamlEditorEnabled && !configModsAllowed) {
        return wrapResult({
          success: false,
          error: "YAML write operations are disabled",
          message: "YAML file write/update operations are disabled. Read and validation operations may still work.",
          suggestion: "To enable, set ENABLE_YAML_EDITOR=true in your .env file and restart the container."
        });
      }
      
      const HASS_HOST = process.env.HASS_HOST;
      const HASS_TOKEN = process.env.HASS_TOKEN;

      if (!HASS_HOST || !HASS_TOKEN) {
        throw new Error('HASS_HOST or HASS_TOKEN not configured');
      }

      // List available configuration files
      if (params.operation === 'list') {
        return wrapResult({
          success: true,
          message: 'Common configuration files you can edit',
          files: [
            { path: 'automations.yaml', description: 'Automation definitions' },
            { path: 'scripts.yaml', description: 'Script definitions' },
            { path: 'scenes.yaml', description: 'Scene definitions' },
            { path: 'groups.yaml', description: 'Group definitions' },
            { path: 'customize.yaml', description: 'Entity customizations' },
            { path: 'ui-lovelace.yaml', description: 'Lovelace dashboard configuration (if YAML mode)' },
            { path: '.storage/lovelace', description: 'Lovelace dashboard storage (JSON format)' },
            { path: 'configuration.yaml', description: 'Main configuration file (READ ONLY - use with caution)' },
          ],
          note: 'You can also specify custom paths relative to the config directory',
        });
      }

      if (!params.file_path) {
        return wrapResult({
          success: false,
          message: 'file_path is required for this operation',
        });
      }

      // Use file_operations tool approach - direct API access
      const baseUrl = HASS_HOST.replace(/\/$/, '');
      
      // Read operation
      if (params.operation === 'read' || params.operation === 'validate') {
        try {
          // Try to read using Home Assistant file access
          // Note: This uses a hypothetical endpoint - actual implementation may vary
          const response = await fetch(`${baseUrl}/api/config/file?file=${encodeURIComponent(params.file_path)}`, {
            headers: {
              Authorization: `Bearer ${HASS_TOKEN}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            return wrapResult({
              success: false,
              message: `File operations not directly supported by Home Assistant API. Consider using:
1. File Editor add-on (Supervisor > Add-on Store > File Editor)
2. SSH & Web Terminal add-on for direct file access
3. Studio Code Server add-on for full IDE experience
4. Samba share for network file access

For YAML editing, you can also:
- Use automation/script creation tools (automation_config tool)
- Use Home Assistant UI for dashboard editing
- Use service calls to modify configurations programmatically

File path requested: ${params.file_path}`,
              alternatives: {
                automations: 'Use automation_config tool for creating/editing automations',
                scripts: 'Use script_control tool for script management',
                dashboards: 'Use dashboard_config tool for Lovelace configuration',
              },
            });
          }

          const fileContent = await response.text();
          
          if (params.operation === 'validate') {
            try {
              const parsed = yaml.load(fileContent);
              return wrapResult({
                success: true,
                message: 'YAML syntax is valid',
                valid: true,
              });
            } catch (yamlError: any) {
              return wrapResult({
                success: false,
                message: 'YAML syntax error',
                valid: false,
                error: yamlError.message,
              });
            }
          }

          // Parse YAML and return
          try {
            const parsed = yaml.load(fileContent);
            return wrapResult({
              success: true,
              file_path: params.file_path,
              content: parsed,
              raw_content: fileContent,
              format: 'yaml',
            });
          } catch (yamlError: any) {
            return wrapResult({
              success: true,
              file_path: params.file_path,
              raw_content: fileContent,
              format: 'yaml',
              warning: `YAML parsing failed: ${yamlError.message}`,
            });
          }
        } catch (error) {
          return wrapResult({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to read file',
          });
        }
      }

      // Write/Update operations
      if (params.operation === 'write' || params.operation === 'update') {
        if (!params.content) {
          return wrapResult({
            success: false,
            message: 'content parameter is required for write/update operations',
          });
        }

        // This is a placeholder - actual file writing would require appropriate API access
        return wrapResult({
          success: false,
          message: `Direct file writing not supported via Home Assistant REST API.

To edit ${params.file_path}, use one of these methods:

1. **File Editor Add-on** (Recommended):
   - Install from Supervisor > Add-on Store
   - Provides web-based file editing
   - Supports all YAML files
   - Has built-in validation

2. **SSH & Web Terminal Add-on**:
   - Direct command-line access
   - Full file system access
   - Can use nano, vim, or other editors

3. **Studio Code Server Add-on**:
   - Full VS Code IDE in browser
   - Syntax highlighting and validation
   - Git integration

4. **Samba Share**:
   - Edit files from your computer
   - Works with any text editor
   - Network file access

5. **Programmatic Alternatives**:
   - For automations: Use 'automation_config' tool (create, update, delete)
   - For scripts: Create via 'script_control' tool
   - For dashboards: Use 'dashboard_config' tool
   - For service calls: Use 'service_call' tool

Your content was prepared but not written:
${typeof params.content === 'string' ? params.content : yaml.dump(params.content)}`,
          prepared_content: params.content,
          file_path: params.file_path,
        });
      }

      return wrapResult({
        success: false,
        message: 'Invalid operation',
      });
    } catch (error) {
      return wrapResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  },
};



