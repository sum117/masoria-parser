import { readFileSync } from 'fs';

function parseScript(script: string) {
  const lines = script.split('\n');

  const characters: any = {};
  const scenes: Scene[] = [];
  const emotions: Emotion[] = [];
  const dialogues: Dialogue[] = [];
  const choices: Choice[][] = [];

  const emptyScene: Scene = {
    type: null,
    label: null,
    id: 0,
    nextSceneId: 0,
  };
  const emptyEmotion = {
    sceneId: 0,
    character: null,
    emotionName: null,
  };

  const emptyDialogue = {
    character: null,
    text: null,
    sceneId: 0,
  };

  let currentScene: Scene = { ...emptyScene };
  let currentEmotion: Emotion = { ...emptyEmotion };
  let currentText: Dialogue = { ...emptyDialogue };
  let currentChoices: Choice[] = [];

  let currentCharName = '';
  let fullSpeech = '';
  let sceneIndex = 0;
  for (let index = 0; index < lines.length; index++) {
    const trimmedLine = lines[index].trim();
    const isComment = trimmedLine.startsWith('#');
    if (isComment) {
      continue;
    }

    // Boolean flags
    const isCharDeclaration = trimmedLine.startsWith('character'),
      isSceneDeclaration = trimmedLine.startsWith('scene'),
      isChoiceDeclaration = trimmedLine.startsWith('choice'),
      isEndingDeclaration = trimmedLine.startsWith('ending'),
      isEmotionDeclaration = trimmedLine.startsWith('emotion'),
      isUseEmotionDeclaration = trimmedLine.startsWith('use emotion'),
      isCharacterSpeech = trimmedLine.startsWith('['),
      isIndentationCorrect = (level: number) =>
        lines[index].match(/(\s+)/g)?.[0].length === level;

    const errorMessages = {
      indentation: `Invalid indentation in line ${index}:
      ${JSON.stringify(trimmedLine)}`,
    };

    switch (true) {
      case isCharDeclaration:
        currentCharName = lines[index].split(' ')[1];
        characters[currentCharName] = {};
        break;
      case isEndingDeclaration:
        if (!isIndentationCorrect(1)) {
          throw new Error(errorMessages.indentation);
        }
        const endingName = trimmedLine
          .replace('ending', '')
          .replace('scene', '')
          .trim()
          .replace(':', '');

        currentScene.label = endingName;
        currentScene.type = 'ending';
        sceneIndex++;
        currentScene.id = sceneIndex;
        break;
      case isSceneDeclaration:
        if (!isIndentationCorrect(1)) {
          throw new Error(errorMessages.indentation);
        }
        const sceneName = trimmedLine
          .replace('scene', '')
          .trim()
          .replace(':', '');

        currentScene.label = sceneName;
        currentScene.type = 'story';
        if (sceneName.includes('<') && sceneName.includes('>')) {
          const condition = sceneName.substring(
            sceneName.indexOf('<') + 1,
            sceneName.indexOf('>'),
          );
          currentScene.condition = condition;
          currentScene.label = sceneName.replace(`<${condition}>`, '');
          currentScene.type = 'condition';
        }
        sceneIndex++;
        currentScene.nextSceneId = sceneIndex + 1;
        currentScene.id = sceneIndex;
        break;
      case isEmotionDeclaration:
        if (!isIndentationCorrect(4)) {
          throw new Error(errorMessages.indentation);
        }

        const [emotionInstruction, path] = trimmedLine.split(':');
        const emotionName = emotionInstruction.replace('emotion', '').trim();
        characters[currentCharName][emotionName] = path.trim();
        break;
      case isUseEmotionDeclaration:
        if (!isIndentationCorrect(4)) {
          throw new Error(errorMessages.indentation);
        }
        const [_useKeyword, _emotionKeyword, charName, emotionToUse] =
          trimmedLine.split(' ');
        currentEmotion.emotionName = emotionToUse;
        currentEmotion.character = charName;
        currentEmotion.sceneId = sceneIndex;
        break;
      case isCharacterSpeech:
        if (isCharacterSpeech && isIndentationCorrect(4)) {
          const [speakingCharacter, ...speech] = trimmedLine.split(' ');
          currentCharName = speakingCharacter
            .replace('[', '')
            .replace(']', '')
            .replace(':', '');
          fullSpeech = speech.join(' ');
        }
        while (lines[index + 1].startsWith('        ')) {
          index++;
          fullSpeech += '\n\n' + lines[index].trim();
        }
        currentText.character = currentCharName;
        currentText.text = fullSpeech;
        currentText.sceneId = sceneIndex;

        break;
      case isChoiceDeclaration:
        if (!isIndentationCorrect(4)) {
          throw new Error(errorMessages.indentation);
        }
        const [choiceInstruction, choiceText] = trimmedLine.split(':');
        const targetScene = choiceInstruction.substring(
          choiceInstruction.indexOf('<') + 1,
          choiceInstruction.indexOf('>'),
        );
        currentChoices.push({
          label: choiceText.trim(),
          targetScene: targetScene,
          sceneId: sceneIndex,
        });
        while (lines[index + 1].trim().startsWith('choice')) {
          index++;
          const [choiceInstruction, choiceText] = lines[index].split(':');
          const targetScene = choiceInstruction.substring(
            choiceInstruction.indexOf('<') + 1,
            choiceInstruction.indexOf('>'),
          );
          currentChoices.push({
            label: choiceText.trim(),
            targetScene: targetScene,
            sceneId: sceneIndex,
          });
        }
        break;
    }

    scenes.push(currentScene);
    emotions.push(currentEmotion);
    dialogues.push(currentText);
    choices.push(currentChoices);
    currentText = { ...emptyDialogue };
    currentEmotion = { ...emptyEmotion };
    currentChoices = [];

    currentScene = { ...emptyScene };
  }

  const result = {
    scenes: scenes.filter((scene) => scene.id > 0),
    dialogues: dialogues.filter(
      (dialogue) => dialogue.sceneId !== null && dialogue.sceneId > 0,
    ),
    emotions: emotions.filter(
      (emotion) => emotion.sceneId !== null && emotion.sceneId > 0,
    ),
    choices: choices.filter((choiceArray) => choiceArray.length > 0),
  };
  return { result, characters };
}

