const Database = require("better-sqlite3");
const path = require("node:path");
const db = new Database(path.join(process.cwd(), "prisma", "dev.db"));
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("tables:", tables.map((t) => t.name).join(", "));
try {
  console.log("users:", db.prepare("SELECT COUNT(*) c FROM User").get().c);
  console.log("listings:", db.prepare("SELECT COUNT(*) c FROM Listing").get().c);
  const l = db.prepare("SELECT id, title, status, ownerId FROM Listing LIMIT 3").all();
  console.log(l);
} catch (e) {
  console.log("err:", e.message);
}
db.close();
