import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
async function main() {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'hello' }],
      model: 'openai/gpt-oss-20b',
    });
    console.log("Success! Response:", chatCompletion.choices[0].message.content);
  } catch (err: any) {
    console.error("Groq Error:", err.status, err.message);
  }
}
main();
