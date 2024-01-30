import { window } from 'vscode';

export const callables = {
  showInformationMessage: (messge: string) => {
    window.showInformationMessage(messge);
  },
};
