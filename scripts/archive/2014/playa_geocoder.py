from pygeocoder import Geocoder
from pygeocoder import GeocoderError
import json
import pdb
import time

readFile = open('camps.json')
camps = json.load(readFile)

readFile = open('playa_geocoding.json')
# playa address -> [lat, lon]
playa_gecodes = json.load(readFile)

writeFile = open('playa_geocodes.json', 'w')

count = 0
for camp in camps:
	if camp['location'] not in playa_gecodes:
		try:
			result = Geocoder.geocode(camp['location'] + ', Black Rock City, NV')[0].coordinates
			# Adjust Google BRC footprint inacurracy
			lat = result[0] + 0.0018
			lon = result[1] + 0.00115
			playa_gecodes[camp['location']] = [lat, lon]
			count+=1
			print str(count) + ' geocoded  ' + camp['location'] + ' ' + str(result)
		except GeocoderError:
			print 'Unable to geocode ' + camp['location']
		# Don't request too quickly
		time.sleep(.25)

writeFile.write(json.dumps(playa_gecodes, sort_keys=True, indent=4, separators=(',', ': ')))
