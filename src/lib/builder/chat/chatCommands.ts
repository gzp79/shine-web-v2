import { logAPI } from '#lib/loggers';

/** How a message is shown: as written, or as the result of a dev command. */
export type ChatDisplay =
    | { kind: 'text' }
    /** A latency probe; `selfMs` is the server round trip, known on the sender's own echo. */
    | { kind: 'ping'; selfMs?: number }
    /** The answer to a probe, with the round trip it measured. */
    | { kind: 'pong'; roundTripMs: number };

/** What shows for a message; `hide` is for messages that are only command traffic. */
export type ChatPresentation = ChatDisplay | 'hide';

/** Which dev commands are available. */
export type ChatCommandFlags = {
    ping: boolean;
    burst: boolean;
    storm: boolean;
};

/** A message as a command sees it. */
export type CommandMessage = {
    id: string;
    from: string;
    text: string;
};

type SendText = (text: string) => void;

type OutgoingContext = {
    args: string[];
    selfId: string | null;
    /** Sends a plain message; it is never read as a command. */
    send: SendText;
};

/** A dev command typed by the user, named by its first word. */
type OutgoingCommand = {
    token: string;
    /** Validates its own arguments and ignores malformed input. */
    run: (context: OutgoingContext) => void;
};

export type ArrivalContext = {
    message: CommandMessage;
    selfId: string | null;
    /** The clock (epoch ms) when the message arrived. */
    now: number;
    /** Sends a plain message; it is never read as a command. */
    send: SendText;
};

/** The reaction to a command message that arrives live. */
type IncomingCommand = {
    /** The presentation of the message, or `undefined` when it is not this command's concern. */
    onArrive: (context: ArrivalContext) => ChatPresentation | undefined;
    /** The presentation without the live context (history, not yet confirmed), or `undefined`. */
    describe?: (text: string) => ChatPresentation | undefined;
};

/** The dev commands of the chat, as the stream uses them. */
export type ChatCommands = {
    /** Runs the command the text names. False if the text is not a command and is to be sent as written. */
    run(text: string, context: Omit<OutgoingContext, 'args'>): boolean;
    /** Reacts to a message that arrived live, and returns how it shows. */
    arrive(context: ArrivalContext): ChatPresentation;
    /** How a message shows when it did not arrive live. */
    describe(text: string): ChatPresentation;
};

const PING_TOKEN = '@ping';
const PONG_TOKEN = '@pong';
const BURST_TOKEN = '@burst';
const STORM_TOKEN = '@storm';

/** Cap of the stress commands, so a typo cannot flood the room. */
export const MAX_STRESS_MESSAGES = 200;

const TEXT: ChatDisplay = { kind: 'text' };

// Parses the single count argument of @burst/@storm: a positive integer up to MAX_STRESS_MESSAGES.
function parseStressCount(args: string[]): number | undefined {
    const [arg] = args;
    if (args.length !== 1 || arg === undefined || !/^\d+$/.test(arg)) return undefined;
    const count = Number(arg);
    return count >= 1 && count <= MAX_STRESS_MESSAGES ? count : undefined;
}

function parseTimestamp(value: string | undefined): number | undefined {
    if (value === undefined || !/^\d+$/.test(value)) return undefined;
    return Number(value);
}

type ParsedProbe =
    { kind: 'ping'; id: string; t0: number } | { kind: 'pong'; id: string; t0: number; tR: number } | { kind: 'none' };

function parseProbe(text: string): ParsedProbe {
    const [token, id, rawT0, rawTR] = text.trim().split(/\s+/);
    if (token === PING_TOKEN) {
        const t0 = parseTimestamp(rawT0);
        if (id && t0 !== undefined) return { kind: 'ping', id, t0 };
    } else if (token === PONG_TOKEN) {
        const t0 = parseTimestamp(rawT0);
        const tR = parseTimestamp(rawTR);
        if (id && t0 !== undefined && tR !== undefined) return { kind: 'pong', id, t0, tR };
    }
    return { kind: 'none' };
}

