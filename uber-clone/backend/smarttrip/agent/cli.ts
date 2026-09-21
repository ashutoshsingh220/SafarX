/**
 * CLI Test Harness for Agent
 */

import * as dotenv from "dotenv";
import * as path from "path";
// Load env from the root .env file BEFORE importing agent
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

import { runAgent } from "./agent";

async function main() {
  const query = process.argv[2] || "I want to go from Mumbai to Bengaluru tomorrow. My home is at lat: 18.5300, lon: 73.8500 (Near Shivajinagar). Find me a cheap bus and build a bundle to drop me at Majestic.";
  
  console.log("==========================================");
  console.log(`USER: ${query}`);
  console.log("==========================================");

  try {
    const response = await runAgent([], query);
    console.log("\n==========================================");
    console.log("FINAL AGENT RESPONSE:");
    console.log(response.text);
    console.log("==========================================");
  } catch (err: any) {
    console.error("Agent failed:", err.message);
  }
}

main();
