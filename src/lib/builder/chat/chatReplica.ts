import z from 'zod';
import { CHAT_MAX_TEXT_BYTES, CHAT_WINDOW, ChatCommand, ChatState, uuidFromBytes } from '#lib/game-bindings';
import type { ServerFrame } from '../hub.svelte';

/** A chat message as the room shows it. */
export type ChatEntry = {
    /** Id of the command that added the message. */
    id: string;
    /** Id of the author. */
    from: string;
    text: string;
    edited: boolean;
    /** The server has not confirmed it yet. */
    pending: boolean;
};

/** How far the replica follows the server. */
export type ReplicaStatus = 'waiting' | 'live' | 'unsynced';

/** A command to send to the server. */
export type OutgoingCommand = {
    commandId: string;
    /** Base64 of the postcard bytes. */
    command: string;
};

/** A message the log added. */
export type ArrivedMessage = {
    id: string;
    from: string;
    text: string;
};

/** What the owner of the replica has to do after a frame. */
export type FrameResult = {
    /** The messages shown changed. */
    changed: boolean;
    /** The state cannot be followed any more: subscribe again. */
    resubscribe: boolean;
    /** Commands the server does not know yet, to send again. */
    resend: OutgoingCommand[];
    /** Messages the log added live, the user's own echoes included. A sync adds none: it is history. */
    arrived: ArrivedMessage[];
};

const NOTHING: FrameResult = { changed: false, resubscribe: false, resend: [], arrived: [] };

const WireCommandSchema = z.object({
    version: z.number().int(),
    commandId: z.string(),
    userId: z.string(),
    command: z.string()
});

const SyncSchema = z.object({
    snapshot: z.object({ version: z.number().int(), data: z.string() }).nullish(),
    commands: z.array(WireCommandSchema)
});

const CommandsSchema = z.object({ commands: z.array(WireCommandSchema) });

const NackSchema = z.object({ commandId: z.string(), reason: z.string() });

type WireCommand = z.infer<typeof WireCommandSchema>;

type PendingCommand = { commandId: string; command: ChatCommand };

const textEncoder = new TextEncoder();

/** Applies a command of `userId` to the messages. Commands that name an unknown or a foreign message do nothing. */
function applyCommand(
    messages: ChatEntry[],
    commandId: string,
    userId: string,
    command: ChatCommand,
    pending: boolean
): void {
    switch (command.tag) {
        case 'add':
            messages.push({ id: commandId, from: userId, text: command.value.text, edited: false, pending });
            if (messages.length > CHAT_WINDOW) messages.splice(0, messages.length - CHAT_WINDOW);
            break;
        case 'remove': {
            const index = findOwn(messages, uuidFromBytes(command.value.id), userId);
            if (index >= 0) messages.splice(index, 1);
            break;
        }
        case 'replace': {
            const index = findOwn(messages, uuidFromBytes(command.value.id), userId);
            const message = messages[index];
            if (message) messages[index] = { ...message, text: command.value.text, edited: true };
            break;
        }
    }
}

function findOwn(messages: readonly ChatEntry[], id: string, userId: string): number {
    return messages.findIndex((message) => message.id === id && message.from === userId);
}

function outgoing({ commandId, command }: PendingCommand): OutgoingCommand {
    return { commandId, command: ChatCommand.encode(command) };
}

/**
 * The chat room as one client sees it: the messages the server confirmed, plus the commands of this
 * client that the server has not confirmed yet. Does no I/O; the owner moves the frames.
 *
 * The client side of the Rust `ClientStream`, without the state and chain hash checks.
 */
export class ChatReplica {
    readonly userId: string;

    #confirmed: ChatEntry[] = [];
    #version = 0;
    #pending: PendingCommand[] = [];
    #status: ReplicaStatus = 'waiting';

    constructor(userId: string) {
        this.userId = userId;
    }

    get status(): ReplicaStatus {
        return this.#status;
    }

    /** The version of the confirmed messages. */
    get version(): number {
        return this.#version;
    }

    get pendingCount(): number {
        return this.#pending.length;
    }

