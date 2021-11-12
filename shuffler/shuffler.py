import json
import sys

seed = {};
if(len(sys.argv) > 1):
	seedFile = open(sys.argv[1])
	seed = json.load(seedFile)

locationsFile = open('locations.json',)
locations = json.load(locationsFile)

for seedItem in seed:
	seedLoc = seed[seedItem]
	fileName = "../" + locations[seedLoc]['file']
	if fileName == "../na":
		continue
	locAction = locations[seedLoc]['action'] + seedLoc
	itemAction = locations[seedLoc]['action'] + seedItem
	if('FLAG_' in seedItem):
		itemAction = "setflag " + seedItem
	
	fileData = ""
	with open(fileName, 'r') as file:
		filedata = file.read()
	
	filedata = filedata.replace(locAction, itemAction)
	with open(fileName, 'w') as file:
		file.write(filedata)