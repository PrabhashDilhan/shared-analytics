/*
 * Copyright (c) 2015, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * This Javascript module exposes all the data analytics API as Javascript methods. This can be used
 * to develop custom webapps which use Analytics API.
 */


var DATA_TYPE_JSON = "json";
var CONTENT_TYPE_JSON = "application/json";
var AUTHORIZATION_HEADER = "Authorization";

function AnalyticsClientToPutRecords() {

    var TYPE_LIST_TABLES = 9;
    var TYPE_PUT_RECORDS_TO_TABLE = 12;
    var HTTP_GET = "GET";
    var HTTP_POST = "POST";
    var RESPONSE_ELEMENT = "responseJSON";
    this.serverUrl = "";



    /**
     * Lists all the tables.
     * @param callback The callback functions which has one argument containing the response data.
     * @param error The callback function which has one argument which contains the error if any
     */
    this.listTables = function (callback, error) {
        jQuery.ajax({
                        url: this.serverUrl + "?type=" + TYPE_LIST_TABLES,
                        type: HTTP_GET,
                        success: function (data) {
                            callback(data);
                        },
                        error: function (msg) {
                            error(msg[RESPONSE_ELEMENT]);
                        }
                    });
    };

    /**
     * Gets the records given the table name and the matching primary key values batch.
     * @param recordInfo Information containing the table name, primary key values batch and columns interested.
     *  e.g. recordInfo = {
     *          tableName : "TEST",
     *          valueBatches : [
     *              {
     *               column1 : "value1",
     *               column2 : "value2"
     *              },
     *              {
     *              column1 : "anotherValue1",
     *              column2 : "anotherValue2"
     *              }
     *          ],
     *          columns : [ "column1"]
     *      }
     * @param callback The callback function which has one argument containing the response message.
     * @param error The callback function which has one argument which contains the error if any
     */
    this.getWithKeyValues = function (recordInfo, callback, error) {
        jQuery.ajax({
                        url: this.serverUrl + "?type=" + TYPE_GET_WITH_KEY_VALUES + "&tableName=" + recordInfo["tableName"],
                        data: JSON.stringify({
                                                valueBatches : recordInfo["valueBatches"],
                                                columns : recordInfo["columns"]
                                             }),
                        type: HTTP_POST,
                        success: function (data) {
                            callback(data);
                        },
                        error: function (msg) {
                            error(msg[RESPONSE_ELEMENT]);
                        }
                    });
    };

    /**
     * Insert records to a specific table.
     * @param recordsInfo Records information containing the records array.
     *  e.g. recordsInfo = {
     *          tableName : "TEST",
     *          records : [
     *              {
     *                  values : {
     *                      "field1" : "value1",
     *                      "field2" : "value2"
     *                  }
     *              },
     *              {
     *                  values : {
     *                      "field1" : "value1",
     *                      "facetField" : [ "category", "subCategory", "subSubCategory" ]
     *                  }
     *              }
     *          ]
     * @param callback The callback function which has one argument containing the array of
     * ids of records inserted.
     * @param error The callback function which has one argument which contains the error if any
     */
    this.insertRecordsToTable = function (recordsInfo, callback, error) {
        jQuery.ajax({
                        url: this.serverUrl + "?type=" + TYPE_PUT_RECORDS_TO_TABLE + "&tableName=" + recordsInfo["tableName"],
                        data: JSON.stringify(recordsInfo["data"]),
                        type: HTTP_POST,
                        success: function (data) {
                            callback(data);
                        },
                        error: function (msg) {
                            error(msg);
                        }
                    });
    };
    }

/**
 * Construct an AnalyticsClient object given the username, password and serverUrl.
 * @param username the username
 * @param password the password
 * @param svrUrl the server url
 * @returns {AnalyticsClient} AnalyticsClient object
 */
AnalyticsClientToPutRecords.prototype.init = function (username, password, svrUrl) {
    if (svrUrl == null) {
        this.serverUrl = "https://localhost:9443/portal/controllers/apis/analyticstoputrecords.jag";
    } else {
        this.serverUrl = svrUrl;
    }
    var authHeader = generateBasicAuthHeader(username, password);
    jQuery.ajaxSetup({
                         dataType: DATA_TYPE_JSON,
                         contentType: CONTENT_TYPE_JSON,
                         beforeSend: function (request) {
                             if (authHeader != null) {
                                 request.setRequestHeader(AUTHORIZATION_HEADER, authHeader);
                             }
                         }
                     });
    return this;
};

function generateBasicAuthHeader(username, password) {
    if (username != null && password != null) {
        return "Basic " + btoa(username + ":" + password);
    }
    return null;
}
