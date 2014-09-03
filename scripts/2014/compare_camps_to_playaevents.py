'''
	Compares PlayaEvents item files for differences

	Input:
		(2) PlayaEvents item json files (lookup on name)
'''
import json

compare_key = 'title'

camps_1_json = open('playaevents_events_8_11_14.json')
camps_1 = json.load(camps_1_json)

camps_2_json = open('./output/events.1.json')
camps_2 = json.load(camps_2_json)

camp_names = []
for camp in camps_1:
	camp_names.append(camp[compare_key].strip().lower())

new_camps = 0
for camp in camps_2:
	if camp[compare_key].strip().lower() not in camp_names:
		print 'New item: ' + camp[compare_key]
		new_camps += 1

print 'new items ' + str(new_camps)