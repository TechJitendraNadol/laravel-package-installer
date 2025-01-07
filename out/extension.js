"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
const cp = __importStar(require("child_process"));
const suggestions_1 = __importDefault(require("./suggestions"));
function activate(context) {
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
async function showPackageSuggestions() {
    let predefinedSuggestions = suggestions_1.default;
    const quickPick = vscode.window.createQuickPick();
    quickPick.items = predefinedSuggestions;
    quickPick.placeholder = 'Select or search for a package to install';
    quickPick.onDidChangeValue(async (input) => {
        if (input.trim().length === 0) {
            quickPick.items = predefinedSuggestions;
            return;
        }
        try {
            const response = await axios_1.default.get(`https://packagist.org/search.json?q=${encodeURIComponent(input)}`);
            const packages = response.data.results;
            quickPick.items = packages.map((pkg) => ({
                label: pkg.name,
                description: pkg.description
            }));
        }
        catch (error) {
            vscode.window.showErrorMessage('Failed to fetch package suggestions.');
        }
    });
    quickPick.show();
    return new Promise((resolve) => {
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
function deactivate() { }
//# sourceMappingURL=extension.js.map