export default function (scriptPath: string) {
  const script = readFileSync(scriptPath, 'utf-8');
  const parsed = parseScript(script);
  const scenes = parsed.result.scenes.map((scene) => {
    return {
      id: scene.id as number,
      label: scene.label as string,
      type: scene.type as 'ending' | 'story' | 'choice' | 'condition',
      choices: parsed.result.choices
        .flat()
        .filter((choice) => choice.sceneId === scene.id)
        .map((choice) => {
          return {
            label: choice.label,
            targetScene: choice.targetScene,
          };
        }),
      condition: scene.condition,
      nextSceneId: scene.nextSceneId,
      dialogue: parsed.result.emotions
        .filter((emotion) => emotion.sceneId === scene.id)
        .map((emotion) => {
          return {
            emotion: emotion.emotionName,
            text: parsed.result.dialogues.find(
              (dialogue) => dialogue.sceneId === scene.id,
            )?.text,
            character: emotion.character,
          };
        }),
    };
  });
  const characters = parsed.characters;

  return { scenes, characters };
}

type Scene = {
  id: number;
  label: string | null;
  type: 'ending' | 'story' | 'choice' | 'condition' | null;
  choices?: Choice[];
  condition?: string;
  nextSceneId?: number;
};
type Emotion = {
  sceneId: number | null;
  character: string | null;
  emotionName: string | null;
};
type Dialogue = {
  sceneId: number | null;
  character: string | null;
  text: string | null;
};
type Choice = {
  label: string | null;
  targetScene?: string | null;
  sceneId?: number | null;
};
