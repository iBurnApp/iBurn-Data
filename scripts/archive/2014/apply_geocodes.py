from pygeocoder import Geocoder
from pygeocoder import GeocoderError
import json
import pdb
import time

readFile = open('camps.json')
camps = json.load(readFile)

readFile = open('playa_geocodes.json')
# playa address -> [lat, lon]
playa_gecodes = json.load(readFile)

writeFile = open('camps_geocoded.json', 'w')

count = 0
for camp in camps:
	if camp['location'] in playa_gecodes:
		loc = playa_gecodes[camp['location']]
		camp['latitude'] = loc[0]
		camp['longitude'] = loc[1]
	else:
		print 'No geocode for ' + camp['location']

writeFile.write(json.dumps(camps, sort_keys=True, indent=4, separators=(',', ': ')))
