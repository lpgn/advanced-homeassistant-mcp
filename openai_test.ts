import fetch from "node-fetch";
import OpenAI from "openai";
import { DOMParser, Element, Document } from '@xmldom/xmldom';
import dotenv from 'dotenv';
import readline from 'readline';

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

const openai = new OpenAI({
    apiKey: openaiApiKey,
});

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
        state: string;
        health: string;
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

/**
 * Executes a tool on the MCP server
 */
async function executeMcpTool(toolName: string, parameters: Record<string, any> = {}): Promise<any> {
    try {
        const response = await fetch(`${MCP_SERVER}/mcp/execute`, {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${hassToken}`,
                'Content-Type': "application/json",
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                tool: toolName,
                parameters
            })
        });

        if (response.ok) {
            return await response.json();
        }
        console.warn(`Failed to execute tool ${toolName}: ${response.status}`);
        if (response.status === 401) {
            console.error("Authentication failed. Please check your HASS_TOKEN.");
        }
        return null;
    } catch (error) {
        console.warn(`Error executing tool ${toolName}:`, error);
        return null;
    }
}

/**
 * Collects comprehensive information about the Home Assistant instance using MCP tools
 */
async function collectHomeAssistantInfo(): Promise<any> {
    const info: Record<string, any> = {};

    // First, get the MCP schema which contains available tools
    const schemaResponse = await fetch(`${MCP_SERVER}/mcp`, {
        headers: {
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
Current State: ${analysis.overview.state}
Health: ${analysis.overview.health}

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

/**
 * Generates analysis and recommendations using the OpenAI API based on the Home Assistant data
 */
async function generateAnalysis(haInfo: any): Promise<SystemAnalysis> {
    // Prepare a summarized version of the data to reduce token count
    const deviceTypes = haInfo.devices ? Object.keys(haInfo.devices) : [];
    const deviceStates = haInfo.devices ? Object.entries(haInfo.devices).reduce((acc: Record<string, number>, [domain, devices]) => {
        acc[domain] = (devices as any[]).length;
        return acc;
    }, {}) : {};

    const summarizedInfo = {
        device_summary: {
            total_count: deviceTypes.reduce((sum, type) => sum + deviceStates[type], 0),
            types: deviceTypes,
            by_type: deviceStates,
            examples: deviceTypes.slice(0, 3).flatMap(type =>
                (haInfo.devices[type] as any[]).slice(0, 1).map(device => ({
                    type,
                    entity_id: device.entity_id,
                    state: device.state,
                    attributes: device.attributes
                }))
            )
        }
    };

    const prompt = `
Analyze this Home Assistant device summary and provide a concise analysis in XML format.
Focus on key insights and actionable recommendations.

Device Summary:
${JSON.stringify(summarizedInfo, null, 2)}

Provide your analysis in this XML format:
<analysis>
    <overview>
        <state>Brief overall state</state>
        <health>Brief health assessment</health>
        <configurations>
            <item>Key configuration insight</item>
        </configurations>
        <integrations>
            <item>Key integration insight</item>
        </integrations>
        <issues>
            <item>Critical issue if any</item>
        </issues>
    </overview>
    <optimization>
        <performance_suggestions>
            <item>Key performance tip</item>
        </performance_suggestions>
        <automation_opportunities>
            <item>Key automation suggestion</item>
        </automation_opportunities>
    </optimization>
    <maintenance>
        <required_updates>
            <item>Critical update if needed</item>
        </required_updates>
        <regular_tasks>
            <item>Key maintenance task</item>
        </regular_tasks>
    </maintenance>
</analysis>`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are an expert Home Assistant analyst. Provide very concise, actionable insights in the specified XML format."
                },
                { role: "user", content: prompt },
            ],
            max_tokens: 500,
            temperature: 0.7,
        });

        const result = completion.choices[0].message?.content || "";

        // Parse XML response into structured data
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(result, "text/xml");

        const getItems = (path: string): string[] => {
            const items = Array.from(xmlDoc.getElementsByTagName('item'))
                .filter(item => {
                    let parent = item.parentNode;
                    let pathParts = path.split('>').map(p => p.trim());
                    for (let i = pathParts.length - 1; i >= 0; i--) {
                        if (!parent || parent.nodeName !== pathParts[i]) return false;
                        parent = parent.parentNode;
                    }
                    return true;
                });
            return items.map(item => (item as unknown as Element).textContent || "");
        };

        const getText = (path: string): string => {
            const pathParts = path.split('>').map(p => p.trim());
            let currentElement: Document | Element = xmlDoc;
            for (const part of pathParts) {
                const elements = currentElement.getElementsByTagName(part);
                if (elements.length === 0) return "";
                currentElement = elements[0] as Element;
            }
            return currentElement.textContent || "";
        };

        const analysis: SystemAnalysis = {
            overview: {
                state: getText("analysis > overview > state"),
                health: getText("analysis > overview > health"),
                configurations: getItems("analysis > overview > configurations"),
                integrations: getItems("analysis > overview > integrations"),
                issues: getItems("analysis > overview > issues"),
            },
            performance: {
                resource_usage: getItems("analysis > performance > resource_usage"),
                response_times: getItems("analysis > performance > response_times"),
                optimization_areas: getItems("analysis > performance > optimization_areas"),
            },
            security: {
                current_measures: getItems("analysis > security > current_measures"),
                vulnerabilities: getItems("analysis > security > vulnerabilities"),
                recommendations: getItems("analysis > security > recommendations"),
            },
            optimization: {
                performance_suggestions: getItems("analysis > optimization > performance_suggestions"),
                config_optimizations: getItems("analysis > optimization > config_optimizations"),
                integration_improvements: getItems("analysis > optimization > integration_improvements"),
                automation_opportunities: getItems("analysis > optimization > automation_opportunities"),
            },
            maintenance: {
                required_updates: getItems("analysis > maintenance > required_updates"),
                cleanup_tasks: getItems("analysis > maintenance > cleanup_tasks"),
                regular_tasks: getItems("analysis > maintenance > regular_tasks"),
            },
        };

        return analysis;
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

async function handleCustomPrompt(haInfo: any): Promise<void> {
    console.log("\nEnter your custom prompt. Available variables:");
    console.log("- {device_count}: Total number of devices");
    console.log("- {device_types}: List of device types");
    console.log("- {device_states}: Current states of devices");
    console.log("- {device_examples}: Example devices and their states");
    console.log("\nExample: 'Analyze my {device_count} devices and suggest automations for {device_types}'");

    const customPrompt = await getUserInput("\nEnter your prompt: ");

    // Prepare the data for variable replacement
    const deviceTypes = haInfo.devices ? Object.keys(haInfo.devices) : [];
    const deviceStates = haInfo.devices ? Object.entries(haInfo.devices).reduce((acc: Record<string, number>, [domain, devices]) => {
        acc[domain] = (devices as any[]).length;
        return acc;
    }, {}) : {};

    const totalDevices = deviceTypes.reduce((sum, type) => sum + deviceStates[type], 0);

    // Function to filter relevant devices based on the prompt
    const getRelevantDevices = (prompt: string, devices: any) => {
        const relevantTypes = deviceTypes.filter(type =>
            prompt.toLowerCase().includes(type.toLowerCase()) ||
            type === 'light' && prompt.toLowerCase().includes('lights') ||
            type === 'switch' && prompt.toLowerCase().includes('switches')
        );

        if (relevantTypes.length === 0) {
            // If no specific types mentioned, return a summary of all types
            return Object.entries(devices).reduce((acc: any, [domain, deviceList]) => {
                acc[domain] = {
                    count: (deviceList as any[]).length,
                    example: (deviceList as any[])[0]
                };
                return acc;
            }, {});
        }

        return relevantTypes.reduce((acc: any, type) => {
            if (devices[type]) {
                acc[type] = devices[type];
            }
            return acc;
        }, {});
    };

    const relevantDevices = getRelevantDevices(customPrompt, haInfo.devices);

    // Replace variables in the prompt
    let formattedPrompt = `
Here is the current state of your Home Assistant devices:

Total Devices: ${totalDevices}
Device Types: ${deviceTypes.join(', ')}

Relevant Device Information:
${JSON.stringify(relevantDevices, null, 2)}

User Query: ${customPrompt}

Please analyze this information and provide a detailed response focusing specifically on what was asked.
If the query is about specific device types, please filter and show only relevant information.
Include specific entity IDs and states in your response when applicable.
`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `You are an expert Home Assistant analyst with direct access to the current state of a Home Assistant instance.
When analyzing device states:
- Always mention specific entity IDs when discussing devices
- Include current state values and relevant attributes
- If discussing lights, mention brightness levels if available
- For climate devices, include temperature and mode information
- For switches and other binary devices, clearly state if they are on/off
- Group related devices together in your analysis
- Provide specific, actionable insights based on the current states`
                },
                { role: "user", content: formattedPrompt },
            ],
            max_tokens: 1000,
            temperature: 0.3,
        });

        console.log("\nAnalysis Results:\n");
        console.log(completion.choices[0].message?.content || "No response generated");
    } catch (error) {
        console.error("Error during OpenAI API call:", error);
        if (error instanceof Error && error.message.includes('maximum context length')) {
            console.log("\nTrying with more concise data...");
            // Retry with even more summarized data
            const summarizedDevices = Object.entries(relevantDevices).reduce((acc: any, [type, devices]) => {
                if (Array.isArray(devices)) {
                    const activeDevices = devices.filter((d: any) =>
                        d.state === 'on' ||
                        d.state === 'home' ||
                        (typeof d.state === 'number' && d.state > 0)
                    );

                    acc[type] = {
                        total: devices.length,
                        active: activeDevices.length,
                        active_devices: activeDevices.map((d: any) => ({
                            entity_id: d.entity_id,
                            state: d.state,
                            name: d.attributes?.friendly_name || d.entity_id,
                            ...(d.attributes?.brightness && { brightness: Math.round((d.attributes.brightness / 255) * 100) + '%' }),
                            ...(d.attributes?.temperature && { temperature: d.attributes.temperature }),
                            ...(d.attributes?.hvac_mode && { mode: d.attributes.hvac_mode })
                        }))
                    };
                }
                return acc;
            }, {});

            const retryPrompt = `
Analyzing Home Assistant devices:
Total Devices: ${totalDevices}
Device Types: ${deviceTypes.join(', ')}

Relevant Device Summary:
${JSON.stringify(summarizedDevices, null, 2)}

User Query: ${customPrompt}

Please provide a detailed analysis focusing on active devices.
Include specific device names, states, and any relevant attributes (brightness, temperature, etc.).
Group similar devices together in your response.
`;

            try {
                const retryCompletion = await openai.chat.completions.create({
                    model: "gpt-4",
                    messages: [
                        {
                            role: "system",
                            content: "You are an expert Home Assistant analyst. Provide concise, focused answers about device states and configurations."
                        },
                        { role: "user", content: retryPrompt },
                    ],
                    max_tokens: 1000,
                    temperature: 0.3,
                });

                console.log("\nAnalysis Results:\n");
                console.log(retryCompletion.choices[0].message?.content || "No response generated");
            } catch (retryError) {
                console.error("Error during retry:", retryError);
            }
        }
    }
}

async function main() {
    console.log("Collecting Home Assistant information...");
    const haInfo = await collectHomeAssistantInfo();
    if (!Object.keys(haInfo).length) {
        console.error("Failed to collect any Home Assistant information. Exiting.");
        return;
    }

    const mode = await getUserInput(
        "\nSelect mode:\n1. Standard Analysis\n2. Custom Prompt\nEnter choice (1 or 2): "
    );

    if (mode === "2") {
        await handleCustomPrompt(haInfo);
    } else {
        console.log("Generating standard analysis and recommendations...");
        try {
            const analysis = await generateAnalysis(haInfo);
            const formattedAnalysis = formatAnalysis(analysis);
            console.log("\nHome Assistant Analysis and Recommendations:\n");
            console.log(formattedAnalysis);
        } catch (error) {
            console.error("Error generating analysis:", error);
        }
    }
}

main().catch((error) => {
    console.error("Unexpected error:", error);
});
