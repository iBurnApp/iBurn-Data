'''
	Augments the Event data provided in JSON by the PlayaEvents API
	with location data based on camp matching.

	Input:
		PlayaEvents event JSON (w/out location)
		PlayaEvents camp JSON with location
		PlayaEvents art JSON with location

	Output:
		iBurn Event Json
'''
import xml.etree.ElementTree as ET
import re
import json
import pdb
import math

json_camps_file = open('./output/camps.2.json')
camps = json.load(json_camps_file)

camp_id_to_loc = {}
for camp in camps:
	if 'latitude' in camp:
		camp_id_to_loc[camp['id']] = [
			camp['latitude'], 
			camp['longitude']
		]
	else:
		print 'no location info for camp ' + camp['name']

json_art_file = open('./output/art.2.json')
all_art = json.load(json_art_file)
art_id_to_loc = {}
for art in all_art:
	if 'latitude' in art:
		art_id_to_loc[art['id']] = [
			art['latitude'], 
			art['longitude']
		]
	else:
		print 'no location info for art ' + art['name']

json_events_file = open('playaevents_events_8_11_14.json')
events = json.load(json_events_file)

event_list = []
mystery_camps = []
located_events = 0
unlocated_events = 0
for event in events:
	locatedEvent = False
	if 'hosted_by_camp' in event:
		if 'id' in event['hosted_by_camp']:
			if event['hosted_by_camp']['id'] in camp_id_to_loc:
				lat_lon = camp_id_to_loc[event['hosted_by_camp']['id']]
				event['latitude'] = lat_lon[0]
				event['longitude'] = lat_lon[1]
				locatedEvent = True
			else:
				mystery_camp = {
					'id': event['hosted_by_camp']['id'],
					'name': event['hosted_by_camp']['name']
					}
				if mystery_camp not in mystery_camps:
					mystery_camps.append(mystery_camp)
				print 'unknown camp id ' + event['hosted_by_camp']['name']
	elif 'located_at_art' in event:
		if 'id' in event['located_at_art']:
			if event['located_at_art']['id'] in art_id_to_loc:
				lat_lon = art_id_to_loc[event['located_at_art']['id']]
				event['latitude'] = lat_lon[0]
				event['longitude'] = lat_lon[1]
				locatedEvent = True
	elif 'other_location' in event:
		event['location'] = event['other_location']
		locatedEvent = True

	if not locatedEvent:
		unlocated_events +=1
		#print 'could not locate  event id ' + str(event['id'])
	else:
		located_events +=1
	if 'other_location' in event:
		del event['other_location']
	if 'slug' in event:
		del event['slug']
	# TODO Sanitize

	event_list.append(event)

print str(unlocated_events) + ' / ' + str(located_events) + ' un/located events'

f = open('./output/events.2.json', 'w')
f.write(json.dumps(event_list, sort_keys=True, indent=4, separators=(',', ': ')))

f = open('mystery_camps.json', 'w')
f.write(json.dumps(mystery_camps, sort_keys=True, indent=4, separators=(',', ': ')))

