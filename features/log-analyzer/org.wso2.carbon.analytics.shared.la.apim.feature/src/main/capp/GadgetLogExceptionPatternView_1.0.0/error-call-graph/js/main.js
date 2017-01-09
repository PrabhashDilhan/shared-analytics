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

var from = gadgetUtil.timeFrom();
var to = gadgetUtil.timeTo();
var receivedData = [];
var filteredMessage;
var filteredTime;
var nanoScrollerSelector = $(".nano");
var canvasDiv = "#canvas";
var prefs = new gadgets.Prefs();
var svrUrl = gadgetUtil.getGadgetSvrUrl(prefs.getString(PARAM_TYPE));
var client = new AnalyticsClient().init(null,null,svrUrl);
var isArtifact = false;
var pubdata = [];
var classNames = [];
var message = [];
var strPattern = "";
var classNamesIds = [];
var messageIds = [];

function initialize() {
    $(canvasDiv).html(gadgetUtil.getCustemText("No content to display","Please click on a View button from the above table" +
        " to access all the log events in the time period surrounding an event."));
    nanoScrollerSelector.nanoScroller();
}

$(document).ready(function () {
    initialize();
});
function fetch() {
    receivedData.length = 0;
    var queryInfo;
    var queryForSearchCount = {
        tableName: "LOGANALYZER",
        searchParams: {
            query: "_eventTimeStamp: [" + from + " TO " + to + "]",
        }
    };

    client.searchCount(queryForSearchCount, function (d) {
        if (d["status"] === "success") {
            var totalRecordCount = d["message"];
            queryInfo = {
                tableName: "LOGANALYZER",
                searchParams: {
                    query: "_eventTimeStamp: [" + from + " TO " + to + "]",
                    start: 0, //starting index of the matching record set
                    count: totalRecordCount //page size for pagination
                }
            };
            client.search(queryInfo, function (d) {
                var obj = JSON.parse(d["message"]);
                if (d["status"] === "success" ) {
                    for (var i = 0; i < obj.length; i++) {
                        if(obj[i].values._level === "ERROR" || obj[i].values._level === "WARN"){
                            receivedData.push([{
                                level: obj[i].values._level,
                                class: obj[i].values._class,
                                content: obj[i].values._content,
                                timestamp: parseInt(obj[i].values._eventTimeStamp)
                            }]);
                            classNames.push(obj[i].values._class);
                            message.push(obj[i].values._content);
                        }
                    }
                    classNames = classNames.unique();
                    message = message.unique();
                    fetchClassIds(0);
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
function fetchClassIds(arrayIndex){
    var str = "\""+classNames[arrayIndex]+"\"";
    var queryForSearchCount = {
        tableName: "EXCEPTION_CLASS_NAMES",
        searchParams: {
            query: "class_name:" + str + ""
        }
    };
    client.searchCount(queryForSearchCount,function(d){
        if (d["status"] === "success" && d["message"]>0) {
            var totalRecordCount = d["message"];
            queryInfo = {
                tableName: "EXCEPTION_CLASS_NAMES",
                searchParams: {
                    query: "class_name:" + str + "",
                    start: 0, //starting index of the matching record set
                    count: totalRecordCount //page size for pagination
                }
            };
            client.search(queryInfo,function(d){
                if (d["status"] === "success") {
                    var obj = JSON.parse(d["message"]);
                    classNamesIds.push([{
                        id: obj[0].values.id,
                        class_name: obj[0].values.class_name
                    }]);
                    if(classNames.length - 1 > arrayIndex){
                        fetchClassIds(++arrayIndex);
                    }else{
                        fetchMessageIds(0);
                    }
                }
            },function(error){
                console.log(error);
                error.message = "Internal server error while data indexing.";
                onError(error);
            });
        }
    },function(error){
        console.log(error);
        error.message = "Internal server error while data indexing.";
        onError(error);
    });
}
function fetchMessageIds(arrayIndex){
    var str = "\""+message[arrayIndex]+"\"";
    var queryForSearchCount = {
        tableName: "EXCEPTION_MESSAGE_TABLE",
        searchParams: {
            query: "message:" + str + ""
        }
    };
    client.searchCount(queryForSearchCount,function(d){
        if (d["status"] === "success" && d["message"]>0) {
            var totalRecordCount = d["message"];
            queryInfo = {
                tableName: "EXCEPTION_MESSAGE_TABLE",
                searchParams: {
                    query: "message:" + str + "",
                    start: 0, //starting index of the matching record set
                    count: totalRecordCount //page size for pagination
                }
            };
            client.search(queryInfo,function(d){
                if (d["status"] === "success") {
                    var obj = JSON.parse(d["message"]);
                    messageIds.push([{
                        id: obj[0].values.id,
                        message: obj[0].values.message
                    }]);
                    if(message.length - 1 > arrayIndex){
                        fetchMessageIds(++arrayIndex);
                    }else{
                        patternCreating(classNamesIds,messageIds);
                    }
                }
            },function(error){
                console.log(error);
                error.message = "Internal server error while data indexing.";
                onError(error);
            });
        }
    },function(error){
        console.log(error);
        error.message = "Internal server error while data indexing.";
        onError(error);
    });
}

function patternCreating(classNameArray , messageArray){
    for(var i = 0; i<receivedData.length; i++){
        for(var j = 0; j<classNameArray.length; j++){
            if(receivedData[i][0].class === classNameArray[j][0].class_name){
                strPattern = strPattern.concat(classNameArray[j][0].id) + ":";
                break;
            }
        }
        for(var k = 0; k<messageArray.length; k++){
            if(receivedData[i][0].content === messageArray[k][0].message){
                if(i === receivedData.length - 1){
                    strPattern = strPattern.concat(messageArray[k][0].id);
                }else{
                    strPattern = strPattern.concat(messageArray[k][0].id) + "-";
                    break;
                }
            }
        }
    }
    patternMatching(strPattern);
}

function patternMatching(exceptionPattern){
    var queryForSearchCount = {
        tableName: "EXCEPTIONS_PATTERNS",
        searchParams: {
            query: "exception_pattern:\""+exceptionPattern+"\""
        }
    };
    client.searchCount(queryForSearchCount,function(d){
        if (d["status"] === "success" && d["message"]>0){
            var totalRecordCount = d["message"];
            queryInfo = {
                tableName: "EXCEPTIONS_PATTERNS",
                searchParams: {
                    query: "exception_pattern:\""+exceptionPattern+"\"",
                    start: 0, //starting index of the matching record set
                    count: totalRecordCount //page size for pagination
                }
            };
            client.search(queryInfo,function(d){
                if (d["status"] === "success") {
                    var obj = JSON.parse(d["message"]);
                    var solutionIds = [];
                    for (var i = 0; i < obj.length; i++) {
                        solutionIds.push(obj[i].values.solution_id);
                    }
                    drawErrorCallGraph();
                    var publishData = {
                        pattern :exceptionPattern,
                        ids:solutionIds
                    }
                    publish(publishData);
                }
            },function(error){
                console.log(error);
                error.message = "Internal server error while data indexing.";
                onError(error);
            });
        }
        else{
            console.log("not found exact match.try to use graphx to sub pattern matching");
            $(canvasDiv).html(gadgetUtil.getCustemText("No content to display","Can't Find exact match ,try to use graphx "));
        }
    },function(error){
        console.log(error);
        error.message = "Internal server error while data indexing.";
        onError(error);
    });
}

Array.prototype.contains = function(v) {
    for(var i = 0; i < this.length; i++) {
        if(this[i] === v) return true;
    }
    return false;
};

Array.prototype.unique = function() {
    var arr = [];
    for(var i = 0; i < this.length; i++) {
        if(!arr.contains(this[i])) {
            arr.push(this[i]);
        }
    }
    return arr;
}

function drawErrorCallGraph(){
    $(canvasDiv).empty();
    var nodess = [];
    var edgess = [];

    for(var i=0; i<receivedData.length; i++){
        if(receivedData[i][0].level === "ERROR" || receivedData[i][0].level === "WARN"){
            nodess.push({
                name:receivedData[i][0].class,
                time:receivedData[i][0].date,
                level:receivedData[i][0].level,
                timestamp:receivedData[i][0].timestamp
            });
        }

    }
   /* nodess.sort(function(a, b){
        var keyA = new Date(a.time),
            keyB = new Date(b.time);
        // Compare the 2 dates
        if(keyA < keyB) return -1;
        if(keyA > keyB) return 1;
        return 0;
    });*/
   for( var j=0; j< nodess.length-1; j++){
              edgess.push({
                  source:j,
                  target:j+1
               });
    }
        var w = (window.innerWidth)-20;
        var h = (window.innerHeight)-20;
        var linkDistance=150;

        var colors = d3.scale.category10();
        var svg = d3.select("#canvas").append("svg").attr({"width":w,"height":h});

        var force = d3.layout.force()
            .nodes(nodess)
            .links(edgess)
            .size([w,h])
            .linkDistance([linkDistance])
            .charge([-1000])
            .theta(0.1)
            .gravity(0.05)
            .start();



        var edges = svg.selectAll("line")
          .data(edgess)
          .enter()
          .append("line")
          .attr("id",function(d,i) {return 'edge'+i})
          .attr('marker-end','url(#arrowhead)')
          .style("stroke","black")
          .style("pointer-events", "none");

        var nodes = svg.selectAll("circle")
          .data(nodess)
          .enter()
          .append("circle")
          .attr({"r":20})
          .style("fill",function(d){
            if(d.level==="WARN"){
                if(d.messagefordisplay === filteredMessage && d.timestamp === filteredTime){
                    return "#EECA5A";
                }
                else{
                    return "#FCF9D6"
                }
            }
            else{
                if(d.messagefordisplay === filteredMessage && d.timestamp === filteredTime){
                    return "#D9483D";

                }
                else{
                    return "#FCD7D6"
                }
            }
          })
          .style("stroke",function(d){
            if(d.level==="WARN"){
                return "#EECA5A";
            }
            else{
                return "#D9483D";
            }
          })
          .style("stroke-width",function(d){
                return 4;
          })
          .on("mouseover", function(d)
           {
               var lb = d3.selectAll(".nodelabel");
               d3.select(lb[0][d.index]).style("visibility","hidden");
               var exlb = d3.selectAll(".exnodelabel");
               d3.select(exlb[0][d.index]).style("visibility","visible");
           })
          .on("mouseout", function(d)
           {
               var lb = d3.selectAll(".nodelabel");
               d3.select(lb[0][d.index]).style("visibility","visible");
               var exlb = d3.selectAll(".exnodelabel");
               d3.select(exlb[0][d.index]).style("visibility","hidden");
           })
          .call(force.drag);

        var nodelabels = svg.selectAll(".nodelabel")
           .data(nodess)
           .enter()
           .append("text")
           .attr({"x":function(d){return d.x = Math.max(20, Math.min(w - 20, d.x));},
                  "y":function(d){return d.y = Math.max(20, Math.min(w - 20, d.y));},
                  "class":"nodelabel",
                  "stroke":"black"})
           .text(function(d){
                var wordarray = d.name.split(/[.]/);
                return wordarray[wordarray.length-1];
           })
           .style("visibility", "visible");

        var exnodelabels = svg.selectAll(".exnodelabel")
           .data(nodess)
           .enter()
           .append("text")
           .attr({"x":function(d){return d.x = Math.max(20, Math.min(w - 20, d.x));},
                  "y":function(d){return d.y = Math.max(20, Math.min(w - 20, d.y));},
                  "class":"exnodelabel",
                  "stroke":"black"})
           .text(function(d){
                return d.name+"   /"+d.time;
           })
           .style("visibility", "hidden");

       var edgepaths = svg.selectAll(".edgepath")
            .data(edgess)
            .enter()
            .append('path')
            .attr({'d': function(d) {return 'M '+d.source.x+' '+d.source.y+' L '+ d.target.x +' '+d.target.y},
                   'class':'edgepath',
                   'fill-opacity':0,
                   'stroke-opacity':0,
                   'fill':'black',
                   'stroke':'black',
                   'id':function(d,i) {return 'edgepath'+i}})
            .style("pointer-events", "none");

        svg.append('defs').append('marker')
            .attr({'id':'arrowhead',
                   'viewBox':'-0 -5 10 10',
                   'refX':30,
                   'refY':0,
                   //'markerUnits':'strokeWidth',
                   'orient':'auto',
                   'markerWidth':10,
                   'markerHeight':10,
                   'xoverflow':'visible'})
            .append('svg:path')
                .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
                .attr('fill', '#black')
                .attr('stroke','#black');


        force.on("tick", function(){

            edges.attr({"x1": function(d){return d.source.x = Math.max(20, Math.min(w - 20, d.source.x));},
                        "y1": function(d){return d.source.y = Math.max(20, Math.min(h - 20, d.source.y));},
                        "x2": function(d){return d.target.x = Math.max(20, Math.min(w - 20, d.target.x));},
                        "y2": function(d){return d.target.y = Math.max(20, Math.min(h - 20, d.target.y));}
            });

            nodes.attr("cx", function(d) { return d.x = Math.max(20, Math.min(w - 20, d.x)); })
                 .attr("cy", function(d) { return d.y = Math.max(20, Math.min(h - 20, d.y)); });

            nodelabels.attr("x", function(d) { return d.x = Math.max(20, Math.min(w - 20, d.x)); })
                      .attr("y", function(d) { return d.y = Math.max(20, Math.min(h - 20, d.y)); });

            exnodelabels.attr("x", function(d) { return d.x = Math.max(20, Math.min(w - 20, d.x)); })
                      .attr("y", function(d) { return d.y = Math.max(20, Math.min(h - 20, d.y)); });

            edgepaths.attr('d', function(d) { var path='M '+d.source.x+' '+d.source.y+' L '+ d.target.x +' '+d.target.y;
                                               return path});
        });
        nanoScrollerSelector[0].nanoscroller.reset();
}

function subscribe(callback) {
    gadgets.HubSettings.onConnect = function () {
        gadgets.Hub.subscribe("subscriber", function (topic, data, subscriber) {
            callback(topic, data, subscriber)
        });
    };
}
function publish(data) {
    gadgets.Hub.publish("publisher", data);
}

subscribe(function (topic, data, subscriber) {
    $(canvasDiv).html(gadgetUtil.getLoadingText());
    filteredTime = parseInt(data["timestamp"]);;
    filteredMessage = data["message"];
    isArtifact = data["type"];
    var fromDate = filteredTime - (gadgetConfig.timeDomain);
    var toDate = filteredTime + (gadgetConfig.timeDomain);
    from = fromDate;
    to = toDate;
    fetch();
});



function onError(msg) {
    $(canvasDiv).html(gadgetUtil.getErrorText(msg));
}