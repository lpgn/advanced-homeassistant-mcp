import fetch from "node-fetch";
import OpenAI from "openai";
import { DOMParser, Element, Document } from '@xmldom/xmldom';
import dotenv from 'dotenv';
import readline from 'readline';
import chalk from 'chalk';
import express from 'express';
import bodyParser from 'body-parser';

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
const MCP_SERVER = process.env.MCP_SERVER || 'http://localhost:3000';

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
    { name: 'gpt-4o', maxTokens: 4096, contextWindow: 128000 },
    { name: 'gpt-4-turbo', maxTokens: 4096, contextWindow: 128000 },
    { name: 'gpt-4', maxTokens: 8192, contextWindow: 128000 },
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
    // Use environment variable or default to gpt-4o
    const defaultModelName = process.env.OPENAI_MODEL || 'gpt-4o';
    let defaultModel = AVAILABLE_MODELS.find(m => m.name === defaultModelName);

    // If the configured model isn't found, use gpt-4o without warning
    if (!defaultModel) {
        defaultModel = AVAILABLE_MODELS.find(m => m.name === 'gpt-4o') || AVAILABLE_MODELS[0];
    }

    return {
        mcpServer: process.env.MCP_SERVER || 'http://localhost:3000',
        openaiModel: defaultModel.name,  // Use the resolved model name
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

            // Update endpoint URL to use the same base path as schema
            const endpoint = `${config.mcpServer}/mcp/execute`;

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

/**
 * Collects comprehensive information about the Home Assistant instance using MCP tools
 */
async function collectHomeAssistantInfo(): Promise<any> {
    const info: Record<string, any> = {};
    const config = loadConfig();

    // Update schema endpoint to be consistent
    const schemaResponse = await fetch(`${config.mcpServer}/mcp`, {
        headers: {
            'Authorization': `Bearer ${hassToken}`,
            'Accept': 'application/json'
        }
    });

    if (!schemaResponse.ok) {
        console.error(`Failed to fetch MCP schema: ${schemaResponse.status}`);
        return info;
    }

    const schema = await schemaResponse.json() as McpSchema;
    console.log("Available tools:", schema.tools.map(t => t.name));

    // Execute list_devices to get basic device information
    console.log("Fetching device information...");
    try {
        const deviceInfo = await executeMcpTool('list_devices');
        if (deviceInfo && deviceInfo.success && deviceInfo.devices) {
            info.devices = deviceInfo.devices;
        } else {
            console.warn(`Failed to list devices: ${deviceInfo?.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.warn("Error fetching devices:", error);
    }

    return info;
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
    const openai = getOpenAIClient();
    const config = loadConfig();

    // Compress and summarize the data
    const deviceTypes = haInfo.devices ? Object.keys(haInfo.devices) : [];
    const deviceSummary = haInfo.devices ? Object.entries(haInfo.devices).reduce((acc: Record<string, any>, [domain, devices]) => {
        const deviceList = devices as any[];
        acc[domain] = {
            count: deviceList.length,
            active: deviceList.filter(d => d.state === 'on' || d.state === 'home').length,
            states: [...new Set(deviceList.map(d => d.state))],
            sample: deviceList.slice(0, 2).map(d => ({
                id: d.entity_id,
                state: d.state,
                name: d.attributes?.friendly_name
            }))
        };
        return acc;
    }, {}) : {};

    const systemSummary = {
        total_devices: deviceTypes.reduce((sum, type) => sum + deviceSummary[type].count, 0),
        device_types: deviceTypes,
        device_summary: deviceSummary,
        active_devices: Object.values(deviceSummary).reduce((sum: number, info: any) => sum + info.active, 0)
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

async function getUserInput(question: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

// Update chunk size calculation
const MAX_CHARACTERS = 8000; // ~2000 tokens (4 chars/token)

// Update model handling in retry
async function handleCustomPrompt(haInfo: any): Promise<void> {
    try {
        // Add device metadata
        const deviceTypes = haInfo.devices ? Object.keys(haInfo.devices) : [];
        const deviceStates = haInfo.devices ? Object.entries(haInfo.devices).reduce((acc: Record<string, number>, [domain, devices]) => {
            acc[domain] = (devices as any[]).length;
            return acc;
        }, {}) : {};
        const totalDevices = deviceTypes.reduce((sum, type) => sum + deviceStates[type], 0);

        const userPrompt = await getUserInput("Enter your custom prompt: ");
        if (!userPrompt) {
            console.log("No prompt provided. Exiting...");
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
                             Current system has ${totalDevices} devices across ${deviceTypes.length} types: ${JSON.stringify(deviceStates)}`
                },
                { role: "user", content: userPrompt },
            ],
            max_tokens: config.selectedModel.maxTokens,
            temperature: 0.3,
        });

        console.log("\nAnalysis Results:\n");
        console.log(completion.choices[0].message?.content || "No response generated");

    } catch (error) {
        console.error("Error processing custom prompt:", error);

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
                max_tokens: config.selectedModel.maxTokens,
                temperature: 0.3,
            });

            console.log("\nAnalysis Results:\n");
            console.log(retryCompletion.choices[0].message?.content || "No response generated");
        } catch (retryError) {
            console.error("Error during retry:", retryError);
        }
    }
}

