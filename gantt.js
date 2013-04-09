var output_pre;
var Q2 = new Date(2013, 3, 1);
var MS_IN_HR = 3600000;
var WORK_HRS_IN_WEEK = 40 / 168;

var data;
var gOutstandingRequests = 0;

function log(str) {
    output_pre.innerHTML += str;
    output_pre.innerHTML += "\n"
}
function load() {
    var query = window.location.search.substring(1);
    console.log(query);
    var split = query.split('=');
    if (split[0] != "data") {
	document.getElementById("login").style.display = "block";
	console.log(split[0] + " != data");
	return;
    }
    data = JSON.parse(decodeURIComponent(split[1]));
    checkRetrieveStatus();
}
function getchart() {
    output_pre = document.createElement("pre");
    output_pre.innerHTML += "test 1\n";
    output_pre.style.display = "none";
    log("test 2");
    //var bug = 854855;
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;

    var query = window.location.search.substring(1);
    var bugs = query.split(',');
    data = new Array();
    for (i in bugs) {
	var subBugObj = {};
	data.push(subBugObj);
	getBugData(bugs[i], username, password, subBugObj);
    }

}

function getDivForBug(bugObj, bugDiv, subDiv, depth) {
    subDiv.className = "subbugs";
    if (bugObj.subbugs) {
	var bugs = bugObj.subbugs
	for (i in bugs) {
	    var containerDiv = document.createElement("div");
	    var bugDiv2 = document.createElement("div");
	    var subDiv2 = document.createElement("div");
	    getDivForBug(bugs[i], bugDiv2, subDiv2, depth + 1);
	    subDiv.appendChild(containerDiv);
	    containerDiv.appendChild(bugDiv2);
	    containerDiv.appendChild(subDiv2);
	}
    }
    var summarySpan = document.createElement("span");
    summarySpan.className = "summary";
    summarySpan.style.width = (340 - (depth * 15)) + "px";
    var bugLink = document.createElement("a");
    bugLink.href = "https://bugzilla.mozilla.org/show_bug.cgi?id=" + bugObj.bugNum;
    bugLink.innerHTML = bugObj.bugNum;
    summarySpan.appendChild(bugLink);
    var titleSpan = document.createElement("span");
    titleSpan.innerHTML = " - " + bugObj.title;
    summarySpan.appendChild(titleSpan);
    var estimateSpan = document.createElement("span");
    var completeSpan = document.createElement("span");
    estimateSpan.appendChild(completeSpan);
    estimateSpan.className = "estimate"
    estimateSpan.style.width = (bugObj.estimated_time) + "px";
    if (bugObj.deadline) {
	var d = new Date(bugObj.deadline);
	var ms = d.getTime();
	log(d.toString());
	log(Q2.toString());
	log(d - Q2);
	log((d - Q2) / MS_IN_HR);
	var h = ((ms - Q2.getTime()) / MS_IN_HR) * WORK_HRS_IN_WEEK;
	var start_h = h - bugObj.estimated_time;
	log("hours to end: " + h);
	log("hours to start: " + start_h);
	estimateSpan.style.marginLeft = (start_h) + "px";
    }
    completeSpan.className = "complete";
    completeSpan.style.width = (bugObj.actual_time) + "px";
    bugDiv.appendChild(summarySpan);
    bugDiv.appendChild(estimateSpan);
}

function checkRetrieveStatus() {
    //document.getElementById("json_display").innerHTML = JSON.stringify(data);
    if (gOutstandingRequests == 0) {
	//document.getElementById("json_display").style.color="green";
	var outputDiv = document.getElementById("output");
	var chartDiv = document.createElement("div");
	outputDiv.appendChild(chartDiv);
	var headerDiv = document.getElementById("header");
	var date = new Date(Q2);
	for (var i = 0; i < 24; i++) {
	    var span = document.createElement("span");
	    span.innerHTML = date.toLocaleFormat('%b %Y');
	    span.className = "month_timeline";
	    headerDiv.appendChild(span);
            date = new Date(date.getFullYear(), date.getMonth() + 1, date.getDay());
	}
	for (i in data) {
	    var containerDiv = document.createElement("div");
	    var bugDiv = document.createElement("div");
	    var subDiv = document.createElement("div");
	    getDivForBug(data[i], bugDiv, subDiv, 0);
	    chartDiv.appendChild(containerDiv);
	    containerDiv.appendChild(bugDiv);
	    containerDiv.appendChild(subDiv);
	}
	var link = document.createElement("a");
	link.href = "?data=" + encodeURIComponent(JSON.stringify(data));
	link.innerHTML = "link";
	document.getElementById("json_display").appendChild(link);
    }
}

function getBugData(bugNum, username, password, bugObj) {
    gOutstandingRequests++;
    bugObj.bugNum = bugNum;
    var url = "https://api-dev.bugzilla.mozilla.org/latest/bug/" + bugNum;
    var login = "username=" + username + "&password=" + password;
    var spec =  url + "?" + login;
    var oReq = new XMLHttpRequest();
    oReq.onload = function () {
	var json = JSON.parse(this.response);
	if (json.depends_on) {
	    bugObj.subbugs = new Array();
	    var bugs = json.depends_on;
	    for (i in bugs) {
		var subBugObj = {};
		bugObj.subbugs.push(subBugObj);
		getBugData(bugs[i], username, password, subBugObj);
	    }
	 }
	bugObj.title = json.summary;
	bugObj.estimated_time = json.estimated_time;
        bugObj.deadline = json.deadline;
	bugObj.actual_time = json.actual_time;
	gOutstandingRequests--;
	checkRetrieveStatus();
    }
    function transferFailed(e) {
	console.log("error");
	for (i in e) {
            console.log(i +": " + e[i]);
	}
	gOutstandingRequests--;
	checkRetrieveStatus();
    }
    oReq.addEventListener("error", transferFailed, false);
    oReq.open("GET", spec, true);
    oReq.setRequestHeader('Accept',       'application/json');
    oReq.setRequestHeader('Content-Type', 'application/json');
    oReq.send(login);
}

