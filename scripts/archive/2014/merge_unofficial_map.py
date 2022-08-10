import json
from fastkml import  kml
import pylev

'''
	This script merges location data from the Unofficial Map of Black Rock City
	into the 'camps_geocoded.json' file, which follows the PlayaEvents API schema.

	e.g: This script merges user-submitted camp locations to refine
		 the intersection playa addresses we get from BMOrg.

	IMPORTANT : Change the lat / lon offset in _update_loc to reflect
				any delta between the unofficial maps BRC footprint
				and that measured by the BMOrg surveyors 
'''

# Update the location of a camp JSON entry
# with a location from the Unofficial Burning Man Map
# Remember to update the offset if one exists.
# This is typically the offset between Google's BRC footprint
# and the actual footprint for the working year
def _update_loc(camp, loc):
	# The delta applied here is equal to (current year man lat/lon - source data man lat/lon)
	lat = loc[0] + 0.0018
	lon = loc[1] + 0.00115
	print '\tAdjusting lat/lon by ' + str(camp['latitude'] - lat) + ' / ' + str(camp['longitude'] - lon) 
	camp['latitude'] = lat
	camp['longitude'] = lon

# Loose string match score above this value results in auto-match
AUTO_MATCH_THRESHOLD = .9
# Loose string match score above this value results in human prompt
POSSIBLE_MATCH_THRESHOLD = .5

readFile = open('camps_geocoded.json')
camps = json.load(readFile)

readFile = open('burnermaps_camps_8_11_14.kml')
kml = kml.KML()
kml.from_string(readFile.read())
kml_features = list(kml.features())

# Load Unofficial Burning Man Map KML into dictionary
# of name.lower() -> coordinates
camp_to_loc = {}
for feature in kml_features:
	for folder in list(feature.features()):
		if folder.name == 'Theme Camps':
			#print str(len(list(folder.features()))) + ' camps'
			for camp in list(folder.features()):
				camp_to_loc[camp.name.strip().lower()] = (camp.geometry.y, camp.geometry.x)
				#print camp.name.strip() + ' ' + str(camp.geometry.y) + ', ' + str(camp.geometry.x)


# A map of official camp name -> unofficial name
# populated by fuzzy string matching. If the match is exact
# it needn't be included here, as the lookup on camp_to_loc will suffice
name_map = {}
readFile = open('camps_to_unofficial_names.json')
try:
	name_map = json.load(readFile)
except ValueError:
	pass
# Sweep through all camps loaded from PlayaEvents format JSON
# and loose-match against the camp_to_loc map of unofficial name -> coordinates
for camp in camps:
	min_dist = 100
	min_dist_name = ''

	if camp['name'].lower() in camp_to_loc:
		_update_loc(camp, camp_to_loc[camp['name'].lower()])
	else:
		# Check if loose match is cached
		if camp['name'].lower() in name_map:
			unofficial_name = name_map[camp['name'].lower()]
			print 'Cached Match: ' + camp['name'] + ' with ' + unofficial_name
			_update_loc(camp, camp_to_loc[unofficial_name])
			continue

		# Find loose match
		for key in camp_to_loc:
			if pylev.levenshtein(key, camp['name'].lower()) < min_dist:
				min_dist = pylev.levenshtein(key, camp['name'].lower())
				min_dist_name = key
		percent_match = (len(min_dist_name) - min_dist) / float(len(min_dist_name))
		loc = camp_to_loc[min_dist_name]
		if percent_match > AUTO_MATCH_THRESHOLD:
			# Safe match. No human intervention
			print 'Matched ' + camp['name'] + ' with ' + min_dist_name + ' (' + str(percent_match) + ')'
			_update_loc(camp, loc)
			name_map[camp['name']] = min_dist_name
		elif percent_match > POSSIBLE_MATCH_THRESHOLD:
			# Possible match. Defer to human
			try:
				print '==== Possible Match. Confidence: ' + str(percent_match)
				print '\t' + unicode(camp['name'])
				print '\t' + unicode(min_dist_name)
				do_match = raw_input('Treat as match? [y/n]: ')
				if do_match == 'y':
					_update_loc(camp, loc)
					name_map[camp['name']] = min_dist_name
			except UnicodeEncodeError:
				print unicode(camp['name']) + ' ' + unicode(min_dist_name) + ' ' + unicode(percent_match)
		
writeFile = open('camps_to_unofficial_names.json', 'w')
writeFile.write(json.dumps(name_map, sort_keys=True, indent=4, separators=(',', ': ')))

writeFile = open('camps_geocoded_playaevents_unofficialmap.json', 'w')
writeFile.write(json.dumps(camps, sort_keys=True, indent=4, separators=(',', ': ')))
