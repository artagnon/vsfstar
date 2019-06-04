import * as vscode from 'vscode';
import {
  LanguageClientOptions,
  ServerOptions,
  LanguageClient
} from 'vscode-languageclient';

/**
 * Method to get workspace configuration option
 * @param option name of the option (e.g. for fstar.path should be path)
 * @param defaultValue default value to return if option is not set
 */
function getConfig<T>(option: string, defaultValue?: any): T {
  const config = vscode.workspace.getConfiguration('fstar');
  return config.get<T>(option, defaultValue);
}

// This method is called when your extension is activated
// the very first time
export function activate(context: vscode.ExtensionContext) {
  const serverOptions: ServerOptions = {
    command: getConfig<string>('path'),
    args: ['--lsp']
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'fstar' },
                       { scheme: 'file', language: 'fsharp' }]
  };

  const fstarClient = new LanguageClient('F* Language Server', serverOptions, clientOptions);

  console.log('F* Language Server is now active!');
  context.subscriptions.push(fstarClient.start());

  // An empty place holder for the activate command, otherwise we'll get an
  // "command is not registered" error.
  context.subscriptions.push(vscode.commands.registerCommand(
    'vsfstar.activate', async () => { }));
}