import json
import simplekml
from fastkml import  kml

'''
	This script transforms location data from the Unofficial Map of Black Rock City
	for easy inspection as a kml

	IMPORTANT : Change the lat / lon offset in _update_loc to reflect
				any delta between the unofficial maps BRC footprint
				and that measured by the BMOrg surveyors 
'''
LAT_OFFSET = 0.001594
LON_OFFSET = 0.00174199999999

readFile = open('unofficial_brc_map_8_11_14.kml')
in_kml = kml.KML()
in_kml.from_string(readFile.read())
in_kml_features = list(in_kml.features())

out_kml = simplekml.Kml()

# Load Unofficial Burning Man Map KML into dictionary
# of name.lower() -> coordinates
camp_to_loc = {}
for feature in in_kml_features:
	for folder in list(feature.features()):
		if folder.name == 'Theme Camps':
			#print str(len(list(folder.features()))) + ' camps'
			for camp in list(folder.features()):
				out_kml.newpoint(name=camp.name, coords=[(camp.geometry.x + LON_OFFSET, camp.geometry.y + LAT_OFFSET)])
				#print camp.name.strip() + ' ' + str(camp.geometry.y) + ', ' + str(camp.geometry.x)
out_kml.save("burnermaps_camps_8_11_14_transformed.kml")