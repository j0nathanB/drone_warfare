# Drone Warfare

This repository contains an interactive web map that visualizes the locations and human cost of drone strikes in Pakistan, Yemen, Somalia, and Afghanistan from 2004 to 2020. The data is sourced from the [Bureau of Investigative Journalism's Drone Warfare project](https://www.thebureauinvestigates.com/projects/drone-war) (now [Airwars](https://airwars.org/)).

The project uses Leaflet, a JavaScript library for interactive maps, and D3.js for data processing and visualization.

## Features

- Interactive map with administrative boundaries
- Zoom and pan functionality
- Table with summary statistics for each region
- Popups displaying detailed information about each region
- Breadcrumbs navigation for drilling down into the data

## Getting Started

### Prerequisites

- A modern web browser such as Google Chrome, Mozilla Firefox, Microsoft Edge, or Safari

### Installation

1. Clone the repository or download the source code as a ZIP file:

   ```
   git clone https://github.com/j0nathanb/drone_warfare.git
   ```

2. Navigate to the project folder:

   ```
   cd drone_warfare
   ```

3. Open the `index.html` file in your web browser.

4. You can also just view it on [https://j0nathanb.github.io/drone_warfare](https://j0nathanb.github.io/drone_warfare)

## Usage

- Click on a shaded region to view the breakdown of drone strikes and casualties for that area.
- Use the breadcrumbs navigation to move back up the hierarchy of administrative divisions.
- Hover over a region to see a popup with the region's name and the number of strikes.
- Interact with the table to view summary statistics for each region.

## Data Sources

- Drone strike data: [Bureau of Investigative Journalism's Drone Warfare project](https://www.thebureauinvestigates.com/projects/drone-war) (now [Airwars](https://airwars.org/))
- Administrative boundaries: [geoBoundaries](https://www.geoboundaries.org)
- Toponymic information: [Geographic Names Database](https://geonames.nga.mil/geonames/GNSHome/welcome.html)

## License

This project is licensed under the GNU General Public License. See the `LICENSE` file for more details.

## Notes

- The `data` folder contains the raw data used for this project
- The `data/cleanup/` folder shows the steps I took to clean the data prior to mapping it

## Acknowledgments

- [Leaflet](https://leafletjs.com/) for providing a powerful and easy-to-use library for interactive maps
- [geoBoundaries](https://www.geoboundaries.org) for providing accurate and up-to-date administrative boundary data
- [Geographic Names Database](https://geonames.nga.mil/geonames/GNSHome/welcome.html) for providing toponymic information
- [Bootstrap](https://getbootstrap.com/) for providing a responsive and modern design framework