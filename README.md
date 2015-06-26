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

# iBurn API Data Updates

As of 2015 we host the data on S3 and use Cloudflare's CDN to cache the data to allow for updates without resubmitting the app. Cloudflare only caches [these file types](https://support.cloudflare.com/hc/en-us/articles/200172516-What-file-extensions-does-CloudFlare-cache-for-static-content-) so make sure we use those extensions to keep the S3 bill down. We append `.js` for the `.json` files and `.jar` to the `.mbtiles` file.

Clients fetch from an 'secret' S3 `ENDPOINT_URL`/`update.json.js` to check the last time the data files were updated. We use the same datetime format as the PlayaEvents API.

```json
{
	"art": {"file": "art.json.js",
			"updated": "2015-06-25 16:30:00"},
	"camps": {"file": "camps.json.js",
			  "updated": "2015-06-25 16:30:00"},
	"events": {"file": "events.json.js",
			   "updated": "2015-06-25 16:30:00"},
	"tiles": {"file": "iburn.mbtiles.jar",
			  "updated": "2015-06-25 16:30:00"}
}
```

If a file has been updated since the last time the client fetched it, simply fetch the new data for each datatype from `ENDPOINT_URL`/`file` and merge it with the existing data on the client.

We can display when the data was last updated for each item in the app and show a warning on data objects that weren't updated in the last fetch, indicating that the item may have been removed.

# TODO

* Cleanup this README
* Better instructions on what scripts need to be run in what order