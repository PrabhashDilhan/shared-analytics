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
var putrecordclient = new AnalyticsClientToPutRecords().init(null,null,"https://localhost:9443/admin/modules/la/put-record.jag");
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

function initialize() {
    $(canvasDiv).html(gadgetUtil.getCustemText("No content to display","Please click on an error category from the above" +
        " chart to view the log events."));
    nanoScrollerSelector.nanoScroller();
}

$(document).ready(function () {
    initialize();
});
function fetch(arrayIndex){
    if(typeof solutionIds[0] != 'undefined'){
        var queryInfo;
        var queryForSearchCount = {
            tableName: "SOLUTIONS",
            searchParams: {
                query: "solution_id: "+ solutionIds[arrayIndex] + "",
            }
        };

        client.searchCount(queryForSearchCount, function (d) {
            if (d["status"] === "success" && d["message"] > 0) {
                var totalRecordCount = d["message"];
                queryInfo = {
                    tableName: "SOLUTIONS",
                    searchParams: {
                        query: "solution_id: "+ solutionIds[arrayIndex] + "",
                        start: 0, //starting index of the matching record set
                        count: totalRecordCount //page size for pagination
                    }
                };
                client.search(queryInfo, function (d) {
                    var obj = JSON.parse(d["message"]);
                    if (d["status"] === "success"){
                         receivedData.push([obj[0].values.solution_id, obj[0].values.reason, obj[0].values.rank,
                             '<a href="#" class="btn padding-reduce-on-grid-view" onclick= "viewFunction(\''+obj[i].values.solution+'\')"> <span class="fw-stack"> ' +
                             '<i class="fw fw-ring fw-stack-2x"></i> <i class="fw fw-view fw-stack-1x"></i> </span> <span class="hidden-xs">View</span> </a>']);
                        if(classNames.length - 1 > arrayIndex){
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
    }else{
       $(canvasDiv).html(gadgetUtil.getCustemTextAndButton("There are no solutions to display",
        "If you want to add a new solutions please click add new solution button"));
       $('#toaddbtn').click(function(){
            hidediv('canvasForDataTable','solutionSave');
       });
    }
}

function drawLogErrorFilteredTable() {
    try {
        $(canvasDiv).empty();
        if ( $.fn.dataTable.isDataTable( '#tblMessages' ) ) {
            dataTable.destroy();
        }
        dataTable = $("#tblMessages").DataTable({
            data: receivedData,
            order:[[2,"desc"]],
            columns: [
                { title: "No" },
                { title: "Reason" },
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

function hidediv(table, sol){
            console.log("fgfdsgfdsgfd");
    $("#message").empty();
    $("#reason").empty();
    if(table==="canvasForDataTable" && sol==="solutionSave"){
        if($("#canvasForDataTable").css("display")!="none"){
            $("#solutionSave").show().siblings("div").hide();
        }
    }else{
        console.log($('#canvasForDataTable').is(':empty'));
        if($('#canvas').is(':empty')){
           $(canvasDiv).html(gadgetUtil.getCustemTextAndButton("There are no solutions to display",
            "If you want to add a new solutions please click add new solution button"));
            var $input = $('#addbtn');
           $input.appendTo('#toaddbtn');
        }else{
            if($("#solutionSave").css("display")!="none"){
                $("#canvasForDataTable").show().siblings("div").hide();
            }
        }
    }
}
function putRecord(){
    if(!$('#message').val()|| !$('#reason').val()){
        if(!$('#reason').val()){
            $('#reason').html('this field is mandatory');
        }
        if(!$('#message').val()){
            $('#message').html('this field is mandatory');
        }
    }
    else{
        recordsInfo = {
        tableName:"SOLUTIONS",
        data:{
            valueBatches :{
                solution_id:guid(),
                solution :$('#message').val(),
                reason :$('#reason').val(),
                rank:"0"
            }
        }
        }
        putrecordclient.insertRecordsToTable(recordsInfo,function(d){
            if(d["status"]=== "success"){
                alert("Succesfully added data to the table");
                if($("#solutionSave").css("display")!="none"){
                    $("#canvasForDataTable").show().siblings("div").hide();
                }
                fetch(0);
            }
        },function(error){
            console.log(error);
            error.message = "Internal server error while data inserting.";
            onError(error);
        });
    }
}
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
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
    solutionIds = data;
    fetch(0);
});

function viewFunction(solution) {
    publish({
        solution: solution
    });
}

function onError(msg) {
    $(canvasDiv).html(gadgetUtil.getErrorText(msg));
}
