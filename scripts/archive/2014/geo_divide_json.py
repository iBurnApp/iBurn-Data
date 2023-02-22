'''
	Splits PlayEvents json files into sections by geography
'''
import re
import json
import math
import simplekml

''' Playa time regex '''
time_re = re.compile('([1][0-2]|[1-9])[:/][0-5][0-9]')

json_camp_file = open('camps_geocoded_playaevents_unofficialmap_manual_ids.json')
camps = json.load(json_camp_file)

BRC_CENTER = [40.788800, -119.203150]
time_1 = 315
time_2 = 440
time_3 = 630
time_4 = 740
time_5 = 900
time_6 = 1040

mystery_camps = []
t1_camps = []
t2_camps = []
t3_camps = []
t4_camps = []
t5_camps = []
t6_camps = []
for camp in camps:
	if 'location' in camp:
		location = camp['location']
		time = time_re.search(location)
		if time:
			str_time = time.group(0)
			time = int(str_time.replace(':',''))
			if time < time_1:
				t1_camps.append(camp)
			elif time < time_2:
				t2_camps.append(camp)
			elif time < time_3:
				t3_camps.append(camp)
			elif time < time_4:
				t4_camps.append(camp)
			elif time < time_5:
				t5_camps.append(camp)
			elif time < time_6:
				t6_camps.append(camp)	
			else:
				# Above 10:00
				mystery_camps.append(camp)

		else:
			# No time within location
			mystery_camps.append(camp)
	else:
		# No location field
		mystery_camps.append(camp)


print 'mystery: ' + str(len(mystery_camps))
print 't1 camps: ' + str(len(t1_camps))
print 't2 camps: ' + str(len(t2_camps))
print 't3 camps: ' + str(len(t3_camps))
print 't4 camps: ' + str(len(t4_camps))
print 't5 camps: ' + str(len(t5_camps))
print 't6 + mystery camps: ' + str(len(t6_camps + mystery_camps))


kml = simplekml.Kml()

for item in t1_camps:
	if 'latitude' in item:
		kml.newpoint(name=item['name'], description=str(item['id']), coords=[(item['longitude'],item['latitude'])])

kml.save("t1_camps.kml")

kml = simplekml.Kml()

for item in t2_camps:
	if 'latitude' in item:
		kml.newpoint(name=item['name'], description=str(item['id']), coords=[(item['longitude'],item['latitude'])])

kml.save("t2_camps.kml")

kml = simplekml.Kml()

for item in t3_camps:
	if 'latitude' in item:
		kml.newpoint(name=item['name'], description=str(item['id']), coords=[(item['longitude'],item['latitude'])])

kml.save("t3_camps.kml")

kml = simplekml.Kml()

for item in t4_camps:
	if 'latitude' in item:
		kml.newpoint(name=item['name'], description=str(item['id']), coords=[(item['longitude'],item['latitude'])])

kml.save("t4_camps.kml")

kml = simplekml.Kml()

for item in t5_camps:
	if 'latitude' in item:
		kml.newpoint(name=item['name'], description=str(item['id']), coords=[(item['longitude'],item['latitude'])])

kml.save("t5_camps.kml")

kml = simplekml.Kml()
t6_camps += mystery_camps
for item in t6_camps:
	if 'latitude' in item:
		kml.newpoint(name=item['name'], description=str(item['id']), coords=[(item['longitude'],item['latitude'])])

kml.save("t6_camps.kml")

