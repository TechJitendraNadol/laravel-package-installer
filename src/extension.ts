import * as vscode from 'vscode';
import axios from 'axios';
import * as cp from 'child_process';
import suggestions from './suggestions';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.installLaravelPackage', async () => {
        const packageName = await showPackageSuggestions();

        if (packageName) {
            vscode.window.showInformationMessage(`Installing ${packageName}...`);
            cp.exec(`composer require ${packageName}`, { cwd: vscode.workspace.rootPath }, (err, stdout, stderr) => {
                if (err) {
                    vscode.window.showErrorMessage(`Failed to install ${packageName}: ${stderr}`);
                    return;
                }
                vscode.window.showInformationMessage(`Successfully installed ${packageName}`);
            });
        }
    });

    context.subscriptions.push(disposable);
}

async function showPackageSuggestions(): Promise<string | undefined> {
    let predefinedSuggestions: vscode.QuickPickItem[] = suggestions;
    const quickPick = vscode.window.createQuickPick<vscode.QuickPickItem>();
    quickPick.items = predefinedSuggestions;
    quickPick.placeholder = 'Select or search for a package to install';

    quickPick.onDidChangeValue(async (input) => {
        if (input.trim().length === 0) {
            quickPick.items = predefinedSuggestions;
            return;
        }

        try {
            const response = await axios.get(`https://packagist.org/search.json?q=${encodeURIComponent(input)}`);
            const packages = response.data.results;
            quickPick.items = packages.map((pkg: any) => ({
                label: pkg.name,
                description: pkg.description
            }));
        } catch (error) {
            vscode.window.showErrorMessage('Failed to fetch package suggestions.');
        }
    });

    quickPick.show();

    return new Promise<string | undefined>((resolve) => {
        quickPick.onDidAccept(() => {
            const selectedItem = quickPick.selectedItems[0];
            quickPick.hide();
            resolve(selectedItem?.label);
        });

        quickPick.onDidHide(() => {
            resolve(undefined);
        });
    });
}

export function deactivate() {}
