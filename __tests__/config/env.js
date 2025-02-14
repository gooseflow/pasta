import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";
import { unlink, writeFile } from "fs/promises";
import { envMessages, loadEnv } from "../../config/env.js";

describe("loadEnv", () => {
    const filePath = fileURLToPath(import.meta.url);
    const dir = dirname(filePath);
    const rootDir = resolve(dir, '..', '..');

    it("should load .env file successfully", async () => {
        const filePath = join(rootDir, ".env_test1");
        const content =
            "SOMETHING=something\n" +
            "NOTHING=nothing\n"
            ;
        await writeFile(filePath, content);

        const spy = jest.spyOn(console, 'log').mockImplementation(() => { });

        loadEnv(".env_test1");

        expect(spy).toHaveBeenCalledWith(expect.stringContaining(envMessages.loaded));

        expect(process.env.SOMETHING).toBe("something");
        expect(process.env.NOTHING).toBe("nothing");

        await unlink(filePath);
    });

    it("should load .env file with warning - missing key", async () => {
        const filePath = join(rootDir, ".env_test2");
        const content =
            "SOMETHING=something\n" +
            "NOTHING=nothing\n" +
            "=validValue\n"
            ;
        await writeFile(filePath, content);

        const spy = jest.spyOn(console, 'log');

        loadEnv(".env_test2");

        expect(spy).toHaveBeenCalledWith(expect.stringContaining(envMessages.missingKey(3)));
        expect(spy).toHaveBeenCalledWith(expect.stringContaining(envMessages.loadedWithWarn));

        expect(process.env.SOMETHING).toBe("something");
        expect(process.env.NOTHING).toBe("nothing");

        await unlink(filePath);
    });

    it("should load .env file with warning - invalid key", async () => {
        const filePath = join(rootDir, ".env_test3");
        const content =
            "SOMETHING=something\n" +
            "NOTHING=nothing\n" +
            "123invalidKey=validValue\n"
            ;
        await writeFile(filePath, content);

        const spy = jest.spyOn(console, 'log');

        loadEnv(".env_test3");

        expect(spy).toHaveBeenCalledWith(expect.stringContaining(envMessages.invalidKey(3, "123invalidKey")));
        expect(spy).toHaveBeenCalledWith(expect.stringContaining(envMessages.loadedWithWarn));

        expect(process.env.SOMETHING).toBe("something");
        expect(process.env.NOTHING).toBe("nothing");

        await unlink(filePath);
    });

    it("should load .env file with warning - missing value", async () => {
        const filePath = join(rootDir, ".env_test4");
        const content =
            "SOMETHING=something\n" +
            "NOTHING=nothing\n" +
            "validKey=\n"
            ;
        await writeFile(filePath, content);

        const spy = jest.spyOn(console, 'log');

        loadEnv(".env_test4");

        expect(spy).toHaveBeenCalledWith(expect.stringContaining(envMessages.missingVal(3)));
        expect(spy).toHaveBeenCalledWith(expect.stringContaining(envMessages.loadedWithWarn));

        expect(process.env.SOMETHING).toBe("something");
        expect(process.env.NOTHING).toBe("nothing");

        await unlink(filePath);
    });

});
