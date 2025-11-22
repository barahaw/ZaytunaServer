import fs from "fs";
import { AsyncDatabase } from "promised-sqlite3";

const dbPath = "./pizza.sqlite";

if (!fs.existsSync(dbPath)) {
  console.error(`Database file not found at ${dbPath}`);
  process.exit(1);
}

// timestamped backup
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const backupPath = `./pizza.sqlite.update-descriptions.${ts}.bak`;
fs.copyFileSync(dbPath, backupPath);
console.log(`Backup created at ${backupPath}`);

try {
  const db = await AsyncDatabase.open(dbPath);
  await db.run("BEGIN TRANSACTION");

  const pizzas = await db.all(
    "SELECT pizza_type_id, name, ingredients FROM pizza_types"
  );

  let updated = 0;

  // Map keywords in the pizza name to a Palestinian-inspired ingredient phrase
  // avoid pork/ham; use regional herbs, cheeses, olives, tahini, labneh, sumac, za'atar, etc.
  const palestineMap = [
    {
      keyword: "farmers market",
      ingredient:
        "roasted market vegetables, herbed labneh, za'atar and a tahini drizzle",
    },
    {
      keyword: "musakhan",
      ingredient: "sumac-marinated onions, olive oil and roasted chicken",
    },
    { keyword: "gaza", ingredient: "za'atar, roasted eggplant and olive oil" },
    {
      keyword: "jenin",
      ingredient: "herbed labneh, local cheeses and pine nuts",
    },
    {
      keyword: "hebron",
      ingredient: "smoked paprika, red pepper and zataar notes",
    },
    {
      keyword: "jericho",
      ingredient: "sweet chili, citrus and grilled vegetables",
    },
    {
      keyword: "haifa",
      ingredient: "smoked turkey alternative, olives and pineapple",
    },
    {
      keyword: "bethlehem",
      ingredient: "garlic, roasted peppers and local goat cheese",
    },
    {
      keyword: "old city",
      ingredient: "oregano, za'atar and Mediterranean olives",
    },
    {
      keyword: "sultan",
      ingredient: "spiced lamb-style flavors and warm spices",
    },
    { keyword: "mediterr", ingredient: "olives, feta and roasted tomatoes" },
    { keyword: "spinach", ingredient: "warm spinach, feta and olive oil" },
    {
      keyword: "pepperoni",
      ingredient: "smoked paprika and spicy pepper blend ",
    },
    { keyword: "ckn", ingredient: "grilled chicken, garlic and sumac" },
    { keyword: "chicken", ingredient: "grilled chicken, sumac and zataar" },
    {
      keyword: "veggie",
      ingredient: "roasted seasonal vegetables and tahini drizzle",
    },
    {
      keyword: "four_cheese",
      ingredient: "local cheeses and a touch of labneh",
    },
  ];

  for (const p of pizzas) {
    const id = p.pizza_type_id;
    const name = (p.name || "").trim();
    const current = (p.ingredients || "").trim();

    // normalize current description: remove any previous Palestinian phrase so we can replace it
    const cleanedRaw = current
      .replace(
        /(?:Inspired by Palestinian flavors:.*|Palestinian-inspired:.*|Inspired by Palestine:.*)/i,
        ""
      )
      .trim();

    // normalize and remove various dash characters early so they don't persist in parsing
    const cleaned = cleanedRaw
      .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\-—–]/g, ",")
      .replace(/,+/g, ",")
      .replace(/\s*,\s*/g, ", ")
      .trim();

    // attempt to extract 'Topped with ...' from the existing description
    let baseToppings = "";
    const toppedMatch = cleaned.match(/Topped with\s+([^\n\.]+)/i);
    if (toppedMatch && toppedMatch[1]) {
      baseToppings = toppedMatch[1].trim();
    } else {
      // if no explicit 'Topped with', try to remove a leading '<Name> pizza.' and use the rest
      const namePrefix = name
        ? new RegExp(
            name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*pizza\\.?",
            "i"
          )
        : null;
      if (namePrefix && cleaned.match(namePrefix)) {
        baseToppings = cleaned.replace(namePrefix, "").trim();
      } else {
        baseToppings = cleaned;
      }
      // strip trailing punctuation
      baseToppings = baseToppings.replace(/^\.|\.$/g, "").trim();
    }

    // pick an ingredient suggestion based on the name
    let suggestion =
      "za'atar, sumac and olive oil, classic Palestinian flavors";
    if (name) {
      const lower = name.toLowerCase();
      for (const m of palestineMap) {
        if (lower.includes(m.keyword)) {
          suggestion = m.ingredient;
          break;
        }
      }
    }

    // Build a new description guaranteed to include the pizza name and a Palestinian-inspired phrase.
    // Use extracted toppings if available (avoid leaving it blank), always append Palestinian-inspired phrase.
    const newParts = [];

    if (baseToppings) {
      // if baseToppings still contains the name, remove the name fragment
      const cleanedToppings = name
        ? baseToppings
            .replace(new RegExp(name, "i"), "")
            .replace(/^[:\-\s]+/, "")
            .trim()
        : baseToppings;
      if (cleanedToppings) newParts.push(`Topped with ${cleanedToppings}.`);
    }
    newParts.push(`Palestinian-inspired: ${suggestion}.`);

    const newDesc = newParts.join(" ");
    // replace em-dash/en-dash with comma, collapse multiple commas, normalize spacing
    const sanitizedDesc = newDesc
      .replace(/[\u2012\u2013\u2014\u2015\-\u2010\u2011—–]/g, ",")
      .replace(/,+/g, ",")
      .replace(/\s*,\s*/g, ", ")
      .replace(/, \./g, ".")
      .trim();

    await db.run(
      "UPDATE pizza_types SET ingredients = ? WHERE pizza_type_id = ?",
      [sanitizedDesc, id]
    );
    updated += 1;
  }

  await db.run("COMMIT");
  console.log(`Updated descriptions for ${updated} pizzas.`);

  await db.close();
} catch (err) {
  console.error("Error while updating descriptions:", err);
  process.exit(1);
}
