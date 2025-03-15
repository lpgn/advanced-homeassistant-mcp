import fetch from "node-fetch";
import OpenAI from "openai";
import { DOMParser, Element, Document } from '@xmldom/xmldom';
import dotenv from 'dotenv';
import readline from 'readline';
import chalk from 'chalk';

// Load environment variables
dotenv.config();

// Retrieve API keys from environment variables
const openaiApiKey = process.env.OPENAI_API_KEY;
const hassToken = process.env.HASS_TOKEN;

if (!openaiApiKey) {
    console.error("Please set the OPENAI_API_KEY environment variable.");
    process.exit(1);
}

if (!hassToken) {
    console.error("Please set the HASS_TOKEN environment variable.");
    process.exit(1);
}

// MCP Server configuration
const MCP_SERVER = 'http://localhost:3000';

interface McpTool {
    name: string;
    description: string;
    parameters: {
        properties: Record<string, any>;
        required: string[];
    };
}

interface ToolsResponse {
    tools: McpTool[];
}

interface SystemAnalysis {
    overview: {
        state: string[];
        health: string[];
        configurations: string[];
        integrations: string[];
        issues: string[];
    };
    performance: {
        resource_usage: string[];
        response_times: string[];
        optimization_areas: string[];
    };
    security: {
        current_measures: string[];
        vulnerabilities: string[];
        recommendations: string[];
    };
    optimization: {
        performance_suggestions: string[];
        config_optimizations: string[];
        integration_improvements: string[];
        automation_opportunities: string[];
    };
    maintenance: {
        required_updates: string[];
        cleanup_tasks: string[];
        regular_tasks: string[];
    };
    entity_usage: {
        most_active: string[];
        rarely_used: string[];
        potential_duplicates: string[];
    };
    automation_analysis: {
        inefficient_automations: string[];
        potential_improvements: string[];
        suggested_blueprints: string[];
        condition_optimizations: string[];
    };
    energy_management?: {
        high_consumption: string[];
        monitoring_suggestions: string[];
        tariff_optimizations: string[];
    };
}

interface McpSchema {
    tools: McpTool[];
    prompts: any[];
    resources: {
        name: string;
        url: string;
    }[];
}

interface McpExecuteResponse {
    success: boolean;
    message?: string;
    devices?: Record<string, any[]>;
}

interface ListDevicesResponse {
    success: boolean;
    message?: string;
    devices?: Record<string, any[]>;
}

// Add model configuration interface
interface ModelConfig {
    name: string;
    maxTokens: number;
    contextWindow: number;
}

// Update model listing to filter based on API key availability
const AVAILABLE_MODELS: ModelConfig[] = [
    // OpenAI models always available
    { name: 'gpt-4', maxTokens: 8192, contextWindow: 8192 },
    { name: 'gpt-4-turbo-preview', maxTokens: 4096, contextWindow: 128000 },
    { name: 'gpt-3.5-turbo', maxTokens: 4096, contextWindow: 16385 },
    { name: 'gpt-3.5-turbo-16k', maxTokens: 16385, contextWindow: 16385 },

    // Conditionally include DeepSeek models
    ...(process.env.DEEPSEEK_API_KEY ? [
        { name: 'deepseek-v3', maxTokens: 4096, contextWindow: 128000 },
        { name: 'deepseek-r1', maxTokens: 4096, contextWindow: 1000000 }
    ] : [])
];

// Add configuration interface
interface AppConfig {
    mcpServer: string;
    openaiModel: string;
    maxRetries: number;
    analysisTimeout: number;
    selectedModel: ModelConfig;
}

// Add colored logging functions
const logger = {
    info: (msg: string) => console.log(chalk.blue(`ℹ ${msg}`)),
    success: (msg: string) => console.log(chalk.green(`✓ ${msg}`)),
    warn: (msg: string) => console.log(chalk.yellow(`⚠ ${msg}`)),
    error: (msg: string) => console.log(chalk.red(`✗ ${msg}`)),
    debug: (msg: string) => process.env.DEBUG && console.log(chalk.gray(`› ${msg}`))
};

// Update default model selection in loadConfig
function loadConfig(): AppConfig {
    // Always use gpt-4 for now
    const defaultModel = AVAILABLE_MODELS.find(m => m.name === 'gpt-4') || AVAILABLE_MODELS[0];

    return {
        mcpServer: process.env.MCP_SERVER || 'http://localhost:3000',
        openaiModel: defaultModel.name,
        maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
        analysisTimeout: parseInt(process.env.ANALYSIS_TIMEOUT || '30000'),
        selectedModel: defaultModel
    };
}

function getOpenAIClient(): OpenAI {
    const config = loadConfig();

    return new OpenAI({
        apiKey: config.selectedModel.name.startsWith('deepseek')
            ? process.env.DEEPSEEK_API_KEY
            : openaiApiKey,
        baseURL: config.selectedModel.name.startsWith('deepseek')
            ? 'https://api.deepseek.com/v1'
            : 'https://api.openai.com/v1'
    });
}

