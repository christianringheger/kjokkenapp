// Oversetter korte koder i dataene til visningsnavn på norsk.

// Kategorier (dish.cat) — rekkefølgen her styrer rekkefølgen i lista.
export const CATEGORIES = [
  ["varm", "Varmretter"],
  ["burger", "Burger"],
  ["salat", "Salat"],
  ["smaa", "Småretter"],
  ["paasmurt", "Påsmurt"],
  ["barn", "Barn"],
  ["dessert", "Dessert"],
  ["catering", "Catering"],
  ["cateringpakke", "Cateringpakker"],
  ["kaffe", "Kaffe"],
  ["kalddrikke", "Kalddrikke"],
];

export const CATEGORY_NAME = Object.fromEntries(CATEGORIES);

// Allergener (dish.all / comp[].a) — de 14 lovpålagte (EU/Matinfo), i offisiell rekkefølge.
// Nøklene gluten/melk/egg/sennep/sulfitt/selleri/soya må beholdes (brukes i dataene fra før).
export const ALLERGEN_NAME = {
  gluten: "Gluten",
  skalldyr: "Skalldyr",
  egg: "Egg",
  fisk: "Fisk",
  peanotter: "Peanøtter",
  soya: "Soya",
  melk: "Melk",
  notter: "Nøtter",
  selleri: "Selleri",
  sennep: "Sennep",
  sesam: "Sesam",
  sulfitt: "Sulfitt",
  lupin: "Lupin",
  blotdyr: "Bløtdyr",
};

// Tags (dish.tag)
export const TAG_NAME = {
  ny: "Ny",
  bestselger: "Bestselger",
};
