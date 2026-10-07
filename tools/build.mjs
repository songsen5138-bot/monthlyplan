// 외부 CDN 대신 쓸 파일을 assets/ 아래에 만듦
//   node build.mjs   (tools 폴더에서 실행, index.html을 고친 뒤에는 다시 실행해 디자인 CSS를 갱신)
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const tools = dirname(fileURLToPath(import.meta.url));
const root = join(tools, "..");
const vendor = join(root, "assets", "vendor");
const nm = join(tools, "node_modules");

rmSync(vendor, { recursive: true, force: true });
mkdirSync(join(vendor, "fontawesome", "css"), { recursive: true });
mkdirSync(join(vendor, "fontawesome", "webfonts"), { recursive: true });

// 1) 압축 파일(한글 hwpx) 도구, 엑셀 도구
cpSync(join(nm, "jszip", "dist", "jszip.min.js"), join(vendor, "jszip.min.js"));
cpSync(join(nm, "xlsx", "dist", "xlsx.full.min.js"), join(vendor, "xlsx.full.min.js"));

// 2) 아이콘 (woff2 글꼴만 복사)
const fa = join(nm, "@fortawesome", "fontawesome-free");
cpSync(join(fa, "css", "all.min.css"), join(vendor, "fontawesome", "css", "all.min.css"));
for (const f of readdirSync(join(fa, "webfonts")).filter((f) => f.endsWith(".woff2"))) {
  cpSync(join(fa, "webfonts", f), join(vendor, "fontawesome", "webfonts", f));
}

// 3) Firebase (앱에서 쓰는 기능만 하나의 파일로 묶음)
const entry = join(tools, "firebase-entry.js");
writeFileSync(entry, [
  'export { initializeApp } from "firebase/app";',
  'export { EmailAuthProvider, getAuth, onAuthStateChanged, reauthenticateWithCredential, signInWithEmailAndPassword, signOut, updatePassword, verifyBeforeUpdateEmail } from "firebase/auth";',
  'export { get, getDatabase, onValue, ref, set, update } from "firebase/database";',
  ""
].join("\n"));
await esbuild.build({ entryPoints: [entry], bundle: true, format: "esm", minify: true, outfile: join(vendor, "firebase.js"), logLevel: "warning" });
rmSync(entry);

// 4) 디자인 CSS (index.html에서 실제로 쓰는 Tailwind 클래스만 뽑아 만듦)
const input = join(tools, "tailwind-input.css");
const config = join(tools, "tailwind.config.cjs");
writeFileSync(input, "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n");
// 경로에 한글·공백이 있어 상대 경로로 지정
writeFileSync(config, 'module.exports = { content: { relative: true, files: ["../index.html"] } };\n');
execFileSync(process.execPath, [join(nm, "tailwindcss", "lib", "cli.js"), "-c", config, "-i", input, "-o", join(root, "assets", "app.css"), "--minify"],
  { stdio: "inherit", cwd: tools });
rmSync(input);
rmSync(config);

console.log("done: assets/vendor/*, assets/app.css");
