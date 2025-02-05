declare module 'litemcp' {
    export interface Tool {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
        execute: (params: Record<string, unknown>) => Promise<unknown>;
    }

    export interface LiteMCPOptions {
        name: string;
        version: string;
    }

    export class LiteMCP {
        constructor(options: LiteMCPOptions);
        addTool(tool: Tool): void;
        start(): Promise<void>;
    }
} 