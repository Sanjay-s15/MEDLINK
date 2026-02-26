'use client';
import { useEffect, useRef, useState } from 'react';

interface MapPickerProps {
    lat: number;
    lng: number;
    onChange: (lat: number, lng: number, address: string) => void;
}

export default function MapPicker({ lat, lng, onChange }: MapPickerProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafRef = useRef<any>(null);
    const mapInst = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const initLock = useRef(false);   // sync guard: prevents StrictMode double-fire
    const [searching, setSearching] = useState(false);
    const [query, setQuery] = useState('');
    const [geocodeErr, setGeocodeErr] = useState('');

    // Reverse geocode via Nominatim (free, no API key)
    const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
        try {
            const r = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const d = await r.json();
            return d.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        } catch {
            return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        }
    };

    // Forward geocode — search by address
    const forwardGeocode = async () => {
        if (!query.trim()) return;
        setSearching(true); setGeocodeErr('');
        try {
            const r = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const d = await r.json();
            if (!d.length) { setGeocodeErr('Location not found. Try a different search.'); return; }
            const { lat: la, lon: ln, display_name } = d[0];
            const newLat = parseFloat(la);
            const newLng = parseFloat(ln);
            mapInst.current?.setView([newLat, newLng], 16);
            markerRef.current?.setLatLng([newLat, newLng]);
            onChange(newLat, newLng, display_name);
        } catch {
            setGeocodeErr('Search failed. Please try again.');
        } finally { setSearching(false); }
    };

    useEffect(() => {
        if (!mapRef.current || initLock.current) return;
        initLock.current = true;   // lock immediately (sync) before any await

        (async () => {
            const L = (await import('leaflet')).default;
            leafRef.current = L;

            // Destroy any pre-existing Leaflet instance on the DOM node
            // (handles StrictMode cleanup + re-mount cycles)
            const container = mapRef.current as any;
            if (container && container._leaflet_id) {
                container._leaflet_id = null;
            }

            // Fix default icon paths broken by webpack
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });

            const initLat = lat || 12.9716;
            const initLng = lng || 77.5946;

            const map = L.map(mapRef.current!, { zoomControl: true }).setView([initLat, initLng], 14);
            mapInst.current = map;

            // Force Leaflet to recalculate container size after CSS layout settles
            setTimeout(() => map.invalidateSize(), 100);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19,
            }).addTo(map);

            // Custom styled marker
            const customIcon = L.divIcon({
                className: '',
                html: `<div style="width:36px;height:36px;background:linear-gradient(135deg,#7c3aed,#6d28d9);border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(124,58,237,0.5);"></div>`,
                iconSize: [36, 36],
                iconAnchor: [18, 36],
            });

            const marker = L.marker([initLat, initLng], { icon: customIcon, draggable: true }).addTo(map);
            markerRef.current = marker;

            // Click on map → move marker + reverse geocode
            map.on('click', async (e: any) => {
                const { lat: la, lng: ln } = e.latlng;
                marker.setLatLng([la, ln]);
                const addr = await reverseGeocode(la, ln);
                onChange(la, ln, addr);
            });

            // Drag marker → reverse geocode
            marker.on('dragend', async () => {
                const { lat: la, lng: ln } = marker.getLatLng();
                const addr = await reverseGeocode(la, ln);
                onChange(la, ln, addr);
            });
        })();

        return () => {
            mapInst.current?.remove();
            mapInst.current = null;
            markerRef.current = null;
            initLock.current = false;   // reset lock on unmount so re-mount works
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Sync marker position when lat/lng props change (e.g. form reset or search result)
    // Do NOT call setView here — that causes a feedback loop when the user clicks the map,
    // because onChange → parent state → new props → this effect → setView → map jumps
    useEffect(() => {
        if (markerRef.current && lat && lng) {
            markerRef.current.setLatLng([lat, lng]);
        }
    }, [lat, lng]);

    return (
        <div className="space-y-2">
            {/* Search bar */}
            <div className="flex gap-2">
                <input
                    value={query} onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), forwardGeocode())}
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="🔍  Search location — e.g. MG Road, Bangalore"
                />
                <button type="button" onClick={forwardGeocode} disabled={searching}
                    className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-50 whitespace-nowrap">
                    {searching ? '…' : 'Search'}
                </button>
            </div>
            {geocodeErr && <p className="text-red-400 text-xs">{geocodeErr}</p>}

            {/* Outer wrapper carries visual styling; Leaflet container inside has NO overflow/radius */}
            <div className="w-full rounded-2xl overflow-hidden border border-white/10" style={{ height: 320 }}>
                <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
            </div>
            <p className="text-slate-500 text-xs">📍 Click anywhere on the map or drag the marker to set the clinic's exact location</p>
        </div>
    );
}
