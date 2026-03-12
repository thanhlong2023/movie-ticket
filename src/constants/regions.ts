// Configuration for theater regions
export const REGIONS: Record<string, { name: string; icon: string }> = {
  "ha-noi": { name: "Hà Nội", icon: "🏛️" },
  "ho-chi-minh": { name: "Hồ Chí Minh", icon: "🌆" },
  "mien-bac-khac": { name: "Miền Bắc khác", icon: "🗻" },
  "mien-nam-khac": { name: "Miền Nam khác", icon: "🌴" },
};

export const getRegionName = (regionKey: string): string => {
  return REGIONS[regionKey]?.name || regionKey;
};

export const getRegionIcon = (regionKey: string): string => {
  return REGIONS[regionKey]?.icon || "📍";
};
