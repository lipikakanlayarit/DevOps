import React from "react";
import CategoryRadio from "./CategoryRadio";
import OrderToggle from "./OrderToggle";
import SearchBar from "./SearchBar";

type Option = { label: string; value: string };
type Order = "newest" | "oldest";

type EventToolbarProps = {
  categories: Option[];
  category: string;
  onCategoryChange: (val: string) => void;

  order: Order;
  onOrderChange: (order: Order) => void;

  search: string;
  onSearchChange: (val: string) => void;

  className?: string;
};

export default function EventToolbar({
  categories,
  category,
  onCategoryChange,
  order,
  onOrderChange,
  search,
  onSearchChange,
  className = "",
}: EventToolbarProps) {
  return (
    <div className={["w-fit", className].join(" ")}>
      {/* แถวบน: CategoryRadio */}
      <div className="flex justify-end mb-4">
        <CategoryRadio
          options={categories}
          value={category}
          onChange={onCategoryChange}
        />
      </div>

      {/* แถวล่าง: OrderToggle + SearchBar */}
      <div className="flex items-center justify-end gap-3">
        <div className="shrink-0">
          <OrderToggle value={order as Order} onChange={onOrderChange} />
        </div>
        <div className="w-80">
          <SearchBar
            value={search}
            onChange={onSearchChange}
            width="w-full"
            height="h-11"
            placeholder="Search events..."
            className="rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