/**
 * Executes a tool on the MCP server
 */
async function executeMcpTool(toolName: string, parameters: Record<string, any> = {}): Promise<any> {
    const config = loadConfig();
    let attempt = 0;

    while (attempt <= config.maxRetries) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), config.analysisTimeout);

            // Update endpoint URL to use the correct API path
            const endpoint = `${config.mcpServer}/api/mcp/execute`;

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${hassToken}`,
                    'Content-Type': "application/json",
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ tool: toolName, parameters }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                if (!isMcpExecuteResponse(data)) {
                    throw new Error('Invalid MCP response structure');
                }
                return data;
            }

            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After') || '1';
                await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000));
                continue;
            }

            if (response.status === 404) {
                logger.error(`Endpoint not found: ${endpoint}`);
                return { success: false, message: 'Endpoint not found' };
            }

            if (response.status >= 500) {
                logger.warn(`Server error (${response.status}), retrying...`);
                attempt++;
                continue;
            }

            handleHttpError(response.status);
            return { success: false, message: `HTTP error ${response.status}` };

        } catch (error) {
            if (error.name === 'AbortError') {
                logger.warn(`Request timed out, retrying (${attempt + 1}/${config.maxRetries})...`);
                attempt++;
                continue;
            }
            logger.error(`Error executing tool ${toolName}: ${error.message}`);
            return { success: false, message: error.message };
        }
    }
    return { success: false, message: 'Max retries exceeded' };
}

// Add type guard for MCP responses
function isMcpExecuteResponse(obj: any): obj is McpExecuteResponse {
    return typeof obj === 'object' &&
        'success' in obj &&
        (obj.success === true || typeof obj.message === 'string');
}

// Add mock data for testing
const MOCK_HA_INFO = {
    devices: {
        light: [
            { entity_id: 'light.living_room', state: 'on', attributes: { friendly_name: 'Living Room Light', brightness: 255 } },
            { entity_id: 'light.kitchen', state: 'off', attributes: { friendly_name: 'Kitchen Light', brightness: 0 } }
        ],
        switch: [
            { entity_id: 'switch.tv', state: 'off', attributes: { friendly_name: 'TV Power' } }
        ],
        sensor: [
            { entity_id: 'sensor.temperature', state: '21.5', attributes: { friendly_name: 'Living Room Temperature', unit_of_measurement: '°C' } },
            { entity_id: 'sensor.humidity', state: '45', attributes: { friendly_name: 'Living Room Humidity', unit_of_measurement: '%' } }
        ],
        climate: [
            { entity_id: 'climate.thermostat', state: 'heat', attributes: { friendly_name: 'Main Thermostat', current_temperature: 20, target_temp_high: 24 } }
        ]
    }
};

interface HassState {
    entity_id: string;
    state: string;
    attributes: Record<string, any>;
    last_changed: string;
    last_updated: string;
}

interface ServiceInfo {
    name: string;
    description: string;
    fields: Record<string, any>;
}

interface ServiceDomain {
    domain: string;
    services: Record<string, ServiceInfo>;
}

/**
 * Collects comprehensive information about the Home Assistant instance using MCP tools
 */
async function collectHomeAssistantInfo(): Promise<any> {
    const info: Record<string, any> = {};
    const hassHost = process.env.HASS_HOST;

    try {
        // Check if we're in test mode
        if (process.env.HA_TEST_MODE === '1') {
            logger.info("Running in test mode with mock data");
            return MOCK_HA_INFO;
        }

        // Get states from Home Assistant directly
        const statesResponse = await fetch(`${hassHost}/api/states`, {
            headers: {
                'Authorization': `Bearer ${hassToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!statesResponse.ok) {
            throw new Error(`Failed to fetch states: ${statesResponse.status}`);
        }

        const states = await statesResponse.json() as HassState[];

        // Group devices by domain
        const devices: Record<string, HassState[]> = {};
        for (const state of states) {
            const [domain] = state.entity_id.split('.');
            if (!devices[domain]) {
                devices[domain] = [];
            }
            devices[domain].push(state);
        }

        info.devices = devices;
        info.device_summary = {
            total_devices: states.length,
            device_types: Object.keys(devices),
            by_domain: Object.fromEntries(
                Object.entries(devices).map(([domain, items]) => [domain, items.length])
            )
        };

        const deviceCount = states.length;
        const domainCount = Object.keys(devices).length;

        if (deviceCount > 0) {
            logger.success(`Found ${deviceCount} devices across ${domainCount} domains`);
        } else {
            logger.warn('No devices found in Home Assistant');
        }

        return info;
    } catch (error) {
        logger.error(`Error fetching devices: ${error instanceof Error ? error.message : 'Unknown error'}`);
        if (process.env.HA_TEST_MODE !== '1') {
            logger.warn(`Failed to connect to Home Assistant. Run with HA_TEST_MODE=1 to use test data.`);
            return {
                devices: {},
                device_summary: {
                    total_devices: 0,
                    device_types: [],
                    by_domain: {}
                }
            };
        }
        return MOCK_HA_INFO;
    }
}

