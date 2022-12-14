import parser from "./index";
import { readFileSync, writeFileSync } from "fs";
const fileName = "syntaxExample";
const readScript = readFileSync(`scripts/${fileName}.masoria`, "utf-8");
const result = parser(readScript);
writeFileSync(`output/${fileName}.json`, JSON.stringify(result));
