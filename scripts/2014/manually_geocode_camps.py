# -*- coding: utf-8 -*-
import json
from fastkml import  kml
import pylev

'''
	This script manually adjusts camp location when everything else fails.
	These are typically the result of playa addresses that produced errant
	geocodes
'''

CINNAMON_315 = {
	"latitude" : 40.782061,
	"longitude" : -119.194535, 
}

CINNAMON_315_CAMPS = [
	'EMBARGOED'
]


PLAZA_300 = {
	"latitude" : 40.782061,
	"longitude" : -119.194535, 
}

PLAZA_300_CAMPS = [
	'EMBARGOED'
]

BASRA_745 = {
	"latitude" : 40.789751,
	"longitude" : -119.214292, 
}

BASRA_745_CAMPS = [
	'ENBARGOED'
]

DARJEELING_245 = {
	"latitude" : 40.783263,
	"longitude" : -119.192073, 
}

DARJEELING_245_CAMPS = [
	'EMBARGOED'
]



readFile = open('camps_geocoded_playaevents_unofficialmap.json')
camps = json.load(readFile)

for camp in camps:
	if camp['name'] in CINNAMON_315_CAMPS:
		print 'modiying camp ' + camp['name']
		camp['latitude'] = CINNAMON_315['latitude']
		camp['longitude'] = CINNAMON_315['longitude']
	elif camp['name'] in PLAZA_300_CAMPS:
		print 'modiying camp ' + camp['name']
		camp['latitude'] = PLAZA_300['latitude']
		camp['longitude'] = PLAZA_300['longitude']
	elif camp['name'] in BASRA_745_CAMPS:
		print 'modiying camp ' + camp['name']
		camp['latitude'] = BASRA_745['latitude']
		camp['longitude'] = BASRA_745['longitude']
	elif camp['name'] in DARJEELING_245_CAMPS:
		print 'modiying camp ' + camp['name']
		camp['latitude'] = DARJEELING_245['latitude']
		camp['longitude'] = DARJEELING_245['longitude']


writeFile = open('camps_geocoded_playaevents_unofficialmap_manual.json', 'w')
writeFile.write(json.dumps(camps, sort_keys=True, indent=4, separators=(',', ': ')))



