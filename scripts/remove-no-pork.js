import { AsyncDatabase } from 'promised-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function removeNoPork() {
  const db = await AsyncDatabase.open(path.join(__dirname, '..', 'pizza.sqlite'));
  
  try {
    // Get all pizzas with "(no pork)" in description
    const pizzas = await db.all(
      "SELECT pizza_type_id, name, ingredients FROM pizza_types WHERE ingredients LIKE '%(no pork)%'"
    );
    
    console.log(`Found ${pizzas.length} pizzas with "(no pork)" text:`);
    pizzas.forEach(p => console.log(`- ${p.name}`));
    
    // Remove "(no pork)" from all descriptions
    await db.run(
      "UPDATE pizza_types SET ingredients = REPLACE(ingredients, ' (no pork)', '') WHERE ingredients LIKE '%(no pork)%'"
    );
    
    await db.run(
      "UPDATE pizza_types SET ingredients = REPLACE(ingredients, '(no pork)', '') WHERE ingredients LIKE '%(no pork)%'"
    );
    
    console.log('\n✅ Successfully removed all "(no pork)" text from pizza descriptions');
    
    // Verify
    const remaining = await db.all(
      "SELECT pizza_type_id, name, ingredients FROM pizza_types WHERE ingredients LIKE '%(no pork)%'"
    );
    
    if (remaining.length === 0) {
      console.log('✅ Verification: No "(no pork)" text remaining');
    } else {
      console.log(`⚠️  Warning: ${remaining.length} pizzas still have "(no pork)" text`);
    }
    
  } finally {
    await db.close();
  }
}

removeNoPork().catch(console.error);
