type LogLevel = "log" | "warn" | "error";

const coloursList: Record<string, number> = {
    red: 31,
    green: 32,
    yellow: 33,
    blue: 34,
    magenta: 35,
    cyan: 36,
    white: 37,
};

function formatMessage(message: unknown): string {
    if (message instanceof Error) {
        return message.stack ?? message.message;
    }
    if (typeof message === "object") {
        return JSON.stringify(message, null, 2);
    }
    return String(message);
}

function extractFileName(stackTrace: string): string | null {
    const lines = stackTrace.split("\n");

    for (const line of lines) {
        if (
            line.includes("node_modules") ||
            line.includes("internal") ||
            !line.includes("at ")
        ) {
            continue;
        }

        const match = line.match(
            /\sat\s(?:.*\()?(.*[\/\\])([^\/\\]+):\d+:\d+\)?$/
        );

        if (match) {
            return match[2];
        }
    }

    return null;
}

function print(
    level: LogLevel,
    message: unknown,
    colorCode?: number
) {
    const stackTrace = new Error().stack;
    const fileName = stackTrace
        ? extractFileName(stackTrace)
        : null;

    const prefix = `${level.toUpperCase()}:${fileName ? ` ${fileName} -` : ""
        }`;

    const output = `${prefix} ${formatMessage(message)}`;

    if (colorCode) {
        console[level](`\x1b[${colorCode}m${output}\x1b[0m`);
    } else {
        console[level](output);
    }
}

export function log(message: unknown) {
    print("log", message);
}

export function warn(message: unknown) {
    print("warn", message, coloursList.yellow);
}

export function error(message: unknown) {
    print("error", message, coloursList.red);
}

export function colour(
    message: string,
    colour: keyof typeof coloursList | number
) {
    const code =
        typeof colour === "number"
            ? colour
            : coloursList[colour] ?? coloursList.cyan;

    console.log(`\x1b[${code}m${message}\x1b[0m`);
}

export const logProcessing = (
    platform: string,
    action: string,
    count: number
) => {
    log(`${platform} ${action} Processing ${count} Users`);
};

export const logFinished = (
    platform: string,
    action: string,
    count: number
) => {
    log(`${platform} ${action} Finished Processing ${count} Users`);
};

export function createReqLogger(
    scope: string,
    meta: Record<string, string | number>
) {
    const ctx =
        `${scope}` +
        Object.entries(meta)
            .map(([k, v]) => ` ${k}=${v}`)
            .join("");

    return {
        log: (msg: string) => console.log(`[${ctx}] ${msg}`),
        warn: (msg: string) =>
            console.warn(`\x1b[33m[${ctx}] ${msg}\x1b[0m`),
        error: (msg: string) =>
            console.error(`\x1b[31m[${ctx}] ${msg}\x1b[0m`),
    };
}