"use strict";
exports.__esModule = true;
var index_1 = require("./index");
var fs_1 = require("fs");
var fileName = "syntaxExample";
var readScript = (0, fs_1.readFileSync)("scripts/".concat(fileName, ".masoria"), "utf-8");
var result = (0, index_1["default"])(readScript);
(0, fs_1.writeFileSync)("output/".concat(fileName, ".json"), JSON.stringify(result));
