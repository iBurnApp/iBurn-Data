import simplekml
import json

'''
	This script merges data from the PlayaEvents API
	not present in the 'camps_geocoded.json' file, which
	is the same schema of PlayaEvents API generated from
	internal BMOrg data.

	e.g: We merge the PlayaEvents unique IDs into the 
	data obtained from BMOrg.
'''

#readFile = open('camps_geocoded.json')
readFile = open('camps_geocoded_playaevents_unofficialmap_manual.json')
camps = json.load(readFile)

readFile = open('playaevents_camps.json')
camps_playaevents = json.load(readFile)

camp_to_id = {}
for camp in camps_playaevents:
	camp_to_id[camp['name']] = camp['id']

for camp in camps:
	# Add playaEvents ID
	if camp['name'] in camp_to_id:
		camp['id'] = camp_to_id[camp['name']]
	else:
		print 'no id for ' + camp['name']

	# Add year
	camp['year'] = {'year' : '2014', 'id': 10}

writeFile = open('camps_geocoded_playaevents_unofficialmap_manual_ids.json', 'w')

writeFile.write(json.dumps(camps, sort_keys=True, indent=4, separators=(',', ': ')))
