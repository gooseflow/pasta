import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { readFileSync } from 'fs';

export const envMessages = {
    ansiSuccess: "\x1b[32m",
    ansiWarn: "\x1b[33m",
    ansiReset: "\x1b[0m",
    parse: "Warning! Could not parse environment variables: ",
    fileNotFound: "no .env file found in the project's root dir",
    fileEmpty: ".env file is empty",
    missingKey: i => `line ${i}: missing key`,
    invalidKey: (i, k) => `line ${i}: invalid key "${k}": key name must start with a letter`,
    missingVal: i => `line ${i}: missing value`,
    loadedWithWarn: ".env file successfully loaded - some warnings present",
    loaded: ".env file successfully loaded"
}

function parse(fileName) {
    const filePath = fileURLToPath(import.meta.url);
    const dir = dirname(filePath);
    const rootDir = resolve(dir, "..");
    let file;

    const pairs = [];
    const errors = [];

    try {
        file = readFileSync(join(rootDir, fileName), { encoding: "utf8" });
    } catch (err) {
        if (err.code === "ENOENT") {
            console.log(
                envMessages.ansiWarn +
                envMessages.parse +
                envMessages.fileNotFound +
                envMessages.ansiReset
            );
        } else {
            console.error(err);
        }
        return { pairs, errors: errors.length !== 0 };
    };

    if (file.length === 0) {
        console.log(
            envMessages.ansiWarn +
            envMessages.parse +
            envMessages.fileEmpty +
            envMessages.ansiReset
        );
    }

    const lines = file.split("\n");
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].length === 0) {
            continue;
        }

        const split = lines[i].split("=");

        let k = split[0]?.trim();
        let v = split[1]?.trim();

        if (k.length === 0) {
            errors.push(envMessages.missingKey(i + 1));
            continue;
        }
        if (!isAlpha(k[0])) {
            errors.push(envMessages.invalidKey(i + 1, k));
            continue;
        }

        v = trimQuotes(v);
        if (v.length === 0) {
            errors.push(envMessages.missingVal(i + 1));
            continue;
        }
        pairs.push([k, v]);
    }

    for (let i = 0; i < errors.length; i++) {
        console.log(
            envMessages.ansiWarn +
            errors[i] +
            envMessages.ansiReset
        );
    }

    return { pairs, errors: errors.length !== 0 };
}

function isAlpha(c) {
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
}

function trimQuotes(s) {
    if (s.length < 2) {
        return s;
    }

    if (
        (s.startsWith("'") && s.endsWith("'")) ||
        (s.startsWith('"') && s.endsWith('"'))
    ) {
        return s.slice(1, -1);
    }

    return s;
}

export function loadEnv(fileName = ".env") {
    const { pairs, errors } = parse(fileName);

    for (let i = 0; i < pairs.length; i++) {
        process.env[pairs[i][0]] = pairs[i][1];
    }

    if (pairs.length === 0) {
        return;
    }

    if (errors) {
        console.log(
            envMessages.ansiSuccess +
            envMessages.loadedWithWarn +
            envMessages.ansiReset
        );
        return;
    }
    console.log(
        envMessages.ansiSuccess +
        envMessages.loaded +
        envMessages.ansiReset
    );
}

