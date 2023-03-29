// utils.js
export function adjustCenter(map, sidebarWidth) {
  const mapSize = map.getSize();
  const sidebarCenterOffset = sidebarWidth / 2;
  const offset = map.unproject([sidebarCenterOffset, 0], map.getZoom());
  const newCenter = map.getCenter().add(offset);
  return newCenter;
}

export async function loadJSON(filePath) {
  try {
    const response = await fetch(filePath, {
      header: {'Access-Control-Allow-Origin':'*'},
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const jsonData = await response.json();
    return jsonData;
  } catch (error) {
    console.error("Error loading JSON:", error);
  }
}

export function getColor(d) {
  return d > 2000 ? '#67000d' :
         d > 1000 ? '#a50f15' :
         d > 500  ? '#cb181d' :
         d > 200  ? '#ef3b2c' :
         d > 100  ? '#fb6a4a' :
         d > 50   ? '#fc9272' :
         d > 20   ? '#fcbba1' :
         d > 10   ? '#fee0d2' :
                    '#fff5f0';
}