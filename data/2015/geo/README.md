## 2015 Data

fence.json, outline.json, polygon.json and streets.json are generated from layout.json using layout.js in the scripts directory.


### layout.json

This file describes the layout of the city for the layout.js script to take in and generate necessary geo files.

- All distances are in feet.
- Bearings are in degrees [0,360]

`center`: GeoJSON point for the center of the city or The Man

`fence_distance`: Distance from center to pentagon vertexes.

`bearing`: The bearing of the city or direction of 12:00 starting at the center.

`road_width`: The standard width of the road.

`entrance_roard`:
	
`distance`: The distance from the fence to the split in the entrnace road.

`angle`: The angle of the split of entrance road.

`center_camp`:

`distance`: The distance from `center` to the center of center camp or center of the cafe.

`rod_road_distance` The distance from the center of center camp to the mid point of Rod's Road.

`cafe_plaza_radius`: The distance from the center of center camp to the beginning of camps, inner ring.

`cafe_radius`: The radius of the café

`six_six_width`: The width of Route 66.

`six_six_distance`:

`man_facing`: The distance from the center of center camp to the section of Route 66 on the side facing the man or 12:00.

`six_facing`: The distance from the center of center camp to the section of Route 66 on the other side face 6:00.

`cStreets`: Array of street descritpors for circular streets

`distance`: The distance of the mid point of the street to the man.

`segments`: Array of arrays with starting time and ending time. Always clockwise.

`ref`: The road ref.

`name`: The road Name.

`tStreets`: Array describing the time streets.

`refs`: Array of times.

`segments`: Array of arrays with starting distance and ending distance. Distance can be cStreet ref or feet.

`width`: Overriding street width.

`plazas`: Array of plaza descriptors.

`name`: name of the plaza.

`time`: Angle of the plaza.

`distance`: Distance from `center` either street or feet.

`diameter`: The diameter of the plaza.

`portals`: Array of portal descriptors. All portals are assumed to face `center`. They either stop at Esplanade or Rod's Road.

`distance`: The distance from `center` either street or feet.

`time`: The direction of the portal. 

`angle`: The angle of the opening.

`name`: The name of the portal.

`ref`: The portal ref.