'''
	Converts Official Camp data provided in XML by Burning Man Org
	to JSON of the PlayaEvents API format.

	Input:
		Burning Man Org Camp Placement XML
		PlayaEvents Camp without location JSON 
			e.g: http://playaevents.burningman.com/api/0.2/2014/camp/

	Output:
		iBurn Camp Json (./camps.json)
'''

import xml.etree.ElementTree as ET
import re
import json
import pdb

# Should we write results to json?
DRY_RUN = False

''' Circular Streets '''

# Valid streets to appear in a playa address
# of form <Street> & <Time>
circ_streets = [
	'Esplanade',
	'Antioch',
	'Basra',
	'Cinnamon',
	'Darjeeling',
	'Ephesus',
	'Frankincense',
	'Gold',
	'Haifa',
	'Isfahan',
	'Jade',
	'Kandahar',
	'Lapis',
	'Rod\'s Road',
	'Airport Rd',
	'Portal',		
	'Public Plaza', 
	'Inner Circle', # Convert to Center Camp Plaza
	'Plaza'	# Convert to Center Camp Plaza

]

circ_street_duplicate_fixer = {
	'Plaza' : 'Center Camp Plaza',
	'Inner Circle' : 'Center Camp Plaza'
}

''' Playa time regex '''
time_re = re.compile('([1][0-2]|[1-9])[:/][0-5][0-9]')

def _clean_string(string):
    if string:
        string = re.sub(r'^[\n\t\s]+', '', string)
        string = re.sub(r'[\n\t\s]+$', '', string)
        string = string.replace(" (dot) ", ".")
        string = string.replace(" (at) ", "@")
        string = re.sub(r"[\n\t\s]+\s+[\n\t\s]+", "\n\n", string)
        if string.find("by ") == 0:
            string = string[4:]
            string = string.split(", ")
    return string

def cache_camp_loc(name, location, cache):
	'''
	Possible input:

	name : 
		'Some camp name'

	location: 
		'5:45 & Jade'
		'Isfahan & 9:45'
		'Rod's Road @ 1:00'
		'Located within Black Rock Power CO-OP'

	cache (output):
		'Some camp name' : Isfahan & 9:45
	'''
	if location:
		if 'located within' in location.lower():
			# Skip, not cacheable
			#print 'skipping ' + location
			return

		street = ''
		time = time_re.search(location)
		if time:
			time = time.group(0)
			for c_street in circ_streets:
				if c_street in location:
					street = c_street
					break
		else:
			print 'unknown loc ' + location
			return

		#print street + ' & ' + time + ' (' + location + ')'

		cache[name.strip().lower()] = street + ' & ' + time

tree = ET.parse("2014PlacementPublicDataFinal.xml")

print 'Checking ' + str(len(list(tree.getroot()))) + " items"

# List of all camps for json export
camp_list = []

# Map of stripped, lowercase camp name to playaAddress
camp_to_loc = {}

# List of stripped, lowercase camp names to help merge
# Burning Man Org and PlayaEvents data
camp_name_list = []

# First Pass: Create a map of camp name -> location to correct 
# Camps with location of form: "Located within <CAMP Name>"
# Also populate camp_name_list
for element in list(tree.getroot().findall('{http://www.filemaker.com/fmpdsoresult}ROW')):

	if element.find('{http://www.filemaker.com/fmpdsoresult}T_Name').text and element.find('{http://www.filemaker.com/fmpdsoresult}T_Loc_forExport').text:
		camp_loc = element.find('{http://www.filemaker.com/fmpdsoresult}T_Loc_forExport').text
		camp_loc = _clean_string(camp_loc).strip()
		camp_name = element.find('{http://www.filemaker.com/fmpdsoresult}T_Name').text

		camp_name_list.append(camp_name.strip().lower())

		if 'located within' in camp_loc.lower():
			# We're only caching camps with playa addresses
			#print 'skipping ' + camp_loc
			continue

		camp_name = _clean_string(camp_name)
		
		cache_camp_loc(camp_name, camp_loc, camp_to_loc)

#print json.dumps(camp_to_loc, sort_keys=True, indent=4, separators=(',', ': '))
if not DRY_RUN:
	f = open('camp_locations.json', 'w')
	f.write(json.dumps(camp_to_loc, sort_keys=True, indent=4, separators=(',', ': ')))

