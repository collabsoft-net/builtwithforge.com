import { ReactElement } from 'react';

export type SupportedLanguages = 'en';

export interface EntryPoint<T extends Props> {
  name: string;
  selector?: string;
  getElement: (props: T) => Promise<ReactElement>;
}


export type Props = Record<string, unknown>;