    /** The confirmed messages with the pending commands applied on top. */
    view(): ChatEntry[] {
        const messages = [...this.#confirmed];
        for (const { commandId, command } of this.#pending) {
            applyCommand(messages, commandId, this.userId, command, true);
        }
        return messages;
    }

    /** Waits for a new sync from the server; the messages stay shown meanwhile. */
    resync(): void {
        this.#status = 'waiting';
    }

    /**
     * Takes a message of this client: it shows at once and is pending until the server confirms it.
     * Returns the command to send, or `undefined` if the text is not acceptable or the replica is not live.
     */
    submit(commandId: string, text: string): OutgoingCommand | undefined {
        const trimmed = text.trim();
        if (this.#status !== 'live' || trimmed === '' || textEncoder.encode(trimmed).length > CHAT_MAX_TEXT_BYTES) {
            return undefined;
        }
        const pending = { commandId, command: ChatCommand.add(trimmed) };
        this.#pending.push(pending);
        return outgoing(pending);
    }

    /** Forgets a pending command that could not be sent. */
    discard(commandId: string): void {
        this.#pending = this.#pending.filter((pending) => pending.commandId !== commandId);
    }

    /** Reacts to a frame of the stream. Frames that are not understood are ignored. */
    handle(frame: ServerFrame): FrameResult {
        switch (frame.type) {
            case 'streamSync':
                return this.#onSync(frame);
            case 'streamCommands':
                return this.#onCommands(frame);
            case 'streamReset':
                this.#status = 'waiting';
                return NOTHING;
            case 'streamUnsynced':
            case 'streamSubscribeFailed':
                this.#status = 'unsynced';
                return NOTHING;
            case 'streamNack':
                return this.#onNack(frame);
            default:
                return NOTHING;
        }
    }

    #onSync(frame: ServerFrame): FrameResult {
        const parsed = SyncSchema.safeParse(frame);
        if (!parsed.success) return this.#unsynced();
        const { snapshot, commands } = parsed.data;

        let messages: ChatEntry[] = [];
        let version = 0;
        try {
            if (snapshot) {
                messages = ChatState.parse(snapshot.data).messages.map((message) => ({
                    id: uuidFromBytes(message.id),
                    from: uuidFromBytes(message.userId),
                    text: message.text,
                    edited: message.edited,
                    pending: false
                }));
                version = snapshot.version;
            }
            for (const wire of commands) {
                if (wire.version <= version) continue;
                if (wire.version !== version + 1) throw new Error(`gap before version ${wire.version}`);
                applyCommand(messages, wire.commandId, wire.userId, ChatCommand.parse(wire.command), false);
                version = wire.version;
            }
        } catch {
            return this.#unsynced();
        }

        this.#confirmed = messages;
        this.#version = version;
        this.#pending = this.#pending.filter(
            (pending) => !commands.some((wire) => wire.commandId === pending.commandId)
        );
        this.#status = 'live';
        return { changed: true, resubscribe: false, resend: this.#pending.map(outgoing), arrived: [] };
    }

    #onCommands(frame: ServerFrame): FrameResult {
        if (this.#status !== 'live') return NOTHING;
        const parsed = CommandsSchema.safeParse(frame);
        if (!parsed.success) return this.#resubscribe(false);
        const { commands } = parsed.data;

        const first = commands[0];
        if (first && first.version > this.#version + 1) return this.#resubscribe(false);

        let changed = false;
        const arrived: ArrivedMessage[] = [];
        for (const wire of commands) {
            if (wire.version <= this.#version) continue;
            const command = this.#applyNext(wire);
            if (!command) return this.#resubscribe(changed, arrived);
            this.#pending = this.#pending.filter((pending) => pending.commandId !== wire.commandId);
            changed = true;
            if (command.tag === 'add')
                arrived.push({ id: wire.commandId, from: wire.userId, text: command.value.text });
        }
        return { changed, resubscribe: false, resend: [], arrived };
    }

    /** Applies the next command of the log to the confirmed messages; `undefined` if it cannot be applied. */
    #applyNext(wire: WireCommand): ChatCommand | undefined {
        if (wire.version !== this.#version + 1) return undefined;
        let command: ChatCommand;
        try {
            command = ChatCommand.parse(wire.command);
        } catch {
            return undefined;
        }
        applyCommand(this.#confirmed, wire.commandId, wire.userId, command, false);
        this.#version = wire.version;
        return command;
    }

    #onNack(frame: ServerFrame): FrameResult {
        const parsed = NackSchema.safeParse(frame);
        if (!parsed.success) return NOTHING;
        const { commandId, reason } = parsed.data;

        const before = this.#pending.length;
        this.discard(commandId);
        const changed = this.#pending.length !== before;
        // The server lost the subscription: the next sync brings the state back.
        if (reason === 'notSubscribed') return this.#resubscribe(changed);
        return changed ? { ...NOTHING, changed } : NOTHING;
    }

    #unsynced(): FrameResult {
        this.#status = 'unsynced';
        return NOTHING;
    }

    #resubscribe(changed: boolean, arrived: ArrivedMessage[] = []): FrameResult {
        this.#status = 'waiting';
        return { changed, resubscribe: true, resend: [], arrived };
    }
}
