import fs from "fs";
import { AsyncDatabase } from "promised-sqlite3";

const dbPath = "./pizza.sqlite";

if (!fs.existsSync(dbPath)) {
  console.error(`Database file not found at ${dbPath}`);
  process.exit(1);
}

// create a backup
const backupPath = dbPath + ".bak";
fs.copyFileSync(dbPath, backupPath);
console.log(`Backup created at ${backupPath}`);

try {
  const db = await AsyncDatabase.open(dbPath);
  await db.run("BEGIN TRANSACTION");

  // Update exact name matches
  const nameResult = await db.run(
    "UPDATE pizza_types SET name = ? WHERE name = ?",
    ["Beef Bacon", "Bacon"]
  );

  // Replace occurrences inside ingredients fields
  const ingredientsResult = await db.run(
    "UPDATE pizza_types SET ingredients = REPLACE(ingredients, ?, ?) WHERE ingredients LIKE '%' || ? || '%'",
    ["Bacon", "Beef Bacon", "Bacon"]
  );

  await db.run("COMMIT");

  console.log("Done. Summary:");
  console.log("Name rows changed:", nameResult.changes ?? nameResult);
  console.log(
    "Ingredients rows changed:",
    ingredientsResult.changes ?? ingredientsResult
  );

  await db.close();
} catch (err) {
  console.error("Error while updating database:", err);
  process.exit(1);
}
