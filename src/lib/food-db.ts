// Food database — approx macros per 100g. Ported from the prototype (137 items)
// plus an expanded set of home-cooked and regional Indian dishes.
// [carbs, protein, fat, calories]
export type FoodMacros = [number, number, number, number];
export type FoodDB = Record<string, FoodMacros>;

export const FOOD_DB: FoodDB = {
  "rice, cooked": [28, 2.7, 0.3, 130],
  "brown rice, cooked": [23, 2.6, 0.9, 123],
  "roti / chapati": [48, 8, 3.7, 297],
  "dal, cooked": [20, 9, 0.4, 116],
  "rajma, cooked": [23, 9, 0.5, 127],
  "chana, cooked": [27, 9, 2.6, 164],
  "chicken breast, cooked": [0, 31, 3.6, 165],
  "chicken curry": [5, 15, 8, 150],
  "egg, boiled": [1.1, 13, 11, 155],
  "egg white": [0.7, 11, 0.2, 52],
  paneer: [3.4, 18, 20, 265],
  "curd / yogurt, plain": [4.7, 3.5, 3.3, 61],
  "milk, whole": [5, 3.4, 3.6, 65],
  "milk, toned": [5, 3.4, 1.5, 50],
  "oats, dry": [66, 17, 7, 389],
  banana: [23, 1.1, 0.3, 89],
  apple: [14, 0.3, 0.2, 52],
  almonds: [22, 21, 50, 579],
  "peanut butter": [20, 25, 50, 588],
  peanuts: [16, 26, 49, 567],
  "whey protein powder": [8, 80, 7, 400],
  "sweet potato, boiled": [20, 1.6, 0.1, 86],
  "potato, boiled": [17, 2, 0.1, 87],
  "brown bread": [43, 13, 3.5, 247],
  "white bread": [49, 9, 3.2, 265],
  "salmon, cooked": [0, 25, 13, 208],
  "tuna, canned in water": [0, 26, 1, 116],
  "broccoli, cooked": [7, 2.8, 0.4, 34],
  "spinach, cooked": [3.6, 2.9, 0.4, 23],
  avocado: [9, 2, 15, 160],
  "olive oil": [0, 0, 100, 884],
  ghee: [0, 0, 100, 900],
  butter: [0.1, 0.9, 81, 717],
  "cheddar cheese": [1.3, 25, 33, 403],
  "soybean, cooked": [9, 17, 9, 173],
  tofu: [1.9, 8, 4.8, 76],
  "quinoa, cooked": [21, 4.4, 1.9, 120],
  "idli (2 pcs, ~100g)": [22, 4, 0.5, 110],
  "dosa, plain": [30, 3, 3.7, 168],
  upma: [20, 3, 5, 150],
  poha: [27, 2.6, 3.5, 158],
  watermelon: [8, 0.6, 0.2, 30],
  orange: [12, 0.9, 0.1, 47],
  grapes: [18, 0.6, 0.3, 69],
  mango: [15, 0.8, 0.4, 60],
  dates: [75, 2.5, 0.4, 282],
  walnuts: [14, 15, 65, 654],
  cashews: [30, 18, 44, 553],
  "coconut, fresh": [15, 3.3, 33, 354],
  "protein bar, generic": [40, 20, 10, 350],
  "moong sprouts": [19, 3, 0.2, 30],
  "besan chilla": [15, 7, 5, 140],
  "mixed veg sabzi": [10, 3, 5, 100],
  "papad, roasted": [55, 20, 2, 335],
  "mutton curry": [4, 18, 12, 190],
  "fish curry": [4, 17, 8, 155],

  // ---- grains & cereals ----
  "wheat flour (atta), raw": [72, 12, 1.7, 340],
  "semolina (rava), raw": [74, 10, 1, 360],
  cornflakes: [84, 7, 0.4, 357],
  muesli: [66, 10, 6, 375],
  "vermicelli, cooked": [25, 3, 0.3, 120],
  "millet (bajra), cooked": [23, 3.5, 1.3, 119],
  "ragi (finger millet) flour": [72, 7, 1.3, 336],
  "jowar (sorghum), cooked": [23, 3, 1, 119],
  "barley, cooked": [28, 2.3, 0.4, 123],
  "pasta, cooked": [25, 5, 1.1, 131],
  "bread, multigrain": [41, 13, 4, 265],
  naan: [50, 9, 5, 310],
  "paratha, plain": [45, 7, 13, 330],

  // ---- legumes & pulses ----
  "moong dal, cooked": [20, 7, 0.4, 105],
  "masoor dal, cooked": [20, 9, 0.4, 116],
  "urad dal, cooked": [20, 8, 0.5, 105],
  "black beans, cooked": [24, 9, 0.5, 132],
  "green peas, cooked": [14, 5, 0.4, 84],

  // ---- vegetables ----
  "cauliflower, cooked": [5, 2, 0.5, 25],
  "carrot, raw": [10, 0.9, 0.2, 41],
  "tomato, raw": [3.9, 0.9, 0.2, 18],
  "onion, raw": [9, 1.1, 0.1, 40],
  "cucumber, raw": [3.6, 0.7, 0.1, 15],
  "bell pepper / capsicum": [6, 1, 0.3, 31],
  "green beans, cooked": [7, 1.8, 0.2, 35],
  "bitter gourd (karela)": [4, 1, 0.2, 17],
  "bottle gourd (lauki)": [3.4, 0.6, 0.1, 14],
  "okra (bhindi), cooked": [7, 2, 0.2, 33],
  "mushroom, cooked": [3.3, 3.1, 0.3, 28],
  "beetroot, boiled": [10, 1.7, 0.2, 44],
  lettuce: [2.9, 1.4, 0.1, 15],
  "corn, boiled": [21, 3.2, 1.5, 96],

  // ---- fruits ----
  pineapple: [13, 0.5, 0.1, 50],
  papaya: [11, 0.5, 0.3, 43],
  guava: [14, 2.6, 1, 68],
  strawberries: [8, 0.7, 0.3, 32],
  pear: [15, 0.4, 0.1, 57],
  kiwi: [15, 1.1, 0.5, 61],
  pomegranate: [19, 1.7, 1.2, 83],
  blueberries: [14, 0.7, 0.3, 57],
  muskmelon: [8, 0.8, 0.2, 34],
  "sapota (chikoo)": [20, 0.4, 1.1, 83],

  // ---- non-veg protein ----
  "prawns / shrimp, cooked": [0, 24, 0.3, 99],
  "turkey breast, cooked": [0, 29, 1, 135],
  "beef, lean, cooked": [0, 26, 15, 250],
  "pork, lean, cooked": [0, 27, 14, 242],
  "duck, cooked": [0, 19, 28, 337],
  "crab, cooked": [0, 19, 1.5, 97],
  "mackerel, cooked": [0, 23, 14, 225],
  "sardines, canned": [0, 25, 11, 208],
  "bacon, cooked": [1.4, 37, 42, 541],
  "sausage, chicken": [3, 15, 17, 220],
  ham: [1.5, 21, 5, 145],

  // ---- dairy & eggs ----
  "milk, skim": [5, 3.4, 0.1, 34],
  "buttermilk (chaas)": [3.6, 3.1, 0.9, 40],
  "cream cheese": [4, 6, 34, 342],
  mozzarella: [2.2, 22, 22, 300],
  ricotta: [3, 11, 13, 174],
  "greek yogurt": [3.6, 10, 0.4, 59],
  "egg yolk": [3.6, 16, 27, 322],

  // ---- nuts & seeds ----
  pistachios: [28, 20, 45, 560],
  "chia seeds": [42, 17, 31, 486],
  "flax seeds": [29, 18, 42, 534],
  "pumpkin seeds": [15, 19, 49, 559],
  "sunflower seeds": [20, 21, 51, 584],
  hazelnuts: [17, 15, 61, 628],

  // ---- snacks & staples ----
  "popcorn, air-popped": [78, 13, 5, 387],
  "potato chips": [53, 6, 35, 536],
  "dark chocolate": [46, 7, 31, 546],
  granola: [64, 10, 15, 471],
  honey: [82, 0.3, 0, 304],
  jaggery: [98, 0.4, 0.1, 383],
  sugar: [100, 0, 0, 387],
  "soy milk": [3, 3.3, 1.8, 54],
  "almond milk, unsweetened": [0.6, 0.4, 1.1, 15],
  "coconut milk": [3.3, 2.3, 24, 230],
  hummus: [14, 8, 10, 166],
  guacamole: [8, 2, 15, 155],
  mayonnaise: [0.6, 1, 75, 680],
  ketchup: [26, 1.2, 0.2, 101],
  "protein shake, ready-to-drink": [6, 20, 3, 140],

  // ---- Indian: rice & one-pot dishes ----
  "jeera rice": [24, 2.5, 4, 140],
  "veg pulao": [22, 3, 4, 135],
  "biryani, chicken": [20, 10, 7, 190],
  "biryani, veg": [22, 4, 6, 160],
  "curd rice": [18, 3, 3, 110],
  "lemon rice": [23, 2.8, 5, 150],
  "tamarind rice (puliyodarai)": [24, 3, 6, 160],
  "bisi bele bath": [18, 4, 4, 120],
  khichdi: [17, 5, 3, 110],

  // ---- Indian: breads ----
  "missi roti": [45, 10, 4, 290],
  bhatura: [45, 8, 15, 375],
  kulcha: [48, 9, 6, 300],
  thepla: [40, 7, 10, 270],

  // ---- Indian: dal, curries & sabzi ----
  sambar: [8, 4, 2, 65],
  rasam: [4, 1.5, 1, 30],
  "dal makhani": [10, 6, 7, 130],
  "dal tadka": [12, 6, 4, 105],
  "chole (chana masala)": [17, 7, 6, 155],
  "palak paneer": [6, 9, 12, 155],
  "paneer butter masala": [8, 9, 16, 210],
  kadhi: [7, 3, 4, 80],
  "aloo gobi": [12, 3, 5, 105],
  "baingan bharta": [8, 2, 6, 95],
  "matar paneer": [7, 8, 10, 150],
  "veg kurma": [10, 4, 8, 130],
  "chicken tikka masala": [6, 15, 10, 180],
  "butter chicken": [5, 16, 14, 215],
  "egg curry": [5, 10, 10, 150],
  "keema (mutton mince curry)": [4, 17, 14, 205],
  "prawn curry": [5, 15, 8, 150],

  // ---- Indian: snacks & street food ----
  "samosa (1 pc, ~50g)": [30, 4, 17, 260],
  "pakora / bhaji": [25, 5, 20, 290],
  dhokla: [20, 4, 3, 160],
  "vada (medu vada, 1 pc)": [18, 5, 10, 190],
  sev: [40, 15, 32, 510],
  "bhel puri": [22, 4, 6, 150],
  "pani puri (6 pcs)": [30, 3, 4, 150],
  "vada pav": [35, 6, 12, 270],
  "pav bhaji": [16, 3, 7, 140],
  kachori: [35, 6, 20, 340],
  chakli: [50, 8, 22, 420],
  murukku: [50, 7, 25, 430],
  "aloo tikki": [22, 3, 10, 190],
  idiyappam: [24, 2.5, 0.5, 110],
  appam: [22, 2.5, 1, 110],
  uttapam: [22, 3, 4, 140],

  // ---- Indian: sweets ----
  "gulab jamun (1 pc, ~40g)": [55, 4, 12, 340],
  "rasgulla (1 pc, ~40g)": [40, 4, 2, 190],
  jalebi: [65, 2, 15, 400],
  "barfi (milk)": [55, 7, 18, 410],
  "ladoo (besan)": [55, 7, 20, 440],
  kheer: [18, 3, 4, 120],
  "halwa (carrot/gajar)": [30, 3, 10, 220],
  rasmalai: [20, 6, 8, 180],

  // ---- Indian: drinks ----
  "lassi, sweet": [14, 3, 3, 95],
  "masala chai (with milk & sugar)": [8, 1.5, 1.5, 55],
  "filter coffee (with milk & sugar)": [6, 1, 1.5, 42],
  "nimbu pani (sweet lime water)": [10, 0, 0, 40],
  "coconut water": [4, 0.2, 0.1, 19],
  "sugarcane juice": [17, 0, 0, 65],

  // ---- Indian: raw staples & spices ----
  "turmeric powder": [65, 8, 10, 340],
  "cumin seeds": [44, 18, 22, 375],
  "mustard seeds": [28, 26, 36, 508],
  "coriander seeds": [55, 12, 18, 298],
  "red chili powder": [50, 15, 17, 282],
  "tamarind, raw": [63, 2.8, 0.6, 239],
  "coconut, dried (desiccated)": [24, 6, 65, 660],
};

