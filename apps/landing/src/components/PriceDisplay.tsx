import React from "react";
import DirhamIcon from "./icons/DirhamIcon";

interface PriceDisplayProps {
  price: number;
  category: string;
  className?: string;
  iconClassName?: string;
  iconSize?: number | string;
}

const PriceDisplay = ({
  price,
  category,
  className = "",
  iconClassName = "w-4 h-4 inline-block mb-1",
  iconSize = 16,
}: PriceDisplayProps) => {
  const formattedPrice = price.toLocaleString();

  if (category === "rental") {
    return (
      <span className={className}>
        <DirhamIcon size={iconSize} className={iconClassName} />{" "}
        {formattedPrice} /yr
      </span>
    );
  }

  if (category === "off-plan") {
    return (
      <span className={className}>
        <span className="text-[10px] sm:text-[11px] font-semibold text-stone-500 uppercase tracking-wider mr-1.5 inline-block">Starting from</span>
        <DirhamIcon size={iconSize} className={iconClassName} />{" "}
        {formattedPrice}
      </span>
    );
  }

  return (
    <span className={className}>
      <DirhamIcon size={iconSize} className={iconClassName} /> {formattedPrice}
    </span>
  );
};

export default PriceDisplay;