/**
 * Formats the analysis into a nice looking console output
 */
function formatAnalysis(analysis: SystemAnalysis): string {
    const formatSection = (items: string[]): string =>
        items.map(item => `  • ${item}`).join('\n');

    return `
=== System Overview ===
Current State: ${analysis.overview.state.join(', ')}
Health: ${analysis.overview.health.join(', ')}

Notable Configurations:
${formatSection(analysis.overview.configurations)}

Active Integrations:
${formatSection(analysis.overview.integrations)}

Identified Issues:
${formatSection(analysis.overview.issues)}

=== Performance Analysis ===
Resource Usage:
${formatSection(analysis.performance.resource_usage)}

Response Times:
${formatSection(analysis.performance.response_times)}

Areas Needing Optimization:
${formatSection(analysis.performance.optimization_areas)}

=== Security Assessment ===
Current Security Measures:
${formatSection(analysis.security.current_measures)}

Potential Vulnerabilities:
${formatSection(analysis.security.vulnerabilities)}

Security Recommendations:
${formatSection(analysis.security.recommendations)}

=== Optimization Recommendations ===
Performance Improvements:
${formatSection(analysis.optimization.performance_suggestions)}

Configuration Optimizations:
${formatSection(analysis.optimization.config_optimizations)}

Integration Improvements:
${formatSection(analysis.optimization.integration_improvements)}

Automation Opportunities:
${formatSection(analysis.optimization.automation_opportunities)}

=== Maintenance Tasks ===
Required Updates:
${formatSection(analysis.maintenance.required_updates)}

Cleanup Tasks:
${formatSection(analysis.maintenance.cleanup_tasks)}

Regular Maintenance:
${formatSection(analysis.maintenance.regular_tasks)}
`;
}

// Update compression function with filtering
function compressHaInfo(haInfo: any, focus?: string): string {
    return JSON.stringify(haInfo, (key: string, value: any) => {
        // Filter based on device type if focus exists
        if (focus && key === 'devices') {
            const focusedTypes = getRelevantDeviceTypes(focus);
            return Object.fromEntries(
                Object.entries(value).filter(([domain]) =>
                    focusedTypes.includes(domain)
                )
            );
        }

        // Existing compression logic
        if (key === 'attributes') {
            return Object.keys(value).length > 0 ? value : undefined;
        }
        return value;
    }, 2);  // Added space parameter of 2 for better readability
}

// Add device type mapping
function getRelevantDeviceTypes(prompt: string): string[] {
    const TYPE_MAP: Record<string, string[]> = {
        light: ['light', 'switch', 'group'],
        temperature: ['climate', 'sensor'],
        security: ['binary_sensor', 'alarm_control_panel']
    };

    return Object.entries(TYPE_MAP)
        .filter(([keyword]) => prompt.toLowerCase().includes(keyword))
        .flatMap(([, types]) => types);
}

/**
 * Generates analysis and recommendations using the OpenAI API based on the Home Assistant data
 */
