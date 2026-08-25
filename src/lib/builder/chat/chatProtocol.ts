import type { ServerFrame } from '../hub';

/** A single chat comment as it arrives on the wire. */
export type ChatComment = {
    /** Stream id (`<ms>-<seq>`), stable and unique per message. */
    id: string;
    /** Author's user id. */
    from: string;
    text: string;
};

/** Frame type this channel subscribes to and sends. */
export const CHAT_FRAME_TYPE = 'chat';

/** Encodes outgoing text as a `chat` request frame. */
export function encodeChatRequest(text: string): string {
    return JSON.stringify({ type: CHAT_FRAME_TYPE, text });
}

const streamIdPattern = /^\d+-\d+$/;

function isWireChatComment(value: unknown): value is ChatComment {
    if (typeof value !== 'object' || value === null) return false;
    const candidate = value as Record<string, unknown>;
    return (
        typeof candidate.id === 'string' &&
        streamIdPattern.test(candidate.id) &&
        typeof candidate.from === 'string' &&
        typeof candidate.text === 'string'
    );
}

/**
 * Extracts the valid chat comments from a `chat` frame, dropping any malformed entries so a
 * single bad comment never discards an otherwise valid batch. Returns an empty array when the
 * frame carries no usable `messages`.
 */
export function parseChatComments(frame: ServerFrame): ChatComment[] {
    const messages = frame.messages;
    if (!Array.isArray(messages)) return [];
    return messages.filter(isWireChatComment);
}
