import { AsyncDatabase } from "promised-sqlite3";

(async function () {
  try {
    const db = await AsyncDatabase.open("./pizza.sqlite");
    const rows = await db.all(
      "SELECT pizza_type_id, name, ingredients FROM pizza_types WHERE ingredients LIKE '%ham%' OR ingredients LIKE '%pork%' OR name LIKE '%ham%' OR name LIKE '%pork%' LIMIT 100"
    );
    if (!rows || rows.length === 0) {
      console.log('No pizza rows contain "ham" or "pork".');
    } else {
      console.log("Found rows still containing ham/pork:");
      console.log(rows);
    }
    await db.close();
  } catch (err) {
    console.error("Verification error:", err);
    process.exit(1);
  }
})();
