'use client';

import React, { memo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from "react-simple-maps";
// Bundled at build time instead of fetched from a CDN at runtime — the CDN
// fetch was blocked by CSP's connect-src (locked to 'self' + Supabase only),
// which silently prevented the map from ever rendering.
import worldAtlas from "world-atlas/countries-110m.json";

interface ShippingMapProps {
  validZones: any[];
}

const ShippingMap = ({ validZones }: ShippingMapProps) => {
  // Normalize valid country names for matching
  const validCountries = validZones.map(z => z.country.toLowerCase());

  return (
    <div className="w-full max-w-4xl mx-auto mb-12 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 p-4 shadow-sm">
      <h3 className="text-xl font-heading font-medium text-center mb-2">Global Shipping Coverage</h3>
      <div className="text-center text-sm text-gray-500 font-light mb-6 space-y-1">
        <p>We currently ship to 35+ countries worldwide, covering:</p>
        <p className="font-medium text-gray-700">Europe • Africa • Middle East</p>
        <p>Shipping options, delivery times, and costs may vary depending on the destination and order quantity.</p>
      </div>
      
      <div className="w-full h-auto aspect-[2/1] relative">
        <ComposableMap projection="geoMercator" width={800} height={400}>
          <ZoomableGroup center={[0, 20]} zoom={1} minZoom={1} maxZoom={4}>
            <Geographies geography={worldAtlas as any}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const countryName = geo.properties.name.toLowerCase();
                  
                  // Map data might have slightly different names, handle common exceptions if needed
                  let isCovered = validCountries.includes(countryName);
                  
                  // Simple alias checks (e.g. United States of America vs United States)
                  if (!isCovered) {
                      if (countryName === "united states of america" && validCountries.includes("united states")) isCovered = true;
                      if (countryName === "united kingdom" && validCountries.includes("uk")) isCovered = true;
                      if (countryName === "united arab emirates" && validCountries.includes("uae")) isCovered = true;
                  }

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={isCovered ? "#000000" : "#EAEAEC"}
                      stroke="#FFFFFF"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { fill: isCovered ? "#333333" : "#F5F5F6", outline: "none", cursor: isCovered ? "pointer" : "default" },
                        pressed: { outline: "none" },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>
    </div>
  );
};

export default memo(ShippingMap);
