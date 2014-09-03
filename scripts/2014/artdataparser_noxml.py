'''
	Converts the Art data provided by PlayaEvents API JSON.

	Input:
		PlayaEvents art with playa location

	Output:
		iBurn Art Json
'''
import xml.etree.ElementTree as ET
import re
import json
import pdb
import math

xml_input = ET.parse("2014ArtPublicDataFinal.xml")
json_art_file = open('playaevents_art_8_12_14.json')
all_art = json.load(json_art_file)

art_name_to_id = {}
for art in all_art:
	art_name_to_id[art['name']] = art['id']

BRC_CENTER = [40.78880, -119.20315]
EARTH_RADIUS = 20890700.0

''' Playa time regex '''
# e.g: 3:00 2100
clock_address = re.compile('([1][0-2]|[1-9])[:/][0-5][0-9][ /]\d{1,6}$')
# e.g: 3:00 Plaza
clock_plaza_address = re.compile('([1][0-2]|[1-9])[:/][0-5][0-9][ /]\d{1,6}$')


odd_location_map = {
	'9:00 plaza' : [40.795065, -119.211311],
	'3:00 plaza' : [40.782766, -119.195159],
	'4:30 plaza' : [40.776930, -119.203256], 
	'7:30 plaza' : [40.788931, -119.219069],
	': 2:30 900' : [40.78756577522193, -119.20032662605978],
	'11:50 and 4000' : [40.79720357817201, -119.19383493716103],
	'121:05 3000' : [40.79380852908236, -119.19452768268354],
	'cafe' : [40.783249, -119.210726],
	'artery' : [40.7904448, -119.20186770000001],
	'souk' : BRC_CENTER,
	'keyhole' : [40.784382, -119.209403],
	

}

located_art = 0
unlocated_art = 0

def hourMinuteToDegrees(hour, minute):
		return .5*(60*(int(hour)%12)+int(minute))

def bearing(hour, minute):
		return math.radians((hourMinuteToDegrees(hour, minute)+45)%360)

def timeDistanceToLatLong(time, distance):
	hour = time.split(':')[0]
	minute = time.split(':')[1]
	bearingAngle = bearing(hour, minute)	
	lat1 = math.radians(BRC_CENTER[0])
	lon1 = math.radians(BRC_CENTER[1])
	d = distance

	lat2 = math.asin(math.sin(lat1) * math.cos(d / EARTH_RADIUS) + math.cos(lat1) * math.sin(d / EARTH_RADIUS) * math.cos(bearingAngle))
	lon2 = lon1+math.atan2(math.sin(bearingAngle)*math.sin(d/EARTH_RADIUS)*math.cos(lat1), math.cos(d/EARTH_RADIUS)-math.sin(lat1)*math.sin(lat2))
	return [ math.degrees(lat2), math.degrees(lon2)]

def proccess_art_loc(art, location):
	'''
	Possible input:

	location: 
		'1:00 1600'

		'Mobile'
		'Keyhole'(?)
		'Souk'	 (Area around man)
		'Airport'
		'Cafe Portal' (?)
		'ARTery' (Camp)

	'''
	global located_art
	global unlocated_art

	# Remove duplicate colons
	location = re.sub("::",":", location)
	# Remove duplicate spaces
	location = re.sub("\s+"," ", location)

	if clock_address.match(location):
		# Found clock address
		address = location.strip().split(' ')
		time = address[0]
		distance = address[1]
		lat_lon = timeDistanceToLatLong(time, int(distance))
		art['latitude'] = lat_lon[0]
		art['longitude'] = lat_lon[1]
		located_art +=1
		#print art['name'] + ' : ' + str(lat_lon[0]) + ', ' + str(lat_lon[1])
		#print 'found address in ' + location + ' : (' + time + ' & ' + distance + ')'
	elif location.lower() in odd_location_map:
		lat_lon = odd_location_map[location.lower()]
		art['latitude'] = lat_lon[0]
		art['longitude'] = lat_lon[1]
		located_art +=1
	else:
		# Did not find clock address
		unlocated_art +=1
		#print 'found no address in ' + location
		art['location'] = location

# Grab hometown from private data
# Everything else is available via PlayaEvents API

# id -> hometown
private_art = {}
for element in list(xml_input.getroot().findall('{http://www.filemaker.com/fmpdsoresult}ROW')):
	art = {}

	if element.find('{http://www.filemaker.com/fmpdsoresult}T_Name').text:
		art['name'] 				= element.find('{http://www.filemaker.com/fmpdsoresult}T_Name').text

	if art['name'] in art_name_to_id:
		art_id = art_name_to_id[art['name']]
		hometown 					= element.find('{http://www.filemaker.com/fmpdsoresult}T_City')
		homestate					= element.find('{http://www.filemaker.com/fmpdsoresult}T_State')

		if hometown is not None and hometown.text is not None and homestate is not None and homestate.text is not None:
			private_art[art_id] = hometown.text.strip() + ', ' + homestate.text.strip()
		elif hometown is not None and hometown.text is not None:
			private_art[art_id] = hometown.text.strip()
	else:
		print 'No Id for ' + art['name']

art_list = []
for art in all_art:
	# Remove null keys
	art = {k: v for k, v in art.items() if v}
	if art['id'] in private_art:
		print 'add hometown ' + private_art[art['id']]
		art['hometown'] = private_art[art['id']]
	if 'location_string' in art:
		proccess_art_loc(art, art['location_string'])
		del art['location_string']
	if 'slug' in art:
		del art['slug']

	art_list.append(art)

f = open('./output/art.2.json', 'w')
f.write(json.dumps(art_list, sort_keys=True, indent=4, separators=(',', ': '), ensure_ascii=False).encode('utf8'))

print str(unlocated_art) + ' / ' + str(located_art)  + ' un/located art'
'''
XML element tags:

{http://www.filemaker.com/fmpdsoresult}T_Name
{http://www.filemaker.com/fmpdsoresult}T_Year
{http://www.filemaker.com/fmpdsoresult}T_UNID_Project
{http://www.filemaker.com/fmpdsoresult}T_ArtInstallCreator
{http://www.filemaker.com/fmpdsoresult}T_URL
{http://www.filemaker.com/fmpdsoresult}T_WWW
{http://www.filemaker.com/fmpdsoresult}T_City
{http://www.filemaker.com/fmpdsoresult}T_state
{http://www.filemaker.com/fmpdsoresult}T_PublicEmail
{http://www.filemaker.com/fmpdsoresult}T_Location
'''