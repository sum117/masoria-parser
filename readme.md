# Masoria Visual Novel Parser

<p align="center">
  <image src="https://github.com/sum117/masoria-lang/blob/master/LogoMasoria.png">
</p>

> A vanilla parser that I made for my visual novel project, Masoria. It's not very good, but it works for my purposes. I'm not planning on updating it, but I'm releasing it in case anyone wants to use it for their own projects.

⚠️ Warning: Masoria Language is recursive. Declare things from top to bottom.

## Installation

```bash
npm i masoria-lang
```

## Summary

- [Masoria Visual Novel Parser](#masoria-visual-novel-parser)
  - [Installation](#installation)
  - [Summary](#summary)
  - [Implementation](#implementation)
  - [Features](#features)
    - [Arrow Pointer](#arrow-pointer)
    - [Character Declaration](#character-declaration)
    - [Dynamic Emotions and Dialogues](#dynamic-emotions-and-dialogues)
    - [Scenes with Javascript Conditions](#scenes-with-javascript-conditions)
  - [Keywords](#keywords)
  - [Syntax Examples](#syntax-examples)
  - [Package Output](#package-output)

## Implementation

```ts
import parser from ".";
import { readFileSync, writeFileSync } from "fs";

const fileName = "tutorial";

const readScript = readFileSync(`scripts/${fileName}.masoria`, "utf-8");
const result = parser(readScript);

writeFileSync(`output/${fileName}.json`, JSON.stringify(result));
```

## Features

### Arrow Pointer

By default, the next scene reference is always the following one (except if they contain choices inside them). You can overwrite this by using the arrow pointer `->`, which will label the next scene of the current scene with the name you provide after the arrow pointer.

```masoria
scene sceneName -> sceneName2:
```

### Character Declaration

You have to declare characters on the top of the file, and save their emotions to the variable, so they can be referenced afterwards.

```masoria
character alice:
    emotion frowning: data/Characters/Alice/AliceFrowning.png
    emotion smiling: data/Characters/Alice/AliceSmiling.png
    emotion blushing: data/Characters/Alice/AliceBlushing.png
    emotion waving: data/Characters/Alice/AliceWaving.png
    emotion sad: data/Characters/Alice/AliceSad.png
    emotion bookShy: data/Characters/Alice/AliceBookShy.png
    emotion bookSad: data/Characters/Alice/AliceBookSad.png
```

### Dynamic Emotions and Dialogues

You can declare the emotion to be used on the next dialogues. If no other emotion is declared in the scene, all the other dialogues inherit the declared one. This works recursively.

```masoria
use emotion alice frowning
|---------| |--|  |------|
 keyword character emotion
```

### Scenes with Javascript Conditions

Regular scenes can have names between `<` and `>` to reference javascript conditions that must be executed BEFORE the scene changes.

```masoria
scene sceneName<condition>:
```

## Keywords

⚠️ Keep reading for syntax examples.

`choice`: Must be used inside a scene. Appends the choice to an array in the output.
`use emotion`: Must be used inside a scene. Use an emotion in the current scene.
`ending scene`: Defines an ending scene. Program should close after this.
`character`: Declares a character.
`emotion`: Declare an emotion inside a character declaration block.

## Syntax Examples

```masoria
character characterName:
    emotion emotionName1: path/to/file.png
    emotion emotionName2: path/to/file2.png

scene sceneName<optionalCondition>:
    use emotion characterName emotionName1

    [characterName]: characterSpeech

scene sceneName2:
    use emotion characterName emotionName1

    [characterName]: characterSpeech

    choice<sceneName3>: promptText
    choice<sceneName4>: promptText

ending scene sceneName3:
    use emotion characterName emotionName1

    [characterName]: characterSpeech

    use emotion characterName emotionName2

    [characterName]: characterSpeech

scene sceneName4:
    use emotion characterName emotionName2

    [characterName]: characterSpeech
```

## Package Output

This is the expected result if syntax is followed correctly.

```json
{
  "scenes": [
    {
      "label": "sceneName",
      "isEndingScene": false,
      "condition": "optionalCondition",
      "dialogues": [
        {
          "character": "characterName",
          "emotion": "emotionName1",
          "text": ["characterSpeech"]
        }
      ],
      "nextScene": "sceneName2"
    },
    {
      "label": "sceneName2",
      "isEndingScene": false,
      "dialogues": [
        {
          "character": "characterName",
          "emotion": "emotionName1",
          "text": ["characterSpeech"]
        }
      ],
      "previousScene": "sceneName",
      "choices": [
        {
          "label": "promptText",
          "targetScene": "sceneName3"
        },
        {
          "label": "promptText",
          "targetScene": "sceneName4"
        }
      ]
    },
    {
      "label": "sceneName3",
      "isEndingScene": true,
      "dialogues": [
        {
          "character": "characterName",
          "emotion": "emotionName1",
          "text": ["characterSpeech"]
        },
        {
          "character": "characterName",
          "emotion": "emotionName2",
          "text": ["characterSpeech"]
        }
      ],
      "nextScene": "sceneName4",
      "previousScene": "sceneName2"
    },
    {
      "label": "sceneName4",
      "isEndingScene": false,
      "dialogues": [
        {
          "character": "characterName",
          "emotion": "emotionName2",
          "text": ["characterSpeech"]
        }
      ],
      "previousScene": "sceneName2"
    }
  ],
  "characters": [
    {
      "name": "characterName",
      "emotions": {
        "emotionName1": "path/to/file.png",
        "emotionName2": "path/to/file2.png"
      }
    }
  ]
}
```
