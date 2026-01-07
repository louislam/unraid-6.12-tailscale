#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write --allow-run

/**
 * Tailscale Update Script
 * 
 * This script checks for the latest Tailscale version and updates the plugin if needed.
 * 
 * Steps:
 * 1. Fetch latest Tailscale version from https://pkgs.tailscale.com/stable/
 * 2. Compare with version in tools/plugin/tailscale.json
 * 3. If updated:
 *    - Update version (YYYY.MM.DD format)
 *    - Update tailscaleVersion (tailscale_{VERSION}_amd64)
 *    - Update tailscaleSHA256 (checksum of amd64.tgz)
 *    - Execute tools/build-plugin.sh
 * 4. If no update, exit
 */

interface TailscaleConfig {
  name: string;
  author: string;
  githubRepository: string;
  version: string;
  tailscaleVersion: string;
  tailscaleSHA256: string;
  packageVersion: string;
  packageSHA256: string;
  pluginDirectory: string;
  configDirectory: string;
  minver: string;
}

const CONFIG_PATH = "./tools/plugin/tailscale.json";
const BUILD_SCRIPT = "./build-plugin.sh"; // Script expects to be run from tools directory
const TAILSCALE_STABLE_URL = "https://pkgs.tailscale.com/stable/";
const GITHUB_API_URL = "https://api.github.com/repos/tailscale/tailscale/releases/latest";

/**
 * Fetch the latest Tailscale version from GitHub API as fallback
 */
