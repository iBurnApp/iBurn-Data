import simplekml
import json

kml = simplekml.Kml()

#readFile = open('camps_geocoded.json')
#readFile = open('camps_geocoded_playaevents_unofficialmap.json')
#readFile = open('camps_geocoded_playaevents_unofficialmap_manual.json')
readFile = open('./output/art.2.json')
items = json.load(readFile)

for item in items:
	if 'latitude' in item:
		kml.newpoint(name=item['name'], coords=[(item['longitude'],item['latitude'])])

kml.save("art.2.kml")