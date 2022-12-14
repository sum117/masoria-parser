"use strict";
exports.__esModule = true;
var Keyword;
(function (Keyword) {
    Keyword["Scene"] = "scene";
    Keyword["Choice"] = "choice";
    Keyword["EndingScene"] = "ending scene";
    Keyword["Emotion"] = "emotion";
    Keyword["UseEmotion"] = "use emotion";
    Keyword["Character"] = "character";
    Keyword["CharacterBracket"] = "[";
})(Keyword || (Keyword = {}));
function main(script) {
    var scenes = [];
    var characters = [];
    var lines = getLines(script);
    var currentScene;
    var currentCharacter;
    while (lines.length > 0) {
        var line = lines.shift();
        switch (true) {
            case hasKeyword(Keyword.Character, line, 0):
                if (currentCharacter) {
                    characters.push(currentCharacter);
                }
                currentCharacter = makeCharacter(line);
                break;
            case hasKeyword(Keyword.Emotion, line, 1):
                addEmotion(line, currentCharacter);
                break;
            case hasKeyword(Keyword.Scene, line, 0):
                var newScene = makeScene(line);
                currentScene = submitScene(currentScene, newScene, scenes);
                break;
            case hasKeyword(Keyword.EndingScene, line, 0):
                var parsedLine = removeExtraSpaces(line)
                    .split(" ")
                    .slice(1)
                    .join(" ");
                var newEndingScene = makeScene(parsedLine, true);
                currentScene = submitScene(currentScene, newEndingScene, scenes);
                break;
            case hasKeyword(Keyword.Choice, line, 1):
                addChoice(line, currentScene);
                break;
            case hasKeyword(Keyword.UseEmotion, line, 1):
                addDialogueEmotion(line, currentScene);
                break;
            case hasKeyword(Keyword.CharacterBracket, line, 1):
                addDialogueText(line, currentScene, lines);
                break;
        }
    }
    if (currentScene) {
        scenes.push(currentScene);
    }
    if (currentCharacter) {
        characters.push(currentCharacter);
    }
    return { scenes: organizeSceneRefs(scenes), characters: characters };
}
exports["default"] = main;
/**
 * @function submitScene
 * @description This function handles the logic of the initial scene references, and returns the currentScene to be reassigned.
 * @param currentScene The currentScene from the loop.
 * @param newScene The new Scene.
 * @param scenes The main scenes array.
 * @returns
 */
function submitScene(currentScene, newScene, scenes) {
    var _a;
    if (currentScene) {
        currentScene.nextScene = (_a = currentScene.nextScene) !== null && _a !== void 0 ? _a : newScene.label;
        newScene.previousScene = currentScene.label;
        scenes.push(currentScene);
    }
    currentScene = newScene;
    return currentScene;
}
/**
 * @function addDialogueText
 * @description This function runs an internal loop inside the while loop to check for additional lines after the character block dialogue.
 * @param line The line to parse
 * @param currentScene The current scene from the loop
 * @param lines The remainder of the lines to check for additional dialogue (without characte blocks)
 */
function addDialogueText(line, currentScene, lines) {
    var _a = line.split(":"), characterBlock = _a[0], text = _a[1];
    var characterName = characterBlock.substring(characterBlock.indexOf("[") + 1, characterBlock.indexOf("]"));
    var currentDialogue = currentScene === null || currentScene === void 0 ? void 0 : currentScene.dialogues[currentScene.dialogues.length - 1];
    if (currentDialogue) {
        currentDialogue.character = characterName;
        currentDialogue.text.push(text.trim());
        var _loop_1 = function (lineToCheck) {
            var trimmedLine = removeExtraSpaces(lineToCheck);
            var isKeywordInLine = Object.values(Keyword).some(function (key) {
                return trimmedLine.startsWith(key);
            });
            if (isKeywordInLine) {
                return "break";
            }
            currentDialogue.text.push(trimmedLine);
        };
        for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
            var lineToCheck = lines_1[_i];
            var state_1 = _loop_1(lineToCheck);
            if (state_1 === "break")
                break;
        }
    }
}
/**
 * @function addDialogueEmotion
 * @description This function creates a dialogue with emotions since emotions come before the dialogue text. Always.
 * @param line The line to parse
 * @param currentScene The current scene of the loop
 */
function addDialogueEmotion(line, currentScene) {
    var _a = removeExtraSpaces(line).split(" "), _useKeyword = _a[0], _emotionKeyword = _a[1], characterName = _a[2], emotionName = _a[3];
    var dialogues = currentScene === null || currentScene === void 0 ? void 0 : currentScene.dialogues;
    var newDialogue = {
        character: characterName,
        emotion: emotionName,
        text: []
    };
    if (dialogues) {
        dialogues.push(newDialogue);
    }
    else {
        dialogues = [newDialogue];
    }
}
/**
 * @function removeExtraSpaces
 * @description Removes extra spaces from a line
 * @param line The line to check for extra spaces
 * @returns The line without extra spaces
 */
function removeExtraSpaces(line) {
    if (line === void 0) { line = ""; }
    return line.replace(/\s+/g, " ").trim();
}
/**
 * @function getLines
 * @description Gets an array of lines from a script without empty lines
 * @param script The script to parse
 * @returns An array of lines
 */
