async function loadLogic(logicName){
	const logicAsJson = await fetch('./logic/' + logicName + '.json', {
		method: 'GET'
	});
	const logic = await logicAsJson.json();
	logicJson.innerHTML = JSON.stringify(logic, undefined, 2);
}

loadLogic("none");

function downloadObjectAsJson(exportObj, exportName){
	var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, undefined, 2));
	var downloadAnchorNode = document.createElement('a');
	downloadAnchorNode.setAttribute("href",     dataStr);
	downloadAnchorNode.setAttribute("download", exportName + ".json");
	document.body.appendChild(downloadAnchorNode); // required for firefox
	downloadAnchorNode.click();
	downloadAnchorNode.remove();
}

function randomProperty(obj) {
	const keys = Object.keys(obj);
	return keys[Math.floor(keys.length * Math.random())];
};

function getAccessable(logic, loObtained) {
	loAccessable = [];
	loLocalObtained = [...loObtained];
	if(logic.hms) {
		for(const hm in logic.hms) {
			if(logic.hms[hm].every(val => loLocalObtained.includes(val))) {
				loLocalObtained.push(hm);
			}
		}
	}
	if(logic.branches) {
		for(const branch in logic.branches) {
			if(logic.branches[branch].every(val => loLocalObtained.includes(val))) {
				loLocalObtained.push(branch);
			}
		}
	}
	if(logic.items) {
		for(const item in logic.items) {
			if(logic.items[item].every(val => loLocalObtained.includes(val))) {
				loAccessable.push(item);
			}
		}
	}
	return loAccessable;
}

function isAccessable(logic, loObtained, anEvent) {
	loLocalObtained = [...loObtained];
	if(logic.hms) {
		for(const hm in logic.hms) {
			if(logic.hms[hm].every(val => loLocalObtained.includes(val))) {
				loLocalObtained.push(hm);
			}
		}
	}
	if(logic.branches) {
		for(const branch in logic.branches) {
			if(logic.branches[branch].every(val => loLocalObtained.includes(val))) {
				loLocalObtained.push(branch);
			}
		}
	}
	return logic.events[anEvent].every(val => loLocalObtained.includes(val))
}

function removeObtained(loExpanded, loObtained) {
	let uniques = [];
	for(const i in loExpanded) {
		if(!loObtained.includes(loExpanded[i])) {
			if(!uniques.includes(loExpanded[i])) {
				uniques.push(loExpanded[i]);
			}
		}
	}
	return uniques;
}

function getSetsForLoc(logic, loObtained, loReqs) {
	let loSets = [];
	let loExpanded = [...loReqs];
	for(const i in loReqs) {
		if(loReqs[i].includes("HM_")) {
			const ind = loExpanded.indexOf(loReqs[i]);
			if (ind !== -1) {
				loExpanded.splice(ind, 1);
			}
			loExpanded = loExpanded.concat(logic.hms[loReqs[i]]);
		}
		if(loReqs[i].includes("EVENT_")) {
			const ind = loExpanded.indexOf(loReqs[i]);
			if (ind !== -1) {
				loExpanded.splice(ind, 1);
			}
		}
	}
	loExpanded = removeObtained(loExpanded, loObtained);
	for(const i in loExpanded) {
		if(loExpanded[i].includes("BRANCH_")) {
			loSets = loSets.concat(getSetsForLoc(logic, loObtained, logic.branches[loExpanded[i]+"_1"]))
			loSets = loSets.concat(getSetsForLoc(logic, loObtained, logic.branches[loExpanded[i]+"_2"]))
			for(const j in loSets) {
				const loExpandedNonBranches = loExpanded.filter( function( el ) {
					return !el.includes("BRANCH_");
				} );
				loSets[j] = loSets[j].concat(loExpandedNonBranches);
			}
			return loSets;
		}
	}
	if(loExpanded.length > 0) {
		loSets.push(loExpanded);
	}
	return loSets;
}

function getSets(logic, loObtained, loLocsNeedingItems, loAccessable) {
	let loSets = [];
	for(const i in loLocsNeedingItems) {
		if(!loAccessable.includes(loLocsNeedingItems[i])) {
			loSets = loSets.concat(getSetsForLoc(logic, loObtained, logic.items[loLocsNeedingItems[i]]));
		}
	}
	for(const i in loSets) {
		let strArray = loSets[i].map(JSON.stringify);
		let uniqueSet = new Set(strArray);
		loSets[i] = Array.from(uniqueSet, JSON.parse);
	}
	let stringArray = loSets.map(JSON.stringify);
	let uniqueStringArray = new Set(stringArray);
	loSets = Array.from(uniqueStringArray, JSON.parse);
	return loSets;
}

function isContained(loInner, loOuter) {
	for(const i in loInner) {
		if(!loOuter.includes(loInner[i])) {
			return false;
		}
	}
	return true;
}

function getSubSets(loSets) {
	let loSubSets = [];
	for(const i in loSets) {
		let isMini = true;
		for(const j in loSets) {
			if(j !== i) {
				if(isContained(loSets[j], loSets[i])) {
					isMini = false;
				}
			}
		}
		if(isMini) {
			loSubSets.push(loSets[i]);
		}
	}
	return loSubSets;
}

function removeSet(loSets, aSet) {
	let newLoSets = [];
	for(const i in loSets) {
		newLoSets.push([]);
		for(const j in loSets[i]) {
			if(!aSet.includes(loSets[i][j])) {
				newLoSets[i].push(loSets[i][j]);
			}
		}
	}
	let stringArray = newLoSets.map(JSON.stringify);
	let uniqueStringArray = new Set(stringArray);
	newLoSets = Array.from(uniqueStringArray, JSON.parse);
	newLoSets = newLoSets.filter(item => item.length > 0)
	return newLoSets;
}

function generateSeed() {
	const logic = JSON.parse(logicJson.innerHTML);
	const allItems = Object.keys(logic.items);
	let seed = {};
	let loObtained = [];
	let loLocs = [];
	let loAccessable = getAccessable(logic, loObtained);
	let loSets = getSets(logic, loObtained, allItems, loAccessable);
	while(!isAccessable(logic, loObtained, "EVENT_HALL_OF_FAME")) {
		console.log(loSets);
		const loSubSets = getSubSets(loSets);
		const addSet = loSubSets[Math.floor(loSubSets.length * Math.random())];
		console.log(addSet);
		loSets = removeSet(loSets, addSet);
		for(const i in addSet) {
			loObtained.push(addSet[i]);
			const loAvailableLocs = loAccessable.filter(value => !loLocs.includes(value));
			const randomLoc = loAvailableLocs[Math.floor(loAvailableLocs.length * Math.random())];
			seed[addSet[i]] = randomLoc;
			loLocs.push(randomLoc);
		}
		loAccessable = getAccessable(logic, loObtained);
	}
	let loAvailableLocs = allItems.filter(value => !loLocs.includes(value));
	for(const i in allItems) {
		if(!loObtained.includes(allItems[i])) {
			const ind = Math.floor(loAvailableLocs.length * Math.random())
			const randomLoc = loAvailableLocs[ind];
			seed[allItems[i]] = randomLoc;
			loAvailableLocs.splice(ind, 1);
		}
	}
	//downloadObjectAsJson(seed, "seed");
}