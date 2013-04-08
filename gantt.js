var output_pre;
var Q2 = new Date(2013, 3, 1);
var MS_IN_HR = 3600000;
var WORK_HRS_IN_WEEK = 40 / 168;

function log(str) {
    output_pre.innerHTML += str;
    output_pre.innerHTML += "\n"
}
function load() {
    output_pre = document.createElement("pre");
    var outputDiv = document.getElementById("output");
    output_pre.innerHTML += "test 1\n";
    output_pre.style.display = "none";
    log("test 2");
    //var bug = 854855;
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;
    var chartDiv = document.createElement("div");
    outputDiv.appendChild(chartDiv);
    outputDiv.appendChild(output_pre);
    var headerDiv = document.getElementById("header");
    var date = new Date(Q2);
    for (var i = 0; i < 24; i++) {
	var span = document.createElement("span");
	span.innerHTML = date.toLocaleFormat('%b %Y');
	span.className = "month_timeline";
	headerDiv.appendChild(span);
        date = new Date(date.getFullYear(), date.getMonth() + 1, date.getDay());
    }

    var query = window.location.search.substring(1);
    var bugs = query.split(',');
    for (bug in bugs) {
	var containerDiv = document.createElement("div");
	var bugDiv = document.createElement("div");
	var subDiv = document.createElement("div");
	getDivForBug(bugs[bug], username, password, bugDiv, subDiv, 0);
	chartDiv.appendChild(containerDiv);
	containerDiv.appendChild(bugDiv);
	containerDiv.appendChild(subDiv);
    }
}
function getDivForBug(bug, username, password, bugDiv, subDiv, depth) {
    var url = "https://api-dev.bugzilla.mozilla.org/latest/bug/" + bug;
    var login = "username=" + username + "&password=" + password;
    //subDiv.style.margin = "15px";
    subDiv.className = "subbugs";
    var spec =  url + "?" + login;
    log (spec);
    function reqListener () {
	log(this.responseText);
	var json = JSON.parse(this.response);
	if (json.depends_on) {
	    var bugs = json.depends_on;
	    //var bugs = subbugs.split(',');
	    for (i in bugs) {
		var containerDiv = document.createElement("div");
		var bugDiv2 = document.createElement("div");
		var subDiv2 = document.createElement("div");
		getDivForBug(bugs[i], username, password, bugDiv2, subDiv2, depth + 1);
		subDiv.appendChild(containerDiv);
		containerDiv.appendChild(bugDiv2);
		containerDiv.appendChild(subDiv2);
	    }
	}
	var summarySpan = document.createElement("span");
	summarySpan.className = "summary";
	summarySpan.style.width = (340 - (depth * 15)) + "px";
	var bugLink = document.createElement("a");
	bugLink.href = "https://bugzilla.mozilla.org/show_bug.cgi?id=" + bug;
	bugLink.innerHTML = bug;
	summarySpan.appendChild(bugLink);
	var titleSpan = document.createElement("span");
	titleSpan.innerHTML = " - " + json.summary;
	summarySpan.appendChild(titleSpan);
	var estimateSpan = document.createElement("span");
	var completeSpan = document.createElement("span");
	estimateSpan.appendChild(completeSpan);
	estimateSpan.className = "estimate"
	estimateSpan.style.width = (json.estimated_time) + "px";
	if (json.deadline) {
	    var d = new Date(json.deadline);
	    var ms = d.getTime();
	    log(d.toString());
	    log(Q2.toString());
	    log(d - Q2);
	    log((d - Q2) / MS_IN_HR);
	    var h = ((ms - Q2.getTime()) / MS_IN_HR) * WORK_HRS_IN_WEEK;
	    var start_h = h - json.estimated_time;
	    log("hours to end: " + h);
	    log("hours to start: " + start_h);
	    estimateSpan.style.marginLeft = (start_h) + "px";
	}
	completeSpan.className = "complete";
	completeSpan.style.width = (json.actual_time) + "px";
	bugDiv.appendChild(summarySpan);
	bugDiv.appendChild(estimateSpan);
    };

    function transferFailed(e) {
	log("error");
	for (i in e) {
            log(i +": " + e[i]);
	}
    }

    var oReq = new XMLHttpRequest();
    oReq.onload = reqListener;
    oReq.addEventListener("error", transferFailed, false);
    oReq.open("GET", spec, true);
    oReq.setRequestHeader('Accept',       'application/json');
    oReq.setRequestHeader('Content-Type', 'application/json');
    oReq.send(login);
}

