import { smileys1 } from "./smileys1";
import { smileys2 } from "./smileys2";
import { smileys3 } from "./smileys3";
import { people1 } from "./people1";
import { people2 } from "./people2";
import { nature1 } from "./nature1";
import { nature2 } from "./nature2";
import { food1 } from "./food1";
import { food2 } from "./food2";
import { food3 } from "./food3";
import { objects1 } from "./objects1";
import { objects2 } from "./objects2";
import { symbols1 } from "./symbols1";
import { symbols2 } from "./symbols2";

const keywordSources: ReadonlyArray<Readonly<Record<string, string>>> = [
  smileys1,
  smileys2,
  smileys3,
  people1,
  people2,
  nature1,
  nature2,
  food1,
  food2,
  food3,
  objects1,
  objects2,
  symbols1,
  symbols2,
];

export function getEmojiKeyword(emoji: string): string | undefined {
  for (const source of keywordSources) {
    const value = source[emoji];
    if (value !== undefined) return value;
  }
  return undefined;
}
