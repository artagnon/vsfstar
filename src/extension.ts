import * as vscode from 'vscode';
import * as vscodelc from 'vscode-languageclient';
import { realpathSync } from 'fs';

/**
 * Method to get workspace configuration option
 * @param option name of the option (e.g. for fstar.path should be path)
 * @param defaultValue default value to return if option is not set
 */
function getConfig<T>(option: string, defaultValue?: any): T {
  const config = vscode.workspace.getConfiguration('fstar');
  return config.get<T>(option, defaultValue);
}

namespace SwitchSourceHeaderRequest {
  export const type =
    new vscodelc.RequestType<vscodelc.TextDocumentIdentifier, string | undefined,
      void, void>('textDocument/switchSourceHeader');
}

class FileStatus {
  private statuses = new Map<string, any>();
  private readonly statusBarItem =
    vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);

  onFileUpdated(fileStatus: any) {
    const filePath = vscode.Uri.parse(fileStatus.uri);
    this.statuses.set(filePath.fsPath, fileStatus);
    this.updateStatus();
  }

  updateStatus() {
    const path = vscode.window.activeTextEditor.document.fileName;
    const status = this.statuses.get(path);
    if (!status) {
      this.statusBarItem.hide();
      return;
    }
    this.statusBarItem.text = `fstar: ` + status.state;
    this.statusBarItem.show();
  }

  clear() {
    this.statuses.clear();
    this.statusBarItem.hide();
  }

  dispose() {
    this.statusBarItem.dispose();
  }
}

/**
 *  this method is called when your extension is activate
 *  your extension is activated the very first time the command is executed
 */
export function activate(context: vscode.ExtensionContext) {
  const syncFileEvents = getConfig<boolean>('syncFileEvents', true);

  const fstar: vscodelc.Executable = {
    command: getConfig<string>('path'),
    args: getConfig<string[]>('arguments', '--ide')
  };
  const traceFile = getConfig<string>('trace');
  if (!!traceFile) {
    const trace = { FSTAR_TRACE: traceFile };
    fstar.options = { env: { ...process.env, ...trace } };
  }
  const serverOptions: vscodelc.ServerOptions = fstar;

  const clientOptions: vscodelc.LanguageClientOptions = {
    initializationOptions: { fstarFileStatus: true },

    // Do not switch to output window when fstar returns output
    revealOutputChannelOn: vscodelc.RevealOutputChannelOn.Never
  };

  const fstarClient = new vscodelc.LanguageClient('F* Language Server', serverOptions, clientOptions);
  console.log('F* Language Server is now active!');
  context.subscriptions.push(fstarClient.start());
  context.subscriptions.push(vscode.commands.registerCommand(
    'vsfstar.switchheadersource', async () => {
      const uri =
        vscode.Uri.file(vscode.window.activeTextEditor.document.fileName);
      if (!uri) {
        return;
      }
      const docIdentifier =
        vscodelc.TextDocumentIdentifier.create(uri.toString());
      const sourceUri = await fstarClient.sendRequest(
        SwitchSourceHeaderRequest.type, docIdentifier);
      if (!sourceUri) {
        return;
      }
      const doc = await vscode.workspace.openTextDocument(
        vscode.Uri.parse(sourceUri));
      vscode.window.showTextDocument(doc);
    }));
  const status = new FileStatus();
  context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => {
    status.updateStatus();
  }));
  fstarClient.onDidChangeState(
    ({ newState }) => {
      if (newState === vscodelc.State.Running) {
        // fstar starts or restarts after crash.
        fstarClient.onNotification(
          'textDocument/fstar.fileStatus',
          (fileStatus) => { status.onFileUpdated(fileStatus); });
      } else if (newState === vscodelc.State.Stopped) {
        // Clear all cached statuses when fstar crashes.
        status.clear();
      }
    });
  // An empty place holder for the activate command, otherwise we'll get an
  // "command is not registered" error.
  context.subscriptions.push(vscode.commands.registerCommand(
    'vsfstar.activate', async () => { }));
}