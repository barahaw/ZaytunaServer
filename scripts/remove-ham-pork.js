import fs from "fs";
import { AsyncDatabase } from "promised-sqlite3";

const dbPath = "./pizza.sqlite";

if (!fs.existsSync(dbPath)) {
  console.error(`Database file not found at ${dbPath}`);
  process.exit(1);
}

// timestamped backup
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const backupPath = `./pizza.sqlite.remove-ham-pork.${ts}.bak`;
fs.copyFileSync(dbPath, backupPath);
console.log(`Backup created at ${backupPath}`);

try {
  const db = await AsyncDatabase.open(dbPath);
  await db.run("BEGIN TRANSACTION");

  const rows = await db.all(
    "SELECT pizza_type_id, name, ingredients FROM pizza_types"
  );

  let updated = 0;

  const regex =
    /\b(smoked\s+ham|sliced\s+ham|smoked\s+pork|sliced\s+pork|ham|pork)\b/gi;

  for (const r of rows) {
    const id = r.pizza_type_id;
    const origName = (r.name || "").trim();
    const origIngredients = (r.ingredients || "").trim();

    let name = origName
      .replace(regex, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    let ingredients = origIngredients
      .replace(regex, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    // clean punctuation and separators left behind
    ingredients = ingredients
      .replace(/,\s*,/g, ",")
      .replace(/,\s*\./g, ".")
      .replace(/\s*,\s*$/g, "")
      .replace(/^,\s*/g, "")
      .replace(/\s+\./g, ".")
      .replace(/\s+,\s+/g, ", ")
      .replace(/\s{2,}/g, " ")
      .trim();

    // If ingredients becomes empty, set a friendly default
    if (!ingredients) {
      ingredients = "Delicious toppings.";
    }

    // If name becomes empty after removal, restore original name (avoid blank names)
    if (!name) {
      name = origName;
    }

    // only update if something changed
    if (name !== origName || ingredients !== origIngredients) {
      await db.run(
        "UPDATE pizza_types SET name = ?, ingredients = ? WHERE pizza_type_id = ?",
        [name, ingredients, id]
      );
      updated += 1;
    }
  }

  await db.run("COMMIT");
  console.log(`Updated ${updated} pizza rows (removed ham/pork terms).`);

  await db.close();
} catch (err) {
  console.error("Error while removing ham/pork:", err);
  process.exit(1);
}
