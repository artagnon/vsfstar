'use strict';
import { workspace, ExtensionContext } from 'vscode';

import {
	LanguageClient,
} from 'vscode-languageclient';

import {FStarProject} from './project';

let client: LanguageClient;
let project: FStarProject;

export function activate(context: ExtensionContext) {
  console.log(`F* Extension: process.version: ${process.version}, process.arch: ${process.arch}}`);

  project = FStarProject.create(context);
  context.subscriptions.push(project);
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}