iBurn-Scripts
=============

Scripts for scraping.

----------------

#Creating JSON feeds for iBurn
You may ask yourself, "How did I get here?"
##Source Data (./data)

####"Unofficial"" data

+ **art.json** Descriptive data for art. The result of scraper.py for art installations
+ **camps.json** Descriptive data for camps. The result of scraper.py for camps
+ **art-locations** Art geodata from BMorg
+ **camp-locations** Camp geodata from BMorg

####Official data from the [Playa Events API](http://playaevents.burningman.com/api/0.2/docs/)
+ **playaevents-art.json** Descriptive data for Art installations
+ **playaevents-camps.json** Descriptive data for camps
+ **playaevents-events.json** Descriptive data for events

##The Python Modules


###merge_playaevents-camps.py##
**INPUT:** camp-locations.json, playaevents-camps.json, camps.json (optional)

**OUTPUT:** ./results/camp_data_and_locations.json, ./results/unmatched_camps.json

This module merges camps from the scraper into the offical api feed, then adds location data (lat, lon, string of polar man coords) into this merged camp list from camp-locations.

Camps for which no location was found are ALSO output to ./results/unmatched_camps.json for manual inspection.

###merge_playaevents-art.py##
**INPUT:** art-locations.json, playaevents-art.json, art (optional)

**OUTPUT:** ./results/art_data_and_locations.json, ./results/unmatched_art.json

This module merges art from the scraper into the offical api feed, then adds location data (lat, lon, string of polar man coords) into this merged event list from art-locations.

Art for which no location was found are ALSO output to ./results/unmatched_art.json for manual inspection.

###merge_playaevents-events.py##
**INPUT:** camp-locations.json, playaevents-events.json,

**OUTPUT:** ./results/event_data_and_locations.json, ./results/unmatched_events.json

This module merges events from the scraper into the offical api feed, then adds location data (lat, lon, string of polar man coords) into this merged event list from camp-locations.

Events for which no location was found are ALSO output to ./results/unmatched_camps.json for manual inspection.

###merge_camp_id_from_events.py##
**INPUT:** camp_data_and_locations.json, playaevents-events.json

**OUTPUT:** ./results/camp_data_and_locations_ids.json, ./results/unmatched_camps_id.json

This module merges camp ids nested in the Playa Events API Event feed (some Events have a **hosted_by_camp** parameter, which reveals **name** and **id** of the host camp) into a JSON listing of camps.

# Warping Map Data Between Years

We used [OpenJUMP](http://www.openjump.org) to create a warp vector between the boundary points from 2013->2014, and then warped all the data for 2013->2014 from that same vector. Check out the `.jmp` file...

# TODO

* Cleanup this README
* Better instructions on what scripts need to be run in what order