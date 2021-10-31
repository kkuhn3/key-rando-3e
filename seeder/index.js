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

function oneSeed(logic, availableItems) {
	let seedObj = {};
	for(const item in logic.items) {
		const randItem = randomProperty(availableItems);
		delete availableItems[randItem];
		seedObj[item] = randItem;
	}
	return seedObj;
}

function isGoodSeed(seed, logic, key) {
	const branchName = (key.split("_")[0] + "s").toLowerCase();
	const branch = logic[branchName];
	if(!branch[key]) {
		console.log("logic is missing key... so whatever?");
		return true;
	}
	for(let i = 0; i < branch[key].length; i++) {
		if(!isGoodSeed(seed, logic, branch[key][i])) {
			return false;
		}
	}
	return true;
}

function generateSeed() {
	const logic = JSON.parse(logicJson.innerHTML);
	const availableItems = JSON.parse(JSON.stringify(logic.items));
	let i = 1;
	let seed = oneSeed(logic, availableItems);
	while(!isGoodSeed(seed, logic, "EVENT_HALL_OF_FAME")) {
		i++;
		seed = oneSeed(logic, availableItems);
	}
	console.log("seed checks out! Searched: " + i + " seeds");
	downloadObjectAsJson(seed, "seed");
}