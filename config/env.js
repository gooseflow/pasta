import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { readFileSync } from 'fs';

const msg = {
    ansiSuccess: "\x1b[32m",
    ansiWarn: "\x1b[33m",
    ansiReset: "\x1b[0m",
    parse: "Warning! Could not parse environment variables: ",
    fileNotFound: "no .env file found in the project's root dir",
    fileEmpty: ".env file is empty"
}

function parse() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const rootDir = resolve(__dirname, '..');
    let file;

    const pairs = [];
    const errors = [];

    try {
        file = readFileSync(join(rootDir, ".env"), { encoding: "utf8" });
    } catch (err) {
        if (err.code === "ENOENT") {
            console.log(
                msg.ansiWarn +
                msg.parse +
                msg.fileNotFound +
                msg.ansiReset
            );
        } else {
            console.error(err);
        }
        return { pairs, errors: errors.length !== 0 };
    };

    if (file.length === 0) {
        console.log(
            msg.ansiWarn +
            msg.parse +
            msg.fileEmpty +
            msg.ansiReset
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

        if (isDigit(k[0])) {
            errors.push(`invalid key on line ${i}: key name cannot start with digit`);
            continue;
        }
        if (k.length === 0) {
            errors.push(`missing key on line ${i}`);
            continue;
        }

        v = trimQuotes(v);
        if (v.length === 0) {
            errors.push(`missing value on line ${i}`);
            continue;
        }
        pairs.push([k, v]);
    }

    for (let i = 0; i < errors.length; i++) {
        console.log(
            msg.ansiWarn +
            errors[i] +
            msg.ansiReset
        );
    }

    return { pairs, errors: errors.length !== 0 };
}

function isDigit(c) {
    return c >= "0" && c <= "9";
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

export function loadEnv() {
    const { pairs, errors } = parse();

    for (let i = 0; i < pairs.length; i++) {
        process.env[pairs[i][0]] = pairs[i][1];
    }

    if (pairs.length === 0) {
        return;
    }

    if (errors) {
        console.log(
            msg.ansiSuccess +
            ".env file successfully loaded - some warnings present" +
            msg.ansiReset
        );
        return;
    }
    console.log(
        msg.ansiSuccess +
        ".env file successfully loaded" +
        msg.ansiReset
    );
}

