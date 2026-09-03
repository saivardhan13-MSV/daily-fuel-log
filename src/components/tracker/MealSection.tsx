import type { SectionConfig } from "@/lib/food-db";
import { round1, totalsForItems, type EntryItem } from "@/lib/nutrition";
import type { CustomFoodRow } from "@/lib/db";
import RemoveButton from "./RemoveButton";
import AddItemRow from "./AddItemRow";

export default function MealSection({
  section,
  items,
  date,
  customFoods,
}: {
  section: SectionConfig;
  items: EntryItem[];
  date: string;
  customFoods: CustomFoodRow[];
}) {
  const totals = totalsForItems(items);

  return (
    <div className={`section${section.workout ? " workout" : ""}`}>
      <div className="section-head">
        <span className="name display">{section.label}</span>
        <span className="time">{section.time}</span>
      </div>
      <div className="items">
        {items.length === 0 ? (
          <div className="empty-row">Nothing logged yet</div>
        ) : (
          <>
            <div className="item-head-row">
              <span>Food</span>
              <span className="q">grams</span>
              <span>protein</span>
              <span>carbs</span>
              <span>fat</span>
              <span className="sp" />
            </div>
            {items.map((it) => (
              <div className="item-row" key={it.id}>
                <span className="iname">{it.food_name}</span>
                <span className="iqty">{it.qty_label}</span>
                <span className="imacro protein">{round1(it.protein)}</span>
                <span className="imacro carbs">{round1(it.carbs)}</span>
                <span className="imacro fat">{round1(it.fat)}</span>
                <RemoveButton id={it.id} />
              </div>
            ))}
          </>
        )}

        <AddItemRow section={section.key} date={date} customFoods={customFoods} />
      </div>
      <div className="section-total">
        <span className="p">
          P <b>{round1(totals.protein)}g</b>
        </span>
        <span className="c">
          C <b>{round1(totals.carbs)}g</b>
        </span>
        <span className="f">
          F <b>{round1(totals.fat)}g</b>
        </span>
        <span>
          Cal <b>{Math.round(totals.cal)}</b>
        </span>
      </div>
    </div>
  );
}