function getLines(script) {
    return script.split("\n").filter(function (line) { return line.trim().length > 0; });
}
/**
 * @function isKeyword
 * @description Checks if a line starts with a keyword and if the indentation level is correct
 * @param line The line to check
 * @param keyword A keyword to check
 * @param level The indentation level of the keyword
 * @returns True if the line starts with the keyword and the indentation level is correct, false otherwise
 */
function hasKeyword(keyword, line, level) {
    if (level === void 0) { level = 0; }
    var hasKey = line.toLowerCase().trim().startsWith(keyword);
    if (hasKey) {
        return isIndentationLevelCorrect(line, level);
    }
    return false;
}
/**
 * @function hasForbiddenInline
 * @description Checks if a line has an inline instruction (a colon followed by text)
 * @param line Line to check
 * @returns True if the line has an inline instruction, false otherwise
 */
function hasForbiddenInline(line) {
    if (line === void 0) { line = ""; }
    var _a = line.split(":"), _instruction = _a[0], text = _a[1];
    if (text.trim().length > 0) {
        return true;
    }
    return false;
}
/**
 * @function isIndentationLevelCorrect
 * @description Checks if the indentation level of a line is correct
 * @param line The line to check the indentation level of
 * @param level The level of indentation. Every level is 4 spaces
 * @returns True if the indentation level is correct, false otherwise
 */
function isIndentationLevelCorrect(line, level) {
    if (line === void 0) { line = ""; }
    var indentation = line.match(/^(\s*)/);
    if (indentation) {
        var spaces = indentation[0].length;
        return spaces % 2 === 0 && spaces / 4 === level;
    }
    return false;
}
/**
 * @function getParameter
 * @description Separates a choice keyword or a scene name from their parameters (if any)
 * @param string the line to parse
 * @returns the string without the parameter and the parameter
 */
function getParameter(string) {
    if (!string.includes("<")) {
        return { string: string };
    }
    var parameter = string.substring(string.indexOf("<") + 1, string.indexOf(">"));
    string = string.replace("<".concat(parameter, ">"), "");
    return { string: string, parameter: parameter };
}
/**
 * @function makeScene
 * @description Creates a scene object from a line
 * @param line The line to parse
 * @returns {Scene} A scene object
 */
function makeScene(line, isEndingScene) {
    if (isEndingScene === void 0) { isEndingScene = false; }
    if (hasForbiddenInline(line)) {
        throw new Error("Inline instructions are forbidden in this context (scenes)!");
    }
    var _a = removeExtraSpaces(line).split(" "), _keyword = _a[0], labelCondition = _a[1], _pointer = _a[2], pointedScene = _a[3];
    labelCondition = labelCondition.replace(":", "");
    var _b = getParameter(labelCondition), label = _b.string, parameter = _b.parameter;
    return {
        label: label,
        isEndingScene: isEndingScene,
        condition: parameter,
        dialogues: [],
        nextScene: pointedScene ? pointedScene.replace(":", "") : undefined
    };
}
/**
 * @function makeCharacter
 * @description Creates a character object from a line
 * @param line The line to parse
 * @returns {Character} A character object
 */
function makeCharacter(line) {
    if (hasForbiddenInline(line)) {
        throw new Error("Inline instructions are forbidden in this context (characters)!");
    }
    var _a = removeExtraSpaces(line).split(" "), _keyword = _a[0], name = _a[1];
    return {
        name: name.replace(":", ""),
        emotions: {}
    };
}
/**
 * @function addChoice
 * @description Adds a choice to the current scene
 * @param line The line to parse
 * @param currentScene The current scene from the loop
 */
function addChoice(line, currentScene) {
    if (!currentScene) {
        throw new Error("Choice must be inside a scene!");
    }
    var _a = line.split(":"), instruction = _a[0], label = _a[1];
    var targetScene = getParameter(instruction).parameter;
    if (!targetScene) {
        throw new Error("Choice must have a target scene!");
    }
    var choice = {
        label: label.trim(),
        targetScene: targetScene
    };
    if (currentScene.choices) {
        currentScene.choices.push(choice);
    }
    else {
        currentScene.choices = [choice];
    }
}
/**
 * @function addEmotion
 * @description Adds an emotion to the current character
 * @param line The line to parse
 * @param currentCharacter The current character from the loop
 */
function addEmotion(line, currentCharacter) {
    if (!currentCharacter) {
        throw new Error("Emotion must be inside a character!");
    }
    var _a = line.split(":"), instruction = _a[0], emotionPath = _a[1];
    var _b = removeExtraSpaces(instruction).split(" "), _keyword = _b[0], emotionName = _b[1];
    if (!emotionPath) {
        throw new Error("An emotion declaration must have a path!");
    }
    currentCharacter.emotions[emotionName] = emotionPath.trim();
}
/**
 * @function organizeSceneRefs
 * @description Sets the previousScene property of each scene to the label of the choice that points to it
 * @param scenes The scenes to organize
 * @returns The scenes with the previousScene property set correctly
 */
function organizeSceneRefs(scenes) {
    var references = scenes.reduce(function (acc, scene) {
        if (scene.choices) {
            acc.push({
                parent: scene.label,
                choices: scene.choices.map(function (choice) { return choice.targetScene; })
            });
        }
        return acc;
    }, []);
    return scenes.map(function (scene) {
        var reference = references.find(function (ref) {
            return ref.choices.includes(scene.label);
        });
        scene.previousScene = reference ? reference.parent : scene.previousScene;
        if (scene.choices) {
            scene.nextScene = undefined;
        }
        return scene;
    });
}
