'use strict';

import { CancellationToken, Position, TextDocument } from 'vscode-languageserver';
import * as vscode from 'vscode-languageserver';
import * as proto from './proto';

export class FStarDocument implements TextDocument {
  private document: TextDocument = null;
  public get uri(this: FStarDocument) { return this.document.uri; }
  public get languageId(this: FStarDocument) { return this.document.languageId; }
  public get version(this: FStarDocument) { return this.document.version; }
  public get lineCount(this: FStarDocument) { return this.document.lineCount; }
  public getText(this: FStarDocument) {
    return this.document.getText();
  }

  public offsetAt(this: FStarDocument, pos: Position) : number {
    return this.document.offsetAt(pos);
  }

  public positionAt(this: FStarDocument, offset: number) : Position {
    return this.document.positionAt(offset);
  }

  public async stepForward(this: FStarDocument, token: CancellationToken)
  : Promise<proto.CommandResult> {
    return {type: 'not-running', reason: "not-started"};
  }

  public async stepBackward(this: FStarDocument, token: CancellationToken)
  : Promise<proto.CommandResult> {
    return {type: 'not-running', reason: "not-started"};
  }

  public provideSymbols() : vscode.SymbolInformation[] {
    return [];
  }

  public async provideDefinition(pos: vscode.Position)
  : Promise<vscode.Location|vscode.Location[]> {
    return [];
  }
}

export class FStarProject {
  private fstarInstances = new Map<string, FStarDocument>();
  private currentSettings : proto.FStarSettings;
  private workspaceRoot: string;

  constructor(workspaceRoot: string, private readonly connection: vscode.IConnection) {
    if (workspaceRoot) {
      connection.console.log("Loaded project at " + workspaceRoot);
    }
    else {
      connection.console.log("Loading project with no root directory");
    }
    this.workspaceRoot = workspaceRoot;
  }

  public lookup(this: FStarProject, uri: string) : FStarDocument {
    var doc = this.fstarInstances.get(uri);
    if (!doc) {
      throw new Error('unknown document: ' + uri);
    }
    return doc;
  }
}