// Latency probe, encoded in plain chat text (the room is a log of commands; this is only a convention
// the clients recognise). Timestamps are epoch milliseconds, every timing uses one clock:
//   @ping <id> <t0>          id = initiator's user id, t0 = initiator's clock at send
//   @pong <id> <t0> <tR>     id/t0 echoed from the ping, tR = responder's clock at send
//   - initiator, on its own ping echo:  now - t0   -> its server round trip
//   - initiator, on a peer's pong:      now - t0   -> full user to user round trip
//   - responder, on its own pong echo:  now - tR   -> its own server round trip
function pingCommands(): { outgoing: OutgoingCommand; incoming: IncomingCommand } {
    return {
        outgoing: {
            token: PING_TOKEN,
            run: ({ args, selfId, send }) => {
                if (args.length > 0) {
                    logAPI.warn('[chat] ignoring invalid @ping command: unexpected parameters');
                    return;
                }
                if (!selfId) {
                    logAPI.warn('[chat] ignoring @ping command: current user id is not known yet');
                    return;
                }
                send(`${PING_TOKEN} ${selfId} ${Date.now()}`);
            }
        },
        incoming: {
            onArrive: ({ message, selfId, now, send }) => {
                const probe = parseProbe(message.text);
                if (probe.kind === 'ping') {
                    if (message.from === selfId) return { kind: 'ping', selfMs: now - probe.t0 };
                    send(`${PONG_TOKEN} ${probe.id} ${probe.t0} ${now}`);
                    return { kind: 'ping' };
                }
                if (probe.kind === 'pong') {
                    if (message.from === selfId) return { kind: 'pong', roundTripMs: now - probe.tR };
                    if (probe.id === selfId) return { kind: 'pong', roundTripMs: now - probe.t0 };
                    return 'hide';
                }
                return undefined;
            },
            describe: (text) => {
                const probe = parseProbe(text);
                if (probe.kind === 'ping') return { kind: 'ping' };
                // A pong can only be measured when it arrives live.
                return probe.kind === 'pong' ? 'hide' : undefined;
            }
        }
    };
}

// `@burst <n>`: the initiator sends n plain messages itself, a single-sender load test.
const burstCommand: OutgoingCommand = {
    token: BURST_TOKEN,
    run: ({ args, send }) => {
        const count = parseStressCount(args);
        if (count === undefined) {
            logAPI.warn(
                `[chat] ignoring invalid @burst command: expected a count between 1 and ${MAX_STRESS_MESSAGES}`
            );
            return;
        }
        for (let i = 1; i <= count; i++) send(`burst ${i}/${count}`);
    }
};

// `@storm <n>`: the initiator sends one trigger, every client that sees it (the initiator included)
// answers with n plain messages: an amplification test with clients x n messages. The answers are
// plain text, never a command, so they cannot trigger another storm.
function stormCommands(): { outgoing: OutgoingCommand; incoming: IncomingCommand } {
    return {
        outgoing: {
            token: STORM_TOKEN,
            run: ({ args, send }) => {
                const count = parseStressCount(args);
                if (count === undefined) {
                    logAPI.warn(
                        `[chat] ignoring invalid @storm command: expected a count between 1 and ${MAX_STRESS_MESSAGES}`
                    );
                    return;
                }
                send(`${STORM_TOKEN} ${count}`);
            }
        },
        incoming: {
            onArrive: ({ message, send }) => {
                const [token, ...args] = message.text.trim().split(/\s+/);
                const count = token === STORM_TOKEN ? parseStressCount(args) : undefined;
                if (count === undefined) return undefined;
                for (let i = 1; i <= count; i++) send(`storm ${i}/${count}`);
                return TEXT;
            }
        }
    };
}

/**
 * Builds the dev commands the flags enable. To add a command, give it a definition above and list
 * it here; the stream needs no change. To turn one off, remove its name from `CHAT_COMMANDS` in
 * `vite.config.ts`.
 */
export function createChatCommands(flags: ChatCommandFlags): ChatCommands {
    const outgoing: OutgoingCommand[] = [];
    const incoming: IncomingCommand[] = [];

    if (flags.ping) {
        const ping = pingCommands();
        outgoing.push(ping.outgoing);
        incoming.push(ping.incoming);
    }
    if (flags.burst) outgoing.push(burstCommand);
    if (flags.storm) {
        const storm = stormCommands();
        outgoing.push(storm.outgoing);
        incoming.push(storm.incoming);
    }

    return {
        run: (text, context) => {
            const [token = '', ...args] = text.trim().split(/\s+/);
            const command = outgoing.find((candidate) => candidate.token === token.toLowerCase());
            if (!command) return false;
            command.run({ ...context, args });
            return true;
        },
        arrive: (context) => {
            for (const command of incoming) {
                const presentation = command.onArrive(context);
                if (presentation !== undefined) return presentation;
            }
            return TEXT;
        },
        describe: (text) => {
            for (const command of incoming) {
                const presentation = command.describe?.(text);
                if (presentation !== undefined) return presentation;
            }
            return TEXT;
        }
    };
}
