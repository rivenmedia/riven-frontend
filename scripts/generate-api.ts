// scripts/generate-api.ts
import { execSync } from "child_process";
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import "dotenv/config";

const API_OUTPUT_DIR = "src/lib/api";

// Run the original generation
console.log("🚀 Generating API client...");
execSync("pnpm run generate-client-do-not-use-this", { stdio: "inherit" });

// Track changes
let filesProcessed = 0;
let filesModified = 0;
const changes: Array<{
    file: string;
    occurrences: number;
    lines: Array<{ lineNumber: number; before: string; after: string }>;
}> = [];

// Function to escape regex special characters
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Function to recursively process files
function replaceInFiles(dir: string, searchValue: string, replaceValue: string) {
    const files = readdirSync(dir);

    files.forEach((file) => {
        const filePath = join(dir, file);
        const stat = statSync(filePath);

        if (stat.isDirectory()) {
            replaceInFiles(filePath, searchValue, replaceValue);
        } else if (file.endsWith(".ts") || file.endsWith(".js")) {
            filesProcessed++;
            let content = readFileSync(filePath, "utf-8");
            const originalContent = content;

            // Find all occurrences with line numbers
            const lines = content.split("\n");
            const fileChanges: Array<{ lineNumber: number; before: string; after: string }> = [];
            let occurrences = 0;

            const escapedDomain = escapeRegex(searchValue);

            lines.forEach((line, index) => {
                if (line.includes(searchValue)) {
                    occurrences++;
                    let newLine = line;

                    // Replace in all quote types
                    newLine = newLine.replace(
                        new RegExp(`'${escapedDomain}'`, "g"),
                        `'${replaceValue}'`
                    );
                    newLine = newLine.replace(
                        new RegExp(`"${escapedDomain}"`, "g"),
                        `"${replaceValue}"`
                    );
                    newLine = newLine.replace(
                        new RegExp(`\`${escapedDomain}\``, "g"),
                        `\`${replaceValue}\``
                    );

                    fileChanges.push({
                        lineNumber: index + 1,
                        before: line.trim(),
                        after: newLine.trim()
                    });
                }
            });

            // Replace hardcoded domain (handle both quoted strings and template literals)
            content = content.replace(new RegExp(`'${escapedDomain}'`, "g"), `'${replaceValue}'`);
            content = content.replace(new RegExp(`"${escapedDomain}"`, "g"), `"${replaceValue}"`);
            content = content.replace(
                new RegExp(`\`${escapedDomain}\``, "g"),
                `\`${replaceValue}\``
            );

            // Only write if content changed
            if (content !== originalContent) {
                writeFileSync(filePath, content, "utf-8");
                filesModified++;
                changes.push({
                    file: filePath.replace(process.cwd() + "/", ""),
                    occurrences,
                    lines: fileChanges
                });
            }
        }
    });
}

// Replace the hardcoded domain
console.log("\n🔄 Replacing hardcoded domains...");
const originalDomain = process.env.BACKEND_URL || "http://localhost:8080";
const targetUrl = process.env.TARGET_API_URL || "http://localhost:8080";

console.log(`   From: "${originalDomain}"`);
console.log(`   To:   "${targetUrl}"`);

replaceInFiles(API_OUTPUT_DIR, originalDomain, targetUrl);

// Print summary
console.log("📊 Summary:");
console.log(`   Files processed: ${filesProcessed}`);
console.log(`   Files modified: ${filesModified}`);
console.log(`   Total replacements: ${changes.reduce((sum, c) => sum + c.occurrences, 0)}\n`);

// Print detailed changes
if (changes.length > 0) {
    console.log("📝 Detailed Changes:\n");
    changes.forEach((change, idx) => {
        console.log(`${idx + 1}. ${change.file}`);
        console.log(`   Occurrences: ${change.occurrences}`);
        change.lines.forEach((line) => {
            console.log(`   Line ${line.lineNumber}:`);
            console.log(`     - ${line.before}`);
            console.log(`     + ${line.after}`);
        });
        console.log("");
    });
} else {
    console.log("ℹ️  No hardcoded domains found to replace.");
}

console.log("✅ API client generated and patched successfully!");
