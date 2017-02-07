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

var prefs = new gadgets.Prefs();
var svrUrl = gadgetUtil.getGadgetSvrUrl(prefs.getString(PARAM_TYPE));
var client = new AnalyticsClient().init(null,null,svrUrl);
var fromTime;
var toTime;
var receivedData = [];
var filteredMessageArray  = [];
var filteringByField;
var nanoScrollerSelector = $(".nano");
var canvasDiv = "#canvas";
var addsolutionDiv = "#addsolution";
var addbtn = "#addbtn";
var iteratorCount = 0;
var dataTable;
var solutionIds;
var exceptionPattern;
var minedpatternarranged = [];
var solutionsarranged = [];

function initialize() {
    $(canvasDiv).html(gadgetUtil.getCustemText("No content to display","Please click on an error category from the above" +
        " chart to view the log events."));
    nanoScrollerSelector.nanoScroller();
}

$(document).ready(function () {
    initialize();
});
function fetch(arrayIndex){
    var queryForSearchCount = {
        tableName: "EXCEPTIONS_PATTERN",
        searchParams: {
            query: "exception_pattern:\""+minedpatternarranged[arrayIndex]+"\""
        }
    };
    client.searchCount(queryForSearchCount,function(d){
        if (d["status"] === "success" && d["message"]>0){
            var totalRecordCount = d["message"];
            queryInfo = {
                tableName: "EXCEPTIONS_PATTERN",
                searchParams: {
                    query: "exception_pattern:\""+minedpatternarranged[arrayIndex]+"\"",
                    start: 0, //starting index of the matching record set
                    count: totalRecordCount //page size for pagination
                }
            };
                client.search(queryInfo, function (d) {
                    var minedsolutionId = [];
                    var pattern;
                    var obj = JSON.parse(d["message"]);
                    if (d["status"] === "success"){
                        console.log(obj);
                        pattern = obj[0].values.exception_pattern;
                         receivedData.push([minedsolutionId, pattern,
                             '<a href="#" class="btn padding-reduce-on-grid-view" onclick= "viewFunction(\''+pattern+'\')"> <span class="fw-stack"> ' +
                             '<i class="fw fw-ring fw-stack-2x"></i> <i class="fw fw-view fw-stack-1x"></i> </span> <span class="hidden-xs">View</span> </a>']);
                        if(minedpatternarranged.length - 1 > arrayIndex){
                            fetch(++arrayIndex);
                        }else{
                             drawLogErrorFilteredTable();
                        }
                    }
                }, function (error) {
                    console.log(error);
                    error.message = "Internal server error while data indexing.";
                    onError(error);
                });
            }
        }, function (error) {
            console.log(error);
            error.message = "Internal server error while data indexing.";
            onError(error);
        });
}

function drawLogErrorFilteredTable() {
    try {
        $(canvasDiv).empty();
        if ( $.fn.dataTable.isDataTable( '#tblMessages' ) ) {
            dataTable.destroy();
        }
        dataTable = $("#tblMessages").DataTable({
            "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
                var index = iDisplayIndexFull +1;
                $('td:eq(0)',nRow).html(index);
                return nRow;
            },
            data: receivedData,
            order:[[2,"desc"]],
            columns: [
                { title: "No" },
                { title: "Rating" },
                { title: "View-Solution" }
            ],
            dom: '<"dataTablesTop"' +
                'f' +
                '<"dataTables_toolbar">' +
                '>' +
                'rt' +
                '<"dataTablesBottom"' +
                'lip' +
                '>'
        });
        nanoScrollerSelector[0].nanoscroller.reset();
        dataTable.on('draw', function () {
            nanoScrollerSelector[0].nanoscroller.reset();
        });
    } catch (error) {
        console.log(error);
        error.message = "Error while drawing log event chart.";
        error.status = "";
        onError(error);
    }
}
function reArrangeSolutions(minedpattern,solutions){

    var solutionsarrangedtemp = [];
    var minedpatternarrangedtemp = [];
    for(var i=0;i<solutions.length;i++){
            var tempstr = solutions[i];;
            var tempno = i;
            var ss = false;
        for(var j=i+1;j<solutions.length;j++){
            if(solutions[i]==solutions[j]){
                tempstr = solutions[i];
                tempno = j;
                if(j==solutions.length - 1){
                    ss = true;
                }
            }
        }
        if((ss && (i == solutions.length - 1))==false){
            minedpatternarrangedtemp.push(tempstr);
            solutionsarrangedtemp.push(minedpattern[tempno]);
        }
    }
    $.each(minedpatternarrangedtemp, function(i, el){
        if($.inArray(el, minedpatternarranged) === -1) minedpatternarranged.push(el);
    });
    $.each(solutionsarrangedtemp, function(i, el){
        if($.inArray(el, solutionsarranged) === -1) solutionsarranged.push(el);
    });
    console.log("dsffdffffffffffffffffffffffffffffffffffffffff")
    console.log(minedpatternarranged);
    console.log(solutionsarranged);
    fetch(0);
}

function publish(data) {
    gadgets.Hub.publish("publisher", data);
};

function subscribe(callback) {
    gadgets.HubSettings.onConnect = function () {
        gadgets.Hub.subscribe("subscriber", function (topic, data, subscriber) {
            callback(topic, data, subscriber)
        });
    };
}

subscribe(function (topic, data, subscriber) {
    $(canvasDiv).html(gadgetUtil.getLoadingText());
    var minedpatterntemp = data["minedpattern"];
    var solutionstemp = data["solutions"];
    console.log(minedpatterntemp);
    console.log(solutionstemp);
    reArrangeSolutions(minedpatterntemp,solutionstemp);
    if(minedpattern==null){
         $(canvasDiv).html(gadgetUtil.getCustemText("No content to display","Therenare not matching " +
                "pattern for above scenario"));
    }else{

    }
});

function viewFunction(patterns) {
    console.log("yyyyyyyyyyyyyyyyyyyyyyyyyyy");
    console.log(patterns);
    publish({
        pattern:patterns
    });
}

function onError(msg) {
    $(canvasDiv).html(gadgetUtil.getErrorText(msg));
}
