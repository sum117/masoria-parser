# Masoria Visual Novel Parser

> A vanilla parser that I made for my visual novel project, Masoria. It's not very good, but it works for my purposes. I'm not planning on updating it, but I'm releasing it in case anyone wants to use it for their own projects.

✅ Output comes in json. if you want to multiline, do:
```masoria
    [characterName]: characterSpeech
        characterSpeech
```
Otherwise it wont work.

## Syntax Examples
```masoria
# Are comments

character characterName =
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
