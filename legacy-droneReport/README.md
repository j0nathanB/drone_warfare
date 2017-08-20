# droneReport
Drone Report uses publicly-available data (http://api.dronestre.am/) to visualize the locations and statistics of each US military drone strike from 2002 to the present day. When a location has been struck more than once, the statistics represent the aggregation of data for all drone strikes at that particular location. 

Some additional statistics (numbers are minimum estimates from the Drone Stream API):
* Total number of deaths: **4012**
* Total number of injuries: **1711**
* Total number of civilians killed: **310**
* Total number of children killed: **183**

* Deadliest strikes:
  * Saturday, March 5, 2016 - Raso, Somalia: 150 total deaths (No civilians)
  * Monday, October 30, 2006 - Chenegai, Pakistan: 81 total deaths (81 civilians including 69 children)
  
* Most frequently attacked locations:
  * Datta Khel, 37 times
    * Total deaths: 260 
    * Total civilians killed: 64
    * Total children killed: 9
  * Miranshah, 23 times
    * Total deaths: 143 deaths
    * Total civilians killed: 17
    * Total children killed: 9
  * Shawal, 19 times
    * Total deaths: 97
    * Total civilians killed: 2
    * Total children killed: 0

## Technical things 
- Built with React, ExpressJS, Node, Bootstrap
- Third-party APIs: 
  - http://api.dronestre.am/
  - https://developers.google.com/maps/
 
 ## Roadmap
 - Add pictures (where available for a particular location) to infoWindows
 - Slideshow option for viewing pictures
 - Add ability to sort data
 - Ability to search locations
