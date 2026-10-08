import fs from "node:fs";
import path from "node:path";
import { renderDashboardHtml } from "./dashboard.js";

const publicDir = path.resolve(process.cwd(), "public");

fs.mkdirSync(publicDir, { recursive: true });

const html = renderDashboardHtml("", false);

fs.writeFileSync(
  path.join(publicDir, "index.html"),
  html,
  "utf8"
);

console.log("[Orderi Admin] public/index.html generated successfully.");
