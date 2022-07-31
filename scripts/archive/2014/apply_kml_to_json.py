import json
import simplekml
from fastkml import  kml
from haversine import haversine

'''
	This script applies geo informatin within a KML file to a json file.
	It is currently configured for use with Camps. The description of 
	each KML PlaceMark should contain a PlayaEvents API Id.
'''

camp_file = open('./output/camps.1.json')
camp_json = json.load(camp_file)

# camp_id -> camp
camp_cache = {}
for camp in camp_json:
	camp_cache[camp['id']] = camp

kml_files = [
	't1.camps.johnstone_complete.kml',
	't2_camps.brodsky_complete.kml',
	't3_camps.henderson_complete.kml',
	't4_camps.chiles_complete.kml',
	't5_camps.ballinger_complete.kml',
	't6_camps.kleiner_complete.kml'
]

for kml_file in kml_files:
	readFile = open(kml_file)
	in_kml = kml.KML()
	in_kml.from_string(readFile.read())

	# Sum the total correction (km)
	total_correction = 0

	for feature in list(in_kml.features()):
		for sub_feature in list(feature.features()):
			camp_id = int(sub_feature.description)
			if camp_id not in camp_cache:
				print 'unknown ID! ' + camp_id
			else:
				this_correction = haversine(( camp_cache[camp_id]['latitude'], camp_cache[camp_id]['longitude']), ( sub_feature.geometry.y, sub_feature.geometry.x), miles=True)
				#print this_correction
				total_correction += this_correction
				camp_cache[camp_id]['latitude'] = sub_feature.geometry.y
				camp_cache[camp_id]['longitude'] = sub_feature.geometry.x


	print kml_file + ' total correction miles: ' + str(total_correction)


out_file = open('./output/camps.2.json', 'w')
out_file.write(json.dumps(camp_cache.values(), sort_keys=True, indent=4, separators=(',', ': ')))



'''
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

'''