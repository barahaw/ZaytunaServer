const fs = require('fs');
const path = require('path');

// Try to find sqlite3
let sqlite3Module;
try {
  sqlite3Module = require('sqlite3');
} catch (e) {
  try {
    sqlite3Module = require('./api/node_modules/sqlite3');
  } catch (e2) {
    console.error('Could not find sqlite3 module.');
    process.exit(1);
  }
}

const sqlite3 = sqlite3Module.verbose();
const dbPath = path.join(__dirname, 'api', 'pizza.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the pizza database.');
});

const updates = [
  { id: 'napolitana', desc: "Fresh sardines, garlic, and parsley on a bed of tomato sauce, inspired by Jaffa's port." },
  { id: 'pep_msh_pep', desc: "A mix of spicy beef sausage, mushrooms, and peppers, reminiscent of Ramallah's bustling markets." },
  { id: 'the_greek', desc: "Kalamata olives, feta cheese, and oregano, celebrating the olive harvest season." },
  { id: 'brie_carre', desc: "Creamy Nablus cheese paired with sweet pears and a drizzle of honey." },
  { id: 'calabrese', desc: "Spicy beef salami with chili flakes and roasted red peppers, inspired by Akka's bold flavors." },
  { id: 'ital_supr', desc: "A grand assortment of beef pepperoni, sausage, mushrooms, onions, and peppers." },
  { id: 'peppr_salami', desc: "Three types of cured beef salami, seasoned with Jerusalem's spice blends." },
  { id: 'prsc_argla', desc: "Fresh arugula and cured beef strips on a white base, drizzled with olive oil." },
  { id: 'sicilian', desc: "Thick-crust square pizza with spicy tomato sauce, herbs, and olives." },
  { id: 'soppressata', desc: "Cured beef sausage with black pepper and garlic, a Hebron favorite." },
  { id: 'spicy_ital', desc: "Spicy beef sausage and hot peppers, bringing the heat of Ramallah's summers." },
  { id: 'five_cheese', desc: "A rich blend of Akawi, Nablus, Halloumi, Mozzarella, and Kashkaval cheeses." },
  { id: 'four_cheese', desc: "A creamy mix of local cheeses, topped with sesame seeds." },
  { id: 'mexicana', desc: "Spiced ground beef, corn, and peppers, seasoned with a Bedouin spice mix." },
  { id: 'spin_pesto', desc: "Green olive pesto base topped with sun-dried tomatoes and feta." },
  { id: 'veggie_veg', desc: "A colorful array of roasted zucchini, eggplant, peppers, and onions." }
];

db.serialize(() => {
  const stmt = db.prepare("UPDATE pizza_types SET ingredients = ? WHERE pizza_type_id = ?");
  
  updates.forEach(update => {
    stmt.run(update.desc, update.id, (err) => {
      if (err) {
        console.error(`Error updating ${update.id}:`, err.message);
      } else {
        console.log(`Updated description for ${update.id}`);
      }
    });
  });

  stmt.finalize();
});

db.close((err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Database connection closed.');
});
