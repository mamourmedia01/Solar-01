"""
Ordnance Survey NGD (National Geographic Database) API client.
Fetches building polygons, heights and roof attributes.
"""
import httpx
from typing import Optional, Dict, Any, List
from app.core.config import settings

NGD_BASE = "https://api.os.uk/features/ngd/ofa/v1"
BUILDING_COLLECTION = "bld-fts-buildingpart-1"


async def get_buildings_by_bbox(
    min_lon: float, min_lat: float, max_lon: float, max_lat: float
) -> List[Dict[str, Any]]:
    """Return building features within a bounding box."""
    bbox = f"{min_lon},{min_lat},{max_lon},{max_lat}"
    url = f"{NGD_BASE}/collections/{BUILDING_COLLECTION}/items"
    params = {
        "key": settings.OS_API_KEY,
        "bbox": bbox,
        "bbox-crs": "http://www.opengis.net/def/crs/OGC/1.3/CRS84",
        "crs": "http://www.opengis.net/def/crs/OGC/1.3/CRS84",
        "limit": 100,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        data = r.json()
    return data.get("features", [])


async def get_building_by_uprn(uprn: str) -> Optional[Dict[str, Any]]:
    """Fetch a single building feature by UPRN."""
    url = f"{NGD_BASE}/collections/{BUILDING_COLLECTION}/items"
    params = {
        "key": settings.OS_API_KEY,
        "filter": f"RelatingUPRN='{uprn}'",
        "filter-lang": "cql2-text",
        "limit": 1,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        data = r.json()
    features = data.get("features", [])
    return features[0] if features else None


def extract_roof_attributes(feature: Dict[str, Any]) -> Dict[str, Any]:
    """Pull usable roof data from a NGD building feature."""
    props = feature.get("properties", {})
    geom = feature.get("geometry", {})

    # Compute rough area from GeoJSON polygon using shapely
    area_m2 = 0.0
    orientation_deg = None
    try:
        from shapely.geometry import shape
        from pyproj import Transformer
        # Project to British National Grid (EPSG:27700) for area in m²
        transformer = Transformer.from_crs("EPSG:4326", "EPSG:27700", always_xy=True)
        poly = shape(geom)
        coords = list(poly.exterior.coords)
        proj_coords = [transformer.transform(lon, lat) for lon, lat in coords]
        from shapely.geometry import Polygon
        proj_poly = Polygon(proj_coords)
        area_m2 = proj_poly.area
    except Exception:
        pass

    height_m = props.get("RelativeHeightMaximum") or props.get("AbsoluteHeightMaximum")
    roof_shape = props.get("RoofShape")

    return {
        "polygon": geom,
        "area_m2": round(area_m2, 1),
        "height_m": float(height_m) if height_m else None,
        "orientation_deg": orientation_deg,
        "roof_shape": roof_shape,
        "low_confidence": area_m2 == 0.0 or height_m is None,
    }


def passes_solar_filter(attrs: Dict[str, Any], min_area: float = 500.0) -> bool:
    """Return True if the building is worth prospecting."""
    if attrs["area_m2"] < min_area:
        return False
    orientation = attrs.get("orientation_deg")
    if orientation is not None and not (120 <= orientation <= 240):
        # Allow flat roofs (None orientation passes through)
        if attrs.get("roof_shape") not in (None, "Flat"):
            return False
    return True
