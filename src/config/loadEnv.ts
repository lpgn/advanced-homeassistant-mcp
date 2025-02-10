import { config as dotenvConfig } from "dotenv";
import { file } from "bun";
import path from "path";

/**
 * Maps NODE_ENV values to their corresponding environment file names
 */
const ENV_FILE_MAPPING: Record<string, string> = {
    production: ".env.prod",
    development: ".env.dev",
    test: ".env.test",
};

/**
 * Loads environment variables from the appropriate files based on NODE_ENV.
 * First loads environment-specific file, then overrides with generic .env if it exists.
 */
export async function loadEnvironmentVariables() {
    // Determine the current environment (default to 'development')
    const nodeEnv = (process.env.NODE_ENV || "development").toLowerCase();

    // Get the environment-specific file name
    const envSpecificFile = ENV_FILE_MAPPING[nodeEnv];
    if (!envSpecificFile) {
        console.warn(`Unknown NODE_ENV value: ${nodeEnv}. Using .env.dev as fallback.`);
    }

    const envFile = envSpecificFile || ".env.dev";
    const envPath = path.resolve(process.cwd(), envFile);

    // Load the environment-specific file if it exists
    try {
        const envFileExists = await file(envPath).exists();
        if (envFileExists) {
            dotenvConfig({ path: envPath });
            console.log(`Loaded environment variables from ${envFile}`);
        } else {
            console.warn(`Environment-specific file ${envFile} not found.`);
        }
    } catch (error) {
        console.warn(`Error checking environment file ${envFile}:`, error);
    }

    // Finally, check if there is a generic .env file present
    // If so, load it with the override option, so its values take precedence
    const genericEnvPath = path.resolve(process.cwd(), ".env");
    try {
        const genericEnvExists = await file(genericEnvPath).exists();
        if (genericEnvExists) {
            dotenvConfig({ path: genericEnvPath, override: true });
            console.log("Loaded and overrode with generic .env file");
        }
    } catch (error) {
        console.warn(`Error checking generic .env file:`, error);
    }
}

// Export the environment file mapping for reference
export const ENV_FILES = ENV_FILE_MAPPING; 