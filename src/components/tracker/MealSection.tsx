import type { SectionConfig } from "@/lib/food-db";
import { round1, totalsForItems, type EntryItem } from "@/lib/nutrition";
import type { CustomFoodRow } from "@/lib/db";
import ItemsList from "./ItemsList";
import AddItemRow from "./AddItemRow";
import SectionAccordion from "./SectionAccordion";

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
      <SectionAccordion
        defaultOpen={items.length > 0}
        headerLeft={
          <>
            <span className="name display">{section.label}</span>
            <span className="time">{section.time}</span>
          </>
        }
        headerRight={
          totals.cal > 0 ? <span className="mini-total">{Math.round(totals.cal)} cal</span> : null
        }
      >
        <div className="items">
          <ItemsList items={items} />
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
      </SectionAccordion>
    </div>
  );
}
