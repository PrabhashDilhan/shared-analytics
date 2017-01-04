/*
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var nanoScrollerSelector = $(".nano");
var canvasDiv = "#canvas";
var prefs = new gadgets.Prefs();
var svrUrl = gadgetUtil.getGadgetSvrUrl(prefs.getString(PARAM_TYPE));
var client = new AnalyticsClient().init(null,null,svrUrl);

function initialize() {
    $(canvasDiv).html(gadgetUtil.getCustemText("No content to display","Please click on a View button from the above table" +
        " to access all the log events in the time period surrounding an event."));
    nanoScrollerSelector.nanoScroller();
}

$(document).ready(function () {
    initialize();
});

function fetch(sol) {

     drawLogViewer(sol);

    nanoScrollerSelector[0].nanoscroller.reset();
   document.getElementById(selectedDiv).scrollIntoView();
}

function drawLogViewer(solu) {
    $(canvasDiv).empty();
    var selectedDiv = "";
                $(canvasDiv).append(createLogList("logInfo",solu));
                selectedDiv = "logInfo";
    nanoScrollerSelector[0].nanoscroller.reset();
   document.getElementById(selectedDiv).scrollIntoView();
}


function subscribe(callback) {
    gadgets.HubSettings.onConnect = function () {
        gadgets.Hub.subscribe("subscriber", function (topic, data, subscriber) {
            callback(topic, data, subscriber)
        });
    };
}

subscribe(function (topic, data, subscriber) {
    $(canvasDiv).html(gadgetUtil.getLoadingText());
    console.log(data);
    var solution = data["solution"];
    fetch(solution);
});

function onError(msg) {
    $(canvasDiv).html(gadgetUtil.getErrorText(msg));
}

function createLogList(templateName, templateData){
    return "<ul id="+templateName+" class="+templateName+"><li class='date'>"+templateData+"</li></ul>";
}
