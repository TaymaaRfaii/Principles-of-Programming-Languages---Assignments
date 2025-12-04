import * as R from "ramda";

const stringToArray = R.split("");

/* Question 1 */
export const countVowels: (s: string) => number=R.pipe(
    R.toLower, stringToArray, R.filter(R.includes(R.__, "aeiou")), R.length);


/* Question 2 */
//Helper functions
const isMatching = (parentheses: string[], openBracket: string, closeBracket: string): string[] =>
    R.isEmpty(parentheses) ? [closeBracket] :
        R.head(parentheses) === openBracket ? R.tail(parentheses) : R.prepend(closeBracket, parentheses);

const Reducer : (parentheses: string[], current: string) => string[] = (parentheses, current) =>
    current === "[" || current === "{" || current === "("  ? R.prepend(current, parentheses ) :
    current === "]" ? isMatching(parentheses, "[", current) :
    current === "}" ?  isMatching(parentheses, "{", current) :
    current === ")" ? isMatching(parentheses, "(", current) :
    parentheses;
//Main function
export const isPaired: (s : string) => boolean = R.pipe(
    stringToArray,
    R.reduce(Reducer, []),
    R.isEmpty
);
/* Question 3 */
export type WordTree = {
    root: string;
    children: WordTree[];
}

export const treeToSentence = (word: WordTree): string =>
word.root + (word.children.length > 0 ? " " + word.children.map(treeToSentence).join(" ") : "");