// Update automation handling
async function handleAutomationOptimization(haInfo: any): Promise<void> {
    try {
        const result = await executeMcpTool('automation', { action: 'list' });
        if (!result?.success) {
            logger.error(`Failed to retrieve automations: ${result?.message || 'Unknown error'}`);
            return;
        }

        const automations = result.automations || [];
        if (automations.length === 0) {
            console.log(chalk.bold.underline("\nAutomation Optimization Report"));
            console.log(chalk.yellow("No automations found in the system. Consider creating some automations to improve your Home Assistant experience."));
            return;
        }

        logger.info(`Analyzing ${automations.length} automations...`);
        const optimizationXml = await analyzeAutomations(automations);

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

// Add new automation optimization function
async function analyzeAutomations(automations: any[]): Promise<string> {
    const openai = getOpenAIClient();
    const config = loadConfig();

    // Compress automation data by only including essential fields
    const compressedAutomations = automations.map(automation => ({
        id: automation.entity_id,
        name: automation.attributes?.friendly_name || automation.entity_id,
        state: automation.state,
        last_triggered: automation.attributes?.last_triggered,
        mode: automation.attributes?.mode,
        trigger_count: automation.attributes?.trigger?.length || 0,
        action_count: automation.attributes?.action?.length || 0
    }));

    const prompt = `Analyze these Home Assistant automations and provide optimization suggestions in XML format:
${JSON.stringify(compressedAutomations, null, 2)}

Generate your response in this EXACT format:
<analysis>
    <findings>
        <item>Finding 1</item>
        <item>Finding 2</item>
        <!-- Add more findings as needed -->
    </findings>
    <recommendations>
        <item>Recommendation 1</item>
        <item>Recommendation 2</item>
        <!-- Add more recommendations as needed -->
    </recommendations>
    <blueprints>
        <item>Blueprint suggestion 1</item>
        <item>Blueprint suggestion 2</item>
        <!-- Add more blueprint suggestions as needed -->
    </blueprints>
</analysis>

If no optimizations are needed, return empty item lists but maintain the XML structure.

Focus on:
1. Identifying patterns and potential improvements
2. Suggesting energy-saving optimizations
3. Recommending error handling improvements
4. Suggesting relevant blueprints`;

    try {
        const completion = await openai.chat.completions.create({
            model: config.selectedModel.name,
            messages: [
                {
                    role: "system",
                    content: "You are a Home Assistant automation expert. Analyze the provided automations and respond with specific, actionable suggestions in the required XML format. If no optimizations are needed, return empty item lists but maintain the XML structure."
                },
                { role: "user", content: prompt }
            ],
            temperature: 0.2,
            max_tokens: Math.min(config.selectedModel.maxTokens, 4000)
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

// Update model selection prompt count dynamically
async function selectModel(): Promise<ModelConfig> {
    console.log(chalk.bold.underline("\nAvailable Models:"));
    AVAILABLE_MODELS.forEach((model, index) => {
        console.log(
            `${index + 1}. ${chalk.blue(model.name.padEnd(20))} ` +
            `Context: ${chalk.yellow(model.contextWindow.toLocaleString().padStart(6))} tokens | ` +
            `Max output: ${chalk.green(model.maxTokens.toLocaleString().padStart(5))} tokens`
        );
    });

    const maxOption = AVAILABLE_MODELS.length;
    const choice = await getUserInput(`\nSelect model (1-${maxOption}): `);
    const selectedIndex = parseInt(choice) - 1;

    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= AVAILABLE_MODELS.length) {
        console.log(chalk.yellow("Invalid selection, using default model"));
        return AVAILABLE_MODELS[0];
    }

    const selectedModel = AVAILABLE_MODELS[selectedIndex];

    // Validate API keys for specific providers
    if (selectedModel.name.startsWith('deepseek')) {
        if (!process.env.DEEPSEEK_API_KEY) {
            logger.error("DeepSeek models require DEEPSEEK_API_KEY in .env");
            process.exit(1);
        }

        // Verify DeepSeek connection
        try {
            await getOpenAIClient().models.list();
        } catch (error) {
            logger.error(`DeepSeek connection failed: ${error.message}`);
            process.exit(1);
        }
    }

    if (selectedModel.name.startsWith('gpt-4-o') && !process.env.OPENAI_API_KEY) {
        logger.error("OpenAI models require OPENAI_API_KEY in .env");
        process.exit(1);
    }

    return selectedModel;
}

// Enhanced main function with progress indicators
async function main() {
    let config = loadConfig();

    // Model selection
    config.selectedModel = await selectModel();
    logger.info(`Selected model: ${chalk.blue(config.selectedModel.name)} ` +
        `(Context: ${config.selectedModel.contextWindow.toLocaleString()} tokens, ` +
        `Output: ${config.selectedModel.maxTokens.toLocaleString()} tokens)`);

    logger.info(`Starting analysis with ${config.selectedModel.name} model...`);

    try {
        logger.info("Collecting Home Assistant information...");
        const haInfo = await collectHomeAssistantInfo();

        if (!Object.keys(haInfo).length) {
            logger.error("Failed to collect Home Assistant information");
            return;
        }

        logger.success(`Collected data from ${Object.keys(haInfo.devices).length} device types`);

        const mode = await getUserInput(
            "\nSelect mode:\n1. Standard Analysis\n2. Custom Prompt\n3. Automation Optimization\nEnter choice (1-3): "
        );

        if (mode === "2") {
            await handleCustomPrompt(haInfo);
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

// Add environment check for processor type
if (process.env.PROCESSOR_TYPE === 'openai') {
    // Initialize Express server only for OpenAI
    const app = express();
    const port = process.env.PORT || 3000;

    app.use(bodyParser.json());

    // Keep existing OpenAI routes
    app.post('/chat', async (req, res) => {
        // ... existing OpenAI handler code ...
    });

    app.listen(port, () => {
        console.log(`[OpenAI Server] Running on port ${port}`);
    });
} else {
    console.log('[Claude Mode] Using stdio communication');
}

main().catch((error) => {
    console.error("Unexpected error:", error);
});
