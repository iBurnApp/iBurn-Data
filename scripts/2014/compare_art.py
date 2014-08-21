import json

json_art_file = open('playaevents_art_8_12_14.json')
all_art = json.load(json_art_file)

print len(all_art)

json_art_file = open('./output/art.1.json')
all_art = json.load(json_art_file)

print len(all_art)
