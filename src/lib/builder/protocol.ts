export type ChatComment = {
    id: string;
    from: string;
    text: string;
};

export type WSMessageRequest = {
    type: 'chat';
    text: string;
};

export type WSMessageResponse = {
    type: 'chat';
    messages: ChatComment[];
};

export function encodeChatRequest(text: string): string {
    return JSON.stringify({ type: 'chat', text } satisfies WSMessageRequest);
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
 * Parses a raw text frame into a typed server response.
 * Returns `null` for malformed frames or unknown message types so callers can
 * safely ignore anything they do not understand.
 */
export function parseServerMessage(raw: string): WSMessageResponse | null {
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return null;
    }

    if (typeof parsed !== 'object' || parsed === null) return null;
    const message = parsed as Record<string, unknown>;

    if (message.type === 'chat' && Array.isArray(message.messages)) {
        const messages = message.messages.filter(isWireChatComment);
        return { type: 'chat', messages };
    }

    return null;
}