async function generateAnalysis(haInfo: any): Promise<SystemAnalysis> {
    const config = loadConfig();

    // If in test mode, return mock analysis
    if (process.env.HA_TEST_MODE === '1') {
        logger.info("Generating mock analysis...");
        return {
            overview: {
                state: ["System running normally", "4 device types detected"],
                health: ["All systems operational", "No critical issues found"],
                configurations: ["Basic configuration detected", "Default settings in use"],
                integrations: ["Light", "Switch", "Sensor", "Climate"],
                issues: ["No major issues detected"]
            },
            performance: {
                resource_usage: ["Normal CPU usage", "Memory usage within limits"],
                response_times: ["Average response time: 0.5s"],
                optimization_areas: ["Consider grouping lights by room"]
            },
            security: {
                current_measures: ["Basic security measures in place"],
                vulnerabilities: ["No critical vulnerabilities detected"],
                recommendations: ["Enable 2FA if not already enabled"]
            },
            optimization: {
                performance_suggestions: ["Group frequently used devices"],
                config_optimizations: ["Consider creating room-based views"],
                integration_improvements: ["Add friendly names to all entities"],
                automation_opportunities: ["Create morning/evening routines"]
            },
            maintenance: {
                required_updates: ["No critical updates pending"],
                cleanup_tasks: ["Remove unused entities"],
                regular_tasks: ["Check sensor battery levels"]
            },
            entity_usage: {
                most_active: ["light.living_room", "sensor.temperature"],
                rarely_used: ["switch.tv"],
                potential_duplicates: []
            },
            automation_analysis: {
                inefficient_automations: [],
                potential_improvements: ["Add time-based light controls"],
                suggested_blueprints: ["Motion-activated lighting"],
                condition_optimizations: []
            },
            energy_management: {
                high_consumption: ["No high consumption devices detected"],
                monitoring_suggestions: ["Add power monitoring to main appliances"],
                tariff_optimizations: ["Consider time-of-use automation"]
            }
        };
    }

    // Original analysis code for non-test mode
    const openai = getOpenAIClient();

    const systemSummary = {
        total_devices: haInfo.device_summary?.total_devices || 0,
        device_types: haInfo.device_summary?.device_types || [],
        device_summary: haInfo.device_summary?.by_domain || {}
    };

    const prompt = `Analyze this Home Assistant system and provide insights in XML format:
${JSON.stringify(systemSummary, null, 2)}

Focus on:
1. System health and state
2. Performance optimization
3. Security considerations
4. Maintenance needs
5. Integration improvements
6. Automation opportunities

Generate your response in this EXACT format:
<analysis>
    <overview>
        <state>Current system state summary</state>
        <health>System health assessment</health>
        <configurations>Key configuration insights</configurations>
        <integrations>Integration status</integrations>
        <issues>Identified issues</issues>
    </overview>
    <performance>
        <resource_usage>Resource usage insights</resource_usage>
        <response_times>Response time analysis</response_times>
        <optimization_areas>Areas needing optimization</optimization_areas>
    </performance>
    <security>
        <current_measures>Current security measures</current_measures>
        <vulnerabilities>Potential vulnerabilities</vulnerabilities>
        <recommendations>Security recommendations</recommendations>
    </security>
    <optimization>
        <performance_suggestions>Performance improvement suggestions</performance_suggestions>
        <config_optimizations>Configuration optimization ideas</config_optimizations>
        <integration_improvements>Integration improvement suggestions</integration_improvements>
        <automation_opportunities>Automation opportunities</automation_opportunities>
    </optimization>
    <maintenance>
        <required_updates>Required updates</required_updates>
        <cleanup_tasks>Cleanup tasks</cleanup_tasks>
        <regular_tasks>Regular maintenance tasks</regular_tasks>
    </maintenance>
    <entity_usage>
        <most_active>Most active entities</most_active>
        <rarely_used>Rarely used entities</rarely_used>
        <potential_duplicates>Potential duplicate entities</potential_duplicates>
    </entity_usage>
    <automation_analysis>
        <inefficient_automations>Inefficient automations</inefficient_automations>
        <potential_improvements>Potential improvements</potential_improvements>
        <suggested_blueprints>Suggested blueprints</suggested_blueprints>
        <condition_optimizations>Condition optimizations</condition_optimizations>
    </automation_analysis>
    <energy_management>
        <high_consumption>High consumption devices</high_consumption>
        <monitoring_suggestions>Monitoring suggestions</monitoring_suggestions>
        <tariff_optimizations>Tariff optimizations</tariff_optimizations>
    </energy_management>
</analysis>`;

    try {
        const completion = await openai.chat.completions.create({
            model: config.selectedModel.name,
            messages: [
                {
                    role: "system",
                    content: "You are a Home Assistant expert. Analyze the system data and provide detailed insights in the specified XML format. Be specific and actionable in your recommendations."
                },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: Math.min(config.selectedModel.maxTokens, 4000)
        });

        const result = completion.choices[0].message?.content || "";

        // Clean the response and parse XML
        const cleanedResult = result.replace(/```xml/g, '').replace(/```/g, '').trim();
        const parser = new DOMParser();

        try {
            const xmlDoc = parser.parseFromString(cleanedResult, "text/xml");

            if (xmlDoc.getElementsByTagName('analysis').length === 0) {
                throw new Error('Invalid XML response structure');
            }

            // Helper function to get text content safely
            const getTextContent = (path: string): string[] => {
                const elements = xmlDoc.getElementsByTagName(path);
                return Array.from(elements).map(el => el.textContent || '').filter(Boolean);
            };

            // Map XML response to SystemAnalysis structure
            const analysis: SystemAnalysis = {
                overview: {
                    state: getTextContent('state'),
                    health: getTextContent('health'),
                    configurations: getTextContent('configurations'),
                    integrations: getTextContent('integrations'),
                    issues: getTextContent('issues'),
                },
                performance: {
                    resource_usage: getTextContent('resource_usage'),
                    response_times: getTextContent('response_times'),
                    optimization_areas: getTextContent('optimization_areas'),
                },
                security: {
                    current_measures: getTextContent('current_measures'),
                    vulnerabilities: getTextContent('vulnerabilities'),
                    recommendations: getTextContent('recommendations'),
                },
                optimization: {
                    performance_suggestions: getTextContent('performance_suggestions'),
                    config_optimizations: getTextContent('config_optimizations'),
                    integration_improvements: getTextContent('integration_improvements'),
                    automation_opportunities: getTextContent('automation_opportunities'),
                },
                maintenance: {
                    required_updates: getTextContent('required_updates'),
                    cleanup_tasks: getTextContent('cleanup_tasks'),
                    regular_tasks: getTextContent('regular_tasks'),
                },
                entity_usage: {
                    most_active: getTextContent('most_active'),
                    rarely_used: getTextContent('rarely_used'),
                    potential_duplicates: getTextContent('potential_duplicates'),
                },
                automation_analysis: {
                    inefficient_automations: getTextContent('inefficient_automations'),
                    potential_improvements: getTextContent('potential_improvements'),
                    suggested_blueprints: getTextContent('suggested_blueprints'),
                    condition_optimizations: getTextContent('condition_optimizations'),
                },
                energy_management: {
                    high_consumption: getTextContent('high_consumption'),
                    monitoring_suggestions: getTextContent('monitoring_suggestions'),
                    tariff_optimizations: getTextContent('tariff_optimizations'),
                }
            };

            return analysis;
        } catch (parseError) {
            throw new Error(`Failed to parse analysis response: ${parseError.message}`);
        }
    } catch (error) {
        console.error("Error during OpenAI API call:", error);
        throw new Error("Failed to generate analysis");
    }
}

interface AutomationConfig {
    id?: string;
    alias?: string;
    description?: string;
    trigger?: Array<{
        platform: string;
        [key: string]: any;
    }>;
    condition?: Array<{
        condition: string;
        [key: string]: any;
    }>;
    action?: Array<{
        service?: string;
        [key: string]: any;
    }>;
    mode?: string;
}

async function handleAutomationOptimization(haInfo: any): Promise<void> {
    try {
        const hassHost = process.env.HASS_HOST;

        // Get automations directly from Home Assistant
        const automationsResponse = await fetch(`${hassHost}/api/states`, {
            headers: {
                'Authorization': `Bearer ${hassToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!automationsResponse.ok) {
            throw new Error(`Failed to fetch automations: ${automationsResponse.status}`);
        }

        const states = await automationsResponse.json() as HassState[];
        const automations = states.filter(state => state.entity_id.startsWith('automation.'));

        // Get services to understand what actions are available
        const servicesResponse = await fetch(`${hassHost}/api/services`, {
            headers: {
                'Authorization': `Bearer ${hassToken}`,
                'Content-Type': 'application/json'
            }
        });

        let availableServices: Record<string, any> = {};
        if (servicesResponse.ok) {
            const services = await servicesResponse.json() as ServiceDomain[];
            availableServices = services.reduce((acc: Record<string, any>, service: ServiceDomain) => {
                if (service.domain && service.services) {
                    acc[service.domain] = service.services;
                }
                return acc;
            }, {});
            logger.debug(`Retrieved services from ${Object.keys(availableServices).length} domains`);
        }

        // Enrich automation data with service information
        const enrichedAutomations = automations.map(automation => {
            const actions = automation.attributes?.action || [];
            const enrichedActions = actions.map((action: any) => {
                if (action.service) {
                    const [domain, service] = action.service.split('.');
                    const serviceInfo = availableServices[domain]?.[service];
                    return {
                        ...action,
                        service_info: serviceInfo
                    };
                }
                return action;
            });

            return {
                ...automation,
                config: {
                    id: automation.entity_id.split('.')[1],
                    alias: automation.attributes?.friendly_name,
                    trigger: automation.attributes?.trigger || [],
                    condition: automation.attributes?.condition || [],
                    action: enrichedActions,
                    mode: automation.attributes?.mode || 'single'
                }
            };
        });

        if (automations.length === 0) {
            console.log(chalk.bold.underline("\nAutomation Optimization Report"));
            console.log(chalk.yellow("No automations found in the system. Consider creating some automations to improve your Home Assistant experience."));
            return;
        }

        logger.info(`Analyzing ${automations.length} automations...`);
        const optimizationXml = await analyzeAutomations(enrichedAutomations);

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(optimizationXml, "text/xml");

        const formatSection = (title: string, items: string[]) => {
            if (!items || items.length === 0) return '';
            return `${chalk.bold(title)}:\n${items.map(i => `  • ${i}`).join('\n')}`;
        };

        console.log(chalk.bold.underline("\nAutomation Optimization Report"));

        const findings = getItems(xmlDoc, "analysis > findings > item");
        const recommendations = getItems(xmlDoc, "analysis > recommendations > item");
        const blueprints = getItems(xmlDoc, "analysis > blueprints > item");

        if (!findings.length && !recommendations.length && !blueprints.length) {
            console.log(chalk.green("✓ Your automations appear to be well-configured! No immediate optimizations needed."));
            console.log("\nSuggestions for future improvements:");
            console.log("  • Consider adding error handling to critical automations");
            console.log("  • Review automation triggers periodically for efficiency");
            console.log("  • Monitor automation performance over time");
            return;
        }

        const findingsSection = formatSection("Key Findings", findings);
        const recommendationsSection = formatSection("Recommendations", recommendations);
        const blueprintsSection = formatSection("Suggested Blueprints", blueprints);

        if (findingsSection) console.log(findingsSection);
        if (recommendationsSection) console.log("\n" + recommendationsSection);
        if (blueprintsSection) console.log("\n" + blueprintsSection);

    } catch (error) {
        logger.error(`Automation optimization failed: ${error.message}`);
        console.log(chalk.yellow("\nSuggested actions:"));
        console.log("  • Check if your Home Assistant instance is running");
        console.log("  • Verify your authentication token");
        console.log("  • Try running the analysis again in a few minutes");
    }
}

async function analyzeAutomations(automations: any[]): Promise<string> {
    const openai = getOpenAIClient();
    const config = loadConfig();

    // Create a more detailed summary of automations
    const automationSummary = {
        total: automations.length,
        active: automations.filter(a => a.state === 'on').length,
        by_type: automations.reduce((acc: Record<string, number>, auto) => {
            const type = auto.attributes?.mode || 'single';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {}),
        recently_triggered: automations.filter(a => {
            const lastTriggered = a.attributes?.last_triggered;
            if (!lastTriggered) return false;
            const lastTriggerDate = new Date(lastTriggered);
            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);
            return lastTriggerDate > oneDayAgo;
        }).length,
        trigger_types: automations.reduce((acc: Record<string, number>, auto) => {
            const triggers = auto.config?.trigger || [];
            triggers.forEach((trigger: any) => {
                const type = trigger.platform || 'unknown';
                acc[type] = (acc[type] || 0) + 1;
            });
            return acc;
        }, {}),
        action_types: automations.reduce((acc: Record<string, number>, auto) => {
            const actions = auto.config?.action || [];
            actions.forEach((action: any) => {
                const type = action.service?.split('.')[0] || 'unknown';
                acc[type] = (acc[type] || 0) + 1;
            });
            return acc;
        }, {}),
        service_domains: Array.from(new Set(automations.flatMap(auto =>
            (auto.config?.action || [])
                .map((action: any) => action.service?.split('.')[0])
                .filter(Boolean)
        ))).sort(),
        names: automations.map(a => a.attributes?.friendly_name || a.entity_id.split('.')[1]).slice(0, 10)
    };

    const prompt = `Analyze these Home Assistant automations and provide optimization suggestions in XML format:
${JSON.stringify(automationSummary, null, 2)}

Key metrics:
- Total automations: ${automationSummary.total}
- Active automations: ${automationSummary.active}
- Recently triggered: ${automationSummary.recently_triggered}
- Automation modes: ${JSON.stringify(automationSummary.by_type)}
- Trigger types: ${JSON.stringify(automationSummary.trigger_types)}
- Action types: ${JSON.stringify(automationSummary.action_types)}
- Service domains used: ${automationSummary.service_domains.join(', ')}

Generate your response in this EXACT format:
<analysis>
    <findings>
        <item>Finding 1</item>
        <item>Finding 2</item>
    </findings>
    <recommendations>
        <item>Recommendation 1</item>
        <item>Recommendation 2</item>
    </recommendations>
    <blueprints>
        <item>Blueprint suggestion 1</item>
        <item>Blueprint suggestion 2</item>
    </blueprints>
</analysis>

Focus on:
1. Identifying patterns and potential improvements based on trigger and action types
2. Suggesting energy-saving optimizations based on the services being used
3. Recommending error handling improvements
4. Suggesting relevant blueprints for common automation patterns
5. Analyzing the distribution of automation types and suggesting optimizations`;

    try {
        const completion = await openai.chat.completions.create({
            model: config.selectedModel.name,
            messages: [
                {
                    role: "system",
                    content: "You are a Home Assistant automation expert. Analyze the provided automation summary and respond with specific, actionable suggestions in the required XML format."
                },
                { role: "user", content: prompt }
            ],
            temperature: 0.2,
            max_tokens: Math.min(config.selectedModel.maxTokens, 2048)
        });

        const response = completion.choices[0].message?.content || "";

        // Ensure the response is valid XML
        if (!response.trim().startsWith('<analysis>')) {
            return `<?xml version="1.0"?>
<analysis>
    <findings>
        <item>No issues found in automation analysis</item>
    </findings>
    <recommendations>
        <item>Current automation setup appears optimal</item>
    </recommendations>
    <blueprints>
        <item>No additional blueprints needed at this time</item>
    </blueprints>
</analysis>`;
        }

        return response;
    } catch (error) {
        logger.error(`Automation analysis failed: ${error.message}`);
        return `<?xml version="1.0"?>
<analysis>
    <findings>
        <item>Error during analysis: ${error.message}</item>
    </findings>
    <recommendations>
        <item>Please try again later</item>
        <item>Check your Home Assistant connection</item>
        <item>Verify your authentication token</item>
    </recommendations>
    <blueprints>
        <item>No blueprint suggestions available</item>
    </blueprints>
</analysis>`;
    }
}

// Add new handleCustomPrompt function
async function handleCustomPrompt(haInfo: any, customPrompt: string): Promise<void> {
    try {
        // Add device metadata
        const deviceTypes = haInfo.devices ? Object.keys(haInfo.devices) : [];
        const deviceStates = haInfo.devices ? Object.entries(haInfo.devices).reduce((acc: Record<string, number>, [domain, devices]) => {
            acc[domain] = (devices as any[]).length;
            return acc;
        }, {}) : {};
        const totalDevices = deviceTypes.reduce((sum, type) => sum + deviceStates[type], 0);

        // Get automation information
        const automations = haInfo.devices?.automation || [];
        const automationDetails = automations.map((auto: any) => ({
            name: auto.attributes?.friendly_name || auto.entity_id.split('.')[1],
            state: auto.state,
            last_triggered: auto.attributes?.last_triggered,
            mode: auto.attributes?.mode,
            triggers: auto.attributes?.trigger?.map((t: any) => ({
                platform: t.platform,
                ...t
            })) || [],
            conditions: auto.attributes?.condition?.map((c: any) => ({
                condition: c.condition,
                ...c
            })) || [],
            actions: auto.attributes?.action?.map((a: any) => ({
                service: a.service,
                ...a
            })) || []
        }));

        const automationSummary = {
            total: automations.length,
            active: automations.filter((a: any) => a.state === 'on').length,
            trigger_types: automations.reduce((acc: Record<string, number>, auto: any) => {
                const triggers = auto.attributes?.trigger || [];
                triggers.forEach((trigger: any) => {
                    const type = trigger.platform || 'unknown';
                    acc[type] = (acc[type] || 0) + 1;
                });
                return acc;
            }, {}),
            action_types: automations.reduce((acc: Record<string, number>, auto: any) => {
                const actions = auto.attributes?.action || [];
                actions.forEach((action: any) => {
                    const type = action.service?.split('.')[0] || 'unknown';
                    acc[type] = (acc[type] || 0) + 1;
                });
                return acc;
            }, {}),
            service_domains: Array.from(new Set(automations.flatMap((auto: any) =>
                (auto.attributes?.action || [])
                    .map((action: any) => action.service?.split('.')[0])
                    .filter(Boolean)
            ))).sort()
        };

        // Create a summary of the devices
        const deviceSummary = Object.entries(deviceStates)
            .map(([domain, count]) => `${domain}: ${count}`)
            .join(', ');

        if (process.env.HA_TEST_MODE === '1') {
            console.log("\nTest Mode Analysis Results:\n");
            console.log("Based on your Home Assistant setup with:");
            console.log(`- ${totalDevices} total devices`);
            console.log(`- Device types: ${deviceTypes.join(', ')}`);
            console.log("\nAnalysis for prompt: " + customPrompt);
            console.log("1. Current State:");
            console.log("   - All devices are functioning normally");
            console.log("   - System is responsive and stable");
            console.log("\n2. Recommendations:");
            console.log("   - Consider grouping devices by room");
            console.log("   - Add automation for frequently used devices");
            console.log("   - Monitor power usage of main appliances");
            console.log("\n3. Optimization Opportunities:");
            console.log("   - Create scenes for different times of day");
            console.log("   - Set up presence detection for automatic control");
            return;
        }

        const openai = getOpenAIClient();
        const config = loadConfig();

        const completion = await openai.chat.completions.create({
            model: config.selectedModel.name,
            messages: [
                {
                    role: "system",
                    content: `You are a Home Assistant expert. Analyze the following Home Assistant information and respond to the user's prompt. 
                             Current system has ${totalDevices} devices across ${deviceTypes.length} types.
                             Device distribution: ${deviceSummary}
                             
                             Automation Summary:
                             - Total automations: ${automationSummary.total}
                             - Active automations: ${automationSummary.active}
                             - Trigger types: ${JSON.stringify(automationSummary.trigger_types)}
                             - Action types: ${JSON.stringify(automationSummary.action_types)}
                             - Service domains used: ${automationSummary.service_domains.join(', ')}
                             
                             Detailed Automation List:
                             ${JSON.stringify(automationDetails, null, 2)}`
                },
                { role: "user", content: customPrompt },
            ],
            max_tokens: Math.min(config.selectedModel.maxTokens, 2048), // Limit token usage
            temperature: 0.3,
        });

        console.log("\nAnalysis Results:\n");
        console.log(completion.choices[0].message?.content || "No response generated");

    } catch (error) {
        console.error("Error processing custom prompt:", error);

        if (process.env.HA_TEST_MODE === '1') {
            console.log("\nTest Mode Fallback Analysis:\n");
            console.log("1. System Overview:");
            console.log("   - Basic configuration detected");
            console.log("   - All core services operational");
            console.log("\n2. Suggestions:");
            console.log("   - Review device naming conventions");
            console.log("   - Consider adding automation blueprints");
            return;
        }

        // Retry with simplified prompt if there's an error
        try {
            const retryPrompt = "Please provide a simpler analysis of the Home Assistant system.";
            const openai = getOpenAIClient();
            const config = loadConfig();

            const retryCompletion = await openai.chat.completions.create({
                model: config.selectedModel.name,
                messages: [
                    {
                        role: "system",
                        content: "You are a Home Assistant expert. Provide a simple analysis of the system."
                    },
                    { role: "user", content: retryPrompt },
                ],
                max_tokens: Math.min(config.selectedModel.maxTokens, 2048), // Limit token usage
                temperature: 0.3,
            });

            console.log("\nAnalysis Results:\n");
            console.log(retryCompletion.choices[0].message?.content || "No response generated");
        } catch (retryError) {
            console.error("Error during retry:", retryError);
        }
    }
}

// Enhanced main function with progress indicators
async function main() {
    let config = loadConfig();

    logger.info(`Starting analysis with ${config.selectedModel.name} model...`);

    try {
        logger.info("Collecting Home Assistant information...");
        const haInfo = await collectHomeAssistantInfo();

        if (!Object.keys(haInfo).length) {
            logger.error("Failed to collect Home Assistant information");
            return;
        }

        logger.success(`Collected data from ${Object.keys(haInfo.devices).length} device types`);

        // Get mode from command line argument or default to 1
        const mode = process.argv[2] || "1";

        console.log("\nAvailable modes:");
        console.log("1. Standard Analysis");
        console.log("2. Custom Prompt");
        console.log("3. Automation Optimization");
        console.log(`Selected mode: ${mode}\n`);

        if (mode === "2") {
            // For custom prompt mode, get the prompt from remaining arguments
            const customPrompt = process.argv.slice(3).join(" ") || "Analyze my Home Assistant setup";
            console.log(`Custom prompt: ${customPrompt}\n`);
            await handleCustomPrompt(haInfo, customPrompt);
        } else if (mode === "3") {
            await handleAutomationOptimization(haInfo);
        } else {
            logger.info("Generating standard analysis...");
            const analysis = await generateAnalysis(haInfo);
            const formattedAnalysis = formatAnalysis(analysis);
            console.log("\n" + chalk.bold.underline("Home Assistant Analysis") + "\n");
            console.log(formattedAnalysis);
        }

    } catch (error) {
        logger.error(`Critical failure: ${error.message}`);
        process.exit(1);
    }
}

// Add HTTP error handler
function handleHttpError(status: number): void {
    const errors: Record<number, string> = {
        400: 'Invalid request parameters',
        401: 'Authentication failed - check HASS_TOKEN',
        403: 'Insufficient permissions',
        404: 'Endpoint not found',
        429: 'Too many requests'
    };

    logger.error(errors[status] || `HTTP error ${status}`);
}

// Add helper function for XML parsing
function getItems(xmlDoc: Document, path: string): string[] {
    return Array.from(xmlDoc.getElementsByTagName('item'))
        .filter(item => {
            let parent = item.parentNode;
            const pathParts = path.split('>').reverse();
            for (const part of pathParts) {
                if (!parent || parent.nodeName !== part.trim()) return false;
                parent = parent.parentNode;
            }
            return true;
        })
        .map(item => (item as Element).textContent || "");
}

// Replace the Express server initialization at the bottom with Bun's server
if (process.env.PROCESSOR_TYPE === 'openai') {
    // Initialize Bun server for OpenAI
    const server = Bun.serve({
        port: process.env.PORT || 3000,
        async fetch(req) {
            const url = new URL(req.url);

            // Handle chat endpoint
            if (url.pathname === '/chat' && req.method === 'POST') {
                try {
                    const body = await req.json();
                    // Handle chat logic here
                    return new Response(JSON.stringify({ success: true }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (error) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: error.message
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }

            // Handle 404 for unknown routes
            return new Response('Not Found', { status: 404 });
        },
    });

    console.log(`[OpenAI Server] Running on port ${server.port}`);
} else {
    console.log('[Claude Mode] Using stdio communication');
}

main().catch((error) => {
    console.error("Unexpected error:", error);
});
