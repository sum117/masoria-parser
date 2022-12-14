type ParserResult = {
  scenes: Scene[];
  characters: Character[];
};

type Scene = {
  label: string;
  nextScene?: string;
  previousScene?: string;
  isEndingScene: boolean;
  dialogues: Dialogue[];
  choices?: Choice[];
  condition?: string;
};

type Dialogue = {
  character: string;
  emotion: string;
  text: string[];
};

type Choice = {
  label: string;
  targetScene: string;
};

type Character = {
  name: string;
  emotions: {
    [emotion: string]: string;
  };
};

enum Keyword {
  Scene = "scene",
  Choice = "choice",
  EndingScene = "ending scene",
  Emotion = "emotion",
  UseEmotion = "use emotion",
  Character = "character",
  CharacterBracket = "[",
}

export default function main(script: string): ParserResult {
  const scenes: Scene[] = [];
  const characters: Character[] = [];
  const lines = getLines(script);
  let currentScene: Scene | undefined;
  let currentCharacter: Character | undefined;

  while (lines.length > 0) {
    const line = lines.shift() as string;
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
        const newScene = makeScene(line);
        currentScene = submitScene(currentScene, newScene, scenes);
        break;
      case hasKeyword(Keyword.EndingScene, line, 0):
        const parsedLine = removeExtraSpaces(line)
          .split(" ")
          .slice(1)
          .join(" ");
        const newEndingScene = makeScene(parsedLine, true);
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

  return { scenes: organizeSceneRefs(scenes), characters };
}
/**
 * @function submitScene
 * @description This function handles the logic of the initial scene references, and returns the currentScene to be reassigned.
 * @param currentScene The currentScene from the loop.
 * @param newScene The new Scene.
 * @param scenes The main scenes array.
 * @returns
 */
function submitScene(
  currentScene: Scene | undefined,
  newScene: Scene,
  scenes: Scene[]
) {
  if (currentScene) {
    currentScene.nextScene = currentScene.nextScene ?? newScene.label;
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
function addDialogueText(
  line: string,
  currentScene: Scene | undefined,
  lines: string[]
) {
  const [characterBlock, text] = line.split(":");
  const characterName = characterBlock.substring(
    characterBlock.indexOf("[") + 1,
    characterBlock.indexOf("]")
  );
  const currentDialogue =
    currentScene?.dialogues[currentScene.dialogues.length - 1];
  if (currentDialogue) {
    currentDialogue.character = characterName;
    currentDialogue.text.push(text.trim());
    for (const lineToCheck of lines) {
      const trimmedLine = removeExtraSpaces(lineToCheck);
      const isKeywordInLine = Object.values(Keyword).some((key) =>
        trimmedLine.startsWith(key)
      );

      if (isKeywordInLine) {
        break;
      }

      currentDialogue.text.push(trimmedLine);
    }
  }
}

/**
 * @function addDialogueEmotion
 * @description This function creates a dialogue with emotions since emotions come before the dialogue text. Always.
 * @param line The line to parse
 * @param currentScene The current scene of the loop
 */
function addDialogueEmotion(
  line: string,
  currentScene: Scene | undefined
): void {
  const [_useKeyword, _emotionKeyword, characterName, emotionName] =
    removeExtraSpaces(line).split(" ");
  let dialogues = currentScene?.dialogues;
  const newDialogue = {
    character: characterName,
    emotion: emotionName,
    text: [],
  };
  if (dialogues) {
    dialogues.push(newDialogue);
  } else {
    dialogues = [newDialogue];
  }
}

/**
 * @function removeExtraSpaces
 * @description Removes extra spaces from a line
 * @param line The line to check for extra spaces
 * @returns The line without extra spaces
 */
function removeExtraSpaces(line = ""): string {
  return line.replace(/\s+/g, " ").trim();
}
/**
 * @function getLines
 * @description Gets an array of lines from a script without empty lines
 * @param script The script to parse
 * @returns An array of lines
 */
function getLines(script: string): string[] {
  return script.split("\n").filter((line) => line.trim().length > 0);
}

/**
 * @function isKeyword
 * @description Checks if a line starts with a keyword and if the indentation level is correct
 * @param line The line to check
 * @param keyword A keyword to check
 * @param level The indentation level of the keyword
 * @returns True if the line starts with the keyword and the indentation level is correct, false otherwise
 */
function hasKeyword(keyword: Keyword, line: string, level = 0): boolean {
  const hasKey = line.toLowerCase().trim().startsWith(keyword);
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
function hasForbiddenInline(line = ""): boolean {
  const [_instruction, text] = line.split(":");
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
function isIndentationLevelCorrect(line = "", level: number): boolean {
  const indentation = line.match(/^(\s*)/);
  if (indentation) {
    const spaces = indentation[0].length;
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
function getParameter(string: string): Record<string, string> {
  if (!string.includes("<")) {
    return { string };
  }
  const parameter = string.substring(
    string.indexOf("<") + 1,
    string.indexOf(">")
  );
  string = string.replace(`<${parameter}>`, "");

  return { string, parameter };
}

/**
 * @function makeScene
 * @description Creates a scene object from a line
 * @param line The line to parse
 * @returns {Scene} A scene object
 */
function makeScene(line: string, isEndingScene = false): Scene {
  if (hasForbiddenInline(line)) {
    throw new Error(
      "Inline instructions are forbidden in this context (scenes)!"
    );
  }

  let [_keyword, labelCondition, _pointer, pointedScene] =
    removeExtraSpaces(line).split(" ");
  labelCondition = labelCondition.replace(":", "");
  const { string: label, parameter } = getParameter(labelCondition);
  return {
    label: label,
    isEndingScene,
    condition: parameter,
    dialogues: [],
    nextScene: pointedScene ? pointedScene.replace(":", "") : undefined,
  };
}

/**
 * @function makeCharacter
 * @description Creates a character object from a line
 * @param line The line to parse
 * @returns {Character} A character object
 */
function makeCharacter(line: string): Character {
  if (hasForbiddenInline(line)) {
    throw new Error(
      "Inline instructions are forbidden in this context (characters)!"
    );
  }
  const [_keyword, name] = removeExtraSpaces(line).split(" ");
  return {
    name: name.replace(":", ""),
    emotions: {},
  };
}

/**
 * @function addChoice
 * @description Adds a choice to the current scene
 * @param line The line to parse
 * @param currentScene The current scene from the loop
 */
function addChoice(line: string, currentScene: Scene | undefined): void {
  if (!currentScene) {
    throw new Error("Choice must be inside a scene!");
  }
  const [instruction, label] = line.split(":");
  const targetScene = getParameter(instruction).parameter;
  if (!targetScene) {
    throw new Error("Choice must have a target scene!");
  }
  const choice: Choice = {
    label: label.trim(),
    targetScene,
  };
  if (currentScene.choices) {
    currentScene.choices.push(choice);
  } else {
    currentScene.choices = [choice];
  }
}

/**
 * @function addEmotion
 * @description Adds an emotion to the current character
 * @param line The line to parse
 * @param currentCharacter The current character from the loop
 */
function addEmotion(
  line: string,
  currentCharacter: Character | undefined
): void {
  if (!currentCharacter) {
    throw new Error("Emotion must be inside a character!");
  }
  const [instruction, emotionPath] = line.split(":");
  const [_keyword, emotionName] = removeExtraSpaces(instruction).split(" ");
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
function organizeSceneRefs(scenes: Scene[]): Scene[] {
  const references = scenes.reduce((acc, scene) => {
    if (scene.choices) {
      acc.push({
        parent: scene.label,
        choices: scene.choices.map((choice) => choice.targetScene),
      });
    }
    return acc;
  }, [] as { parent: string; choices: string[] }[]);

  return scenes.map((scene) => {
    const reference = references.find((ref) =>
      ref.choices.includes(scene.label)
    );
    scene.previousScene = reference ? reference.parent : scene.previousScene;
    if (scene.choices) {
      scene.nextScene = undefined;
    }
    return scene;
  });
}
