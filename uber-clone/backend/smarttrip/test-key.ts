import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
console.log("Loaded Key:", process.env.EXPO_PUBLIC_GEMINI_API_KEY);
