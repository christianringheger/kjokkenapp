// Datalag: Firestore er fasit, seed.json er offline-fallback.
// Leser dishes/recipes/prepitems (offentlig lesing, ingen innlogging),
// sortert på `_ord` slik at rekkefølgen matcher seed. Ved feil/offline
// eller tom samling faller vi tilbake til den bundlede seed.json.
import seed from "../data/seed.json";
import { NEWS } from "../data/news.js";
import { initFirebase } from "./firebase.js";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

async function loadCollection(db, name) {
  const snap = await getDocs(query(collection(db, name), orderBy("_ord")));
  // Dropp `_ord` (kun sorteringshjelp) fra objektene appen jobber med.
  return snap.docs.map((d) => {
    const { _ord, ...rest } = d.data();
    return { id: d.id, ...rest };
  });
}

// Returnerer { dishes, recipes, prepitems, source }.
// `source` = "firestore" | "seed" (nyttig for logging/varsling).
export async function loadData() {
  try {
    const { db } = initFirebase();
    const [dishes, recipes, prepitems] = await Promise.all([
      loadCollection(db, "dishes"),
      loadCollection(db, "recipes"),
      loadCollection(db, "prepitems"),
    ]);
    // Guard: en tom samling betyr som regel manglende/ufullstendig import.
    // Fall tilbake til seed for den samlingen for å unngå en tom app.
    console.info(
      `[data] Firestore: ${dishes.length} retter, ${recipes.length} oppskrifter, ${prepitems.length} prep`
    );
    return {
      dishes: dishes.length ? dishes : seed.dishes,
      recipes: recipes.length ? recipes : seed.recipes,
      prepitems: prepitems.length ? prepitems : seed.prepitems,
      source: "firestore",
    };
  } catch (e) {
    console.warn(
      "[data] Firestore utilgjengelig – bruker seed.json:",
      (e && e.message) || e
    );
    return {
      dishes: seed.dishes,
      recipes: seed.recipes,
      prepitems: seed.prepitems,
      source: "seed",
    };
  }
}

// Nyheter til forsiden: Firestore-samlingen `news` (nyeste dato først), med den
// bundlede NEWS som fallback ved feil/offline eller tom samling.
export async function loadNews() {
  try {
    const { db } = initFirebase();
    const snap = await getDocs(
      query(collection(db, "news"), orderBy("date", "desc"))
    );
    const items = snap.docs.map((d) => {
      const { _ord, ...rest } = d.data();
      return { _id: d.id, ...rest };
    });
    return items.length ? items : NEWS;
  } catch (_) {
    return NEWS;
  }
}