async function fetchLatestVersionFromGitHub(): Promise<string | null> {
  try {
    console.log("Fetching latest Tailscale version from GitHub...");
    const response = await fetch(GITHUB_API_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const tagName = data.tag_name;
    
    // Tag name is typically in format "vX.Y.Z", strip the 'v'
    const version = tagName.startsWith('v') ? tagName.substring(1) : tagName;
    console.log(`Latest version from GitHub: ${version}`);
    
    return version;
  } catch (error) {
    console.error(`Error fetching from GitHub: ${error}`);
    return null;
  }
}

/**
 * Fetch the latest Tailscale version from the stable packages page
 */
async function fetchLatestTailscaleVersion(): Promise<string | null> {
  try {
    console.log("Fetching latest Tailscale version from pkgs.tailscale.com...");
    const response = await fetch(TAILSCALE_STABLE_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Look for amd64.tgz links in the HTML
    // Pattern: tailscale_X.Y.Z_amd64.tgz
    const regex = /tailscale_(\d+\.\d+\.\d+)_amd64\.tgz/g;
    const matches = [...html.matchAll(regex)];
    
    if (matches.length === 0) {
      console.error("Could not find any Tailscale versions in the page");
      return null;
    }
    
    // Get all versions and find the latest
    const versions = matches.map(m => m[1]);
    const uniqueVersions = [...new Set(versions)];
    
    // Sort versions to get the latest
    uniqueVersions.sort((a, b) => {
      const aParts = a.split('.').map(Number);
      const bParts = b.split('.').map(Number);
      
      for (let i = 0; i < 3; i++) {
        if (aParts[i] !== bParts[i]) {
          return bParts[i] - aParts[i];
        }
      }
      return 0;
    });
    
    const latestVersion = uniqueVersions[0];
    console.log(`Latest Tailscale version: ${latestVersion}`);
    
    return latestVersion;
  } catch (error) {
    console.error(`Error fetching from pkgs.tailscale.com: ${error}`);
    // Try GitHub as fallback
    console.log("Trying GitHub API as fallback...");
    return await fetchLatestVersionFromGitHub();
  }
}

/**
 * Fetch the SHA256 checksum for a specific Tailscale package
 */
async function fetchSHA256(packageName: string): Promise<string | null> {
  try {
    console.log(`Fetching SHA256 for ${packageName}...`);
    
    // The checksums are typically in a .sha256 file or listed on the page
    // Try fetching the .sha256 file first
    const sha256Url = `${TAILSCALE_STABLE_URL}${packageName}.sha256`;
    const response = await fetch(sha256Url);
    
    if (response.ok) {
      const text = await response.text();
      // SHA256 files typically have format: "hash  filename"
      const hash = text.trim().split(/\s+/)[0];
      return hash;
    }
    
    // If .sha256 file doesn't exist, try to parse from the main page
    const pageResponse = await fetch(TAILSCALE_STABLE_URL);
    if (!pageResponse.ok) {
      throw new Error(`Failed to fetch page: ${pageResponse.status}`);
    }
    
    const html = await pageResponse.text();
    
    // Look for the SHA256 hash near the package name
    // This is a fallback and might need adjustment based on actual page structure
    const lines = html.split('\n');
    for (const line of lines) {
      if (line.includes(packageName)) {
        // Look for a 64-character hex string (SHA256)
        const hashMatch = line.match(/([a-f0-9]{64})/i);
        if (hashMatch) {
          return hashMatch[1];
        }
      }
    }
    
    console.error(`Could not find SHA256 for ${packageName}`);
    return null;
  } catch (error) {
    console.error(`Error fetching SHA256: ${error}`);
    return null;
  }
}

/**
 * Read the current configuration from tailscale.json
 */
async function readConfig(): Promise<TailscaleConfig | null> {
  try {
    const content = await Deno.readTextFile(CONFIG_PATH);
    return JSON.parse(content) as TailscaleConfig;
  } catch (error) {
    console.error(`Error reading config: ${error}`);
    return null;
  }
}

/**
 * Write updated configuration to tailscale.json
 */
async function writeConfig(config: TailscaleConfig): Promise<boolean> {
  try {
    const content = JSON.stringify(config, null, 4);
    await Deno.writeTextFile(CONFIG_PATH, content + "\n");
    console.log("Configuration updated successfully");
    return true;
  } catch (error) {
    console.error(`Error writing config: ${error}`);
    return false;
  }
}

/**
 * Extract version from tailscaleVersion field (e.g., "tailscale_1.90.6_amd64" -> "1.90.6")
 */
function extractVersion(tailscaleVersion: string): string {
  const match = tailscaleVersion.match(/tailscale_(\d+\.\d+\.\d+)_amd64/);
  return match ? match[1] : "";
}

/**
 * Get current date in YYYY.MM.DD format
 */
function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

/**
 * Execute the build plugin script
 */
async function buildPlugin(): Promise<boolean> {
  try {
    console.log("Executing build-plugin.sh...");
    
    const command = new Deno.Command("sh", {
      args: [BUILD_SCRIPT],
      cwd: "./tools", // Run from tools directory as the script uses relative paths
      stdout: "piped",
      stderr: "piped",
    });
    
    const { code, stdout, stderr } = await command.output();
    
    if (stdout.length > 0) {
      console.log(new TextDecoder().decode(stdout));
    }
    
    if (stderr.length > 0) {
      console.error(new TextDecoder().decode(stderr));
    }
    
    if (code === 0) {
      console.log("Build completed successfully");
      return true;
    } else {
      console.error(`Build failed with exit code ${code}`);
      return false;
    }
  } catch (error) {
    console.error(`Error executing build script: ${error}`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log("=== Tailscale Update Checker ===\n");
  
  // Read current configuration
  const config = await readConfig();
  if (!config) {
    console.error("Failed to read configuration");
    Deno.exit(1);
  }
  
  const currentVersion = extractVersion(config.tailscaleVersion);
  console.log(`Current Tailscale version: ${currentVersion}`);
  
  // Fetch latest version
  const latestVersion = await fetchLatestTailscaleVersion();
  if (!latestVersion) {
    console.error("Failed to fetch latest version");
    Deno.exit(1);
  }
  
  // Compare versions
  if (currentVersion === latestVersion) {
    console.log("\n✓ Tailscale is already up to date!");
    Deno.exit(0);
  }
  
  console.log(`\n→ Update available: ${currentVersion} → ${latestVersion}`);
  
  // Fetch SHA256 for amd64 package
  const amd64Package = `tailscale_${latestVersion}_amd64.tgz`;
  const sha256 = await fetchSHA256(amd64Package);
  
  if (!sha256) {
    console.error("Failed to fetch SHA256 checksum");
    Deno.exit(1);
  }
  
  console.log(`SHA256: ${sha256}`);
  
  // Update configuration
  config.version = getCurrentDate();
  config.tailscaleVersion = `tailscale_${latestVersion}_amd64`;
  config.tailscaleSHA256 = sha256;
  
  if (!await writeConfig(config)) {
    console.error("Failed to write updated configuration");
    Deno.exit(1);
  }
  
  // Execute build script
  if (!await buildPlugin()) {
    console.error("Failed to build plugin");
    Deno.exit(1);
  }
  
  console.log("\n✓ Update completed successfully!");
}

// Run main function
if (import.meta.main) {
  main();
}
