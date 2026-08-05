import { Link } from "react-router-dom";
import { Bed, Bath, Maximize, Calendar } from "lucide-react";
import { Property } from "@/data/properties";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import PriceDisplay from "@/components/PriceDisplay";
import { cloudinaryUrl } from "@/lib/utils";

interface PropertyCardProps {
  property: Property;
  index?: number;
}

const PropertyCard = ({ property, index = 0 }: PropertyCardProps) => {
  const categoryLabel = {
    "off-plan": "Off-Plan",
    secondary: "Resale",
    rental: "Rental",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link
        to={`/properties/${property.slug || property.id}`}
        className="group block bg-card rounded-xl overflow-hidden shadow-luxury hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
      >
        {/* Image */}
        <div className="relative h-64 overflow-hidden">
          <img
            src={cloudinaryUrl(property.image, { width: 600, height: 400 })}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            loading="lazy"
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge className="bg-primary text-primary-foreground font-body text-xs">
              {categoryLabel[property.category]}
            </Badge>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/80 to-transparent p-4">
            <PriceDisplay
              price={property.price}
              category={property.category}
              className="text-primary-foreground font-display text-xl font-semibold"
              iconClassName="w-5 h-5 inline-block mr-1 mb-1.5"
            />
          </div>
        </div>

        {/* Details */}
        <div className="p-5">
          <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-gold transition-colors line-clamp-1">
            {property.title}
          </h3>
          <p className="text-muted-foreground text-sm font-body mt-1">
            {property.location}
          </p>
          {property.developer && (
            <p className="text-gold text-[10px] font-black uppercase tracking-widest mt-1">
              {property.developer}
            </p>
          )}

          <div className="flex items-center gap-5 mt-4 pt-4 border-t border-border">
            {property.category === "off-plan" ? (
              <>
                <span className="flex items-center gap-1.5 text-muted-foreground text-sm font-body">
                  <Bed className="w-4 h-4 text-gold" />
                  {property.unitTypes || "Various Units"}
                </span>
                {property.handoverYear && (
                  <span className="flex items-center gap-1.5 text-muted-foreground text-sm font-body">
                    <Calendar className="w-4 h-4 text-gold" />
                    {property.handoverYear}
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5 text-muted-foreground text-sm font-body">
                  <Bed className="w-4 h-4 text-gold" />
                  {property.bedrooms === 0 ? "Studio" : property.bedrooms}
                </span>
                {Number(property.bathrooms) > 0 && (
                  <span className="flex items-center gap-1.5 text-muted-foreground text-sm font-body">
                    <Bath className="w-4 h-4 text-gold" />
                    {property.bathrooms}
                  </span>
                )}
              </>
            )}
            {property.area && (
              <span className="flex items-center gap-1.5 text-muted-foreground text-sm font-body">
                <Maximize className="w-4 h-4 text-gold" />
                {typeof property.area === "number"
                  ? property.area.toLocaleString()
                  : property.area}{" "}
                sq.ft
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default PropertyCard;
