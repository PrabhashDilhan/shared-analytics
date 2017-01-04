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
var graph_idd;
var filteredTime;

function initialize() {
    $(canvasDiv).html(gadgetUtil.getCustemText("No content to display","Please click on an error category from the above" +
        " chart to view the log events."));
    nanoScrollerSelector.nanoScroller();
}

$(document).ready(function () {
    initialize();
});
function fetch() {
    var queryInfo;
    var queryForSearchCount = {
        tableName: "GRAPH_TREE",
        searchParams: {
            query: "timestamps: "+ filteredTime + "",
        }
    };

    client.searchCount(queryForSearchCount, function (d) {
        if (d["status"] === "success" && d["message"] > 0) {
            var totalRecordCount = d["message"];
            queryInfo = {
                tableName: "GRAPH_TREE",
                searchParams: {
                    query: "timestamps: "+ filteredTime + "",
                    start: 0, //starting index of the matching record set
                    count: totalRecordCount //page size for pagination
                }
            };
            client.search(queryInfo, function (d) {
                var obj = JSON.parse(d["message"]);
                if (d["status"] === "success") {
                        graph_idd  = obj[0].values.graph_id;
                        var queryForSearch = {
                            tableName: "EXAMPLE",
                            searchParams: {
                                query: "graph_id: "+ graph_idd + "",
                            }
                        };
                         client.searchCount(queryForSearch, function (d) {
                             var obj = JSON.parse(d["message"]);
                             if (d["status"] === "success" && d["message"] > 0) {
                                var totalRecordCount =d["message"];
                                queryInfo = {
                                    tableName: "EXAMPLE",
                                            searchParams: {
                                                query: "graph_id: " + graph_idd + "",
                                                start:0,
                                                count:totalRecordCount
                                            }
                                };
                                 client.search(queryInfo,function(d){
                                    if(d["status"]=== "success"){
                                         iteratorCount++;
                                         var obj = JSON.parse(d["message"]);
                                         for (var i = 0; i < obj.length; i++) {
                                             receivedData.push([obj[i].values.graph_id, obj[i].values.reason, obj[i].values.rank,
                                                 '<a href="#" class="btn padding-reduce-on-grid-view" onclick= "viewFunction(\''+obj[i].values.solution+'\')"> <span class="fw-stack"> ' +
                                                 '<i class="fw fw-ring fw-stack-2x"></i> <i class="fw fw-view fw-stack-1x"></i> </span> <span class="hidden-xs">View</span> </a>']);
                                         }
                                         drawLogErrorFilteredTable();

                                    }
                                 },function(error){
                                     console.log(error);
                                     error.message = "Internal server error while data indexing.";
                                     onError(error);
                                 });
                             }else{
                                   $(canvasDiv).html(gadgetUtil.getCustemTextAndButton("There are no solutions to display",
                                    "If you want to add a new solutions please click add new solution button"));
                                    var $input = $('#addbtn');
                                   $input.appendTo('#toaddbtn');
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
            $(canvasDiv).html(gadgetUtil.getCustemText("No content to display","there are no error patterns which include this error" +
            " please try another one"));

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
        data:{
            valueBatches :{
                graph_id :graph_idd,
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
                fetch();
            }
        },function(error){
            console.log(error);
            error.message = "Internal server error while data inserting.";
            onError(error);
        });
    }
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
    filteredTime = parseInt(data["timestamp"]);
    filteredMessage = data["message"];
    isArtifact = data["type"];
    fetch();
});

function viewFunction(solution) {
    publish({
        solution: solution
    });
}

function onError(msg) {
    $(canvasDiv).html(gadgetUtil.getErrorText(msg));
}
