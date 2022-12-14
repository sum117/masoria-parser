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
export default function main(script: string): ParserResult;
export {};