located_camps = 0
mystery_camps = 0
# Second Pass: Now build the final json representation
for element in list(tree.getroot().findall('{http://www.filemaker.com/fmpdsoresult}ROW')):
	camp = {}
	if element.find('{http://www.filemaker.com/fmpdsoresult}T_Name').text:
		camp['name'] 			= element.find('{http://www.filemaker.com/fmpdsoresult}T_Name').text
	
	if element.find('{http://www.filemaker.com/fmpdsoresult}T_PublicEmail').text:
		camp['contact_email']	= element.find('{http://www.filemaker.com/fmpdsoresult}T_PublicEmail').text
	
	if element.find('{http://www.filemaker.com/fmpdsoresult}T_Loc_forExport').text:
		raw_location 			= element.find('{http://www.filemaker.com/fmpdsoresult}T_Loc_forExport').text
		clean_name = _clean_string(camp['name']).strip()
		if clean_name.lower() in camp_to_loc:
			# Camp name found in location cache
			camp['location'] = camp_to_loc[clean_name.lower()]
			located_camps+=1
		elif 'Located within' in raw_location:
			# Camp location references another camp 
			clean_host_name = raw_location.split('Located within ')[1].strip()
			#pdb.set_trace()
			if clean_host_name.lower() in camp_to_loc:
				camp['location'] = camp_to_loc[clean_host_name.lower()]
				located_camps+=1
			else:
				print 'cant find ' + clean_host_name
	
		if 'location' not in camp:
			mystery_camps+=1
			# If we couldn't lookup location, use XML
			camp['location'] = raw_location

	if element.find('{http://www.filemaker.com/fmpdsoresult}T_WWW').text:
		camp['description']		= element.find('{http://www.filemaker.com/fmpdsoresult}T_WWW').text
	
	if element.find('{http://www.filemaker.com/fmpdsoresult}T_Public_URL').text:
		camp['url'] 			= element.find('{http://www.filemaker.com/fmpdsoresult}T_Public_URL').text

	if element.find('{http://www.filemaker.com/fmpdsoresult}T_Year').text:
		camp['year'] = {
		'year' : element.find('{http://www.filemaker.com/fmpdsoresult}T_Year').text,
		'id' : 10}

	hometown 				= element.find('{http://www.filemaker.com/fmpdsoresult}T_hometown').text
	homestate				= element.find('{http://www.filemaker.com/fmpdsoresult}T_public_state').text
	if hometown and homestate:
		camp['hometown'] = hometown.strip() + ', ' + homestate.strip()
	elif hometown:
		camp['hometown'] = hometown.strip()

	# Sanitize all values
	try:
		for key, value in camp.iteritems():
			camp[key] = _clean_string(value).strip()
	except TypeError: 
		# Value is not a string. Ignore sanitization error
		pass
	camp_list.append(camp)
	#print json.dumps(camp, sort_keys=True, indent=4, separators=(',', ': '))

# Third pass -- Add any Camps from the PlayaEvents API that weren't 
# included in the Burning Man Org XML
json_camps_file = open('playaevents_camps_8_11_14.json')
camps = json.load(json_camps_file)

print 'Camps in PlayaEvents API not in BMOrg data:'
for camp in camps:
	if camp['name'].strip().lower() not in camp_name_list:
		# Remove null keys from dict
		camp = {k: v for k, v in camp.items() if v}
		camp_list.append(camp)

print 'done!'

if not DRY_RUN:
	f = open('camps.json', 'w')
	f.write(json.dumps(camp_list, sort_keys=True, indent=4, separators=(',', ': ')))

print str(located_camps) + ' / ' + str(mystery_camps) + ' located / mystery camps'

'''
XML element tags:

{http://www.filemaker.com/fmpdsoresult}T_Year
{http://www.filemaker.com/fmpdsoresult}T_UNID_Project
{http://www.filemaker.com/fmpdsoresult}T_Name
{http://www.filemaker.com/fmpdsoresult}T_WWW
{http://www.filemaker.com/fmpdsoresult}T_hometown
{http://www.filemaker.com/fmpdsoresult}T_public_state
{http://www.filemaker.com/fmpdsoresult}T_public_country
{http://www.filemaker.com/fmpdsoresult}T_Public_URL
{http://www.filemaker.com/fmpdsoresult}T_PublicEmail
{http://www.filemaker.com/fmpdsoresult}T_Loc_forExport
'''