// Publishes dist/ to the gh-pages branch of this repo's origin (GitHub Pages, "deploy from branch").
// Usage: npm run deploy   (runs the build first)
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const run = (args, cwd) => execFileSync("git", args, { cwd, stdio: "inherit" });
const origin = execFileSync("git", ["remote", "get-url", "origin"]).toString().trim();
const sha = execFileSync("git", ["rev-parse", "--short", "HEAD"]).toString().trim();

// No Jekyll processing: serve files as-is.
writeFileSync("dist/.nojekyll", "");
run(["init", "-q", "-b", "gh-pages"], "dist");
run(["add", "-A"], "dist");
run(["-c", "user.name=deploy", "-c", "user.email=deploy@localhost", "commit", "-q", "-m", `Deploy ${sha}`], "dist");
run(["push", "-q", "--force", origin, "gh-pages"], "dist");
console.log("Deployed to gh-pages");
