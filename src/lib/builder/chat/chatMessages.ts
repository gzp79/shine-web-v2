type BaseMessage<K extends string> = {
    id: string;
    kind: K;
};

type UserMessage<K extends string> = BaseMessage<K> & { from: string };

export type TextMessage = UserMessage<'text'> & { text: string };
export type GapMessage = BaseMessage<'gap'>;

export type PingMessage = UserMessage<'ping'> & { selfMs?: number };
export type PongMessage = UserMessage<'pong'> & { initiator: string; roundTripMs: number };

export type ChatMessage = TextMessage | PingMessage | PongMessage | GapMessage;