// Average weight (g) for one typical piece/unit — used by the "pc" quantity mode.
export const PIECE_WEIGHTS: Record<string, number> = {
  apple: 182,
  banana: 118,
  orange: 131,
  mango: 200,
  "egg, boiled": 50,
  "egg white": 33,
  "roti / chapati": 40,
  "idli (2 pcs, ~100g)": 50,
  "dosa, plain": 80,
  dates: 8,
  "potato, boiled": 170,
  "sweet potato, boiled": 130,
  "besan chilla": 60,
  "papad, roasted": 12,
  "samosa (1 pc, ~50g)": 50,
  "vada (medu vada, 1 pc)": 45,
  "gulab jamun (1 pc, ~40g)": 40,
  "rasgulla (1 pc, ~40g)": 40,
  idiyappam: 40,
  appam: 60,
};

// Density (g per ml) — used by the "ml" quantity mode.
export const DENSITIES: Record<string, number> = {
  "milk, whole": 1.03,
  "milk, toned": 1.03,
  "curd / yogurt, plain": 1.03,
  "olive oil": 0.92,
  ghee: 0.91,
  "milk, skim": 1.03,
  "buttermilk (chaas)": 1.01,
  "soy milk": 1.02,
  "almond milk, unsweetened": 1.01,
  "coconut milk": 0.97,
  "protein shake, ready-to-drink": 1.03,
  honey: 1.42,
  ketchup: 1.14,
  mayonnaise: 0.91,
  "lassi, sweet": 1.03,
  "masala chai (with milk & sugar)": 1.02,
  "filter coffee (with milk & sugar)": 1.02,
  "nimbu pani (sweet lime water)": 1.01,
  "coconut water": 1.0,
  "sugarcane juice": 1.05,
};

export type SectionKey =
  | "breakfast"
  | "midMorningSnack"
  | "lunch"
  | "eveningSnack"
  | "preWorkout"
  | "postWorkout"
  | "dinner";

export interface SectionConfig {
  key: SectionKey;
  label: string;
  time: string;
  workout: boolean;
}

export const SECTIONS: SectionConfig[] = [
  { key: "breakfast", label: "Breakfast", time: "~7:00 – 9:00 AM", workout: false },
  { key: "midMorningSnack", label: "Mid-Morning Snack", time: "~11:00 AM", workout: false },
  { key: "lunch", label: "Lunch", time: "~1:00 – 2:00 PM", workout: false },
  { key: "eveningSnack", label: "Evening Snack", time: "~4:30 – 5:30 PM", workout: false },
  { key: "preWorkout", label: "Pre-Workout", time: "~30–45 min before training", workout: true },
  { key: "postWorkout", label: "Post-Workout", time: "within ~45 min after training", workout: true },
  { key: "dinner", label: "Dinner", time: "~8:00 – 9:00 PM", workout: false },
];
