export type Level = 'log' | 'info' | 'debug' | 'warn' | 'error';

export interface ConsoleMessage {
  type: 'console';
  level: Level;
  message: string;
}

export type ParentMessage = ConsoleMessage;

export type ChildMessage = never;
