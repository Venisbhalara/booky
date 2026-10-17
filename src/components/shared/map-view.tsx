"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import Link from "next/link";

export type MapBook = {
  id: string;
  title: string;
  lat: number;
  lng: number;
  priceLabel: string;
};

export default function MapView({
  books,
  center,
  me,
}: {
  books: MapBook[];
  center: [number, number];
  me?: { lat: number; lng: number } | null;
}) {
  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom
      className="h-full w-full rounded-2xl"
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {me && (
        <CircleMarker
          center={[me.lat, me.lng]}
          radius={8}
          pathOptions={{ color: "#092634", fillColor: "#092634", fillOpacity: 0.9 }}
        >
          <Popup>You are here</Popup>
        </CircleMarker>
      )}
      {books.map((b) => (
        <CircleMarker
          key={b.id}
          center={[b.lat, b.lng]}
          radius={9}
          pathOptions={{ color: "#004E72", fillColor: "#FF6E42", fillOpacity: 1, weight: 2 }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-bold">{b.title}</p>
              <p className="text-navy/60">{b.priceLabel}</p>
              <Link
                href={`/book/${b.id}`}
                className="mt-1 inline-block font-bold text-brand underline"
              >
                View book →
              </Link>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
